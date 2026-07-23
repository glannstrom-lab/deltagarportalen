# Arkiverat: journey/gamification-systemet (C9, 2026-07-23)

**Vad:** Ett helt, aldrig monterat subsystem (~4 300 rader) — upptäckt i
7-agentersgranskningen 2026-07-22 (`docs/portal-review-2026-07-22.md`),
samma mönster som widget-systemet i C1 (`archive/2026-07-widget-system/`).

**Innehåll:**
- `components/journey/` — 10 komponenter (JourneyMap, JourneyCelebration, …)
- `components/gamification/` — 8 komponenter (AchievementCelebration,
  BadgeSystem, CareerRoadmap, DailyStep/DailyTasks, UserLevel, WeeklySummary)
- `journeyService.ts` (1 114 rader), `gamificationService.ts` (767 rader)
- `useJourney.ts`, `useGamification.ts`

**Varför arkiverat i stället för behållet:**
- Ingen route/sida importerade något av det (verifierat med importspårning
  före flytt — enda referensen var hooks-barrelns exportrader).
- `AchievementCelebration` bröt dessutom Manifestet på tre punkter samtidigt
  (canvas-confetti, autoplay-bounce, 5 s auto-dismiss-modal = WCAG 2.2.1-brott)
  — den ska inte frestas in i produktion som den är.
- `journeyService.checkAndCompleteMilestones` hade tysta DB-fel (skrev XP
  och logg även när upsert misslyckats).

**Det levande systemet** är `hooks/useAchievementTracker.ts` +
`useAchievementChains.ts` (React Query, anropar samma RPC:er). Om
journey-/firande-UI ska återinföras (ROADMAP G9): bygg mot DESIGN.md v3.0
("lugn vän", inga confetti-explosioner/streaks) och återanvänd
achievement-tracker-datan — återaktivera inte det här arkivet rakt av.
