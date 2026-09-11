import { describe, it, expect } from 'vitest'
import { tolkaPrognosSvar, grupperaPerYrke, lansnamn, formateraPublicerad, type PrognosRad } from './afPrognosApi'

const rad = (o: Partial<PrognosRad> = {}): Record<string, unknown> => ({
  yb_yrke: 'Kockar',
  yb_concept_id: 'i5zY_AwC_RGf',
  ssyk: '5120',
  ssyk_text: 'Kockar och kallskänkor',
  yrkesomrade: 'Hotell, restaurang, storhushåll',
  yb_beskrivning: null,
  lan: '00',
  jobbmojligheter: 'stora',
  rekryteringssituation: 'brist',
  paradox: [],
  prognos: 'öka',
  text_jobbmojligheter: 'Nationellt bedöms möjligheterna till arbete som kock vara stora.',
  text_rekryteringssituation: 'Rekryteringssituationen kännetecknas av brist.',
  hogsta_bedomningsniva: 'nationellt',
  delvis_helt: 'delvis',
  ...o,
})

describe('tolkaPrognosSvar', () => {
  it('tolkar ett riktigt svar och behåller AF:s bedömningar ordagrant', () => {
    const svar = tolkaPrognosSvar({ kalla: 'https://x', licens: 'CC0 1.0', omgang: '2026-1', last_modified: 'Mon, 08 Jun 2026 05:44:48 GMT', traffar: [rad()] })
    expect(svar.omgang).toBe('2026-1')
    expect(svar.traffar).toHaveLength(1)
    expect(svar.traffar[0]).toMatchObject({ yb_yrke: 'Kockar', jobbmojligheter: 'stora', prognos: 'öka', rekryteringssituation: 'brist' })
  })

  it('okända bedömningsvärden blir null — inte en gissning', () => {
    const svar = tolkaPrognosSvar({ traffar: [rad({ jobbmojligheter: 'enorma' as never, prognos: null, rekryteringssituation: 'kaos' as never })] })
    expect(svar.traffar[0].jobbmojligheter).toBeNull()
    expect(svar.traffar[0].prognos).toBeNull()
    expect(svar.traffar[0].rekryteringssituation).toBeNull()
  })

  it('tom träfflista är ett giltigt svar (yrket finns inte i barometern)', () => {
    expect(tolkaPrognosSvar({ traffar: [] }).traffar).toEqual([])
  })

  it('kastar på felobjekt och på svar utan traffar', () => {
    expect(() => tolkaPrognosSvar({ error: 'Rate limit' })).toThrow('Rate limit')
    expect(() => tolkaPrognosSvar({ nej: 1 })).toThrow(/traffar/)
    expect(() => tolkaPrognosSvar(null)).toThrow()
  })

  it('kastar på en rad utan yrke — hellre fel än en tom kortrubrik', () => {
    expect(() => tolkaPrognosSvar({ traffar: [rad({ yb_yrke: '' })] })).toThrow(/utan yrke/)
  })

  it('paradox filtreras till strängar', () => {
    const svar = tolkaPrognosSvar({ traffar: [rad({ paradox: ['deltidsarbete', 7, null] as never })] })
    expect(svar.traffar[0].paradox).toEqual(['deltidsarbete'])
  })
})

describe('grupperaPerYrke', () => {
  const traffar = tolkaPrognosSvar({
    traffar: [
      rad(),
      rad({ lan: '18', jobbmojligheter: 'medelstora' }),
      rad({ yb_yrke: 'Kallskänkor', yb_concept_id: 'abc', lan: '00' }),
    ],
  }).traffar

  it('parar rikets rad med länets rad per yrke', () => {
    const u = grupperaPerYrke(traffar, '18')
    expect(u).toHaveLength(2)
    expect(u[0].riket?.jobbmojligheter).toBe('stora')
    expect(u[0].lan?.jobbmojligheter).toBe('medelstora')
    expect(u[1].lan).toBeNull()
  })

  it('utan begärt län blir länsraden null', () => {
    const u = grupperaPerYrke(traffar, null)
    expect(u[0].lan).toBeNull()
  })
})

describe('lansnamn och formateraPublicerad', () => {
  it('mappar länskod till namn, riket för 00, koden som fallback', () => {
    expect(lansnamn('18')).toBe('Örebro län')
    expect(lansnamn('00')).toBe('hela Sverige')
    expect(lansnamn('99')).toBe('99')
  })
  it('formaterar Last-Modified och ger null för okänt', () => {
    expect(formateraPublicerad('Mon, 08 Jun 2026 05:44:48 GMT', 'sv')).toMatch(/2026/)
    expect(formateraPublicerad('trasigt', 'sv')).toBeNull()
    expect(formateraPublicerad(null, 'sv')).toBeNull()
  })
})
