/**
 * Drift-genomgången 2026-09-22: språket saknades i React Query-nyckeln.
 * `dbArticleToEnhanced` väljer title/title_en när raden hämtas, så efter ett
 * byte till engelska låg de svenska titlarna kvar i cachen i fem minuter.
 *
 * Mutation (kontrollerad): ta bort `sprak` ur queryKey → testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import i18n from '@/i18n/config'

const getAll = vi.fn(async () => [
  { id: 'a1', title: i18n.language === 'en' ? 'How to write a CV' : 'Så skriver du ett CV' },
])
vi.mock('@/services/supabaseApi', () => ({
  articleApi: { getAll: () => getAll() },
}))

import { useArticles } from './useArticles'

afterEach(async () => {
  await i18n.changeLanguage('sv')
})

describe('useArticles', () => {
  it('hämtar om på det nya språket när språket byts — inte efter staleTime', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useArticles(), { wrapper })
    await waitFor(() => expect(result.current.data?.[0].title).toBe('Så skriver du ett CV'))

    await act(async () => {
      await i18n.changeLanguage('en')
    })

    await waitFor(() => expect(result.current.data?.[0].title).toBe('How to write a CV'))
    expect(getAll).toHaveBeenCalledTimes(2)
  })
})
