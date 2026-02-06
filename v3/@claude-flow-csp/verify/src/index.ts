import type { ValidationReport, ValidationSummary } from '@claude-flow-csp/core';

export interface VerifyPreset {
  id: string;
  name: string;
  description: string;
  checks: string[];
}

export const CSP_VERIFY_PRESETS: VerifyPreset[] = [
  {
    id: 'csp',
    name: 'CSP Verification',
    description: 'CSP-specific verification with truth scoring.',
    checks: [
      'parseable',
      'min_distance',
      'density_in_range',
      'charge_neutrality_feasible',
      'coordination_reasonable',
      'symmetry_match',
    ],
  },
];

export function summarizeValidation(
  reports: ValidationReport[],
  truthAcceptThreshold: number
): ValidationSummary {
  const truthScores: Record<string, number> = {};
  const failureHistogram: Record<string, number> = {
    parseable: 0,
    min_distance: 0,
    density_in_range: 0,
    charge_neutrality_feasible: 0,
    coordination_reasonable: 0,
    symmetry_match: 0,
  };

  let bestCandidateId = '';
  let bestScore = -1;

  for (const report of reports) {
    truthScores[report.candidate_id] = report.truth_score;
    if (report.truth_score > bestScore) {
      bestScore = report.truth_score;
      bestCandidateId = report.candidate_id;
    }

    for (const check of report.checks) {
      if (!check.passed) {
        failureHistogram[check.name] = (failureHistogram[check.name] || 0) + 1;
      }
    }
  }

  const accepted = reports.filter((r) => r.truth_score >= truthAcceptThreshold).length;

  return {
    total: reports.length,
    accepted,
    rejected: reports.length - accepted,
    best_candidate_id: bestCandidateId || reports[0]?.candidate_id || '',
    truth_scores: truthScores,
    failure_histogram: failureHistogram,
    top_candidates: Object.entries(truthScores)
      .sort((a, b) => b[1] - a[1])
      .map(([candidate_id, truth_score]) => ({ candidate_id, truth_score })),
  };
}
