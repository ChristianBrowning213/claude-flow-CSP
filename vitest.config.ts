import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./v3/__tests__/setup.ts'],
    include: [
      'v3/__tests__/**/*.test.ts',
      'v3/__tests__/**/*.spec.ts',
      'v3/@claude-flow/**/__tests__/**/*.test.ts',
      'v3/@claude-flow/**/__tests__/**/*.spec.ts',
      'v3/mcp/__tests__/**/*.test.ts',
      'v3/mcp/__tests__/**/*.spec.ts',
    ],
    exclude: ['node_modules', 'dist', '.git'],
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@v3': path.resolve(__dirname, './v3'),
      '@claude-flow/shared': path.resolve(__dirname, './v3/@claude-flow/shared/src/index.ts'),
      '@claude-flow/cli': path.resolve(__dirname, './v3/@claude-flow/cli/src/index.ts'),
      '@claude-flow-csp/core': path.resolve(__dirname, './v3/@claude-flow-csp/core/src/index.ts'),
      '@claude-flow-csp/workflows': path.resolve(__dirname, './v3/@claude-flow-csp/workflows/src/index.ts'),
      '@claude-flow-csp/agents': path.resolve(__dirname, './v3/@claude-flow-csp/agents/src/index.ts'),
      '@claude-flow-csp/verify': path.resolve(__dirname, './v3/@claude-flow-csp/verify/src/index.ts'),
      '@claude-flow-csp/cli': path.resolve(__dirname, './v3/@claude-flow-csp/cli/src/index.ts'),
    },
  },
});
