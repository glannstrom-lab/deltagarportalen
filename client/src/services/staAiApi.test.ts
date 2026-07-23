/**
 * Tester för staAiApi — mockar './aiApi' (callAI) och './staApi'
 * (fetchEnrollmentBundle). Fokus: B8-valideringsvägen i generateDocumentDraft
 * (giltigt svar / rå JSON-sträng / trasigt svar → kastar ärligt fel i stället
 * för att tyst rendera trasigt UI) samt generateWeekSummary.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateDocumentDraft, generateWeekSummary, DOC_TYPE_META } from './staAiApi'

const mockCallAI = vi.fn()
const mockFetchEnrollmentBundle = vi.fn()

vi.mock('./aiApi', () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}))

vi.mock('./staApi', () => ({
  fetchEnrollmentBundle: (...args: unknown[]) => mockFetchEnrollmentBundle(...args),
}))

const bundle = { enrollmentId: 'enr-1', participant: { name: 'Test Testsson' } }

beforeEach(() => {
  mockCallAI.mockReset()
  mockFetchEnrollmentBundle.mockReset()
  mockFetchEnrollmentBundle.mockResolvedValue(bundle)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generateDocumentDraft', () => {
  it('returnerar null om ingen enrollment-bundle hittas (avbryter innan AI-anrop)', async () => {
    mockFetchEnrollmentBundle.mockResolvedValue(null)
    const result = await generateDocumentDraft('enr-1', 'initial_planering')
    expect(result).toBeNull()
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('anropar callAI med rätt funktionsnamn + docType/bundle', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      sections: { intro: { title: 'Inledning', content: 'Text' } },
    })
    await generateDocumentDraft('enr-1', 'delredovisning_1')
    expect(mockCallAI).toHaveBeenCalledWith('sta-document-draft', {
      docType: 'delredovisning_1',
      bundle,
    })
  })

  it('kastar response.error om success=false', async () => {
    mockCallAI.mockResolvedValue({ success: false, error: 'AI-tjänsten är nere' })
    await expect(generateDocumentDraft('enr-1', 'initial_planering')).rejects.toThrow(
      'AI-tjänsten är nere'
    )
  })

  it('kastar generiskt fel om success=false utan error-meddelande', async () => {
    mockCallAI.mockResolvedValue({ success: false })
    await expect(generateDocumentDraft('enr-1', 'initial_planering')).rejects.toThrow(
      'Kunde inte generera utkast'
    )
  })

  it('B8: parsear giltigt objekt-svar { sections: {...} } korrekt', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      sections: {
        intro: { title: 'Inledning', content: 'Text om deltagaren' },
        mal: { title: 'Mål', content: 'Målsättning' },
      },
    })
    const result = await generateDocumentDraft('enr-1', 'initial_planering')
    expect(result).toEqual({
      intro: { title: 'Inledning', content: 'Text om deltagaren' },
      mal: { title: 'Mål', content: 'Målsättning' },
    })
  })

  it('B8: parsear en bar sektions-record (utan sections-wrapper)', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      sections: { intro: { title: 'Inledning', content: 'Text' } },
    })
    // simulera att ai.js redan har unwrappat till en bar record
    mockCallAI.mockResolvedValue({
      success: true,
      sections: { intro: { title: 'Inledning', content: 'Text' } },
    })
    const result = await generateDocumentDraft('enr-1', 'initial_planering')
    expect(result).toEqual({ intro: { title: 'Inledning', content: 'Text' } })
  })

  it('B8: parsear rå JSON-sträng som sections-fält', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      sections: JSON.stringify({
        sections: { intro: { title: 'Inledning', content: 'Från strängifierad JSON' } },
      }),
    })
    const result = await generateDocumentDraft('enr-1', 'initial_planering')
    expect(result).toEqual({ intro: { title: 'Inledning', content: 'Från strängifierad JSON' } })
  })

  it('B8: kastar ärligt fel vid trasig (icke-JSON-parsbar) sträng — sparar inget', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      sections: 'inte alls json{{{',
    })
    await expect(generateDocumentDraft('enr-1', 'initial_planering')).rejects.toThrow(
      'AI-utkastet gick inte att tolka. Inget har sparats — försök igen.'
    )
  })

  it('B8: kastar ärligt fel när svaret inte matchar schemat (fel form)', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      // Varken { sections: Record } eller en bar Record<string,{title,content}> —
      // saknar content-fältet som schemat kräver.
      sections: { intro: { title: 'Bara en titel, inget innehåll' } },
    })
    await expect(generateDocumentDraft('enr-1', 'initial_planering')).rejects.toThrow(
      'AI-utkastet gick inte att tolka. Inget har sparats — försök igen.'
    )
  })

  it('B8: kastar ärligt fel på ai.js-fallbacken { raw: "..." } om raw inte är giltig JSON', async () => {
    mockCallAI.mockResolvedValue({
      success: true,
      sections: { raw: 'AI:n svarade med fri text, inte JSON' },
    })
    await expect(generateDocumentDraft('enr-1', 'initial_planering')).rejects.toThrow(
      'AI-utkastet gick inte att tolka. Inget har sparats — försök igen.'
    )
  })

  it('B8: kastar ärligt fel på tomt objekt (0 sektioner parsat)', async () => {
    mockCallAI.mockResolvedValue({ success: true, sections: {} })
    await expect(generateDocumentDraft('enr-1', 'initial_planering')).rejects.toThrow(
      'AI-utkastet gick inte att tolka. Inget har sparats — försök igen.'
    )
  })
})

describe('generateWeekSummary', () => {
  it('returnerar null om ingen enrollment-bundle hittas', async () => {
    mockFetchEnrollmentBundle.mockResolvedValue(null)
    const result = await generateWeekSummary('enr-1')
    expect(result).toBeNull()
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('anropar callAI med sta-week-summary + bundle', async () => {
    mockCallAI.mockResolvedValue({ success: true, summary: 'Bra vecka' })
    await generateWeekSummary('enr-1')
    expect(mockCallAI).toHaveBeenCalledWith('sta-week-summary', { bundle })
  })

  it('returnerar sammanfattningssträngen vid success', async () => {
    mockCallAI.mockResolvedValue({ success: true, summary: 'Veckans sammanfattning' })
    const result = await generateWeekSummary('enr-1')
    expect(result).toBe('Veckans sammanfattning')
  })

  it('kastar response.error om success=false', async () => {
    mockCallAI.mockResolvedValue({ success: false, error: 'Timeout' })
    await expect(generateWeekSummary('enr-1')).rejects.toThrow('Timeout')
  })

  it('kastar generiskt fel om success=false utan error-meddelande', async () => {
    mockCallAI.mockResolvedValue({ success: false })
    await expect(generateWeekSummary('enr-1')).rejects.toThrow('Kunde inte generera sammanställning')
  })

  it('KÄLLKODSOBSERVATION: summary valideras inte mot något schema (rå cast till string) — till skillnad från generateDocumentDraft finns inget Zod-skydd här', async () => {
    mockCallAI.mockResolvedValue({ success: true, summary: { unexpected: 'object-shape' } })
    const result = await generateWeekSummary('enr-1')
    // Ingen validering sker — objektet passerar rakt igenom trots att typsignaturen lovar string
    expect(result).toEqual({ unexpected: 'object-shape' })
  })
})

describe('DOC_TYPE_META', () => {
  it('innehåller alla 9 dokumenttyper med titel + del', () => {
    expect(Object.keys(DOC_TYPE_META)).toHaveLength(9)
    expect(DOC_TYPE_META.initial_planering).toEqual({ title: 'Initial planering', part: 1 })
    expect(DOC_TYPE_META.delredovisning_2).toMatchObject({ part: 2, afBlankett: 'Af 00826 3.0' })
  })

  it('sätter part:null för dokument utan STA-del-koppling', () => {
    expect(DOC_TYPE_META.anmalan_arbetsprovning.part).toBeNull()
    expect(DOC_TYPE_META.information_arbetsprovning.part).toBeNull()
    expect(DOC_TYPE_META.informativ_rapport_hjalpmedel.part).toBeNull()
  })
})
