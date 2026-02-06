import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { CandidateSpec, ConstraintsSpec, RunManifest, ValidationReport, ValidationSummary } from './types.js';
import { ensureDir, writeJsonFile } from './utils.js';

export interface RunPaths {
  runDir: string;
  manifestPath: string;
  constraintsPath: string;
  eventsPath: string;
  candidatesDir: string;
  validationDir: string;
  exportsDir: string;
}

export function getRunPaths(workspaceDir: string, runId: string): RunPaths {
  const runDir = join(workspaceDir, 'runs', runId);
  return {
    runDir,
    manifestPath: join(runDir, 'run_manifest.json'),
    constraintsPath: join(runDir, 'constraints.json'),
    eventsPath: join(runDir, 'events.jsonl'),
    candidatesDir: join(runDir, 'candidates'),
    validationDir: join(runDir, 'validation'),
    exportsDir: join(runDir, 'exports'),
  };
}

export async function ensureRunDirectories(paths: RunPaths): Promise<void> {
  await ensureDir(paths.runDir);
  await ensureDir(paths.candidatesDir);
  await ensureDir(paths.validationDir);
  await ensureDir(paths.exportsDir);
}

export async function appendEvent(paths: RunPaths, event: Record<string, unknown>): Promise<void> {
  const entry = `${JSON.stringify(event)}\n`;
  await ensureDir(paths.runDir);
  await fs.appendFile(paths.eventsPath, entry, 'utf8');
}

export async function writeManifest(paths: RunPaths, manifest: RunManifest): Promise<void> {
  await writeJsonFile(paths.manifestPath, manifest, { pretty: true });
}

export async function writeConstraints(paths: RunPaths, constraints: ConstraintsSpec): Promise<void> {
  await writeJsonFile(paths.constraintsPath, constraints, { pretty: true });
}

export async function writeCandidates(paths: RunPaths, candidates: CandidateSpec[]): Promise<void> {
  await ensureDir(paths.candidatesDir);
  for (const candidate of candidates) {
    const filePath = join(paths.candidatesDir, `${candidate.candidate_id}.cif`);
    await fs.writeFile(filePath, candidate.content, 'utf8');
  }
}

export async function writeValidationReports(
  paths: RunPaths,
  reports: ValidationReport[],
  summary: ValidationSummary
): Promise<void> {
  await ensureDir(paths.validationDir);
  for (const report of reports) {
    const reportPath = join(paths.validationDir, `report_${report.candidate_id}.json`);
    await writeJsonFile(reportPath, report, { pretty: true });
  }
  const summaryPath = join(paths.validationDir, 'summary.json');
  await writeJsonFile(summaryPath, summary, { pretty: true });
}

export async function writeIterationArtifact(
  paths: RunPaths,
  iteration: number,
  data: Record<string, unknown>
): Promise<void> {
  const filePath = join(paths.runDir, `iteration_${iteration}.json`);
  await writeJsonFile(filePath, data, { pretty: true });
}

export async function writeExports(
  paths: RunPaths,
  exportsList: Array<{ candidate_id: string; content: string; extension: string }>
): Promise<void> {
  await ensureDir(paths.exportsDir);
  for (const entry of exportsList) {
    const filePath = join(paths.exportsDir, `${entry.candidate_id}.${entry.extension}`);
    await fs.writeFile(filePath, entry.content, 'utf8');
  }
}

export async function listCandidateIds(paths: RunPaths): Promise<string[]> {
  try {
    const entries = await fs.readdir(paths.candidatesDir);
    return entries
      .filter((name) => name.endsWith('.cif'))
      .map((name) => name.replace(/\.cif$/, ''))
      .sort();
  } catch {
    return [];
  }
}

export async function readCandidateContent(paths: RunPaths, candidateId: string): Promise<string> {
  const filePath = join(paths.candidatesDir, `${candidateId}.cif`);
  return fs.readFile(filePath, 'utf8');
}

export async function readValidationSummary(paths: RunPaths): Promise<ValidationSummary> {
  const summaryPath = join(paths.validationDir, 'summary.json');
  const content = await fs.readFile(summaryPath, 'utf8');
  return JSON.parse(content) as ValidationSummary;
}

export async function readConstraints(paths: RunPaths): Promise<ConstraintsSpec> {
  const content = await fs.readFile(paths.constraintsPath, 'utf8');
  return JSON.parse(content) as ConstraintsSpec;
}

export async function readManifest(paths: RunPaths): Promise<RunManifest> {
  const content = await fs.readFile(paths.manifestPath, 'utf8');
  return JSON.parse(content) as RunManifest;
}
