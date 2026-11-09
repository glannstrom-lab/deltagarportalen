/**
 * guidebild — en fotobild per publik sida (guider, verktyg, "för dig som",
 * organisationssidor). 2026-11-09, Mikael: "skapa bilder till alla seo-sidor".
 *
 * Filerna ligger i public/guidebilder/<nyckel>.webp och tas fram av
 * scripts/guidebilder.cjs ur ElevenLabs-original (design-source/sidbilder-seo,
 * gitignorerat) respektive appens befintliga sidbilder för verktygssidorna.
 *
 * Nycklar:
 *   guide       <slug>
 *   situation   for-dig-som--<slug>
 *   b2b         b2b--<slug>
 *   verktyg     verktyg--<slug>
 *
 * Saknas filen blir det ingen bild — aldrig en trasig <img>. En ny guide utan
 * bild bygger alltså som förut; `npm run guidebilder -- --saknas` listar luckorna.
 *
 * Bilden är stämning, inte information: alt="" (dekorativ), så skärmläsaren
 * inte läser upp en påhittad bildbeskrivning före rubriken.
 */

const fs = require('node:fs')
const path = require('node:path')

const KATALOG = path.join(__dirname, '..', '..', 'public', 'guidebilder')
const BREDD = 1040
const HOJD = 520

/** Verktygssidornas slug → appens sidbildsnyckel (public/illustrations/sida-<nyckel>-mjuk.webp). */
const VERKTYG_SIDBILD = {
  cv: 'cv',
  'personligt-brev': 'coverLetter',
  intervjutraning: 'interviewSimulator',
  kompetensanalys: 'skillsGapAnalysis',
  yrkestest: 'interestGuide',
  linkedin: 'linkedinOptimizer',
  spontanansokan: 'spontaneous',
  lon: 'salary',
  jobbsok: 'jobSearch',
  ansokningar: 'applications',
  'personligt-varumarke': 'personalBrand',
  utbildning: 'education',
  'ny-i-sverige': 'international',
  'ai-coach': 'aiTeam',
  maende: 'wellness',
  ovningar: 'exercises',
  dagbok: 'diary',
  kalender: 'calendar',
  karriarvagar: 'career',
  kunskapsbank: 'knowledgeBase',
  'mina-dokument': 'resources',
  // natverk och externa-resurser saknar sidbild i appen — de får egna
  // ElevenLabs-bilder under nyckeln verktyg--<slug>.
}

function filFor(nyckel) {
  return path.join(KATALOG, `${nyckel}.webp`)
}

function finns(nyckel) {
  return fs.existsSync(filFor(nyckel))
}

/** `<figure>` för hjälteblocket, eller '' om bilden inte finns. */
function guidebildHtml(nyckel) {
  if (!nyckel || !finns(nyckel)) return ''
  return `<figure class="hero-bild"><img src="/guidebilder/${encodeURIComponent(nyckel)}.webp" width="${BREDD}" height="${HOJD}" alt="" decoding="async"></figure>`
}

/**
 * Stilprefixet som alla 330 bilder genererades med (ElevenLabs,
 * recraft-v4.1-flash, en tagning, 48 krediter). Hela prompten = STIL_PROMPT +
 * ett konkret motiv på engelska. Använd samma för nya sidor, annars glider
 * uttrycket isär.
 */
const STIL_PROMPT =
  'Soft natural-light photograph, calm Scandinavian setting, muted warm palette, shallow depth of field, ' +
  'gentle and hopeful mood, wide 16:9 composition with calm empty space. People shown from behind, in profile ' +
  'at a distance, or only their hands — no faces in focus. Ordinary people, ordinary bodies, everyday clothes. ' +
  'No text, no readable words, no readable screens, no logos or brand marks on clothing or objects. Scene: '

/** CSS-delen, läggs in i mallens gemensamma stilblock. */
const GUIDEBILD_CSS = `
.hero-bild{margin:1.75rem 0 0;border-radius:.9rem;overflow:hidden;background:var(--c-accent);aspect-ratio:2/1}
.hero-bild img{display:block;width:100%;height:100%;object-fit:cover}`

module.exports = { STIL_PROMPT, KATALOG, BREDD, HOJD, VERKTYG_SIDBILD, filFor, finns, guidebildHtml, GUIDEBILD_CSS }
