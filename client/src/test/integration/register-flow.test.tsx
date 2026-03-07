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

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /skapa konto/i })
    await user.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/förnamn är obligatoriskt/i)).toBeInTheDocument()
    })
  })

  it('should validate password requirements', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Enter weak password
    const passwordInput = screen.getByLabelText(/^lösenord$/i)
    await user.type(passwordInput, 'weak')
    await user.tab()

    // Should show password validation error
    await waitFor(() => {
      expect(passwordInput).toHaveClass('border-red-300')
    })
  })

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Enter different passwords
    const passwordInput = screen.getByLabelText(/^lösenord$/i)
    const confirmInput = screen.getByLabelText(/bekräfta lösenord/i)

    await user.type(passwordInput, 'Password123')
    await user.type(confirmInput, 'Different123')
    await user.tab()

    // Should show mismatch error
    await waitFor(() => {
      expect(screen.getByText(/lösenorden matchar inte/i)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Enter invalid email
    const emailInput = screen.getByLabelText(/e-postadress/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    // Should show email validation error
    await waitFor(() => {
      expect(screen.getByText(/ogiltig e-postadress/i)).toBeInTheDocument()
    })
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
    await user.type(screen.getByLabelText(/^lösenord$/i), 'Password123')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'Password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /skapa konto/i })
    await user.click(submitButton)

    // Should call signUp with correct data
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'anna@example.com',
        password: 'Password123',
        firstName: 'Anna',
        lastName: 'Andersson',
        role: 'USER',
      })
    })
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

    const passwordInput = screen.getByLabelText(/^lösenord$/i)

    // Type weak password
    await user.type(passwordInput, 'weak')

    // Should show password requirements
    expect(screen.getByText(/minst 8 tecken/i)).toBeInTheDocument()
    expect(screen.getByText(/en stor bokstav/i)).toBeInTheDocument()
    expect(screen.getByText(/en siffra/i)).toBeInTheDocument()
  })

  it('should disable submit when password requirements not met', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    )

    const submitButton = screen.getByRole('button', { name: /skapa konto/i })

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
    await user.type(screen.getByLabelText(/^lösenord$/i), 'Password123')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'Password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /skapa konto/i })
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
    await user.type(screen.getByLabelText(/^lösenord$/i), 'Password123')
    await user.type(screen.getByLabelText(/bekräfta lösenord/i), 'Password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /skapa konto/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText(/skapar ditt konto/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})
