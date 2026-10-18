/**
 * Tvåstegsinloggning (TOTP) via Supabase Auth — KSL25 / spår KF fas 1.
 *
 * Supabase sköter hemligheten och verifieringen; portalen lagrar ingenting
 * själv. Efter en lyckad kod höjs sessionen från `aal1` till `aal2`, och det är
 * den nivån `MfaGrind` och konsulentvyns krav läser.
 *
 * Felen kastas vidare med Supabase-meddelandet kvar — en kod som inte stämmer
 * och ett nätfel ska inte se likadana ut för den som skriver in koden.
 */
import { supabase } from '@/lib/supabase'

export type Assurans = { nuvarande: 'aal1' | 'aal2' | null; nasta: 'aal1' | 'aal2' | null }

export interface TotpFaktor {
  id: string
  namn: string | null
  verifierad: boolean
  skapad: string
}

export interface NyFaktor {
  id: string
  /** SVG som data-URI, direkt i <img src>. */
  qrKod: string
  /** Hemligheten i klartext, för den som inte kan skanna. */
  hemlighet: string
}

export class MfaFel extends Error {
  kod: 'fel-kod' | 'annat'
  constructor(kod: 'fel-kod' | 'annat', message: string) {
    super(message)
    this.name = 'MfaFel'
    this.kod = kod
  }
}

function tolkaFel(error: { message?: string; code?: string } | null): never {
  const msg = error?.message ?? 'okänt fel'
  // Supabase svarar "Invalid TOTP code entered" / code mfa_verification_failed.
  const felKod = error?.code === 'mfa_verification_failed' || /invalid totp|verification failed/i.test(msg)
  throw new MfaFel(felKod ? 'fel-kod' : 'annat', msg)
}

export const mfaApi = {
  async assurans(): Promise<Assurans> {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (error) tolkaFel(error)
    return { nuvarande: data.currentLevel ?? null, nasta: data.nextLevel ?? null }
  },

  async faktorer(): Promise<TotpFaktor[]> {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) tolkaFel(error)
    return (data.all ?? [])
      .filter((f) => f.factor_type === 'totp')
      .map((f) => ({ id: f.id, namn: f.friendly_name ?? null, verifierad: f.status === 'verified', skapad: f.created_at }))
  },

  /**
   * Påbörjar en ny faktor. En overifierad faktor från ett avbrutet försök tas
   * bort först — Supabase vägrar annars en andra med samma namn.
   */
  async paborja(): Promise<NyFaktor> {
    const befintliga = await mfaApi.faktorer()
    for (const f of befintliga.filter((x) => !x.verifierad)) {
      await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Jobin' })
    if (error) tolkaFel(error)
    return { id: data.id, qrKod: data.totp.qr_code, hemlighet: data.totp.secret }
  },

  /** Verifierar en kod mot en faktor — både vid påslag och vid inloggning. */
  async verifiera(faktorId: string, kod: string): Promise<void> {
    const ren = kod.replace(/\s+/g, '')
    if (!/^\d{6}$/.test(ren)) throw new MfaFel('fel-kod', 'Koden ska vara sex siffror')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: faktorId, code: ren })
    if (error) tolkaFel(error)
  },

  /** Kräver aal2 — Supabase nekar borttagning från en session som inte angett koden. */
  async tabort(faktorId: string): Promise<void> {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: faktorId })
    if (error) tolkaFel(error)
  },
}

/** Roller som måste ha tvåstegsinloggning för att nå konsulentvyn (beslut Mikael 2026-10-18). */
export const ROLLER_MED_KRAV = ['chef', 'admin'] as const

export function kraverTvaSteg(roller: readonly string[]): boolean {
  return roller.some((r) => (ROLLER_MED_KRAV as readonly string[]).includes(r))
}
