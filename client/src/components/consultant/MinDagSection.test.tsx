import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MinDagSection } from './MinDagSection'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) => (o?.count !== undefined ? `${k}:${o.count}` : k),
  }),
}))

const tom = { meetings: [], deadlines: [] }

describe('MinDagSection — F12 Logga kontakt och PG24 kontaktstatus', () => {
  it('"Logga kontakt" anropar onLogContact för en ej kontaktad deltagare', () => {
    const onLogContact = vi.fn()
    render(
      <MemoryRouter>
        <MinDagSection
          {...tom}
          contacts={[{ participantId: 'p1', participantName: 'Dana', reason: 'no_contact', daysSinceContact: null }]}
          onMessage={() => {}}
          onLogContact={onLogContact}
        />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /myDay\.logContact/ }))
    expect(onLogContact).toHaveBeenCalledWith('p1')
  })

  it('utan onLogContact finns ingen Logga kontakt-knapp; inaktiv deltagare får den aldrig', () => {
    render(
      <MemoryRouter>
        <MinDagSection
          {...tom}
          contacts={[{ participantId: 'p2', participantName: 'Omar', reason: 'inactive' }]}
          onMessage={() => {}}
          onLogContact={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.queryByRole('button', { name: /myDay\.logContact/ })).toBeNull()
  })

  it('PG24: aldrig kontaktad säger "Aldrig kontaktad", inte "7+ dagar"; annars dagar', () => {
    render(
      <MemoryRouter>
        <MinDagSection
          {...tom}
          contacts={[
            { participantId: 'p1', participantName: 'Dana', reason: 'no_contact', daysSinceContact: null },
            { participantId: 'p3', participantName: 'Lisa', reason: 'no_contact', daysSinceContact: 12 },
          ]}
          onMessage={() => {}}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('consultant.participants.neverContacted')).toBeTruthy()
    expect(screen.getByText('consultant.alerts.noContactDays:12')).toBeTruthy()
    expect(screen.queryByText('consultant.alerts.noContact')).toBeNull()
  })

  it('F9: pass-slotten ritas överst även när resten av Min dag är tom', () => {
    render(
      <MemoryRouter>
        <MinDagSection {...tom} contacts={[]} onMessage={() => {}} pass={<div data-testid="pass">Dagens pass</div>} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('pass')).toBeTruthy()
    expect(screen.getByText('consultant.overview.myDay.allClear')).toBeTruthy()
  })
})
