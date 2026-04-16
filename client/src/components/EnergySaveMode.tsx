/**
 * Energy Save Mode Provider
 *
 * Applies calm/energy-save mode styling to the application when enabled.
 * Settings from settingsStore control:
 * - calmMode: Reduced visual complexity, larger touch targets
 * - largeText: Increased font sizes throughout
 * - highContrast: Enhanced contrast for readability
 *
 * This component adds/removes CSS classes on the document element
 * so Tailwind variants can be used throughout the app.
 */

import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * CSS classes applied for each mode:
 *
 * .calm-mode - Reduces animations, simplifies UI
 *   - Used with: calm:* Tailwind variants
 *   - Affects: Transitions, animations, shadows, hover states
 *
 * .large-text - Increases base font size
 *   - Applied: 18px base instead of 16px
 *   - Affects: All relative font sizes
 *
 * .high-contrast - Enhances contrast
 *   - Applied: Higher contrast colors
 *   - Affects: Text/background contrast ratios
 *
 * .low-energy - Combined mode for users with low energy
 *   - Combines calm-mode behaviors
 *   - Adds: Reduced cognitive load, simpler choices
 */

export function EnergySaveMode() {
  const { calmMode, largeText, highContrast, energyLevel } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement

    // Calm mode
    if (calmMode) {
      root.classList.add('calm-mode')
    } else {
      root.classList.remove('calm-mode')
    }

    // Large text
    if (largeText) {
      root.classList.add('large-text')
      root.style.fontSize = '18px'
    } else {
      root.classList.remove('large-text')
      root.style.fontSize = ''
    }

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Low energy mode (combines calm mode behaviors)
    if (energyLevel === 'low') {
      root.classList.add('low-energy')
      // Auto-enable calm mode behaviors even if not explicitly set
      if (!calmMode) {
        root.classList.add('calm-mode')
      }
    } else {
      root.classList.remove('low-energy')
    }

    // Cleanup on unmount
    return () => {
      root.classList.remove('calm-mode', 'large-text', 'high-contrast', 'low-energy')
      root.style.fontSize = ''
    }
  }, [calmMode, largeText, highContrast, energyLevel])

  // This component doesn't render anything
  return null
}

/**
 * Hook to check if energy save features are active
 */
export function useEnergySaveMode() {
  const { calmMode, largeText, highContrast, energyLevel } = useSettingsStore()

  return {
    isCalmMode: calmMode || energyLevel === 'low',
    isLargeText: largeText,
    isHighContrast: highContrast,
    isLowEnergy: energyLevel === 'low',
    energyLevel
  }
}

export default EnergySaveMode
