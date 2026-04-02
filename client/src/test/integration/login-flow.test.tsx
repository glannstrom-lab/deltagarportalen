import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from '../../pages/Login'
import { useAuthStore } from '../../stores/authStore'

// Mock auth store - return a function that returns the store state
const mockSignIn = vi.fn()
const mockClearError = vi.fn()

const createMockStore = (overrides = {}) => ({
  signIn: mockSignIn,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  clearError: mockClearError,
  user: null,
  session: null,
  initialize: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  ...overrides,
})

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => createMockStore()),
}))

// Create test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with correct input types', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Verify email input has correct type
    const emailInput = screen.getByLabelText(/e-postadress/i)
    expect(emailInput).toHaveAttribute('type', 'email')

    // Verify password input has correct type (use id selector to be specific)
    const passwordInput = document.getElementById('password') as HTMLInputElement
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Verify submit button exists
    expect(screen.getByRole('button', { name: /logga in/i })).toBeInTheDocument()
  })

  it('should have accessible form labels', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Email input should be accessible via label
    expect(screen.getByLabelText(/e-postadress/i)).toBeInTheDocument()

    // Password input should exist with correct id
    expect(document.getElementById('password')).toBeInTheDocument()
  })

  it('should call signIn with correct credentials on valid form submission', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    
    mockSignIn.mockResolvedValue({ error: null })

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in valid credentials
    const emailInput = screen.getByLabelText(/e-postadress/i)
    const passwordInput = document.getElementById('password')!
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /logga in/i })
    await user.click(submitButton)

    // Should call signIn with correct data
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    
    // Create a delayed promise
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 1000)))

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in credentials
    const emailInput = screen.getByLabelText(/e-postadress/i)
    const passwordInput = document.getElementById('password')!
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /logga in/i })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText(/loggar in/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should display error message on failed login', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    
    // Update mock to return authenticated state with error
    vi.mocked(useAuthStore).mockReturnValue({
      signIn: mockSignIn,
      isAuthenticated: false,
      isLoading: false,
      error: 'Fel e-post eller lösenord',
      clearError: mockClearError,
    } as any)

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Error message should be displayed
    expect(screen.getByText(/fel e-post eller lösenord/i)).toBeInTheDocument()
  })

  it('should call signIn when form is submitted', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    mockSignIn.mockResolvedValue({ error: null })

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in credentials
    const emailInput = screen.getByLabelText(/e-postadress/i)
    const passwordInput = document.getElementById('password')!

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /logga in/i })
    await user.click(submitButton)

    // Should call signIn with credentials
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    const passwordInput = document.getElementById('password')! as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /visa lösenord/i })

    // Password should be hidden by default
    expect(passwordInput.type).toBe('password')

    // Click toggle button
    await user.click(toggleButton)

    // Password should be visible
    expect(passwordInput.type).toBe('text')

    // Click again to hide (button now says "Dölj lösenord")
    const hideButton = screen.getByRole('button', { name: /dölj lösenord/i })
    await user.click(hideButton)
    expect(passwordInput.type).toBe('password')
  })
})
