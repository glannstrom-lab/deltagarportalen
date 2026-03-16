import { useEffect, RefObject } from 'react'

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
  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current

      // Do nothing if clicking ref's element or its descendants
      if (!el || el.contains(event.target as Node)) {
        return
      }

      handler()
    }

    // Use mousedown and touchstart for better UX
    // (fires before click, feels more responsive)
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, enabled])
}

export default useClickOutside
