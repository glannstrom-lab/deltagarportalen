/**
 * deltagarStatus — deltagarens läge hos konsulenten (`profiles.status`).
 *
 * Beslut Mikael 2026-10-11: läget "Uppföljning" (FOLLOW_UP) för en Rusta och
 * matcha-deltagare som fått jobb eller börjat studera. När en placering
 * registreras FÖRESLÅS läget — konsulenten bekräftar (PlacementDialog). En
 * deltagare i uppföljning:
 *   · räknas inte mot taket 50 per handledare (FFU §4.5.2, caseloadKapacitet.ts),
 *   · står som egen grupp sist i deltagarlistan och har ett eget filter,
 *   · behåller påminnelserna om uppföljning efter 3 och 6 månader — de hänger på
 *     placeringen (consultant_placements.followup_3m/6m), inte på läget.
 *
 * Premissen (mätt i prod 2026-10-11): `profiles.status` är text utan
 * check-villkor (127 rader, alla ACTIVE), så värdet kräver ingen migration.
 * Konsulentens UPDATE släpps igenom av policyn "Konsulent kan ändra status på sin
 * tilldelade deltagare" (bara status/updated_at får ändras). Taket räknas ur vyn
 * organization_caseload; kolumnen antal_uppfoljning kommer med
 * 20261011b_uppfoljning_caseload.sql — innan dess räknas alla mot taket.
 *
 * Konsulentvyn är svensk med literaler. Ren logik.
 */

export type DeltagarStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'FOLLOW_UP'

/** Ordningen i väljare och filter. */
export const DELTAGAR_STATUSAR: readonly DeltagarStatus[] = ['ACTIVE', 'ON_HOLD', 'FOLLOW_UP', 'INACTIVE', 'COMPLETED']

export const STATUS_ORD: Record<DeltagarStatus, string> = {
  ACTIVE: 'Aktiv',
  ON_HOLD: 'Pausad',
  FOLLOW_UP: 'I uppföljning',
  INACTIVE: 'Inaktiv',
  COMPLETED: 'Avslutad',
}

export const STATUS_PLURAL: Record<DeltagarStatus, string> = {
  ACTIVE: 'Aktiva',
  ON_HOLD: 'Pausade',
  FOLLOW_UP: 'I uppföljning',
  INACTIVE: 'Inaktiva',
  COMPLETED: 'Avslutade',
}

export function arDeltagarStatus(s: unknown): s is DeltagarStatus {
  return typeof s === 'string' && (DELTAGAR_STATUSAR as readonly string[]).includes(s)
}

/** Räknas deltagaren mot handledarens tak? Allt utom uppföljning. */
export function raknasMotTaket(status: string | null | undefined): boolean {
  return status !== 'FOLLOW_UP'
}

/**
 * Ska dialogen föreslå Uppföljning efter en registrerad placering? Bara där
 * Rusta och matcha-avtalet gäller (visaAvtalskrav — leverantör, blandat eller
 * ingen organisation) och bara för den som inte redan står i uppföljning eller
 * är avslutad.
 */
export function foreslaUppfoljning(visaAvtalskrav: boolean | null | undefined, status: string | null | undefined): boolean {
  if (!visaAvtalskrav) return false
  return status !== 'FOLLOW_UP' && status !== 'COMPLETED'
}

/** Antal som räknas mot taket, ur caseload-vyns två kolumner (den andra saknas före migrationen). */
export function antalMotTaket(rad: { antal_deltagare: number; antal_uppfoljning?: number | null }): number {
  return Math.max(0, rad.antal_deltagare - (rad.antal_uppfoljning ?? 0))
}
