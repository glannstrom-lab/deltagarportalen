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
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

  // RK12 (rollspelet 2026-09-27): "Alla deltagare ser bra ut!" stod bredvid
  // "Risker (2)". En tom regelträff är inget besked om att alla mår bra.
  it('tom lista UTAN fel säger vad reglerna tittar på — aldrig "alla ser bra ut"', async () => {
    generateParticipantInsights.mockResolvedValue({
      insights: [],
      goalInsightsFailed: false,
    })

    renderPanel()

    expect(await screen.findByText('Inga insikter just nu')).toBeInTheDocument()
    expect(screen.getByText(/det säger inte att alla deltagare mår bra/)).toBeInTheDocument()
    expect(screen.queryByText(/ser bra ut/)).not.toBeInTheDocument()
  })

  it('RK12: tom insiktslista men risker finns → pekar på riskerna i stället för att lugna', async () => {
    generateParticipantInsights.mockResolvedValue({ insights: [], goalInsightsFailed: false })
    assessParticipantRisks.mockResolvedValue([
      { participantId: 'p1', participantName: 'Anna Andersson', riskScore: 45, riskFactors: ['Inget CV skapat'], recommendedActions: [] },
      { participantId: 'p2', participantName: 'Omar Deltagare', riskScore: 20, riskFactors: ['Aldrig loggat in'], recommendedActions: [] },
    ] as ParticipantRisk[])

    renderPanel()

    const knapp = await screen.findByRole('button', { name: 'Se 2 deltagare med riskfaktorer' })
    fireEvent.click(knapp)
    expect(await screen.findByText('Anna Andersson')).toBeInTheDocument()
  })

  it('RK12: panelen kallar sig inte AI — reglerna är fasta och påverkas inte av AI-brytaren', async () => {
    generateParticipantInsights.mockResolvedValue({ insights: [], goalInsightsFailed: false })
    renderPanel()
    expect(await screen.findByText(/ingen AI/)).toBeInTheDocument()
    expect(screen.queryByText('AI-insikter')).not.toBeInTheDocument()
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

describe('InsightsPanel — PG2-rest: fast fel säger inte "försök igen"', () => {
  it('PostgREST-fel (PGRST201) → fast fel utan "Försök igen"-knapp', async () => {
    generateParticipantInsights.mockRejectedValue({ code: 'PGRST201', message: 'Could not embed', details: null, hint: null })

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta insikterna')).toBeInTheDocument()
    })
    expect(screen.getByText(/behöver en kodändring/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Försök igen/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/försök igen om en stund/i)).not.toBeInTheDocument()
  })

  it('nätfel (TypeError: Failed to fetch) → tillfälligt, med "Försök igen"', async () => {
    generateParticipantInsights.mockRejectedValue(new TypeError('Failed to fetch'))

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta insikterna')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Försök igen/i })).toBeInTheDocument()
  })

  it('goalInsightsFailed + tom lista lovar inte att "en stund" hjälper', async () => {
    generateParticipantInsights.mockResolvedValue({ insights: [], goalInsightsFailed: true })

    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Insikterna kunde inte hämtas')).toBeInTheDocument()
    })
    expect(screen.queryByText(/försök igen om en stund/i)).not.toBeInTheDocument()
  })
})
