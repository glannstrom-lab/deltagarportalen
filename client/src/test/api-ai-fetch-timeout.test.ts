/**
 * fetchWithRetry i api/ai.js hade ingen tidsgräns (2026-09-29): ett OpenRouter
 * som hängde höll funktionen till Vercels maxDuration. Nu har varje försök en
 * egen gräns och hela anropet en gemensam budget.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetchWithRetry } = require('../../api/ai.js') as {
  fetchWithRetry: (u: string, o: object, r?: number, forsokMs?: number, totalMs?: number) => Promise<Response>
}
const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks() })

describe('fetchWithRetry tidsgräns', () => {
  it('avbryter en hängande begäran och kastar i stället för att vänta för evigt', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    let fick: AbortSignal | undefined
    global.fetch = vi.fn((_u: unknown, init?: { signal?: AbortSignal }) => {
      fick = init?.signal
      return new Promise((_res, rej) => {
        init?.signal?.addEventListener('abort', () => rej(new Error('avbruten')))
      })
    }) as unknown as typeof fetch
    await expect(fetchWithRetry('https://x', {}, 0, 50, 1000)).rejects.toThrow()
    expect(fick).toBeDefined()
  })

  it('retrierar inte när budgeten är slut', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    global.fetch = vi.fn(async () => new Response('x', { status: 503 })) as unknown as typeof fetch
    const r = await fetchWithRetry('https://x', {}, 2, 50, 1000) // backoff 2 s > budget
    expect(r.status).toBe(503)
    expect((global.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(1)
  })
})
