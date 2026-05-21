/**
 * Steg till arbete — läroplansdata och delade typer.
 *
 * Filen innehåller INGEN användarspecifik data. All deltagar- och konsulent-
 * data laddas live från Supabase via staApi/useSta. Det som finns här är:
 *
 *   - Insatsens fyra delar (STA_PARTS) — strukturen från AF-uppdraget
 *   - Del 1 dagsslinga (DAILY_EXERCISES_DEL1) — 14 dagars fast schema
 *   - Veckotematik (WEEK_THEMES) — vad Del 1 vecka 1-3 handlar om
 *   - Dag-till-resurs-mappning (DAY_RESOURCES) — koppling till befintliga
 *     KB-artiklar och övningar
 *   - Del 2 arbetsstationer (WORK_STATIONS) — fyra obligatoriska inriktningar
 *   - Översiktsresurser (STA_RESOURCES) — kompendier och informationsblad
 *
 * Typer för deltagar-rad/skattningsrad/deadlines/dokumentutkast/arbetsplatser
 * definieras här men deras *data* kommer alltid från Supabase.
 *
 * Filnamnet är "mockData.ts" av historiska skäl — innehållet är inte mock
 * längre. När det är dags att byta namn: även importer i StaParticipant,
 * StaConsultant, enrollmentDisplay.
 */

export type StaPart = 1 | 2 | 3 | 4
export type StaPartStatus = 'upcoming' | 'active' | 'completed'

export interface StaPartDef {
  id: StaPart
  label: string
  shortLabel: string
  duration: string
  description: string
}

export const STA_PARTS: StaPartDef[] = [
  {
    id: 1,
    label: 'Del 1 — Lära känna dig',
    shortLabel: 'Lära känna dig',
    duration: '3 veckor',
    description: 'Just nu lär vi känna varandra. Vi tittar tillsammans på vad du har med dig, vad du gillar, och hur en bra arbetsdag ser ut för just dig.',
  },
  {
    id: 2,
    label: 'Del 2 — Prova på',
    shortLabel: 'Prova på',
    duration: '5 veckor',
    description: 'Du får prova olika arbetsuppgifter i en lugn miljö. Inget måste sitta perfekt — det handlar om att hitta vad som passar.',
  },
  {
    id: 3,
    label: 'Del 3 — Stärka och utveckla',
    shortLabel: 'Stärka och utveckla',
    duration: 'upp till 6 mån',
    description: 'Vi hittar ett yrkesområde som passar och du provar på en riktig arbetsplats. Vi finns med hela tiden.',
  },
  {
    id: 4,
    label: 'Del 4 — Hitta arbetsplats',
    shortLabel: 'Hitta arbetsplats',
    duration: 'upp till 6 mån',
    description: 'Sista delen — vi hittar en arbetsplats där du kan landa och få en stabil anställning.',
  },
]

// ============================================================================
// DEL 1 — DAGSSLINGA (14 dagar)
// ============================================================================

export interface DailyExercise {
  day: number
  title: string
  shortTitle: string
  status: 'completed' | 'today' | 'tomorrow' | 'upcoming'
  scheduledFor?: string
  durationMin: number
  reflection?: string
}

/** Definitionsdata för dagsslingan — titel/längd från det fysiska
 *  kursmaterialet. Status och reflektion beräknas dynamiskt från
 *  sta_activities. */
export interface DailyExerciseDef {
  day: number
  title: string
  shortTitle: string
  durationMin: number
}

export const DAILY_EXERCISES_DEL1: DailyExerciseDef[] = [
  { day: 1, title: 'Fysisk aktivitet', shortTitle: 'Fysisk aktivitet', durationMin: 60 },
  { day: 2, title: 'Vem är jag, vad kan jag, vad vill jag?', shortTitle: 'Vem är jag?', durationMin: 60 },
  { day: 3, title: 'Stress', shortTitle: 'Stress', durationMin: 60 },
  { day: 4, title: 'Funktionsnedsättning eller ohälsa', shortTitle: 'Funktionsneds.', durationMin: 60 },
  { day: 5, title: 'Karriärvägledning del 1', shortTitle: 'Karriärväg. 1', durationMin: 60 },
  { day: 6, title: 'Karriärvägledning del 2', shortTitle: 'Karriärväg. 2', durationMin: 60 },
  { day: 7, title: 'Sömn och återhämtning', shortTitle: 'Sömn', durationMin: 45 },
  { day: 8, title: 'Nutrition och träning', shortTitle: 'Nutrition', durationMin: 60 },
  { day: 9, title: 'Fem faktorer för fysisk aktivitet', shortTitle: '5 faktorer', durationMin: 60 },
  { day: 10, title: 'Timeboxing och tidsplanering', shortTitle: 'Timeboxing', durationMin: 60 },
  { day: 11, title: 'Motivation', shortTitle: 'Motivation', durationMin: 60 },
  { day: 12, title: 'Självförtroende och självkänsla', shortTitle: 'Självkänsla', durationMin: 60 },
  { day: 13, title: 'Mål och delmål', shortTitle: 'Mål', durationMin: 60 },
  { day: 14, title: 'Hantera din stress', shortTitle: 'Hantera stress', durationMin: 60 },
]

// ============================================================================
// DEL 2 — ARBETSSTATIONER (4 obligatoriska enligt AF-uppdraget)
// ============================================================================

export interface WorkStationDef {
  id: 'admin' | 'kundmottagning' | 'lager' | 'produktion'
  name: string
  desc: string
  icon: string
}

export const WORK_STATIONS: WorkStationDef[] = [
  { id: 'admin', name: 'Administration', desc: 'Sortera, registrera, hantera dokument', icon: '📋' },
  { id: 'kundmottagning', name: 'Kundmottagning', desc: 'Möta människor, hjälpa med frågor', icon: '👋' },
  { id: 'lager', name: 'Lager', desc: 'Plocka, packa, fylla på', icon: '📦' },
  { id: 'produktion', name: 'Produktion', desc: 'Tillverka eller bygga ihop', icon: '🔧' },
]

// ============================================================================
// ÖVERSIKTSRESURSER — kompendier och informationsblad
// ============================================================================

export interface StaResource {
  icon: string
  title: string
  href: string
}

export const STA_RESOURCES: StaResource[] = [
  { icon: '📄', title: 'Informationsblad — Steg till arbete', href: '/sta/informationsblad-2024.pdf' },
  { icon: '📘', title: 'Kompendium 1 — Steg till arbete', href: '/knowledge-base' },
  { icon: '🌿', title: 'Hälsoskola (kompendium 2)', href: '/knowledge-base' },
  { icon: '🎯', title: 'Karriärvägledningshäfte 1', href: '/knowledge-base' },
  { icon: '😴', title: 'Sovboken — guide till bättre sömn', href: '/knowledge-base' },
]

// ============================================================================
// VECKOPLAN-OBJEKT — interface som viewModel använder
// ============================================================================

export interface WeekPlanItem {
  weekday: 'MÅN' | 'TIS' | 'ONS' | 'TOR' | 'FRE'
  date: string
  title: string
  meta: string
  status: 'done' | 'today' | 'upcoming' | 'rest'
}

export interface StaStrength {
  text: string
  fromActivity?: string
}

// ============================================================================
// VECKOSTRUKTUR — Del 1 kartläggningsperioden
// ============================================================================
// Del 1 är 3 veckor och 14 schemalagda dagar. Vi ger varje vecka ett tydligt
// fokus så att deltagaren förstår vart resan tar vägen — och hur dagens övning
// passar in i en större bild. Varje vecka kopplar till nästa steg mot arbete.

export interface WeekTheme {
  weekNumber: 1 | 2 | 3
  title: string
  subtitle: string
  /** Kort förklaring som lägger fokus på stegförflyttning mot arbete */
  arbetsmarknadKoppling: string
  /** Två-tre nyckelfrågor som deltagaren reflekterar över under veckan */
  reflektionsfragor: string[]
  /** Vilka av de 14 dagarna som ingår i veckan */
  days: number[]
  /** Vad veckan landar i */
  veckansResultat: string
}

export const WEEK_THEMES: WeekTheme[] = [
  {
    weekNumber: 1,
    title: 'Vem är du, varför är du här?',
    subtitle: 'Lär känna dig själv och din situation',
    arbetsmarknadKoppling:
      'Innan vi pratar om jobb behöver vi förstå dig — din historia, dina förutsättningar och varför du är i Steg till arbete just nu. Det blir grunden för allt vi gör härnäst.',
    reflektionsfragor: [
      'Vem är jag idag — och vem har jag varit?',
      'Vad har lett mig hit?',
      'Vad fungerar bra och vad är jobbigt just nu?',
    ],
    days: [1, 2, 3, 4, 5],
    veckansResultat:
      'En tydligare bild av vem du är, din situation och vilka anpassningar du behöver för att kunna ta nästa steg.',
  },
  {
    weekNumber: 2,
    title: 'Vad kan du, vad vill du?',
    subtitle: 'Utforska dina kompetenser, intressen och drivkrafter',
    arbetsmarknadKoppling:
      'Nu vänder vi blicken framåt. Vad har du med dig som kan användas på arbetsmarknaden? Vilka yrken eller områden lockar? Vi bygger underlag för ditt fokusyrke.',
    reflektionsfragor: [
      'Vad är jag bra på — även sådant jag tar för givet?',
      'Vad gör mig nyfiken eller engagerad?',
      'Vilka miljöer och uppgifter passar mig?',
    ],
    days: [6, 7, 8, 9, 10],
    veckansResultat:
      'Början på en kompetenskarta och en första riktning för vilket yrkesområde som kan passa dig.',
  },
  {
    weekNumber: 3,
    title: 'Planering — hur ska du komma framåt?',
    subtitle: 'Sätt mål och förbered nästa steg',
    arbetsmarknadKoppling:
      'Vi tar det vi har lärt oss om dig och gör en konkret plan. Vad är ditt nästa steg? Är det Del 2 där du provar arbetsuppgifter, eller direkt till arbetsprövning i Del 3? Vi förbereder dig för det.',
    reflektionsfragor: [
      'Vad är ett rimligt nästa steg för mig — inte om ett år, utan om en månad?',
      'Vad behöver jag för att klara det?',
      'Vem och vad ska finnas runt mig när jag tar steget?',
    ],
    days: [11, 12, 13, 14],
    veckansResultat:
      'En personlig plan med ett tydligt nästa steg, samt en sammanställning som blir grunden för Initial planering och Delredovisning till AF.',
  },
]

/** Hjälpfunktion: vilken vecka tillhör en dag? */
export function getWeekForDay(day: number): WeekTheme | null {
  return WEEK_THEMES.find((w) => w.days.includes(day)) ?? null
}

// ============================================================================
// MAPPNING — STA-dagar till befintliga KB-artiklar och övningar
// ============================================================================
// Per DESIGN.md A1 (sta-improvements-and-jobin-integration.md): korsreferens till
// befintligt material istället för att duplicera. Vi pekar på artikel-IDn i
// `client/src/services/articleData.ts` och övning-IDn i `client/src/data/exercises.ts`.

export interface DayResource {
  kind: 'article' | 'exercise'
  id: string
  label: string
  /** Kort kontextualisering — hur passar resursen ihop med dagen? */
  context?: string
  /** Estimat lästid / övningstid */
  estimate?: string
}

export const DAY_RESOURCES: Record<number, DayResource[]> = {
  1: [
    { kind: 'article', id: 'sta-fem-faktorer', label: 'Fem faktorer för hållbar aktivitet', context: 'Bygg en rörelsevana som faktiskt håller — utan att slå ut sig.', estimate: '6 min läsning' },
    { kind: 'exercise', id: 'fem-faktorer-energi', label: 'Fem faktorer — bygg en hållbar vana', context: 'Konkret övning som följer dagens tema.', estimate: '25–35 min' },
  ],
  2: [
    { kind: 'article', id: 'styrkor-svagheter', label: 'Identifiera och kommunicera dina styrkor', context: 'Bra grund för dagens KVL-övning ("Vem är jag").', estimate: '7 min läsning' },
    { kind: 'exercise', id: 'jobb-jag', label: 'Hitta ditt jobb-jag', context: 'Strukturerad reflektion om vem du är i arbete.', estimate: '25 min' },
    { kind: 'exercise', id: 'strengths', label: 'Dina starkaste egenskaper', context: 'Djupare övning om dina styrkor.', estimate: '20–30 min' },
  ],
  3: [
    { kind: 'article', id: 'stresshantering', label: 'Stresshantering för arbetssökande', context: 'Skriven för jobbsökare men principerna gäller dig redan idag.', estimate: '8 min läsning' },
    { kind: 'article', id: 'sta-utmattning-recovery', label: 'Återhämtning från utmattning — vägen tillbaka', context: 'Om du är i rehabilitering snarare än aktiv stress.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'wellbeing', label: 'Hantera stress i jobbsökning', context: 'Praktiska verktyg du kan börja använda idag.', estimate: '20 min' },
  ],
  4: [
    { kind: 'article', id: 'jobbsokning-funktionsnedsattning', label: 'Jobbsökning med funktionsnedsättning – rättigheter och stöd', context: 'Vilka stöd och anpassningar du kan be om.', estimate: '10 min läsning' },
    { kind: 'article', id: 'anpassningar-arbetsplats', label: 'Anpassningar på arbetsplatsen — dina möjligheter', context: 'Konkreta exempel på anpassningar och hur man frågar.', estimate: '7 min läsning' },
  ],
  5: [
    { kind: 'article', id: 'karriarplanering-guide', label: 'Karriärplanering — från vision till verklighet', context: 'Sätter karriärvägledningen i ett strukturerat sammanhang.', estimate: '10 min läsning' },
    { kind: 'exercise', id: 'dromjobb', label: 'Drömjobbsanalys', context: 'Konkret övning som matchar Karriärvägledning del 1.', estimate: '30 min' },
  ],
  6: [
    { kind: 'article', id: 'varderingar-karriarval', label: 'Hitta dina värderingar — nyckeln till rätt jobb', context: 'Karriärvägledning del 2 handlar om vad som är viktigt för dig.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'careerpath', label: 'Planera din karriärväg', context: 'Strukturerad övning för dina karriärval.', estimate: '30 min' },
  ],
  7: [
    { kind: 'article', id: 'sta-somn-ostrukturerad', label: 'Sömn när livet är ostrukturerat', context: 'Sömntips för dig som inte har ett 8-till-5-jobb just nu.', estimate: '7 min läsning' },
    { kind: 'exercise', id: 'somndagbok', label: 'Sömndagbok', context: 'Logga din sömn i 2 veckor och hitta dina mönster.', estimate: '5 min/dag i 2 veckor' },
  ],
  8: [
    { kind: 'article', id: 'sta-fem-faktorer', label: 'Fem faktorer för hållbar aktivitet', context: 'Bra grund för att bygga mat- och rörelsevanor som håller.', estimate: '6 min läsning' },
    { kind: 'exercise', id: 'fem-faktorer-energi', label: 'Fem faktorer — bygg en hållbar vana', context: 'Använd metoden för en kost- eller rörelsevana.', estimate: '25–35 min' },
  ],
  9: [
    { kind: 'article', id: 'sta-fem-faktorer', label: 'Fem faktorer för hållbar aktivitet', context: 'Dagens kärnmaterial.', estimate: '6 min läsning' },
    { kind: 'exercise', id: 'fem-faktorer-energi', label: 'Fem faktorer — bygg en hållbar vana', context: 'Konkret tillämpning av dagens tema.', estimate: '25–35 min' },
  ],
  10: [
    { kind: 'article', id: 'sta-timeboxing', label: 'Timeboxing när orken är begränsad', context: 'Direkt kopplad till dagens tema.', estimate: '6 min läsning' },
    { kind: 'exercise', id: 'timeboxing', label: 'Sätt upp ditt första timeboxing-block', context: 'Praktisk övning för dagen.', estimate: '20 min' },
  ],
  11: [
    { kind: 'article', id: 'motivation-langsiktig', label: 'Att hitta tillbaka till motivationen', context: 'Stöd för dig som tappat fart.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'inre-yttre-motivation', label: 'Vad driver dig egentligen?', context: 'Reflektionsövning om dina drivkrafter.', estimate: '25 min' },
  ],
  12: [
    { kind: 'article', id: 'sjalvkansla-arbetslos', label: 'Självkänsla när det inte gått som planerat', context: 'Skriven för långvarigt arbetssökande.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'sjalvkansla', label: 'Bygg din självkänsla — steg för steg', context: 'Konkret övning för dagens tema.', estimate: '20–30 min' },
  ],
  13: [
    { kind: 'article', id: 'smarta-mal-arbetsmarknad', label: 'SMART-mål för jobbsökning', context: 'Strukturerad metod för dagens målarbete.', estimate: '7 min läsning' },
    { kind: 'exercise', id: 'smarta-mal', label: 'Sätt SMART-mål för veckan', context: 'Konkret målformulering.', estimate: '25 min' },
  ],
  14: [
    { kind: 'article', id: 'stresshantering', label: 'Stresshantering för arbetssökande', context: 'Sammanfattande tema för veckan.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'wellbeing', label: 'Hantera stress i jobbsökning', context: 'Avslutande övning på Del 1.', estimate: '20 min' },
  ],
}

// ============================================================================
// KONSULENT-VYNS TYPER — data hämtas live från Supabase
// ============================================================================

export type ParticipantLinkStatus =
  | 'linked'      // Deltagaren har Jobin-konto kopplat
  | 'invited'     // Inbjudan skickad, väntar
  | 'unlinked'    // Endast manuellt registrerad

export interface StaParticipantRow {
  id: string
  initials: string
  fullName: string
  focusOccupation: string | null
  currentPart: StaPart
  daysLeftInPart: number
  partEndsAt: string
  currentActivity: string
  activitySubtext: string
  activityProgress?: number
  assessments: Array<{ label: string; status: 'pending' | 'done' | 'due_today' | 'in_progress' }>
  adaptations: string
  hasDraft: number
  hasMessage: number
  linkStatus: ParticipantLinkStatus
  weeklyHours: number
  enrollmentStatus: 'active' | 'paused' | 'completed' | 'cancelled'
  manualContact?: { email?: string; phone?: string }
  manualPersonalId?: string
}

export interface JobinLinkSuggestion {
  userId: string
  fullName: string
  email: string
  initials: string
  registeredAt: string
  matchReason: string
}

export interface StaDeadline {
  id: string
  level: 'red' | 'amber' | 'green'
  due: string
  title: string
  participantName: string
  partInfo?: string
  cta: { label: string; primary: boolean }
}

export interface StaDocumentDraft {
  id: string
  docType: 'delredovisning' | 'initial_planering' | 'information_arbetsprovning'
  title: string
  participantName: string
  subtext: string
  due: string
  dueLevel: 'red' | 'amber' | 'green'
  aiDrafted: boolean
}

export interface ActivityLogEntry {
  id: string
  date: string
  title: string
  subtext: string
  type: 'activity' | 'reflection' | 'assessment' | 'note'
  highlight?: boolean
}

// Tidigare fanns en legacy StaWorkplace här (för UI-mocken). DB-typen finns
// nu i services/staApi.ts. Använd den istället.

export interface StaAssessmentRow {
  id: string
  participantName: string
  participantInitials: string
  instrument: 'DOA' | 'WRI' | 'MOHOST' | 'AWP' | 'AWC'
  part: StaPart
  progress: number
  status: 'pending' | 'in_progress' | 'complete'
  dueLabel?: string
  dueLevel?: 'red' | 'amber' | 'green'
}
