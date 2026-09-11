/**
 * OrganisationerTab — skapa organisation och lägga till medlem (KM2, superadmin).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { OrganisationerTab } from './OrganisationerTab'

vi.mock('@/services/orgApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return {
    ...faktisk,
    orgAdminApi: {
      listOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      updateOrganization: vi.fn(),
      deleteOrganization: vi.fn(),
      listMembers: vi.fn(),
      addMember: vi.fn(),
      setMemberRole: vi.fn(),
      removeMember: vi.fn(),
    },
  }
})
vi.mock('@/components/ui/ConfirmDialog', () => ({ useConfirmDialog: () => ({ confirm: vi.fn(async () => true) }) }))

const users = [
  { id: 'u1', email: 'fanny.forsell@hellefors.se', first_name: 'Fanny', last_name: 'Forsell', role: 'CONSULTANT' },
  { id: 'u2', email: 'kim.karlsson@hellefors.se', first_name: 'Kim', last_name: 'Karlsson', role: 'CONSULTANT' },
  { id: 'u3', email: 'anna@example.se', first_name: 'Anna', last_name: null, role: 'USER' },
]
const org = { id: 'o1', name: 'Hällefors kommun', kind: 'kommun', org_number: null, created_at: '', updated_at: '' }

describe('OrganisationerTab', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('skapar en organisation via API:t', async () => {
    const { orgAdminApi } = await import('@/services/orgApi')
    vi.mocked(orgAdminApi.listOrganizations).mockResolvedValue([])
    vi.mocked(orgAdminApi.createOrganization).mockResolvedValue({ ...org, org_number: '212000-1942' } as never)
    vi.mocked(orgAdminApi.listMembers).mockResolvedValue([])

    render(<OrganisationerTab users={users} />)
    expect(await screen.findByText('Inga organisationer än')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ny organisation' }))
    fireEvent.change(screen.getByLabelText('Namn'), { target: { value: 'Hällefors kommun' } })
    fireEvent.change(screen.getByLabelText('Org.nr (valfritt)'), { target: { value: '212000-1942' } })
    fireEvent.click(screen.getByRole('button', { name: 'Skapa organisation' }))

    await vi.waitFor(() =>
      expect(orgAdminApi.createOrganization).toHaveBeenCalledWith({ name: 'Hällefors kommun', kind: 'kommun', org_number: '212000-1942' }),
    )
    // Den nya organisationen står i tabellen och är vald
    expect(await screen.findByRole('button', { name: 'Hällefors kommun', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Medlemmar i Hällefors kommun')).toBeInTheDocument()
  })

  it('lägger till en medlem med rätt organisation, användare och roll', async () => {
    const { orgAdminApi } = await import('@/services/orgApi')
    vi.mocked(orgAdminApi.listOrganizations).mockResolvedValue([org] as never)
    vi.mocked(orgAdminApi.listMembers).mockResolvedValue([
      { id: 'm1', org_id: 'o1', user_id: 'u1', role: 'chef', created_at: '' },
    ] as never)
    vi.mocked(orgAdminApi.addMember).mockImplementation(async (orgId, userId, role) => ({ id: 'm2', org_id: orgId, user_id: userId, role, created_at: '' }) as never)

    render(<OrganisationerTab users={users} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Hällefors kommun' }))
    expect(await screen.findByText('Medlemmar i Hällefors kommun')).toBeInTheDocument()
    expect(screen.getByText('Fanny Forsell')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Sök användare (e-post eller namn)'), { target: { value: 'kim' } })
    const traffar = screen.getByRole('list', { name: 'Sökträffar' })
    // Fanny är redan medlem och ska inte dyka upp bland träffarna
    expect(within(traffar).queryByText(/Fanny/)).toBeNull()
    fireEvent.click(within(traffar).getByRole('button', { name: /Kim Karlsson/ }))
    fireEvent.change(screen.getByLabelText('Roll'), { target: { value: 'handlaggare' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lägg till medlem' }))

    await vi.waitFor(() => expect(orgAdminApi.addMember).toHaveBeenCalledWith('o1', 'u2', 'handlaggare'))
    const lista = screen.getByRole('list', { name: 'Medlemmar i Hällefors kommun' })
    await vi.waitFor(() => expect(within(lista).getAllByRole('listitem')).toHaveLength(2))
    expect(within(lista).getByText('Kim Karlsson')).toBeInTheDocument()
    // medlemsräknaren i organisationstabellen följer med
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('visar felet i klartext när API:t säger nej', async () => {
    const { orgAdminApi } = await import('@/services/orgApi')
    vi.mocked(orgAdminApi.listOrganizations).mockRejectedValue(new Error('permission denied'))
    render(<OrganisationerTab users={users} />)
    expect(await screen.findByText('Organisationerna kunde inte hämtas')).toBeInTheDocument()
    expect(screen.getByText('permission denied')).toBeInTheDocument()
  })
})
