/**
 * AIAssistant får inte påstå en aktivitetstrend den inte har underlag för
 * (react-hooks/purity, 2026-09-24).
 *
 * Före: komponenten byggde tre påhittade aktiviteter med Date.now() under
 * renderingen ("Simulated activity data - in production from API"). Alla tre
 * låg inom 14 dagar, så trenden blev ALLTID "Uppåt" och insikten ALLTID
 * "Du är 40% mer aktiv än förra månaden" — för varje användare, oavsett vad
 * hon gjort. Nu finns ingen aktivitetskälla, och då visas ingen trend.
 *
 * Mutation: lägg tillbaka mockActivities → båda testen faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardDataQuery: () => ({ data: undefined }),
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ profile: null }),
}))

import { AIAssistant } from './AIAssistant'

function oppna() {
  render(<AIAssistant />)
  fireEvent.click(screen.getByRole('button', { name: /AI-assistent/i }))
}

describe('AIAssistant — ingen påhittad trend', () => {
  it('översikten visar inget trendkort', () => {
    oppna()
    expect(screen.queryByText('Trend')).toBeNull()
    expect(screen.queryByText(/Uppåt/)).toBeNull()
  })

  it('insikterna påstår inte att användaren är mer aktiv än förra månaden', () => {
    oppna()
    const flik = screen.getAllByRole('button').find((b) => /insikter/i.test(b.textContent ?? ''))
    expect(flik).toBeDefined()
    fireEvent.click(flik!)
    expect(screen.queryByText(/aktiv än förra månaden/)).toBeNull()
  })
})
