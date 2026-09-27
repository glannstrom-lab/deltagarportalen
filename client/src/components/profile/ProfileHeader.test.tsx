/**
 * PG14 (2026-09-12): profilhuvudet får inte visa en procentsats i hjälteposition.
 * "Profilstatus 17 %" på en person som just börjat är en prestationsmätning
 * (DESIGN.md §1–2). Kvar är nästa steg som en invit.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: () => ({
    profile: { first_name: 'Dana', last_name: 'Deltagare', email: 'dana@example.com', profile_image_url: null },
    completion: { filled: 2, total: 12, percent: 17, nextStep: { key: 'phone', label: 'Telefon', tab: 'overview' } },
    cloudSyncing: false,
    cloudSynced: true,
    updateProfileImage: vi.fn(),
    loadProfile: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}))
vi.mock('./ProfileImageUpload', () => ({ ProfileImageUpload: () => <div data-testid="avatar" /> }))
vi.mock('@/services/profileEnhancementsApi', () => ({ cvIntegrationApi: { importToProfile: vi.fn() }, profileExportApi: { toPDF: vi.fn() } }))

import { ProfileHeader } from './ProfileHeader'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { sattLattSvenska } from '@/i18n/lattSvenska'

describe('ProfileHeader (PG14)', () => {
  afterEach(() => cleanup())

  it('visar ingen procentsats och ingen mätare i huvudet', () => {
    render(<ProfileHeader />)
    expect(screen.queryByText(/17\s*%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Profilstatus/)).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('visar nästa steg som en invit med namnet på det som saknas', () => {
    render(<ProfileHeader />)
    expect(screen.getByRole('button', { name: /Nästa: Telefon/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Dana Deltagare/)
  })
})

// RD5/RD6 (rollspelet 2026-09-27): "Next: Telefon · Importera CV · Ladda ner PDF"
// på engelska — etiketten kom ur profileStore på svenska och knapparna var hårdkodade.
describe('ProfileHeader följer språket (RD5/RD6)', () => {
  afterEach(async () => {
    cleanup()
    await sattLattSvenska(false)
    await i18n.changeLanguage('sv')
  })

  it('engelska: nästa steg och knapparna', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    render(<ProfileHeader />)
    expect(screen.getByRole('button', { name: /Next: Phone/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import CV' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    expect(screen.queryByText(/Telefon|Importera|Ladda ner/)).toBeNull()
  })

  it('Lätt svenska: knapparna säger vad de gör', async () => {
    await sattLattSvenska(true)
    render(<ProfileHeader />)
    expect(screen.getByRole('button', { name: 'Hämta från ditt CV' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ladda ner som PDF' })).toBeInTheDocument()
  })
})
