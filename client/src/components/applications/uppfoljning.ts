/**
 * AIX5: när erbjuds ett uppföljningsmejl? Rena regler, utan AI och utan UI —
 * så att det som utlöser erbjudandet går att testa och inte råkar bli en
 * påminnelse om fel sak.
 */

import type { Application } from '@/types/application.types'
import type { UppfoljningOrsak } from '@/services/ansokanAiApi'

/** Så många dagar utan svar innan en uppföljning erbjuds. */
export const DAGAR_UTAN_SVAR = 14

const DYGN_MS = 24 * 60 * 60 * 1000

/**
 * Hela kalenderdygn mellan ett datum och `nu`. null om datumet inte går att läsa.
 * Ett rent ÅÅÅÅ-MM-DD (som `applicationDate`) räknas i kalenderdygn efter lokal
 * tid — "sökte den 13:e" är 14 dagar den 27:e oavsett klockslag och tidszon.
 */
export function dagarSedan(datum: string | undefined | null, nu: Date = new Date()): number | null {
  if (!datum) return null
  const rent = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(datum)
  if (rent) {
    const fran = Date.UTC(Number(rent[1]), Number(rent[2]) - 1, Number(rent[3]))
    const till = Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate())
    return Math.max(0, Math.round((till - fran) / DYGN_MS))
  }
  const t = new Date(datum).getTime()
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((nu.getTime() - t) / DYGN_MS))
}

/**
 * Avslag: alltid. Tystnad: ansökan skickad (applied/screening) och
 * `applicationDate` minst 14 dagar gammalt. `applicationDate` är den enda
 * tillförlitliga tidpunkten — `createdAt` är när raden skapades, inte när
 * personen sökte, och ska inte gissas fram. Arkiverade ansökningar lämnas ifred.
 */
export function uppfoljningsOrsak(ansokan: Pick<Application, 'status' | 'applicationDate' | 'archivedAt'>, nu: Date = new Date()): UppfoljningOrsak | null {
  if (ansokan.archivedAt) return null
  if (ansokan.status === 'rejected') return 'avslag'
  if (ansokan.status === 'applied' || ansokan.status === 'screening') {
    const d = dagarSedan(ansokan.applicationDate, nu)
    if (d !== null && d >= DAGAR_UTAN_SVAR) return 'tystnad'
  }
  return null
}
