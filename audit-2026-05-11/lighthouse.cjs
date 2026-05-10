/**
 * Lighthouse / Core Web Vitals på 5 nyckelsidor.
 * Endast publika sidor — Lighthouse kan inte enkelt logga in.
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = 'https://jobin.se'
const PAGES = [
  { id: 'landing', url: BASE, label: 'Landningssida' },
  { id: 'login', url: `${BASE}/#/login`, label: 'Login' },
  { id: 'register', url: `${BASE}/#/register`, label: 'Register' },
  { id: 'privacy', url: `${BASE}/#/privacy`, label: 'Integritet' },
  { id: 'terms', url: `${BASE}/#/terms`, label: 'Villkor' },
]

async function main() {
  const lighthouse = (await import('lighthouse')).default

  const browser = await chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222'],
  })

  const results = []

  for (const p of PAGES) {
    console.log(`Lighthouse: ${p.id}...`)
    try {
      const result = await lighthouse(p.url, {
        port: 9222,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      })

      if (!result?.lhr) {
        results.push({ id: p.id, label: p.label, error: 'No LHR' })
        continue
      }

      const lhr = result.lhr
      const audit = (key) => lhr.audits[key]?.numericValue ?? null
      results.push({
        id: p.id,
        label: p.label,
        url: p.url,
        scores: {
          performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
          accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
          'best-practices': Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
        },
        cwv: {
          LCP_ms: Math.round(audit('largest-contentful-paint') ?? 0),
          CLS: Number((audit('cumulative-layout-shift') ?? 0).toFixed(3)),
          INP_ms: Math.round(audit('interactive') ?? 0),
          FCP_ms: Math.round(audit('first-contentful-paint') ?? 0),
          TBT_ms: Math.round(audit('total-blocking-time') ?? 0),
        },
      })
    } catch (e) {
      results.push({ id: p.id, label: p.label, error: e.message })
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'data', 'lighthouse.json'),
    JSON.stringify(results, null, 2)
  )

  console.log('\n=== Lighthouse-resultat ===')
  for (const r of results) {
    if (r.error) {
      console.log(`  ${r.id}: ERROR — ${r.error}`)
      continue
    }
    console.log(`  ${r.id}: Perf ${r.scores.performance} / A11y ${r.scores.accessibility} / BP ${r.scores['best-practices']}`)
    console.log(`    LCP ${r.cwv.LCP_ms}ms, CLS ${r.cwv.CLS}, FCP ${r.cwv.FCP_ms}ms`)
  }

  await browser.close()
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
