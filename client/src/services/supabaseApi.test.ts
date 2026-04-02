import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock functions at module scope
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetUser = vi.fn()
const mockGetSession = vi.fn()

// Database operation mocks
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

// Create a proper chainable mock object
const createChainableMock = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.upsert = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.single = mockSingle
  chain.maybeSingle = mockMaybeSingle
  chain.order = vi.fn(() => chain)
  chain.limit = mockLimit

  return chain
}

const mockChain = createChainableMock()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    from: vi.fn(() => mockChain),
  },
}))

import {
  authApi,
  cvApi,
  coverLetterApi,
  jobsApi,
  userApi,
} from './supabaseApi'

describe('supabaseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authApi', () => {
    describe('login', () => {
      it('should login successfully and return user data', async () => {
        const email = 'test@example.com'
        const password = 'password123'
        const mockUser = { id: 'user1', email }
        const mockSession = { access_token: 'token123' }
        const mockProfile = {
          id: 'user1',
          email,
          first_name: 'Test',
          last_name: 'User',
          role: 'USER',
        }

        mockSignInWithPassword.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })

        mockMaybeSingle.mockResolvedValue({ data: mockProfile, error: null })

        const result = await authApi.login(email, password)

        expect(result.token).toBe(mockSession.access_token)
        expect(result.user.firstName).toBe('Test')
        expect(result.user.role).toBe('USER')
      })

      it('should throw error on login failure', async () => {
        mockSignInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        })

        await expect(authApi.login('test@test.com', 'wrong')).rejects.toThrow()
      })
    })

    describe('register', () => {
      it('should register successfully', async () => {
        const userData = {
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        }
        const mockUser = { id: 'user2', email: userData.email }
        const mockSession = { access_token: 'token123' }

        mockSignUp.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })

        const result = await authApi.register(userData)

        expect(result.user.firstName).toBe(userData.firstName)
        expect(result.token).toBe(mockSession.access_token)
      })

      it('should throw error if no session created', async () => {
        mockSignUp.mockResolvedValue({
          data: { user: { id: 'user2' }, session: null },
          error: null,
        })

        await expect(
          authApi.register({
            email: 'new@test.com',
            password: 'pass',
            firstName: 'New',
            lastName: 'User',
          })
        ).rejects.toThrow('Konto skapat men kräver e-postbekräftelse')
      })
    })

    describe('getCurrentUser', () => {
      it('should return current user with profile', async () => {
        const mockUser = { id: 'user1', email: 'test@example.com' }
        const mockProfile = {
          id: 'user1',
          first_name: 'Test',
          last_name: 'User',
          role: 'USER',
        }

        mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
        mockSingle.mockResolvedValue({ data: mockProfile, error: null })

        const result = await authApi.getCurrentUser()

        expect(result?.firstName).toBe('Test')
        expect(result?.role).toBe('USER')
      })

      it('should return null if no user', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

        const result = await authApi.getCurrentUser()

        expect(result).toBeNull()
      })
    })
  })

  describe('cvApi', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' }

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    })

    describe('getCV', () => {
      it('should return CV data transformed', async () => {
        const mockCV = {
          id: 'cv1',
          user_id: 'user1',
          first_name: 'Test',
          last_name: 'User',
          title: 'Developer',
          work_experience: [{ title: 'Dev', company: 'Company' }],
          color_scheme: 'indigo',
        }

        mockMaybeSingle.mockResolvedValue({ data: mockCV, error: null })

        const result = await cvApi.getCV()

        expect(result?.workExperience).toEqual(mockCV.work_experience)
        expect(result?.colorScheme).toBe('indigo')
        expect(result?.firstName).toBe('Test')
      })

      it('should return null if no CV found', async () => {
        mockMaybeSingle.mockResolvedValue({ data: null, error: null })

        const result = await cvApi.getCV()

        expect(result).toBeNull()
      })

      it('should throw error if not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

        await expect(cvApi.getCV()).rejects.toThrow('Inte inloggad')
      })
    })

    describe('updateCV', () => {
      it('should update CV successfully', async () => {
        const cvData = {
          title: 'Senior Developer',
          workExperience: [{ title: 'Senior Dev', company: 'New Company' }],
        }
        const mockUpdatedCV = {
          id: 'cv1',
          user_id: 'user1',
          ...cvData,
        }

        mockSingle.mockResolvedValue({ data: mockUpdatedCV, error: null })

        const result = await cvApi.updateCV(cvData)

        expect(result).toEqual(mockUpdatedCV)
      })
    })
  })

  describe('coverLetterApi', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' }

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    })

    describe('create', () => {
      it('should create new cover letter', async () => {
        const newLetter = {
          title: 'New Letter',
          content: 'Letter content',
          company: 'Test Company',
        }
        const mockCreated = { id: 'l3', ...newLetter, user_id: 'user1' }

        mockSingle.mockResolvedValue({ data: mockCreated, error: null })

        const result = await coverLetterApi.create(newLetter)

        expect(result.title).toBe(newLetter.title)
        expect(result.user_id).toBe('user1')
      })
    })
  })

  describe('jobsApi', () => {
    describe('search', () => {
      it('should search jobs from Arbetsförmedlingen', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            hits: [
              { id: 'job1', headline: 'Developer', employer: { name: 'Company' } },
            ],
          }),
        })

        const result = await jobsApi.search({ search: 'developer', location: 'Stockholm' })

        expect(result).toHaveLength(1)
        expect(result[0].headline).toBe('Developer')
      })

      it('should throw error on search failure', async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
        })

        await expect(jobsApi.search({})).rejects.toThrow()
      })
    })

    describe('getById', () => {
      it('should get job by ID', async () => {
        const mockJob = { id: 'job1', headline: 'Developer' }

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockJob),
        })

        const result = await jobsApi.getById('job1')

        expect(result.id).toBe('job1')
      })
    })
  })

  describe('userApi', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' }

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    })

    describe('getProfile', () => {
      it('should return user profile', async () => {
        const mockProfile = {
          id: 'user1',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'USER',
        }

        mockSingle.mockResolvedValue({ data: mockProfile, error: null })

        const result = await userApi.getProfile()

        expect(result.first_name).toBe('Test')
        expect(result.role).toBe('USER')
      })
    })

    describe('updateProfile', () => {
      it('should update profile', async () => {
        const updates = { first_name: 'Updated' }
        const mockUpdated = {
          id: 'user1',
          first_name: 'Updated',
          last_name: 'User',
          role: 'USER',
        }

        mockSingle.mockResolvedValue({ data: mockUpdated, error: null })

        const result = await userApi.updateProfile(updates)

        expect(result.first_name).toBe('Updated')
      })
    })
  })
})
