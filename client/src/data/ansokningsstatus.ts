/**
 * Ansökningsstatus — ikoner och normalisering, delat mellan sidorna.
 *
 * ## Varför den här filen finns
 *
 * `saved_jobs.status` bär hela ansökningspipelinen. Prods check constraint
 * tillåter **elva** värden:
 *
 *     INTERESTED · SAVED · APPLIED · SCREENING · PHONE · ASSESSMENT
 *     INTERVIEW · OFFER · ACCEPTED · REJECTED · WITHDRAWN
 *
 * `/applications` läste dem ur `APPLICATION_STATUS_CONFIG`. `/resources` hade
 * i stället en egen literal med **fem** — och `INTERESTED`, den enda status
 * utöver `SAVED` som sidan faktiskt renderar, saknades i den. Följden mättes i
 * prod 2026-08-22: tre rader fick en tom bricka med `undefined undefined` i
 * klassattributet, och ikonen föll tillbaka på `Bookmark`, alltså exakt samma
 * utseende som "Sparad". Fyra av de fem som fanns kunde å andra sidan aldrig
 * renderas, eftersom listan filtrerar bort dem.
 *
 * Två kopior av samma uppräkning glider isär. Den här modulen håller den enda
 * biten som `application.types.ts` inte kan hålla — ikonkomponenterna, som är
 * React och inte hör hemma i en typfil.
 *
 * ## Versaler
 *
 * Databasen lagrar VERSALER, `ApplicationStatus` är gemener. `statusnyckel()`
 * gör översättningen och returnerar `null` för ett värde som inte finns i
 * konstrainten — anroparen måste då visa något annat än en tom bricka.
 */

import {
  Sparkles,
  Bookmark,
  Send,
  Eye,
  Phone,
  Users,
  FileCheck,
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
} from '@/components/ui/icons'
import type { ApplicationStatus } from '@/types/application.types'
import { APPLICATION_STATUS_CONFIG } from '@/types/application.types'

/**
 * Ikon per status. Namnen ligger som strängar i `APPLICATION_STATUS_CONFIG`
 * (`icon: 'Sparkles'`) eftersom typfilen inte får importera komponenter —
 * uppslaget måste alltså göras någonstans, och det görs här.
 */
export const STATUS_IKONER: Record<ApplicationStatus, React.ElementType> = {
  interested: Sparkles,
  saved: Bookmark,
  applied: Send,
  screening: Eye,
  phone: Phone,
  interview: Users,
  assessment: FileCheck,
  offer: Trophy,
  accepted: CheckCircle,
  rejected: XCircle,
  withdrawn: AlertCircle,
}

/**
 * VERSALT databasvärde → `ApplicationStatus`, eller `null` om värdet inte är
 * en känd status. Returnera aldrig ett påhittat standardvärde här: en rad med
 * okänd status ska synas som okänd, inte som "sparad".
 */
export function statusnyckel(ratt: string | null | undefined): ApplicationStatus | null {
  if (!ratt) return null
  const nyckel = ratt.toLowerCase()
  return nyckel in APPLICATION_STATUS_CONFIG ? (nyckel as ApplicationStatus) : null
}

/**
 * De statusar som betyder "jag har inte sökt det här jobbet än" — alltså det
 * som ärligt kan kallas *sparat*. Samma definition som H4 (`MyConsultant`) och
 * B32 använder.
 */
export const SPARADE_STATUSAR: ApplicationStatus[] = ['saved', 'interested']

/** Är jobbet fortfarande bara sparat/intressant, alltså inte sökt? */
export function arSparat(ratt: string | null | undefined): boolean {
  const nyckel = statusnyckel(ratt)
  return nyckel !== null && SPARADE_STATUSAR.includes(nyckel)
}
