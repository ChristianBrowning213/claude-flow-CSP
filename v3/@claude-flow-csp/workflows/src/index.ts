import {
  appendEvent,
  ensureRunDirectories,
  getRunPaths,
  listCandidateIds,
  readCandidateContent,
  readConstraints,
  readManifest,
  readValidationSummary,
  writeCandidates,
  writeConstraints,
  writeExports,
  writeIterationArtifact,
  writeManifest,
  writeValidationReports,
} from '@claude-flow-csp/core';
import {
  type CandidateSpec,
  type ConstraintsSpec,
  type CspConfig,
  type CspRunResult,
  type ExportResult,
  type RunManifest,
  type ValidationReport,
  type ValidationSummary,
} from '@claude-flow-csp/core';
import { SeededRng, seedFromString } from '@claude-flow-csp/core';
import { decideIteration, applyIterationDecision } from '@claude-flow-csp/core';
import { stableStringify, sha256Hex } from '@claude-flow-csp/core';
import type { ToolClient } from '@claude-flow-csp/core';
import { summarizeValidation } from '@claude-flow-csp/verify';

export interface DiscoverInput {
  objective: string;
  chem_system?: string;
  workspace_dir: string;
  seed: number;
  config: CspConfig;
  toolClient: ToolClient;
}

export interface IterateInput {
  run_id: string;
  workspace_dir: string;
  seed: number;
  config: CspConfig;
  toolClient: ToolClient;
}

export interface ValidateInput {
  run_id: string;
  workspace_dir: string;
  seed: number;
  config: CspConfig;
  toolClient: ToolClient;
}

export interface ExportInput {
  run_id: string;
  workspace_dir: string;
  format: 'cif' | 'poscar';
  top_k: number;
}

export const CSP_WORKFLOWS = [
  { id: 'csp_discovery', name: 'CSP Discovery', description: 'End-to-end CSP discovery workflow' },
  { id: 'csp_iterate', name: 'CSP Iterate', description: 'Iterate CSP constraints deterministically' },
  { id: 'csp_validate', name: 'CSP Validate', description: 'Validate CSP candidates' },
  { id: 'csp_export', name: 'CSP Export', description: 'Export CSP candidates' },
];

function createRunId(seed: number, objective: string): string {
  const rng = new SeededRng(seed ^ seedFromString(objective));
  return `run_${seed}_${rng.nextHex(8)}`;
}

function computeSummaryHash(summary: ValidationSummary): string {
  return sha256Hex(stableStringify(summary));
}

function selectChemistry(
  suggestions: Array<{ chem_system: string }> | undefined,
  seed: number
): string {
  if (!suggestions || suggestions.length === 0) {
    return 'unknown';
  }
  const rng = new SeededRng(seed ^ 0x3f1c2b);
  const index = rng.nextInt(0, suggestions.length - 1);
  return suggestions[index].chem_system;
}

async function ensureManifest(
  paths: ReturnType<typeof getRunPaths>,
  manifest: RunManifest
): Promise<void> {
  await writeManifest(paths, manifest);
  await appendEvent(paths, { event: 'run_manifest', run_id: manifest.run_id, status: manifest.status });
}

export async function runCspDiscover(input: DiscoverInput): Promise<CspRunResult> {
  const runId = createRunId(input.seed, input.objective);
  const paths = getRunPaths(input.workspace_dir, runId);
  await ensureRunDirectories(paths);

  const now = new Date().toISOString();
  const manifest: RunManifest = {
    run_id: runId,
    status: 'running',
    objective: input.objective,
    chem_system: input.chem_system || 'pending',
    seed: input.seed,
    created_at: now,
    updated_at: now,
    iteration: 0,
    max_iters: input.config.policy.max_iters,
    config_snapshot: input.config,
  };

  await ensureManifest(paths, manifest);
  await appendEvent(paths, { event: 'run_started', run_id: runId, objective: input.objective });

  const suggestionsResult = input.chem_system
    ? { chemistries: [{ chem_system: input.chem_system, rationale: 'provided', confidence: 1.0 }] }
    : await input.toolClient.call<{ chemistries: Array<{ chem_system: string; rationale: string; confidence: number }> }>(
        'materials-data-mcp.suggest_chemistries',
        { objective: input.objective, seed: input.seed }
      );

  const selectedChemistry = input.chem_system || selectChemistry(suggestionsResult.chemistries, input.seed);
  const priorsResult = await input.toolClient.call<{ priors: ConstraintsSpec['priors'] }>(
    'materials-data-mcp.fetch_priors',
    { chem_system: selectedChemistry, seed: input.seed }
  );

  const constraintsResult = await input.toolClient.call<{ constraints: ConstraintsSpec }>(
    'qlip-mcp.build_constraints',
    {
      chem_system: selectedChemistry,
      priors: priorsResult.priors,
      overrides: {
        solver: input.config.qlip.solver,
        max_atoms: input.config.qlip.max_atoms,
      },
    }
  );

  await writeConstraints(paths, constraintsResult.constraints);

  const qlipResult = await input.toolClient.call<{ candidates: CandidateSpec[] }>('qlip-mcp.run_qlip', {
    constraints: constraintsResult.constraints,
    seed: input.seed,
    run_id: runId,
  });

  await writeCandidates(paths, qlipResult.candidates);

  const validationResult = await input.toolClient.call<{ reports: ValidationReport[]; summary?: ValidationSummary }>(
    'csp-validators-mcp.batch_validate',
    {
      candidates: qlipResult.candidates,
      constraints: constraintsResult.constraints,
      seed: input.seed,
      truth_threshold: input.config.policy.truth_accept_threshold,
    }
  );

  const summary = validationResult.summary
    ? validationResult.summary
    : summarizeValidation(validationResult.reports, input.config.policy.truth_accept_threshold);

  await writeValidationReports(paths, validationResult.reports, summary);

  const summaryHash = computeSummaryHash(summary);
  const chosenCandidateId = summary.best_candidate_id;
  const truthScore = summary.truth_scores[chosenCandidateId] ?? 0;

  const updatedManifest: RunManifest = {
    ...manifest,
    status: 'ok',
    chem_system: selectedChemistry,
    updated_at: new Date().toISOString(),
    selected_candidate_id: chosenCandidateId,
    truth_score: truthScore,
  };

  await ensureManifest(paths, updatedManifest);

  return {
    run_id: runId,
    status: 'ok',
    workspace_dir: input.workspace_dir,
    run_dir: paths.runDir,
    selected_chemistry: selectedChemistry,
    chosen_candidate_id: chosenCandidateId,
    truth_score: truthScore,
    candidate_ids: qlipResult.candidates.map((c) => c.candidate_id),
    summary_hash: summaryHash,
    iteration: 0,
  };
}

export async function runCspIterate(input: IterateInput): Promise<CspRunResult> {
  const paths = getRunPaths(input.workspace_dir, input.run_id);
  const manifest = await readManifest(paths);
  const previousSummary = await readValidationSummary(paths);
  const previousConstraints = await readConstraints(paths);

  const nextIteration = manifest.iteration + 1;
  if (nextIteration > input.config.policy.max_iters) {
    throw new Error(`Max iterations reached (${manifest.iteration}/${input.config.policy.max_iters})`);
  }

  const decision = decideIteration(previousSummary, input.config.policy, nextIteration);
  const nextConstraints = applyIterationDecision(previousConstraints, decision, nextIteration);

  await writeConstraints(paths, nextConstraints);

  const qlipResult = await input.toolClient.call<{ candidates: CandidateSpec[] }>('qlip-mcp.run_qlip', {
    constraints: nextConstraints,
    seed: input.seed,
    run_id: input.run_id,
    iteration: nextIteration,
  });

  await writeCandidates(paths, qlipResult.candidates);

  const validationResult = await input.toolClient.call<{ reports: ValidationReport[]; summary?: ValidationSummary }>(
    'csp-validators-mcp.batch_validate',
    {
      candidates: qlipResult.candidates,
      constraints: nextConstraints,
      seed: input.seed,
      truth_threshold: input.config.policy.truth_accept_threshold,
    }
  );

  const summary = validationResult.summary
    ? validationResult.summary
    : summarizeValidation(validationResult.reports, input.config.policy.truth_accept_threshold);

  await writeValidationReports(paths, validationResult.reports, summary);

  const summaryHash = computeSummaryHash(summary);
  const chosenCandidateId = summary.best_candidate_id;
  const truthScore = summary.truth_scores[chosenCandidateId] ?? 0;

  await writeIterationArtifact(paths, nextIteration, {
    iteration: nextIteration,
    decision,
    summary_hash: summaryHash,
    chosen_candidate_id: chosenCandidateId,
    truth_score: truthScore,
  });

  const updatedManifest: RunManifest = {
    ...manifest,
    iteration: nextIteration,
    updated_at: new Date().toISOString(),
    selected_candidate_id: chosenCandidateId,
    truth_score: truthScore,
    status: 'ok',
  };

  await ensureManifest(paths, updatedManifest);

  return {
    run_id: input.run_id,
    status: 'ok',
    workspace_dir: input.workspace_dir,
    run_dir: paths.runDir,
    selected_chemistry: manifest.chem_system,
    chosen_candidate_id: chosenCandidateId,
    truth_score: truthScore,
    candidate_ids: qlipResult.candidates.map((c) => c.candidate_id),
    summary_hash: summaryHash,
    iteration: nextIteration,
  };
}

export async function runCspValidate(input: ValidateInput): Promise<{ summary: ValidationSummary; summary_hash: string }> {
  const paths = getRunPaths(input.workspace_dir, input.run_id);
  const constraints = await readConstraints(paths);
  const candidateIds = await listCandidateIds(paths);
  const candidates: CandidateSpec[] = [];

  for (const candidateId of candidateIds) {
    const content = await readCandidateContent(paths, candidateId);
    candidates.push({ candidate_id: candidateId, score: 0, format: 'cif', content });
  }

  const validationResult = await input.toolClient.call<{ reports: ValidationReport[]; summary?: ValidationSummary }>(
    'csp-validators-mcp.batch_validate',
    {
      candidates,
      constraints,
      seed: input.seed,
      truth_threshold: input.config.policy.truth_accept_threshold,
    }
  );

  const summary = validationResult.summary
    ? validationResult.summary
    : summarizeValidation(validationResult.reports, input.config.policy.truth_accept_threshold);

  await writeValidationReports(paths, validationResult.reports, summary);

  const summaryHash = computeSummaryHash(summary);

  return { summary, summary_hash: summaryHash };
}

export async function runCspExport(input: ExportInput): Promise<ExportResult[]> {
  const paths = getRunPaths(input.workspace_dir, input.run_id);
  let candidateOrder: string[] = [];
  try {
    const summary = await readValidationSummary(paths);
    candidateOrder = summary.top_candidates.map((c) => c.candidate_id);
  } catch {
    candidateOrder = await listCandidateIds(paths);
  }

  const selected = candidateOrder.slice(0, Math.max(1, input.top_k));
  const exportsList: Array<{ candidate_id: string; content: string; extension: string }> = [];
  const results: ExportResult[] = [];

  for (const candidateId of selected) {
    const content = await readCandidateContent(paths, candidateId);
    const extension = input.format === 'poscar' ? 'poscar' : 'cif';
    const exportedContent = input.format === 'poscar'
      ? `# POSCAR placeholder for ${candidateId}\n${content}`
      : content;
    exportsList.push({ candidate_id: candidateId, content: exportedContent, extension });
    results.push({ candidate_id: candidateId, path: `${paths.exportsDir}/${candidateId}.${extension}` });
  }

  await writeExports(paths, exportsList);

  return results;
}
