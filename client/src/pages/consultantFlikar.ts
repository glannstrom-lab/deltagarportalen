/**
 * Hjälpare för konsulentvyns flikar (KH7/KH8, rollspelet 2026-09-28).
 * Egen fil: Consultant.tsx får bara exportera komponenten (fast refresh).
 */
import { consultantTabs } from '@/data/consultantTabs'

/**
 * KH8: `/consultant?tab=settings` landade på Översikt. Fliknamnet är flikens
 * id i consultantTabs. Okänt namn, eller Översikt, ger null (ingen omdirigering).
 */
export function flikSokvag(tab: string | null): string | null {
  if (!tab) return null
  const traff = consultantTabs.find((f) => f.id === tab)
  return traff && traff.path !== '/consultant' ? traff.path : null
}

/**
 * KH7: bottennavet visar de fem första flikarna (konsulentNav.ts). Den övre
 * raden på mobil visar därför bara resten (Resurser, Inställningar) i stället
 * för samma fem en gång till. Skenan på desktop berörs inte (`max-lg`).
 */
export const MOBIL_FLIKRAD_DOLJ_BOTTENNAV =
  'max-lg:[&_nav[aria-label=Avsnitt]_li:nth-child(-n+5)]:hidden'
