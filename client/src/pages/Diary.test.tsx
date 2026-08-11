/**
 * Diary — F21 (WCAG 4.1.2): de fyra flikknapparna (Dagbok/Mående/Mål/Tacksamhet)
 * har sin etikett i ett `<span class="hidden xs:inline sm:inline">`, som är
 * osynligt under `xs`-brytpunkten. Utan `aria-label` på själva knappen har
 * fliken inget tillgängligt namn alls på mobil (docs/portal-review-2026-08-09.md
 * fynd 4 / ROADMAP F21). jsdom har ingen viewport, så testet verifierar att
 * namnet finns i DOM-attributet — inte det visuella utfallet vid en brytpunkt.
 *
 * Tunga beroenden (PageLayout, WellnessConsentGate, FocusModeProvider,
 * flikinnehållet) mockas bort — testet gäller bara flikbytarens namngivning.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/components/layout/index', () => ({
  PageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
