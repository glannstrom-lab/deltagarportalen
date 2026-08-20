/**
 * Fokuslägesväxeln får inte radera det man fyllt i.
 *
 * Samma fel som b93be382 lagade i intervjusimulatorn fanns här: `if
 * (isFocusMode)` låg i den YTTRE komponenten, så när flaggan slog om byttes
 * hela `<Routes>`-trädet ut, kalkylatorn avmonterades och yrke, region,
 * erfarenhet och jämförelselistan försvann. Växeln sitter på två ställen som
 * båda syns på just den rutten: toppnavens knapp och "Lugnare läge" i
 * rådgivarkolumnen.
 *
 * Testet VÄXLAR läget i stället för att montera om — en ommontering ser rätt
 * ut även med felet kvar, vilket är precis varför buggen överlevde så länge.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let fokuslage = false

vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: fokuslage, leaveWizard: vi.fn() }),
  FocusModeProvider: () => null,
}))

vi.mock('@/components/layout/index', () => ({
  PageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/radgivare/RadgivarPanel', () => ({
  RadgivarTips: () => null,
}))

vi.mock('@/components/ai', () => ({
  SalaryInsightsPanel: () => null,
}))

vi.mock('@/services/careerApi', () => ({
  salaryApi: { getAll: async () => [], save: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (valjare: (s: unknown) => unknown) => valjare({ profile: null }),
}))

import SalaryPage from '../Salary'

function rendera() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <SalaryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('fokuslägesväxeln på /salary', () => {
  it('behåller ifyllda val när läget slås på och av igen', () => {
    fokuslage = false
    const { rerender } = rendera()

    fireEvent.change(screen.getByLabelText(/yrkesområde/i), { target: { value: 'Juridik' } })
    fireEvent.change(screen.getByLabelText(/var i landet/i), { target: { value: 'Göteborg' } })
    fireEvent.change(screen.getByLabelText(/hur länge/i), { target: { value: '6-10 år' } })
    fireEvent.click(screen.getByRole('button', { name: /räkna ut din lön/i }))
    expect(screen.getByText(/kvar efter skatt/i)).toBeInTheDocument()

    // Slå PÅ fokusläget — normalvyn ska gömmas, inte kastas.
    fokuslage = true
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/']}>
          <SalaryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Guiden visar samma val — den delar tillstånd med kalkylatorn.
    expect(screen.getByRole('button', { name: /juridik/i })).toHaveAttribute('aria-pressed', 'true')

    // Och tillbaka igen.
    fokuslage = false
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/']}>
          <SalaryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect((screen.getByLabelText(/yrkesområde/i) as HTMLSelectElement).value).toBe('Juridik')
    expect((screen.getByLabelText(/var i landet/i) as HTMLSelectElement).value).toBe('Göteborg')

    // Och — det som verkligen skiljer en gömd vy från en avmonterad — det
    // uträknade resultatet står kvar. Ligger grenen i den yttre komponenten
    // igen byts hela trädet ut, kalkylatorn monteras om och resultatet är
    // borta även om valen finns kvar.
    expect(screen.getByText(/kvar efter skatt/i)).toBeInTheDocument()
  })
})
