/**
 * MoodTab — F21 (WCAG 4.1.2): humörkalenderns månadsnavigering
 * (prev/next) var två namnlösa ikonknappar (docs/portal-review-2026-08-09.md
 * fynd 5 / ROADMAP F21).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/useDiary', () => ({
  useMoodLogs: () => ({
    logs: [],
    todayMood: null,
    stats: { averageMood: 0, averageEnergy: 0, totalLogs: 0 },
    logMood: vi.fn(),
    isLoading: false,
  }),
}))

import { MoodTab } from './MoodTab'

describe('F21: MoodTab månadsnavigering har tillgängliga namn', () => {
  it('föregående/nästa månad-knapparna har aria-label, inte bara en pilikon', () => {
    render(<MoodTab />)
    expect(screen.getByRole('button', { name: /föregående månad/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nästa månad/i })).toBeInTheDocument()
  })
})
