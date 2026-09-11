/**
 * Utsikter för ett yrke (MK3, 2026-09-12) — de fyra lägena i gränssnittet.
 *
 * Datan är Arbetsförmedlingens yrkesbarometer via `afPrognosApi`. Vakterna
 * här kontrollerar att sektionen (1) inte påstår något innan svaret är inne,
 * (2) säger fel när hämtningen faller, (3) säger "ingen prognos" när yrket
 * saknas i stället för att visa en platshållare, och (4) visar AF:s egna
 * bedömning och text ordagrant när det finns en träff — samt att en saknad
 * bedömning blir "ingen bedömning", aldrig ett påhittat värde.
 *
 * Bara `sokPrognos` mockas; gruppering, länsnamn och datumformatering är de
 * riktiga funktionerna, så testet mäter samma väg som webbläsaren kör.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import type { PrognosSvar, PrognosRad } from '@/services/afPrognosApi'

vi.mock('@/services/afPrognosApi', async () => {
  const riktig = await vi.importActual<typeof import('@/services/afPrognosApi')>('@/services/afPrognosApi')
  return { ...riktig, sokPrognos: vi.fn() }
})

import { sokPrognos } from '@/services/afPrognosApi'
import { UtsikterSektion } from '../LaborMarketTab'

const sokMock = vi.mocked(sokPrognos)

const rad = (o: Partial<PrognosRad> = {}): PrognosRad => ({
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

const svar = (traffar: PrognosRad[]): PrognosSvar => ({
  kalla: 'https://data.arbetsformedlingen.se/prognoser/yrkesbarometer.json',
  licens: 'CC0 1.0',
  omgang: '2026-1',
  last_modified: 'Mon, 08 Jun 2026 05:44:48 GMT',
  traffar,
})

function sokEfter(yrke: string, lan?: string) {
  fireEvent.change(screen.getByLabelText('Yrke'), { target: { value: yrke } })
  if (lan) fireEvent.change(screen.getByLabelText('Län'), { target: { value: lan } })
  fireEvent.click(screen.getByRole('button', { name: 'Visa utsikter' }))
}

describe('Utsikter för ett yrke — lägena', () => {
  beforeEach(() => {
    sokMock.mockReset()
  })

  it('vila: påstår ingenting innan användaren sökt, och kräver två tecken', () => {
    render(<UtsikterSektion />)
    expect(screen.getByRole('heading', { name: 'Utsikter för ett yrke' })).toBeInTheDocument()
    expect(screen.queryByText(/ingen prognos/i)).toBeNull()
    expect(screen.queryByText(/Möjligheter till arbete/)).toBeNull()

    sokEfter('k')
    expect(screen.getByRole('alert')).toHaveTextContent('Skriv minst två tecken.')
    expect(sokMock).not.toHaveBeenCalled()
  })

  it('laddar: visar hämtningstext och låser knappen medan svaret väntar', () => {
    sokMock.mockReturnValue(new Promise(() => { /* aldrig klar */ }))
    render(<UtsikterSektion />)
    sokEfter('kock')
    expect(screen.getByText(/Hämtar Arbetsförmedlingens bedömning/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visa utsikter' })).toBeDisabled()
    expect(screen.queryByText(/ingen prognos/i)).toBeNull()
    expect(sokMock).toHaveBeenCalledWith('kock', null)
  })

  it('fel: säger att hämtningen misslyckades — inte "ingen prognos"', async () => {
    sokMock.mockRejectedValue(new Error('af-prognos svarade 502'))
    render(<UtsikterSektion />)
    sokEfter('kock')
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte hämta yrkesbarometern/))
    expect(screen.queryByText(/ingen prognos/i)).toBeNull()
    expect(screen.getByRole('button', { name: 'Visa utsikter' })).toBeEnabled()
  })

  it('klart utan träff: säger att AF saknar prognos för yrket, utan platshållarvärden', async () => {
    sokMock.mockResolvedValue(svar([]))
    render(<UtsikterSektion />)
    sokEfter('astronaut')
    await waitFor(() => expect(screen.getByText(/har ingen prognos för det här yrket/)).toBeInTheDocument())
    expect(screen.queryByText(/Möjligheter till arbete/)).toBeNull()
    expect(screen.queryByText(/yrkesbarometer, omgång/)).toBeNull()
  })

  it('klart med träff: AF:s bedömning, text, län + riket, omgång och licens', async () => {
    sokMock.mockResolvedValue(svar([rad(), rad({ lan: '18', jobbmojligheter: 'medelstora', text_jobbmojligheter: 'I Örebro län bedöms möjligheterna vara medelstora.' })]))
    render(<UtsikterSektion />)
    sokEfter('kock', '18')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kockar' })).toBeInTheDocument())
    expect(sokMock).toHaveBeenCalledWith('kock', '18')

    // Länets rad först, rikets sedan — båda med AF:s ordagranna text.
    expect(screen.getByText('I Örebro län')).toBeInTheDocument()
    expect(screen.getByText('I Örebro län bedöms möjligheterna vara medelstora.')).toBeInTheDocument()
    expect(screen.getByText('Nationellt bedöms möjligheterna till arbete som kock vara stora.')).toBeInTheDocument()
    expect(screen.getByText('medelstora')).toBeInTheDocument()
    expect(screen.getByText('stora')).toBeInTheDocument()
    expect(screen.getAllByText('brist på arbetskraft')).toHaveLength(2)
    expect(screen.getAllByText('efterfrågan väntas öka')).toHaveLength(2)

    // Yrkesgruppen namnges, och källraden bär omgång, datum och licens.
    expect(screen.getByText(/Kockar är en del av yrkesgruppen Kockar och kallskänkor \(SSYK 5120\)/)).toBeInTheDocument()
    const kalla = screen.getByText(/yrkesbarometer, omgång 2026-1/)
    expect(kalla).toHaveTextContent(/publicerad .*2026/)
    expect(kalla).toHaveTextContent('Öppna data, CC0')
  })

  it('en saknad bedömning blir "ingen bedömning" — aldrig ett påhittat värde', async () => {
    sokMock.mockResolvedValue(svar([rad({ jobbmojligheter: null, rekryteringssituation: null, prognos: null, text_jobbmojligheter: '' })]))
    render(<UtsikterSektion />)
    sokEfter('kock')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kockar' })).toBeInTheDocument())
    expect(screen.getAllByText('ingen bedömning')).toHaveLength(3)
    expect(screen.queryByText(/små|medelstora|stora|brist|balans|överskott/)).toBeNull()
  })
})
