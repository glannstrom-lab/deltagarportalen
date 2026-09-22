/**
 * Regression (2026-09-22): `groundingTechniques` (byggd från
 * `groundingTechniqueDefs`) hade inget `id`-fält, men `GroundingGuide`
 * grenar sina instruktionssteg på `technique.id === 0 | 1 | else`. Utan
 * `id` var värdet alltid `undefined`, så ALLA tre grundningsövningar
 * (5-4-3-2-1, kallt vatten, aktivt lyssnande) visade exakt samma steg —
 * den sista teknikens, oavsett vilken deltagaren faktiskt klickade på.
 *
 * Det här är en krisstödssida: att visa fel instruktioner till någon i
 * affekt är ett allvarligt fel, inte bara en kosmetisk bugg.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import CrisisTab from './CrisisTab'

function renderTab() {
  return render(
    <I18nextProvider i18n={i18n}>
      <CrisisTab />
    </I18nextProvider>
  )
}

function klickaGrundningskort(index: number) {
  const kort = screen.getAllByRole('button').filter(b =>
    b.className.includes('rounded-xl') && b.className.includes('items-start')
  )
  expect(kort.length).toBeGreaterThan(index)
  fireEvent.click(kort[index])
}

describe('CrisisTab — grundningsövningarna visar rätt steg för respektive teknik', () => {
  it('5-4-3-2-1-tekniken (första kortet) visar sensoriska steg, inte lyssnande-stegen', () => {
    const { container } = renderTab()
    klickaGrundningskort(0)

    expect(container.textContent).toContain('Identifiera 5 saker du ser')
    expect(container.textContent).not.toContain('Hitta en lugn röst eller musik')
  })

  it('kallt-vatten-tekniken (andra kortet) visar sina egna steg, inte 5-4-3-2-1 eller lyssnande', () => {
    const { container } = renderTab()
    klickaGrundningskort(1)

    expect(container.textContent).toContain('Hitta kall vatten')
    expect(container.textContent).not.toContain('Identifiera 5 saker du ser')
    expect(container.textContent).not.toContain('Hitta en lugn röst eller musik')
  })

  it('aktivt lyssnande (tredje kortet) visar sina egna steg', () => {
    const { container } = renderTab()
    klickaGrundningskort(2)

    expect(container.textContent).toContain('Hitta en lugn röst eller musik')
  })
})
