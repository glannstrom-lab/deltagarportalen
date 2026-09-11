/**
 * AktivitetskatalogSektion — tomt läge, personlig katalog, lista, och att
 * dialogen sparar med rätt fält (KM8).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { AktivitetskatalogSektion } from './AktivitetskatalogSektion'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })) } },
}))
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))
vi.mock('@/lib/toast', () => ({ notifications: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/services/aktivitetskatalogApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/aktivitetskatalogApi')>('@/services/aktivitetskatalogApi')
  return {
    ...faktisk,
    aktivitetskatalogApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), setActive: vi.fn() },
  }
})
vi.mock('@/services/orgApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return { ...faktisk, orgApi: { myMemberships: vi.fn() } }
})

const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: null, created_at: '', updated_at: '' }
const post = {
  id: 'k1', org_id: 'o1', owner_id: 'u9', title: 'Språkcafé', activity_type: 'language',
  description: 'Prata svenska över kaffe', location: 'Hjernet', weekday: 2, start_time: '13:00', end_time: '15:00',
  capacity: 12, contact: null, is_active: true, created_at: '', updated_at: '',
}

describe('AktivitetskatalogSektion', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('säger att katalogen är personlig utan medlemskap, och visar tomt läge med EN väg vidare', async () => {
    const { aktivitetskatalogApi } = await import('@/services/aktivitetskatalogApi')
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([])
    vi.mocked(orgApi.myMemberships).mockResolvedValue([])
    render(<AktivitetskatalogSektion />)
    expect(await screen.findByText(/katalogen är din egen/)).toBeInTheDocument()
    expect(screen.getByText('Inga aktiviteter i katalogen än')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lägg in första aktiviteten' })).toBeInTheDocument()
  })

  it('listar organisationens post med dag, tid, plats och kapacitet — och chefen får redigera', async () => {
    const { aktivitetskatalogApi } = await import('@/services/aktivitetskatalogApi')
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([post] as never)
    vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'o1', user_id: 'u1', role: 'chef', created_at: '', organization: org }] as never)
    render(<AktivitetskatalogSektion />)
    const lista = await screen.findByRole('list', { name: 'Aktivitetskatalog' })
    const kort = within(lista).getAllByRole('listitem')
    expect(kort).toHaveLength(1)
    expect(within(kort[0]).getByText('Språkcafé')).toBeInTheDocument()
    expect(within(kort[0]).getByText('Tis 13:00–15:00')).toBeInTheDocument()
    expect(within(kort[0]).getByText('Hjernet')).toBeInTheDocument()
    expect(within(kort[0]).getByText('12 platser')).toBeInTheDocument()
    expect(within(kort[0]).getByText('Hällefors kommun')).toBeInTheDocument()
    expect(within(kort[0]).getByRole('button', { name: 'Redigera' })).toBeInTheDocument()
    expect(screen.queryByText(/katalogen är din egen/)).toBeNull()
  })

  it('en vanlig konsulent ser organisationens post men får inte redigera den', async () => {
    const { aktivitetskatalogApi } = await import('@/services/aktivitetskatalogApi')
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([post] as never)
    vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'o1', user_id: 'u1', role: 'konsulent', created_at: '', organization: org }] as never)
    render(<AktivitetskatalogSektion />)
    const lista = await screen.findByRole('list', { name: 'Aktivitetskatalog' })
    expect(within(lista).queryByRole('button', { name: 'Redigera' })).toBeNull()
  })

  it('dialogen fäller slut före start, och sparar sedan med org_id, dag och kapacitet', async () => {
    const { aktivitetskatalogApi } = await import('@/services/aktivitetskatalogApi')
    const { orgApi } = await import('@/services/orgApi')
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([])
    vi.mocked(orgApi.myMemberships).mockResolvedValue([{ id: 'm1', org_id: 'o1', user_id: 'u1', role: 'chef', created_at: '', organization: org }] as never)
    vi.mocked(aktivitetskatalogApi.create).mockResolvedValue({ ...post, id: 'ny' } as never)
    render(<AktivitetskatalogSektion />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ny aktivitet' }))
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText('Namn'), { target: { value: 'Språkcafé' } })
    fireEvent.change(screen.getByLabelText('Veckodag'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '15:00' } })
    fireEvent.change(screen.getByLabelText('Slut'), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('Antal platser'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara aktivitet' }))
    expect(await screen.findByText('Sluttiden måste vara efter starttiden')).toBeInTheDocument()
    expect(aktivitetskatalogApi.create).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('Slut'), { target: { value: '15:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara aktivitet' }))
    await vi.waitFor(() => expect(aktivitetskatalogApi.create).toHaveBeenCalled())
    expect(aktivitetskatalogApi.create).toHaveBeenCalledWith(expect.objectContaining({
      org_id: 'o1', title: 'Språkcafé', weekday: 2, start_time: '13:00', end_time: '15:00', capacity: 12, is_active: true,
    }))
  })
})
