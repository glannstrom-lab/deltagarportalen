import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Register from '../../pages/Register'
import { useAuthStore } from '../../stores/authStore'

// Mock auth store
const mockSignUp = vi.fn()
const mockClearError = vi.fn()

const createMockStore = (overrides = {}) => ({
  signUp: mockSignUp,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  clearError: mockClearError,
  user: null,
  session: null,
  initialize: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  ...overrides,
})

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => createMockStore()),
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('Register Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render registration form with required fields', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Verify all required form fields are present
    expect(screen.getByLabelText(/förnamn/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/efternamn/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-postadress/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^lösenord$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bekräfta lösenord/i)).toBeInTheDocument()

    // Submit button should be initially disabled (password not valid, consent not given)
    const submitButton = screen.getByRole('button', { name: /registrera/i })
    expect(submitButton).toBeDisabled()
  })

  it('should show password strength indicator', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Password requirements should be visible (matches strongPasswordSchema)
    expect(screen.getByText(/minst 12 tecken/i)).toBeInTheDocument()
    expect(screen.getByText(/en stor bokstav/i)).toBeInTheDocument()
    expect(screen.getByText(/en siffra/i)).toBeInTheDocument()
    expect(screen.getByText(/ett specialtecken/i)).toBeInTheDocument()

    // Enter a strong password
    const passwordInput = screen.getByLabelText(/^lösenord$/i)
    await user.type(passwordInput, 'SecurePass123!')

    // Requirements should show as met (green checkmarks appear)
    await waitFor(() => {
      const checkmarks = document.querySelectorAll('.text-green-500')
      expect(checkmarks.length).toBeGreaterThan(0)
    })
  })

  it('should show password match indicator when passwords match', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Enter matching passwords
    const passwordInput = screen.getByLabelText(/^lösenord$/i)
    const confirmInput = screen.getByLabelText(/bekräfta lösenord/i)

    await user.type(passwordInput, 'SecurePass123!')
    await user.type(confirmInput, 'SecurePass123!')

    // Should show passwords match indicator
    await waitFor(() => {
      expect(screen.getByText(/lösenorden matchar/i)).toBeInTheDocument()
    })
  })

  it('should have email input with correct attributes', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Verify email input has correct type and autocomplete
    const emailInput = screen.getByLabelText(/e-postadress/i)
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autocomplete', 'email')
  })

  it('should call signUp with correct data on valid submission', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    mockSignUp.mockResolvedValue({ error: null })

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in valid registration data
    await user.type(screen.getByLabelText(/förnamn/i), 'Anna')
    await user.type(screen.getByLabelText(/efternamn/i), 'Andersson')
    await user.type(screen.getByLabelText(/e-postadress/i), 'anna@example.com')
    await user.type(screen.getByLabelText(/^lösenord$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'SecurePass123!')

    // Accept required consent checkboxes
    await user.click(screen.getByLabelText(/användarvillkoren/i))
    await user.click(screen.getByLabelText(/integritetspolicyn/i))

    // Submit form
    const submitButton = screen.getByRole('button', { name: /registrera/i })
    await user.click(submitButton)

    // Should call signUp with correct data
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
        email: 'anna@example.com',
        password: 'SecurePass123!',
        firstName: 'Anna',
        lastName: 'Andersson',
      }))
    })
  })

  it('should keep submit disabled with weak password', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    const submitButton = screen.getByRole('button', { name: /registrera/i })

    // Initially disabled (no password)
    expect(submitButton).toBeDisabled()

    // Enter weak password
    await user.type(screen.getByLabelText(/^lösenord$/i), 'weak')

    // Should still be disabled
    expect(submitButton).toBeDisabled()
  })

  it('should display error on failed registration', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    mockSignUp.mockResolvedValue({
      error: 'En användare med denna e-postadress finns redan'
    })

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in valid data
    await user.type(screen.getByLabelText(/förnamn/i), 'Anna')
    await user.type(screen.getByLabelText(/efternamn/i), 'Andersson')
    await user.type(screen.getByLabelText(/e-postadress/i), 'anna@example.com')
    await user.type(screen.getByLabelText(/^lösenord$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'SecurePass123!')

    // Accept required consent checkboxes
    await user.click(screen.getByLabelText(/användarvillkoren/i))
    await user.click(screen.getByLabelText(/integritetspolicyn/i))

    // Submit form
    const submitButton = screen.getByRole('button', { name: /registrera/i })
    await user.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/finns redan/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during registration', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 1000)))

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in valid data
    await user.type(screen.getByLabelText(/förnamn/i), 'Anna')
    await user.type(screen.getByLabelText(/efternamn/i), 'Andersson')
    await user.type(screen.getByLabelText(/e-postadress/i), 'anna@example.com')
    await user.type(screen.getByLabelText(/^lösenord$/i), 'SecurePass123!')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'SecurePass123!')

    // Accept required consent checkboxes
    await user.click(screen.getByLabelText(/användarvillkoren/i))
    await user.click(screen.getByLabelText(/integritetspolicyn/i))

    // Submit form
    const submitButton = screen.getByRole('button', { name: /registrera/i })
    await user.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/skapar ditt konto/i)).toBeInTheDocument()
    })
  })
})
