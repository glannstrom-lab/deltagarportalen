import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 't' } } })) } },
}))
import { generateServerCV, CV_PDF_FEL } from './serverCvPdf'

const svar = (status: number, body: BodyInit = 'pdf') => new Response(body, { status })

describe('generateServerCV (SV2)', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('försöker igen efter 500 och lyckas', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(svar(500, '{}'))
      .mockResolvedValueOnce(svar(200))
    const blob = await generateServerCV('sidebar', undefined, 0)
    expect(f).toHaveBeenCalledTimes(2)
    // Inte toBeInstanceOf(Blob): i CI kommer Response.blob() från Nodes Blob, inte jsdoms — två klasser.
    expect(blob.size).toBeGreaterThan(0)
  })
  it('försöker igen efter nätverksfel', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(svar(200))
    await generateServerCV('sidebar', undefined, 0)
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('kastar läsbart fel när omförsöket också faller', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(svar(500, '{}'))
    await expect(generateServerCV('sidebar', undefined, 0)).rejects.toThrow(CV_PDF_FEL)
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('försöker inte igen vid 4xx', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(svar(429, '{"error":"För många"}'))
    await expect(generateServerCV('sidebar', undefined, 0)).rejects.toThrow('För många')
    expect(f).toHaveBeenCalledTimes(1)
  })
})
