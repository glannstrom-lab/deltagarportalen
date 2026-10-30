import { describe, it, expect, vi, beforeEach } from 'vitest'

const callAI = vi.fn()
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))

import { rensaTal, laggTillText } from './talApi'

const ogiltig = () => Object.assign(new Error('AI-svaret gick inte att tolka.'), { kod: 'AI_INVALID_RESPONSE' })
const felVid = async (f: () => Promise<unknown>): Promise<string> => {
  try { await f(); return 'inget fel' } catch (e) { return (e as Error).message }
}

describe('rensaTal', () => {
  beforeEach(() => { callAI.mockReset() })

  it('returnerar den rensade texten ur platta objektet', async () => {
    callAI.mockResolvedValue({ rensning: { rensad: ' Jag är noggrann. ' } })
    await expect(rensaTal('eh jag är noggrann')).resolves.toBe('Jag är noggrann.')
    expect(callAI).toHaveBeenCalledWith('rensa-tal', { text: 'eh jag är noggrann' })
  })

  it('försöker en gång till vid ogiltig JSON, men bara en gång', async () => {
    callAI.mockRejectedValueOnce(ogiltig()).mockResolvedValueOnce({ rensning: { rensad: 'Hej.' } })
    await expect(rensaTal('hej')).resolves.toBe('Hej.')
    expect(callAI).toHaveBeenCalledTimes(2)
    callAI.mockReset()
    callAI.mockImplementation(async () => { throw ogiltig() })
    expect(await felVid(() => rensaTal('hej'))).toMatch(/tolka/)
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('försöker inte igen vid andra fel', async () => {
    callAI.mockImplementation(async () => { throw new Error('AI är avstängt') })
    expect(await felVid(() => rensaTal('hej'))).toMatch(/avstängt/)
    expect(callAI).toHaveBeenCalledTimes(1)
  })

  it('kastar vid ett svar utan text och anropar inte alls vid tom inmatning', async () => {
    callAI.mockResolvedValue({ rensning: {} })
    expect(await felVid(() => rensaTal('hej'))).toMatch(/gick inte att läsa/)
    callAI.mockReset()
    expect(await felVid(() => rensaTal('   '))).toMatch(/ingen text/)
    expect(callAI).not.toHaveBeenCalled()
  })
})

describe('laggTillText', () => {
  it('lägger sist med ett mellanrum, eller ensamt i ett tomt fält', () => {
    expect(laggTillText('Hej.', 'Jag söker jobb.')).toBe('Hej. Jag söker jobb.')
    expect(laggTillText('Hej.  \n', 'Nytt.')).toBe('Hej. Nytt.')
    expect(laggTillText('', 'Nytt.')).toBe('Nytt.')
    expect(laggTillText('Hej.', '  ')).toBe('Hej.')
  })
})
