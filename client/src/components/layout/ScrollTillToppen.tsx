/**
 * ScrollTillToppen — en ny sida börjar överst.
 *
 * Appen kör HashRouter (main.tsx), och den har ingen ScrollRestoration. Ett
 * ruttbyte bytte därför innehållet men lämnade fönstret där det stod: den som
 * tryckte i bottennavet längst ned på en lång sida landade mitt i nästa sida,
 * förbi platsbandet och rådgivarens hälsning (mätt i mobilgenomgången
 * 2026-10-10 — 20 av 31 sidor öppnade nedskrollade).
 *
 * Bakåt/framåt (POP) lämnas orört: där förväntar man sig att komma tillbaka
 * till samma ställe, inte till toppen. Bara sökvägen räknas — ett flikbyte via
 * `?tab=` ska inte rycka upp sidan.
 */

import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function ScrollTillToppen() {
  const { pathname } = useLocation()
  const typ = useNavigationType()
  const forra = useRef(pathname)

  useLayoutEffect(() => {
    if (forra.current === pathname) return
    forra.current = pathname
    if (typ === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, typ])

  return null
}

export default ScrollTillToppen
