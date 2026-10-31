/**
 * Kontaktvägar till ett företag (KF14) — bara sådant som går att belägga.
 *
 * Mätt 2026-10-31: Bolagsverkets API (`supabase/functions/bolagsverket`) ger
 * namn, organisationsform, postadress, SNI-koder och verksamhetsbeskrivning.
 * Det ger INGEN webbadress, telefon eller e-post, och `ai-company-search`
 * returnerar inte heller någon webbplats. Det enda publicerade som finns är
 * alltså postadressen. Allt annat vore ett påhittat värde.
 *
 * Varje rad bär sin källa. En rad utan källa skapas aldrig.
 */
import type { SpontaneousCompany } from '@/services/supabaseApi'

export type KontaktvagTyp = 'postadress' | 'sokning'
/** `bolagsverket` = uppgift ur registret. `sokning` = en länk till en sökning, ingen uppgift. */
export type KontaktvagKalla = 'bolagsverket' | 'sokning'

export interface Kontaktvag {
  typ: KontaktvagTyp
  /** Postadressen som text, eller sökadressen (https). */
  varde: string
  kalla: KontaktvagKalla
}

type Foretag = Pick<SpontaneousCompany, 'company_name' | 'company_data'>

export function sokLank(namn: string, ort?: string): string {
  const q = [namn, ort, 'kontakt karriär'].filter(Boolean).join(' ')
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export function byggKontaktvagar(foretag: Foretag): Kontaktvag[] {
  const vagar: Kontaktvag[] = []
  const namn = (foretag.company_name || '').trim()
  const adress = foretag.company_data?.address
  const gata = adress?.street?.trim()
  const ort = adress?.city?.trim()
  const postnr = adress?.postalCode?.trim()

  if (gata || ort) {
    const postort = [postnr, ort].filter(Boolean).join(' ')
    const varde = [gata, postort].filter(Boolean).join(', ')
    vagar.push({ typ: 'postadress', varde, kalla: 'bolagsverket' })
  }
  if (namn) {
    vagar.push({ typ: 'sokning', varde: sokLank(namn, ort), kalla: 'sokning' })
  }
  return vagar
}

/** Raden som läggs i anteckningarna när deltagaren väljer postadressen. */
export function anteckningsRad(etikett: string, kalla: string, varde: string): string {
  return `${etikett} (${kalla}): ${varde}`
}

/** Lägger till en rad i anteckningarna, utan att dubblera. */
export function laggTillIAnteckningar(nuvarande: string | undefined | null, rad: string): string {
  const befintlig = (nuvarande || '').trim()
  if (befintlig.includes(rad)) return befintlig
  return befintlig ? `${befintlig}\n${rad}` : rad
}
