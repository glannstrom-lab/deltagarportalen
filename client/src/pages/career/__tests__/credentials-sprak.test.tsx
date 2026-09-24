/**
 * Meritförslagen på /career ska följa språket.
 *
 * Prod-svepet 2026-09-24: i engelskt läge stod "HLR och första hjälpen",
 * "Grundläggande datorkunskap", "Utbildningsanordnare", "Arbetsgivare i
 * vården" och "Din kommun" kvar på svenska. Nu slås de upp i
 * `career.credentials.popular.<id>`. Myndighets- och organisationsnamn
 * (Transportstyrelsen, HLR-rådet, Brandskyddsföreningen) står kvar — det är
 * det som står på intyget.
 *
 * De engelska nycklarna läggs in här som fixtur eftersom en.json fylls på av
 * huvudagenten; när de finns där är fixturen en no-op.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

const { getAll, save } = vi.hoisted(() => ({ getAll: vi.fn(), save: vi.fn() }))
vi.mock('@/services/careerApi', () => ({
  credentialsApi: { getAll, save, updateStatus: vi.fn(), delete: vi.fn() },
}))

import CredentialsTab from '../CredentialsTab'

const NYA_EN = {
  career: {
    credentials: {
      popular: {
        truck: { name: 'Forklift license A + B (truckkort)', issuer: 'TLP-10' },
        ykb: { name: 'YKB — professional driver qualification', issuer: 'Transportstyrelsen' },
        hlr: { name: 'CPR and first aid (HLR)', issuer: 'HLR-rådet' },
        livsmedel: { name: 'Food hygiene', issuer: 'Training provider' },
        hetaArbeten: { name: 'Hot work (Heta arbeten)', issuer: 'Brandskyddsföreningen' },
        delegering: { name: 'Delegation to give medicine', issuer: 'Employer in health care' },
        vaktare: { name: 'Security guard training (VU1)', issuer: 'Authorized security company' },
        bKorkort: { name: 'Driving license B (B-körkort)', issuer: 'Transportstyrelsen' },
        sfi: { name: 'SFI — Swedish for immigrants', issuer: 'Your municipality (kommun)' },
        dator: { name: 'Basic computer skills', issuer: 'Training provider' },
      },
    },
  },
}

async function engelska() {
  i18n.addResourceBundle('en', 'translation', en, true, true)
  i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
  await i18n.changeLanguage('en')
}

const visa = () => render(<ConfirmDialogProvider><CredentialsTab /></ConfirmDialogProvider>)

describe('CredentialsTab — förslagen följer språket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAll.mockResolvedValue([])
  })
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('visar svenska förslag på svenska', async () => {
    visa()
    expect(await screen.findByText('HLR och första hjälpen')).toBeInTheDocument()
    expect(screen.getAllByText('Utbildningsanordnare').length).toBe(2)
  })

  it('visar engelska förslag på engelska, med myndighetsnamnen kvar', async () => {
    await engelska()
    const { container } = visa()
    expect(await screen.findByText('CPR and first aid (HLR)')).toBeInTheDocument()
    expect(screen.getByText('Basic computer skills')).toBeInTheDocument()
    expect(screen.getByText('Employer in health care')).toBeInTheDocument()
    expect(screen.getByText('Your municipality (kommun)')).toBeInTheDocument()
    expect(screen.getAllByText('Transportstyrelsen').length).toBe(2)
    expect(screen.getByText('HLR-rådet')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(
      /HLR och första hjälpen|Grundläggande datorkunskap|Utbildningsanordnare|Arbetsgivare i vården|Din kommun|Livsmedelshygien/
    )
  })

  it('sparar förslaget på det språk användaren ser', async () => {
    await engelska()
    save.mockImplementation(async (c: Record<string, unknown>) => ({ id: 'ny', status: 'planned', ...c }))
    visa()
    fireEvent.click(await screen.findByText('Basic computer skills'))
    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(save.mock.calls[0][0]).toMatchObject({ name: 'Basic computer skills', issuer: 'Training provider' })
  })

  it('döljer ett förslag som redan sparats på det andra språket', async () => {
    await engelska()
    getAll.mockResolvedValue([
      { id: 'a', name: 'Grundläggande datorkunskap', issuer: 'Utbildningsanordnare', type: 'course', status: 'planned' },
    ])
    visa()
    await screen.findByText('Food hygiene')
    expect(screen.queryByText('Basic computer skills')).toBeNull()
  })
})
