/**
 * Tester för InsightsPanel.tsx (KV2, 2026-09-02).
 *
 * `consultantInsights.generateParticipantInsights` returnerar sedan KV2
 * `{ insights, goalInsightsFailed }` i stället för en ren lista — en trasig
 * mål-källa (goal_at_risk/milestone_overdue) ska INTE fälla de redan
 * beräknade deltagar-baserade insikterna. Testerna här verifierar panelens
 * del av kontraktet: att den visar insikterna som kom fram, flaggar den
 * trasiga källan ärligt, och — den skarpa regeln — INTE påstår "Alla
 * deltagare ser bra ut!" när det egentligen är källan som är trasig och
 * ingenting är känt.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ParticipantInsight, KeyMetric, ParticipantRisk } from '@/services/consultantInsights'

const generateParticipantInsights = vi.fn()
const getKeyMetrics = vi.fn()
const assessParticipantRisks = vi.fn()

vi.mock('@/services/consultantInsights', () => ({
  consultantInsights: {
    generateParticipantInsights: (...args: unknown[]) => generateParticipantInsights(...args),
    getKeyMetrics: (...args: unknown[]) => getKeyMetrics(...args),
    assessParticipantRisks: (...args: unknown[]) => assessParticipantRisks(...args),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'consultant-1' } } }) },
  },
}))

import { InsightsPanel } from './InsightsPanel'

function enInsikt(over: Partial<ParticipantInsight> = {}): ParticipantInsight {
  return {
    participantId: 'p1',
    participantName: 'Anna Andersson',
    type: 'engagement_drop',
    priority: 'high',
    title: 'Anna Andersson har inte loggat in på 10 dagar',
    description: 'Överväg att ta kontakt.',
    actionLabel: 'Skicka påminnelse',
    actionPath: '/consultant/participants/p1',
    ...over,
  }
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <InsightsPanel />
    </MemoryRouter>
  )
}

beforeEach(() => {
  generateParticipantInsights.mockReset()
  getKeyMetrics.mockReset()
  assessParticipantRisks.mockReset()
  getKeyMetrics.mockResolvedValue([] as KeyMetric[])
  assessParticipantRisks.mockResolvedValue([] as ParticipantRisk[])
})

describe('InsightsPanel — insikter som redan räknats fram visas', () => {
  it('visar insikten trots att goalInsightsFailed är satt', async () => {
    generateParticipantInsights.mockResolvedValue({
      insights: [enInsikt()],
      goalInsightsFailed: true,
    })

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText(/Anna Andersson har inte loggat in/)).toBeInTheDocument()
    })
    // Den trasiga källan flaggas ärligt, döljs inte.
    expect(screen.getByText(/kunde inte hämtas just nu/i)).toBeInTheDocument()
  })

  it('utan goalInsightsFailed visas ingen felnotis', async () => {
    generateParticipantInsights.mockResolvedValue({
      insights: [enInsikt()],
      goalInsightsFailed: false,
    })

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText(/Anna Andersson har inte loggat in/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/kunde inte hämtas just nu/i)).not.toBeInTheDocument()
  })
})

describe('InsightsPanel — tomt läge ljuger aldrig om en trasig källa', () => {
  it('goalInsightsFailed + tom lista → "kunde inte hämtas", ALDRIG "Alla deltagare ser bra ut"', async () => {
    generateParticipantInsights.mockResolvedValue({
      insights: [],
      goalInsightsFailed: true,
    })

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Insikterna kunde inte hämtas')).toBeInTheDocument()
    })
    // Den skarpa regeln (CLAUDE.md 2026-08-09): ett fel får aldrig se ut som
    // "allt är bra". Ett tomt resultat PGA fel ska inte visa lugnande text.
    expect(screen.queryByText('Alla deltagare ser bra ut!')).not.toBeInTheDocument()
  })

  it('tom lista UTAN fel visar den ärliga "allt är bra"-texten', async () => {
    generateParticipantInsights.mockResolvedValue({
      insights: [],
      goalInsightsFailed: false,
    })

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Alla deltagare ser bra ut!')).toBeInTheDocument()
    })
  })
})

describe('InsightsPanel — hela panelen kan fortfarande fela (participants-frågan)', () => {
  it('generateParticipantInsights kastar → felskärm med "Försök igen"', async () => {
    generateParticipantInsights.mockRejectedValue(new Error('timeout'))

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta insikterna')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Försök igen/i })).toBeInTheDocument()
  })
})
