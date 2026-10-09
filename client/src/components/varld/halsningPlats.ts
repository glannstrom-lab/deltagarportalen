/**
 * Var rådgivarens hälsning står (spår JS, 2026-10-09).
 *
 * Layout ritar hälsningen överst i innehållet. En sida som har en egen plats
 * för den — staden på Översikt, platsscenen på hubbarna, platsbandet på
 * verktygssidorna — säger det här, och då ritar Layout ingen. Utan signalen
 * hade samma rådgivare hälsat två gånger på samma sida.
 */
import { createContext, useContext, useLayoutEffect } from 'react'

export const HalsningPlatsContext = createContext<(egen: boolean) => void>(() => {})

/** Anropas av en sida som själv ritar rådgivarens hälsning. */
export function useEgenHalsning(aktiv = true) {
  const satt = useContext(HalsningPlatsContext)
  useLayoutEffect(() => {
    if (!aktiv) return
    satt(true)
    return () => satt(false)
  }, [satt, aktiv])
}
