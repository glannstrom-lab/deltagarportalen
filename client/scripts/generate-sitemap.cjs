#!/usr/bin/env node
/**
 * Genererar dist/sitemap.xml.  (spår K1, 2026-08-05)
 *
 * Bakgrund: före K1 svarade /sitemap.xml med index.html och status 200 —
 * SPA-catch-allen serverade appen för allt som inte fanns på disk. En sitemap
 * som är HTML går inte att lämna in i Search Console.
 *
 * K1 lägger bara grunden: rotsidan. Appens egna vyer kan inte ligga här —
 * de nås via HashRouter (`/#/...`), och fragmentet skickas aldrig till
 * servern, så de är inte separata URL:er för en sökmotor.
 *
 * K2 (prerender av artiklarna) fyller på genom att pusha in poster i `urls`
 * nedan, i formen { loc: '/guider/<slug>/', changefreq, priority, lastmod }.
 */

const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://www.jobin.se' // jobin.se 307:ar hit — www är kanonisk
const OUT = path.join(__dirname, '..', 'dist', 'sitemap.xml')

/** @type {{loc:string,changefreq?:string,priority?:string,lastmod?:string}[]} */
const urls = [{ loc: '/', changefreq: 'weekly', priority: '1.0' }]

// K2: guidesidorna. Läser samma publish-list som prerender-guides.cjs, så
// att sitemap och genererade sidor aldrig kan gå isär — en URL i sitemapen
// som inte finns är en mjuk 404 i Search Console.
try {
  const { getPublishedArticles, guideUrl, arLattlast } = require('./lib/guides.cjs')
  const guider = getPublishedArticles()
  if (guider.length) {
    urls.push({ loc: '/guider/', changefreq: 'weekly', priority: '0.9' })
    if (guider.some(arLattlast)) {
      urls.push({ loc: '/guider/lattlast/', changefreq: 'weekly', priority: '0.8' })
    }
    urls.push(
      ...guider.map((a) => ({
        loc: guideUrl(a.slug),
        lastmod: (a.updated_at || '').slice(0, 10) || undefined,
        changefreq: 'monthly',
        priority: '0.7',
      }))
    )
  }
} catch (err) {
  console.error(`generate-sitemap: kunde inte läsa guiderna — ${err.message}`)
  process.exit(1)
}

// K6: verktygens landningssidor. De är de kommersiellt viktigaste sidorna,
// därför högre priority än guiderna.
const TOOLS = path.join(__dirname, '..', 'content', 'tools.json')
if (fs.existsSync(TOOLS)) {
  const { verktyg } = JSON.parse(fs.readFileSync(TOOLS, 'utf8'))
  if (verktyg?.length) {
    urls.push({ loc: '/verktyg/', changefreq: 'monthly', priority: '0.9' })
    urls.push(
      ...verktyg.map((t) => ({ loc: `/verktyg/${t.slug}/`, changefreq: 'monthly', priority: '0.8' }))
    )
  }
}

const today = new Date().toISOString().slice(0, 10)

const body = urls
  .map(({ loc, changefreq, priority, lastmod }) => {
    const parts = [`    <loc>${BASE_URL}${loc}</loc>`, `    <lastmod>${lastmod || today}</lastmod>`]
    if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`)
    if (priority) parts.push(`    <priority>${priority}</priority>`)
    return `  <url>\n${parts.join('\n')}\n  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

if (!fs.existsSync(path.dirname(OUT))) {
  console.error('generate-sitemap: dist/ saknas — kör efter `vite build`.')
  process.exit(1)
}

fs.writeFileSync(OUT, xml, 'utf8')
console.log(`generate-sitemap: skrev ${path.relative(process.cwd(), OUT)} med ${urls.length} URL:er.`)
