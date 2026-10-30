import { describe, it, expect, vi, beforeEach } from 'vitest'

const callAI = vi.fn()
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))

import { foreslaFranVardag } from './vardagApi'

const ogiltig = () => Object.assign(new Error('AI-svaret gick inte att tolka.'), { kod: 'AI_INVALID_RESPONSE' })
const SVAR = [{ fraga: 'F?', text: 'Jag hjälpte grannen med trädgården.' }]
const forslag = { titel: 'Trädgårdshjälp', organisation: '', beskrivning: 'Hjälpte en granne.', citat: 'Jag hjälpte grannen' }

describe('foreslaFranVardag', () => {
  beforeEach(() => { callAI.mockReset() })

  it('returnerar förslagen från servern', async () => {
    callAI.mockResolvedValue({ vardag: { forslag: [forslag, { titel: '' }] } })
    await expect(foreslaFranVardag(SVAR)).resolves.toEqual({ typ: 'forslag', forslag: [forslag] })
  })

  it('anropar inte AI alls när svaren nämner hälsa', async () => {
    const r = await foreslaFranVardag([{ fraga: 'F?', text: 'Jag tog hand om min sjuka mamma.' }])
    expect(r.typ).toBe('halsa')
    expect(callAI).not.toHaveBeenCalled()
  })

  it('anropar inte AI när alla svar är tomma', async () => {
    await expect(foreslaFranVardag([{ fraga: 'F?', text: '  ' }])).resolves.toEqual({ typ: 'forslag', forslag: [] })
    expect(callAI).not.toHaveBeenCalled()
  })

  it('tolkar serverns avvisning (hälsa som klientens lista missade)', async () => {
    callAI.mockResolvedValue({ vardag: { avvisad: 'halsa', forslag: [] } })
    expect((await foreslaFranVardag(SVAR)).typ).toBe('halsa')
  })

  it('försöker en gång till vid ogiltig JSON, men bara en gång', async () => {
    callAI.mockRejectedValueOnce(ogiltig()).mockResolvedValueOnce({ vardag: { forslag: [forslag] } })
    await foreslaFranVardag(SVAR)
    expect(callAI).toHaveBeenCalledTimes(2)
    callAI.mockReset()
    callAI.mockImplementation(async () => { throw ogiltig() })
    await expect(foreslaFranVardag(SVAR)).rejects.toThrow(/tolka/)
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('försöker inte igen vid andra fel', async () => {
    callAI.mockImplementation(async () => { throw new Error('AI är avstängt') })
    await expect(foreslaFranVardag(SVAR)).rejects.toThrow(/avstängt/)
    expect(callAI).toHaveBeenCalledTimes(1)
  })
})
