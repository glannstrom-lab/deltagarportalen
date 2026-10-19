/**
 * "Visa som" (2026-09-27) — superadmin ser portalen som ett demo- eller
 * testkonto. Vilka konton som är tillåtna avgör edge-funktionen
 * `superadmin-visa-som`; klienten visar bara det servern släpper igenom.
 *
 * Inloggningen sker med en engångs-token_hash via supabase.auth.verifyOtp på
 * sidan /visa-som. Markeringen i sessionStorage är per flik: en privat flik
 * som visar demokontot påverkar inte superadmin-fliken.
 */

import { supabase } from '@/lib/supabase'

export type VisaSomKonto = {
  id: string
  email: string
  namn: string | null
  roll: string | null
  organisation: string | null
  orgTyp: string | null
  orgRoll: string | null
  grupp: 'demo' | 'test' | 'ovrigt'
}

export type VisaSomLank = { tokenHash: string; email: string; landning: string }

export const VISA_SOM_NYCKEL = 'jobin_visa_som'

async function anropa<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Inte inloggad')
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-visa-som`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Fel ${res.status}`)
  return json as T
}

export const visaSomApi = {
  async lista(): Promise<VisaSomKonto[]> {
    const { konton } = await anropa<{ konton: VisaSomKonto[] }>({ action: 'lista' })
    return konton
  },
  oppna(userId: string): Promise<VisaSomLank> {
    return anropa<VisaSomLank>({ action: 'oppna', userId })
  },
}

/** Bara interna sökvägar — aldrig en extern adress eller //värd. */
export function sakerLandning(till: string | null): string {
  if (!till || !till.startsWith('/') || till.startsWith('//')) return '/'
  return till
}

export function beskrivRoll(k: VisaSomKonto): string {
  if (k.orgRoll === 'arbetsgivare') return 'Företag (kontaktperson)'
  if (k.orgRoll === 'chef') return 'Chef'
  if (k.orgRoll === 'admin') return 'Administratör i organisationen'
  if (k.roll === 'CONSULTANT') return 'Konsulent'
  if (k.roll === 'ADMIN' || k.roll === 'SUPERADMIN') return 'Admin'
  return 'Deltagare'
}

/**
 * Demoläge (2026-10-19, Mikael: "jag vill nå allt från mitt eget konto").
 *
 * Superadmin byter mellan demots roller i SAMMA fönster och kommer tillbaka
 * till sitt eget konto med ett klick — inga länkar, inga privata fönster.
 * Superadmins refresh-token sparas i fliken (sessionStorage) när demot startar;
 * varje byte tar först tillbaka den sessionen, eftersom bara superadmin får
 * anropa superadmin-visa-som, och loggar sedan in som nästa roll. Servern
 * avgör fortfarande vilka konton som är tillåtna och loggar varje öppning.
 */
export const DEMO_URSPRUNG = 'jobin_demo_ursprung'
export const DEMO_KONTON = 'jobin_demo_konton'

/** Demots fyra roller, i den ordning de visas. Kontona måste finnas i servern lista. */
export const DEMO_ROLLER = [
  { email: 'demo@jobin.se', etikett: 'Kommunchef' },
  { email: 'anna.exempel@example.com', etikett: 'Anna (deltagare)' },
  { email: 'foretag.demo@example.com', etikett: 'Nordfrakt (företag)' },
  { email: 'demo-leverantor@jobin.se', etikett: 'Leverantör (R&M)' },
] as const

export type DemoRoll = { id: string; email: string; etikett: string }
type Ursprung = { refreshToken: string; email: string }

function lasJson<T>(nyckel: string): T | null {
  try {
    const v = sessionStorage.getItem(nyckel)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function skrivJson(nyckel: string, varde: unknown) {
  sessionStorage.setItem(nyckel, JSON.stringify(varde))
}

/** Demots roller ur serverns lista, i DEMO_ROLLER-ordning. Saknade hoppas över. */
export function demoRoller(konton: VisaSomKonto[]): DemoRoll[] {
  return DEMO_ROLLER.flatMap((r) => {
    const k = konton.find((x) => x.email.toLowerCase() === r.email)
    return k ? [{ id: k.id, email: k.email, etikett: r.etikett }] : []
  })
}

export function lasDemoLage(): { ursprungEmail: string; roller: DemoRoll[] } | null {
  const ursprung = lasJson<Ursprung>(DEMO_URSPRUNG)
  if (!ursprung) return null
  return { ursprungEmail: ursprung.email, roller: lasJson<DemoRoll[]>(DEMO_KONTON) ?? [] }
}

async function loggaInSom(userId: string) {
  const lank = await visaSomApi.oppna(userId)
  const { error } = await supabase.auth.verifyOtp({ token_hash: lank.tokenHash, type: 'magiclink' })
  if (error) throw new Error('Kunde inte logga in som demokontot')
  sessionStorage.setItem(VISA_SOM_NYCKEL, lank.email)
  // Full omladdning, som på /visa-som: authStore läser annars inte in den nya sessionen.
  window.location.replace(`${window.location.pathname}#${sakerLandning(lank.landning)}`)
  window.location.reload()
}

/** Tar tillbaka superadmins egen session och sparar den nya refresh-token (de roteras). */
async function aterstallUrsprung(): Promise<void> {
  const ursprung = lasJson<Ursprung>(DEMO_URSPRUNG)
  if (!ursprung) throw new Error('Demoläget är inte startat i den här fliken')
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: ursprung.refreshToken })
  if (error || !data.session) {
    throw new Error('Din egen inloggning har gått ut. Logga ut och logga in igen.')
  }
  skrivJson(DEMO_URSPRUNG, { ...ursprung, refreshToken: data.session.refresh_token })
}

export const demoLage = {
  /** Från superadmins eget konto: spara sessionen och byt till rollen. */
  async starta(roll: DemoRoll, roller: DemoRoll[]) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user.email) throw new Error('Inte inloggad')
    skrivJson(DEMO_URSPRUNG, { refreshToken: session.refresh_token, email: session.user.email })
    skrivJson(DEMO_KONTON, roller)
    await loggaInSom(roll.id)
  },
  /** Inne i demot: byt till en annan roll. */
  async byt(roll: DemoRoll) {
    await aterstallUrsprung()
    await loggaInSom(roll.id)
  },
  /** Tillbaka till superadmins eget konto. */
  async avsluta() {
    await aterstallUrsprung()
    sessionStorage.removeItem(DEMO_URSPRUNG)
    sessionStorage.removeItem(DEMO_KONTON)
    sessionStorage.removeItem(VISA_SOM_NYCKEL)
    window.location.replace(`${window.location.pathname}#/admin`)
    window.location.reload()
  },
}

/** Adressen som loggar in som kontot — öppnas i en privat flik, eller i samma. */
export function visaSomUrl(lank: VisaSomLank): string {
  const q = new URLSearchParams({ t: lank.tokenHash, e: lank.email, till: lank.landning })
  return `${window.location.origin}/#/visa-som?${q.toString()}`
}
