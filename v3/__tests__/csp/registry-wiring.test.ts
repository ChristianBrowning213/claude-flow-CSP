import { describe, it, expect } from 'vitest';
import { registerCspBundles } from '@claude-flow-csp/cli';
import { listWorkflows, listAgents, listVerifyPresets } from '@claude-flow/shared';


describe('CSP registry wiring', () => {
  it('registers workflows, agents, and verify presets', () => {
    registerCspBundles();

    const workflowIds = listWorkflows().map((w) => w.id);
    const agentIds = listAgents().map((a) => a.id);
    const presetIds = listVerifyPresets().map((p) => p.id);

    expect(workflowIds).toContain('csp_discovery');
    expect(workflowIds).toContain('csp_iterate');

    expect(agentIds).toContain('chemistry_scout');
    expect(agentIds).toContain('constraint_engineer');
    expect(agentIds).toContain('qlip_runner');
    expect(agentIds).toContain('csp_verifier');
    expect(agentIds).toContain('iteration_controller');

    expect(presetIds).toContain('csp');
  });
});
