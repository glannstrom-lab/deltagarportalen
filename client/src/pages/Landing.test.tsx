/**
 * Startsidan — KO4 (2026-09-12): sidan börjar hos den arbetssökande.
 *
 * Fram till 2026-09-12 var andra sektionen "Vem är du?" med tre likvärdiga
 * kort (Arbetssökande, Arbetskonsulent, VD/Inköp), och slut-CTA:n frågade
 * "Redo att stärka dina arbetsmarknadsinsatser?" ovanför knappen "Skapa konto
 * gratis". En guideläsare som klickade loggan landade i ett säljbudskap till
 * inköpare. Testerna här vaktar ORDNINGEN i DOM:en — det som annars glider
 * tillbaka utan att något faller — och att K12-länkarna (prerenderade sidor
 * utanför HashRoutern) är kvar som vanliga <a href>.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import Landing from './Landing'

// OptimizedImage förlitar sig på bildoptimering som inte finns i jsdom
vi.mock('@/components/ui/OptimizedImage', () => ({
  OptimizedImage: (props: { alt: string; className?: string }) => (
    <img alt={props.alt} className={props.className} />
  ),
}))

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Landing />
    </MemoryRouter>
  )
}

/** true om `a` kommer före `b` i dokumentordningen */
function fore(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
}

function rubrik(text: string): HTMLElement {
  return screen.getByRole('heading', { name: text })
}

describe('Landing — sidan börjar hos den arbetssökande (KO4)', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('sv')
  })

  it('hjälten talar till den arbetssökande, och "Vem är du?" med tre kort finns inte längre', () => {
    renderLanding()
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toContain('Sök jobb')
    expect(screen.queryByText('Vem är du?')).toBeNull()
    expect(screen.queryByText('VD / Inköp')).toBeNull()
    expect(screen.queryByText('Jag söker jobb')).toBeNull()
    expect(screen.queryByText('Jag leder ett jobbcoach-företag')).toBeNull()
  })

  it('organisationssektionen ligger efter guiderna och de vanliga frågorna', () => {
    renderLanding()
    const guider = rubrik('Läs innan du bestämmer dig')
    const faq = rubrik(i18n.t('landing.faq.title'))
    const org = rubrik('Arbetar du med arbetssökande?')
    expect(fore(guider, faq)).toBe(true)
    expect(fore(faq, org)).toBe(true)
    // Konsulent- och organisationskorten bor i den sektionen, inte ovanför
    const sektion = document.getElementById('for-organisationer')!
    expect(sektion).not.toBeNull()
    expect(within(sektion).getByText('Jag är arbetskonsulent')).toBeTruthy()
    expect(within(sektion).getByText('Vi driver insatser för arbetssökande')).toBeTruthy()
  })

  it('priserna är kvar men sist — efter organisationssektionen, gratis först, utan "Populärast"', () => {
    renderLanding()
    const org = document.getElementById('for-organisationer')!
    const priser = document.getElementById('priser')!
    expect(priser).not.toBeNull()
    expect(fore(org, priser)).toBe(true)
    expect(within(priser).getByText('2 990')).toBeTruthy()
    expect(within(priser).getByText('290')).toBeTruthy()
    const gratis = within(priser).getByText('Gratis')
    const orgLicens = within(priser).getByText('Organisationslicens')
    expect(fore(gratis, orgLicens)).toBe(true)
    expect(screen.queryByText('Populärast')).toBeNull()
  })

  it('menyns första val är guiderna, och "Priser" står inte i menyn', () => {
    renderLanding()
    // SkipLinks har ett eget <nav>; sidmenyn är den som bär loggan
    const nav = screen.getAllByRole('navigation').find((n) => within(n).queryAllByText('jobin.se').length > 0)!
    expect(nav).toBeTruthy()
    const val = within(nav).getAllByRole('link').filter((a) => a.getAttribute('href') !== '/')
    expect(val[0].getAttribute('href')).toBe('/guider/')
    expect(within(nav).queryByText('Priser')).toBeNull()
    expect(within(nav).queryByText('För vem')).toBeNull()
    expect(within(nav).getAllByText('För organisationer').length).toBeGreaterThan(0)
  })

  it('K12-länkarna finns kvar som vanliga <a href>, aldrig som #/-rutter', () => {
    renderLanding()
    for (const href of ['/guider/', '/verktyg/cv/', '/for-arbetsmarknadsenheter/', '/for-rusta-och-matcha/']) {
      expect(document.querySelector(`a[href="${href}"]`), href).not.toBeNull()
    }
    expect(document.querySelector('a[href^="#/guider"]')).toBeNull()
    expect(document.querySelector('a[href^="#/for-"]')).toBeNull()
    expect(document.querySelector('a[href^="#/verktyg"]')).toBeNull()
  })

  it('slut-CTA:n talar till den arbetssökande, inte till inköparen', () => {
    renderLanding()
    expect(rubrik('Redo att ta nästa steg?')).toBeTruthy()
    expect(screen.queryByText('Redo att stärka dina arbetsmarknadsinsatser?')).toBeNull()
    const priser = document.getElementById('priser')!
    expect(fore(priser, rubrik('Redo att ta nästa steg?'))).toBe(true)
  })
})

describe('Landing — engelska', () => {
  beforeAll(async () => {
    // Engelskan lazy-laddas i config.ts; i testet läggs bundeln in direkt
    if (!i18n.hasResourceBundle('en', 'translation')) i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('en')
  })
  afterAll(async () => {
    await i18n.changeLanguage('sv')
  })

  it('samma ordning på engelska', () => {
    renderLanding()
    const guides = rubrik('Read before you decide')
    const org = rubrik('Do you work with job seekers?')
    const cta = rubrik('Ready to take the next step?')
    expect(fore(guides, org)).toBe(true)
    expect(fore(org, cta)).toBe(true)
    expect(screen.queryByText('Who are you?')).toBeNull()
    expect(screen.queryByText('Most popular')).toBeNull()
  })
})
