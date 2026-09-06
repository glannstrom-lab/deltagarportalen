/**
 * Register — F22 (WCAG 3.3.1 + 4.1.3): fält med valideringsfel ska ha
 * aria-invalid + aria-describedby, och felmeddelandet ska annonseras
 * (role="alert"). Se docs/portal-review-2026-08-09.md fynd 8 / ROADMAP F22.
 *
 * Formulärvalidering i sig (useZodForm) testas separat i useZodForm.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'

const mockSignUp = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// OptimizedImage förlitar sig på sharp/ImageOptimizer som inte finns i jsdom
vi.mock('@/components/ui/OptimizedImage', () => ({
  OptimizedImage: (props: { alt: string; className?: string }) => (
    <img alt={props.alt} className={props.className} />
  ),
}))

function renderRegister(initialPath = '/register') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Register />
    </MemoryRouter>
  )
}

// Fälten som ska ha aria-invalid/aria-describedby kopplat till sitt felmeddelande
// när de är touchade och ogiltiga (checkboxarna testas separat pga annat markup).
const TEXT_FIELDS: Array<{ label: RegExp; name: string }> = [
  { label: /förnamn/i, name: 'firstName' },
  { label: /efternamn/i, name: 'lastName' },
  { label: /e-postadress/i, name: 'email' },
]

describe('Register — F22 tillgängliga felmeddelanden', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithGoogle.mockReset()
    mockNavigate.mockReset()
  })

  it.each(TEXT_FIELDS)('kopplar $name till sitt felmeddelande via aria-invalid + aria-describedby', ({ label, name }) => {
    renderRegister()
    const input = screen.getByLabelText(label)

    // Orört fält: inget fel, aria-invalid ska inte vara true
    expect(input).not.toHaveAttribute('aria-invalid', 'true')

    // Lämna fältet tomt och blura -> obligatoriskt fält ska bli ogiltigt
    fireEvent.blur(input)

    expect(input).toHaveAttribute('aria-invalid', 'true')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBe(`${name}-error`)

    const errorEl = document.getElementById(describedBy as string)
    expect(errorEl).not.toBeNull()
    expect(errorEl).toHaveAttribute('role', 'alert')
    expect(errorEl?.textContent).not.toHaveLength(0)
  })

  it('kopplar acceptTerms-kryssrutan till sitt felmeddelande', () => {
    renderRegister()
    const checkbox = screen.getByLabelText(/godkänner användarvillkoren/i)

    fireEvent.blur(checkbox)

    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    expect(checkbox).toHaveAttribute('aria-describedby', 'acceptTerms-error')
    const errorEl = document.getElementById('acceptTerms-error')
    expect(errorEl).not.toBeNull()
    expect(errorEl).toHaveAttribute('role', 'alert')
  })

  it('kopplar acceptPrivacy-kryssrutan till sitt felmeddelande', () => {
    renderRegister()
    const checkbox = screen.getByLabelText(/godkänner integritetspolicyn/i)

    fireEvent.blur(checkbox)

    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    expect(checkbox).toHaveAttribute('aria-describedby', 'acceptPrivacy-error')
    const errorEl = document.getElementById('acceptPrivacy-error')
    expect(errorEl).not.toBeNull()
    expect(errorEl).toHaveAttribute('role', 'alert')
  })

  it('kopplar password/confirmPassword till sina felmeddelanden', () => {
    renderRegister()
    const password = screen.getByLabelText(/^lösenord$/i)
    const confirmPassword = screen.getByLabelText(/bekräfta lösenord/i)

    fireEvent.blur(password)
    fireEvent.blur(confirmPassword)

    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-describedby', 'password-error')
    expect(confirmPassword).toHaveAttribute('aria-invalid', 'true')
    expect(confirmPassword).toHaveAttribute('aria-describedby', 'confirmPassword-error')
  })
})

// KO2: subtiteln ska säga VART hon var på väg när returnTo finns i URL:en,
// i stället för det generiska "Ta det första steget mot din nya karriär".
describe('Register — returnTo-subtitel (KO2)', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithGoogle.mockReset()
    mockNavigate.mockReset()
  })

  it('nämner verktygets namn för ett känt mål', () => {
    renderRegister('/register?returnTo=%2Fcv')
    expect(screen.getByText(/fortsätta till CV/i)).toBeInTheDocument()
  })

  it('visar en neutral rad för ett okänt men säkert mål', () => {
    renderRegister('/register?returnTo=%2Fnagon-okand-sida')
    expect(screen.getByText(/fortsätta dit du var på väg/i)).toBeInTheDocument()
  })

  it('visar den generiska subtiteln utan returnTo', () => {
    renderRegister('/register')
    expect(screen.getByText('Ta det första steget mot din nya karriär')).toBeInTheDocument()
  })

  it('visar den generiska subtiteln när returnTo är en osäker (extern) länk', () => {
    renderRegister('/register?returnTo=' + encodeURIComponent('https://ondsajt.se'))
    expect(screen.getByText('Ta det första steget mot din nya karriär')).toBeInTheDocument()
  })
})

// KO3: lösenordsreglerna ska synas MEDAN man skriver — inklusive de två regler
// som fanns i strongPasswordSchema men inte i den synliga listan (upprepning,
// vanliga osäkra mönster). Annars kan alla synliga bockar bli gröna medan
// submit ändå är blockerad, utan att gästen förstår varför.
describe('Register — lösenordsreglerna syns medan man skriver (KO3)', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithGoogle.mockReset()
    mockNavigate.mockReset()
  })

  it('visar alla sju regler redan innan något är skrivet', () => {
    renderRegister()
    expect(screen.getByText(/minst 12 tecken/i)).toBeInTheDocument()
    expect(screen.getByText(/en stor bokstav/i)).toBeInTheDocument()
    expect(screen.getByText(/en liten bokstav/i)).toBeInTheDocument()
    expect(screen.getByText(/en siffra/i)).toBeInTheDocument()
    expect(screen.getByText(/ett specialtecken/i)).toBeInTheDocument()
    // De två reglerna som tidigare bara syntes som ett Zod-felmeddelande vid blur:
    expect(screen.getByText(/tre gånger i rad/i)).toBeInTheDocument()
    expect(screen.getByText(/vanligt lösenord/i)).toBeInTheDocument()
  })

  it('flaggar ett vanligt osäkert mönster live, trots att de fem andra reglerna är gröna', async () => {
    const user = userEvent.setup()
    renderRegister()

    const password = screen.getByLabelText(/^lösenord$/i)
    // Uppfyller längd + alla fyra teckenklasser, men innehåller ett förbjudet
    // mönster ("password") — strongPasswordSchema nekar den ändå.
    await user.type(password, 'Password123!')

    await waitFor(() => {
      const weakPatternRow = screen.getByText(/vanligt lösenord/i).closest('li')
      expect(weakPatternRow?.querySelector('svg.lucide-x')).not.toBeNull()
      expect(weakPatternRow?.querySelector('svg.lucide-check')).toBeNull()
    })

    // "Perfekt! Ditt lösenord är säkert." ska INTE visas — annars ljuger
    // indikatorn om ett lösenord som Zod ändå kommer neka vid submit.
    expect(screen.queryByText(/perfekt! ditt lösenord är säkert/i)).not.toBeInTheDocument()
  })
})

// KO3: den tredje kryssrutan (AI-behandling) är INTE rättsligt nödvändig för
// att skapa ett konto — den ska inte blockera registreringen, och det ska stå
// tydligt att den är valfri.
describe('Register — AI-samtycket blockerar inte registreringen (KO3)', () => {
  beforeEach(() => {
    mockSignUp.mockReset()
    mockSignInWithGoogle.mockReset()
    mockNavigate.mockReset()
  })

  it('märker AI-kryssrutan som valfri', () => {
    renderRegister()
    const aiLabel = screen.getByText(/samtycker till ai-behandling/i).closest('label')
    expect(aiLabel?.textContent).toMatch(/valfritt/i)
  })

  it('går att skicka in formuläret utan att kryssa i AI-samtycket', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    renderRegister()

    await user.type(screen.getByLabelText(/förnamn/i), 'Anna')
    await user.type(screen.getByLabelText(/efternamn/i), 'Andersson')
    await user.type(screen.getByLabelText(/e-postadress/i), 'anna@example.com')
    await user.type(screen.getByLabelText(/^lösenord$/i), 'SecurePass9!xz')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'SecurePass9!xz')
    await user.click(screen.getByLabelText(/godkänner användarvillkoren/i))
    await user.click(screen.getByLabelText(/godkänner integritetspolicyn/i))

    const submitButton = screen.getByRole('button', { name: /^registrera$/i })
    await waitFor(() => expect(submitButton).not.toBeDisabled())

    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
        consent: expect.objectContaining({ aiProcessing: false }),
      }))
    })
  })
})
