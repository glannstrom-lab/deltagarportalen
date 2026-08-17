/**
 * Tester för edge-funktionernas delade CORS-lager (DR1, genomgången 2026-08-17).
 *
 * Det här är den första testfilen som rör `supabase/functions/` överhuvudtaget.
 * Skälet att den behövs: `send-inactivity-warning` svarade **403 för varje
 * verklig anropare** i drift, och ingenting kunde larma. Cron-vakten var rätt
 * byggd och fail closed — men CORS-lagret avvisade `null`-origin innan vakten
 * hann synas utåt, och en cron skickar aldrig en `Origin`-header.
 *
 * Reproducerat mot prod före fixen:
 *   utan Origin → 403 {"error":"Origin not allowed"}
 *   med Origin  → 503 {"error":"Cron authentication not configured"}
 *
 * Roadmapen (A25) trodde att felet enbart var att `CRON_SECRET` aldrig sattes.
 * Testerna nedan låser fast att båda halvorna är lösta: maskinanrop kommer fram
 * till auth-grinden, och webbläsare med okänd eller sandlådad origin gör det inte.
 *
 * `cors.ts` är Deno-kod men använder bara `Deno.env.get`, så en stub räcker —
 * ingen Deno-runtime behövs för att köra den under vitest.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Stubbar Deno innan modulen laddas — `cors.ts` läser Deno.env vid anrop,
// inte vid import, men stubben måste finnas när funktionerna körs.
const denoStub = { env: { get: vi.fn(() => undefined as string | undefined) } }

beforeEach(() => {
  ;(globalThis as Record<string, unknown>).Deno = denoStub
  denoStub.env.get.mockReturnValue(undefined) // produktionsläge
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).Deno
  vi.restoreAllMocks()
})

async function cors() {
  return await import('../../../supabase/functions/_shared/cors.ts')
}

function req(origin: string | null, method = 'POST') {
  const headers = new Headers()
  if (origin !== null) headers.set('Origin', origin)
  return new Request('https://example.test/fn', { method, headers })
}

describe('maskinanrop (ingen Origin-header) släpps igenom', () => {
  it('arServerAnrop skiljer saknad header från strängen "null"', async () => {
    const { arServerAnrop } = await cors()
    expect(arServerAnrop(null)).toBe(true)
    // En sandlådad webbläsarkontext skickar den LITTERALA strängen "null".
    // Den är ett webbläsaranrop och ska inte behandlas som en server.
    expect(arServerAnrop('null')).toBe(false)
    expect(arServerAnrop('https://www.jobin.se')).toBe(false)
  })

  it('getCorsHeaders ger tomma headers i stället för null', async () => {
    const { getCorsHeaders } = await cors()
    // Tomt objekt, inte null: anropare gör `if (!headers) return 403`.
    expect(getCorsHeaders(null)).toEqual({})
  })

  it('REGRESSION DR1: createCorsResponse 403:ar inte längre ett cron-anrop', async () => {
    const { createCorsResponse } = await cors()
    // Exakt vad send-inactivity-warning gör när cron-vakten säger 503.
    const svar = createCorsResponse({ error: 'Cron authentication not configured' }, 503, null)
    expect(svar.status).toBe(503) // inte 403
    const body = await svar.json()
    expect(body.error).not.toBe('Origin not allowed')
  })

  it('ett lyckat cron-svar kommer fram med status 200', async () => {
    const { createCorsResponse } = await cors()
    const svar = createCorsResponse({ processed: 3 }, 200, null)
    expect(svar.status).toBe(200)
    expect(await svar.json()).toEqual({ processed: 3 })
  })

  it('validateOriginOrReject släpper igenom — funktionens egen auth är grinden', async () => {
    const { validateOriginOrReject } = await cors()
    expect(validateOriginOrReject(req(null))).toBeNull()
  })
})

describe('webbläsaranrop bedöms fortfarande strikt', () => {
  it('tillåten origin får CORS-headers', async () => {
    const { getCorsHeaders } = await cors()
    const h = getCorsHeaders('https://www.jobin.se')
    expect(h).not.toBeNull()
    expect(h!['Access-Control-Allow-Origin']).toBe('https://www.jobin.se')
    expect(h!['Vary']).toBe('Origin')
  })

  it('okänd origin nekas', async () => {
    const { getCorsHeaders, validateOriginOrReject } = await cors()
    expect(getCorsHeaders('https://elak.example')).toBeNull()
    const svar = validateOriginOrReject(req('https://elak.example'))
    expect(svar).not.toBeNull()
    expect(svar!.status).toBe(403)
  })

  it('sandlådad kontext (Origin: "null") nekas', async () => {
    // Viktig gräns: strängen "null" är ett webbläsaranrop från en iframe med
    // sandbox eller en data:-URL. Den ska INTE behandlas som ett maskinanrop.
    const { getCorsHeaders, validateOriginOrReject } = await cors()
    expect(getCorsHeaders('null')).toBeNull()
    expect(validateOriginOrReject(req('null'))!.status).toBe(403)
  })

  it('createCorsResponse 403:ar fortfarande en okänd origin', async () => {
    const { createCorsResponse } = await cors()
    const svar = createCorsResponse({ processed: 3 }, 200, 'https://elak.example')
    expect(svar.status).toBe(403)
    expect((await svar.json()).error).toBe('Origin not allowed')
  })
})

describe('preflight', () => {
  it('OPTIONS från tillåten origin svarar ok', async () => {
    const { handleCorsPreflightOrNull } = await cors()
    const svar = handleCorsPreflightOrNull(req('https://www.jobin.se', 'OPTIONS'))
    expect(svar).not.toBeNull()
    expect(svar!.status).toBe(200)
  })

  it('OPTIONS från okänd origin nekas', async () => {
    const { handleCorsPreflightOrNull } = await cors()
    expect(handleCorsPreflightOrNull(req('https://elak.example', 'OPTIONS'))!.status).toBe(403)
  })

  it('POST returnerar null så anropet fortsätter till auth', async () => {
    const { handleCorsPreflightOrNull } = await cors()
    expect(handleCorsPreflightOrNull(req('https://www.jobin.se'))).toBeNull()
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('den gamla implementationen hade gett 403 på maskinanrop', async () => {
    const { isOriginAllowed } = await cors()
    // Gamla getCorsHeaders var i praktiken: `if (!isOriginAllowed(o)) return null`.
    // Att isOriginAllowed(null) fortfarande är false är själva förutsättningen
    // för buggen — fixen ligger i att arServerAnrop kollas FÖRE den.
    expect(isOriginAllowed(null)).toBe(false)
  })
})
