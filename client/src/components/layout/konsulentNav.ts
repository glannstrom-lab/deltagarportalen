/**
 * Konsulentvyns mobila navigering (RK17/RR12, rollspelet 2026-09-27).
 *
 * Under /consultant fick konsulenten deltagarens bottennav (Söka jobb,
 * Karriär, Din vardag) och deltagarens undersidesrad (Börja här, Sök jobb,
 * CV …) — länkar till en portal hon inte arbetar i. Samma sidor finns redan
 * som flikar i konsulentvyn (`data/consultantTabs.ts`); bottennavet visar de
 * fem hon använder mest, resten nås i flikraden.
 *
 * Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */
import { consultantTabs } from '@/data/consultantTabs'

export function arKonsulentvy(pathname: string): boolean {
  return pathname === '/consultant' || pathname.startsWith('/consultant/')
}

const BOTTEN_IDS = ['overview', 'participants', 'placeringar', 'analytics', 'communication'] as const

export const konsulentBottenNav = BOTTEN_IDS
  .map((id) => consultantTabs.find((t) => t.id === id))
  .filter((t): t is NonNullable<typeof t> => t !== undefined)

/** Aktiv flik: Översikt bara exakt, övriga på prefix (en deltagarsida hör till Deltagare). */
export function aktivKonsulentFlik(pathname: string): string | null {
  if (pathname === '/consultant' || pathname === '/consultant/') return 'overview'
  const traff = konsulentBottenNav.find((t) => t.path !== '/consultant' && (pathname === t.path || pathname.startsWith(`${t.path}/`)))
  return traff?.id ?? null
}
