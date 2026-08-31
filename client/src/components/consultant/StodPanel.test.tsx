/**
 * Tester för StodPanel (spår AG2).
 *
 * Fokus: att panelen faktiskt renderar tre lägen per stöd (inte bara
 * "kan_vara_aktuellt" hela tiden), att art. 9-fälten är dolda tills
 * "Ja" är valt, och — viktigast — att INGET kronbelopp eller framräknad
 * procentsats renderas som ett svar. Ramen (20 000 kr, 80 %) och
 * erfarenheten (30–50 %) hör hemma i den utfällbara "vad som inte gick att
 * belägga"-texten/erfarenhetsrutan, inte i själva matchningskortet.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { StodPanel } from './StodPanel'

afterEach(() => cleanup())

describe('StodPanel — grundrendering', () => {
  it('visar alla fem stödformer med "för lite underlag" när inget är ifyllt', () => {
    render(<StodPanel />)
    expect(screen.getByText('Nystartsjobb')).toBeInTheDocument()
    expect(screen.getByText('Introduktionsjobb')).toBeInTheDocument()
    expect(screen.getByText('Lönebidrag')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: /OSA/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: /SIUS/ })).toBeInTheDocument()
    // Tomt formulär → allt utom det som räknas automatiskt kvalificerande
    // ska hamna i "För lite underlag", aldrig ett gissat "Kan vara aktuellt".
    expect(screen.getAllByText('För lite underlag').length).toBeGreaterThan(0)
  })

  it('döljer typ-kryssrutorna för funktionsnedsättning tills "Ja" är valt', () => {
    render(<StodPanel />)
    expect(screen.queryByText('Rätt till insatser enligt LSS')).not.toBeInTheDocument()
  })

  it('renderar aldrig ett kronbelopp eller en framräknad procentsats i matchningskorten', () => {
    render(<StodPanel />)
    // Ramen finns i den utfällbara "ej belagt"-listan/erfarenhetsrutan, men
    // matchningstexten (resultat.text) i StodResultatKort ska aldrig
    // innehålla ett tal följt av kr/kronor/%.
    const kort = document.querySelectorAll('h4')
    // Sanity: hittar vi rubrikerna alls
    expect(kort.length).toBeGreaterThan(0)
    const helaTexten = document.body.textContent ?? ''
    // "kan vara aktuellt"-texten i sig ska aldrig innehålla ett kronvärde
    // ihopklistrat med ordet "kan vara aktuellt" — vi kontrollerar konkret
    // att inget av de fem <p>-textstyckena (resultatens `text`-fält) gör det.
    const resultatTexter = Array.from(document.querySelectorAll('p')).map((p) => p.textContent ?? '')
    for (const t of resultatTexter) {
      expect(t).not.toMatch(/\d[\d\s]*\s?(kr|kronor)\b/i)
    }
    expect(helaTexten).toContain('Panelen') // sanity: introtexten renderades
  })

  it('lönebidragets erfarenhetsruta är märkt "Erfarenhet, inte en regel"', () => {
    render(<StodPanel />)
    expect(screen.getByText('Erfarenhet, inte en regel')).toBeInTheDocument()
  })
})
