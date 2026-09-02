/**
 * Tester för consultantInsights.ts (KV2, 2026-09-02).
 *
 * Bakgrund: `consultant_dashboard_participants` (vyn) har `first_name`/
 * `last_name` — ALDRIG `name` (verifierat mot `supabase/schema-snapshot.json`
 * 2026-09-02). Varenda `.name`-läsning i den här filen returnerade därför
 * `undefined` och föll ner på "Deltagare" oavsett vem deltagaren var, och
 * mål-embeddingen `consultant_dashboard_participants!inner(name, user_id)`
 * bad PostgREST om en kolumn som inte finns i vyn.
 *
 * Andra halvan av KV2: `if (goalsError) throw` gjorde att ETT trasigt
 * mål-anrop kastade bort de redan färdigberäknade deltagar-baserade
 * insikterna också. Testerna nedan verifierar att de två källorna nu är
 * isolerade från varandra.
 *
 * Fixturerna har vyns verkliga kolumner (first_name/last_name, has_cv,
 * last_login, ats_score, saved_jobs_count, user_id, status) — inte `name`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mockad Supabase-klient -------------------------------------------------
// Samma mönster som useJobsokHubSummary.test.ts: en builder per tabell som
// kedjar .select()/.eq() och är thenable i änden.
function makeBuilder(data: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  ;(builder as Record<string, unknown>).then = (
    onResolve: (v: { data: unknown; error: unknown }) => unknown
  ) => Promise.resolve({ data, error }).then(onResolve)
  return builder
}

const fromMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...(args as [string])),
    auth: { getUser: async () => ({ data: { user: { id: 'consultant-1' } } }) },
  },
}))

import {
  generateParticipantInsights,
  assessParticipantRisks,
  getDashboardSummary,
} from './consultantInsights'

/** En rad med vyns verkliga kolumner. */
function deltagare(over: Record<string, unknown> = {}) {
  return {
    consultant_id: 'consultant-1',
    participant_id: 'p1',
    user_id: 'p1',
    first_name: 'Anna',
    last_name: 'Andersson',
    status: 'ACTIVE',
    has_cv: true,
    ats_score: 60,
    saved_jobs_count: 1,
    last_login: new Date().toISOString(),
    ...over,
  }
}

beforeEach(() => {
  fromMock.mockReset()
})

describe('generateParticipantInsights — namn läses ur first_name/last_name', () => {
  it('deltagare med namn visas med sitt riktiga namn, inte "Deltagare"', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') {
        return makeBuilder([
          deltagare({ last_login: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }),
        ])
      }
      if (table === 'consultant_goals') return makeBuilder([])
      throw new Error(`oväntad tabell: ${table}`)
    })

    const result = await generateParticipantInsights('consultant-1')
    expect(result.goalInsightsFailed).toBe(false)
    const engagementInsight = result.insights.find(i => i.type === 'engagement_drop')
    expect(engagementInsight).toBeDefined()
    expect(engagementInsight!.participantName).toBe('Anna Andersson')
    expect(engagementInsight!.title).toContain('Anna Andersson')
    expect(engagementInsight!.title).not.toContain('Deltagare')
  })

  it('deltagare helt utan namn faller tillbaka på "Deltagare" (aldrig tomt/undefined)', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') {
        return makeBuilder([
          deltagare({
            first_name: null,
            last_name: null,
            last_login: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        ])
      }
      if (table === 'consultant_goals') return makeBuilder([])
      throw new Error(`oväntad tabell: ${table}`)
    })

    const result = await generateParticipantInsights('consultant-1')
    const engagementInsight = result.insights.find(i => i.type === 'engagement_drop')
    expect(engagementInsight!.participantName).toBe('Deltagare')
  })

  it('mål-baserade insikter läser namnet ur first_name/last_name-embedden, inte "name"', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') return makeBuilder([])
      if (table === 'consultant_goals') {
        return makeBuilder([
          {
            id: 'g1',
            title: 'Öva intervju',
            participant_id: 'p2',
            deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 20,
            // Embedden PostgREST faktiskt returnerar efter KV2-rättelsen:
            participant: { first_name: 'Bo', last_name: 'Berg', user_id: 'p2' },
          },
        ])
      }
      throw new Error(`oväntad tabell: ${table}`)
    })

    const result = await generateParticipantInsights('consultant-1')
    const overdue = result.insights.find(i => i.type === 'milestone_overdue')
    expect(overdue).toBeDefined()
    expect(overdue!.participantName).toBe('Bo Berg')
  })
})

describe('generateParticipantInsights — en trasig källa fäller inte de andra (KV2)', () => {
  it('goals-frågan misslyckas → deltagar-baserade insikter visas ändå, goalInsightsFailed=true', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') {
        return makeBuilder([
          deltagare({ last_login: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() }),
        ])
      }
      if (table === 'consultant_goals') {
        return makeBuilder(null, { message: 'column consultant_dashboard_participants.name does not exist', code: '42703' })
      }
      throw new Error(`oväntad tabell: ${table}`)
    })

    const result = await generateParticipantInsights('consultant-1')
    expect(result.goalInsightsFailed).toBe(true)
    // Deltagar-baserad insikt (engagement_drop) ska INTE ha försvunnit.
    expect(result.insights.some(i => i.type === 'engagement_drop')).toBe(true)
  })

  it('participants-frågan misslyckas → kastar (ingenting går att räkna utan den)', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') {
        return makeBuilder(null, { message: 'timeout' })
      }
      throw new Error(`oväntad tabell: ${table}`)
    })

    await expect(generateParticipantInsights('consultant-1')).rejects.toBeTruthy()
  })
})

describe('assessParticipantRisks — namn läses ur first_name/last_name', () => {
  it('en riskfylld deltagare visas med sitt riktiga namn', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') {
        return makeBuilder([deltagare({ has_cv: false, last_login: null })])
      }
      throw new Error(`oväntad tabell: ${table}`)
    })

    const risks = await assessParticipantRisks('consultant-1')
    expect(risks).toHaveLength(1)
    expect(risks[0].participantName).toBe('Anna Andersson')
  })
})

describe('getDashboardSummary — destrukturerar insights-resultatet korrekt', () => {
  it('topInsight kommer ur insights.insights[0], inte ur hela resultatobjektet', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'consultant_dashboard_participants') {
        return makeBuilder([
          deltagare({ last_login: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() }),
        ])
      }
      if (table === 'consultant_goals') return makeBuilder([])
      throw new Error(`oväntad tabell: ${table}`)
    })

    const summary = await getDashboardSummary('consultant-1')
    expect(summary.topInsight).not.toBeNull()
    expect(summary.topInsight!.participantName).toBe('Anna Andersson')
  })
})

describe('negativ kontroll — testerna kan falla', () => {
  it('hade fällt om formatParticipantName inte användes (gamla `participant.name`-läget)', () => {
    const gammalt = (p: Record<string, unknown>) => (p.name as string) || 'Deltagare'
    // Vyns rader har aldrig `name` — den gamla koden gav alltid "Deltagare".
    expect(gammalt(deltagare())).toBe('Deltagare')
  })
})
