/**
 * Brevmallarnas namn och beskrivningar ska följa språket.
 *
 * Prod-svepet 2026-09-24: i engelskt läge stod "Professionell",
 * "Minimalistisk" och "Klassisk och tidlös design…" kvar på svenska — texten
 * låg bara i `templates/index.ts` och renderades rakt ut. Nu slås den upp i
 * `coverLetter.templates.<id>.*` med svenskan som reserv.
 *
 * De engelska nycklarna läggs in här som fixtur eftersom en.json fylls på av
 * huvudagenten; när de finns där är fixturen en no-op.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import { CoverLetterTemplateSelector } from './CoverLetterTemplateSelector'

const NYA_EN = {
  coverLetter: {
    templates: {
      professional: { name: 'Professional', description: 'Classic design that works for most jobs' },
      modern: { name: 'Modern', description: 'Clean and airy, with a touch of color' },
      minimal: { name: 'Minimal', description: 'Simple and focused, nothing extra' },
      executive: { name: 'Executive', description: 'Formal, with a serif font, for senior roles' },
    },
    colorPreview: { header: 'Heading', accent: 'Accent' },
  },
}

async function engelska() {
  i18n.addResourceBundle('en', 'translation', en, true, true)
  i18n.addResourceBundle('en', 'translation', NYA_EN, true, true)
  await i18n.changeLanguage('en')
}

describe('CoverLetterTemplateSelector — språk', () => {
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('visar svenska namn och beskrivningar på svenska', () => {
    render(<CoverLetterTemplateSelector selectedTemplate="professional" onSelect={() => {}} />)
    expect(screen.getByText('Professionell')).toBeInTheDocument()
    expect(screen.getByText('Minimalistisk')).toBeInTheDocument()
    expect(screen.getByText('Klassisk och tidlös design för de flesta branscher')).toBeInTheDocument()
  })

  it('visar engelska namn och beskrivningar på engelska — ingen svenska kvar', async () => {
    await engelska()
    const { container } = render(
      <CoverLetterTemplateSelector selectedTemplate="professional" onSelect={() => {}} />
    )
    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Minimal')).toBeInTheDocument()
    expect(screen.getByText('Classic design that works for most jobs')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Professionell|Minimalistisk|Klassisk och tidlös|utan överflöd|ledningspositioner/)
    // Färgprickarnas title-attribut var också hårdkodad svenska.
    expect(container.querySelector('[title="Rubrik"]')).toBeNull()
    expect(container.querySelector('[title="Heading"]')).not.toBeNull()
  })
})
