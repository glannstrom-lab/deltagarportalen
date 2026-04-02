import { useEffect, useRef, useLayoutEffect, RefObject } from 'react'

/**
 * Hook that handles clicking outside of a specified element
 * Useful for closing dropdowns, modals, and menus
 *
 * @param ref - React ref to the element to detect clicks outside of
 * @param handler - Callback function to call when clicking outside
 * @param enabled - Optional flag to enable/disable the listener (default: true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: () => void,
  enabled: boolean = true
): void {
  // Use ref to store handler to avoid re-adding listeners on every render
  const handlerRef = useRef(handler)

  // Update ref synchronously to ensure we always have the latest handler
  useLayoutEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current

      // Do nothing if clicking ref's element or its descendants
      if (!el || el.contains(event.target as Node)) {
        return
      }

      // Call the current handler from ref (always up-to-date)
      handlerRef.current()
    }

    // Use mousedown and touchstart for better UX
    // (fires before click, feels more responsive)
    // Use passive: true for better scroll performance
    document.addEventListener('mousedown', listener, { passive: true })
    document.addEventListener('touchstart', listener, { passive: true })

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, enabled]) // handler removed from dependencies - uses ref instead
}

export default useClickOutside
