/**
 * Hub-ikoner — custom sprite-sheet-ikoner (GRAFIK-PLAN.md §9, Fas 7).
 *
 * Mappar designdomän → webp i /public/illustrations. Används där hub-ikonen
 * renderas i stor storlek (≥40px): HubOverview-kort + PageHero hub-hjälte.
 *
 * INTE i 16px-naven (sidofält/bottennav) — där är lucide kvar (§9.1), eftersom
 * raster-ikoner inte kan recoloras på hover/aktiv och blir grötiga vid 16px.
 */
export const HUB_ICON_SRC: Record<string, string> = {
  action: '/illustrations/icon-hub-oversikt.webp',
  activity: '/illustrations/icon-hub-jobb.webp',
  coaching: '/illustrations/icon-hub-karriar.webp',
  info: '/illustrations/icon-hub-resurser.webp',
  wellbeing: '/illustrations/icon-hub-vardag.webp',
}
