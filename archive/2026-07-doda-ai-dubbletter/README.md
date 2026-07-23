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

**Edge-funktionerna** `ai-cover-letter`, `ai-cv-writing`, `cv-analysis` har
nu NOLL klientanropare — deras öde avgörs med C4/G6-beslutet (aug 2026).
`ai-cover-letter`-prompts no-platshållare-regler portades till ai.js
`personligt-brev` innan raderingen.
