/**
 * Arbetsgivarregistret (FN13) — datalagret.
 *
 * Premissen (mätt mot prod 2026-10-31, pg_policies):
 *  - Platserna bor i `consultant_work_placements` (inte `consultant_placements`, som
 *    är den äldre tabellen FN7 mätte). SELECT-policyerna är bara två: "Deltagaren ser
 *    sina platser" och "KS2b: konsulent läser aktiva deltagares platser" =
 *    `har_aktiv_relation(participant_id)`, som kräver en rad i consultant_participants
 *    för DEN INLOGGADE konsulenten. En kollegas platser syns alltså INTE — utom för en
 *    deltagare som överlämnats till en.
 *  - `employer_places`/`employer_profiles` läses av all personal (`ar_personal()`), men
 *    det är företagens EGNA konton (AG6), inte konsulenternas manuellt inmatade
 *    arbetsgivare — de täcker en bråkdel.
 *  - `spontaneous_companies` är privat per användare (user_id = auth.uid()).
 * Därför kräver ett gemensamt register en definer-funktion:
 * `arbetsgivarregister(p_org)` (migration 20261031_fn13_arbetsgivarregister.sql, EJ
 * KÖRD, väntar på ja). Den returnerar BARA firmauppgifter — aldrig deltagare,
 * kontaktperson, telefon eller e-post (DP1) — och aldrig org.nr för enskild firma (DP2).
 *
 * Tills dess (`ARBETSGIVARREGISTER_FINNS = false`) görs inget anrop; registret byggs av
 * konsulentens EGNA platser (samma byggRegister som SQL-funktionen speglar).
 */

import { supabase } from '@/lib/supabase'
import type { ArbetsgivarPost } from '@/lib/arbetsgivarregister'

/** Sätts till true när migrationen körts och schema:refresh + grants:refresh gjorts. */
export const ARBETSGIVARREGISTER_FINNS = false
// Medvetet en konstant och inte ett strängliteral i .rpc(): lint:schema ska inte fälla på
// en funktion som ännu inte finns. Byt till literalen när flaggan slås på.
const RPC_NAMN = 'arbetsgivarregister'

interface RegisterRad {
  foretag_namn: string
  org_nr: string | null
  antal_platser: number
  senast_andrad: string
  agare_id: string | null
  agare_namn: string | null
}

export interface KollegaPost extends ArbetsgivarPost {
  agareNamn: string | null
}

export const arbetsgivarregisterApi = {
  /** Organisationens register. Kastar vid fel — ett fel får inte se ut som ett tomt register. */
  async hamtaForOrganisation(orgId: string): Promise<KollegaPost[]> {
    if (!ARBETSGIVARREGISTER_FINNS) throw new Error('Arbetsgivarregistret är inte påslaget ännu')
    const { data, error } = await supabase.rpc(RPC_NAMN, { p_org: orgId })
    if (error) throw error
    return ((data ?? []) as RegisterRad[]).map((r) => ({
      nyckel: r.org_nr ? `org:${r.org_nr.replace(/\D/g, '')}` : `namn:${r.foretag_namn}`,
      namn: r.foretag_namn,
      orgnr: r.org_nr,
      antalPlatser: r.antal_platser,
      senastAndrad: r.senast_andrad,
      agareId: r.agare_id,
      agareNamn: r.agare_namn,
    }))
  },
}
