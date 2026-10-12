/**
 * deltagarFilter — de rena reglerna bakom deltagarlistans snabbfilter
 * "Ogiltig frånvaro i veckan" och "Underlag ej lämnat" (KSL17, 2026-10-12).
 *
 * Båda räknas ur data som redan finns: veckans pass (lib/deltagarlage.ts) och
 * lämnade underlag (activity_plan_handovers). Inget eget tal, ingen gissning.
 *
 *   ogiltig frånvaro   pass i innevarande vecka (mån–sön, lokal tid) som
 *                      konsulenten markerat `absent_invalid`. Hos en
 *                      Rusta och matcha-leverantör heter samma sak "inte anmäld"
 *                      (KSL21) — ordet väljs i listan, regeln är densamma.
 *   underlag ej lämnat aktiv plan utan ett underlag (som inte ångrats) lämnat
 *                      under innevarande kalendermånad. Underlag är kommunens
 *                      stödmånad (manadsunderlagPdf), så filtret gäller bara
 *                      kommun.
 */
import { addDays, veckansMandag } from '@/services/aktivitetSchema'

export function ogiltigFranvaroIVeckan(
  pass: readonly { participant_id: string; date: string; attendance: string | null }[],
  idag: string,
): Set<string> {
  const mandag = veckansMandag(idag)
  const sondag = addDays(mandag, 6)
  return new Set(
    pass
      .filter((p) => p.attendance === 'absent_invalid' && p.date >= mandag && p.date <= sondag)
      .map((p) => p.participant_id),
  )
}

/** YYYY-MM-DD → lokal kalendermånad "YYYY-MM" för en tidsstämpel. */
function lokalManad(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function utanUnderlagIManaden(
  planer: readonly { participant_id: string; status: string }[],
  underlag: readonly { participant_id: string; handed_over_at: string; withdrawn_at: string | null }[],
  idag: string,
): Set<string> {
  const manad = idag.slice(0, 7)
  const harLamnat = new Set(
    underlag.filter((u) => !u.withdrawn_at && lokalManad(u.handed_over_at) === manad).map((u) => u.participant_id),
  )
  return new Set(
    planer.filter((p) => p.status === 'active' && !harLamnat.has(p.participant_id)).map((p) => p.participant_id),
  )
}

/** Första och sista dagen i månaden `idag` ligger i. */
export function manadensGranser(idag: string): { from: string; to: string } {
  const [y, m] = idag.split('-').map(Number)
  const sista = new Date(y, m, 0).getDate()
  const mm = String(m).padStart(2, '0')
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(sista).padStart(2, '0')}` }
}

/**
 * KSL17-skav: "Underlag ej lämnat" gäller bara kommun. En direktlänk
 * (?filter=utan-underlag) hos en ren leverantör, eller när underlagen inte gick
 * att hämta, ska inte ge en tom lista — filtret gäller då inte, och listan säger det.
 * Medan kundtypen inte är känd (`kundtypKand` falskt) rörs inget.
 */
export function underlagsfiltretGaller(o: {
  kundtypKand: boolean
  visaUnderlagsfilter: boolean
  underlagFel: boolean
}): boolean {
  if (!o.kundtypKand) return true
  return o.visaUnderlagsfilter && !o.underlagFel
}
