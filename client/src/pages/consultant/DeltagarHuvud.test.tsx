/**
 * Deltagarsidans huvud (omtaget steg 5): EN primärknapp, och de sällsynta och
 * oåterkalleliga handlingarna i Mer-menyn — "Avsluta plan" sist, avskild, i
 * varningsfärg. Mutation: ta bort `farlig: true` på "Avsluta plan" → faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import { render } from '@/test/utils'
import { DeltagarHuvud, type PlanAtgarder } from './DeltagarHuvud'

function rendera(plan: PlanAtgarder | null, laget: string | null = 'Aktivitetsplan 10 h/vecka sedan 1 september') {
  const h = { onMeddelande: vi.fn(), onBokaMote: vi.fn(), onLoggaSamtal: vi.fn(), onRegistreraPlacering: vi.fn() }
  render(
    <DeltagarHuvud
      namn="Leila Haddad" bildUrl={null} epost="leila@example.com" telefon="070-123 45 67"
      status="ACTIVE" placeringsrad={null} laget={laget} loggarSamtal={false} plan={plan} {...h}
    />,
  )
  return h
}

const plan = (o: Partial<PlanAtgarder> = {}): PlanAtgarder => ({ harPlan: true, pdfLaddar: false, onPdf: vi.fn(), onAvsluta: vi.fn(), ...o })

describe('DeltagarHuvud', () => {
  it('har exakt en primärknapp, och den skickar meddelande', () => {
    const h = rendera(plan())
    const primara = within(screen.getByTestId('deltagare-atgarder')).getAllByRole('button').filter((b) => b.getAttribute('data-variant') === 'primary')
    expect(primara.map((b) => b.textContent)).toEqual(['Skicka meddelande'])
    fireEvent.click(primara[0])
    expect(h.onMeddelande).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Boka möte' })).toHaveAttribute('data-variant', 'secondary')
    expect(screen.getByRole('button', { name: 'Logga samtal' })).toHaveAttribute('data-variant', 'secondary')
  })

  it('Mer-menyn: Plan som PDF, Registrera placering — och Avsluta plan sist, efter en avdelare', () => {
    const p = plan()
    rendera(p)
    fireEvent.click(screen.getByRole('button', { name: 'Fler åtgärder' }))
    const meny = screen.getByRole('menu')
    expect(within(meny).getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Plan som PDF', 'Registrera placering', 'Avsluta plan'])
    const barn = Array.from(meny.children)
    expect(barn[barn.length - 2].getAttribute('role')).toBe('separator')
    expect(within(meny).getByText('Avsluta plan').className).toContain('--s-ogiltig-text')
    fireEvent.click(within(meny).getByRole('menuitem', { name: 'Avsluta plan' }))
    expect(p.onAvsluta).toHaveBeenCalled()
  })

  it('utan plan finns varken PDF eller avslut i menyn', () => {
    rendera(plan({ harPlan: false }))
    fireEvent.click(screen.getByRole('button', { name: 'Fler åtgärder' }))
    expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Registrera placering'])
  })

  it('läget står under namnet, och är tomt (inte påhittat) medan det laddar', () => {
    rendera(null, null)
    expect(screen.getByRole('heading', { level: 1, name: 'Leila Haddad' })).toBeInTheDocument()
    expect(screen.getByTestId('deltagar-laget')).toHaveTextContent(/^$/)
    expect(screen.getByRole('link', { name: 'leila@example.com' })).toHaveAttribute('href', 'mailto:leila@example.com')
  })
})
