/**
 * Korta kurser (KC15) — en ordnad lista av BEFINTLIGA kunskapsbanksartiklar.
 *
 * Ingen ny tabell. Vad som är läst kommer ur `article_reading_progress`
 * (`is_completed` sätts av `ReadingProgress` när deltagaren läst artikeln till
 * slutet). En kurs är genomförd när alla dess delar är lästa — det härleds i
 * `kursStatus`, det lagras inte.
 *
 * ## Uppskattad tid — regeln
 * Summan av delarnas `minuter` (= `articles.reading_time`, lästid i minuter),
 * avrundad UPPÅT till närmaste 5 minuter (`kursMinuter`). Ingen multiplikator för
 * "fundera och anteckna": tiden kan läggas in som pass som räknas mot veckomålet,
 * och då ska den inte vara högre än det den som läser faktiskt behöver.
 * `minuter` kontrolleras mot artikelsnapshoten av `kurser.test.ts` — ändras en
 * artikels lästid fäller testet tills siffran här följer med.
 *
 * Namn och beskrivning här är de svenska reservtexterna; gränssnittet slår upp
 * `kurser.<id>.namn|beskrivning` i locale-filerna och faller tillbaka på dem.
 * Språkkurser byggs inte här (partnerskap, ROADMAP KF10). Övningarna är medvetet
 * inte med: de har ingen lagrad "genomförd"-markering att härleda ur.
 */

export type KursId = 'arbetslivet' | 'arbetsplatsen' | 'samhallet' | 'myndigheterna'

export interface KursDel {
  /** `articles.slug` — samma värde som `article_reading_progress.article_id`. */
  slug: string
  /** Lästid i minuter, = `articles.reading_time`. */
  minuter: number
}

export interface Kurs {
  id: KursId
  namn: string
  beskrivning: string
  delar: readonly KursDel[]
}

export const KURSER: readonly Kurs[] = [
  {
    id: 'arbetslivet',
    namn: 'Förbered dig för arbetslivet',
    beskrivning: 'Från ansökan till första dagen: hur rekryteringen går till och vad du kan göra inför varje steg.',
    delar: [
      { slug: 'rekryteringsprocessen-steg-for-steg', minuter: 4 },
      { slug: 'cv-grunder', minuter: 5 },
      { slug: 'ansokningsstrategi', minuter: 2 },
      { slug: 'intervju-fragor', minuter: 4 },
      { slug: 'forsta-dagen-nytt-jobb', minuter: 2 },
    ],
  },
  {
    id: 'arbetsplatsen',
    namn: 'Den svenska arbetsplatsen',
    beskrivning: 'Anställningsavtal, kollektivavtal, facket, sjukdom och dina rättigheter när du är ny på ett jobb.',
    delar: [
      { slug: 'anstallningsformer-guide', minuter: 6 },
      { slug: 'las-anstallningsavtal', minuter: 3 },
      { slug: 'kollektivavtal-vad-det-betyder', minuter: 5 },
      { slug: 'facket-ska-jag-ga-med', minuter: 4 },
      { slug: 'sjuklon-karens-och-vab', minuter: 4 },
      { slug: 'diskriminering-jobbsokning', minuter: 3 },
    ],
  },
  {
    id: 'samhallet',
    namn: 'Samhället och din vardagsekonomi',
    beskrivning: 'Digitala tjänster, skatt på lönen, bostadsbidrag och vad du kan göra om pengarna inte räcker.',
    delar: [
      { slug: 'digitala-tjanster-du-behover', minuter: 4 },
      { slug: 'skatt-pa-lon-forsta-jobbet', minuter: 4 },
      { slug: 'bostadsbidrag-och-boendekostnad', minuter: 4 },
      { slug: 'skulder-och-kronofogden', minuter: 4 },
      { slug: 'forsorjningsstod-nar-pengarna-tar-slut', minuter: 4 },
    ],
  },
  {
    id: 'myndigheterna',
    namn: 'Myndigheterna och dina rättigheter',
    beskrivning: 'Arbetsförmedlingen, a-kassan och vad du gör om du inte håller med om ett beslut.',
    delar: [
      { slug: 'skriva-in-dig-arbetsformedlingen', minuter: 4 },
      { slug: 'din-planering-hos-arbetsformedlingen', minuter: 5 },
      { slug: 'aktivitetsrapport-guide', minuter: 4 },
      { slug: 'a-kassa-sa-fungerar-det', minuter: 5 },
      { slug: 'overklaga-ett-beslut', minuter: 4 },
    ],
  },
]

/** Uppskattad tid i minuter: summan av lästiderna, uppåt till närmaste 5. */
export function kursMinuter(delar: readonly Pick<KursDel, 'minuter'>[]): number {
  const summa = delar.reduce((s, d) => s + d.minuter, 0)
  return Math.ceil(summa / 5) * 5
}

export interface KursStatus {
  totalt: number
  klara: number
  /** Sant först när kursen har minst en del och alla delar är lästa. */
  genomford: boolean
  paborjad: boolean
}

/** `lasta` = slugs med `is_completed` i article_reading_progress. */
export function kursStatus(delar: readonly Pick<KursDel, 'slug'>[], lasta: ReadonlySet<string>): KursStatus {
  const klara = delar.filter((d) => lasta.has(d.slug)).length
  return { totalt: delar.length, klara, genomford: delar.length > 0 && klara === delar.length, paborjad: klara > 0 }
}

/** "HH:MM" + minuter, kapad vid 23:59 så att slut aldrig hamnar före start. */
export function laggTillMinuter(hhmm: string, minuter: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const tot = Math.min(h * 60 + m + minuter, 23 * 60 + 59)
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}

/**
 * Det en kurs fyller i i "Lägg till pass". Typen är 'motivation' (lagens p. 1:
 * öka förmågan att ta arbete) — konsulenten kan ändra den i formuläret.
 */
export function kursTillPass(kurs: Kurs, start: string): { title: string; activity_type: 'motivation'; start_time: string; end_time: string } {
  return {
    title: `Kurs: ${kurs.namn}`,
    activity_type: 'motivation',
    start_time: start,
    end_time: laggTillMinuter(start, kursMinuter(kurs.delar)),
  }
}
