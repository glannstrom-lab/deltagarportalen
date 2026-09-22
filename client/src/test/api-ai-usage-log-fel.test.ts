/**
 * `logAiUsage` svalde insert-fel tyst (2026-09-22).
 *
 * supabase-js kastar inte vid ett PostgREST-fel — den returnerar `{ error }`.
 * Insertet stod i en try/catch som därför aldrig fångade något. Tabellen är
 * det `checkDailyTokenCap` summerar, så ett schemafel eller en återkallad
 * rättighet hade stängt av tokentaket utan en enda loggrad.
 *
 * Policyn är fail open (felet kostar pengar, inte en rättighet), men högljutt:
 * console.error + Sentry. Testet kräver båda, och att funktionen aldrig kastar.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

const MODUL = path.resolve(__dirname, '../../api/_utils/ai-usage-log.js')
const ENV_KEYS = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SENTRY_DSN']
const saved: Record<string, string | undefined> = {}
const originalFetch = global.fetch

function laddaFarsk(): { logAiUsage: (...a: unknown[]) => Promise<unknown> } {
  // Modulen läser env och cachar klienten vid laddning — ladda om per test.
  delete require.cache[MODUL]
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(MODUL)
}

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.VITE_SUPABASE_URL = 'https://stub.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-stub'
  process.env.SENTRY_DSN = 'https://publik@o1.ingest.sentry.io/42'
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

function stubba(insertStatus: number) {
  const sentry: string[] = []
  global.fetch = vi.fn(async (input: unknown, init?: { body?: string }) => {
    const url = String(typeof input === 'string' ? input : (input as { url: string }).url)
    if (url.includes('sentry.io')) {
      sentry.push(String(init?.body || ''))
      return new Response('{}', { status: 200 })
    }
    if (url.includes('/rest/v1/ai_usage_logs')) {
      if (insertStatus >= 400) {
        return new Response(
          JSON.stringify({ code: '42703', message: 'column "tokens_used" does not exist' }),
          { status: insertStatus, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(null, { status: 201 })
    }
    throw new Error(`Oväntat nätverksanrop: ${url}`)
  }) as unknown as typeof fetch
  return { sentry }
}

describe('logAiUsage larmar när raden inte skrivs', () => {
  it('PostgREST-fel → console.error + Sentry-händelse, och inget kast', async () => {
    const { sentry } = stubba(400)
    const fel = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logAiUsage } = laddaFarsk()

    const utfall = await logAiUsage('u1', 'ai-team-chat', 'openai/gpt-oss-120b', 120)

    expect(fel.mock.calls.flat().join(' ')).toMatch(/\[ai-usage-log\].*tokentaket/)
    expect(sentry).toHaveLength(1)
    expect(sentry[0]).toContain('TokenloggFel')
    expect(sentry[0]).toContain('42703')
    expect(utfall).toBe(false)
  })

  it('lyckat insert → true, inget larm', async () => {
    const { sentry } = stubba(201)
    const fel = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logAiUsage } = laddaFarsk()

    const utfall = await logAiUsage('u1', 'chatbot', 'openai/gpt-oss-120b', 10)

    expect(utfall).toBe(true)
    expect(fel).not.toHaveBeenCalled()
    expect(sentry).toHaveLength(0)
  })
})
