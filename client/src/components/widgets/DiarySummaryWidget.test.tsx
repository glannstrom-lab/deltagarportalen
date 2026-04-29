import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DiarySummaryWidget from './DiarySummaryWidget'

vi.mock('@/hooks/useSupabase', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    profile: null,
    loading: false,
    isAuthenticated: true,
  }),
}))

function renderWithCache(cacheData: unknown, props: Record<string, unknown> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (cacheData !== undefined) {
    qc.setQueryData(['hub', 'min-vardag', 'u1'], cacheData)
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DiarySummaryWidget
          id="dagbok-summary"
          size="M"
          allowedSizes={['S', 'M']}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DiarySummaryWidget', () => {
  it('renders "Skriv idag" empty state when count=0', () => {
    renderWithCache({ diaryEntryCount: 0 })
    expect(screen.getByText('Skriv idag')).toBeInTheDocument()
  })

  it('renders "4 inlägg" when count=4', () => {
    renderWithCache({ diaryEntryCount: 4 })
    expect(screen.getByText('4 inlägg')).toBeInTheDocument()
  })

  it('forwards onHide to Widget (hide-button in editMode)', () => {
    renderWithCache(
      { diaryEntryCount: 0 },
      { editMode: true, onHide: vi.fn() }
    )
    expect(screen.getByRole('button', { name: /Dölj widget Dagbok/ })).toBeInTheDocument()
  })
})
