/**
 * Samtyckesregistret — en väg in, och den loggar (MV1, 2026-08-21)
 * ================================================================
 *
 * VARFÖR FILEN FINNS
 * ------------------
 * `grant_consent()` och `withdraw_consent()` skapades 2026-03-28
 * (`20260328100000_health_data_consent.sql:34-91`). De gör två saker i en
 * transaktion: sätter tidsstämpeln på `profiles` OCH skriver en rad i
 * `consent_history`. Den andra halvan är hela poängen — GDPR art. 7.1 lägger
 * bevisbördan på den personuppgiftsansvarige: *du* ska kunna visa att
 * samtycke gavs.
 *
 * Funktionerna hade **noll anropare** fram till i dag. Mätt 2026-08-21:
 * `grep -rn "grant_consent\|withdraw_consent" client/src supabase/functions`
 * gav inga träffar, och `consent_history` hade ingen skrivare någonstans i
 * kodbasen. Alla fyra skrivvägar gick i stället rakt på profilraden via
 * `userApi.updateProfile()`:
 *
 *   Settings.tsx:207          alla fyra typer, både ge och återkalla
 *   AiConsentGate.tsx:49      ai_processing
 *   HealthConsentGate.tsx:48  health_data
 *   WellnessConsentGate:48    wellness_data
 *
 * Tidsstämpeln blev alltså rätt, och registret förblev tomt. Utåt ser det
 * likadant ut — vilket är precis varför det kunde ligga i fem månader.
 * Det är rotorsaken till A30 ("samtyckesregistret har noll rader"): inte en
 * glömd körning, utan en väg som aldrig kopplades in.
 *
 * REGELN HÄRIFRÅN
 * ---------------
 * Skriv aldrig en `*_consent_at`-kolumn direkt. Gå genom den här filen.
 * En direkt `updateProfile({ wellness_consent_at: ... })` sätter tiden men
 * lämnar inget spår, och då är vi tillbaka i utgångsläget.
 * Vaktat av `src/test/consent-loggas.test.ts`.
 *
 * FAIL CLOSED, OCH VARFÖR
 * -----------------------
 * `beviljaSamtycke` KASTAR vid fel i stället för att returnera `false`.
 * Anroparen måste hantera det, för alternativet är att ett samtycke ser givet
 * ut i UI:t utan att ha registrerats — samma familj som lärdomen från
 * 2026-08-20, där ett misslyckat sparande såg ut som ett lyckat eftersom
 * returvärdet kastades bort. Kostnaden för att gissa fel här är en behandling
 * av hälsodata utan dokumenterad grund, inte en kostnad i kronor.
 * Jfr `CLAUDE.md`, "Fail closed vs. fail open — välj efter vad felet kostar".
 */

import { supabase } from '@/lib/supabase'

/**
 * Samtyckestyperna som `grant_consent`/`withdraw_consent` accepterar.
 *
 * Strängarna måste matcha CASE-satsen i migrationen exakt — en okänd typ ger
 * `RAISE EXCEPTION 'Invalid consent type'`, inte ett tyst nej. Samma lista
 * bär `consent_history_consent_type_check`, så en ny typ kräver en migration
 * i båda ändar.
 */
export type SamtyckesTyp =
  | 'terms'
  | 'privacy'
  | 'ai_processing'
  | 'marketing'
  | 'health_data'
  | 'wellness_data'

/** Profilkolumnen varje typ styr. Speglar CASE-satsen i migrationen. */
export const SAMTYCKESKOLUMN: Record<SamtyckesTyp, string> = {
  terms: 'terms_accepted_at',
  privacy: 'privacy_accepted_at',
  ai_processing: 'ai_consent_at',
  marketing: 'marketing_consent_at',
  health_data: 'health_consent_at',
  wellness_data: 'wellness_consent_at',
}

/** Art. 9-typerna. Återkallas ett av dem ska delningen med konsulenten också stoppas. */
export const ART9_TYPER: readonly SamtyckesTyp[] = ['health_data', 'wellness_data'] as const

export class SamtyckesFel extends Error {
  // Fälten deklareras och tilldelas var för sig: tsconfig har
  // `erasableSyntaxOnly`, som inte tillåter parameteregenskaper
  // (`constructor(readonly typ: ...)`) eftersom de kräver kodgenerering.
  readonly typ: SamtyckesTyp
  readonly orsak?: unknown

  constructor(message: string, typ: SamtyckesTyp, orsak?: unknown) {
    super(message)
    this.name = 'SamtyckesFel'
    this.typ = typ
    this.orsak = orsak
  }
}

/**
 * Ger samtycke: sätter tidsstämpeln OCH skriver `granted` i registret.
 *
 * RPC:n läser `auth.uid()` själv och tar inget användar-id som argument — det
 * är avsiktligt (samma mönster som `get_my_consultant`, A7/UX12). En klient
 * kan alltså inte skriva ett samtycke i någon annans namn.
 *
 * @throws {SamtyckesFel} om skrivningen inte gick igenom.
 */
export async function beviljaSamtycke(typ: SamtyckesTyp): Promise<void> {
  const { error } = await supabase.rpc('grant_consent', { p_consent_type: typ })
  if (error) {
    throw new SamtyckesFel(
      `Kunde inte registrera samtycke (${typ}): ${error.message}`,
      typ,
      error,
    )
  }
}

/**
 * Återkallar samtycke: nollar tidsstämpeln OCH skriver `withdrawn` i registret.
 *
 * Att återkallandet loggas är minst lika viktigt som att beviljandet gör det —
 * art. 7.3 ger rätten att när som helst ta tillbaka sitt samtycke, och utan
 * en rad i registret går det inte att visa *när* behandlingen skulle ha
 * upphört.
 *
 * @throws {SamtyckesFel} om skrivningen inte gick igenom.
 */
export async function aterkallaSamtycke(typ: SamtyckesTyp): Promise<void> {
  // Parameternamnet skiljer sig mellan funktionerna: `grant_consent` tar
  // `p_consent_type`, `withdraw_consent` tar `consent_type`. Det är så de är
  // definierade i migrationen — rätta inte "inkonsekvensen" här, den ligger i
  // databasen och en omdöpning där kräver en egen migration.
  const { error } = await supabase.rpc('withdraw_consent', { consent_type: typ })
  if (error) {
    throw new SamtyckesFel(
      `Kunde inte registrera återkallat samtycke (${typ}): ${error.message}`,
      typ,
      error,
    )
  }
}

/** Ger eller återkallar beroende på nuvarande värde. Returnerar det nya värdet. */
export async function vaxlaSamtycke(
  typ: SamtyckesTyp,
  nuvarandeVarde: string | null,
): Promise<string | null> {
  if (nuvarandeVarde) {
    await aterkallaSamtycke(typ)
    return null
  }
  await beviljaSamtycke(typ)
  // RPC:n sätter `NOW()` på servern. Klientens klocka kan gå fel, men värdet
  // används bara för att rendera "gav samtycke den …" tills nästa hämtning av
  // profilen — registret och profilraden bär serverns tid.
  return new Date().toISOString()
}

export const consentApi = {
  beviljaSamtycke,
  aterkallaSamtycke,
  vaxlaSamtycke,
  SAMTYCKESKOLUMN,
  ART9_TYPER,
}

export default consentApi
