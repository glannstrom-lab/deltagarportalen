# Arkiverat: widget-grid-systemet (2026-07-10, ROADMAP C1)

Hela `components/widgets/`-systemet (HubGrid, Widget, registry, JobsokLayoutContext,
~24 *Widget-komponenter, layoutpersistens) plus hooks `useWidgetLayout`/`useWidgetSize`
och samtliga tillhörande tester.

**Varför arkiverat:** Systemet byggdes i hub-nav v1.0 fas 2–4 (april 2026) men
monterades aldrig från någon sida i produktion — hubbarna renderar
`HubPage`-funktionskort byggda i `pages/hubs/*.tsx`. Nulägesanalysen 2026-07-10
(`docs/portal-review-2026-07.md` §3) mätte ~6 000 rader inkl. ~30 testfiler som
testade kod ingen användare såg.

**Vad som överlevde flytten (levande kod):**
- Typerna `JobsokSummary`, `KarriarSummary`, `MinVardagSummary`, `ResurserSummary`
  → flyttade till `client/src/hooks/hubSummaryTypes.ts`
- Summary-loaders (`use*HubSummary`) — används av hubbsidorna
- `components/dashboard/widgets/` — ANNAT system, levande via Dashboard/Översikt

**Vid återupplivning:** koden kompilerades senast mot React 19/TS 5.9 vid
commit-datumet ovan; DataContext-typerna måste avdupliceras mot hubSummaryTypes.ts.
