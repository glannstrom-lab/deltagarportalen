import { useCallback, useSyncExternalStore } from 'react'

/**
 * Följer en godtycklig media query.
 *
 * `useBreakpoint` finns redan men är låst till `(min-width: 900px)` med ett
 * uttryckligt skäl i sin docstring — den måste följa HubGrids CSS-brytpunkt
 * exakt, annars driver dess upsert-nyckel isär från layouten (fallgrop 6). Att
 * generalisera den hade alltså riskerat en känd bugg för att spara en fil.
 *
 * Används av rådgivarlagret, som bryter vid `xl` (1280 px): över den finns en
 * egen kolumn till höger, under den faller panelen sist i flödet. Skillnaden
 * går inte att uttrycka i CSS eftersom den styr en komponents *utgångsläge*,
 * inte dess utseende.
 *
 * Byggd på `useSyncExternalStore`, inte useState + useEffect. En media query
 * ÄR en extern källa, och den kan hinna ändras mellan renderingen och att
 * effekten körs. Med useState behövdes en omläsning inuti effekten för att
 * täppa till glappet — vilket är precis vad `react-hooks/set-state-in-effect`
 * varnar för, och samma regel fällde palettens aktiva index tidigare samma
 * dag. useSyncExternalStore stänger glappet i stället för att lappa det.
 */
export function useMediaQuery(query: string): boolean {
  const prenumerera = useCallback(
    (vidAndring: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener('change', vidAndring)
      return () => mq.removeEventListener('change', vidAndring)
    },
    [query]
  )

  const las = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }, [query])

  // Serverögonblicksbilden är `false`: portalen renderas inte på server, men
  // testmiljön saknar ibland matchMedia, och då är "ingen kolumn" det säkra
  // svaret — panelen hamnar sist i flödet i stället för att försvinna.
  return useSyncExternalStore(prenumerera, las, () => false)
}
