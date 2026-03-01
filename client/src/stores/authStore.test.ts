import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore, type Profile } from './authStore'

// Mock Supabase
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()
const mockGetSession = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: vi.fn(() => ({ 
        data: { 
          subscription: { 
            unsubscribe: vi.fn() 
          } 
        } 
      })),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}))

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useAuthStore.getState()
    store.signOut()
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should set authenticated state when session exists', async () => {
      const mockSession = {
        access_token: 'token123',
        user: { id: 'user1', email: 'test@example.com' },
      }
      const mockProfile: Profile = {
        id: 'user1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'USER',
        phone: null,
        avatar_url: null,
        consultant_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockGetUser.mockResolvedValue({ data: { user: mockSession.user }, error: null })
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      
      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      })

      const store = useAuthStore.getState()
      await store.initialize()

      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockSession.user)
      expect(store.profile).toEqual(mockProfile)
      expect(store.isLoading).toBe(false)
    })

    it('should set unauthenticated state when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      const store = useAuthStore.getState()
      await store.initialize()

      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('should handle initialization errors', async () => {
      mockGetSession.mockResolvedValue({ 
        data: { session: null }, 
        error: { message: 'Session error' } 
      })

      const store = useAuthStore.getState()
      await store.initialize()

      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Session error')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' }
      const mockUser = { id: 'user1', email: credentials.email }
      const mockSession = { access_token: 'token123', user: mockUser }
      const mockProfile: Profile = {
        id: 'user1',
        email: credentials.email,
        first_name: 'Test',
        last_name: 'User',
        role: 'USER',
        phone: null,
        avatar_url: null,
        consultant_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      mockSignInWithPassword.mockResolvedValue({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      
      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      })

      const store = useAuthStore.getState()
      const result = await store.signIn(credentials.email, credentials.password)

      expect(result.error).toBeNull()
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials)
    })

    it('should handle invalid credentials error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const store = useAuthStore.getState()
      const result = await store.signIn('test@example.com', 'wrongpassword')

      expect(result.error).toBe('Fel e-post eller lösenord')
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle unconfirmed email error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      })

      const store = useAuthStore.getState()
      const result = await store.signIn('test@example.com', 'password')

      expect(result.error).toBe('E-postadressen är inte bekräftad')
    })
  })

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }
      const mockUser = { id: 'user2', email: userData.email }
      const mockSession = { access_token: 'token123', user: mockUser }

      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: { ...mockUser, first_name: userData.firstName, last_name: userData.lastName }, 
        error: null 
      })
      
      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      })

      const store = useAuthStore.getState()
      const result = await store.signUp(userData)

      expect(result.error).toBeNull()
      expect(store.isAuthenticated).toBe(true)
      expect(mockSignUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: 'USER',
          },
        },
      })
    })

    it('should handle email confirmation required', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }

      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user2' }, session: null },
        error: null,
      })

      const store = useAuthStore.getState()
      const result = await store.signUp(userData)

      expect(result.error).toContain('e-postbekräftelse')
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      const store = useAuthStore.getState()
      await store.signOut()

      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.profile).toBeNull()
      expect(store.session).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = { id: 'user1', email: 'test@example.com' }
      const initialProfile: Profile = {
        id: 'user1',
        email: 'test@example.com',
        first_name: 'Old',
        last_name: 'Name',
        role: 'USER',
        phone: null,
        avatar_url: null,
        consultant_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      }

      // Set initial state
      useAuthStore.setState({
        user: mockUser,
        profile: initialProfile,
        isAuthenticated: true,
      })

      const updates = { first_name: 'New', last_name: 'Name' }
      
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({ 
        data: { ...initialProfile, ...updates }, 
        error: null 
      })
      
      mockFrom.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        single: mockSingle,
      })

      const store = useAuthStore.getState()
      const result = await store.updateProfile(updates)

      expect(result.error).toBeNull()
      expect(store.profile?.first_name).toBe('New')
    })

    it('should return error when not authenticated', async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false })

      const store = useAuthStore.getState()
      const result = await store.updateProfile({ first_name: 'New' })

      expect(result.error).toBe('Inte inloggad')
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' })
      
      const store = useAuthStore.getState()
      store.clearError()

      expect(store.error).toBeNull()
    })
  })
})
