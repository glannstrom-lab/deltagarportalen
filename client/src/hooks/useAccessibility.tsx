/**
 * Accessibility Hooks
 * Hjälper till att göra appen mer tillgänglig för alla användare
 * Inkluderar: reduced motion, tangentbordsnavigering, ARIA-stöd
 */

import { useState, useEffect, useCallback, useRef, type RefObject, type JSX } from 'react'

/**
 * Hook för att lyssna på prefers-reduced-motion
 * Använd detta för att respektera användarens önskemål om mindre animation
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Kolla initialt värde
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    // Lyssna på ändringar
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

/**
 * Hook för att få rätt transition-klass baserat på reduced motion
 */
export function useAccessibleTransition(
  baseDuration: string = '200ms'
): { transition: string; duration: number } {
  const reducedMotion = useReducedMotion()
  
  return {
    transition: reducedMotion ? 'none' : `all ${baseDuration} ease-out`,
    duration: reducedMotion ? 0 : parseInt(baseDuration)
  }
}

/**
 * Hook för focus trap (för modaler och menyer)
 * Håller fokus inom en container tills den stängs
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: RefObject<HTMLElement>
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Spara nuvarande fokus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Hitta fokuserbara element
    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Sätt fokus på första elementet
    firstElement?.focus()

    // Hantera Tab-tangenten
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Hantera Escape-tangenten
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Trigga ett custom event som komponenten kan lyssna på
        container.dispatchEvent(new CustomEvent('focusTrapEscape', { bubbles: true }))
      }
    }

    container.addEventListener('keydown', handleTabKey)
    container.addEventListener('keydown', handleEscape)

    return () => {
      container.removeEventListener('keydown', handleTabKey)
      container.removeEventListener('keydown', handleEscape)
      // Återställ fokus
      previousFocusRef.current?.focus()
    }
  }, [isActive, containerRef])
}

/**
 * Hook för tangentbordsnavigering i listor (radio buttons, flikar, etc)
 */
export function useKeyboardNavigation(
  itemCount: number,
  options?: {
    orientation?: 'horizontal' | 'vertical'
    loop?: boolean
  }
): {
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
} {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const { orientation = 'horizontal', loop = true } = options || {}

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isHorizontal = orientation === 'horizontal'
    
    switch (e.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev < itemCount - 1) return prev + 1
          return loop ? 0 : prev
        })
        break
      
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          if (prev > 0) return prev - 1
          return loop ? itemCount - 1 : prev
        })
        break
      
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      
      case 'End':
        e.preventDefault()
        setFocusedIndex(itemCount - 1)
        break
    }
  }, [itemCount, orientation, loop])

  return { focusedIndex, setFocusedIndex, handleKeyDown }
}

/**
 * Hook för att meddela skärmläsare om ändringar
 * Använd ARIA live regions för att kommunicera viktiga uppdateringar
 */
export function useAnnounce(): {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  clearAnnouncement: () => void
} {
  const [announcement, setAnnouncement] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')

  const announce = useCallback((message: string, prio: 'polite' | 'assertive' = 'polite') => {
    setPriority(prio)
    setAnnouncement(message)
    // Rensa efter en stund så samma meddelande kan annonseras igen
    setTimeout(() => setAnnouncement(''), 1000)
  }, [])

  const clearAnnouncement = useCallback(() => {
    setAnnouncement('')
  }, [])

  // Komponent som renderar ARIA live region
  const AnnouncementRegion = () => (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  )

  return { announce, clearAnnouncement, AnnouncementRegion } as any
}

/**
 * Hook för att hantera ESC-tangenten
 */
export function useEscapeKey(
  onEscape: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, enabled])
}

/**
 * Hook för att hantera klick utanför ett element
 * Användbart för att stänga dropdowns, modaler, etc.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  onClickOutside: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, onClickOutside, enabled])
}

/**
 * Hook för att hantera fokus på första fältet med error
 * Användbart i formulär vid valideringsfel
 */
export function useFocusFirstError(
  errors: Record<string, any>,
  formRef: RefObject<HTMLFormElement>
): void {
  useEffect(() => {
    if (Object.keys(errors).length === 0 || !formRef.current) return

    // Hitta första fältet med error
    const firstErrorKey = Object.keys(errors)[0]
    const errorElement = formRef.current.querySelector<HTMLElement>(
      `[name="${firstErrorKey}"], [data-error="${firstErrorKey}"]`
    )

    if (errorElement) {
      errorElement.focus()
      // Scrolla till elementet om det behövs
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [errors, formRef])
}

/**
 * Hook för att skippa till huvudinnehåll
 * Tillgänglighetsfunktion för tangentbordsanvändare
 */
export function useSkipLink(
  mainContentId: string
): {
  SkipLinkComponent: () => JSX.Element
} {
  const SkipLinkComponent = () => (
    <a
      href={`#${mainContentId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:"
    >
      Hoppa till huvudinnehåll
    </a>
  )

  return { SkipLinkComponent }
}

/**
 * Hook för att bestämma om enhet är touch-baserad
 * Användbart för att anpassa interaktioner
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      )
    }
    
    checkTouch()
  }, [])

  return isTouch
}

/**
 * Hook för att hantera high contrast mode
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setHighContrast(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setHighContrast(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return highContrast
}

export default {
  useReducedMotion,
  useAccessibleTransition,
  useFocusTrap,
  useKeyboardNavigation,
  useAnnounce,
  useEscapeKey,
  useClickOutside,
  useFocusFirstError,
  useSkipLink,
  useIsTouchDevice,
  useHighContrast
}
