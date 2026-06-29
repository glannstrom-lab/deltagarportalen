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

/**
 * Verktygs-ikoner (Ark 2–5) — mappade på feature-kortens `href` (path).
 * Används i `HubPage`s FeatureCard. Nycklarna speglar `navHubs[].items` paths.
 * Saknad path → lucide-fallback (FeatureCard renderar `feature.icon`).
 */
export const TOOL_ICON_SRC: Record<string, string> = {
  // Söka jobb (persika, Ark 2)
  '/job-search': '/illustrations/icon-jobbsok.webp',
  '/applications': '/illustrations/icon-ansokningar.webp',
  '/spontanansökan': '/illustrations/icon-spontan.webp',
  '/cv': '/illustrations/icon-cv.webp',
  '/cover-letter': '/illustrations/icon-brev.webp',
  '/interview-simulator': '/illustrations/icon-intervju.webp',
  '/salary': '/illustrations/icon-lon.webp',
  '/linkedin-optimizer': '/illustrations/icon-linkedin.webp',
  '/international': '/illustrations/icon-internationellt.webp',
  // Karriär (rosa, Ark 3)
  '/career': '/illustrations/icon-karriar.webp',
  '/interest-guide': '/illustrations/icon-intresseguide.webp',
  '/skills-gap-analysis': '/illustrations/icon-kompetensgap.webp',
  '/personal-brand': '/illustrations/icon-varumarke.webp',
  '/education': '/illustrations/icon-utbildning.webp',
  // Resurser (sky, Ark 4)
  '/knowledge-base': '/illustrations/icon-kunskapsbank.webp',
  '/resources': '/illustrations/icon-dokument.webp',
  '/print-resources': '/illustrations/icon-utskrift.webp',
  '/externa-resurser': '/illustrations/icon-externa.webp',
  '/ai-team': '/illustrations/icon-aiteam.webp',
  '/nätverk': '/illustrations/icon-natverk.webp',
  // Min vardag (lavendel, Ark 5)
  '/wellness': '/illustrations/icon-wellness.webp',
  '/diary': '/illustrations/icon-dagbok.webp',
  '/calendar': '/illustrations/icon-kalender.webp',
  '/exercises': '/illustrations/icon-ovningar.webp',
  '/my-consultant': '/illustrations/icon-konsulent.webp',
}
