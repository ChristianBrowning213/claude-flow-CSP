import type { CliIO } from '@claude-flow-csp/cli';

export function createMemoryIO(): { io: CliIO; stdout: { toString: () => string }; stderr: { toString: () => string } } {
  let stdout = '';
  let stderr = '';

  const io: CliIO = {
    stdout: {
      write: (chunk: string) => {
        stdout += chunk;
      },
    },
    stderr: {
      write: (chunk: string) => {
        stderr += chunk;
      },
    },
  };

  return {
    io,
    stdout: { toString: () => stdout },
    stderr: { toString: () => stderr },
  };
}
