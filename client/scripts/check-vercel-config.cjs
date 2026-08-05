#!/usr/bin/env node
/**
 * Grind för client/vercel.json.  (spår K1/K2, 2026-08-05)
 *
 * Finns för att TVÅ skarpa fel har gått till prod på den här filen:
 *
 * 1. `routes` låg tillsammans med `headers`. Vercel tillåter inte det —
 *    `routes` vann tyst och headers-blocket var dött. Deployen gav ingen
 *    varning; prod saknade CSP, X-Frame-Options och Referrer-Policy i
 *    månader utan att något larmade.
 *
 * 2. När `routes` ersattes av `headers` följde regeln
 *    `/(.*\.(js|css|…))` med. `routes` tolkas som RÅ REGEX, men
 *    `headers`/`rewrites`/`redirects` tolkas av path-to-regexp, som kastar
 *    på nästlade capture-grupper. `vercel build` föll på 35 sekunder.
 *
 * Grinden validerar mot path-to-regexp@6 ur @vercel/node — alltså exakt den
 * parser Vercel själv kör, inte en approximation.
 */

const fs = require('node:fs')
const path = require('node:path')

const CONFIG = path.join(__dirname, '..', 'vercel.json')

let pathToRegexp
try {
  ;({ pathToRegexp } = require('path-to-regexp'))
} catch {
  console.error('check-vercel-config: path-to-regexp saknas (kommer via @vercel/node). Kör `npm ci` först.')
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'))
const fel = []

// --- 0. Inga okända toppnycklar --------------------------------------------
// JSON har inga kommentarer, så det är frestande att lägga in en förklarande
// `_kommentar`-nyckel. Vercel avvisar okända egenskaper — och gör det i
// DEPLOY-steget, inte i `vercel build`. En sådan nyckel kostade en
// misslyckad deploy 2026-08-05 och lämnade en trasig fallback i prod en
// timme extra. Förklaringar hör hemma här i grinden, inte i konfigen.
const TILLATNA = new Set([
  'version', 'name', 'alias', 'scope', 'env', 'build', 'builds', 'routes',
  'cleanUrls', 'trailingSlash', 'redirects', 'rewrites', 'headers', 'functions',
  'regions', 'public', 'github', 'images', 'framework', 'buildCommand',
  'devCommand', 'installCommand', 'ignoreCommand', 'outputDirectory',
  'rootDirectory', 'crons', 'git', 'functionFailoverRegions',
])
const okanda = Object.keys(config).filter((k) => !TILLATNA.has(k))
if (okanda.length) {
  fel.push(
    `Okänd(a) toppnyckel/nycklar: ${okanda.map((k) => `\`${k}\``).join(', ')}. ` +
      'Vercel avvisar dem vid deploy (inte vid build) — kommentarer går inte att ha i vercel.json.'
  )
}

// --- 1. Legacy `routes` får inte blandas med modern routing -----------------
const MODERNA = ['headers', 'rewrites', 'redirects', 'cleanUrls', 'trailingSlash']
if (config.routes) {
  const krockar = MODERNA.filter((k) => k in config)
  if (krockar.length) {
    fel.push(
      `\`routes\` kan inte kombineras med ${krockar.map((k) => `\`${k}\``).join(', ')}. ` +
        'Vercel låter `routes` vinna och ignorerar resten TYST — migrera helt till modern routing.'
    )
  }
}

// --- 2. Varje `source` måste gå att parsa av path-to-regexp -----------------
for (const nyckel of ['headers', 'rewrites', 'redirects']) {
  const regler = config[nyckel]
  if (!Array.isArray(regler)) continue
  regler.forEach((regel, i) => {
    if (typeof regel.source !== 'string') {
      fel.push(`${nyckel}[${i}] saknar \`source\`.`)
      return
    }
    try {
      pathToRegexp(regel.source)
    } catch (e) {
      fel.push(
        `${nyckel}[${i}].source \`${regel.source}\` går inte att parsa: ${e.message}\n` +
          '    Vanligaste orsaken: en capture-grupp inuti mönstret. Gör den ' +
          'icke-fångande — (js|css) → (?:js|css).'
      )
    }
  })
}

// --- 3. SPA-fallbacken måste finnas kvar ------------------------------------
const harFallback = (config.rewrites || []).some((r) => r.destination === '/index.html')
if (!harFallback) {
  fel.push('Ingen rewrite till /index.html — SPA:n svarar 404 på direktnavigering.')
}

// --- 4. cleanUrls saboterar en rewrite till en .html-fil --------------------
// Med cleanUrls 308-redirectar Vercel /index.html → /, så rewriten kan inte
// leverera sitt mål och varje okänd sökväg faller till 404 i stället för
// appen. Kostade en timmes trasig direktnavigering i prod 2026-08-05.
if (config.cleanUrls) {
  const htmlMal = (config.rewrites || []).filter((r) => String(r.destination).endsWith('.html'))
  if (htmlMal.length) {
    fel.push(
      `\`cleanUrls: true\` tillsammans med rewrite till ${htmlMal[0].destination} — ` +
        'Vercel 308:ar .html-sökvägen, rewriten bryts och okända sökvägar blir 404. ' +
        'Stäng av cleanUrls eller peka rewriten på en extensionslös destination.'
    )
  }
}

if (fel.length) {
  console.error(`check-vercel-config: ${fel.length} fel i client/vercel.json\n`)
  fel.forEach((f) => console.error(`  • ${f}\n`))
  process.exit(1)
}

const antal = ['headers', 'rewrites', 'redirects'].reduce((n, k) => n + (config[k]?.length || 0), 0)
console.log(`OK — client/vercel.json validerad: ${antal} regler parsade av path-to-regexp, ingen legacy \`routes\`.`)
