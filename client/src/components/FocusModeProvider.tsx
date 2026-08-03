/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + context/konstant/helper-export */
/**
 * Focus Mode Provider
 *
 * Applies focus mode styling to the application when enabled.
 * Focus mode (NPF-anpassat) is designed for users with neuropsychiatric
 * functional variations (ADHD, autism, etc.) to reduce cognitive load:
 * - No animations/transitions
 * - Simplified UI with one step at a time
 * - Elements marked with .hide-in-focus are hidden
 *
 * This component adds/removes CSS classes on the document element
 * so styles can be applied throughout the app.
 */

import { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFocusWizardStore } from '@/stores/focusWizardStore'

export function FocusModeProvider() {
  const { focusMode } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement

    if (focusMode) {
      root.classList.add('focus-mode')
    } else {
      root.classList.remove('focus-mode')
    }

    // Cleanup on unmount
    return () => {
      root.classList.remove('focus-mode')
    }
  }, [focusMode])

  // This component doesn't render anything
  return null
}

/**
 * Hook to check if focus mode is active.
 *
 * UX11 (2026-08-03): två begrepp, inte ett.
 *
 *  - **`isFocusModeEnabled`** — den globala inställningen. Persisteras och
 *    synkas till kontot. Styr CSS-klassen, TopBar-läget och dämpad rörelse.
 *    Ändras BARA av `toggleFocusMode` (TopBar, Inställningar, shell:ens
 *    "Avsluta fokusläge").
 *  - **`isFocusMode`** — ska den här sidans guide visas *nu*? Falskt även när
 *    läget är på, om användaren valt att se hela sidan (`leaveWizard`).
 *
 * Tidigare fanns bara det första, och wizardernas "Hoppa över"/"Klar"/
 * verktygslänkar band mot `toggleFocusMode` — 36 bindningar över 29 guider.
 * Att lämna en guide stängde alltså av tillgänglighetsfunktionen permanent på
 * hela portalen. Sidor behöver inte ändras för att få rätt beteende: de läser
 * redan `isFocusMode`, som nu är sidscopat.
 */
export function useFocusMode() {
  const { focusMode, toggleFocusMode } = useSettingsStore()
  const { pathname } = useLocation()
  const dismissedPaths = useFocusWizardStore((s) => s.dismissedPaths)
  const dismiss = useFocusWizardStore((s) => s.leaveWizard)
  const resetDismissed = useFocusWizardStore((s) => s.resetDismissed)

  /** Lämna guiden på den här sidan. Fokusläget förblir på. */
  const leaveWizard = useCallback(() => dismiss(pathname), [dismiss, pathname])

  /** Slå av/på hela fokusläget. Nollställer lämnade guider, så att ett
   *  påslag alltid ger guidat läge igen — även på sidor man lämnat tidigare. */
  const toggleFocusModeAndReset = useCallback(() => {
    resetDismissed()
    toggleFocusMode()
  }, [resetDismissed, toggleFocusMode])

  return {
    isFocusMode: focusMode && !dismissedPaths.includes(pathname),
    isFocusModeEnabled: focusMode,
    leaveWizard,
    toggleFocusMode: toggleFocusModeAndReset,
  }
}

export default FocusModeProvider
