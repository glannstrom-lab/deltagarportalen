import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from '../../pages/Login'
import { useAuthStore } from '../../stores/authStore'

// Mock auth store
const mockSignIn = vi.fn()
const mockClearError = vi.fn()

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    signIn: mockSignIn,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
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

  it('should validate email format before submission', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Enter invalid email
    const emailInput = screen.getByLabelText(/e-postadress/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Blur the field

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/ogiltig e-postadress/i)).toBeInTheDocument()
    })
  })

  it('should validate password length before submission', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Enter short password
    const passwordInput = screen.getByLabelText(/lösenord/i)
    await user.type(passwordInput, '123')
    await user.tab() // Blur the field

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/minst 6 tecken/i)).toBeInTheDocument()
    })
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
    const passwordInput = screen.getByLabelText(/lösenord/i)
    
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
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Fill in credentials
    const emailInput = screen.getByLabelText(/e-postadress/i)
    const passwordInput = screen.getByLabelText(/lösenord/i)
    
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

  it('should clear previous errors on new submission', async () => {
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
    const passwordInput = screen.getByLabelText(/lösenord/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /logga in/i })
    await user.click(submitButton)

    // Should clear errors
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled()
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

    const passwordInput = screen.getByLabelText(/lösenord/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' }) // Toggle button

    // Password should be hidden by default
    expect(passwordInput.type).toBe('password')

    // Click toggle button
    await user.click(toggleButton)

    // Password should be visible
    expect(passwordInput.type).toBe('text')

    // Click again to hide
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })
})
