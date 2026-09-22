/**
 * Utgående fetch med tidsgräns — ST4 (2026-09-22).
 *
 * VARFÖR FILEN FINNS
 * ------------------
 * Fem AF-proxyer fick ett `AbortController`-timeout i förra passet (SÄK2),
 * men mönstret kopierades för hand per fil, och det gick att missa: sökningen
 * 2026-09-22 hittade ytterligare 25 utgående anrop helt utan tidsgräns —
 * `af-taxonomy` (tre anrop i följd + proxyvägen), `bolagsverket` (OAuth +
 * tre datauppslag), `education-search` (fyra), `af-trends` (en av fyra
 * vägar), alla fem AI-funktionernas OpenRouter-anrop, Bolagsverket-
 * verifieringen i `ai-company-search`, Resend i båda mejlfunktionerna och
 * Vercel Blob i `delete-account`.
 *
 * Ett anrop utan tidsgräns mot en hängande motpart håller edge-instansen
 * tills plattformen dödar den. Då svarar plattformen själv — utan CORS-
 * headrar — och webbläsaren rapporterar ett CORS-fel i stället för orsaken.
 * Klienten har dessutom egna tidsgränser (t.ex. 10 s i `retryService`), så
 * användaren har redan fått ett fel långt innan servern ger upp.
 *
 * VARFÖR `AbortSignal.timeout` OCH INTE `setTimeout` + `clearTimeout`
 * ---------------------------------------------------------------------
 * Mönstret i af-*-filerna rensar timern direkt efter att `fetch()` löst sig,
 * alltså när HEADRARNA kommit. En motpart som skickar headrar och sedan
 * slutar skicka kropp hänger då i `response.json()` utan gräns. Signalen här
 * lever kvar tills den löper ut, och en pågående kroppsläsning avbryts också.
 */

/** AF, JobEd, Bolagsverket: svarar normalt under en sekund. */
export const TIDSGRANS_EXTERN_MS = 8_000

/**
 * OpenRouter. `perplexity/sonar` gör en webbsökning före svaret och kan ta
 * 20–40 s. `ai-company-search` gör två sådana anrop i följd plus
 * Bolagsverket — 2 × 55 + 2 × 8 = 126 s, under plattformens 150 s.
 */
export const TIDSGRANS_AI_MS = 55_000

/** Resend, Vercel Blob. */
export const TIDSGRANS_TJANST_MS = 10_000

/** Kastas när tidsgränsen löpte ut — skiljbar från nät- och HTTP-fel. */
export class TidsgransError extends Error {
  constructor(public readonly url: string, public readonly ms: number) {
    super(`Tidsgränsen ${ms} ms löpte ut mot ${vard(url)}`)
    this.name = 'TidsgransError'
  }
}

/** Bara värdnamnet i felmeddelanden — söksträngar i URL:en kan bära fritext. */
function vard(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'okänd motpart'
  }
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

/**
 * `fetch` med tidsgräns. Samma signatur som `fetch` plus `ms`.
 *
 * @param fetchImpl Bara för test — produktion använder den globala `fetch`.
 */
export async function fetchMedTimeout(
  url: string,
  init: RequestInit = {},
  ms: number = TIDSGRANS_EXTERN_MS,
  fetchImpl?: FetchFn,
): Promise<Response> {
  const utfor: FetchFn = fetchImpl ?? globalThis.fetch
  const tidsgrans = AbortSignal.timeout(ms)
  const signal = init.signal ? AbortSignal.any([init.signal, tidsgrans]) : tidsgrans
  try {
    return await utfor(url, { ...init, signal })
  } catch (err) {
    if (tidsgrans.aborted) throw new TidsgransError(url, ms)
    throw err
  }
}
