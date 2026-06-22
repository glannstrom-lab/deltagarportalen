#!/usr/bin/env node
/**
 * Design-skuld-vakt: räknar gradient-överträdelser mot DESIGN.md (inga
 * gradients i återkommande UI). Misslyckas om antalet träffar har ÖKAT
 * sedan baseline — godkänner alltså inte nya gradient-tillägg, men kräver
 * inte omedelbar städning av de 444 befintliga.
 *
 * Lägg till som `npm run lint:design` och kör i CI för regression-skydd.
 * Sänk BASELINE-värdet vart efter de gamla träffarna städas så vakten
 * pressar ned skulden över tid.
 *
 * Plattformsoberoende — använder Node fs istället för grep så CI på
 * Linux + utvecklare på Windows får samma resultat.
 */
const fs = require('fs');
const path = require('path');

// Baseline 2026-05-09: börjat på 444 träffar i src/. Dashboard har 16 widgets
// som alla bryter regeln (audit docs/teknisk-skuld-2026-05/ux-design.md).
// Sänk siffran vid varje städ-batch. När 0 är nått: byt regel till hård
// (return 1 vid >0).
// Ändringslogg:
//   2026-05-09 (initial): 444
//   2026-05-09 (P2-S, dödkod EmptyState borttagen): 443
//   2026-05-14 (designskuld-loop, -241): 68
//   2026-06-22 (lås fast vinsten efter granskning): 65
const BASELINE_TOTAL = 65;

const CHECK_DIR = path.join(__dirname, '..', 'src');
const PATTERN = /bg-gradient-(to-[trbl]+|radial)/g;
const FILE_EXTS = new Set(['.ts', '.tsx']);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && FILE_EXTS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

function countMatches() {
  let total = 0;
  for (const file of walk(CHECK_DIR)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const matches = line.match(PATTERN);
      if (matches) total += matches.length;
    }
  }
  return total;
}

const current = countMatches();
const delta = current - BASELINE_TOTAL;

console.log(`Gradient-överträdelser i src/: ${current} (baseline ${BASELINE_TOTAL})`);

if (delta > 0) {
  console.error(`\nFAIL: ${delta} nya gradient-träffar utöver baseline.`);
  console.error('DESIGN.md förbjuder gradients i återkommande UI. Om en ny');
  console.error('komponent verkligen behöver gradient: motivera och uppdatera');
  console.error('BASELINE_TOTAL i scripts/check-design-debt.cjs.');
  process.exit(1);
}

if (delta < 0) {
  console.log(`\nGood news: ${Math.abs(delta)} träffar bortstädade sedan baseline.`);
  console.log(`Sänk BASELINE_TOTAL till ${current} för att låsa fast vinsten.`);
}

console.log('OK — inga nya gradient-överträdelser.');
process.exit(0);
