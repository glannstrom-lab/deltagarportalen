/**
 * Login-flödestester — verifierar att Login-komponenten anropar authStore korrekt,
 * visar fel från store, och hanterar Google-login. useZodForm-validation testas
 * separat i useZodForm.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

// Mock store-actions vi kan kontrollera per test
const mockSignIn = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockNavigate = vi.fn()

let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null as string | null,
}

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
    error: mockAuthState.error,
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

function renderLogin(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Login />
    </MemoryRouter>
  )
}

describe('Login — förifylld e-post ur ?email= (F18)', () => {
  it('fyller i e-postfältet från query-strängen', () => {
    renderLogin('/login?email=demo%40jobin.se')
    expect((screen.getByLabelText(/e-post/i) as HTMLInputElement).value).toBe('demo@jobin.se')
  })
  it('ignorerar ett värde som inte är en enkel e-postadress', () => {
    renderLogin('/login?email=%3Cscript%3Ealert(1)%3C%2Fscript%3E')
    expect((screen.getByLabelText(/e-post/i) as HTMLInputElement).value).toBe('')
  })
})

describe('Login', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockSignInWithGoogle.mockReset()
    mockNavigate.mockReset()
    mockAuthState = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }
  })

  it('renderar email- och lösenordsfält', () => {
    renderLogin()
    expect(screen.getByLabelText(/e-post/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^lösenord$/i)).toBeInTheDocument()
  })

  it('anropar signIn med formulärvärden vid submit', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    renderLogin()

    fireEvent.change(screen.getByLabelText(/e-post/i), {
      target: { value: 'anna@example.com', name: 'email' },
    })
    fireEvent.change(screen.getByLabelText(/^lösenord$/i), {
      target: { value: 'hemligt123', name: 'password' },
    })
    fireEvent.click(screen.getByRole('button', { name: /logga in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('anna@example.com', 'hemligt123')
    })
  })

  it('visar authError från store', () => {
    mockAuthState.error = 'Fel lösenord'
    renderLogin()
    expect(screen.getByRole('alert')).toHaveTextContent('Fel lösenord')
  })

  it('anropar signInWithGoogle vid Google-knapp', async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined)
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: /google/i }))

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
    })
  })

  it('navigerar till "/" om användaren redan är autentiserad', () => {
    mockAuthState.isAuthenticated = true
    renderLogin()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('visar laddningsindikator när authStore laddar', () => {
    mockAuthState.isLoading = true
    renderLogin()
    expect(screen.getByRole('status')).toBeInTheDocument()
    // Form ska inte renderas under laddning
    expect(screen.queryByLabelText(/e-post/i)).not.toBeInTheDocument()
  })

  // SFT5 / SV3 / SV4 / SV9 (2026-09-29)
  describe('tillgänglighet (SV3/SV4/SV9)', () => {
    it('har skiplänk till huvudinnehållet och ett <main> som länken pekar på', () => {
      const { container } = renderLogin()
      const lank = screen.getByRole('link', { name: /hoppa till huvudinnehåll/i })
      expect(lank).toHaveAttribute('href', '#main-content')
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'main-content')
      expect(main).toContainElement(screen.getByLabelText(/e-post/i))
      expect(container.querySelector('header')).not.toBeNull()
    })

    it('flyttar fokus till felet efter ett misslyckat försök', async () => {
      mockAuthState.error = 'Fel e-post eller lösenord'
      mockSignIn.mockResolvedValue({ error: 'Fel e-post eller lösenord' })
      renderLogin()
      fireEvent.change(screen.getByLabelText(/e-post/i), { target: { value: 'anna@example.com', name: 'email' } })
      fireEvent.change(screen.getByLabelText(/^lösenord$/i), { target: { value: 'hemligt123', name: 'password' } })
      screen.getByLabelText(/e-post/i).focus()
      fireEvent.click(screen.getByRole('button', { name: /logga in/i }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveFocus()
      })
      expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1')
    })

    it('fokuserar serverfelet även när sidan monterats om under laddningen (prod 2026-09-29)', async () => {
      // I prod monteras Login om medan signIn laddar: `forsok` är 0 igen när felet kommer.
      // Felet i storen är då enda spåret av försöket.
      mockAuthState.error = 'Fel e-post eller lösenord'
      renderLogin()
      await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus())
    })

    it('ett fältfel vid blur flyttar inte fokus mitt under tabbning', () => {
      mockAuthState.error = null
      renderLogin()
      const epost = screen.getByLabelText(/e-post/i)
      epost.focus()
      fireEvent.change(epost, { target: { value: 'inte-en-adress', name: 'email' } })
      fireEvent.blur(epost)
      screen.getByLabelText(/^lösenord$/i).focus()
      expect(screen.getByLabelText(/^lösenord$/i)).toHaveFocus()
    })

    it('felfärgen är red-700 (ljust) / red-300 (mörkt), inte red-600/400 som gav 4,36:1', () => {
      mockAuthState.error = 'Fel lösenord'
      renderLogin()
      const text = screen.getByText('Fel lösenord')
      expect(text.className).toContain('text-red-700')
      expect(text.className).toContain('dark:text-red-300')
      expect(text.className).not.toContain('text-red-600')
    })
  })

  // KO2: subtiteln ska säga VART hon var på väg när returnTo finns i URL:en,
  // i stället för det generiska "Logga in för att fortsätta".
  describe('returnTo-subtitel (KO2)', () => {
    it('nämner verktygets namn för ett känt mål', () => {
      renderLogin('/login?returnTo=%2Fcv')
      expect(screen.getByText(/fortsätta till CV/i)).toBeInTheDocument()
      expect(screen.queryByText('Logga in för att fortsätta')).not.toBeInTheDocument()
    })

    it('visar en neutral rad för ett okänt men säkert mål', () => {
      renderLogin('/login?returnTo=%2Fnagon-okand-sida')
      expect(screen.getByText(/fortsätta dit du var på väg/i)).toBeInTheDocument()
    })

    it('visar den generiska subtiteln utan returnTo', () => {
      renderLogin('/login')
      expect(screen.getByText('Logga in för att fortsätta')).toBeInTheDocument()
    })

    it('visar den generiska subtiteln när returnTo är en osäker (extern) länk', () => {
      renderLogin('/login?returnTo=' + encodeURIComponent('https://ondsajt.se'))
      expect(screen.getByText('Logga in för att fortsätta')).toBeInTheDocument()
    })
  })
})
