
# Artifacts and run directory contract

All runs write to:
workspace_dir/runs/{run_id}/

Required files:
- run_manifest.json (inputs, config snapshot, timestamps, status)
- constraints.json (final constraints used for the run)
- events.jsonl (structured logs)
- candidates/ (structure files)
- validation/ (validation reports + summary)
- exports/ (user-facing exports)

Naming:
- candidates/cand_0001.cif, cand_0002.cif, ...
- validation/report_cand_0001.json
- validation/summary.json
