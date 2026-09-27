/**
 * RD6 (2026-09-27): räknaren "0 av 5" under Intressen stod på svenska i
 * engelskt gränssnitt.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { TagInput } from './TagInput'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('sv')
})

describe('TagInput-räknaren följer språket', () => {
  it('svenska', () => {
    render(<TagInput tags={['Bak']} onAdd={() => {}} onRemove={() => {}} maxTags={5} />)
    expect(screen.getByText('1 av 5')).toBeInTheDocument()
  })

  it('engelska', async () => {
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
    // RD16: en tom lista har ingen räknare, så engelskan prövas med en tagg
    render(<TagInput tags={['Baking']} onAdd={() => {}} onRemove={() => {}} maxTags={5} />)
    expect(screen.getByText('1 of 5')).toBeInTheDocument()
  })
})
