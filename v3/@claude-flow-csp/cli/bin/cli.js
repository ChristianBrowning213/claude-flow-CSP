#!/usr/bin/env node

import { runCspCli } from '../dist/src/index.js';

runCspCli().then(({ exitCode }) => {
  process.exit(exitCode ?? 0);
}).catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
