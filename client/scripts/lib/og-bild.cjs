/**
 * og-bild — vilken delningsbild (og:image) en prerenderad sida ska ha (KG3).
 *
 * Före 2026-09-12 pekade alla 269 sidor på samma `/og-image.png`, hårdkodat på
 * sju ställen i guide-template.cjs. Nu: en bild per kategori/sidtyp, i samma
 * hubbfärg som sidan själv har (en sida = en hub-färg, DESIGN.md §4).
 *
 * Bilderna genereras av `scripts/og-bilder.cjs` till `public/og/<fil>.png`.
 * Den här modulen är ren: ingen fil läses, bara en mappning. Testet i
 * `src/test/guides-og-bild.test.ts` kontrollerar att varje fil faktiskt finns.
 *
 * Fallback: `/og-image.png` — aldrig en 404 i en delningskort.
 */

const { SITE } = require('./guides.cjs')

/** Hubbpaletten ur src/styles/tokens.css (ljust läge). Hålls i synk för hand. */
const HUBBAR = {
  action:    { bg: '#ECF7F1', text: '#155F47', solid: '#1A7757', namn: 'Översikt' },
  activity:  { bg: '#FCF1E6', text: '#8B5418', solid: '#A85D24', namn: 'Söka jobb' },
  coaching:  { bg: '#FBEEEF', text: '#843845', solid: '#B85363', namn: 'Karriär' },
  info:      { bg: '#ECF4FA', text: '#1F5985', solid: '#266DA0', namn: 'Resurser' },
  wellbeing: { bg: '#F2EDF8', text: '#4F3D7C', solid: '#7058A8', namn: 'Min vardag' },
}

/**
 * Bildregistret: nyckel → { fil, hub, rubrik, underrad }.
 * Kategorinycklarna följer KATEGORI_NAMN i guides.cjs; sidtyperna nedan följer
 * render-funktionerna i guide-template.cjs.
 */
const OG_BILDER = {
  // Guidekategorier
  'job-search':         { fil: 'soka-jobb',           hub: 'activity',  rubrik: 'Söka jobb',            underrad: 'Guider för dig som söker jobb' },
  interview:            { fil: 'intervju',            hub: 'activity',  rubrik: 'Intervju',             underrad: 'Förbered dig i lugn och ro' },
  'digital-presence':   { fil: 'digital-narvaro',     hub: 'activity',  rubrik: 'Din digitala närvaro', underrad: 'LinkedIn, profil och sökbarhet' },
  networking:           { fil: 'natverk',             hub: 'activity',  rubrik: 'Nätverk',              underrad: 'Kontakter som leder någonstans' },
  'job-market':         { fil: 'arbetsmarknaden',     hub: 'activity',  rubrik: 'Arbetsmarknaden',      underrad: 'Var jobben finns och vad som krävs' },
  'career-development': { fil: 'karriar',             hub: 'coaching',  rubrik: 'Karriär och utveckling', underrad: 'Nästa steg, i din takt' },
  'self-awareness':     { fil: 'sjalvkannedom',       hub: 'coaching',  rubrik: 'Vad du kan och vill',  underrad: 'Kompetens, intressen, riktning' },
  wellness:             { fil: 'orka-och-ma-bra',     hub: 'wellbeing', rubrik: 'Orka och må bra',      underrad: 'Energi, vila och vardag' },
  'employment-law':     { fil: 'dina-rattigheter',    hub: 'info',      rubrik: 'Dina rättigheter',     underrad: 'Ersättning, avtal och stöd' },
  accessibility:        { fil: 'stod-och-anpassningar', hub: 'info',    rubrik: 'Stöd och anpassningar', underrad: 'När du behöver att det funkar annorlunda' },
  tools:                { fil: 'checklistor',         hub: 'info',      rubrik: 'Checklistor och ordlistor', underrad: 'Att bocka av och slå upp' },
  'easy-swedish':       { fil: 'latt-svenska',        hub: 'action',    rubrik: 'Lätt svenska',         underrad: 'Korta texter med enkla ord' },
  'getting-started':    { fil: 'guider',              hub: 'action',    rubrik: 'Guider',               underrad: 'Gratis guider för dig som söker jobb' },
  // Sidtyper
  index:                { fil: 'guider',              hub: 'action',    rubrik: 'Guider',               underrad: 'Gratis guider för dig som söker jobb' },
  lattlast:             { fil: 'latt-svenska',        hub: 'action',    rubrik: 'Lätt svenska',         underrad: 'Korta texter med enkla ord' },
  tool:                 { fil: 'verktyg',             hub: 'info',      rubrik: 'Verktyg',              underrad: 'CV, brev, intervjuträning och mer' },
  'tool-index':         { fil: 'verktyg',             hub: 'info',      rubrik: 'Verktyg',              underrad: 'CV, brev, intervjuträning och mer' },
  b2b:                  { fil: 'organisationer',      hub: 'action',    rubrik: 'För organisationer',   underrad: 'Konsulentvy, uppföljning, aktivitetskravet' },
}

const FALLBACK = '/og-image.png'

/** Alla unika bildfiler som ska finnas i public/og/. */
function allaBildfiler() {
  return [...new Set(Object.values(OG_BILDER).map((b) => b.fil))]
}

/**
 * @param {{ typ?: string, category_key?: string }} sida
 *   typ: 'guide' (default, använder category_key) | 'kategori' (category_key = kat.key)
 *        | 'index' | 'lattlast' | 'tool' | 'tool-index' | 'b2b'
 * @returns {string} sökväg utan domän, t.ex. '/og/soka-jobb.png'
 */
function ogBildSokvag(sida = {}) {
  const typ = sida.typ || 'guide'
  const post = typ === 'guide' || typ === 'kategori'
    ? OG_BILDER[sida.category_key]
    : OG_BILDER[typ]
  return post ? `/og/${post.fil}.png` : FALLBACK
}

/** Absolut URL, det som ska in i `<meta property="og:image">`. */
function ogBildFor(sida = {}) {
  return `${SITE}${ogBildSokvag(sida)}`
}

module.exports = { OG_BILDER, HUBBAR, FALLBACK, ogBildFor, ogBildSokvag, allaBildfiler }
