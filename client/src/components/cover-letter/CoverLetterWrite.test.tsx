/**
 * CoverLetterWrite — vad skrivvyn ALDRIG får göra med användarens text.
 *
 * Alla fem testerna nedan bevakar samma sak ur olika håll: **brevet får inte
 * försvinna**. Det är det dyraste felet på den här sidan, och varje fall
 * härstammar från en verklig defekt i granskningen 2026-08-19:
 *
 *   · "Nästa" i steg 2 regenererade villkorslöst och skrev över allt
 *   · catchen i `generateLetter` nollade både brevet och utkastet
 *   · alla AI-fel plattades till "försök igen om en stund" — även för den som
 *     stängt av AI-behandling, där ett nytt försök aldrig kan lyckas
 *   · steg 3 saknade laddningsläge: en tom textarea märkt som AI-genererad
 *     visades som ett färdigt resultat
 *   · AI-märkningen satt kvar på text användaren skrivit om helt
 *
 * Mutationskontrollerade 2026-08-19 (bröt koden, såg testet bli rött,
 * återställde) — se raderna i varje `it` för vilken mutation som fäller det.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

// `AiConsentRequiredError` måste vara den RIKTIGA klassen — `tolkaAiFel`
// använder `instanceof`, och en egen attrapp hade gjort testet grönt mot en
// kodväg som inte finns.
const callAIMock = vi.fn()
vi.mock('@/services/aiApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/aiApi')>('@/services/aiApi')
  return { ...actual, callAI: (...a: unknown[]) => callAIMock(...a) }
})

const createMock = vi.fn().mockResolvedValue({ id: 'nytt' })
vi.mock('@/services/coverLetterApi', () => ({
  coverLetterApi: { create: (...a: unknown[]) => createMock(...a) },
}))

vi.mock('@/services/pdfExportService', () => ({
  generateCoverLetterPDFViaReactPdf: vi.fn(),
  downloadPDF: vi.fn(),
}))

vi.mock('@/services/jobsApi', () => ({
  savedJobsApi: { getAll: vi.fn().mockResolvedValue([]) },
}))

vi.mock('@/services/userApi', () => ({
  userApi: { getPreferences: vi.fn().mockResolvedValue(null) },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: () => ({
    profile: { first_name: 'Anna', last_name: 'Ek', email: 'a@b.se', phone: '070', location: 'Malmö' },
    loadProfile: vi.fn(),
  }),
}))

const toastError = vi.fn()
vi.mock('@/components/Toast', () => ({
  showToast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) },
}))

// Tunga barn utan betydelse för det här: mallväljaren och förhandsvisningen.
vi.mock('./CoverLetterTemplateSelector', () => ({
  CoverLetterTemplateSelector: () => <div data-testid="mallvaljare" />,
}))
vi.mock('./CoverLetterPreview', () => ({
  CoverLetterPreview: ({ content }: { content: string }) => <div data-testid="forhandsvisning">{content}</div>,
}))

import { CoverLetterWrite } from './CoverLetterWrite'
import { AiConsentRequiredError } from '@/services/aiApi'

/** Autosaven är vägen in i wizarden: den återställer steg, formulär och text. */
function saUtkastet(utkast: {
  currentStep: number
  editedLetter: string
  generatedLetter: string
}) {
  window.localStorage.setItem(
    'cover-letter-write-draft',
    JSON.stringify({
      data: {
        formData: {
          company: 'Acme AB',
          jobTitle: 'Snickare',
          jobAd: '',
          motivation: '',
          selectedTemplate: 'professional',
          tone: 'professional',
          selectedJobId: '',
          useManualInput: true,
        },
        ...utkast,
      },
      timestamp: Date.now(),
    })
  )
}

const rita = () =>
  render(
    <MemoryRouter>
      <ConfirmDialogProvider>
        <CoverLetterWrite />
      </ConfirmDialogProvider>
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
})

describe('CoverLetterWrite — användarens text', () => {
  it('"Nästa" från steg 2 skriver INTE över ett brev som redan finns', async () => {
    // Mutation: låt `handleNext` anropa generateLetter() utan villkoret om
    // `!editedLetter.trim()` → RÖD (callAI anropas, texten byts ut).
    saUtkastet({ currentStep: 2, editedLetter: 'Mina egna ord om varför jag söker.', generatedLetter: '' })
    rita()

    const textarea = await screen.findByLabelText('Ditt brev')
    expect(textarea).toHaveValue('Mina egna ord om varför jag söker.')

    fireEvent.click(screen.getByRole('button', { name: /Nästa/ }))

    await waitFor(() => expect(screen.getByLabelText('Ändra i brevet')).toBeInTheDocument())
    expect(callAIMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Ändra i brevet')).toHaveValue('Mina egna ord om varför jag söker.')
  })

  it('ett misslyckat AI-anrop raderar INTE brevet', async () => {
    // Mutation: sätt tillbaka setEditedLetter('') i catchen → RÖD.
    callAIMock.mockRejectedValue(new Error('Ett fel uppstod vid kommunikation med AI-tjänsten.'))
    saUtkastet({ currentStep: 2, editedLetter: 'AI-utkastet, ordagrant.', generatedLetter: 'AI-utkastet, ordagrant.' })
    rita()

    fireEvent.click(await screen.findByRole('button', { name: /Skriv ett nytt utkast/ }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByLabelText('Ditt brev')).toHaveValue('AI-utkastet, ordagrant.')
    expect(screen.getByRole('alert')).toHaveTextContent('Brevet blev inte skrivet')
  })

  it('avstängd AI ger vägen till Inställningar — inte en "Försök igen" som aldrig kan lyckas', async () => {
    // Mutation: låt tolkaAiFel returnera { sort: 'ai' } för alla fel → RÖD.
    callAIMock.mockRejectedValue(
      new AiConsentRequiredError('Du har stängt av AI-behandling av dina uppgifter.')
    )
    saUtkastet({ currentStep: 2, editedLetter: '', generatedLetter: '' })
    rita()

    fireEvent.click(await screen.findByRole('button', { name: /Skriv ett utkast åt mig/ }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Öppna Inställningar' })).toBeInTheDocument()
    )
    expect(screen.queryByRole('button', { name: 'Försök igen' })).not.toBeInTheDocument()
    // Löftet "du kan skriva själv" måste hålla — rutan finns kvar.
    expect(screen.getByLabelText('Ditt brev')).toBeInTheDocument()
  })

  it('steg 3 visar att det pågår — inte en tom textarea märkt som AI-genererad', async () => {
    // Mutation: ta bort laddningsgrenen ur Step3ReviewSave → RÖD.
    callAIMock.mockReturnValue(new Promise(() => {})) // svarar aldrig
    saUtkastet({ currentStep: 2, editedLetter: '', generatedLetter: '' })
    rita()

    fireEvent.click(await screen.findByRole('button', { name: /Nästa/ }))

    await waitFor(() => expect(screen.getByText('Skriver ditt utkast')).toBeInTheDocument())
    expect(screen.queryByLabelText('Ändra i brevet')).not.toBeInTheDocument()
    expect(document.querySelector('[data-ai-generated="true"]')).toBeNull()
  })

  it('AI-märkningen följer texten: den försvinner när brevet skrivits om', async () => {
    // Mutation: hårdkoda arOrordAiText = true, eller ai_generated: true i
    // handleSave → RÖD (attributet finns kvar / fel värde sparas).
    saUtkastet({
      currentStep: 3,
      editedLetter: 'AI-utkastet, ordagrant.',
      generatedLetter: 'AI-utkastet, ordagrant.',
    })
    rita()

    const textarea = await screen.findByLabelText('Ändra i brevet')
    expect(textarea).toHaveAttribute('data-ai-generated', 'true')

    fireEvent.change(textarea, { target: { value: 'Det här är helt och hållet mina egna ord.' } })
    expect(screen.getByLabelText('Ändra i brevet')).not.toHaveAttribute('data-ai-generated')

    fireEvent.click(screen.getByRole('button', { name: /Spara brevet/ }))
    await waitFor(() => expect(createMock).toHaveBeenCalled())
    expect(createMock.mock.calls[0][0].ai_generated).toBe(false)
  })
})
