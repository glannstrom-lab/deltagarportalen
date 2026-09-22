/**
 * af-taxonomy: tidsgräns och fel som inte får se ut som "inga yrken" (ST4, 2026-09-22).
 *
 * Kör: npx -y deno@2.9.6 test supabase/functions/af-taxonomy/kallor.test.ts
 */

import { getOccupations } from './kallor.ts'

function assert(villkor: unknown, meddelande: string): asserts villkor {
  if (!villkor) throw new Error(meddelande)
}

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

/** Svarar per källa enligt tabellen; 'hang' respekterar signalen som riktiga fetch. */
function fejkFetch(svar: Record<'search' | 'taxonomy' | 'complete', 'hang' | 'fel' | 'tom' | 'traff'>): FetchFn {
  return (url, init) => {
    const kalla = url.includes('/search?') ? 'search' : url.includes('/complete?') ? 'complete' : 'taxonomy'
    const lage = svar[kalla]
    if (lage === 'hang') {
      return new Promise((_r, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    }
    if (lage === 'fel') return Promise.resolve(new Response('upstream', { status: 503 }))
    const kropp = kalla === 'search'
      ? { hits: lage === 'traff' ? [{ occupation: { concept_id: 'abc', label: 'Undersköterska' } }] : [] }
      : kalla === 'complete'
        ? { typeahead: lage === 'traff' ? [{ type: 'occupation', value: 'undersköterska' }] : [] }
        : lage === 'traff' ? [{ id: 'x1', preferred_label: 'Undersköterska' }] : []
    return Promise.resolve(new Response(JSON.stringify(kropp), { status: 200 }))
  }
}

Deno.test('tre hängande källor: uppslaget ger upp inom budgeten i stället för att hänga', async () => {
  const start = Date.now()
  const r = await getOccupations('underskoterska', 10, {
    fetchImpl: fejkFetch({ search: 'hang', taxonomy: 'hang', complete: 'hang' }),
    tidsbudgetMs: 300,
    maxPerKallaMs: 100,
  })
  const tid = Date.now() - start
  assert(tid < 1500, `tog ${tid} ms — tidsgränsen verkade inte`)
  assert(r.allaFel === true, 'tre hängande källor rapporterades inte som fel')
})

Deno.test('alla tre källorna svarar fel: allaFel = true (index.ts svarar då 502, inte 200 med tom lista)', async () => {
  const r = await getOccupations('underskoterska', 10, {
    fetchImpl: fejkFetch({ search: 'fel', taxonomy: 'fel', complete: 'fel' }),
  })
  assert(r.concepts.length === 0, 'fick träffar ur fel')
  assert(r.allaFel === true, 'ett totalt avbrott såg ut som "inga träffar"')
})

Deno.test('källorna svarar men utan träffar: allaFel = false — det är ett riktigt tomt svar', async () => {
  const r = await getOccupations('xyzqwv', 10, {
    fetchImpl: fejkFetch({ search: 'tom', taxonomy: 'tom', complete: 'tom' }),
  })
  assert(r.concepts.length === 0 && r.allaFel === false && r.source === 'none', JSON.stringify(r))
})

Deno.test('första källan hänger, andra svarar: träffen kommer fram inom budgeten', async () => {
  const r = await getOccupations('underskoterska', 10, {
    fetchImpl: fejkFetch({ search: 'hang', taxonomy: 'traff', complete: 'tom' }),
    tidsbudgetMs: 1000,
    maxPerKallaMs: 100,
  })
  assert(r.source === 'taxonomy-api' && r.concepts.length === 1, JSON.stringify(r))
})

Deno.test('en källa fel och en tom: inte allaFel (någon svarade)', async () => {
  const r = await getOccupations('underskoterska', 10, {
    fetchImpl: fejkFetch({ search: 'fel', taxonomy: 'tom', complete: 'fel' }),
  })
  assert(r.allaFel === false, 'ett svar från en källa räknades som totalt avbrott')
})
