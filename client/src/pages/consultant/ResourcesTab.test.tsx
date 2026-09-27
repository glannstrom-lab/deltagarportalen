/**
 * Tester för ResourcesTab (KS7).
 *
 * Mallarna (consultant_goal_templates): en misslyckad hämtning föll tyst
 * tillbaka på tre hårdkodade exempelmallar — identiskt med en fungerande
 * hämtning som råkar sakna anpassade mallar. Nu syns felet i en banner ovanför
 * exempelmallarna.
 *
 * Jobbsamlingarna (consultant_job_collections): en misslyckad hämtning gav
 * bara console.error och `collections` stod kvar på [] — EXAKT samma
 * EmptyState som en riktigt tom lista. Nu ersätts den vyn av ett eget
 * felläge.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import { ResourcesTab } from './ResourcesTab'

type TableResponse = { data: unknown; error: unknown }

function makeBuilder(response: TableResponse) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    or: vi.fn(() => builder),
    then: (onFulfilled: (v: TableResponse) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(response).then(onFulfilled, onRejected),
  }
  return builder
}

let tableResponses: Record<string, TableResponse>
let fromCallCount: Record<string, number>

const mockUser = { id: 'consultant-1', email: 'consultant@example.com' }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser } })),
    },
    from: vi.fn((table: string) => {
      fromCallCount[table] = (fromCallCount[table] || 0) + 1
      return makeBuilder(tableResponses[table] ?? { data: [], error: null })
    }),
  },
}))

function renderTab() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ResourcesTab />
    </I18nextProvider>
  )
}

beforeEach(() => {
  fromCallCount = {}
  tableResponses = {
    consultant_goal_templates: { data: [], error: null },
    consultant_job_collections: { data: [], error: null },
  }
})

describe('ResourcesTab — KS7: mallarnas felläge', () => {
  it('visar en synlig felbanner med "Försök igen" när mallhämtningen misslyckas — och markerar exempelmallarna som just exempel', async () => {
    tableResponses.consultant_goal_templates = {
      data: null,
      error: { message: 'network down' },
    }
    renderTab()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/mallar kunde inte hämtas/i)
    expect(alert).toHaveTextContent(/inbyggda mallarna/i)

    expect(fromCallCount.consultant_goal_templates).toBe(1)

    tableResponses.consultant_goal_templates = { data: [], error: null }
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))

    await waitFor(() => {
      expect(fromCallCount.consultant_goal_templates).toBe(2)
    })
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('visar INGEN felbanner när mallhämtningen lyckas, även med noll egna mallar', async () => {
    renderTab()

    await screen.findByText('Lära sig ny kompetens')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// RK21/RR17 (rollspelet 2026-09-27): Resurser → Målmallar sa "Inga mallar
// matchade din sökning" utan någon sökning, medan måldialogen hade fem mallar.
// Mutation: ta bort INBYGGDA ur setTemplates → faller; ta bort filtervillkoret
// på tomtexten → faller på "utan sökning".
describe('ResourcesTab — RK21: samma mallar som måldialogen', () => {
  it('visar dialogens fem inbyggda mallar utan egna sparade — och inget "matchade din sökning"', async () => {
    const { INBYGGDA_MALMALLAR } = await import('@/components/consultant/inbyggdaMalmallar')
    renderTab()
    for (const m of INBYGGDA_MALMALLAR) {
      expect(await screen.findByText(m.title)).toBeInTheDocument()
    }
    expect(INBYGGDA_MALMALLAR).toHaveLength(5)
    expect(screen.queryByText(/matchade/i)).not.toBeInTheDocument()
    // Inget påhittat användningstal på en inbyggd mall.
    expect(screen.queryByText(/Använd \d+ gånger/)).not.toBeInTheDocument()
  })

  it('säger "matchade din sökning" först när en sökning faktiskt inte ger träff', async () => {
    renderTab()
    await screen.findByText('Lära sig ny kompetens')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'finnsinte' } })
    expect(await screen.findByText(/matchade/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Visa alla mallar' }))
    expect(await screen.findByText('Lära sig ny kompetens')).toBeInTheDocument()
  })
})

describe('ResourcesTab — KS7: jobbsamlingarnas felläge', () => {
  it('visar ett eget felläge — INTE samma tomtillstånd som "inga samlingar ännu" — när hämtningen misslyckas', async () => {
    tableResponses.consultant_job_collections = {
      data: null,
      error: { message: 'network down' },
    }
    renderTab()

    fireEvent.click(screen.getByRole('button', { name: /jobbsamlingar/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/jobbsamlingarna kunde inte hämtas/i)
    expect(screen.queryByText(/inga samlingar/i)).not.toBeInTheDocument()

    expect(fromCallCount.consultant_job_collections).toBe(1)

    tableResponses.consultant_job_collections = { data: [], error: null }
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))

    await waitFor(() => {
      expect(fromCallCount.consultant_job_collections).toBe(2)
    })
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
