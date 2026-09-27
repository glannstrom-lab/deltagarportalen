/**
 * useSkrivning — kör en skrivning (skicka, spara, anmäl) så att ett fel aldrig
 * kan sväljas (RD26, rollspelet 2026-09-27). Hör ihop med <SkrivFel>.
 *
 * Hooken äger tre saker som annars skrivs om — och glöms — i varje hanterare:
 *   - läget: vilar → skickar → klart | fel
 *   - felet: sparas och loggas, aldrig bara `console.error` och tystnad
 *   - försök igen: samma argument en gång till, utan att anroparen håller dem
 *
 * `kor()` kastar aldrig. Den returnerar `true` när skrivningen gick igenom,
 * så att anroparen tömmer sitt fält BARA då:
 *
 *   const skicka = useSkrivning((text: string) => api.skicka(text))
 *   if (await skicka.kor(text)) setText('')
 *   {skicka.lage === 'fel' && <SkrivFel onForsokIgen={skicka.forsokIgen} />}
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type SkrivLage = 'vilar' | 'skickar' | 'klart' | 'fel'

export interface Skrivning<A extends unknown[]> {
  lage: SkrivLage
  /** Felet från senaste försöket, annars null. */
  fel: unknown
  /** Kör skrivningen. `true` = gick igenom. Kastar aldrig. */
  kor: (...args: A) => Promise<boolean>
  /** Gör om senaste skrivningen med samma argument. */
  forsokIgen: () => Promise<boolean>
  /** Tillbaka till vilar (t.ex. när formuläret stängs). */
  nollstall: () => void
}

export function useSkrivning<A extends unknown[]>(
  skrivning: (...args: A) => Promise<unknown>,
  { onKlart }: { onKlart?: () => void } = {},
): Skrivning<A> {
  const [lage, setLage] = useState<SkrivLage>('vilar')
  const [fel, setFel] = useState<unknown>(null)
  const senaste = useRef<A | null>(null)
  const pagar = useRef(false)
  // Den senaste versionen av funktionen — anroparen skickar ofta en ny closure
  // vid varje rendering, och ett försök igen ska använda dagens, inte gårdagens.
  // Refarna skrivs i en effekt, inte under renderingen (react-hooks/refs).
  const fn = useRef(skrivning)
  const klar = useRef(onKlart)
  useEffect(() => {
    fn.current = skrivning
    klar.current = onKlart
  })

  const kor = useCallback(async (...args: A): Promise<boolean> => {
    if (pagar.current) return false
    pagar.current = true
    senaste.current = args
    setLage('skickar')
    setFel(null)
    try {
      await fn.current(...args)
      setLage('klart')
      klar.current?.()
      return true
    } catch (e) {
      // Felet visas för deltagaren av <SkrivFel>; loggen är för oss.
      console.warn('[useSkrivning] skrivningen misslyckades', e)
      setFel(e)
      setLage('fel')
      return false
    } finally {
      pagar.current = false
    }
  }, [])

  const forsokIgen = useCallback(async () => {
    if (!senaste.current) return false
    return kor(...senaste.current)
  }, [kor])

  const nollstall = useCallback(() => {
    setLage('vilar')
    setFel(null)
  }, [])

  return { lage, fel, kor, forsokIgen, nollstall }
}
