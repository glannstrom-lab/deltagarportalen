/**
 * OmFlik — org-uppgifter läses bara, profilen sparas via upsertProfil,
 * kollegor filtreras på org, inbjudan går genom dialogen till bjudInKollega,
 * och databasens svenska felmeddelanden visas rakt av.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { rendera } from './__tests__/rendera'
import { ORG } from './__tests__/fixturer'

const mock = vi.hoisted(() => ({ getProfil: vi.fn(), upsertProfil: vi.fn(), bjudInKollega: vi.fn() }))
const org = vi.hoisted(() => ({ colleagues: vi.fn(), removeColleague: vi.fn() }))

vi.mock('@/services/foretagApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/foretagApi')>('@/services/foretagApi')
  return { ...actual, foretagApi: { ...actual.foretagApi, ...mock } }
})
vi.mock('@/services/orgApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/orgApi')>('@/services/orgApi')
  return { ...actual, orgApi: { ...actual.orgApi, ...org } }
})

import { OmFlik } from './OmFlik'

const KOLLEGOR = [
  { id: 'm1', org_id: 'org1', org_name: 'Glänne & Söner', org_kind: 'arbetsgivare', user_id: 'u1', role: 'arbetsgivare', created_at: '', first_name: 'Mikael', last_name: 'G', email: 'm@g.se' },
  { id: 'm2', org_id: 'org1', org_name: 'Glänne & Söner', org_kind: 'arbetsgivare', user_id: 'u2', role: 'arbetsgivare', created_at: '', first_name: 'Sara', last_name: 'S', email: 's@g.se' },
  { id: 'm3', org_id: 'annan', org_name: 'Annan', org_kind: 'kommun', user_id: 'u3', role: 'chef', created_at: '', first_name: 'Ove', last_name: 'O', email: 'o@k.se' },
]

describe('OmFlik', () => {
  beforeEach(() => {
    ;[...Object.values(mock), ...Object.values(org)].forEach((m) => m.mockReset())
    mock.getProfil.mockResolvedValue(null)
    org.colleagues.mockResolvedValue(KOLLEGOR)
  })

  it('visar organisationens namn och org.nr, och bara kollegor i DETTA företag', async () => {
    rendera(<OmFlik org={ORG} />, '/foretag/om')
    expect(screen.getByText('559000-1234')).toBeInTheDocument()
    expect(await screen.findByText('Mikael G')).toBeInTheDocument()
    expect(screen.getByText('Sara S')).toBeInTheDocument()
    expect(screen.queryByText('Ove O')).not.toBeInTheDocument()
  })

  it('tom profil ger ett tomt formulär (inte "—"), sparning går till upsertProfil', async () => {
    mock.upsertProfil.mockResolvedValue({ org_id: 'org1', description: 'Vi bygger.', updated_at: '2026-09-13T00:00:00Z' })
    rendera(<OmFlik org={ORG} />, '/foretag/om')
    const beskrivning = await screen.findByLabelText('Om oss')
    expect(beskrivning).toHaveValue('')
    fireEvent.change(beskrivning, { target: { value: 'Vi bygger.' } })
    fireEvent.change(screen.getByLabelText('Tar ni emot praktikanter?'), { target: { value: 'ja' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }))
    await waitFor(() => expect(mock.upsertProfil).toHaveBeenCalledWith('org1', expect.objectContaining({ description: 'Vi bygger.', accepts_interns: true, city: null })))
    expect(await screen.findByRole('status')).toHaveTextContent('Sparat.')
  })

  it('befintlig profil fyller formuläret', async () => {
    mock.getProfil.mockResolvedValue({ org_id: 'org1', description: 'Snickeri i Borås', accepts_interns: false, typical_needs: null, website: null, city: 'Borås', industry: null, employee_count: '10–20', company_data: null, updated_by: null, created_at: '', updated_at: '2026-09-01T00:00:00Z' })
    rendera(<OmFlik org={ORG} />, '/foretag/om')
    expect(await screen.findByLabelText('Om oss')).toHaveValue('Snickeri i Borås')
    expect(screen.getByLabelText('Tar ni emot praktikanter?')).toHaveValue('nej')
    expect(screen.getByLabelText('Antal anställda (ungefär)')).toHaveValue('10–20')
  })

  it('inbjudan går genom dialogen till bjudInKollega; databasens fel (demokonto) visas rakt av', async () => {
    mock.bjudInKollega.mockRejectedValueOnce(new Error('Demokontot kan inte bjuda in. Personerna i demot är påhittade.'))
    rendera(<OmFlik org={ORG} />, '/foretag/om')
    fireEvent.click(await screen.findByRole('button', { name: 'Bjud in kollega' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('E-post *'), { target: { value: 'ny@g.se' } })
    fireEvent.change(within(dialog).getByLabelText('Namn'), { target: { value: 'Ny Kollega' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skicka inbjudan' }))
    await waitFor(() => expect(mock.bjudInKollega).toHaveBeenCalledWith('org1', 'ny@g.se', 'Ny Kollega'))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Demokontot kan inte bjuda in')

    mock.bjudInKollega.mockResolvedValueOnce({ id: 'i1', org_id: 'org1', email: 'ny@g.se', contact_name: 'Ny Kollega', existing_account: false })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Skicka inbjudan' }))
    expect(await within(dialog).findByRole('status')).toHaveTextContent('Inbjudan är skickad till ny@g.se')
  })

  it('ta bort går genom bekräftelsen och visar triggerns svenska fel', async () => {
    org.removeColleague.mockRejectedValue(new Error('Du kan inte ändra eller ta bort ditt eget medlemskap'))
    rendera(<OmFlik org={ORG} />, '/foretag/om')
    const taBort = await screen.findAllByRole('button', { name: 'Ta bort' })
    fireEvent.click(taBort[0])
    const bekrafta = await screen.findByRole('dialog')
    fireEvent.click(within(bekrafta).getByRole('button', { name: 'Ta bort' }))
    await waitFor(() => expect(org.removeColleague).toHaveBeenCalledWith('m1'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Du kan inte ändra eller ta bort ditt eget medlemskap')
  })
})
