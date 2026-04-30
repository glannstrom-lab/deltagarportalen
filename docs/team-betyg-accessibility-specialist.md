# Accessibility-specialist — betyg

Lins: WCAG 2.1 AA, skärmläsare, kognitiv tillgänglighet. Bedömd från kodgranskning av representativa sidor + delade UI-primitiver (Button, Input, Tabs, ConfirmDialog, useFocusTrap, SkipLinks). Höga betyg = etablerade ARIA-mönster + tydlig text + 44px touch + felåterhämtning. Låga = mycket interaktion utan ARIA, små touch-mål, kognitiv belastning.

## Tabell

| ID | Yta | Utseende | Funktionalitet | Användbarhet | Notering |
|---|---|---|---|---|---|
| H1 | Översikt-hubben | 8 | 7 | 8 | Tydlig hero, motion-respekt oklart, datum-disc bra |
| H2 | Söka jobb-hubben | 8 | 7 | 7 | Card-grid bra, link-hierarchi tydlig |
| H3 | Karriär-hubben | 8 | 7 | 7 | Konsekvent layout med övriga hubbar |
| H4 | Resurser-hubben | 8 | 7 | 7 | Konsekvent, ikoner aria-hidden saknas på vissa |
| H5 | Min vardag-hubben | 8 | 7 | 8 | Lugn pastell, lätt scanbar |
| D1 | Dashboard översikt | 7 | 6 | 6 | Många widgets = kognitiv belastning för långtidsarbetslösa |
| D2 | Mina Quests | 7 | 6 | 6 | Gamification kan vara stressande utan opt-out |
| JS1 | Sök (job-search) | 7 | 8 | 7 | useFocusTrap+useId, sanitizeHTML, 41 ARIA-träffar |
| JS2 | Dagens jobb | 7 | 7 | 7 | Subtab via DailyJobTab, ärver mönster |
| JS3 | Sparade jobb | 7 | 7 | 7 | Listinteraktion behöver aria-live för delete |
| JS4 | Matchningar | 7 | 6 | 6 | AI-matchning saknar förklaring, lågt cognitive support |
| AP1 | Pipeline | 6 | 6 | 5 | Drag-och-släpp utan kbd-fallback osäkert |
| AP2 | Historik | 7 | 7 | 7 | Timeline-läsbar, men datum-format varierar |
| AP3 | Kalender | 7 | 7 | 6 | Komplext kalender-grid; status aria-live finns |
| AP4 | Kontakter | 7 | 7 | 7 | Standard CRUD, label-htmlFor via Input-komp |
| AP5 | Statistik | 7 | 6 | 6 | Charts saknar text-alternativ för sr-användare |
| CV1 | Skapa CV | 7 | 7 | 6 | 5 steg = bra struktur, men 25min total överväldigar |
| CV2 | Mina CV | 7 | 7 | 7 | Lista med tydliga åtgärder |
| CV3 | Anpassa | 7 | 7 | 6 | AI-output behöver "förklara"-läge |
| CV4 | ATS-analys | 7 | 7 | 6 | Score 0-100 utan kontext = ångest-risk |
| CV5 | CV-tips | 8 | 7 | 8 | Statiskt innehåll, lättläst |
| CL1 | Skriv brev | 7 | 7 | 6 | Stort textfält OK, AI-feedback otydlig |
| CL2 | Mina brev | 7 | 7 | 7 | Standard listvy |
| SP1 | Sök företag | 6 | 6 | 5 | Org.nummer-validering + tunga termer (Bolagsverket) |
| SP2 | Mina företag | 7 | 7 | 7 | Listvy med status-badges |
| SP3 | Statistik | 7 | 6 | 6 | Diagram utan sr-text |
| SJ1 | Intervjuträning | 7 | 8 | 7 | 54 ARIA-träffar, role=timer, mic-knapp aria-label |
| SJ2 | Lön & Förhandling | 7 | 7 | 7 | Kalkylator behöver felmeddelanden via aria-invalid |
| SJ3 | Internationell guide | 7 | 6 | 6 | Mycket information, behöver TOC/skip |
| SJ4 | LinkedIn-optimering | 7 | 7 | 6 | OAuth-fel-recovery oklar för sr |
| CA1 | Arbetsmarknad | 7 | 7 | 7 | Domain coaching, lugn färg |
| CA2 | Anpassning | 7 | 6 | 6 | Funktionsspec termer ej alltid förklarade |
| CA3 | Credentials | 7 | 6 | 6 | Saknar aria-live för upload-status |
| CA4 | Flytta | 7 | 6 | 7 | Empatisk framing |
| CA5 | Karriärplan | 7 | 7 | 7 | Plan-tab har 22 ARIA + role=status |
| IG1 | Test (interest) | 7 | 7 | 7 | QuestionCard har focus-trap |
| IG2 | Resultat | 7 | 6 | 6 | Radar-chart utan text-alternativ |
| IG3 | Yrken | 7 | 7 | 7 | Sökbar lista |
| IG4 | Utforska | 7 | 6 | 7 | Empatiskt språk |
| IG5 | Historik | 7 | 7 | 7 | Lättläst |
| KA1 | Kompetensanalys | 7 | 7 | 6 | 13 ARIA, gap-analys kan upplevas dömande |
| KA2 | Personligt varumärke | 7 | 6 | 6 | "Audit"-term missvisande för svensk målgrupp |
| KA3 | Utbildning | 7 | 7 | 7 | 9 ARIA-träffar, ext-länkar markeras |
| KB1 | För dig | 8 | 7 | 8 | Lazy-laddade tabs, LoadingState konsekvent |
| KB2 | Komma igång | 8 | 7 | 9 | Empatiskt onboarding-språk |
| KB3 | Ämnen | 8 | 7 | 8 | Tydlig kategorisering |
| KB4 | Snabbhjälp | 8 | 7 | 9 | Crisis/alert-färgkodning fungerar |
| KB5 | Min resa | 8 | 7 | 8 | Tidslinje-narrativ |
| KB6 | Verktyg | 7 | 7 | 7 | Standard länkkort |
| KB7 | Trendar | 7 | 6 | 6 | Saknar i master-routing? Verifiera nåbarhet |
| KB8 | Berättelser | 8 | 7 | 8 | StoriesTab — peer-stöd är empatiskt |
| RE1 | Mina dokument | 7 | 7 | 7 | Resources-page, 5 ARIA-träffar |
| RE2 | Utskriftsmaterial | 8 | 7 | 8 | Bra för icke-digitala användare |
| RE3 | Externa resurser | 7 | 6 | 6 | Ext-länkar borde ha aria-label "öppnas i ny flik" |
| RE4 | AI-team | 7 | 7 | 6 | Skip-link finns, dropdown-keyboard oklar |
| RE5 | Nätverk | 7 | 7 | 7 | Standard CRUD |
| WE1 | Hälsa | 8 | 7 | 8 | Wellbeing-domän, lugn lavendel, ConsentGate skyddar |
| WE2 | Rutiner | 8 | 7 | 8 | Routine-builder lättfattlig |
| WE3 | Kognitiv träning | 8 | 7 | 7 | Övningar med tydliga steg |
| WE4 | Akut stöd | 9 | 8 | 9 | Kris-resurser tydligt prioriterade, focus-trap finns |
| MV1 | Dagbok | 8 | 7 | 8 | 44px touch enforced, 4 lugna tabs, streak-feedback |
| MV2 | Kalender | 7 | 7 | 6 | Komplex grid, statusMessage med timer (3s ev. för kort) |
| MV3 | Övningar | 8 | 7 | 8 | Lås/svårighet visualiserat, lättläst |
| MV4 | Min konsulent | 8 | 7 | 8 | 12 ARIA-träffar, expand/collapse aria-expanded |
| OV1 | Profil | 7 | 7 | 6 | Stor sida, behöver bättre sektionsuppdelning för sr |
| OV2 | Inställningar | 8 | 8 | 8 | Egen accessibility-sektion, högkontrast/stor text-toggle |
| OV3 | Vanliga frågor | 8 | 7 | 9 | FAQ-mönster, ChevronRight visar interaktivitet |

## Sammanfattning

UI-primitiver är **oväntat starka**: `Tabs` har full WAI-ARIA tablist + arrow-key, `Input` har aria-invalid/describedby/role=alert, `Button` enforce 44px min-h, `ConfirmDialog` har focus-trap+aria-modal+restoreFocus, och `useFocusTrap` används i 18 komponenter. **SkipLinks** finns och `accessibility.css` med `role=status` infrastruktur är utbyggd.

**Värsta WCAG-bristerna:** (1) Charts/diagram (Statistik, ATS-analys, Radar i InterestGuide) saknar genomgående text-alternativ för skärmläsare — kritiskt brott mot 1.1.1. (2) Pipeline/AP1 drag-och-släpp saknar synlig kbd-fallback. (3) Touch-target-explicit-lyft finns bara i 3 sidor — resten ärver via Button men inline-knappar kan vara <44px. (4) Externa länkar saknar oftast "öppnas i ny flik"-meddelande. (5) AI-utdata (gap, scores, matchning) presenteras utan kognitiv kontext — riskabelt för målgrupp med ångest/lågt självförtroende.

**Bästa exemplen:** InterviewSimulator (54 ARIA, role=timer + pause-knapp), Inställningar (egen accessibility-sektion med calmMode/highContrast/largeText), Akut stöd (WE4) som kombinerar tydlig hierarki med kris-prioritering, KnowledgeBase (lazy + LoadingState + empatiskt språk).

**Kognitiv tillgänglighet:** Genomsnitt ~7. Wellness/Diary/KnowledgeBase exemplifierar lugn pastell + plain-language. Dashboard, Pipeline, ATS-score och AI-matchning drar ner snittet — målgruppen behöver "varför detta poäng" + opt-out för gamification. Saknar genomgående: "förklara enklare"-knapp på AI-output, dyslexi-vänligt typsnitt-val, och pause/timeout-kontroll på autosave-flöden.
