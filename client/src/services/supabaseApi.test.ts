import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  authApi,
  cvApi,
  interestApi,
  coverLetterApi,
  jobsApi,
  userApi,
  APIError,
} from './supabaseApi'

// Mock Supabase
const mockAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
}

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockAuth,
    from: vi.fn(() => mockDb),
  },
}))

describe('supabaseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock chain
    mockDb.select.mockReturnThis()
    mockDb.insert.mockReturnThis()
    mockDb.update.mockReturnThis()
    mockDb.delete.mockReturnThis()
    mockDb.upsert.mockReturnThis()
    mockDb.eq.mockReturnThis()
    mockDb.order.mockReturnThis()
    mockDb.limit.mockReturnThis()
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

        mockAuth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })

        mockDb.maybeSingle.mockResolvedValue({ data: mockProfile, error: null })

        const result = await authApi.login(email, password)

        expect(result.token).toBe(mockSession.access_token)
        expect(result.user.firstName).toBe('Test')
        expect(result.user.role).toBe('USER')
      })

      it('should throw APIError on login failure', async () => {
        mockAuth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        })

        await expect(authApi.login('test@test.com', 'wrong')).rejects.toThrow(APIError)
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

        mockAuth.signUp.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })

        const result = await authApi.register(userData)

        expect(result.user.firstName).toBe(userData.firstName)
        expect(result.token).toBe(mockSession.access_token)
      })

      it('should throw error if no session created', async () => {
        mockAuth.signUp.mockResolvedValue({
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

        mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
        mockDb.single.mockResolvedValue({ data: mockProfile, error: null })

        const result = await authApi.getCurrentUser()

        expect(result?.firstName).toBe('Test')
        expect(result?.role).toBe('USER')
      })

      it('should return null if no user', async () => {
        mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

        const result = await authApi.getCurrentUser()

        expect(result).toBeNull()
      })
    })
  })

  describe('cvApi', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' }

    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
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

        mockDb.maybeSingle.mockResolvedValue({ data: mockCV, error: null })

        const result = await cvApi.getCV()

        expect(result?.workExperience).toEqual(mockCV.work_experience)
        expect(result?.colorScheme).toBe('indigo')
        expect(result?.firstName).toBe('Test')
      })

      it('should return null if no CV found', async () => {
        mockDb.maybeSingle.mockResolvedValue({ data: null, error: null })

        const result = await cvApi.getCV()

        expect(result).toBeNull()
      })

      it('should throw error if not authenticated', async () => {
        mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

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

        mockDb.upsert.mockReturnThis()
        mockDb.single.mockResolvedValue({ data: mockUpdatedCV, error: null })

        const result = await cvApi.updateCV(cvData)

        expect(result).toEqual(mockUpdatedCV)
      })
    })

    describe('getVersions', () => {
      it('should return CV versions', async () => {
        const mockVersions = [
          { id: 'v1', name: 'Version 1', created_at: '2024-01-01' },
          { id: 'v2', name: 'Version 2', created_at: '2024-01-15' },
        ]

        mockDb.eq.mockReturnThis()
        mockDb.order.mockReturnThis()
        // @ts-ignore
        mockDb.select.mockResolvedValue({ data: mockVersions, error: null })

        const result = await cvApi.getVersions()

        expect(result).toHaveLength(2)
        expect(result[0].name).toBe('Version 1')
      })
    })
  })

  describe('coverLetterApi', () => {
    const mockUser = { id: 'user1', email: 'test@example.com' }

    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
    })

    describe('getAll', () => {
      it('should return all cover letters for user', async () => {
        const mockLetters = [
          { id: 'l1', title: 'Letter 1', content: 'Content 1', user_id: 'user1' },
          { id: 'l2', title: 'Letter 2', content: 'Content 2', user_id: 'user1' },
        ]

        // @ts-ignore
        mockDb.select.mockResolvedValue({ data: mockLetters, error: null })

        const result = await coverLetterApi.getAll()

        expect(result).toHaveLength(2)
        expect(result[0].title).toBe('Letter 1')
      })
    })

    describe('create', () => {
      it('should create new cover letter', async () => {
        const newLetter = {
          title: 'New Letter',
          content: 'Letter content',
          company: 'Test Company',
        }
        const mockCreated = { id: 'l3', ...newLetter, user_id: 'user1' }

        mockDb.insert.mockReturnThis()
        mockDb.single.mockResolvedValue({ data: mockCreated, error: null })

        const result = await coverLetterApi.create(newLetter)

        expect(result.title).toBe(newLetter.title)
        expect(result.user_id).toBe('user1')
      })
    })

    describe('delete', () => {
      it('should delete cover letter', async () => {
        // @ts-ignore
        mockDb.delete.mockResolvedValue({ error: null })

        const result = await coverLetterApi.delete('l1')

        expect(result).toBe(true)
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

        await expect(jobsApi.search({})).rejects.toThrow(APIError)
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
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
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

        mockDb.single.mockResolvedValue({ data: mockProfile, error: null })

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

        mockDb.update.mockReturnThis()
        mockDb.eq.mockReturnThis()
        mockDb.single.mockResolvedValue({ data: mockUpdated, error: null })

        const result = await userApi.updateProfile(updates)

        expect(result.first_name).toBe('Updated')
      })
    })
  })

  describe('APIError', () => {
    it('should create error with message', () => {
      const error = new APIError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('APIError')
    })

    it('should create error with code and status', () => {
      const error = new APIError('Test error', 'TEST_CODE', 400)
      expect(error.code).toBe('TEST_CODE')
      expect(error.status).toBe(400)
    })
  })
})
