# Teknisk skuld: Tillgänglighet (WCAG 2.1 AA)

**Granskningsdatum:** 2026-05-09
**Scope:** `client/src/` (React 19 + TypeScript)
**Standard:** WCAG 2.1 nivå AA — obligatoriskt för Deltagarportalen
**Granskare:** accessibility-specialist agent

> Målgrupp: arbetssökande inkl. personer med syn-, motorik- eller kognitiva utmaningar.
> En tillgänglighetsbrist är inte ett "nice-to-have" — det är en juridisk och etisk skyldighet.

---

## Sammanfattning

Portalen har ett **starkt grundfundament** för tillgänglighet:
- `accessibility.css` overrider Tailwinds låg-kontrast-klasser (text-*-400/500) globalt med `!important`.
- Globalt `@media (prefers-reduced-motion: reduce)` neutraliserar CSS-animationer.
- `<html lang="sv">` är satt.
- `SkipLinks`-komponent är implementerad och monteras i `Layout.tsx`.
- `useFocusTrap`, `useEscapeKey`, `useReducedMotion`, `useAnnounce` finns i `hooks/useAccessibility.tsx`.
- `<MainContent>`/`<NavigationLandmark>` finns och används.
- 284 filer använder `aria-label`, 63 filer `aria-live`, 17 modaler har `aria-modal`.

Men **applikationskoden använder inte konsekvent dessa verktyg.** Skulden ligger i bristande adoption — inte i avsaknad av infrastruktur.

| Kategori | Antal | Allvar | WCAG-ref |
|----------|-------|--------|----------|
| Ikon-bara `<button>` utan aria-label/title | **53** | A | 4.1.2 Name, Role, Value |
| Modaler med `role="dialog"` utan focus-trap | **16** | A | 2.4.3 Focus Order |
| Framer-motion utan useReducedMotion (CSS-fallbacken når inte) | **42 filer (367 motion-anrop)** | AA | 2.3.3 Animation from Interactions |
| `<div onClick>` utan keyboard-handler (interaktiva, ej overlay) | **5** | A | 2.1.1 Keyboard |
| Modaler utan `aria-modal` | **17 av ~23 dialoger** | AA | 4.1.2 |
| Icke-dekorativa `<img>` med tom alt på avatarer | **3 verifierade** | A | 1.1.1 Non-text Content |
| Bristande heading-struktur i Tab-sidor (saknad/oklar h1) | **46 sidor** | A/AA | 1.3.1 Info and Relationships |
| `text-*-300` mot ljus bg (ej överrid:ad i CSS) | **1040 förekomster i 221 filer** | AA | 1.4.3 Contrast |
| Form-fält utan `aria-describedby` på fel | **majoriteten** | A | 3.3.1 Error Identification |
| Form-fält utan `aria-invalid` | **majoriteten** (12 förekomster i 8 filer) | AA | 3.3.1 |

**Totalt identifierade direkta överträdelser:** ~150 enskilda fix-punkter + systematiska brister.

---

## A-kritiska (måste fixas — WCAG nivå A)

### A1. Ikon-bara knappar utan tillgängligt namn (53 st)
**WCAG 4.1.2 Name, Role, Value (Level A).**
Skärmläsaren läser upp "knapp" utan att säga vad knappen gör.

**Mönster:** `<button onClick={...}><Icon size={16} /></button>` — inget aria-label, ingen title, ingen text.

**Värsta filer (med flera förekomster):**
- `client/src/components/diary/JournalTab.tsx` — 3 ikon-knappar (RefreshCw, Filter, Star) utan namn
- `client/src/components/cv/FocusCVBuilder.tsx`, `client/src/pages/career/AdaptationTab.tsx`, `client/src/pages/personal-brand/PortfolioTab.tsx`
- `client/src/pages/consultant/ResourcesTab.tsx` — 3 (Star + 2× MoreVertical)
- `client/src/components/ai/CareerCoach.tsx`, `client/src/components/chat/AIChatbot.tsx`, `client/src/components/consultant/AICoachAssistant.tsx` — Send-knappar i chat utan label (allvarligt — primär CTA i AI-team)
- `client/src/components/admin/SuperAdminPanel.tsx`, `client/src/components/applications/ApplicationCard.tsx`, `client/src/components/applications/ApplicationsContacts.tsx`, `client/src/components/jobs/ApplicationsTab.tsx`, `client/src/components/microlearning/CourseCard.tsx`, `client/src/components/consultant/ParticipantList.tsx`, `client/src/pages/consultant/ParticipantDetailPage.tsx` — alla har `MoreVertical`-meny utan namn
- `client/src/pages/consultant/AnalyticsTab.tsx`, `client/src/pages/consultant/OverviewTab.tsx` — `RefreshCw` utan namn
- `client/src/components/video/VideoCall.tsx` — `PhoneOff` (lägga på samtal!) utan namn
- `client/src/components/settings/DeleteAccountSection.tsx` — 2× `XCircle` utan namn

**Fix-mönster:**
```tsx
<button aria-label="Skicka meddelande" onClick={handleSend}>
  <Send size={16} aria-hidden="true" />
</button>
```

---

### A2. Interaktiva `<div onClick>` utan tangentbordsstöd (5 st)
**WCAG 2.1.1 Keyboard (Level A).**
Tangentbordsanvändare och skärmläsare kan inte aktivera elementen.

| Fil | Rad | Problem |
|-----|-----|---------|
| `client/src/components/actionplan/ActionPlan.tsx` | 95 | `<div onClick={() => setSelectedPlan(plan)}>` — välja plan |
| `client/src/components/learning/MicroLearning.tsx` | 59 | `<div onClick={() => setActiveLesson(lesson)}>` — öppna lektion |
| `client/src/pages/career/NetworkTab.tsx` | 709, 734 | Två expanderbara sektioner som divs |
| `client/src/pages/Resources.tsx` | 1147 | Modal overlay (acceptabelt om aria-hidden) |

**Fix:** Konvertera till `<button>` eller lägg till `role="button" tabIndex={0} onKeyDown={...}` (Enter/Space).

---

### A3. Modaler med `role="dialog"` utan focus-trap (16 st)
**WCAG 2.4.3 Focus Order (Level A) + 2.1.2 No Keyboard Trap.**
Fokus läcker ut bakom modalen, användare med tangentbord/skärmläsare kan inte navigera korrekt.

Filer som deklarerar `role="dialog"` men inte importerar `useFocusTrap` eller liknande:
- `client/src/components/calendar/EventModal.tsx`
- `client/src/components/energy/QuickWinButton.tsx`
- `client/src/components/gamification/AchievementCelebration.tsx`
- `client/src/components/gamification/WeeklySummary.tsx`
- `client/src/components/interest-guide/QuestionCard.tsx`
- `client/src/components/jobs/AlertsTab.tsx`
- `client/src/components/jobs/JobDetailModal.tsx`
- `client/src/components/notifications/NotificationBell.tsx`
- `client/src/components/onboarding/OnboardingFlow.tsx`
- `client/src/components/profile/DocumentsSection.tsx`
- `client/src/components/profile/OnboardingModal.tsx`
- `client/src/components/widgets/HiddenWidgetsPanel.tsx`
- `client/src/components/CrisisSupport.tsx` (kritisk — krishantering)
- `client/src/components/HelpButton.tsx`
- `client/src/components/Layout.tsx` (Help-modal i shell)
- `client/src/components/MobileNav.tsx` (mobilnavigationen!)

**Fix:**
```tsx
const ref = useRef<HTMLDivElement>(null);
useFocusTrap(isOpen, ref);
return <div ref={ref} role="dialog" aria-modal="true">...</div>;
```

---

### A4. Bilder utan meningsfull alt-text
**WCAG 1.1.1 Non-text Content (Level A).**

Två bekräftade icke-dekorativa bilder med `alt=""`:
- `client/src/pages/MyConsultant.tsx:131` — `<img src={consultant.avatar_url} alt="" />` — konsulentens namn bör läsas upp i kontext, men avatar är associerad i layout
- `client/src/pages/hubs/HubOverview.tsx:184` — `<img src={profileImageUrl} alt="" />` — användarens egen profilbild i header (acceptabelt om namn finns intill)

Acceptabelt om bilden står direkt bredvid texten den representerar (`alt=""` markerar den som dekorativ). Verifiera att namn faktiskt syns intill.

---

### A5. Bristande heading-hierarki / saknad h1 (46 sidor)
**WCAG 1.3.1 Info and Relationships (Level A) + 2.4.6 Headings (AA).**

Pages som varken använder `PageHeader`/`PageLayout` eller har egen `<h1>`:
- 6 hub-bottensidor: `pages/hubs/JobsokHub.tsx`, `KarriarHub.tsx`, `MinVardagHub.tsx`, `ResurserHub.tsx`
- Tab-sidor i sub-routes (career, consultant, dashboard, international, interest-guide, personal-brand, salary, spontaneous, wellness) — totalt **40+ tab-filer**

Risk: Tab-sidor som monteras utan parent som tillhandahåller h1 saknar landmark. Måste granskas case-by-case — vissa har parent som äger h1 (OK), andra (t.ex. hubs) saknar verkligen h1.

**Fix:** Säkerställ att varje route har exakt en `<h1>`. Tab-innehåll använder `<h2>`/`<h3>`.

---

## AA-kritiska (måste fixas — WCAG nivå AA)

### AA1. Animationer utan prefers-reduced-motion-respekt (Framer Motion)
**WCAG 2.3.3 Animation from Interactions (AAA, men kritiskt för målgruppen).**

`accessibility.css` har global `@media (prefers-reduced-motion: reduce)` som dödar CSS-animationer — men **Framer Motion ignorerar CSS-filtret** eftersom det driver inline-animationer via JS. Resultat: 367 motion-anrop i 42 filer kör fortfarande för användare med reduced-motion.

Endast **3 filer** använder `useReducedMotion`-hooken (1 är test-filen själv).

**Värsta filer (många motion-anrop):**
- `client/src/pages/personal-brand/PitchTab.tsx` (9), `PortfolioTab.tsx` (3), `BrandAuditTab.tsx` (7), `VisibilityTab.tsx` (3)
- `client/src/pages/interest-guide/ResultsTab.tsx` (23!), `OccupationsTab.tsx` (19)
- `client/src/pages/wellness/CrisisTab.tsx` (19), `CognitiveTab.tsx` (18), `RoutinesTab.tsx` (20), `EnergyTab.tsx` (11)
- `client/src/pages/dashboard/tabs/LearningTab.tsx` (13), `InsightsTab.tsx` (7)
- `client/src/components/SuccessMoments.tsx` (14)
- `client/src/components/gamification/BadgeSystem.tsx` (10)
- `client/src/components/journey/JourneyCelebration.tsx` (18) — popups med konfetti

Detta är särskilt kritiskt på `wellness/CrisisTab.tsx` (krishantering) — användare i kris vill INTE se dansande element.

**Fix:**
```tsx
import { useReducedMotion } from '@/hooks/useAccessibility'
const reduced = useReducedMotion()
<motion.div animate={reduced ? {} : { y: -10 }} transition={reduced ? { duration: 0 } : { duration: 0.4 }} />
```
Eller använd Framer's egen `useReducedMotion` från `framer-motion` (samma API).

---

### AA2. Form-fält utan `aria-describedby` på felmeddelanden
**WCAG 3.3.1 Error Identification + 3.3.3 Error Suggestion (Level A/AA).**

Endast 20 förekomster av `aria-describedby` och 12 av `aria-invalid` i hela projektet — trots 73 filer med `<label>` och 264 användningar av `<input>`/`<textarea>`.

Kontrollerade filer (urval):
- `client/src/pages/Login.tsx` — har aria-invalid + aria-describedby (bra exempel)
- `client/src/components/ui/Input.tsx` — basversionen stödjer det
- `client/src/pages/Register.tsx` — saknar aria-describedby på ~8 inputs
- `client/src/pages/personal-brand/PortfolioTab.tsx` — 6 input-fält utan aria-koppling
- `client/src/components/cv/EducationEditor.tsx`, `ExperienceEditor.tsx` — 9 + 7 inputs utan kopplade fel
- `client/src/components/applications/AddApplicationModal.tsx` — 9 inputs

**Fix:** Wrappa fält + label + felmeddelande i återanvändbar `FormField`-komponent som alltid sätter `aria-invalid` och `aria-describedby`.

---

### AA3. Modaler utan `aria-modal="true"`
**WCAG 4.1.2 (AA).**

Av ~23 dialoger har endast 17 `aria-modal`. Saknas i:
- `client/src/components/cover-letter/CoverLetterMyLetters.tsx`
- `client/src/components/jobs/JobDetailModal.tsx` (har det)
- Flera consultant-dialogs (`InviteParticipantDialog`, `MeetingSchedulerDialog`, `BulkActionsDialog`, `ReportGeneratorDialog`, `GoalCreationDialog`)
- `client/src/components/notifications/NotificationBell.tsx` (popover styled as dialog)
- `client/src/components/profile/DocumentsSection.tsx`
- `client/src/components/widgets/HiddenWidgetsPanel.tsx`

---

### AA4. Möjlig kontrastbrist på `text-*-300`
**WCAG 1.4.3 Contrast (Minimum) — 4.5:1 (AA).**

`accessibility.css` overrider `text-stone-400/500`, `text-gray-400/500`, `text-slate-400/500` till AA-säkra värden. Men **inte `-300`-varianten.**

`text-stone-300` (#d6d3d1) på vit bakgrund: ~1.6:1 — fail.
1040 förekomster i 221 filer. Många är dock i mörkt läge (`dark:text-stone-300`) vilket är OK.

Måste audit:as visuellt eller med automatiserad kontrast-tester.

**Fix:** Lägg till `text-stone-300/text-gray-300/text-slate-300`-overrides i accessibility.css samma sätt som -400/-500. Eller låt `bg-white/60` etc med vit text granskas.

---

### AA5. Färg som enda informationsbärare i status-badges
**WCAG 1.4.1 Use of Color (Level A).**

I `client/src/types/application.types.ts` definieras 3 färger för applikationsstatus utan ikoner. Kontrollerade Badge-komponenter använder ofta endast färgskillnad för status (grön=ok, gul=väntar, röd=avslag) utan ikon eller text.

Fil: `client/src/components/dashboard/widgets/NextStepWidget.tsx` använder `bg-amber-50/100` för varning utan kompletterande ikon i vissa fall.

**Fix:** Lägg ikon eller text bredvid färgkodade indikatorer.

---

## AAA / Best Practice

- **A6 (AAA 2.4.5).** Multiple ways to find pages — finns search men inte sitemap.
- **A7 (AAA 1.4.6).** Higher contrast option — `.high-contrast` finns i CSS men exponeras inte tydligt i UI.
- **A8 (AAA 2.2.6).** Timeout-varning — Supabase session refresh:as automatiskt, ingen explicit timeout-varning för långa formulär.
- **A9.** `useAnnounce`-hooken är skapad men används bara i 1 fil. Behövs för att meddela t.ex. "CV sparat", "Generering klar" till skärmläsare.
- **A10.** Tab-paneler saknar konsekvent `role="tabpanel"` + `aria-labelledby`.
- **A11.** `Tabs.tsx` (3 förekomster av aria-controls) — ofullständig ARIA-roll.

---

## Topp 10 sidor / komponenter med flest problem

Värderad efter sammanlagd skuld (ikon-knappar utan label + framer-motion utan reduced-motion + dialoger utan focus-trap):

| # | Fil | Problem |
|---|-----|---------|
| 1 | `client/src/pages/wellness/CrisisTab.tsx` | 19 motion utan reduced-respekt — **kritiskt** för krishantering |
| 2 | `client/src/pages/wellness/RoutinesTab.tsx` | 20 motion |
| 3 | `client/src/pages/wellness/CognitiveTab.tsx` | 18 motion |
| 4 | `client/src/pages/interest-guide/ResultsTab.tsx` | 23 motion |
| 5 | `client/src/pages/interest-guide/OccupationsTab.tsx` | 19 motion |
| 6 | `client/src/components/journey/JourneyCelebration.tsx` | 18 motion + dialog utan trap |
| 7 | `client/src/components/CrisisSupport.tsx` | 5 motion + dialog utan focus-trap (**krishantering!**) |
| 8 | `client/src/components/MobileNav.tsx` | dialog utan focus-trap (**hela mobilnavigationen**) |
| 9 | `client/src/components/diary/JournalTab.tsx` | 3 ikon-knappar utan label + 7 motion + modal utan trap |
| 10 | `client/src/components/ai/CareerCoach.tsx` + `chat/AIChatbot.tsx` + `consultant/AICoachAssistant.tsx` | Send-knapp utan aria-label på huvud-CTA i AI-team |

---

## Konkreta åtgärder (prioriteringsordning)

### Sprint 1 — Quick wins (1–2 dagar)
1. **Ikon-knappar:** Lägg `aria-label` på alla 53. Kan automatiseras med codemod baserat på närmsta `<Icon>`-typ + `onClick`-namn. Topp-prio: Send-knappar, MoreVertical-menyer, PhoneOff i VideoCall.
2. **Interaktiva divs:** Konvertera 5 `<div onClick>` till `<button>` (eller lägg keyboard-handler).
3. **Lägg `aria-modal="true"`** på de 6–8 dialoger som saknar det.
4. **Utvidga `accessibility.css`** med override för `text-*-300` mot ljus bakgrund (om verifierat fail).

### Sprint 2 — Focus-trap roll-out (3–5 dagar)
5. **Wrap-komponent:** Skapa `<AccessibleModal>` som inkluderar `useFocusTrap` + `useEscapeKey` + `aria-modal` + `role="dialog"` + första-element-fokus + restore-fokus vid stängning.
6. **Migrera 16 dialoger** till `<AccessibleModal>`. Fokusera först på: `MobileNav`, `CrisisSupport`, `Layout` (Help-modal), `OnboardingFlow`, `JobDetailModal`.

### Sprint 3 — Reduced motion (3–5 dagar)
7. **Skapa `<MotionDiv>`-wrapper** som internt anropar `useReducedMotion` och stänger av `animate`/`initial`/`exit` när användaren har preferensen satt.
8. **Sök-och-ersätt** `motion.div` → `MotionDiv` i de 42 filerna. Prio: wellness (CrisisTab!), interest-guide, journey, gamification.

### Sprint 4 — Forms (2–3 dagar)
9. **Skapa `<FormField>`-komponent** som alltid kopplar `aria-invalid` + `aria-describedby` till felmeddelande med stabilt id.
10. **Migrera Register.tsx, EducationEditor, ExperienceEditor, AddApplicationModal, PortfolioTab** till `<FormField>` först.

### Sprint 5 — Heading audit (2 dagar)
11. **Verifiera h1-hierarki** i alla 46 sidor utan PageHeader. Lägg PageHeader där det saknas.
12. **Tabs-komponent:** Komplettera `Tabs.tsx` med `role="tabpanel"` + `aria-labelledby`.

### Sprint 6 — Live regions & announce (löpande)
13. **Använd `useAnnounce`** vid:
    - CV/cover letter-generering klar ("CV genererat — granska resultatet")
    - Auto-save-bekräftelse
    - Navigationsbyten (för SPA-routing — "Sidan {namn} laddad")
    - Toast-meddelanden (verifiera att de når aria-live)

### Övergripande
- **Lägg till en lint-regel** (`eslint-plugin-jsx-a11y`) i CI som blockerar nya förekomster av: ikon-button utan label, click-without-key-handler, img utan alt.
- **Kör Playwright + axe-core** mot topp-10-sidor och dokumentera mätvärden i `docs/accessibility-baseline.md` för att detektera regression.
- **Manuell granskning** med skärmläsare (NVDA/VoiceOver) på 5 kritiska flöden: CV-byggare, Intervjusimulator, Wellness/Crisis, AI-team, Spontanansökan.

---

## Verifiering

Efter varje sprint, kör:
```bash
cd client && npm run build && npm run test:run
npx playwright test --project=chromium
# Manuell test:
# - Tabba genom hela sidan, verifiera att fokus alltid syns och aldrig låser sig
# - Sätt prefers-reduced-motion i OS, ladda om Wellness/Crisis-sidan
# - VoiceOver/NVDA på inloggning + CV-byggare-flödet
```
