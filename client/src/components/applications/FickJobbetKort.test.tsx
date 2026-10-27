import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FickJobbetKort } from './FickJobbetKort'
import { useFickJobbetStore } from '@/stores/fickJobbetStore'

const toggleActive = vi.fn().mockResolvedValue({})
const insert = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/services/jobsApi', () => ({
  jobAlertsApi: {
    getAll: vi.fn().mockResolvedValue([{ id: 'a1', is_active: true }, { id: 'a2', is_active: false }]),
    toggleActive: (...a: unknown[]) => toggleActive(...a),
  },
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: { id: 'kons-1' }, error: null }),
    from: vi.fn(() => ({ insert: (...a: unknown[]) => insert(...a) })),
  },
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ profile: { first_name: 'Anna', last_name: 'B' } }),
}))

function ritaKort() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><FickJobbetKort /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FickJobbetKort', () => {
  beforeEach(() => {
    toggleActive.mockClear()
    insert.mockClear()
    useFickJobbetStore.setState({ ansokan: null })
  })

  it('visar inget utan ansökan', () => {
    ritaKort()
    expect(screen.queryByTestId('fick-jobbet-kort')).toBeNull()
  })

  it('pausar bara aktiva bevakningar och bara efter klick', async () => {
    useFickJobbetStore.getState().visa({ id: '1', titel: 'Lagerarbetare', foretag: 'Acme' })
    ritaKort()
    const knapp = await screen.findByRole('button', { name: 'Pausa min jobbevakning' })
    expect(toggleActive).not.toHaveBeenCalled()
    fireEvent.click(knapp)
    await waitFor(() => expect(toggleActive).toHaveBeenCalledTimes(1))
    expect(toggleActive).toHaveBeenCalledWith('a1', false)
  })

  it('länkar till 90-dagarsguiden och skickar förifylld notis till konsulenten', async () => {
    useFickJobbetStore.getState().visa({ id: '1', titel: 'Lagerarbetare', foretag: 'Acme' })
    ritaKort()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/knowledge-base/article/forsta-90-dagarna')
    fireEvent.change(screen.getByLabelText(/När börjar du/), { target: { value: '2026-11-03' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Berätta för min konsulent' }))
    await waitFor(() => expect(insert).toHaveBeenCalled())
    const rad = insert.mock.calls[0][0]
    expect(rad.user_id).toBe('kons-1')
    expect(rad.type).toBe('deltagare_fick_jobb')
    expect(rad.data.placering).toEqual({ employer_name: 'Acme', job_title: 'Lagerarbetare', start_date: '2026-11-03' })
  })

  it('hoppar över notisen utan krasch när RLS nekar', async () => {
    insert.mockResolvedValueOnce({ error: { code: '42501' } })
    useFickJobbetStore.getState().visa({ id: '1', titel: 'X', foretag: 'Y' })
    ritaKort()
    fireEvent.click(await screen.findByRole('button', { name: 'Berätta för min konsulent' }))
    expect(await screen.findByText(/Berätta gärna själv/)).toBeTruthy()
  })
})
