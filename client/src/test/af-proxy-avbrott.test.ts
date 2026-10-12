/**
 * Buggpasset 2026-10-12: AF-proxyerna svarade 200 med tomt resultat vid
 * avbrott uppströms, så ett avbrott såg ut som "inga träffar". Edge-funktionerna
 * går inte att köra under vitest (Deno.serve vid import) — källan läses, som i
 * server-af-proxy-timeout.test.ts. Klientdelen testas på riktigt.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function kalla(f: string): string {
  return readFileSync(resolve(__dirname, `../../../supabase/functions/${f}/index.ts`), 'utf-8')
}

describe('AF-proxyer svarar inte 200 när uppströms faller', () => {
  it('af-jobsearch: fel, timeout och oväntat fel ger 502/504 utan påhittad hits-lista', () => {
    const src = kalla('af-jobsearch')
    expect(src).not.toMatch(/hits:\s*\[\]/)
    expect(src).toMatch(/AF_UPSTREAM_ERROR[\s\S]*?502, corsHeaders/)
    expect(src).toMatch(/AF_TIMEOUT[\s\S]*?504, corsHeaders/)
    expect(src).toMatch(/AF_PROXY_ERROR[\s\S]*?502, corsHeaders/)
  })

  it('af-jobed: uppströmsfel och catch ger 502/504 med felkod', () => {
    const src = kalla('af-jobed')
    expect(src).not.toMatch(/status:\s*200/)
    expect(src).toMatch(/AF_UPSTREAM_ERROR/)
    expect(src).toMatch(/AF_TIMEOUT/)
    expect(src).toMatch(/status:\s*timeoutFel \? 504 : 502/)
  })

  it('af-historical: bara "ingen lönedata" får vara 200, avbrott är 502/504', () => {
    const src = kalla('af-historical')
    expect(src).toMatch(/instanceof IngenLonedataFel/)
    expect(src).toMatch(/status:\s*timeoutFel \? 504 : 502/)
    // den enda 200 som finns kvar i catch hör till no-data-grenen
    const fangst = src.slice(src.lastIndexOf('} catch (error)'))
    expect(fangst.match(/status:\s*200/g)?.length).toBe(1)
  })
})

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } },
}))

describe('getSalaryStats (klient)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('kastar när af-historical svarar 502 i stället för att returnera null ("ingen data")', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"x","code":"AF_UPSTREAM_ERROR"}', { status: 502 })))
    const { getSalaryStats } = await import('@/services/afTrendsApi')
    await expect(getSalaryStats('Svetsare')).rejects.toThrow()
    vi.unstubAllGlobals()
  }, 30000)

  it('returnerar null när AF svarade men annonserna saknar lön (200 + error)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"No salary data found","code":"NO_SALARY_DATA"}', { status: 200 })))
    const { getSalaryStats } = await import('@/services/afTrendsApi')
    await expect(getSalaryStats('Svetsare2')).resolves.toBeNull()
    vi.unstubAllGlobals()
  })
})
