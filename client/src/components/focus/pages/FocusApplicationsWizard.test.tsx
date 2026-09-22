/**
 * Regression (2026-09-22): the wizard read `app.position`/`app.job_title`
 * and `app.company`/`app.employer` — none of those fields exist on
 * `Application` (real fields: `jobTitle`, `companyName`, with a fallback to
 * `jobData.headline` / `jobData.employer.name`). Every step in the focus
 * "review your applications" flow therefore always showed the empty-role
 * fallback text and a blank company line, no matter what was actually saved.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Application } from '@/types/application.types'
import { FocusApplicationsWizard } from './FocusApplicationsWizard'

const api = vi.hoisted(() => ({ getAll: vi.fn() }))

vi.mock('@/services/applicationsApi', () => ({
  applicationsApi: { getAll: api.getAll },
}))

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('FocusApplicationsWizard', () => {
  it('shows the real job title and company from the Application fields', async () => {
    const app: Partial<Application> = {
      id: 'a1',
      status: 'saved',
      jobTitle: 'Snickare',
      companyName: 'Byggbolaget AB',
      jobData: {} as Application['jobData'],
    }
    api.getAll.mockResolvedValue([app])

    renderWithClient(<FocusApplicationsWizard onExit={vi.fn()} />)

    expect(await screen.findByText('Snickare')).toBeInTheDocument()
    expect(await screen.findByText('Byggbolaget AB')).toBeInTheDocument()
  })

  it('falls back to jobData.headline/employer.name when the computed fields are missing', async () => {
    const app: Partial<Application> = {
      id: 'a2',
      status: 'saved',
      jobData: { headline: 'Elektriker', employer: { name: 'Elfirman AB' } } as unknown as Application['jobData'],
    }
    api.getAll.mockResolvedValue([app])

    renderWithClient(<FocusApplicationsWizard onExit={vi.fn()} />)

    expect(await screen.findByText('Elektriker')).toBeInTheDocument()
    expect(await screen.findByText('Elfirman AB')).toBeInTheDocument()
  })
})
