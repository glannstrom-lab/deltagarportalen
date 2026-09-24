/**
 * "Säg upp kopplingen" (kortet + bekräftelsedialogen) var hårdkodad svenska
 * och datumet formaterades alltid med 'sv-SE' — sett i drift i engelskt läge
 * 2026-09-24. Komponenten saknade useTranslation helt.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'

const { getActive, revoke } = vi.hoisted(() => ({ getActive: vi.fn(), revoke: vi.fn() }))

vi.mock('@/services/konsulentKopplingApi', () => ({
  consultantConsentsApi: { getActive },
  konsulentKopplingApi: { revokeConsultantLink: revoke },
}))

import { RevokeConsultantLinkSection } from './RevokeConsultantLinkSection'

const rendera = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <RevokeConsultantLinkSection consultantId="k1" consultantName="Karin" onRevoked={vi.fn()} />
    </I18nextProvider>
  )

describe('RevokeConsultantLinkSection — engelskt läge', () => {
  beforeAll(() => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
  })
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('sv')
  })

  it('visar kortet, datumet och dialogen på engelska', async () => {
    getActive.mockResolvedValue({ granted_at: '2026-03-12T10:00:00Z', program: null })
    await i18n.changeLanguage('en')
    rendera()

    expect(await screen.findByText(/12 March 2026/)).toBeInTheDocument()
    expect(screen.getByText(en.myConsultant.revoke.description.replace('{{namn}}', 'Karin'))).toBeInTheDocument()
    expect(screen.queryByText(/Säg upp|Samtycke gavs|mars/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: en.myConsultant.revoke.title }))
    expect(screen.getByText(en.myConsultant.revoke.consequencesTitle)).toBeInTheDocument()
    expect(screen.getByText(/Arbetsförmedlingen \(the Swedish Public Employment Service\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Det här händer|Bekräfta uppsägning|Avbryt/)).not.toBeInTheDocument()

    // Bekräftelseordet följer språket.
    const bekrafta = screen.getByRole('button', { name: en.myConsultant.revoke.confirmButton })
    expect(bekrafta).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: /to confirm/i }), { target: { value: 'end' } })
    expect(bekrafta).toBeEnabled()
  })

  it('godtar fortfarande "säg upp" på svenska', async () => {
    getActive.mockResolvedValue(null)
    rendera()
    fireEvent.click(await screen.findByRole('button', { name: 'Säg upp kopplingen' }))
    const bekrafta = screen.getByRole('button', { name: 'Bekräfta uppsägning' })
    fireEvent.change(screen.getByRole('textbox', { name: /för att bekräfta/i }), { target: { value: 'säg upp' } })
    expect(bekrafta).toBeEnabled()
  })
})
