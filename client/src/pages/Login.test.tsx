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

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

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
})
