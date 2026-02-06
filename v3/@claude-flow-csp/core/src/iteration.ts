import type { ConstraintsSpec, IterationDecision, ValidationSummary } from './types.js';

export function decideIteration(
  summary: ValidationSummary,
  policy: { relax_order: string[]; tighten_order: string[] },
  iteration: number
): IterationDecision {
  const relaxFailures =
    (summary.failure_histogram.density_in_range || 0) +
    (summary.failure_histogram.charge_neutrality_feasible || 0) +
    (summary.failure_histogram.symmetry_match || 0);
  const tightenFailures =
    (summary.failure_histogram.min_distance || 0) +
    (summary.failure_histogram.coordination_reasonable || 0);

  const mode = relaxFailures >= tightenFailures ? 'relax' : 'tighten';
  const order = mode === 'relax' ? policy.relax_order : policy.tighten_order;
  const action = order.length > 0 ? order[iteration % order.length] : mode === 'relax' ? 'widen_lattice' : 'increase_min_distance_scale';

  return { mode, action };
}

export function applyIterationDecision(
  constraints: ConstraintsSpec,
  decision: IterationDecision,
  iteration: number
): ConstraintsSpec {
  const adjustments = constraints.adjustments ? [...constraints.adjustments] : [];
  adjustments.push({ iteration, mode: decision.mode, action: decision.action });

  const next: ConstraintsSpec = {
    ...constraints,
    adjustments,
  };

  switch (decision.action) {
    case 'widen_lattice':
      next.priors = {
        ...next.priors,
        density_range: [
          Math.max(0.1, next.priors.density_range[0] * 0.9),
          next.priors.density_range[1] * 1.1,
        ],
      };
      break;
    case 'narrow_density':
      next.priors = {
        ...next.priors,
        density_range: [
          next.priors.density_range[0] * 1.05,
          Math.max(next.priors.density_range[0] * 1.1, next.priors.density_range[1] * 0.95),
        ],
      };
      break;
    case 'increase_max_atoms':
      next.overrides = {
        ...next.overrides,
        max_atoms: typeof next.overrides?.max_atoms === 'number'
          ? (next.overrides.max_atoms as number) + 5
          : 150,
      };
      break;
    case 'increase_min_distance_scale':
      next.overrides = {
        ...next.overrides,
        min_distance_scale: typeof next.overrides?.min_distance_scale === 'number'
          ? (next.overrides.min_distance_scale as number) + 0.05
          : 1.05,
      };
      break;
    case 'expand_prototypes':
      next.priors = {
        ...next.priors,
        prototypes: [...next.priors.prototypes, 'proto_extra'],
      };
      break;
    case 'restrict_prototypes':
      next.priors = {
        ...next.priors,
        prototypes: next.priors.prototypes.slice(0, Math.max(1, next.priors.prototypes.length - 1)),
      };
      break;
    default:
      break;
  }

  return next;
}
