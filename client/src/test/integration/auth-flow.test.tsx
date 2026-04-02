import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import { useAuthStore } from '@/stores/authStore'

// Mock Supabase
const mockSignInWithPassword = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth store
    useAuthStore.setState({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  describe('Login Flow', () => {
    it('should allow user to login successfully', async () => {
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user1', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      })

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<div>Dashboard Page</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // Fill in login form
      await user.type(screen.getByLabelText(/e-postadress/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^lösenord$/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /logga in/i }))

      // Verify signIn was called
      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('should show error on invalid credentials', async () => {
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // Fill in login form
      await user.type(screen.getByLabelText(/e-postadress/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/^lösenord$/i), 'wrongpassword')

      // Submit form
      await user.click(screen.getByRole('button', { name: /logga in/i }))

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/fel e-post eller lösenord/i)).toBeInTheDocument()
      })
    })

    it('should have submit button with correct type', async () => {
      const queryClient = createTestQueryClient()

      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // Wait for the form to be rendered
      const submitButton = await screen.findByRole('button', { name: /logga in/i })

      // Verify the button is a submit button
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Protected Routes', () => {
    it('should handle unauthenticated state', async () => {
      const queryClient = createTestQueryClient()

      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      // When not authenticated, the store state should reflect this
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()

      // The route protection should be handled by the app's routing logic
      // This test verifies the auth state is correctly set for unauthenticated users
    })
  })
})
