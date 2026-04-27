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

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

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
 * Hook to check if focus mode is active
 */
export function useFocusMode() {
  const { focusMode, toggleFocusMode } = useSettingsStore()

  return {
    isFocusMode: focusMode,
    toggleFocusMode
  }
}

export default FocusModeProvider
