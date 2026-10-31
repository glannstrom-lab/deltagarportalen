import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@/test/utils'
import { CompanyCard } from './CompanyCard'
import type { SpontaneousCompany } from '@/services/supabaseApi'

vi.mock('@/services/applicationsApi', () => ({ applicationsApi: { getAll: vi.fn(), create: vi.fn() } }))
afterEach(cleanup)

const foretag = (o: Partial<SpontaneousCompany> = {}): SpontaneousCompany => ({
  id: 'c1', user_id: 'u1', org_number: '5560000000', company_name: 'Testbolaget AB',
  company_data: { address: { street: 'Storgatan 1', postalCode: '11122', city: 'Stockholm' } },
  status: 'to_contact', priority: 'medium', notes: 'Gammal anteckning',
  created_at: '2026-09-01T10:00:00Z', updated_at: '2026-09-01T10:00:00Z',
  ...o,
} as unknown as SpontaneousCompany)

const props = () => ({ onUpdateStatus: vi.fn(), onDelete: vi.fn(), onUpdate: vi.fn() })

describe('Hitta kontaktväg', () => {
  it('visar inget innan knappen trycks och sparar inget av sig självt', () => {
    const p = props()
    render(<CompanyCard company={foretag()} {...p} />)
    expect(screen.queryByText(/källa: Bolagsverket/)).toBeNull()
    expect(p.onUpdate).not.toHaveBeenCalled()
  })

  it('visar postadressen med källa, och lägger den i anteckningarna först vid val', () => {
    const p = props()
    render(<CompanyCard company={foretag()} {...p} />)
    fireEvent.click(screen.getByRole('button', { name: /Hitta kontaktväg/ }))
    expect(screen.getByText(/källa: Bolagsverket/)).toBeTruthy()
    expect(p.onUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Lägg i anteckningar/ }))
    expect(p.onUpdate).toHaveBeenCalledWith({
      notes: 'Gammal anteckning\nPostadress (källa: Bolagsverket): Storgatan 1, 11122 Stockholm',
    })
  })

  it('utan adress i registret finns ingen postadressrad', () => {
    render(<CompanyCard company={foretag({ company_data: null as never })} {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Hitta kontaktväg/ }))
    expect(screen.queryByRole('button', { name: /Lägg i anteckningar/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Sök efter företagets egen webbplats/ })).toBeTruthy()
  })

  it('mejlutkastet nämner företaget och har ingen mottagare om ingen sparats', () => {
    render(<CompanyCard company={foretag()} {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Hitta kontaktväg/ }))
    expect(screen.getByText(/hos Testbolaget AB/)).toBeTruthy()
    const a = screen.getByRole('link', { name: /Öppna i din e-post/ })
    expect(a.getAttribute('href')).toMatch(/^mailto:\?subject=/)
  })
})
