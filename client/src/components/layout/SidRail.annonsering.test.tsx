/**
 * TI4 — sidoflikarnas skärmläsarannonsering.
 *
 * De fem sidoflikssidorna (LinkedIn, Dagbok, Externa resurser, Profil,
 * Resurser) byter avsnitt utan att rutten ändras, så `RouteAnnouncer.tsx`
 * (som bara lyssnar på `location.pathname`) fångar aldrig bytet. Testet
 * verifierar att SidRail (desktop) och SidoflikRad (mobil) själva annonserar
 * — och att förstarenderingen INTE annonserar (skulle vara brus ovanpå
 * sidladdningens egen uppläsning).
 */
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SidRail, { SidoflikRad, type Sidoflikar } from './SidRail'

const POSTER = [
  { id: 'a', etikett: 'Första avsnittet' },
  { id: 'b', etikett: 'Andra avsnittet' },
  { id: 'c', etikett: 'Tredje avsnittet' },
]

/** Testharness som håller `aktiv` i eget state — precis som de riktiga sidorna gör. */
function Harness({ variant }: { variant: 'skena' | 'mobil' }) {
  const [aktiv, setAktiv] = useState('a')
  const sidoflikar: Sidoflikar = { poster: POSTER, aktiv, vidVal: setAktiv }
  return variant === 'skena'
    ? <SidRail title="Testsida" sidoflikar={sidoflikar} />
    : <SidoflikRad sidoflikar={sidoflikar} />
}

function rita(variant: 'skena' | 'mobil') {
  return render(<MemoryRouter><Harness variant={variant} /></MemoryRouter>)
}

describe.each([
  ['SidRail (desktop-skenan)', 'skena'],
  ['SidoflikRad (mobilraden)', 'mobil'],
] as const)('%s — sidoflik-annonsering', (_namn, variant) => {
  it('annonserar INTE vid första renderingen', () => {
    rita(variant)
    const region = screen.getByRole('status')
    expect(region.textContent).toBe('')
  })

  it('annonserar den nya etiketten vid flikbyte', () => {
    rita(variant)
    fireEvent.click(screen.getByRole('button', { name: /Andra avsnittet/i }))
    const region = screen.getByRole('status')
    expect(region.textContent).toContain('Andra avsnittet')
  })

  it('byter innehåll igen vid ett andra flikbyte (inte kvar på det första)', () => {
    rita(variant)
    fireEvent.click(screen.getByRole('button', { name: /Andra avsnittet/i }))
    fireEvent.click(screen.getByRole('button', { name: /Tredje avsnittet/i }))
    const region = screen.getByRole('status')
    expect(region.textContent).toContain('Tredje avsnittet')
    expect(region.textContent).not.toContain('Andra avsnittet')
  })
})

describe('Live-regionen är visuellt dold men i tillgänglighetsträdet', () => {
  it('bär sr-only, aria-live=polite och aria-atomic=true', () => {
    rita('skena')
    const region = screen.getByRole('status')
    expect(region.className).toContain('sr-only')
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.getAttribute('aria-atomic')).toBe('true')
  })
})
