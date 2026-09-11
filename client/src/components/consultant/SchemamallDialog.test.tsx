/**
 * SchemamallDialog — validering och veckotimmar (KM3).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { SchemamallDialog } from './SchemamallDialog'

vi.mock('@/services/aktivitetApi', () => ({
  schemamallApi: { create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/services/aktivitetskatalogApi', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/aktivitetskatalogApi')>('@/services/aktivitetskatalogApi')
  return { ...faktisk, aktivitetskatalogApi: { list: vi.fn(async () => []) } }
})

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('SchemamallDialog', () => {
  it('är en modal med tillgänglig rubrik och visar 3 h ur standardraden', async () => {
    render(<SchemamallDialog isOpen onClose={() => {}} onSaved={() => {}} />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('3 h av högst 40 h per vecka')
  })

  it('fäller tom rubrik och slut före start, och sparar inte', async () => {
    const { schemamallApi } = await import('@/services/aktivitetApi')
    render(<SchemamallDialog isOpen onClose={() => {}} onSaved={() => {}} />)
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText('Namn'), { target: { value: 'Verkstad' } })
    fireEvent.change(screen.getByLabelText('Slut'), { target: { value: '08:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara mall' }))
    expect(await screen.findByText('Sluttiden måste vara efter starttiden')).toBeInTheDocument()
    expect(schemamallApi.create).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Slut'), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara mall' }))
    expect(await screen.findByText('Passet behöver en rubrik')).toBeInTheDocument()
    expect(schemamallApi.create).not.toHaveBeenCalled()
  })

  it('räknar veckotimmarna live och skickar raderna till API:t', async () => {
    const { schemamallApi } = await import('@/services/aktivitetApi')
    vi.mocked(schemamallApi.create).mockResolvedValue({ id: 't1', items: [] } as never)
    const onSaved = vi.fn()
    render(<SchemamallDialog isOpen onClose={() => {}} onSaved={onSaved} />)
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText('Namn'), { target: { value: 'Verkstad' } })
    fireEvent.change(screen.getByLabelText('Rubrik'), { target: { value: 'Jobbsökarverkstad' } })
    fireEvent.change(screen.getByLabelText('Slut'), { target: { value: '15:00' } })
    expect(screen.getByRole('status')).toHaveTextContent('6 h av högst 40 h per vecka')
    fireEvent.click(screen.getByRole('button', { name: 'Spara mall' }))
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(schemamallApi.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Verkstad',
      items: [expect.objectContaining({ weekday: 1, start_time: '09:00', end_time: '15:00', title: 'Jobbsökarverkstad', activity_type: 'jobsearch' })],
    }))
  })

  it('KM8: "Hämta ur katalogen" fyller raden med rubrik, typ, plats, dag och tid', async () => {
    const { aktivitetskatalogApi } = await import('@/services/aktivitetskatalogApi')
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([
      { id: 'k1', org_id: 'o1', owner_id: 'u9', title: 'Språkcafé', activity_type: 'language', description: null, location: 'Hjernet', weekday: 2, start_time: '13:00', end_time: '15:00', capacity: null, contact: null, is_active: true, created_at: '', updated_at: '' },
      { id: 'k2', org_id: 'o1', owner_id: 'u9', title: 'Nedlagd grupp', activity_type: 'motivation', description: null, location: null, weekday: null, start_time: null, end_time: null, capacity: null, contact: null, is_active: false, created_at: '', updated_at: '' },
    ] as never)
    render(<SchemamallDialog isOpen onClose={() => {}} onSaved={() => {}} />)
    const val = await screen.findByLabelText('Hämta ur katalogen')
    // Inaktiva poster erbjuds inte
    expect(within(val).queryByRole('option', { name: /Nedlagd grupp/ })).toBeNull()
    fireEvent.change(val, { target: { value: 'k1' } })
    expect(screen.getByLabelText('Rubrik')).toHaveValue('Språkcafé')
    expect(screen.getByLabelText('Aktivitetstyp')).toHaveValue('language')
    expect(screen.getByLabelText('Plats')).toHaveValue('Hjernet')
    expect(screen.getByLabelText('Veckodag')).toHaveValue('2')
    expect(screen.getByLabelText('Start')).toHaveValue('13:00')
    expect(screen.getByLabelText('Slut')).toHaveValue('15:00')
    expect(screen.getByRole('status')).toHaveTextContent('2 h av högst 40 h per vecka')
  })

  it('KM8: utan katalogposter visas ingen hämtaknapp', async () => {
    const { aktivitetskatalogApi } = await import('@/services/aktivitetskatalogApi')
    vi.mocked(aktivitetskatalogApi.list).mockResolvedValue([])
    render(<SchemamallDialog isOpen onClose={() => {}} onSaved={() => {}} />)
    await screen.findByRole('dialog')
    await vi.waitFor(() => expect(screen.queryByLabelText('Hämta ur katalogen')).toBeNull())
  })
})
