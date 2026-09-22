/**
 * ST4 (2026-09-22): tidsgränsen på utgående anrop.
 *
 * Kör: npx -y deno@2.9.6 test supabase/functions/_shared/fetchMedTimeout.test.ts
 *
 * Två delar:
 *  1. `fetchMedTimeout` beter sig rätt (avbryter, släpper igenom, skiljer fel åt).
 *  2. GRIND: varje `fetch(` i supabase/functions bär en signal. Förra passet
 *     (SÄK2) lade timeout i fem filer för hand och vaktade dem med ett test som
 *     bara krävde att filen innehöll *någon* AbortController — `af-trends`
 *     klarade det testet medan dess väg /trending-skills saknade tidsgräns.
 *     Den här grinden läser varje anrop för sig.
 */

import {
  fetchMedTimeout,
  TidsgransError,
} from './fetchMedTimeout.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

/** En motpart som aldrig svarar — men respekterar signalen, som riktiga fetch gör. */
function hangande(): (url: string, init?: RequestInit) => Promise<Response> {
  return (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
}

Deno.test('fetchMedTimeout: en hängande motpart ger TidsgransError efter tidsgränsen', async () => {
  const start = Date.now()
  let fel: unknown
  try {
    await fetchMedTimeout('https://jobsearch.api.jobtechdev.se/search?q=hemlig+text', {}, 50, hangande())
  } catch (e) {
    fel = e
  }
  const tid = Date.now() - start
  assert(fel instanceof TidsgransError, `väntade TidsgransError, fick ${String(fel)}`)
  assert(tid < 2000, `tog ${tid} ms — tidsgränsen verkade inte`)
  // Söksträngen får inte följa med i felmeddelandet (det loggas och kan nå Sentry).
  assert(!(fel as Error).message.includes('hemlig'), 'felmeddelandet bär söksträngen')
})

Deno.test('fetchMedTimeout: ett svar i tid släpps igenom orört', async () => {
  const svar = await fetchMedTimeout('https://x.test/', {}, 1000, () =>
    Promise.resolve(new Response('ok', { status: 201 })))
  assert(svar.status === 201, `status ${svar.status}`)
  assert((await svar.text()) === 'ok', 'kroppen ändrades')
})

Deno.test('fetchMedTimeout: ett nätfel före tidsgränsen kastas som det är', async () => {
  let fel: unknown
  try {
    await fetchMedTimeout('https://x.test/', {}, 1000, () => Promise.reject(new TypeError('dns')))
  } catch (e) {
    fel = e
  }
  assert(fel instanceof TypeError && !(fel instanceof TidsgransError), `fick ${String(fel)}`)
})

Deno.test('fetchMedTimeout: signalen skickas faktiskt till fetch', async () => {
  let fick: AbortSignal | undefined | null
  await fetchMedTimeout('https://x.test/', { method: 'POST' }, 1000, (_u, init) => {
    fick = init?.signal
    return Promise.resolve(new Response('ok'))
  })
  assert(fick instanceof AbortSignal, 'ingen signal skickades med')
})

// ─── GRIND ────────────────────────────────────────────────────────────────

const ROT = new URL('../', import.meta.url)

function allaKallfiler(dir: URL): URL[] {
  const ut: URL[] = []
  for (const post of Deno.readDirSync(dir)) {
    if (post.name === 'node_modules' || post.name.startsWith('.')) continue
    const url = new URL(post.name + (post.isDirectory ? '/' : ''), dir)
    if (post.isDirectory) ut.push(...allaKallfiler(url))
    else if (/\.ts$/.test(post.name) && !/\.test\.ts$/.test(post.name)) ut.push(url)
  }
  return ut
}

/** Tar bort block- och radkommentarer så att `fetch(` i en förklaring inte räknas. */
function utanKommentarer(kalla: string): string {
  // Kommentarer ersätts med blanksteg, inte tas bort — radnumren i felrapporten ska stämma.
  const blanka = (m: string) => m.replace(/[^\n]/g, ' ')
  return kalla
    .replace(/\/\*[\s\S]*?\*\//g, blanka)
    .replace(/(^|[^:'"`])(\/\/.*)$/gm, (_m, fore: string, kommentar: string) => fore + blanka(kommentar))
}

/** Texten i ett anrop, från öppnande parentes till den matchande stängande. */
function anropstext(kalla: string, start: number): string {
  let djup = 0
  for (let i = start; i < kalla.length; i++) {
    if (kalla[i] === '(') djup++
    else if (kalla[i] === ')') {
      djup--
      if (djup === 0) return kalla.slice(start, i + 1)
    }
  }
  return kalla.slice(start)
}

/** Varje `fetch(` utan signal, som `fil:rad`. Exporterad logik testas nedan. */
export function anropUtanSignal(kalla: string, filnamn: string): string[] {
  const kod = utanKommentarer(kalla)
  const brister: string[] = []
  // `\bfetch\(` — inte fetchMedTimeout( eller fetchJobSearch(; `.fetch(` räknas också.
  for (const m of kod.matchAll(/(?<![\w$])fetch\s*\(/g)) {
    const text = anropstext(kod, m.index! + m[0].length - 1)
    if (!/\bsignal\b/.test(text)) {
      const rad = kod.slice(0, m.index).split('\n').length
      brister.push(`${filnamn}:${rad}`)
    }
  }
  return brister
}

Deno.test('GRIND: varje fetch( i supabase/functions har en tidsgräns', () => {
  const brister = allaKallfiler(ROT).flatMap((url) =>
    anropUtanSignal(Deno.readTextFileSync(url), url.pathname.split('/functions/')[1]))
  assert(
    brister.length === 0,
    `Utgående anrop utan tidsgräns — använd fetchMedTimeout ur _shared/fetchMedTimeout.ts:\n  ${brister.join('\n  ')}`,
  )
})

Deno.test('GRIND-kontroll: detektorn fäller ett anrop utan signal och släpper ett med', () => {
  // Utan den här kontrollen kan grinden ovan vara grön för att den inte ser något.
  assert(anropUtanSignal("const r = await fetch(url, { headers: {} })", 'x').length === 1, 'missade rå fetch')
  assert(anropUtanSignal("await fetch(url, { signal: controller.signal })", 'x').length === 0, 'fällde fetch med signal')
  assert(anropUtanSignal("await fetchMedTimeout(url, {})", 'x').length === 0, 'fällde fetchMedTimeout')
  assert(anropUtanSignal("await fetchJobSearch(url)", 'x').length === 0, 'fällde fetchJobSearch')
  assert(anropUtanSignal("// await fetch(url)\n", 'x').length === 0, 'fällde en kommentar')
})
