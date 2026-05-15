import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Initialize i18n for tests
import '../i18n/config'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage. CV-draft skrivs hit (GDPR-fix 2026-05-09) — testa
// uttryckligen att PII INTE går till localStorage genom att verifiera mot detta.
// Backas av en in-memory store så tester kan göra setItem/getItem i samma test.
const sessionStorageStore = new Map<string, string>()
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStorageStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { sessionStorageStore.set(key, value) }),
  removeItem: vi.fn((key: string) => { sessionStorageStore.delete(key) }),
  clear: vi.fn(() => { sessionStorageStore.clear() }),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
})

// Mock HTMLCanvasElement for Image component
class MockCanvas {
  width = 0
  height = 0
  getContext = vi.fn()
  toDataURL = vi.fn((type) => {
    // Return a data URL that indicates WebP/AVIF support based on requested type
    if (type === 'image/webp') {
      return 'data:image/webp;base64,test'
    }
    if (type === 'image/avif') {
      return 'data:image/avif;base64,test'
    }
    return 'data:image/png;base64,test'
  })
}

// Store original createElement
const originalCreateElement = document.createElement.bind(document)

// Mock document.createElement for canvas
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return new MockCanvas() as unknown as HTMLCanvasElement
  }
  return originalCreateElement(tagName)
}) as typeof document.createElement

// Supabase mock helpers
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
})

// Cleanup after each test
import { cleanup } from '@testing-library/react'
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
