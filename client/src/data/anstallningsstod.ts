/**
 * anstallningsstod.ts — strukturerad data om anställningsstöd (spår AG2).
 *
 * Underlaget är `docs/anstallningsstod-underlag.md` (473 rader, hämtat
 * 2026-08-31 mot arbetsformedlingen.se). Varje textpåstående här är märkt
 * i sin källrad i det dokumentet som BELAGT eller EJ BELAGT — den här
 * filen citerar bara det som är belagt, och skriver ut luckorna som
 * `ejBelagt`-strängar i stället för att gissa.
 *
 * ABSOLUT REGEL (CLAUDE.md): hitta aldrig på en siffra som är en regel.
 * Den här filen får bara innehålla ett numeriskt `varde` när det är en RAM
 * (t.ex. ett lönetak), aldrig ett uträknat belopp — och varje sådan post
 * MÅSTE ha `kalla` + `hamtad` ifyllda. Vakten i
 * `anstallningsstod.test.ts` ("varje belopp har källa") fäller bygget
 * annars. Se `stodMatchning.ts` för själva matchningen — den returnerar
 * ALDRIG ett belopp, bara en bedömning + länk.
 *
 * Fem stödformer, inte fyra: uppdraget räknar "lönebidrag/OSA" som EN
 * post, men underlaget (avsnitt 3a/3b) visar att de har olika
 * matchningsvillkor (OSA kräver offentlig arbetsgivare och en specifik
 * funktionsnedsättningstyp, lönebidrag gör inte det) och olika käll-URL:er.
 * De är därför två separata `Anstallningsstod`-poster här, grupperade under
 * samma `familj` för UI:t som ska visa dem tillsammans.
 */

export type StodformId = 'nystartsjobb' | 'introduktionsjobb' | 'lonebidrag' | 'osa' | 'sius'

export type StodKategori = 'ekonomiskt_stod' | 'personstod'

/**
 * `af` = hämtat från en Arbetsförmedlingen-sida (URL i `kalla`).
 * `konsulent_erfarenhet` = en muntlig uppgift från Mikael Glännström,
 * arbetskonsulent — INTE verifierad mot ett AF-dokument. Får aldrig
 * blandas ihop med `af` i UI:t; se `konsulentErfarenhet`-fältet nedan för
 * hur den sortens uppgift hanteras separat från `belopp`.
 */
export type KallTyp = 'af' | 'konsulent_erfarenhet'

/**
 * En RAM (t.ex. ett lönetak eller en dagsgräns) — ALDRIG ett uträknat
 * belopp. `varde` + `enhet` beskriver taket; texten runt den i
 * `Anstallningsstod.vadArbetsgivarenFar` gör alltid klart att det här är
 * en gräns för underlaget, inte pengar i handen.
 */
export interface AnstallningsstodBelopp {
  faltnamn: string
  beskrivning: string
  varde: number
  enhet: 'kr_per_manad' | 'manader' | 'dagar' | 'procent'
  kallTyp: KallTyp
  kalla: string
  hamtad: string // YYYY-MM-DD — dagen uppgiften hämtades, inte ett giltighetsdatum AF anger
  anmarkning?: string
}

export interface Anstallningsstod {
  id: StodformId
  /** Grupperar lönebidrag + OSA i UI:t — se filhuvudet. */
  familj: StodformId
  namn: string
  kategori: StodKategori
  /** En mening, för en arbetskonsulent — inte en marknadsföringstext. */
  sammanfattning: string
  /** Villkor att matcha mot — mänsklig text, samma ordning som stodMatchning.ts läser dem i. */
  vemDetGaller: string[]
  /** Ersättningens FORM, aldrig ett uträknat tal. */
  vadArbetsgivarenFar: string
  langd: string
  ansokningsvag: string
  fallgropar: string[]
  kombination: string
  /** Ramer med källa. Tom array = inget belagt belopp att visa. */
  belopp: AnstallningsstodBelopp[]
  /**
   * Endast för lönebidrag: Mikaels erfarenhetsbaserade observation om var
   * bidraget i praktiken brukar landa. Fritext med källa — MEDVETET inte
   * ett `AnstallningsstodBelopp` (inget `varde`/`enhet`), just för att den
   * aldrig ska kunna renderas som en ram eller ett förväntat utfall. Visa
   * den bara i konsulentens eget underlag, aldrig i något en arbetsgivare
   * läser som ett besked — se docs/anstallningsstod-underlag.md avsnitt 3.
   */
  konsulentErfarenhet?: { text: string; kalla: string }
  kalla: string
  hamtad: string
  /** Vad som INTE gick att belägga i underlaget — visas i panelen som "saknas", inte gissas fram. */
  ejBelagt: string[]
}

const NYSTARTSJOBB_URL =
  'https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/nystartsjobb'
const INTRODUKTIONSJOBB_URL =
  'https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/introduktionsjobb'
const LONEBIDRAG_URL =
  'https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/lonebidrag'
const OSA_URL =
  'https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o/skyddat-arbete-hos-offentlig-arbetsgivare'
const SIUS_URL =
  'https://arbetsformedlingen.se/for-arbetsgivare/kom-igang-med-din-rekrytering/fa-stod-i-rekryteringen/sarskild-stodperson-for-introduktions--och-uppfoljningsstod-sius'

const HAMTAD = '2026-08-31'

export const ANSTALLNINGSSTOD: readonly Anstallningsstod[] = [
  {
    id: 'nystartsjobb',
    familj: 'nystartsjobb',
    namn: 'Nystartsjobb',
    kategori: 'ekonomiskt_stod',
    sammanfattning:
      'Arbetsgivaren får en del av arbetsgivaravgiften tillbaka när hen anställer någon som stått länge utanför arbetsmarknaden.',
    vemDetGaller: [
      '20–24 år: arbetslös på heltid minst 6 av de senaste 9 månaderna',
      '25 år eller äldre: arbetslös på heltid minst 12 av de senaste 15 månaderna',
      'Nyanländ, 20 år eller äldre: arbetslös på heltid minst 6 av de senaste 9 månaderna',
      'Flykting/skyddsbehövande med uppehållstillstånd inom max 3 år i Sverige — räknas automatiskt kvalificerande',
      'Deltagare i etableringsprogram eller jobb- och utvecklingsgarantin — räknas automatiskt kvalificerande',
      'Måste vara inskriven hos Arbetsförmedlingen vid beslutstillfället',
    ],
    vadArbetsgivarenFar:
      'En multipel av arbetsgivaravgiften (1×, 2× eller 2,5× beroende på ålder och hur länge personen varit borta från arbetslivet) på lönedelar upp till lönetaket. Ingen färdig kronsumma — se ram-beloppet nedan för bara lönetaket, inte den faktiska ersättningen.',
    langd: 'Upp till 1 år (20–24 år eller garantiprogram) eller upp till 2 år (25+, nyanlända, etableringsprogram). Beslut fattas som längst ett år i taget.',
    ansokningsvag:
      'Arbetsgivaren ansöker digitalt (e-legitimation) eller på pappersblankett, minst tre veckor innan anställningen börjar. Anställningen får inte börja innan beslut är fattat.',
    fallgropar: [
      'Personen får inte hyras ut till en annan arbetsgivare (utom bemanningsföretag)',
      'Inget distansarbete från utlandet',
      'Får inte anställa nära familj med stor ägarandel',
      'Får inte ha sagt upp personal på grund av arbetsbrist de senaste 12 månaderna',
      'Hela lönen måste betalas ut elektroniskt under hela stödperioden',
    ],
    kombination: 'Ej belagt i underlaget — ingen kombinationsregel med praktik/arbetsträning eller andra stöd nämnd på källan.',
    belopp: [
      {
        faltnamn: 'lonetak_heltid_kr_per_manad',
        beskrivning: 'Löneunderlagets tak vid heltid (deltid ger proportionellt lägre underlag). Inte utbetalt belopp.',
        varde: 20000,
        enhet: 'kr_per_manad',
        kallTyp: 'af',
        kalla: NYSTARTSJOBB_URL,
        hamtad: HAMTAD,
        anmarkning: 'Multipeln av arbetsgivaravgiften (1×/2×/2,5×) avgör det faktiska beloppet — den siffran finns inte i den här filen.',
      },
    ],
    kalla: NYSTARTSJOBB_URL,
    hamtad: HAMTAD,
    ejBelagt: [
      'Arbetsgivaravgiftens procentsats (avgör slutbeloppet tillsammans med multipeln) — hör till Skatteverkets regler, inte AF:s sida.',
      'Kombinationsregler med andra stöd eller praktik/arbetsträning.',
      'Vilket år lönetaket 20 000 kr gäller från — AF:s sida saknar synligt uppdateringsdatum.',
    ],
  },
  {
    id: 'introduktionsjobb',
    familj: 'introduktionsjobb',
    namn: 'Introduktionsjobb',
    kategori: 'ekonomiskt_stod',
    sammanfattning:
      'Ekonomiskt stöd för att anställa personer med etableringssvårigheter på grund av lång arbetslöshet eller att de nyligen kommit till Sverige.',
    vemDetGaller: [
      'Arbetslös och anmäld som arbetssökande hos Arbetsförmedlingen; anställningen får inte redan ha börjat',
      'Deltar i jobb- och utvecklingsgarantin, ELLER',
      'Har deltagit i jobbgaranti för ungdomar minst 200 dagar med ersättning, ELLER',
      'Nyanländ, 20 år eller äldre, deltar i eller har inom senaste 12 månaderna varit anvisad till etableringsprogrammet, ELLER',
      'Nyanländ, 20 år eller äldre, fått uppehållstillstånd/uppehållskort som EU/EES-familjemedlem inom senaste 36 månaderna',
    ],
    vadArbetsgivarenFar:
      '80 procent av lönekostnaden (bruttolön, sjuklön, semesterlön och arbetsgivaravgifter). Inget kronbelopps-tak angavs i den hämtade källtexten — flaggat som EJ FULLSTÄNDIGT BELAGT, dubbelkolla mot AF innan panelen visar "inget tak" som fakta.',
    langd: 'Upp till 12 månader initialt, med möjlig förlängning. Maximal total tid 24 månader.',
    ansokningsvag:
      'Arbetsgivaren gör en intresseanmälan. Arbetsförmedlingen kontaktar arbetsgivaren inom 3 arbetsdagar. Beslut krävs innan anställningen börjar.',
    fallgropar: [
      'Arbetsgivaren måste vara skatteregistrerad och får inte ha skatteskuld över 10 000 kr',
      'Ingen uppsägning på grund av arbetsbrist de senaste 12 månaderna',
      'Den anställda får inte ha väsentligt inflytande (styrelseledamot, delägarskap)',
      'Distansarbete från utlandet är förbjudet',
    ],
    kombination:
      'Kan kombineras med studier inriktade mot yrket, kompletterande gymnasieutbildning eller studier i svenska — arbetet måste vara den huvudsakliga delen av tiden.',
    belopp: [],
    kalla: INTRODUKTIONSJOBB_URL,
    hamtad: HAMTAD,
    ejBelagt: [
      'Om det finns ett kronbelopps-tak per månad (sidan angav bara "80 % av lönekostnaden" utan synligt tak) — kontrollera direkt mot AF.',
      'Om extratjänster/instegsjobb (nedlagda 2023 enligt Mikael) konverterades till introduktionsjobb-ärenden — inte verifierat mot AF:s sida.',
    ],
  },
  {
    id: 'lonebidrag',
    familj: 'lonebidrag',
    namn: 'Lönebidrag',
    kategori: 'ekonomiskt_stod',
    sammanfattning:
      'Ekonomisk ersättning till arbetsgivaren för lönekostnader vid anställning av en person med en funktionsnedsättning som medför nedsatt arbetsförmåga i relation till arbetet.',
    vemDetGaller: [
      'En funktionsnedsättning som medför nedsatt arbetsförmåga i relation till det specifika arbetet',
      '(De tre lönebidragsformerna — anställning/utveckling/trygghet — har egna villkor i AF:s faktablad; inte belagt här, se ejBelagt)',
    ],
    vadArbetsgivarenFar:
      'Bidrag för lönekostnaden upp till lönetaket, satt individuellt av Arbetsförmedlingen. Regeln (se konsulentErfarenhet för hur den skiljer sig från erfarenheten): högst 80 % av bruttokostnaden. Ett utvecklingsbidrag kan tillkomma.',
    langd: 'Första beslutet max 1 år. Nya perioder möjliga så länge behovet av arbetsplatsanpassning kvarstår.',
    ansokningsvag:
      'Arbetsgivaren gör en intresseanmälan. Kontakt inom 3 arbetsdagar, sedan utredning och behovsbedömning. Anställningen får inte börja innan beslut om lönebidrag är fattat.',
    fallgropar: [
      'Hela lönen ska betalas ut elektroniskt under hela bidragsperioden',
      'Förändringar som påverkar bidragsrätten ska anmälas omgående — annars återbetalningsskyldighet',
      'Får inte samtidigt få annan ersättning för samma anställning',
      'Den anställda får inte flyttas till en annan arbetsgivare (utom bemanningsföretag)',
    ],
    kombination: 'Kan INTE kombineras med annan ersättning för samma anställning.',
    belopp: [
      {
        faltnamn: 'lonetak_heltid_kr_per_manad',
        beskrivning: 'Tak för den bruttolön bidraget räknas på, vid heltid.',
        varde: 20000,
        enhet: 'kr_per_manad',
        kallTyp: 'af',
        kalla: LONEBIDRAG_URL,
        hamtad: HAMTAD,
      },
      {
        faltnamn: 'max_andel_av_bruttokostnad_procent',
        beskrivning:
          'REGEL, inte förväntat utfall: bidraget sätts individuellt men kan uppgå till högst denna andel av bruttokostnaden, upp till lönetaket ovan.',
        varde: 80,
        enhet: 'procent',
        kallTyp: 'konsulent_erfarenhet',
        kalla: 'Mikael Glännström, arbetskonsulent — regel, inte hämtad från AF-dokument',
        hamtad: HAMTAD,
        anmarkning:
          'Detta är taket på regeln, INTE vad bidraget brukar bli. Se konsulentErfarenhet för vad det brukar landa på i praktiken — de två får aldrig blandas ihop.',
      },
    ],
    konsulentErfarenhet: {
      text: 'I praktiken brukar lönebidraget landa på ungefär 30–50 % av lönen, beroende på lönenivå — det är en erfarenhet av hur Arbetsförmedlingens beslut brukar falla, inte en regel eller en garanti. Använd den för att sätta rimliga förväntningar hos en arbetsgivare i samtal, aldrig som ett besked eller ett räknat belopp.',
      kalla: 'Mikael Glännström, arbetskonsulent — erfarenhet, inte hämtad från AF-dokument',
    },
    kalla: LONEBIDRAG_URL,
    hamtad: HAMTAD,
    ejBelagt: [
      'Vad som exakt skiljer lönebidragsformerna "anställning", "utveckling" och "trygghet" åt — ligger i tre separata PDF-faktablad som inte hämtades.',
      'Hur graden av nedsatt arbetsförmåga översätts till en procentsats i det enskilda beslutet.',
    ],
  },
  {
    id: 'osa',
    familj: 'lonebidrag',
    namn: 'OSA — skyddat arbete hos offentlig arbetsgivare',
    kategori: 'ekonomiskt_stod',
    sammanfattning:
      'Tidsbegränsat, anpassat arbete hos en offentlig arbetsgivare (kommun, region, statlig myndighet) för personer med funktionsnedsättning — arbetsgivaren får samtidigt ett lönebidrag.',
    vemDetGaller: [
      'Arbetsgivaren är offentlig (kommun, region eller statlig myndighet) — min tolkning av var stödet hör hemma administrativt, inte uttryckligen bekräftat av källan',
      'Kognitiv funktionsnedsättning eller nedsatt arbetsförmåga på grund av missbruks- eller beroendeproblem, ELLER',
      'Rätt till insatser enligt LSS, ELLER',
      'Inte jobbat tidigare eller borta från arbetslivet under lång tid på grund av svår psykisk sjukdom',
      'Inskriven som arbetssökande hos Arbetsförmedlingen',
    ],
    vadArbetsgivarenFar:
      'Ett bidrag till lönen — källan anger varken procentsats eller kronbelopp. Anta INTE att lönebidragets tak (20 000 kr/mån) gäller även här; det är en gissning, inte en källa.',
    langd: 'Upp till 12 månader, förlängningsbart vid fortsatt behov.',
    ansokningsvag: 'Ansökan sker via Arbetsförmedlingen (inte direkt av arbetsgivaren). Bedömning och beslut krävs innan anställningen börjar.',
    fallgropar: [],
    kombination: 'Ej belagt i underlaget.',
    belopp: [],
    kalla: OSA_URL,
    hamtad: HAMTAD,
    ejBelagt: [
      'Ersättningens storlek — källan säger bara "ett bidrag till din lön", ingen procentsats eller kronbelopp.',
      'OSA:s exakta administrativa hemvist för arbetsgivare — hittades bara i arbetssökande-sidans A–Ö-lista, inte i AF:s arbetsgivarsektion.',
      'Om lönebidragets 20 000 kr/mån-tak gäller även OSA (troligt men INTE bekräftat).',
    ],
  },
  {
    id: 'sius',
    familj: 'sius',
    namn: 'SIUS — särskild stödperson',
    kategori: 'personstod',
    sammanfattning:
      'En arbetsförmedlare specialiserad på introduktionsstöd stöttar praktiskt under introduktionen på arbetsplatsen. INTE pengar — en person.',
    vemDetGaller: [
      'Nedsatt arbetsförmåga på grund av en funktionsnedsättning eller ett hälsotillstånd',
      'Behov av att öva arbetsuppgifter och andra arbetsrelaterade färdigheter',
    ],
    vadArbetsgivarenFar:
      'En namngiven stödperson som finns tillgänglig, och ibland arbetar bredvid den anställda en tid. Ingen extra kostnad utöver lönen. Arbetsgivaren behåller fullt ansvar för arbetsledning och introduktion.',
    langd: 'Introduktionsstöd max 6 månader. Uppföljningsstöd under anställningen minst 12 månader.',
    ansokningsvag:
      'Arbetsgivaren kontaktar Arbetsförmedlingen. En bedömning görs, därefter en överenskommelse mellan Arbetsförmedlingen, arbetsgivaren och den arbetssökande.',
    fallgropar: [
      'SIUS-personen ersätter inte arbetsgivarens eget ansvar för arbetsmiljö, arbetsorganisation och introduktion.',
    ],
    kombination:
      'Ej belagt i underlaget. Eftersom SIUS är en personresurs snarare än en ekonomisk ersättning finns ingen uppenbar anledning att den skulle utesluta de andra stöden — men det är en bedömning, inte en källa.',
    belopp: [],
    kalla: SIUS_URL,
    hamtad: HAMTAD,
    ejBelagt: ['Om SIUS formellt kan kombineras med nystartsjobb, introduktionsjobb, lönebidrag eller OSA.'],
  },
] as const

export function hittaStod(id: StodformId): Anstallningsstod {
  const stod = ANSTALLNINGSSTOD.find((s) => s.id === id)
  if (!stod) throw new Error(`Okänd stödform: ${id}`)
  return stod
}
