/**
 * Nästa steg som mål: VAR i portalen det finns (en rutt) och VILKEN knapp som
 * är steget (en fokusnyckel). (2026-10-19, beslut Mikael: "highlightas och
 * pulserar aktuellt nästa steg i alla vyer?" — svaret var nej, bara "!" i
 * staden. Nu: en prick i menyn där steget finns, och en puls på knappen.)
 *
 * Varje roll räknar redan fram sitt nästa steg på ett ställe:
 *   deltagare  pages/hubs/nastaStegRegler.ts   (valjNastaSteg)
 *   konsulent  pages/consultant/oversiktRegler.ts (valjNastaSteg i BradskandeIdag)
 *   företag    pages/foretag/OversiktFlik.tsx  (obesvarade förslag)
 * Den här filen räknar ingenting om igen — den översätter bara ett redan valt
 * steg till { vag, fokus } och avgör vilka menyval som leder dit.
 *
 * Knapparna bär `data-nasta-steg="<fokus>"`. NastaStegFokus (i Layout) lägger
 * klassen `nasta-steg-puls` på den knapp som matchar målet.
 */
import { avkodaSokvag } from '@/lib/sokvag'
import { getActiveHub } from '@/components/layout/navigation'
import type { StegId } from '@/pages/hubs/nastaStegRegler'

export interface NastaStegMal {
  /** Rutten där steget görs. */
  vag: string
  /** Fokusnyckeln på knappen som ÄR steget (`data-nasta-steg`), eller null. */
  fokus: string | null
}

/** Knappen som startar varje deltagarsteg. Saknas en nyckel blir det bara en prick i menyn. */
export const DELTAGAR_FOKUS: Partial<Record<StegId, string>> = {
  todaysPass: 'jag-ar-har',
  createCv: 'cv-start',
  updateCv: 'cv-start',
  firstJob: 'jobbsok-sok',
  firstLetter: 'brev-start',
}

export const KONSULENT_FOKUS = 'konsulent-nasta'
export const FORETAG_FOKUS = 'foretag-las-presentation'

export function deltagarMal(steg: { id: StegId; till: string } | null | undefined): NastaStegMal | null {
  if (!steg) return null
  return { vag: steg.till, fokus: DELTAGAR_FOKUS[steg.id] ?? null }
}

function utanFraga(vag: string): string {
  return avkodaSokvag(vag.split(/[?#]/)[0]).replace(/\/+$/, '') || '/'
}

/**
 * Leder menyvalet till målet? Exakt samma sida, eller en undersida till
 * menyvalet ("/foretag" leder till "/foretag/forslag"). Aldrig tvärtom:
 * målet "/consultant" ska bara ge prick på fliken Översikt ("/consultant"),
 * inte på "/consultant/participants".
 */
export function menyvalLederTill(menyVag: string, mal: NastaStegMal | null | undefined): boolean {
  if (!mal) return false
  const m = utanFraga(menyVag)
  const v = utanFraga(mal.vag)
  return v === m || v.startsWith(`${m}/`)
}

/** Står man på målets sida (samma rutt, frågesträng och avslutande snedstreck oräknade)? */
export function paMaletsSida(pathname: string, mal: NastaStegMal | null | undefined): boolean {
  return !!mal && utanFraga(pathname) === utanFraga(mal.vag)
}

/** Ligger målet i hubben (deltagarens fem platser)? Via hubbarnas medlemssidor, aldrig prefix. */
export function hubbInnehaller(hubbId: string, mal: NastaStegMal | null | undefined): boolean {
  if (!mal) return false
  return getActiveHub(utanFraga(mal.vag))?.id === hubbId
}
