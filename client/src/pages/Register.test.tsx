/**
 * Register — F22 (WCAG 3.3.1 + 4.1.3): fält med valideringsfel ska ha
 * aria-invalid + aria-describedby, och felmeddelandet ska annonseras
 * (role="alert"). Se docs/portal-review-2026-08-09.md fynd 8 / ROADMAP F22.
 *
 * Formulärvalidering i sig (useZodForm) testas separat i useZodForm.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
