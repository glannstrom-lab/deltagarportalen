/**
 * useOrgAiSparr — har någon organisation deltagaren är kopplad till stängt av
 * AI-funktionerna? (PUB-avvikelse 5.) Läser vyn my_ai_policy via laslogg.ts.
 *
 * Tre lägen: `undefined` = inte hämtat än, `null` = ingen spärr, annars raden.
 * Ett hämtfel behandlas som "ingen spärr" i UI:t — grinden på servern är den
 * som faktiskt nekar; det här är bara förklaringen till användaren.
 */

import { useEffect, useState } from 'react'
import { laslogg, orgSomStangtAv, type AiPolicyRad } from '@/services/laslogg'

export function useOrgAiSparr(): AiPolicyRad | null | undefined {
  const [sparr, setSparr] = useState<AiPolicyRad | null | undefined>(undefined)
  useEffect(() => {
    let aktiv = true
    laslogg
      .minAiPolicy()
      .then((rader) => { if (aktiv) setSparr(orgSomStangtAv(rader)) })
      .catch((err) => {
        console.warn('[useOrgAiSparr] my_ai_policy kunde inte läsas', err instanceof Error ? err.message : err)
        if (aktiv) setSparr(null)
      })
    return () => { aktiv = false }
  }, [])
  return sparr
}
