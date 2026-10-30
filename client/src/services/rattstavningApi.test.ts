import { describe, it, expect, vi, beforeEach } from 'vitest'

const callAI = vi.fn()
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))

import { foreslaRattningar } from './rattstavningApi'

const ogiltig = () => Object.assign(new Error('AI-svaret gick inte att tolka.'), { kod: 'AI_INVALID_RESPONSE' })
const felVid = async (f: () => Promise<unknown>): Promise<string> => {
  try { await f(); return 'inget fel' } catch (e) { return (e as Error).message }
}
const svar = { rattning: { andringar: [{ fore: 'noggran', efter: 'noggrann' }] } }

describe('foreslaRattningar: ett nytt försök vid ogiltig JSON', () => {
  beforeEach(() => { callAI.mockReset() })

  it('försöker en gång till när modellen skrev ogiltig JSON (var sjätte gång i prod)', async () => {
    callAI.mockRejectedValueOnce(ogiltig()).mockResolvedValueOnce(svar)
    await expect(foreslaRattningar('Jag är noggran.')).resolves.toEqual([{ fore: 'noggran', efter: 'noggrann' }])
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('försöker bara en gång till', async () => {
    callAI.mockImplementation(async () => { throw ogiltig() })
    expect(await felVid(() => foreslaRattningar('Jag är noggran.'))).toMatch(/tolka/)
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('försöker inte igen vid andra fel (AI av, samtycke, nätverk)', async () => {
    callAI.mockImplementation(async () => { throw new Error('AI är avstängt') })
    expect(await felVid(() => foreslaRattningar('Jag är noggran.'))).toMatch(/avstängt/)
    expect(callAI).toHaveBeenCalledTimes(1)
  })
})
