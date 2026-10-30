/**
 * deltagarlistaInbjudan — FN6: kontrollera mot databasen och skicka inbjudningarna.
 *
 * Samma väg som InviteParticipantDialog (en rad i `invitations`, sedan
 * send-invite-email), men flera åt gången och med utfall PER RAD — rad 17 av 40 som
 * felar får aldrig sluka de andra, och aldrig synas som lyckad.
 *
 * Takt: edge-funktionen kör sina id:n parallellt mot Resend (högst 50 per anrop), så
 * vi skickar små grupper med paus emellan i stället för ett enda stort anrop —
 * annars svarar Resend 429. Ett 429 försöks om en gång, ett i taget.
 *
 * ÄRENDENUMMER OCH STARTDATUM: invitations har inga kolumner för dem. De sparas i
 * `metadata` (case_reference, start_date) men ingen trigger för över dem till
 * deltagarens plan när hen går med (handle_invitation_acceptance läser bara
 * program och sta_enrollment_id). Det kräver en migration och är inte gjort — se
 * ROADMAP FN6. Dialogen säger det rakt ut.
 */

import { supabase } from '@/lib/supabase'
import type { GranskadRad, Utfall } from './deltagarlistaCsv'

export const GRUPPSTORLEK = 4
export const PAUS_MS = 1000
const OMFORSOK_PAUS_MS = 1500
const SIDSTORLEK = 1000
const MAX_SIDOR = 20

export interface BefintligaAdresser { kopplade: Set<string>; inbjudna: Set<string> }

async function hamtaAllaEmail(
  sida: (fran: number, till: number) => PromiseLike<{ data: Array<{ email: string | null }> | null; error: { message: string } | null }>,
): Promise<Set<string>> {
  const ut = new Set<string>()
  for (let i = 0; i < MAX_SIDOR; i++) {
    const { data, error } = await sida(i * SIDSTORLEK, (i + 1) * SIDSTORLEK - 1)
    // Kan vi inte kontrollera dubbletter får vi inte skicka: kasta i stället för att räkna som "inga".
    if (error) throw new Error(`Kunde inte kontrollera redan inbjudna: ${error.message}`)
    for (const r of data ?? []) if (r.email) ut.add(r.email.trim().toLowerCase())
    if ((data ?? []).length < SIDSTORLEK) return ut
  }
  throw new Error('Du har fler än 20 000 deltagare och inbjudningar — dubblettkontrollen kan inte avslutas. Kontakta support@jobin.se.')
}

/** Adresser som konsulenten redan har kopplade respektive väntande inbjudningar till. Jämförs skiftlägesokänsligt. */
export async function hamtaBefintliga(konsulentId: string): Promise<BefintligaAdresser> {
  const kopplade = await hamtaAllaEmail((fran, till) =>
    supabase.from('profiles').select('email').eq('consultant_id', konsulentId).range(fran, till),
  )
  const inbjudna = await hamtaAllaEmail((fran, till) =>
    supabase
      .from('invitations')
      .select('email')
      .eq('consultant_id', konsulentId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .range(fran, till),
  )
  return { kopplade, inbjudna }
}

export interface SkickaAlternativ {
  onFramsteg?: (klara: number, totalt: number) => void
  signal?: AbortSignal
  /** Injicerbar för test. */
  vila?: (ms: number) => Promise<void>
  gruppstorlek?: number
  pausMs?: number
}

const sov = (ms: number) => new Promise<void>((klar) => setTimeout(klar, ms))

interface Sparad { rad: GranskadRad; invitationId: string }
interface MejlSvar { invitationId: string; success: boolean; error?: string }

async function anropaMejl(ids: string[]): Promise<{ resultat: MejlSvar[] } | { fel: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { fel: 'Du är inte inloggad längre — logga in igen.' }
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationIds: ids }),
    })
    const body = await res.json().catch(() => null) as { results?: MejlSvar[]; error?: string } | null
    if (!res.ok) return { fel: body?.error ?? `Mejltjänsten svarade ${res.status}` }
    if (!Array.isArray(body?.results)) return { fel: 'Mejltjänsten gav ett svar vi inte förstod' }
    return { resultat: body.results }
  } catch (e) {
    return { fel: e instanceof Error ? e.message : 'Nätverksfel mot mejltjänsten' }
  }
}

const SPARAD_UTAN_MEJL = 'Inbjudan är sparad men mejlet gick inte iväg: '

export async function skickaInbjudningar(
  rader: GranskadRad[],
  konsulentId: string,
  opt: SkickaAlternativ = {},
): Promise<Utfall[]> {
  const vila = opt.vila ?? sov
  const grupp = opt.gruppstorlek ?? GRUPPSTORLEK
  const paus = opt.pausMs ?? PAUS_MS
  const utfall = new Map<number, Utfall>()
  const satt = (rad: GranskadRad, utfallTyp: Utfall['utfall'], meddelande: string) =>
    utfall.set(rad.rad, { rad: rad.rad, epost: rad.epost, utfall: utfallTyp, meddelande })

  const att = rader.filter((r) => r.status === 'ok')
  let klara = 0
  const retry: Sparad[] = []

  for (let i = 0; i < att.length; i += grupp) {
    if (opt.signal?.aborted) {
      for (const r of att.slice(i)) satt(r, 'ej_skickad', 'Avbröts innan raden hann skickas.')
      break
    }
    const del = att.slice(i, i + grupp)

    // 1. Spara inbjudningarna (en rad var, så ett fel drabbar bara sin rad).
    const sparade: Sparad[] = []
    await Promise.all(del.map(async (rad) => {
      const metadata: Record<string, string> = {
        first_name: rad.fornamn,
        last_name: rad.efternamn,
        phone: '',
        message: '',
        source: 'deltagarlista',
      }
      if (rad.arendenummer) metadata.case_reference = rad.arendenummer
      if (rad.startdatum) metadata.start_date = rad.startdatum
      try {
        const { data, error } = await supabase
          .from('invitations')
          .insert({ email: rad.epost, role: 'USER', invited_by: konsulentId, consultant_id: konsulentId, metadata })
          .select('id')
          .single()
        if (error || !data) satt(rad, 'fel', `Kunde inte spara inbjudan: ${error?.message ?? 'inget svar'}`)
        else sparade.push({ rad, invitationId: (data as { id: string }).id })
      } catch (e) {
        satt(rad, 'fel', `Kunde inte spara inbjudan: ${e instanceof Error ? e.message : 'okänt fel'}`)
      }
    }))

    // 2. Mejla de sparade.
    if (sparade.length > 0) {
      const svar = await anropaMejl(sparade.map((s) => s.invitationId))
      for (const s of sparade) {
        if ('fel' in svar) { satt(s.rad, 'sparad_utan_mejl', SPARAD_UTAN_MEJL + svar.fel); continue }
        const mitt = svar.resultat.find((r) => r.invitationId === s.invitationId)
        if (mitt?.success) satt(s.rad, 'skickad', 'Inbjudan skickad.')
        else {
          const orsak = mitt?.error ?? 'inget svar för just den här raden'
          satt(s.rad, 'sparad_utan_mejl', SPARAD_UTAN_MEJL + orsak)
          if (/\b429\b/.test(orsak)) retry.push(s)
        }
      }
    }

    klara += del.length
    opt.onFramsteg?.(klara, att.length)
    if (i + grupp < att.length) await vila(paus)
  }

  // 3. Ett omförsök för rader som Resend stoppade på takten.
  for (const s of retry) {
    if (opt.signal?.aborted) break
    await vila(OMFORSOK_PAUS_MS)
    const svar = await anropaMejl([s.invitationId])
    const mitt = 'resultat' in svar ? svar.resultat.find((r) => r.invitationId === s.invitationId) : undefined
    if (mitt?.success) satt(s.rad, 'skickad', 'Inbjudan skickad (vid andra försöket).')
  }

  // Samma ordning som i filen; rader som inte var 'ok' hör inte hemma i utfallet.
  return att.map((r) => utfall.get(r.rad) ?? { rad: r.rad, epost: r.epost, utfall: 'ej_skickad' as const, meddelande: 'Ingen status registrerades.' })
}
