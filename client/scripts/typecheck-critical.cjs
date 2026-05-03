#!/usr/bin/env node
/**
 * Crash-class typecheck. Runs tsc on tsconfig.app.json but only fails CI on
 * error codes that translate to runtime crashes (missing identifier, missing
 * module). Other type errors are surfaced separately via `npm run typecheck`.
 *
 * Background: prior to this script, .github/workflows/ci.yml ran
 * `npx tsc --noEmit` which uses the root tsconfig.json — that file has
 * `"files": []` and only references, so it type-checks nothing. Multiple
 * "Cannot find name X" bugs (Train, Briefcase, Sparkles, TOTAL_MINUTES)
 * shipped to production undetected.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const CRASH_CODES = new Set([
  'TS2304', // Cannot find name 'X'
  'TS2307', // Cannot find module 'X'
]);

const tscBin = path.resolve(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [tscBin, '--noEmit', '-p', 'tsconfig.app.json', '--pretty', 'false'], {
  encoding: 'utf8',
});

const output = (result.stdout || '') + (result.stderr || '');
const lines = output.split(/\r?\n/);

const ALLOWED_PATHS = [
  // Service worker types live in a different lib than DOM. Tracked separately.
  'src/pwa/serviceWorker.ts',
  // Test setup uses globalThis-injected vitest helpers.
  'src/test/setup.ts',
  // @/types/knowledge is `import type` only — erased at build time.
  '@/types/knowledge',
];

const critical = lines.filter((line) => {
  const match = line.match(/error (TS\d+):/);
  if (!match || !CRASH_CODES.has(match[1])) return false;
  return !ALLOWED_PATHS.some((p) => line.includes(p));
});

if (critical.length > 0) {
  console.error('Critical TypeScript errors that cause runtime crashes:\n');
  critical.forEach((line) => console.error('  ' + line));
  console.error(`\n${critical.length} crash-class error(s) (TS2304 / TS2307).`);
  console.error('Run `npm run typecheck` for the full report.');
  process.exit(1);
}

console.log('OK: no crash-class TypeScript errors.');
