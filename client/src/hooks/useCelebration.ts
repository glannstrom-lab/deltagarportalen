/**
 * useCelebration — firande i nyckelögonblick (LIV fas 5 / ROADMAP G5)
 *
 * ## Varför så lågmält
 *
 * Målgruppen är arbetssökande som kan ha varit utan jobb länge, ofta med
 * fysiska eller psykologiska utmaningar. Ett firande ska kännas som att någon
 * ser dig — inte som att en app delar ut poäng. Därför:
 *
 *  - Ingen poängställning, inga märken, ingen nivå. Poängmaskineriet togs
 *    bort i G9 (se `useAchievementTracker`); att fira med siffror här skulle
 *    återinföra samma sak bakvägen. ROADMAP §6 förbjuder Gamification 2.0.
 *  - Texten är en mänsklig mening om vad personen just gjorde, inte ett
 *    utrop. DESIGN.md §2.
 *  - Rörelsen är kort (1,2 s), sker en gång, och stängs av helt när användaren
 *    har bett om lugn: `prefers-reduced-motion`, calm mode eller fokusläge.
 *    Då återstår enbart den varma texten — firandet försvinner inte, det
 *    slutar bara röra sig.
 *
 * `canvas-confetti` fanns redan som beroende men användes inte av någon fil
 * (bara CSS-klassen `animate-confetti` i WellnessQuickCard). Den laddas lazy
 * här, så den ligger utanför entry-bundlen.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { showToast } from '@/components/Toast'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFocusMode } from '@/components/FocusModeProvider'

/** De ögonblick som är värda ett firande. Håll listan kort — firar vi allt
 *  betyder det ingenting. */
export type CelebrationMoment =
  | 'applicationSent'
  | 'exerciseDone'
  | 'cvComplete'

const MOMENT_COPY: Record<CelebrationMoment, { titleKey: string; titleDefault: string; messageKey: string; messageDefault: string }> = {
  applicationSent: {
    titleKey: 'celebration.applicationSent.title',
    titleDefault: 'Ansökan är skickad',
    messageKey: 'celebration.applicationSent.message',
    messageDefault: 'Det är gjort. Du behöver inte göra något mer med den nu.',
  },
  exerciseDone: {
    titleKey: 'celebration.exerciseDone.title',
    titleDefault: 'Övningen är klar',
    messageKey: 'celebration.exerciseDone.message',
    messageDefault: 'Bra att du tog dig tid.',
  },
  cvComplete: {
    titleKey: 'celebration.cvComplete.title',
    titleDefault: 'Ditt CV är komplett',
    messageKey: 'celebration.cvComplete.message',
    messageDefault: 'Nu finns det att skicka med när du hittar något som passar.',
  },
}

/** Respekterar användarens ljud- och rörelseval. Läses vid varje anrop så att
 *  ett byte i inställningarna gäller direkt. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function burst() {
  try {
    const { default: confetti } = await import('canvas-confetti')
    confetti({
      particleCount: 45,
      spread: 55,
      startVelocity: 26,
      gravity: 0.9,
      ticks: 110,
      origin: { y: 0.72 },
      disableForReducedMotion: true,
      scalar: 0.85,
    })
  } catch {
    // Ett firande som inte kan animeras är inte ett fel — texten räcker.
  }
}

export function useCelebration() {
  const { t } = useTranslation()
  const calmMode = useSettingsStore(s => s.calmMode)
  const { isFocusMode } = useFocusMode()

  const celebrate = useCallback((moment: CelebrationMoment) => {
    const copy = MOMENT_COPY[moment]
    if (!copy) return

    showToast.success(
      t(copy.titleKey, copy.titleDefault),
      t(copy.messageKey, copy.messageDefault)
    )

    const quiet = calmMode || isFocusMode || prefersReducedMotion()
    if (!quiet) void burst()
  }, [t, calmMode, isFocusMode])

  return { celebrate }
}

export default useCelebration
