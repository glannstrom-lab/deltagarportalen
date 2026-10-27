import { describe, it, expect, vi, beforeEach } from 'vitest'

const callAI = vi.fn()
vi.mock('@/services/aiApi', () => ({ callAI: (...a: unknown[]) => callAI(...a) }))

import {
  forklaraAnnons,
  rensaAnnonsCache,
  lasCachadForklaring,
  annonsCacheNyckel,
  skapaSamtalsmanus,
  skapaUppfoljningsmejl,
} from './ansokanAiApi'

const SVAR = { success: true, forklaring: { uppgifter: [], krav: [{ typ: 'hart', punkt: 'Körkort B', citat: 'Körkort B är ett krav' }], ord: [] } }
const TEXT = 'Vi söker en lagerarbetare. Körkort B är ett krav.'

beforeEach(() => {
  callAI.mockReset()
  rensaAnnonsCache()
})

describe('forklaraAnnons: cache per annons', () => {
  it('andra anropet för samma annons går inte till servern', async () => {
    callAI.mockResolvedValue(SVAR)
    const a = await forklaraAnnons({ id: '123', text: TEXT })
    const b = await forklaraAnnons({ id: '123', text: TEXT })
    expect(callAI).toHaveBeenCalledTimes(1)
    expect(b).toBe(a)
    expect(lasCachadForklaring({ id: '123', text: TEXT })).toBe(a)
  })

  it('två samtidiga anrop delar ett nätverksanrop', async () => {
    callAI.mockResolvedValue(SVAR)
    await Promise.all([forklaraAnnons({ id: '1', text: TEXT }), forklaraAnnons({ id: '1', text: TEXT })])
    expect(callAI).toHaveBeenCalledTimes(1)
  })

  it('en annan annons, eller en ändrad text, ger ett nytt anrop', async () => {
    callAI.mockResolvedValue(SVAR)
    await forklaraAnnons({ id: '1', text: TEXT })
    await forklaraAnnons({ id: '2', text: TEXT })
    await forklaraAnnons({ id: '1', text: TEXT + ' Nytt.' })
    expect(callAI).toHaveBeenCalledTimes(3)
  })

  it('cachar inte ett fel — nästa försök får gå igenom', async () => {
    callAI.mockRejectedValueOnce(new Error('nere'))
    await expect(forklaraAnnons({ id: '9', text: TEXT })).rejects.toThrow('nere')
    callAI.mockResolvedValueOnce(SVAR)
    await expect(forklaraAnnons({ id: '9', text: TEXT })).resolves.toBeTruthy()
    expect(callAI).toHaveBeenCalledTimes(2)
  })

  it('skickar högst 3 000 tecken och går via funktionen annons-forklaring', async () => {
    callAI.mockResolvedValue(SVAR)
    await forklaraAnnons({ id: '1', text: 'a'.repeat(5000), titel: 'T', foretag: 'F' })
    const [namn, data] = callAI.mock.calls[0]
    expect(namn).toBe('annons-forklaring')
    expect((data as { annons: string }).annons).toHaveLength(3000)
  })

  it('en tom annons kastar utan anrop; ett svar utan rätt form kastas', async () => {
    await expect(forklaraAnnons({ text: '   ' })).rejects.toThrow()
    expect(callAI).not.toHaveBeenCalled()
    callAI.mockResolvedValue({ success: true, forklaring: 'text' })
    await expect(forklaraAnnons({ id: '5', text: TEXT })).rejects.toThrow()
  })

  it('cachenyckeln skiljer id och innehåll', () => {
    expect(annonsCacheNyckel({ id: '1', text: 'a' })).not.toBe(annonsCacheNyckel({ id: '1', text: 'b' }))
    expect(annonsCacheNyckel({ id: '1', text: 'a' })).not.toBe(annonsCacheNyckel({ id: '2', text: 'a' }))
  })
})

describe('manus och mejl', () => {
  it('samtalsmanus returnerar texten och kastar på tomt svar', async () => {
    callAI.mockResolvedValueOnce({ success: true, manus: '  Hej!  ' })
    await expect(skapaSamtalsmanus({ syfte: 'fraga' })).resolves.toBe('Hej!')
    expect(callAI.mock.calls[0][0]).toBe('samtalsmanus')
    callAI.mockResolvedValueOnce({ success: true, manus: ' ' })
    await expect(skapaSamtalsmanus({ syfte: 'fraga' })).rejects.toThrow()
  })

  it('uppföljningsmejl går via rätt funktion och kastar på tomt svar', async () => {
    callAI.mockResolvedValueOnce({ success: true, mejl: 'Ämne: Hej' })
    await expect(skapaUppfoljningsmejl({ orsak: 'avslag' })).resolves.toBe('Ämne: Hej')
    expect(callAI.mock.calls[0][0]).toBe('uppfoljningsmejl')
    callAI.mockResolvedValueOnce({ success: true })
    await expect(skapaUppfoljningsmejl({ orsak: 'avslag' })).rejects.toThrow()
  })
})
