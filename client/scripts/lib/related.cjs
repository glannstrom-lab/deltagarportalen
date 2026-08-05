/**
 * Intern länkning mellan guidesidorna — vilka guider som föreslås under
 * "Läs vidare".  (spår K2, 2026-08-05)
 *
 * Problemet det löser: den första versionen tog `related_article_slugs` när de
 * fanns och fyllde annars på med artiklar ur samma kategori **i den ordning de
 * råkade ligga i publish-list.json**. Följden blev att kategorins första
 * artiklar länkades om och om igen medan 26 av 128 guider aldrig fick en enda
 * inkommande länk — de gick bara att nå via /guider/ och sitemapen.
 *
 * Två saker den här modulen gör i stället:
 *
 *   1. RANGORDNAR i stället för att fylla på. Varje kandidat får poäng, och
 *      bara kandidater över tröskeln kommer med. En sida med tre relevanta
 *      grannar visar tre — inte fem där två är slumpartade.
 *
 *   2. LAGAR återvändsgränderna efteråt. När rangordningen är klar räknas
 *      inkommande länkar. Varje guide utan inlänkar placeras hos den värd där
 *      den passar bäst. Reparationen sker EFTER rangordningen, så den kan bara
 *      lägga till länkar — aldrig försämra ordningen på dem som redan finns.
 *
 * Poängen är medvetet enkel att läsa av: redaktionellt satta kopplingar väger
 * tyngst, sedan taggöverlapp, sedan kategori. Se POANG nedan.
 */

/** Så många länkar visas normalt. Fler blir en lista man inte läser. */
const MAX_LANKAR = 5

/** Taket när reparationen behöver placera en föräldralös guide någonstans. */
const TAK_LANKAR = 6

/**
 * Lägsta poäng för att över huvud taget komma med.
 *
 * 8 är satt precis ovanför "samma kategori och inget mer" (6 poäng). I klartext
 * krävs alltså minst EN av: redaktionell koppling, en delad tagg (även den
 * vanligaste taggen ger ~8,6), eller samma kategori OCH samma underkategori.
 * Att två guider råkar ligga i samma av tolv kategorier är ingen rekommendation.
 */
const MIN_POANG = 8

const POANG = {
  /** Artikeln pekar själv ut den andra i related_article_slugs. */
  egenKoppling: 100,
  /** Den andra artikeln pekar ut oss. Redaktionellt satt, riktningen godtycklig. */
  omvandKoppling: 60,
  /** Multiplikator för en delad tagg, vägd med hur ovanlig taggen är. */
  taggVikt: 4,
  /** Samma underkategori — finare indelning än kategorin. */
  underkategori: 5,
  /** Samma kategori. Golvet: precis tillräckligt för att kvala in. */
  kategori: 6,
  /** Två lättlästa texter hör ihop — samma läsare, samma behov. */
  lattlastPar: 8,
  /**
   * Lättläst text som skulle länka till en vanlig text. Den som behöver lätt
   * svenska ska inte skickas in i en fördjupning. Avdraget är så stort att bara
   * en redaktionellt satt koppling överlever det.
   */
  lattlastKrock: -20,
}

/** Samma definition som guides.cjs arLattlast — kopierad hit för att slippa cirkelimport. */
const arLattlast = (a) =>
  a.difficulty === 'easy-swedish' || a.category_key === 'easy-swedish' || /^latt/.test(a.slug)

const normaliseraTagg = (t) => String(t || '').trim().toLowerCase()
const normaliseraTitel = (t) => String(t || '').trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Hur mycket en delad tagg är värd. En tagg som bara två artiklar har säger
 * mycket mer om släktskap än "tips", som halva biblioteket bär. Klassisk IDF.
 */
function taggvikter(artiklar) {
  const forekomster = new Map()
  for (const a of artiklar) {
    for (const tagg of new Set((a.tags || []).map(normaliseraTagg))) {
      if (!tagg) continue
      forekomster.set(tagg, (forekomster.get(tagg) || 0) + 1)
    }
  }
  const vikter = new Map()
  for (const [tagg, antal] of forekomster) {
    vikter.set(tagg, POANG.taggVikt * Math.log(artiklar.length / antal))
  }
  return vikter
}

/** Poäng för hur väl `kandidat` passar som fortsättning på `artikel`. */
function poangsatt(artikel, kandidat, ctx) {
  let poang = 0

  if (ctx.egna.get(artikel.slug)?.has(kandidat.slug)) poang += POANG.egenKoppling
  if (ctx.egna.get(kandidat.slug)?.has(artikel.slug)) poang += POANG.omvandKoppling

  const kandidatTaggar = ctx.taggar.get(kandidat.slug)
  for (const tagg of ctx.taggar.get(artikel.slug)) {
    if (kandidatTaggar.has(tagg)) poang += ctx.vikter.get(tagg) || 0
  }

  if (artikel.category_key && artikel.category_key === kandidat.category_key) {
    poang += POANG.kategori
  }
  if (artikel.subcategory && artikel.subcategory === kandidat.subcategory) {
    poang += POANG.underkategori
  }

  const lattA = ctx.lattlast.has(artikel.slug)
  const lattB = ctx.lattlast.has(kandidat.slug)
  if (lattA && lattB) poang += POANG.lattlastPar
  else if (lattA && !lattB) poang += POANG.lattlastKrock

  return poang
}

/** Fallande poäng, sedan slug — så att två bygg av samma innehåll blir identiska. */
const sorteraKandidater = (a, b) => b.poang - a.poang || (a.slug < b.slug ? -1 : 1)

/**
 * Bygger länkgrafen för alla publicerade guider.
 *
 * @param {object[]} publicerade artiklar ur snapshoten, i publiceringsordning
 * @returns {{ karta: Map<string, object[]>, statistik: object }}
 *   `karta` går från slug till de artikelobjekt som ska visas under
 *   "Läs vidare", i visningsordning.
 */
function byggRelaterade(publicerade) {
  const ctx = {
    vikter: taggvikter(publicerade),
    taggar: new Map(
      publicerade.map((a) => [a.slug, new Set((a.tags || []).map(normaliseraTagg).filter(Boolean))])
    ),
    egna: new Map(
      publicerade.map((a) => [a.slug, new Set((a.related_article_slugs || []).filter(Boolean))])
    ),
    lattlast: new Set(publicerade.filter(arLattlast).map((a) => a.slug)),
  }

  const bySlug = new Map(publicerade.map((a) => [a.slug, a]))

  // Steg 1 — rangordna. Alla kandidater över tröskeln, bäst först.
  /** @type {Map<string, {slug:string,poang:number}[]>} */
  const rangordnade = new Map()
  for (const artikel of publicerade) {
    const kandidater = []
    for (const kandidat of publicerade) {
      if (kandidat.slug === artikel.slug) continue
      const poang = poangsatt(artikel, kandidat, ctx)
      if (poang >= MIN_POANG) kandidater.push({ slug: kandidat.slug, poang })
    }
    rangordnade.set(artikel.slug, kandidater.sort(sorteraKandidater))
  }

  // Steg 2 — plocka topplistan. Två titlar som är identiska (biblioteket har
  // t.ex. "Vad är ett CV?" i två versioner) filtreras bort: en lista där samma
  // rubrik står två gånger ser trasig ut och ger läsaren inget val.
  /** @type {Map<string, {slug:string,poang:number}[]>} */
  const valda = new Map()
  for (const artikel of publicerade) {
    const lista = []
    const titlar = new Set([normaliseraTitel(artikel.title)])
    for (const kandidat of rangordnade.get(artikel.slug)) {
      if (lista.length >= MAX_LANKAR) break
      const titel = normaliseraTitel(bySlug.get(kandidat.slug).title)
      if (titlar.has(titel)) continue
      titlar.add(titel)
      lista.push(kandidat)
    }
    valda.set(artikel.slug, lista)
  }

  const raknaInlankar = () => {
    const n = new Map(publicerade.map((a) => [a.slug, 0]))
    for (const lista of valda.values()) for (const k of lista) n.set(k.slug, n.get(k.slug) + 1)
    return n
  }

  const foreReparation = [...raknaInlankar()].filter(([, n]) => n === 0).map(([s]) => s)

  // Steg 3 — laga återvändsgränderna. Varje guide utan inlänkar placeras hos
  // den värd där den passar bäst och som har plats kvar. Ordningen (svårast
  // först, dvs. den med sämst bästa-match) gör att de mest särpräglade
  // artiklarna får välja värd innan platserna tar slut.
  const inlankar = raknaInlankar()
  const bastaVard = (slug) => {
    const artikel = bySlug.get(slug)
    return publicerade
      .filter((v) => v.slug !== slug)
      .map((v) => ({ slug: v.slug, poang: poangsatt(v, artikel, ctx) }))
      .sort(sorteraKandidater)
  }

  const foraldralosa = foreReparation
    .map((slug) => ({ slug, vardar: bastaVard(slug) }))
    .sort((a, b) => (a.vardar[0]?.poang || 0) - (b.vardar[0]?.poang || 0) || (a.slug < b.slug ? -1 : 1))

  const svaga = []
  for (const { slug, vardar } of foraldralosa) {
    if (inlankar.get(slug) > 0) continue // kan ha fått en inlänk av en tidigare reparation
    const vard = vardar.find(
      (v) => valda.get(v.slug).length < TAK_LANKAR && !valda.get(v.slug).some((k) => k.slug === slug)
    )
    if (!vard) continue
    if (vard.poang < MIN_POANG) svaga.push(`${slug} → ${vard.slug} (${vard.poang.toFixed(1)}p)`)
    const lista = valda.get(vard.slug)
    lista.push({ slug, poang: vard.poang })
    lista.sort(sorteraKandidater)
    inlankar.set(slug, inlankar.get(slug) + 1)
  }

  const efterReparation = [...inlankar].filter(([, n]) => n === 0).map(([s]) => s)
  const antalLankar = [...valda.values()].reduce((n, l) => n + l.length, 0)
  const utanUtgaende = [...valda].filter(([, l]) => l.length === 0).map(([s]) => s)

  return {
    karta: new Map([...valda].map(([slug, lista]) => [slug, lista.map((k) => bySlug.get(k.slug))])),
    statistik: {
      antalLankar,
      snittPerSida: antalLankar / publicerade.length,
      utanInlankarFore: foreReparation,
      utanInlankarEfter: efterReparation,
      utanUtgaende,
      reparerade: foreReparation.length - efterReparation.length,
      svagaReparationer: svaga,
      mestLankade: [...inlankar].sort((a, b) => b[1] - a[1]).slice(0, 3),
    },
  }
}

/**
 * Grind. En länk till en opublicerad slug blir en 404 för läsaren och en
 * mjuk 404 i Search Console — hellre trasigt bygge än trasig länk.
 * Samma princip som verktygssidornas kontroll i prerender-guides.cjs.
 *
 * @returns {string[]} felmeddelanden, tomt när allt är i sin ordning
 */
function validateRelaterade(karta, publiceradeSlugs) {
  const fel = []
  const inlankar = new Map([...publiceradeSlugs].map((s) => [s, 0]))

  for (const [slug, lista] of karta) {
    const sedda = new Set()
    for (const r of lista) {
      if (!r || !r.slug) {
        fel.push(`${slug}: relaterad post utan slug`)
        continue
      }
      if (!publiceradeSlugs.has(r.slug)) {
        fel.push(`${slug} länkar till opublicerad guide: ${r.slug}`)
        continue
      }
      if (r.slug === slug) fel.push(`${slug} länkar till sig själv`)
      if (sedda.has(r.slug)) fel.push(`${slug} länkar till ${r.slug} två gånger`)
      sedda.add(r.slug)
      inlankar.set(r.slug, (inlankar.get(r.slug) || 0) + 1)
    }
  }

  const utan = [...inlankar].filter(([, n]) => n === 0).map(([s]) => s)
  if (utan.length) {
    fel.push(
      `${utan.length} guide(r) saknar inkommande länkar: ${utan.slice(0, 10).join(', ')}` +
        (utan.length > 10 ? ' …' : '')
    )
  }
  return fel
}

module.exports = { byggRelaterade, validateRelaterade, MAX_LANKAR, MIN_POANG, POANG }
