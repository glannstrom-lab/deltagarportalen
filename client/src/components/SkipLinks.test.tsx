/**
 * UX32 (2026-08-05) — skip-länkarna ska landa någonstans.
 *
 * Bakgrund: två av tre länkar pekade på id:n som inte fanns i DOM:en
 * (`main-navigation`, `search`), och landningens `<section id="main-content">`
 * saknade tabindex så `element.focus()` var en no-op. Testerna nedan låser fast
 * båda felen — inte bara att markupen renderas.
 *
 * jsdom-not: `checkVisibility` finns inte här och `getBoundingClientRect` ger
 * alltid 0×0, så resolvern faller tillbaka på "första kandidaten som finns".
 * Preferensen för det synliga elementet testas med en stubbad `checkVisibility`.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SkipLinks, resolveSkipTarget, focusSkipTarget } from './SkipLinks'

describe('SkipLinks', () => {
  it('renderar bara länkar vars mål portalen faktiskt har — sök-länken är borta', () => {
    render(<SkipLinks />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual([
      'Hoppa till huvudinnehåll',
      'Hoppa till navigation',
    ])
    expect(screen.queryByText('Hoppa till sök')).toBeNull()
  })

  it('flyttar fokus till huvudinnehållet', () => {
    render(
      <>
        <SkipLinks />
        <main id="main-content" tabIndex={-1}>innehåll</main>
      </>
    )
    fireEvent.click(screen.getByText('Hoppa till huvudinnehåll'))
    expect(document.activeElement).toBe(document.getElementById('main-content'))
  })

  it('flyttar fokus till navigationen — id:t finns numera i DOM:en', () => {
    render(
      <>
        <SkipLinks />
        <nav id="main-navigation" tabIndex={-1}>meny</nav>
      </>
    )
    fireEvent.click(screen.getByText('Hoppa till navigation'))
    expect(document.activeElement).toBe(document.getElementById('main-navigation'))
  })

  it('gör ingenting (och kraschar inte) när målet saknas', () => {
    render(<SkipLinks />)
    const before = document.activeElement
    expect(() => fireEvent.click(screen.getByText('Hoppa till navigation'))).not.toThrow()
    expect(document.activeElement).toBe(before)
  })
})

describe('resolveSkipTarget', () => {
  it('hittar elementet via id', () => {
    render(<nav id="main-navigation">meny</nav>)
    expect(resolveSkipTarget('main-navigation')).toBe(document.getElementById('main-navigation'))
  })

  it('hittar elementet via data-skip-target när id saknas', () => {
    render(<nav data-skip-target="main-navigation" data-testid="bottom">meny</nav>)
    expect(resolveSkipTarget('main-navigation')).toBe(screen.getByTestId('bottom'))
  })

  it('väljer det synliga elementet när båda kandidaterna finns', () => {
    render(
      <>
        <nav id="main-navigation" data-testid="sidebar">sidomeny</nav>
        <nav data-skip-target="main-navigation" data-testid="bottom">bottennav</nav>
      </>
    )
    // jsdom saknar checkVisibility — stubba den så preferensen går att mäta.
    const sidebar = screen.getByTestId('sidebar') as HTMLElement & { checkVisibility: () => boolean }
    const bottom = screen.getByTestId('bottom') as HTMLElement & { checkVisibility: () => boolean }
    sidebar.checkVisibility = () => false
    bottom.checkVisibility = () => true

    expect(resolveSkipTarget('main-navigation')).toBe(bottom)
  })

  it('returnerar null när ingen kandidat finns', () => {
    render(<div />)
    expect(resolveSkipTarget('search')).toBeNull()
  })
})

describe('focusSkipTarget', () => {
  it('fokuserar även ett element utan tabindex (landningens <section>)', () => {
    render(<section id="main-content">hero</section>)
    const section = document.getElementById('main-content') as HTMLElement
    expect(section.hasAttribute('tabindex')).toBe(false)

    focusSkipTarget(section)

    expect(section.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(section)
  })

  it('rör inte tabindex på element som redan är fokuserbara', () => {
    render(<a id="mal" href="#x">länk</a>)
    const link = document.getElementById('mal') as HTMLElement
    focusSkipTarget(link)
    expect(link.hasAttribute('tabindex')).toBe(false)
    expect(document.activeElement).toBe(link)
  })
})
