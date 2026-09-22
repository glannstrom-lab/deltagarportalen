/**
 * Ett AF-API som slutar svara får inte bli en spinner utan slut.
 *
 * `fetchFromAF` saknade signal — ett anrop som aldrig besvarades hängde för
 * evigt, och searchJobs' felväg (som redan kastar, se CLAUDE.md "searchJobs
 * KASTAR nu") nåddes aldrig. Deltagaren såg "Söker…" tills hon gav upp.
 *
 * Mocken nedan beter sig som en riktig hängande server: den svarar aldrig,
 * men respekterar signalen precis som webbläsarens fetch gör.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  jobLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { searchJobs, getJobDetails, AF_TIMEOUT_MS } from './arbetsformedlingenApi'

function hangandeFetch() {
  return vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal
    if (!signal) return // utan signal: hänger för evigt, precis som förr
    signal.addEventListener('abort', () => reject(signal.reason ?? new DOMException('aborted', 'AbortError')))
  }))
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('AF-anropen har en tidsgräns', () => {
  it('searchJobs kastar när AF inte svarar, i stället för att hänga', async () => {
    vi.useFakeTimers()
    const fetchMock = hangandeFetch()
    vi.stubGlobal('fetch', fetchMock)

    const svar = searchJobs({ query: 'timeout-test-sok' })
    const utfall = expect(svar).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(AF_TIMEOUT_MS + 100)
    await utfall

    const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('getJobDetails blir klar (null) i stället för att hänga — samma hjälpfunktion', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', hangandeFetch())

    // getJobDetails fångar själv och ger null — det viktiga är att löftet AVGÖRS.
    const svar = getJobDetails('timeout-test-annons')
    const utfall = expect(svar).resolves.toBeNull()
    await vi.advanceTimersByTimeAsync(AF_TIMEOUT_MS + 100)
    await utfall
  })

  it('tidsgränsen är generös nog för ett långsamt men levande API', () => {
    expect(AF_TIMEOUT_MS).toBeGreaterThanOrEqual(10_000)
  })
})
