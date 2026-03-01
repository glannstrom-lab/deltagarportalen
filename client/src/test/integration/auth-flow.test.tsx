import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
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
      
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user1', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      )

      // Fill in login form
      await user.type(screen.getByLabelText(/e-postadress/i), 'test@example.com')
      await user.type(screen.getByLabelText(/lösenord/i), 'password123')

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
      
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      )

      // Fill in login form
      await user.type(screen.getByLabelText(/e-postadress/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/lösenord/i), 'wrongpassword')

      // Submit form
      await user.click(screen.getByRole('button', { name: /logga in/i }))

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/fel e-post eller lösenord/i)).toBeInTheDocument()
      })
    })

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup()
      
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSignInWithPassword.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      )

      // Fill in login form
      await user.type(screen.getByLabelText(/e-postadress/i), 'test@example.com')
      await user.type(screen.getByLabelText(/lösenord/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /logga in/i }))

      // Check button is disabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /loggar in/i })).toBeDisabled()
      })
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </MemoryRouter>
      )

      // Should show loading first, then redirect
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument()
      })
    })
  })
})
