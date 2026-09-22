/**
 * PasswordInput — knappen som visar lösenordet hade hårdkodad svenska i
 * aria-label ("Visa lösenord"/"Dölj lösenord"), så en engelsk skärmläsare
 * läste upp svenska. Nu via auth.showPassword/auth.hidePassword.
 *
 * Obs: komponenten har i dag inga användare utanför barrel-filen
 * (components/ui/index.ts) — rättelsen är billig och hindrar att felet följer
 * med den dag den tas i bruk.
 *
 * Mutation: sätt tillbaka strängarna → testet faller.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { PasswordInput } from './Input'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('sv')
})

describe('PasswordInput', () => {
  it('knappens namn följer språket', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    render(<PasswordInput label="Password" />)
    const knapp = screen.getByRole('button', { name: 'Show password' })
    fireEvent.click(knapp)
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })
})
