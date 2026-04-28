# Deltagarportalen

## What This Is

Deltagarportalen är en svensk jobbsökarportal som hjälper arbetssökande att hitta jobb genom AI-drivna verktyg. Portalen används av deltagare (arbetssökande, ofta långtidsarbetslösa med fysiska/psykiska utmaningar) och arbetskonsulenter som coachar dem.

## Core Value

Hjälp utsatta arbetssökande att komma framåt — med empati, tillgänglighet och AI-stöd som faktiskt sänker tröskeln, inte höjer den.

## Requirements

### Validated

<!-- Funktionalitet som finns i produktion och används. Detta är pre-GSD-arbete som vi nu konsoliderar i milstolpestrukturen. -->

- ✓ **CV-byggare** — skapa, redigera och exportera CV (PDF) — pre-GSD
- ✓ **Personligt brev** — AI-genererade brev med visuella mallar och vektor-PDF — pre-GSD
- ✓ **Intervjusimulator** — AI-driven övning med tal-till-text — pre-GSD
- ✓ **Kompetensanalys** — gap mot drömjobb — pre-GSD
- ✓ **Intresseguide** — yrkesförslag baserat på intressen — pre-GSD
- ✓ **LinkedIn-optimerare** — AI-förslag på profilförbättringar — pre-GSD
- ✓ **Jobbsökning** — Platsbanken-integration, sparade sökningar, matchning — pre-GSD
- ✓ **Mina ansökningar** — spåra ansökningsstatus — pre-GSD
- ✓ **Spontanansökan** — företagsmål och kontakt-pipeline — pre-GSD
- ✓ **Dagbok, Wellness, Kalender** — reflektion och planering — pre-GSD
- ✓ **Konsultvy** — handledare hanterar deltagare — pre-GSD
- ✓ **AI-team, Kunskapsbank, Externa resurser** — verktygslåda — pre-GSD
- ✓ **Designsystem v2** — 5 platta pasteller + uniform neutral header — 2026-04-29 (DESIGN.md)
- ✓ **Säkerhetsbas** — RLS verifierad, HSTS, input-sanering, Sentry — pre-GSD (docs/security-audit.md)

### Active

<!-- Definieras när första milstolpen sätts upp nedan. -->

(Se "Current Milestone" nedan.)

### Out of Scope

- **Mobilapp (native)** — webbappen är primär; mobil sker via responsive web
- **Real-time chat mellan deltagare** — utanför portalens uppdrag, hög komplexitet
- **Engelsk översättning som launch-krav** — i18next finns men svenska är primär
- **Egen jobbdatabas** — vi integrerar mot Platsbanken/AF, bygger inte eget index

## Context

**Målgrupp & ton:** Långtidsarbetslösa, personer med NPF, utmattning, fysiska/psykiska utmaningar. Tonen ska vara stödjande, inte stressande. Tänk Headspace, inte Linear. WCAG 2.1 AA är minimikrav.

**85+ sidor i client/src/pages/.** Stor yta, hög underhållskostnad — risk för dödkod (sidor lazy-importeras utan att routas). Se `docs/portal-review-2026-04.md` för senaste granskning.

**Två AI-backends:** `/api/ai.js` (Vercel, 18 funktioner — UI-default) och `supabase/functions/` (Deno edge, 23 funktioner — service role + AF/Bolagsverket-integration). När man bygger ny AI-funktion måste man uttryckligen säga vilken backend.

**Designsystem aktivt från 2026-04-29:** 5 semantiska domäner (Action/Info/Activity/Wellbeing/Coaching), pastell-bg i innehåll, uniform neutral header med 4px domänkant. Inga gradients i återkommande UI.

## Constraints

- **Tech stack**: React 19, TypeScript 5.9, Vite 7, Tailwind 4, Zustand, React Query, Supabase, i18next, Vitest — fastställt och produktionssatt
- **Tillgänglighet**: WCAG 2.1 AA — minimikrav, inte mål
- **Språk**: Svenska primär. i18next finns men engelsk översättning är inte launch-krav
- **Deploy**: Vercel (serverless functions). Ingen egen server-drift
- **DB-migrationer**: Använd inte `supabase db push` — kör enskilda migrationer med `db query --linked -f`
- **Säkerhet**: GDPR-känslig data (deltagare i utsatt situation). RLS obligatoriskt. Secrets aldrig i klient
- **Performance**: Mobil-first. 50+ sidor → lazy-loading + bundle-analys obligatoriskt

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase som backend (auth + DB + edge functions) | Snabb tid till värde, RLS för GDPR-känslig data | ✓ Good |
| Två AI-backends (Vercel + Supabase) | Vercel för UI-streaming, Supabase för service-role/AF-integration | ⚠️ Revisit (komplexitet) |
| 5 platta pasteller + neutral header (2026-04-29) | Tidigare gradient-design upplevdes stressande för målgruppen | ✓ Good |
| Stone över Slate (2026-04) | Varmare neutral palett — mindre kliniskt | ✓ Good |
| Vector-PDF via @react-pdf/renderer (cover-letter) | Sökbar text + svensk typografi, ersätter html2pdf | ✓ Good |
| GSD-init i pågående projekt (2026-04-28) | Formalisera milstolpestruktur efter aktiv utveckling | — Pending |

---
*Last updated: 2026-04-28 efter GSD-init*
