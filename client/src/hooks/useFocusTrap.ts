import { useEffect, useRef, useCallback, useLayoutEffect } from 'react'

/**
 * useFocusTrap - Håller fokus inom en container för modaler/menyer
 * WCAG 2.1.2: Ingen tangentbordsfälla
 *
 * @param isActive - Om focus trap är aktiv
 * @param options - Konfiguration
 */
interface FocusTrapOptions {
  /** Callback när Escape trycks */
  onEscape?: () => void
  /** Återställ fokus när trap stängs */
  restoreFocus?: boolean
  /** Fokusera första elementet automatiskt */
  autoFocus?: boolean
}

const FOCUSABLE_SELECTORS = [
  'a[href]:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ')

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  options: FocusTrapOptions = {}
) {
  const { onEscape, restoreFocus = true, autoFocus = true } = options
  const containerRef = useRef<T>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Use ref to store onEscape to avoid re-adding listeners on every render
  const onEscapeRef = useRef(onEscape)
  useLayoutEffect(() => {
    onEscapeRef.current = onEscape
  })

  // Hämta alla fokuserbara element
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => el.offsetParent !== null) // Filtrera bort dolda element
  }, [])

  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    // Spara föregående fokus
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    // Fokusera första elementet
    if (autoFocus) {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        // Liten fördröjning för att säkerställa att elementet är synligt
        requestAnimationFrame(() => {
          focusable[0].focus()
        })
      }
    }

    // Hantera tangentbordshändelser
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape - stäng
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault()
        e.stopPropagation()
        onEscapeRef.current()
        return
      }

      // Tab - fokus-trap
      if (e.key === 'Tab') {
        const focusable = getFocusableElements()
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (e.shiftKey) {
          // Shift+Tab: Gå bakåt
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: Gå framåt
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // Hantera klick utanför (valfritt)
    const handleClickOutside = (e: MouseEvent) => {
      if (container && !container.contains(e.target as Node) && onEscapeRef.current) {
        onEscapeRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside, { passive: true })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)

      // Återställ fokus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive, restoreFocus, autoFocus, getFocusableElements]) // onEscape removed - uses ref instead

  return containerRef
}

export default useFocusTrap
