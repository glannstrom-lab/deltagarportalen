/**
 * Diary — F21 (WCAG 4.1.2): de fyra flikknapparna (Dagbok/Mående/Mål/Tacksamhet)
 * hade sin etikett i ett `<span class="hidden xs:inline sm:inline">`, osynligt
 * under `xs`-brytpunkten. Sedan steg 5 (2026-08-17, sidoskenan ersatte hjälten)
 * ligger flikarna i `PageLayout`s `sidoflikar`-prop i stället för i en egen
 * flikrad i sidans innehåll — samma `SidRail`-knappar (`aria-current="true"`,
 * inget `hidden`-span) som resten av portalen. jsdom har ingen viewport, så
 * testet verifierar att namnet finns i DOM-attributet — inte det visuella
 * utfallet vid en brytpunkt.
 *
 * Tunga beroenden (WellnessConsentGate, FocusModeProvider, flikinnehållet)
 * mockas bort. `PageLayout` mockas till att rendera `sidoflikar.poster` som
 * riktiga knappar — annars ser testet ingen flik alls, bara en tom `<div>`,
 * samma fälla som B32 (Resources.savedJobsCount.test.tsx) redan dokumenterar.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/components/layout/index', () => ({
  PageLayout: ({
    children,
    sidoflikar,
  }: {
    children?: React.ReactNode
    sidoflikar?: {
      poster: Array<{ id: string; etikett: string }>
      aktiv: string
      vidVal: (id: string) => void
    }
  }) => (
    <div>
      {sidoflikar && (
        <nav aria-label="Avsnitt">
          {sidoflikar.poster.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.etikett}
              aria-current={p.id === sidoflikar.aktiv ? 'true' : undefined}
              onClick={() => sidoflikar.vidVal(p.id)}
            >
              {p.etikett}
            </button>
          ))}
        </nav>
      )}
      {children}
    </div>
  ),
}))

vi.mock('@/components/consent/WellnessConsentGate', () => ({
  WellnessConsentGate: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="wellness-gate">{children}</div>
  ),
}))

vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }),
}))

vi.mock('@/components/focus/shell/PageFocusShell', () => ({
  PageFocusShell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/focus/pages/FocusDiaryWizard', () => ({
  FocusDiaryWizard: () => null,
}))

// LS1: mocken ger en användare som skrivit länge — om sidan någonsin åter
// läser streak-data ska den ha något att visa, och testet nedan faller.
vi.mock('@/hooks/useDiary', () => ({
  useDiaryStreaks: () => ({
    currentStreak: 9,
    longestStreak: 15,
    totalEntries: 10,
    totalWords: 1050,
  }),
}))

vi.mock('@/components/diary', () => ({
  JournalTab: () => <div>journal-tab-content</div>,
  MoodTab: () => <div>mood-tab-content</div>,
  GoalsTab: () => <div>goals-tab-content</div>,
  GratitudeTab: () => <div>gratitude-tab-content</div>,
}))

import Diary from './Diary'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/diary']}>
      <Diary />
    </MemoryRouter>
  )

describe('F21: dagbokens fyra flikar har alltid ett tillgängligt namn', () => {
  it('varje flik-knapp har aria-label som matchar sin (visuellt döljbara) etikett', () => {
    renderPage()

    // De fyra flikarna — testet kör riktig i18next mot sv.json, så namnen är
    // de faktiska svenska etiketterna (diary.tabs.* i sv.json), inte nycklarna.
    expect(screen.getByRole('button', { name: 'Dagbok' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Humör' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mål' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tacksamhet' })).toBeInTheDocument()
  })

  it('den aktiva fliken har aria-current="true"', () => {
    renderPage()
    const journalTab = screen.getByRole('button', { name: 'Dagbok' })
    expect(journalTab).toHaveAttribute('aria-current', 'true')

    const moodTab = screen.getByRole('button', { name: 'Humör' })
    expect(moodTab).not.toHaveAttribute('aria-current')
  })
})

describe('F6: bara Mood kräver hälsosamtycke', () => {
  it('Dagbok, Mål och Tacksamhet renderas utan WellnessConsentGate', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('journal-tab-content')).toBeInTheDocument()
    expect(screen.queryByTestId('wellness-gate')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mål' }))
    expect(screen.getByText('goals-tab-content')).toBeInTheDocument()
    expect(screen.queryByTestId('wellness-gate')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tacksamhet' }))
    expect(screen.getByText('gratitude-tab-content')).toBeInTheDocument()
    expect(screen.queryByTestId('wellness-gate')).not.toBeInTheDocument()
  })

  it('Humör ligger bakom WellnessConsentGate', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Humör' }))
    const gate = screen.getByTestId('wellness-gate')
    expect(gate).toBeInTheDocument()
    expect(gate).toHaveTextContent('mood-tab-content')
  })
})

describe('LS1: dagboken visar ingen streak-räknare och inga troféer (DESIGN.md §1)', () => {
  it('ingen "N dagar"-räknare, ingen eld och ingen trofé', () => {
    const { container } = renderPage()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/🔥|🏆|📚|✍️/)
    expect(text).not.toMatch(/\b9\b|\b15\b/)
    expect(text).not.toMatch(/dagar i rad|i rad/i)
  })
})
