import { useEffect, useState } from 'react'

/**
 * Stable 'desktop' | 'mobile' keyed off (min-width: 900px) — matches
 * HubGrid's CSS breakpoint exactly. Critical for Pitfall 6 (per-breakpoint
 * upsert key cannot drift from actual responsive layout).
 */
export function useBreakpoint(): 'desktop' | 'mobile' {
  const [bp, setBp] = useState<'desktop' | 'mobile'>(() => {
    if (typeof window === 'undefined') return 'desktop'
    return window.matchMedia('(min-width: 900px)').matches ? 'desktop' : 'mobile'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 900px)')
    const handler = (e: MediaQueryListEvent) => {
      setBp(e.matches ? 'desktop' : 'mobile')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return bp
}
