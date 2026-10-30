/**
 * AIX16 — text till nämnden i nämndrapportens dialog.
 *
 *  - spärr A2: ingen textsektion i drift (standardläget)
 *  - AI-utkastet hamnar i textrutan, redigerbart; strukna meningar berättas
 *  - texten är ett tillägg i PDF:en (märkt med AI-stöd) — tabellen står kvar
 *  - AI avstängd = ingen knapp
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { NamndTextSektion } from './NamndTextSektion'
import { ReportGeneratorDialog } from './ReportGeneratorDialog'
import { A2_BESVARAD } from './a2Sparr'
import { callAI } from '@/services/aiApi'
import { generateNamndrapportBlob, type Namndrapport } from '@/services/namndrapportPdf'
import type { ReportData } from '@/services/pdfReportGenerator'

vi.mock('@/services/aiApi', () => {
  class AiConsentRequiredError extends Error {}
  return { callAI: vi.fn(), AiConsentRequiredError }
})
vi.mock('./useRapportOmfang', () => ({ useRapportOmfang: () => ({ omfang: 'egna', orgNamn: null }) }))
const orgSparr = vi.hoisted(() => ({ varde: null as unknown }))
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => orgSparr.varde }))
const egenAiAv = vi.hoisted(() => ({ varde: false }))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ profile: { ai_enabled: !egenAiAv.varde, first_name: 'Karin', last_name: 'Chef' } }),
}))

const rad = (etikett: string, deltagare: number) => ({
  nyckel: 'arbetslos' as const, etikett, deltagare_med_plan: deltagare, pass_bedomda: 100, narvarograd: 80,
  franvaro_anmald: 10, franvaro_oanmald: 6, sjuk_utan_intyg: 0, underlag_lamnat: 7,
})
const RAPPORT: Namndrapport = {
  ar: 2026, kvartal: 3, from: '2026-07-01', to: '2026-09-30',
  rader: [rad('Arbetslös', 20)],
  summa: { deltagare_med_plan: 20, pass_bedomda: 100, narvarograd: 80, franvaro_anmald: 10, franvaro_oanmald: 6, sjuk_utan_intyg: 0, underlag_lamnat: 7 },
}

function Hjalp() {
  const [text, setText] = useState('')
  return (
    <>
      <NamndTextSektion hamtaUnderlag={async () => RAPPORT} text={text} onText={setText} />
      <output data-testid="ut">{text}</output>
    </>
  )
}

describe('AIX16 — NamndTextSektion', () => {
  beforeEach(() => {
    vi.mocked(callAI).mockReset()
    orgSparr.varde = null
    egenAiAv.varde = false
  })

  it('ett AI-utkast hamnar i textrutan och går att redigera', async () => {
    vi.mocked(callAI).mockResolvedValue({ namndtext: { text: 'Under kvartalet hade 20 deltagare en plan.', struket: 2 } } as never)
    render(<Hjalp />)
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett utkast med AI/ }))

    await waitFor(() => expect(screen.getByLabelText(/Text till nämnden/)).toHaveValue('Under kvartalet hade 20 deltagare en plan.'))
    expect(screen.getByText(/2 meningar togs bort/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Text till nämnden/), { target: { value: 'Mitt eget.' } })
    expect(screen.getByTestId('ut')).toHaveTextContent('Mitt eget.')
  })

  it('skickar underlaget med celler under 5 undertryckta', async () => {
    vi.mocked(callAI).mockResolvedValue({ namndtext: { text: 'Under kvartalet hade 20 deltagare en plan.' } } as never)
    render(
      <NamndTextSektion
        hamtaUnderlag={async () => ({ ...RAPPORT, rader: [{ ...rad('Arbetslös', 20), franvaro_oanmald: 3 }] })}
        text=""
        onText={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett utkast med AI/ }))
    await waitFor(() => expect(callAI).toHaveBeenCalled())
    const data = vi.mocked(callAI).mock.calls[0][1] as { underlag: { grupper: Array<{ oanmaldFranvaro: number | null }> } }
    expect(data.underlag.grupper[0].oanmaldFranvaro).toBeNull()
  })

  it('ett fel lämnar texten kvar och säger det', async () => {
    vi.mocked(callAI).mockRejectedValue(new Error('503'))
    render(<Hjalp />)
    fireEvent.change(screen.getByLabelText(/Text till nämnden/), { target: { value: 'Min text' } })
    fireEvent.click(screen.getByRole('button', { name: /Skriv ett utkast med AI/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte skrivas/)
    expect(screen.getByLabelText(/Text till nämnden/)).toHaveValue('Min text')
  })

  it('AI avstängd: ingen knapp, inget anrop', () => {
    egenAiAv.varde = true
    render(<Hjalp />)
    expect(screen.queryByRole('button', { name: /Skriv ett utkast med AI/ })).toBeNull()
    expect(screen.getByTestId('namndtext')).toHaveTextContent(/AI är avstängd/)
    expect(callAI).not.toHaveBeenCalled()
  })
})

describe('AIX16 — i rapportdialogen', () => {
  const data = { totalParticipants: 0, activeParticipants: 0, completedParticipants: 0, cvCompletionRate: 0, goalsCompletionRate: 0, engagementRate: 0, averageTimeToPlacement: 0, monthlyProgress: [], statusDistribution: [], topGoalCategories: [], cohortData: [] } as ReportData

  it('spärr A2: ingen textsektion i drift förrän juristfrågan är besvarad', async () => {
    expect(A2_BESVARAD).toBe(false)
    render(<ReportGeneratorDialog isOpen onClose={vi.fn()} analyticsData={data} />)
    fireEvent.click(await screen.findByRole('button', { name: /Nämndrapport \(kvartal\)/ }))
    expect(await screen.findByLabelText('Kvartal')).toBeInTheDocument()
    expect(screen.queryByTestId('namndtext')).toBeNull()
    expect(screen.queryByRole('button', { name: /Skriv ett utkast med AI/ })).toBeNull()
  })

  it('med spärren hävd visas sektionen i nämndrapporten, men inte i konsultrapporten', async () => {
    render(<ReportGeneratorDialog isOpen onClose={vi.fn()} analyticsData={data} namndAi />)
    expect(screen.queryByTestId('namndtext')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: /Nämndrapport \(kvartal\)/ }))
    expect(await screen.findByTestId('namndtext')).toBeInTheDocument()
  })
})

describe('AIX16 — tillägget i PDF:en', () => {
  const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')
  const text = async (blob: Blob) => avEskapera(await new Promise<string>((res) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.readAsBinaryString(blob)
  }))

  it('texten står under tabellen, märkt med AI-stöd, och tabellen står kvar', async () => {
    const pdf = await text(await generateNamndrapportBlob(RAPPORT, {
      organisation: 'Testkommun', konsulentNamn: 'Karin Chef', datum: '2026-10-30',
      tillagg: { text: 'Under kvartalet hade 20 deltagare en plan.', medAi: true },
    }))
    expect(pdf).toContain('Under kvartalet hade 20 deltagare en plan.')
    expect(pdf).toContain('utkast med AI-stöd, granskat av Karin Chef')
    expect(pdf).toContain('Deltagare med plan')
  })

  it('handskriven text märks inte med AI, och utan tillägg finns ingen rubrik', async () => {
    const meta = { organisation: 'Testkommun', konsulentNamn: 'Karin Chef', datum: '2026-10-30' }
    const egen = await text(await generateNamndrapportBlob(RAPPORT, { ...meta, tillagg: { text: 'Egen text.', medAi: false } }))
    expect(egen).toContain('Egen text.')
    expect(egen).not.toContain('AI-stöd')
    const utan = await text(await generateNamndrapportBlob(RAPPORT, meta))
    expect(utan).not.toContain('Text till nämnden')
  })
})
