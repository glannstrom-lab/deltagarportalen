/**
 * AIX2 — "Vad har jag med mig?".
 *
 * Personen svarar på några öppna frågor om vardag, ideellt arbete och oavlönade
 * uppdrag; servern svarar med förslag till CV-rader. Varje förslag bär personens
 * EGEN mening som citat. Servern (`client/api/_prompts/_vardag.js`) har redan
 * strukit förslag vars citat inte står ordagrant i svaren, som har siffror,
 * titlar eller omfattningsord personen inte skrivit, eller som nämner hälsa.
 *
 * Hälsa: svar som nämner hälsa lämnar aldrig webbläsaren (kontrolleras här med
 * samma ordlista som journalens varning) och skickas aldrig vidare till
 * modellen (kontrolleras igen på servern). Inget sparas här — komponenten lägger
 * till en rad först när personen klickat på den.
 *
 * Går genom `callAI`: PII-sanering, AI-av-brytaren och dagstaket gäller.
 */

import { callAI } from '@/services/aiApi'
import { hittaHalsoord } from '@/components/consultant/utkastGranskare'

export interface VardagSvar {
  fraga: string
  text: string
}

export interface VardagForslag {
  titel: string
  organisation: string
  beskrivning: string
  citat: string
}

export type VardagResultat =
  | { typ: 'forslag'; forslag: VardagForslag[] }
  | { typ: 'halsa'; ord: string[] }

/** Samma tak som servern — mer skickas inte. */
export const VARDAG_SVAR_MAX_TECKEN = 600
export const VARDAG_SVAR_ANTAL = 5

function arForslag(v: unknown): v is VardagForslag {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.titel === 'string' && o.titel.length > 0 &&
    typeof o.organisation === 'string' &&
    typeof o.beskrivning === 'string' &&
    typeof o.citat === 'string' && o.citat.length > 0
  )
}

/** Hälsoord i svaren, innan något skickas. */
export function halsoordISvar(svar: VardagSvar[]): string[] {
  return hittaHalsoord(svar.map((s) => s.text).join('\n'))
}

/** Ber om förslag. Kastar vid fel i anropet. Hälsoord stoppar anropet helt. */
export async function foreslaFranVardag(svar: VardagSvar[]): Promise<VardagResultat> {
  const rensade = svar
    .slice(0, VARDAG_SVAR_ANTAL)
    .map((s) => ({ fraga: s.fraga, text: s.text.trim().slice(0, VARDAG_SVAR_MAX_TECKEN) }))
    .filter((s) => s.text)
  if (rensade.length === 0) return { typ: 'forslag', forslag: [] }

  const ord = halsoordISvar(rensade)
  if (ord.length > 0) return { typ: 'halsa', ord }

  // Modellen skriver ogiltig JSON i ungefär vart sjätte anrop (se rattstavningApi).
  let svarAi: unknown
  try {
    svarAi = await callAI<unknown>('vad-har-jag-med-mig', { svar: rensade })
  } catch (err) {
    if ((err as { kod?: string })?.kod !== 'AI_INVALID_RESPONSE') throw err
    svarAi = await callAI<unknown>('vad-har-jag-med-mig', { svar: rensade })
  }
  const vardag = (svarAi as { vardag?: { avvisad?: unknown; forslag?: unknown } }).vardag
  if (!vardag) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  // Servern kan ha sett hälsa som klientens ordlista missade.
  if (vardag.avvisad === 'halsa') return { typ: 'halsa', ord: [] }
  if (!Array.isArray(vardag.forslag)) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  return { typ: 'forslag', forslag: vardag.forslag.filter(arForslag) }
}
