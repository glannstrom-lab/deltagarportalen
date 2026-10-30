import { describe, it, expect, vi, beforeEach } from 'vitest'

const callAI = vi.fn()
const getCV = vi.fn()
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))
vi.mock('@/services/cvApi', () => ({ cvApi: { getCV: () => getCV() } }))

import { byggCvUnderlag, hamtaMatchskal, rensaMatchskalCache } from './matchskalApi'

const CV = {
  firstName: 'Anna', lastName: 'Svensson', email: 'anna@example.com', phone: '070-1234567',
  title: 'Lagerarbetare',
  summary: 'Van vid lager.',
  skills: [{ id: '1', name: 'Truckkort A', level: 3, category: 'Teknik' }, { id: '2', name: 'Excel', level: 2, category: 'Dator' }],
  workExperience: [{ id: 'w', title: 'Lagerarbetare', company: 'Nordfrakt', startDate: '2020-01', description: 'Plock och pack.' }],
  education: [{ id: 'e', degree: 'Gymnasium', school: 'Borås', startDate: '2010' }],
}
const ANNONS = { id: 'a1', titel: 'Lager', foretag: 'X', text: 'Vi söker en lagerarbetare. Truckkort A krävs. Körkort B är ett krav.' }

beforeEach(() => {
  callAI.mockReset()
  getCV.mockReset()
  rensaMatchskalCache()
})

describe('byggCvUnderlag', () => {
  it('läser kompetenser som objekt och tar inte med namn eller kontaktuppgifter', () => {
    const t = byggCvUnderlag(CV as never)
    expect(t).toContain('Kompetenser: Truckkort A, Excel')
    expect(t).toContain('Erfarenhet: Lagerarbetare på Nordfrakt. Plock och pack.')
    expect(t).not.toMatch(/Anna|Svensson|anna@|070-/)
    expect(t).not.toContain('undefined')
    expect(t).not.toContain('[object Object]')
  })

  it('läser även snake_case work_experience och strängkompetenser', () => {
    const t = byggCvUnderlag({ skills: ['Excel'], work_experience: [{ id: '1', title: 'Chaufför', company: 'Y', startDate: '2019' }] } as never)
    expect(t).toContain('Kompetenser: Excel')
    expect(t).toContain('Erfarenhet: Chaufför på Y')
  })

  it('ger tom text för inget CV', () => {
    expect(byggCvUnderlag(null)).toBe('')
  })
})

describe('hamtaMatchskal', () => {
  it('gör inget AI-anrop utan CV-underlag', async () => {
    getCV.mockResolvedValue(null)
    expect(await hamtaMatchskal(ANNONS)).toEqual({ inteCv: true })
    expect(callAI).not.toHaveBeenCalled()
  })

  it('skickar annons och CV-text, och cachar per annons och CV', async () => {
    getCV.mockResolvedValue(CV)
    callAI.mockResolvedValue({ matchning: { skal: [{ typ: 'saknas', punkt: 'Körkort B', annons: 'Körkort B är ett krav' }] } })
    const a = await hamtaMatchskal(ANNONS)
    const b = await hamtaMatchskal(ANNONS)
    expect(a).toEqual(b)
    expect(callAI).toHaveBeenCalledTimes(1)
    const [fn, data] = callAI.mock.calls[0]
    expect(fn).toBe('annons-matchning')
    expect(data.cvText).toContain('Truckkort A')
    expect(data.annons).toBe(ANNONS.text)

    getCV.mockResolvedValue({ ...CV, skills: [] })
    await hamtaMatchskal(ANNONS)
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('kastar när svaret inte går att läsa', async () => {
    getCV.mockResolvedValue(CV)
    callAI.mockResolvedValue({ matchning: {} })
    await expect(hamtaMatchskal(ANNONS)).rejects.toThrow(/gick inte att läsa/)
  })
})
