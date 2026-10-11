/**
 * Beslut 2026-10-11: konsulenten ser på deltagarsidan om hennes senaste meddelande
 * är läst, och läget "I uppföljning" syns som en status. Inget står när läsraden
 * saknas (oläst eller inte inläst) — sidan påstår inte "oläst".
 */
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/utils'
import { DeltagarHuvud, type DeltagarStatus } from './DeltagarHuvud'

function rendera(meddelandeLast: string | null, status: DeltagarStatus = 'ACTIVE') {
  render(
    <DeltagarHuvud
      namn="Leila Haddad" bildUrl={null} epost="leila@example.com" telefon={null}
      status={status} placeringsrad={null} laget={null} loggarSamtal={false} plan={null}
      meddelandeLast={meddelandeLast}
      onMeddelande={vi.fn()} onBokaMote={vi.fn()} onLoggaSamtal={vi.fn()} onRegistreraPlacering={vi.fn()}
    />,
  )
}

describe('DeltagarHuvud — läst och uppföljning', () => {
  it('visar när det senaste meddelandet lästes', () => {
    rendera('Läst 14:32')
    expect(screen.getByTestId('meddelande-last')).toHaveTextContent('Ditt senaste meddelande: läst 14:32')
  })

  it('ingen rad när det inte finns något att säga', () => {
    rendera(null)
    expect(screen.queryByTestId('meddelande-last')).toBeNull()
  })

  it('I uppföljning står som status', () => {
    rendera(null, 'FOLLOW_UP')
    expect(screen.getByText('I uppföljning')).toBeInTheDocument()
  })
})
