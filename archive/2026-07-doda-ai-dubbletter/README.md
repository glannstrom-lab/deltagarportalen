# Arkiverat: döda AI-dubbletter (C11, 2026-07-23)

Från 7-agentersgranskningen 2026-07-22 (`docs/portal-review-2026-07-22.md` §6).

**Innehåll:**
- `components-career/` — CareerCoach, SalaryInsights, SkillsDevelopment,
  NetworkingGuide (+CareerPath, occupations.ts, index.ts). Orutade, och de
  fyra första anropade `callAI('career'/'salary'/'skills'/'networking')` —
  funktionsnamn som inte finns i ai.js (hade gett 400). De levande
  varianterna är `components/ai/CareerCoach.tsx` + `SalaryInsightsPanel`
  (via aiCareerAssistantApi) och `pages/career/*`.
- `AIWritingAssistantSecure.tsx` — orenderad; var enda klienten mot
  `ai-cv-writing`-edgen. Levande varianten är `AIWritingAssistant.tsx`
  (ai.js `cv-writing`).

**Raderat samtidigt (ej arkiverat, fanns i git-historiken):**
- `hooks/useSupabase.ts`: useCoverLetters, useAIGeneration (enda vägen till
  GPT-4-fakturerande `cv-analysis`-edgen), useConsultantParticipants —
  alla callerlösa. useAuth/useCV behållna (levande).
- `lib/supabase.ts`: generateCoverLetterWithAI, analyzeCVWithAI.
- `coverLetterApi.generate()`.

---

## Tillägg 2026-07-27 (G10) — och en rättelse av texten ovan

`AICareerChatbot.tsx` och `CareerCoach.tsx` arkiverade.

**Rättelse:** stycket ovan påstår att `components/ai/CareerCoach.tsx` var "den
levande varianten". Det stämde inte vid granskningen 2026-07-27 — importspårning
visade **noll konsumenter** för både `CareerCoach` och `AICareerChatbot`. Ingen
av dem låg i `components/ai/index.ts`.

**Varför de togs bort i stället för att kopplas in (G10-beslutet):**
Roadmapens G10 utgick från att `AICareerChatbot` var en levande yta som anropade
`chatbot` utan kontext. Den var i stället en orutad dubblett av AI-team-chatten,
som redan har full kontext via `useAITeamContext`. Att koppla in kontext i en
komponent som ingen ser hade varit arbete utan effekt. Båda hade dessutom
hårdkodad svenska (ingen i18n) och saknade Art 50-märkning — de kunde inte
monterats som de var.

Kvar av G10 efter detta: RIASEC-kontexten är inkopplad i `kompetensgap` och
`karriarplan` (se `formatRiasecForPrompt` i `hooks/useInterestProfile.ts`).
Energidelen av G10 utgår — `mentalt-stod` och `jobbtips` raderades i C12.

---

**Edge-funktionerna** `ai-cover-letter`, `ai-cv-writing`, `cv-analysis` har
nu NOLL klientanropare — deras öde avgörs med C4/G6-beslutet (aug 2026).
`ai-cover-letter`-prompts no-platshållare-regler portades till ai.js
`personligt-brev` innan raderingen.
