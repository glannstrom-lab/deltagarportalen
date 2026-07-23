# Arkiverat: widget-grid-systemet gen 2 + Dashboard-sidan (C10, 2026-07-23)

**Vad:** Andra generationen av ett dashboard-widgetsystem — 19 widgets
(`components/widgets/`-mappen här), `DashboardGrid`, `DashboardWidget`,
`WidgetFilter`/`WidgetSizeSelector`/`CompactWidgetFilter`/`MobileWidgetFilter`
samt `pages/Dashboard.tsx` (+ dess test) som var enda konsumenten.

**Varför:** `Dashboard.tsx` förlorade sin route i C3 (2026-07-10) när
`VITE_HUB_NAV_ENABLED`-flaggan togs bort — hubbarna (`pages/hubs/`) är
sedan dess enda dashboard. Hela widget-svansen hängde därmed död:
verifierat 2026-07-23 att INGEN fil utanför klustret importerade vare
sig sidan, barrelen eller någon grid-/widgetkomponent (träffar på
`DashboardWidgetData`/`DashboardGridSkeleton` är bara namnlikheter).

Första generationens widgetsystem arkiverades i C1 →
`archive/2026-07-widget-system/`.

**OBS före ev. återanvändning:** flera widgets använder legacy-hooken
`useDashboardData` (15 ocachade anrop — deprecated, se E9) och har inte
granskats mot DESIGN.md v3.0. Hubb-ändringar görs i `pages/hubs/*` via
`HubPage`-funktionskort, inte här (se CLAUDE.md-lärdomen 2026-07-10).
