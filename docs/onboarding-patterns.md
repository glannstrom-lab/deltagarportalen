# Onboarding-mönster i portalen

**Senast uppdaterad:** 2026-05-15 (efter B7-cleanup)

Portalen har 5 aktiva onboarding-komponenter med olika scope. Detta är en levande inventering — inte en spec — så att utvecklare vet vilken som ska användas i nya flöden istället för att skapa en sjätte variant.

## Aktiva mönster

| Komponent | Scope | Typ | När den visas | Var |
|-----------|-------|-----|---------------|-----|
| `OnboardingFlow` | Global första-gångs-flow | Modal (full-screen) | Vid första inlogg | `Layout.tsx` (alltid monterad) |
| `OnboardingStep` | Återanvändbar step-card | Inline-komponent | Som building-block i andra modaler | Importeras av `CVOnboarding`, `profile/OnboardingModal` |
| `cv/CVOnboarding` | CV-specifikt 7-stegs-tour | Overlay | Vid första /cv-besök | `CVBuilder.tsx` |
| `profile/OnboardingModal` | Profile welcome-modal | Modal | Vid första /profile-besök | `Profile.tsx` |
| `ai-team/OnboardingModal` | AI-team intro | Modal | Vid första /ai-team-besök | `AITeam.tsx` |
| `ui/InlineTip` | Lättviktig inline-coach | Bubbla | Per-feature, dismissable | Spridda |

## Borttagna 2026-05-15 (B7)

- `components/dashboard/GettingStartedChecklist.tsx` (435 rader) — 0 importer
- `components/onboarding/GettingStartedChecklist.tsx` (441 rader) — 0 importer

Båda var parallella implementationer som aldrig kopplades till någon route. Dödkod.

- `components/Onboarding.tsx` (677 rader) — gammal global, ersatt av `OnboardingFlow`. Borttagen i B2.
- `components/career/CareerOnboarding.tsx` (692 rader) — 0 importer. Borttagen i B2.

## Verklig konsolidering — vad som krävs

DESIGN.md §12 noterar att vi har 5 olika onboarding-stilar och vill ha en enhetlig. Det kräver:

1. **UX-arbete:** Bestäm en visuell mall för alla onboarding-flow.
2. **Migrering av varje:** CVOnboarding, profile/OnboardingModal, ai-team/OnboardingModal blir varianter av en gemensam komponent.
3. **State-management:** Hantera vilka onboardings som är klara per user (`onboarding_completed`-flagga per feature).

Detta är **utanför Fas B (dödkod-rensning)**. Föreslås som senare initiativ när designsystem-konsolideringen prioriteras.

## När du bygger en ny onboarding

Innan du skapar en sjätte komponent — fundera över:

- **Är det en kort tip?** Använd `<InlineTip>` med `storageKey`.
- **Är det en sida-specifik tour?** Modellera efter `cv/CVOnboarding`.
- **Är det första-gångs-välkomst för en specifik sida?** Modellera efter `profile/OnboardingModal`.
- **Är det globalt (alla användare)?** Hör hemma i `OnboardingFlow`.

Lägg INTE en ny in en `components/[feature]/SomethingOnboarding.tsx` om en av ovanstående duger. Det är så vi fick 7 varianter senast.
