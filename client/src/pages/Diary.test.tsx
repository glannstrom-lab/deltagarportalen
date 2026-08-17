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
  WellnessConsentGate: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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

vi.mock('@/hooks/useDiary', () => ({
  useDiaryStreaks: () => ({
    currentStreak: 0,
    longestStreak: 0,
    totalEntries: 0,
    totalWords: 0,
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
