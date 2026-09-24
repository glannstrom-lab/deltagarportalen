/**
 * Ändringshistoriken ska följa språket.
 *
 * Prod-svepet 2026-09-24: i engelskt läge stod fältnamnen ("Förnamn"),
 * ändringstypen ("Uppdaterad") och tiden ("5 min sedan", "Just nu") kvar på
 * svenska. Tiden formateras nu med Intl.RelativeTimeFormat i aktivt språk.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'

const { history } = vi.hoisted(() => ({ history: vi.fn() }))
vi.mock('@/services/profileEnhancementsApi', () => ({
  profileHistoryApi: { getAll: history },
}))

import { ProfileHistory } from './ProfileHistory'

const NYA_EN = {
  profile: {
    history: {
      justNow: 'Just now',
      emptyValue: '(empty)',
      empty: 'No change history yet. Changes you make to your profile are saved here.',
      changeType: { create: 'Created', update: 'Updated', delete: 'Deleted' },
      fields: { first_name: 'First name', skills: 'Skills' },
    },
  },
}

const minuterSedan = (n: number) => new Date(Date.now() - n * 60_000).toISOString()

const POSTER = [
  { id: '1', field_name: 'first_name', change_type: 'update', old_value: 'Anna', new_value: 'Anne', created_at: minuterSedan(5) },
  { id: '2', field_name: 'skills', change_type: 'create', old_value: null, new_value: ['Truck'], created_at: minuterSedan(0) },
  { id: '3', field_name: 'okant_falt', change_type: 'update', old_value: null, new_value: 'x', created_at: minuterSedan(3 * 60) },
]

describe('ProfileHistory — språk', () => {
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('visar svenska på svenska', async () => {
    history.mockResolvedValue(POSTER)
    render(<ProfileHistory />)
    expect(await screen.findByText('Förnamn')).toBeInTheDocument()
    expect(screen.getAllByText('Uppdaterad').length).toBe(2)
    expect(screen.getByText('Skapad')).toBeInTheDocument()
    expect(screen.getByText('för 5 minuter sedan')).toBeInTheDocument()
    expect(screen.getByText('Just nu')).toBeInTheDocument()
  })

  it('visar engelska på engelska — fältnamn, ändringstyp och tid', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
    await i18n.changeLanguage('en')
    history.mockResolvedValue(POSTER)
    const { container } = render(<ProfileHistory />)

    expect(await screen.findByText('First name')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
    expect(screen.getAllByText('Updated').length).toBe(2)
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument()
    expect(screen.getByText('3 hours ago')).toBeInTheDocument()
    expect(screen.getByText('Just now')).toBeInTheDocument()
    // Ett okänt fält visas med sitt tekniska namn, inte som tom rad.
    expect(screen.getByText('okant_falt')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Förnamn|Kompetenser|Uppdaterad|Skapad|sedan|Just nu/)
  })

  it('tomt läge på engelska', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
    await i18n.changeLanguage('en')
    history.mockResolvedValue([])
    render(<ProfileHistory />)
    expect(await screen.findByText(/No change history yet/)).toBeInTheDocument()
    expect(screen.queryByText(/Ingen ändringshistorik/)).toBeNull()
  })
})
