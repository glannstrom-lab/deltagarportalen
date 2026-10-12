import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEnbartHandlaggareICache } from './useKonsulentFlikar'

function med(klient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={klient}>{children}</QueryClientProvider>
  )
}

describe('useEnbartHandlaggareICache (KSL15)', () => {
  it('döljer de dolda flikarna medan medlemskapen saknas i cachen', () => {
    const { result } = renderHook(() => useEnbartHandlaggareICache(), { wrapper: med(new QueryClient()) })
    expect(result.current).toBe(true)
  })

  it('visar allt för en vanlig konsulent när svaret finns', () => {
    const k = new QueryClient()
    k.setQueryData(['org-medlemskap'], [{ role: 'konsulent' }])
    const { result } = renderHook(() => useEnbartHandlaggareICache(), { wrapper: med(k) })
    expect(result.current).toBe(false)
  })

  it('begränsar för den som enbart är handläggare', () => {
    const k = new QueryClient()
    k.setQueryData(['org-medlemskap'], [{ role: 'handlaggare' }])
    const { result } = renderHook(() => useEnbartHandlaggareICache(), { wrapper: med(k) })
    expect(result.current).toBe(true)
  })

  it('visar allt om frågan misslyckats — ingen permanent handläggarvy', async () => {
    const k = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await k.prefetchQuery({ queryKey: ['org-medlemskap'], queryFn: () => Promise.reject(new Error('nät')) })
    const { result } = renderHook(() => useEnbartHandlaggareICache(), { wrapper: med(k) })
    expect(result.current).toBe(false)
  })

  it('utan QueryClientProvider visas allt', () => {
    const { result } = renderHook(() => useEnbartHandlaggareICache())
    expect(result.current).toBe(false)
  })
})
