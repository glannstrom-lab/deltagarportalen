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
const { klassaTscUtdata } = require('./lib/tsc-utdata.cjs');

const CRASH_CODES = new Set([
  'TS2304', // Cannot find name 'X'
  'TS2307', // Cannot find module 'X'
]);

const tscBin = path.resolve(__dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc');
// Överstyrs bara av testet som bevisar att grinden fäller på en trasig
// tsconfig (src/test/skript-typecheck-falskt-gront.test.ts).
const PROJEKT = process.env.TYPECHECK_PROJEKT || 'tsconfig.app.json';
const result = spawnSync(process.execPath, [tscBin, '--noEmit', '-p', PROJEKT, '--pretty', 'false'], {
  encoding: 'utf8',
  // Relativt `-p` löstes tidigare mot anroparens cwd. Kört från repo-roten
  // hittades ingen tsconfig — och grinden svarade ändå OK.
  cwd: path.resolve(__dirname, '..'),
  maxBuffer: 64 * 1024 * 1024,
});

const output = (result.stdout || '') + (result.stderr || '');
const { filfel, globala } = klassaTscUtdata(output);

// Grinden får aldrig vara grön för att tsc inte körde (2026-09-22). Ett
// globalt fel (TS18003 "No inputs were found", TS5058 "path does not exist")
// betyder att ingen fil typkontrollerades, och en icke-noll exit utan ett enda
// filfel betyder att tsc själv föll. Båda gav tidigare "OK".
if (result.error || globala.length > 0 || (result.status !== 0 && filfel.length === 0)) {
  console.error('typecheck-critical: tsc typkontrollerade inte koden — grinden kan inte avgöra något.');
  if (result.error) console.error(`  ${result.error.message}`);
  globala.forEach((g) => console.error(`  ${g.rad.trim()}`));
  if (!result.error && globala.length === 0) {
    console.error(`  tsc avslutades med ${result.status} utan filfel:\n${output.slice(0, 800)}`);
  }
  process.exit(2);
}

const ALLOWED_PATHS = [
  // Service worker types live in a different lib than DOM. Tracked separately.
  'src/pwa/serviceWorker.ts',
  // Test setup uses globalThis-injected vitest helpers.
  'src/test/setup.ts',
  // (`@/types/knowledge` låg här till 2026-08-22 med motiveringen "import type
  // only — erased at build time". Det stämde, men modulen fanns inte alls, så
  // `Article` var `any` i de två filer som filtrerar och renderar artiklarna.
  // Filen finns nu; undantaget behövs inte.)
];

const critical = filfel
  .filter(({ kod, rad }) => CRASH_CODES.has(kod) && !ALLOWED_PATHS.some((p) => rad.includes(p)))
  .map(({ rad }) => rad);

if (critical.length > 0) {
  console.error('Critical TypeScript errors that cause runtime crashes:\n');
  critical.forEach((line) => console.error('  ' + line));
  console.error(`\n${critical.length} crash-class error(s) (TS2304 / TS2307).`);
  console.error('Run `npm run typecheck` for the full report.');
  process.exit(1);
}

console.log('OK: no crash-class TypeScript errors.');
