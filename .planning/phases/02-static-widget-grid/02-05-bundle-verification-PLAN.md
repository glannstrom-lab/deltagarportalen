---
phase: 02-static-widget-grid
plan: "05"
type: execute
wave: 4
depends_on: ["01", "02", "03", "04"]
files_modified:
  - client/scripts/verify-widget-chunks.cjs
  - client/package.json
  - client/src/components/widgets/__tests__/lazy-isolation.test.tsx
autonomous: true
requirements:
  - WIDG-01
  - WIDG-03
must_haves:
  truths:
    - "Production build (vite build) succeeds with no widget code in the main entry chunk"
    - "Each Phase-2 widget produces its own JS chunk (lazy() proven by file system + grep)"
    - "verify-widget-chunks.cjs script exits 0 when widget chunks exist; exits 1 if any widget bleeds into main chunk"
    - "Lazy-isolation test proves the registry's import paths are not statically pulled by widget-foundation files"
    - "npm run verify:widget-chunks is wired into package.json so the gate is reproducible by anyone"
  artifacts:
    - path: "client/scripts/verify-widget-chunks.cjs"
      provides: "Standalone Node script that runs vite build and inspects dist for widget chunks"
      contains: "process.exit"
    - path: "client/package.json"
      provides: "verify:widget-chunks script wired"
      contains: "verify:widget-chunks"
    - path: "client/src/components/widgets/__tests__/lazy-isolation.test.tsx"
      provides: "Static-analysis test asserting registry uses lazy() exclusively"
      contains: "describe"
  key_links:
    - from: "verify-widget-chunks.cjs"
      to: "client/dist/assets/*.js"
      via: "fs.readdirSync after vite build"
      pattern: "readdirSync"
    - from: "package.json scripts"
      to: "verify-widget-chunks.cjs"
      via: "npm run verify:widget-chunks → node scripts/verify-widget-chunks.cjs"
      pattern: "verify:widget-chunks"
---

<objective>
Prove WIDG-01 success criterion 4 — "No widget component appears in the main JS bundle". Build a Node script that runs vite build, inspects the resulting chunks, and asserts that:
1. Each Phase-2 widget has its own chunk (lazy() works)
2. The main entry chunk does NOT contain any widget component code

Add a static-analysis test for the registry to catch regressions where someone replaces `lazy()` with a static import. Wire both into package.json.

Purpose: Regression-proof code-splitting. Without this gate, future changes to registry.ts could silently bundle widgets into main, defeating Phase 2's bundle goals.
Output: 1 verification script + 1 lazy-isolation test + package.json wiring.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/02-static-widget-grid/02-UI-SPEC.md
@.planning/research/PITFALLS.md
@.planning/phases/02-static-widget-grid/02-01-widget-foundation-SUMMARY.md
@.planning/phases/02-static-widget-grid/02-04-hub-wiring-SUMMARY.md
@client/package.json
@client/src/components/widgets/registry.ts

<interfaces>
<!-- Existing build setup -->

From client/package.json:
```json
{
  "scripts": {
    "build": "vite build",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

Vite default output (verified after Phase 1 build):
- `client/dist/assets/index-{hash}.js` — main entry chunk
- `client/dist/assets/{ChunkName}-{hash}.js` — per lazy() chunk
- Lazy chunk filenames are derived from the dynamic `import('./CvWidget')` argument (defaults to "CvWidget-{hash}.js" or similar; verify by inspecting dist after first build)

From client/src/components/widgets/registry.ts:
- 8 lazy imports: cv, cover-letter, interview, job-search, applications, spontaneous, salary, international
- Each maps to: lazy(() => import('./XxxWidget'))

Phase 2 widgets implemented:
- CvWidget, CoverLetterWidget, InterviewWidget, JobSearchWidget (cluster A)
- ApplicationsWidget, SpontaneousWidget, SalaryWidget, InternationalWidget (cluster B)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build verify-widget-chunks.cjs script + wire into package.json</name>
  <files>client/scripts/verify-widget-chunks.cjs, client/package.json</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (section "Bundle / Code-Split Contract")
    - .planning/research/PITFALLS.md (Pitfall 14 — bundle bloat)
    - client/package.json (current scripts block)
    - client/vite.config.ts (read briefly to understand any custom output dir/name patterns)
  </read_first>
  <action>
**File 1: `client/scripts/verify-widget-chunks.cjs`** (~120 lines)

Node CommonJS script (`.cjs` so it works regardless of "type":"module" in package.json). Steps:

1. Run `vite build` (or skip if dist already exists and `--skip-build` flag passed)
2. List files in `client/dist/assets/`
3. Define expected widget names: `['CvWidget', 'CoverLetterWidget', 'InterviewWidget', 'JobSearchWidget', 'ApplicationsWidget', 'SpontaneousWidget', 'SalaryWidget', 'InternationalWidget']`
4. For each widget name, assert at least one chunk file matches a regex like `/{name}.*\.js$/` OR contains the widget name in the chunk name
5. Read the entry chunk (`index-*.js`) and assert NONE of these widget identifiers appear as exports inside it: `CvWidget`, `CoverLetterWidget`, etc. Use a heuristic: search for `function CvWidget(` or `const CvWidget=` patterns. Acceptable false-positive: the widget name may appear as a string literal (chunk preload manifest) — that's fine; we look for the function/component definition pattern.
6. Print summary table; exit 0 on success, 1 on failure.

```javascript
#!/usr/bin/env node
/* eslint-disable */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const CLIENT_DIR = path.resolve(__dirname, '..')
const DIST_DIR = path.join(CLIENT_DIR, 'dist', 'assets')

const WIDGETS = [
  'CvWidget',
  'CoverLetterWidget',
  'InterviewWidget',
  'JobSearchWidget',
  'ApplicationsWidget',
  'SpontaneousWidget',
  'SalaryWidget',
  'InternationalWidget',
]

const skipBuild = process.argv.includes('--skip-build')

function buildIfNeeded() {
  if (skipBuild && fs.existsSync(DIST_DIR)) {
    console.log('Skipping vite build (--skip-build); using existing dist/')
    return
  }
  console.log('Running vite build…')
  execSync('npm run build', { cwd: CLIENT_DIR, stdio: 'inherit' })
}

function readChunks() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`dist/assets not found at ${DIST_DIR}`)
    process.exit(1)
  }
  return fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.js'))
}

function main() {
  buildIfNeeded()
  const chunks = readChunks()
  console.log(`Found ${chunks.length} JS chunks in dist/assets/`)

  const failures = []

  // Step 1: Each widget must have at least one chunk file containing its name
  for (const widget of WIDGETS) {
    const matching = chunks.filter(c => c.includes(widget))
    if (matching.length === 0) {
      failures.push(`No chunk file found for widget '${widget}' (expected something matching ${widget}*.js)`)
    } else {
      console.log(`  ✓ ${widget}: ${matching[0]}`)
    }
  }

  // Step 2: Main entry chunk must NOT contain widget component definitions
  const entryChunks = chunks.filter(c => c.startsWith('index-') || c.startsWith('main-'))
  if (entryChunks.length === 0) {
    failures.push('No entry chunk found (expected index-*.js or main-*.js)')
  } else {
    for (const entryName of entryChunks) {
      const entryPath = path.join(DIST_DIR, entryName)
      const content = fs.readFileSync(entryPath, 'utf8')
      for (const widget of WIDGETS) {
        // Heuristic: look for the widget identifier as a function/declaration target
        // Vite minifies these to short names BUT lazy()-loaded modules are extracted
        // entirely. If the widget appears as a function definition or component, lazy() failed.
        // We check for patterns that survive minification poorly:
        //   `${widget}` followed by `(` or `=` indicates a definition/assignment
        // Note: A bare widget *string* in a manifest is OK — that's just a chunk name reference.
        const codePattern = new RegExp(`\\bfunction\\s+${widget}\\b|\\b${widget}\\s*=\\s*function\\b|\\b${widget}\\s*=\\s*\\(`)
        if (codePattern.test(content)) {
          failures.push(`Widget '${widget}' code definition appears in entry chunk ${entryName} — lazy() bypass detected`)
        }
      }
    }
  }

  console.log('')
  if (failures.length > 0) {
    console.error(`✗ Bundle verification FAILED (${failures.length} issue(s)):`)
    failures.forEach(f => console.error(`  - ${f}`))
    process.exit(1)
  }
  console.log(`✓ Bundle verification PASSED — all ${WIDGETS.length} widgets are properly code-split`)
  process.exit(0)
}

main()
```

**File 2: `client/package.json` modification**

Read the existing package.json. Find the "scripts" block. Add this entry (preserve all other scripts):

```json
"verify:widget-chunks": "node scripts/verify-widget-chunks.cjs"
```

(Insert alphabetically among scripts, OR after "test:run" — either is fine. Do NOT remove or reorder any other script.)

Also create the `client/scripts/` directory if it doesn't exist (use Bash mkdir if needed).
  </action>
  <verify>
    <automated>cd client && npm run verify:widget-chunks</automated>
  </verify>
  <acceptance_criteria>
    - File `client/scripts/verify-widget-chunks.cjs` exists
    - `grep -c "process.exit" client/scripts/verify-widget-chunks.cjs` returns at least 2
    - `grep -c "WIDGETS" client/scripts/verify-widget-chunks.cjs` returns at least 1
    - `grep -c "CvWidget" client/scripts/verify-widget-chunks.cjs` returns at least 1
    - `grep -c "InternationalWidget" client/scripts/verify-widget-chunks.cjs` returns at least 1
    - `grep -c "verify:widget-chunks" client/package.json` returns 1
    - `cd client && npm run verify:widget-chunks` exits 0
    - Console output contains "Bundle verification PASSED" with all 8 widget names listed
  </acceptance_criteria>
  <done>verify-widget-chunks.cjs builds the project, finds 8 widget chunks, asserts none of them appear as code definitions in the entry chunk, and exits 0; npm script is wired so anyone can re-run.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Static-analysis test asserting registry uses lazy() exclusively</name>
  <files>client/src/components/widgets/__tests__/lazy-isolation.test.tsx</files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (section "Bundle / Code-Split Contract")
    - client/src/components/widgets/registry.ts (the file under test)
  </read_first>
  <behavior>
    - Test reads registry.ts source as text and asserts every widget appears inside a `lazy(() => import(...))` call
    - Test asserts there are NO static `import XxxWidget from './XxxWidget'` lines in registry.ts
    - Test asserts every entry in WIDGET_REGISTRY map has a `component` field that is a LazyExoticComponent
  </behavior>
  <action>
Create `client/src/components/widgets/__tests__/lazy-isolation.test.tsx` (~80 lines).

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { WIDGET_REGISTRY } from '../registry'

const REGISTRY_PATH = resolve(__dirname, '../registry.ts')
const REGISTRY_SRC = readFileSync(REGISTRY_PATH, 'utf8')

const EXPECTED_WIDGETS = [
  'CvWidget',
  'CoverLetterWidget',
  'InterviewWidget',
  'JobSearchWidget',
  'ApplicationsWidget',
  'SpontaneousWidget',
  'SalaryWidget',
  'InternationalWidget',
]

describe('Widget registry — lazy isolation (Bundle / Code-Split Contract)', () => {
  it('contains 8 entries (one per Söka jobb widget)', () => {
    expect(Object.keys(WIDGET_REGISTRY).length).toBe(8)
  })

  it('every entry has a component field', () => {
    for (const [id, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(entry.component, `${id}.component`).toBeDefined()
    }
  })

  it('every entry has a defaultSize that is one of S/M/L/XL', () => {
    for (const [id, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(['S', 'M', 'L', 'XL'], `${id}.defaultSize`).toContain(entry.defaultSize)
    }
  })

  it('every entry has allowedSizes as a non-empty subset of S/M/L/XL', () => {
    for (const [id, entry] of Object.entries(WIDGET_REGISTRY)) {
      expect(entry.allowedSizes.length, `${id}.allowedSizes`).toBeGreaterThan(0)
      for (const s of entry.allowedSizes) {
        expect(['S', 'M', 'L', 'XL'], `${id}.allowedSizes`).toContain(s)
      }
    }
  })

  it('registry source has NO static widget imports (only lazy)', () => {
    for (const widget of EXPECTED_WIDGETS) {
      // A static import would look like: `import XxxWidget from './XxxWidget'`
      const staticImportPattern = new RegExp(`^\\s*import\\s+${widget}\\s+from\\s+['"]\\./${widget}['"]`, 'm')
      expect(staticImportPattern.test(REGISTRY_SRC), `Static import for ${widget} found in registry.ts — must use lazy() instead`).toBe(false)
    }
  })

  it('registry source has exactly one lazy() call per widget (8 total)', () => {
    const lazyCount = (REGISTRY_SRC.match(/lazy\(/g) ?? []).length
    expect(lazyCount).toBe(8)
  })

  it('every expected widget name appears inside a lazy import path', () => {
    for (const widget of EXPECTED_WIDGETS) {
      const lazyPattern = new RegExp(`lazy\\(\\(\\)\\s*=>\\s*import\\(['"]\\./${widget}['"]\\)\\)`)
      expect(lazyPattern.test(REGISTRY_SRC), `lazy(() => import('./${widget}')) not found in registry.ts`).toBe(true)
    }
  })
})
```
  </action>
  <verify>
    <automated>cd client && npm run test:run -- lazy-isolation</automated>
  </verify>
  <acceptance_criteria>
    - File `client/src/components/widgets/__tests__/lazy-isolation.test.tsx` exists
    - `grep -c "describe" client/src/components/widgets/__tests__/lazy-isolation.test.tsx` returns at least 1
    - `grep -c "EXPECTED_WIDGETS" client/src/components/widgets/__tests__/lazy-isolation.test.tsx` returns at least 1
    - `grep -c "lazy\\\\(" client/src/components/widgets/__tests__/lazy-isolation.test.tsx` returns at least 1
    - `cd client && npm run test:run -- lazy-isolation` exits 0 with all 7 tests passing
  </acceptance_criteria>
  <done>lazy-isolation test asserts registry has 8 entries, no static widget imports, exactly 8 lazy() calls, every expected widget present as a lazy import path; runs in standard vitest suite (no special build needed).</done>
</task>

<task type="auto">
  <name>Task 3: Run full Phase 2 verification suite — build, test, bundle check</name>
  <files></files>
  <read_first>
    - .planning/phases/02-static-widget-grid/02-UI-SPEC.md (full Phase 2 success criteria)
    - .planning/ROADMAP.md (Phase 2 success criteria)
  </read_first>
  <action>
This is a verification-only task — no new files. Execute these commands sequentially and capture the output. Document the results in the SUMMARY.

1. **TypeScript clean:** `cd client && npx tsc --noEmit`
2. **All unit/integration tests pass:** `cd client && npm run test:run`
3. **Production build succeeds:** `cd client && npm run build`
4. **Bundle verification gate:** `cd client && npm run verify:widget-chunks` (will rebuild then verify; alternatively `npm run verify:widget-chunks -- --skip-build` if dist already current)

If any step fails, STOP and report which step + error to the user before continuing. Do not silently fix unrelated issues; check whether the failure stems from Phase 2 code or pre-existing repo state.

Capture for the SUMMARY:
- Number of test files run
- Number of total tests passed
- Build size of main entry chunk (from `vite build` output)
- Number of widget chunks produced
- Output of `verify:widget-chunks` confirming PASSED
  </action>
  <verify>
    <automated>cd client && npx tsc --noEmit && npm run test:run && npm run build && npm run verify:widget-chunks</automated>
  </verify>
  <acceptance_criteria>
    - `cd client && npx tsc --noEmit` exits 0
    - `cd client && npm run test:run` exits 0 with 0 failed tests
    - `cd client && npm run build` exits 0 (production build succeeds)
    - `cd client && npm run verify:widget-chunks` exits 0 with "Bundle verification PASSED" output
    - dist/assets/ contains a JS chunk for each of the 8 widget files (verify with `ls client/dist/assets/ | grep -E "(Cv|CoverLetter|Interview|JobSearch|Applications|Spontaneous|Salary|International)Widget" | wc -l` returns at least 8)
  </acceptance_criteria>
  <done>All four gates pass: TypeScript clean, full test suite passes, production build succeeds, bundle verification confirms 8 lazy widget chunks exist with no widget code in main entry.</done>
</task>

</tasks>

<verification>
- All 4 Phase 2 success criteria from ROADMAP.md provably met:
  1. Sectioned widget grid: covered by JobsokHub.test (plan 04) — 3 sections, 8 widgets
  2. S/M/L toggle: covered by Widget.test (plan 01) + JobsokHub.test (plan 04)
  3. Per-widget error fallback: covered by WidgetErrorBoundary.test (plan 01) + JobsokHub error-isolation test (plan 04)
  4. No widget in main bundle: covered by lazy-isolation.test (this plan, Task 2) + verify-widget-chunks.cjs (this plan, Task 1)
- WIDG-01, WIDG-02, WIDG-03 all have at least one passing test backing them
</verification>

<success_criteria>
1. verify-widget-chunks.cjs script exists and runs in CI-style mode
2. lazy-isolation.test prevents future regressions
3. All 4 Phase 2 ROADMAP success criteria verified
4. Bundle verification gate is reproducible by anyone via single `npm run` command
</success_criteria>

<output>
After completion, create `.planning/phases/02-static-widget-grid/02-05-bundle-verification-SUMMARY.md` documenting:
- Files created (script + test + package.json wiring)
- Final bundle stats: main entry size, number of widget chunks, total dist size
- Confirmation of all 4 Phase 2 ROADMAP success criteria with test names that prove each
- Output of `npm run verify:widget-chunks` (last 20 lines)
- Test pass count from `npm run test:run`
- Notes for Phase 3: Real data wiring will REPLACE mock data inside widget files. Registry, HubGrid, Widget compound, and the lazy-isolation gate stay unchanged.
</output>
