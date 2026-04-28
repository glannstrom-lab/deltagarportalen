#!/usr/bin/env node
/* eslint-disable */
'use strict'

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
  console.log('Running vite build...')
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
  console.log(`\nFound ${chunks.length} JS chunks in dist/assets/`)
  console.log('')

  const failures = []

  // Step 1: Each widget must have at least one chunk file containing its name.
  // Vite derives chunk names from the dynamic import() path, producing e.g. CvWidget-{hash}.js.
  console.log('Checking widget chunks:')
  for (const widget of WIDGETS) {
    const matching = chunks.filter(c => c.includes(widget))
    if (matching.length === 0) {
      failures.push(`No chunk file found for widget '${widget}' (expected a file matching *${widget}*.js in dist/assets/)`)
      console.log(`  x ${widget}: NOT FOUND`)
    } else {
      console.log(`  v ${widget}: ${matching[0]}`)
    }
  }

  // Step 2: Main entry chunk must NOT contain widget component definitions.
  // We look for the entry chunk (named index-{hash}.js or main-{hash}.js by Vite's entryFileNames config).
  // Since terser minifies function names, we use the presence of the widget chunk file as the primary
  // proof of code-splitting. As a secondary heuristic, we check for unminified widget identifiers
  // in any source map or non-minified build artifacts that might remain.
  //
  // The definitive proof of correct code-splitting is that each widget has its OWN chunk file (Step 1).
  // If lazy() failed and the widget was statically imported, Vite would NOT produce a separate chunk —
  // the code would be inlined into the entry chunk and NO separate widget chunk would exist.
  // Therefore: chunk-file existence IS the correct gate. No separate definition-pattern scan needed.

  const entryChunks = chunks.filter(c => c.startsWith('index-') || c.startsWith('main-'))
  if (entryChunks.length === 0) {
    failures.push('No entry chunk found (expected index-*.js or main-*.js in dist/assets/)')
  } else {
    console.log(`\nEntry chunk(s) found: ${entryChunks.join(', ')}`)

    // Additional heuristic check: read entry chunk and scan for widget names as raw strings
    // (e.g., if someone did import { CvWidget } from './CvWidget' — the identifier may survive
    // minification as a property key or export name in some bundler modes).
    // This is a best-effort scan; the chunk-file existence check above is definitive.
    for (const entryName of entryChunks) {
      const entryPath = path.join(DIST_DIR, entryName)
      const content = fs.readFileSync(entryPath, 'utf8')

      // Check that the widget chunk file names are NOT embedded as large code blocks.
      // We look for the widget name followed by patterns indicating a React component definition
      // that survived minification — e.g., export identifiers or createLazyComponent references.
      // Note: widget names may appear as string literals in the preload manifest (that's fine).
      for (const widget of WIDGETS) {
        // Pattern: function declaration or assignment that indicates the component code is inlined,
        // not just referenced by chunk name.
        // `function CvWidget(` or `const CvWidget=` or `let CvWidget=` — these survive some builds
        const codePattern = new RegExp(`\\bfunction\\s+${widget}\\b|\\bconst\\s+${widget}\\s*=|\\blet\\s+${widget}\\s*=`)
        if (codePattern.test(content)) {
          failures.push(
            `Widget '${widget}' code definition found in entry chunk '${entryName}' — ` +
            `lazy() code-split may have failed. Check that registry.ts uses lazy() exclusively.`
          )
        }
      }
    }
  }

  console.log('')
  if (failures.length > 0) {
    console.error(`x Bundle verification FAILED (${failures.length} issue(s)):`)
    failures.forEach(f => console.error(`  - ${f}`))
    process.exit(1)
  }

  console.log(`v Bundle verification PASSED — all ${WIDGETS.length} widgets are properly code-split`)
  console.log(`  Each widget has its own async chunk in dist/assets/`)
  console.log(`  No widget code definitions detected in main entry chunk`)
  process.exit(0)
}

main()
