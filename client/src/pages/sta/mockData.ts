/**
 * Mockdata för Steg till arbete (STA)
 *
 * Statiska data för mockup-fas. När datamodellen i docs/sta-pages-plan.md
 * implementeras byts dessa exporter ut mot Supabase-queries.
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
// PARTICIPANT MOCK (Anna Karlsson)
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

export interface WeekPlanItem {
  weekday: 'MÅN' | 'TIS' | 'ONS' | 'TOR' | 'FRE'
  date: string
  title: string
  meta: string
  status: 'done' | 'today' | 'upcoming'
}

export interface StaStrength {
  text: string
  fromActivity?: string
}

export const PARTICIPANT_MOCK = {
  firstName: 'Anna',
  lastName: 'Karlsson',
  currentPart: 1 as StaPart,
  currentDay: 8,
  totalDays: 21,
  startedAt: '2026-04-30',
  partStartedAt: '2026-04-30',
  weeklyHours: 25,
  onboardingCompletedAt: null as string | null,
  focusOccupation: null as string | null,
  adaptations: ['Kortare aktivitetspass (45 min)', 'Tysta rum vid behov', 'Möjlighet att gå utomhus'],
  languageSupport: [] as string[],

  consultant: {
    name: 'Erik Lindgren',
    initials: 'EL',
    nextMeeting: 'Tisdag 14 maj, 10:00',
  },

  todayActivity: {
    day: 7,
    title: 'Sömn och återhämtning',
    description: 'En kort genomgång och en övning. Tar runt 45 minuter. Du kan göra den i din egen takt.',
    timeRange: '13:00–13:45',
    href: '/steg-till-arbete/dag/7',
  },

  weekPlan: [
    { weekday: 'MÅN', date: 'Mån 12 maj', title: 'Dag 6 — Karriärvägledning del 2', meta: 'Övning + reflektion · 1 timme', status: 'done' },
    { weekday: 'TIS', date: 'Idag', title: 'Dag 7 — Sömn och återhämtning', meta: 'Idag, 13:00 · 45 min', status: 'today' },
    { weekday: 'ONS', date: 'Imorgon', title: 'Dag 8 — Nutrition och träning', meta: 'Övning + reflektion · 1 timme', status: 'upcoming' },
    { weekday: 'TOR', date: 'Tor 14 maj', title: 'Möte med Erik (din konsulent)', meta: 'Kontoret, 10:00 · 30 min', status: 'upcoming' },
    { weekday: 'FRE', date: 'Fre 16 maj', title: 'Dag 9 — Fem faktorer för fysisk aktivitet', meta: 'Övning + reflektion · 1 timme', status: 'upcoming' },
  ] as WeekPlanItem[],

  strengths: [
    { text: 'Du är noggrann med detaljer — du märker saker andra missar.' },
    { text: 'Du gillar att lära nytt och frågar smart.' },
    { text: 'Du är lugn i pressade situationer.' },
  ] as StaStrength[],

  recentReflection: {
    mood: '😐',
    text: 'Stressig kväll. Jag tänker mycket på pengar. Hoppas sömnen blir bättre.',
    at: 'Tor 8 maj 19:42',
  },

  resources: [
    { icon: '📘', title: 'Kompendium 1 — Steg till arbete', href: '/knowledge-base' },
    { icon: '🌿', title: 'Hälsoskola (kompendium 2)', href: '/knowledge-base' },
    { icon: '🎯', title: 'Karriärvägledningshäfte 1', href: '/knowledge-base' },
    { icon: '😴', title: 'Sovboken — guide till bättre sömn', href: '/knowledge-base' },
  ],

  // 14 day arbetsslinga (Del 1) — based on actual STA material from sta/Del 1
  dailyExercises: [
    { day: 1, title: 'Fysisk aktivitet', shortTitle: 'Fysisk aktivitet', status: 'completed', durationMin: 60, reflection: 'Skönt att börja röra på mig igen.' },
    { day: 2, title: 'Vem är jag, vad kan jag, vad vill jag?', shortTitle: 'Vem är jag?', status: 'completed', durationMin: 60 },
    { day: 3, title: 'Stress', shortTitle: 'Stress', status: 'completed', durationMin: 60, reflection: 'Insåg att stress påverkar mig mest på kvällar.' },
    { day: 4, title: 'Funktionsnedsättning eller ohälsa', shortTitle: 'Funktionsneds.', status: 'completed', durationMin: 60 },
    { day: 5, title: 'Karriärvägledning del 1', shortTitle: 'Karriärväg. 1', status: 'completed', durationMin: 60 },
    { day: 6, title: 'Karriärvägledning del 2', shortTitle: 'Karriärväg. 2', status: 'completed', durationMin: 60 },
    { day: 7, title: 'Sömn och återhämtning', shortTitle: 'Sömn', status: 'today', durationMin: 45, scheduledFor: 'Idag 13:00' },
    { day: 8, title: 'Nutrition och träning', shortTitle: 'Nutrition', status: 'tomorrow', durationMin: 60 },
    { day: 9, title: 'Fem faktorer för fysisk aktivitet', shortTitle: '5 faktorer', status: 'upcoming', durationMin: 60 },
    { day: 10, title: 'Timeboxing och tidsplanering', shortTitle: 'Timeboxing', status: 'upcoming', durationMin: 60 },
    { day: 11, title: 'Motivation', shortTitle: 'Motivation', status: 'upcoming', durationMin: 60 },
    { day: 12, title: 'Självförtroende och självkänsla', shortTitle: 'Självkänsla', status: 'upcoming', durationMin: 60 },
    { day: 13, title: 'Mål och delmål', shortTitle: 'Mål', status: 'upcoming', durationMin: 60 },
    { day: 14, title: 'Hantera din stress', shortTitle: 'Hantera stress', status: 'upcoming', durationMin: 60 },
  ] as DailyExercise[],

  // Del 2 mock (work stations) — visas som lokalvy när Anna är där
  // Notera: dagResources nedan används också (rendreras separat)
  workStations: [
    { id: 'admin', name: 'Administration', desc: 'Sortera, registrera, hantera dokument', tried: false, icon: '📋' },
    { id: 'kundmottagning', name: 'Kundmottagning', desc: 'Möta människor, hjälpa med frågor', tried: false, icon: '👋' },
    { id: 'lager', name: 'Lager', desc: 'Plocka, packa, fylla på', tried: false, icon: '📦' },
    { id: 'produktion', name: 'Produktion', desc: 'Tillverka eller bygga ihop', tried: false, icon: '🔧' },
  ],

  // Placeholder för del 3 och 4
  workplace: null as null | { name: string; role: string; startedAt: string; weeksIn: number; weeksTotal: number; supervisor: string },
  jobReadiness: null as null | { cvUpdated: boolean; interviewTraining: number; applications: number },
}

// ============================================================================
// VECKOSTRUKTUR — Del 1 kartläggningsperioden
// ============================================================================
//
// Del 1 är 3 veckor och 14 schemalagda dagar. Vi ger varje vecka ett tydligt
// fokus så att deltagaren förstår vart resan tar vägen — och hur dagens övning
// passar in i en större bild. Varje vecka kopplar till nästa steg mot arbete.

export interface WeekTheme {
  weekNumber: 1 | 2 | 3
  title: string
  subtitle: string
  /** En kort förklaring som lägger fokus på stegförflyttning mot arbete */
  arbetsmarknadKoppling: string
  /** Två-tre nyckelfrågor som deltagaren reflekterar över under veckan */
  reflektionsfragor: string[]
  /** Vilka av de 14 dagarna som ingår i veckan */
  days: number[]
  /** Vad veckan landar i — vad har vi sett när veckan är slut? */
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
//
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

/**
 * Mappning från dag-nummer (1-14) i Del 1 till relevant material.
 * - article-IDn refererar till `mockArticlesData[].id`
 * - exercise-IDn refererar till `exercises[].id`
 *
 * Principer:
 * - Existerande KB-artiklar förekommer först (de är allmänna)
 * - Nya STA-komplement-artiklar (sta-*) kommer in där befintliga saknar rätt vinkel
 * - Övningar visas som handling deltagaren kan göra
 */
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
    { kind: 'article', id: 'sta-fem-faktorer', label: 'Fem faktorer för hållbar aktivitet', context: 'Direkt koppling till dagens tema — de fem faktorerna.', estimate: '6 min läsning' },
    { kind: 'exercise', id: 'fem-faktorer-energi', label: 'Fem faktorer — bygg en hållbar vana', context: 'Tillämpa dagens metod på en konkret vana.', estimate: '25–35 min' },
  ],
  10: [
    { kind: 'article', id: 'struktur-jobbsokning', label: 'Skapa struktur i jobbsökningen', context: 'Skriven för jobbsökare men strukturprinciperna är universella.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'tidsplanering', label: 'Strukturera din jobbsökarvecka', context: 'Praktisk veckostrukturering du kan anpassa.', estimate: '25 min' },
  ],
  11: [
    { kind: 'article', id: 'motivation-langsiktig', label: 'Behåll motivationen under långtidssökande', context: 'Långsiktiga strategier som funkar även i kartläggningsfas.', estimate: '8 min läsning' },
    { kind: 'exercise', id: 'motivationsboost', label: 'Motivationsboost för jobbsökaren', context: 'Praktiska verktyg när motivationen sjunker.', estimate: '20 min' },
  ],
  12: [
    { kind: 'article', id: 'styrkor-svagheter', label: 'Identifiera och kommunicera dina styrkor', context: 'Självkänsla börjar med att se vad du faktiskt kan.', estimate: '7 min läsning' },
    { kind: 'exercise', id: 'strengths', label: 'Dina starkaste egenskaper', context: 'Djup övning som passar dagens tema självförtroende.', estimate: '20–30 min' },
  ],
  13: [
    { kind: 'article', id: 'karriarplanering-guide', label: 'Karriärplanering — från vision till verklighet', context: 'Mål blir realistiska när de hängs på en konkret plan.', estimate: '10 min läsning' },
    { kind: 'exercise', id: 'dromjobb', label: 'Drömjobbsanalys', context: 'Konkretisera vad du vill — och vad nästa steg är.', estimate: '30 min' },
  ],
  14: [
    { kind: 'article', id: 'stresshantering', label: 'Stresshantering för arbetssökande', context: 'Genomgång av stresshanteringsverktyg.', estimate: '8 min läsning' },
    { kind: 'article', id: 'sta-saga-nej', label: 'Att säga nej — gränssättning utan dåligt samvete', context: 'Mest effektiva stressminskaren — att inte ta på sig mer än du orkar.', estimate: '6 min läsning' },
    { kind: 'exercise', id: 'saga-nej', label: 'Träna på att säga nej', context: 'Konkret övning där du formulerar dina nej.', estimate: '20–30 min' },
    { kind: 'exercise', id: 'wellbeing', label: 'Hantera stress i jobbsökning', context: 'Sammanställning av verktyg du kan använda löpande.', estimate: '20 min' },
  ],
}

// ============================================================================
// CONSULTANT MOCK
// ============================================================================

export type ParticipantLinkStatus =
  | 'linked'      // Deltagaren har Jobin-konto kopplat
  | 'invited'     // Inbjudan skickad, väntar på registrering
  | 'unlinked'    // Konsulenten har lagt till manuellt, inget Jobin-konto än

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
  /** Är deltagaren kopplad till ett Jobin-konto? Manuellt tillagda är "unlinked". */
  linkStatus: ParticipantLinkStatus
  /** Aktivitetsomfattning i timmar/vecka (10-40) */
  weeklyHours: number
  /** Insats-status — active visas neutralt, paused/cancelled visas tydligt */
  enrollmentStatus: 'active' | 'paused' | 'completed' | 'cancelled'
  /** Telefon/e-post för manuellt tillagda — används för inbjudan eller bara som konsulentens egen kontaktbok */
  manualContact?: { email?: string; phone?: string }
  /** Personnummer (för manuella deltagare som inte är på Jobin — krävs av AF) */
  manualPersonalId?: string
}

export const CONSULTANT_PARTICIPANTS: StaParticipantRow[] = [
  {
    id: 'anna-karlsson',
    initials: 'AK',
    fullName: 'Anna Karlsson',
    focusOccupation: null,
    currentPart: 1,
    daysLeftInPart: 13,
    partEndsAt: '27 maj',
    currentActivity: 'Dag 7/14 · sömn',
    activitySubtext: 'Del 1 dagsslinga',
    activityProgress: 50,
    assessments: [
      { label: 'DOA pågående', status: 'in_progress' },
    ],
    adaptations: 'Kortare pass · tysta rum',
    hasDraft: 1,
    hasMessage: 0,
    linkStatus: 'linked',
    weeklyHours: 20,
    enrollmentStatus: 'active',
  },
  {
    id: 'mahmoud-ali',
    initials: 'MA',
    fullName: 'Mahmoud Ali',
    focusOccupation: 'Lager',
    currentPart: 2,
    daysLeftInPart: 12,
    partEndsAt: '28 maj',
    currentActivity: 'Station: kundmottagning',
    activitySubtext: '3 av 4 stationer testade',
    assessments: [
      { label: 'AWP × 2 ✓', status: 'done' },
      { label: 'AWP idag', status: 'due_today' },
    ],
    adaptations: 'Språkstöd: arabiska · bildstöd',
    hasDraft: 0,
    hasMessage: 2,
    linkStatus: 'linked',
    weeklyHours: 32,
    enrollmentStatus: 'active',
  },
  {
    id: 'johan-lindqvist',
    initials: 'JL',
    fullName: 'Johan Lindqvist',
    focusOccupation: 'Butik/service',
    currentPart: 3,
    daysLeftInPart: 122,
    partEndsAt: '12 sep',
    currentActivity: 'Arbetsprövning · Lidl Sundsvall',
    activitySubtext: 'Vecka 1 av 12',
    assessments: [
      { label: 'AWC/AWP v.1', status: 'in_progress' },
    ],
    adaptations: 'Inga särskilda',
    hasDraft: 0,
    hasMessage: 0,
    linkStatus: 'linked',
    weeklyHours: 40,
    enrollmentStatus: 'active',
  },
  {
    id: 'kerstin-olofsson',
    initials: 'KO',
    fullName: 'Kerstin Olofsson',
    focusOccupation: 'Administration',
    currentPart: 3,
    daysLeftInPart: 6,
    partEndsAt: '18 maj',
    currentActivity: 'Arbetsprövning · Region Västernorrland',
    activitySubtext: 'Anställningssamtal v.21',
    assessments: [{ label: 'Alla ✓', status: 'done' }],
    adaptations: 'Inga särskilda',
    hasDraft: 0,
    hasMessage: 1,
    // Kerstin är manuellt tillagd och har inte registrerat sig på Jobin
    linkStatus: 'unlinked',
    manualContact: { phone: '070-123 45 67' },
    manualPersonalId: '19580412-XXXX',
    weeklyHours: 30,
    enrollmentStatus: 'active',
  },
  {
    id: 'sofia-berg',
    initials: 'SB',
    fullName: 'Sofia Berg',
    focusOccupation: null,
    currentPart: 1,
    daysLeftInPart: 21,
    partEndsAt: '5 jun',
    currentActivity: 'Startsamtal bokat',
    activitySubtext: '15 maj kl 9:00',
    assessments: [{ label: 'Ej startat', status: 'pending' }],
    adaptations: 'Inkommer i startsamtal',
    hasDraft: 0,
    hasMessage: 0,
    // Inbjudan skickad efter startsamtalsbokning, väntar på att Sofia ska registrera sig
    linkStatus: 'invited',
    manualContact: { email: 'sofia.berg@gmail.com' },
    weeklyHours: 25,
    enrollmentStatus: 'active',
  },
  {
    id: 'lars-persson',
    initials: 'LP',
    fullName: 'Lars Persson',
    focusOccupation: null,
    currentPart: 1,
    daysLeftInPart: 18,
    partEndsAt: '2 jun',
    currentActivity: 'Dag 3/14 · stress',
    activitySubtext: 'Del 1 dagsslinga',
    activityProgress: 21,
    assessments: [{ label: 'DOA ej påbörjad', status: 'pending' }],
    adaptations: 'Inga särskilda',
    hasDraft: 0,
    hasMessage: 0,
    linkStatus: 'linked',
    weeklyHours: 15,
    enrollmentStatus: 'paused',
  },
]

// Förslag på Jobin-användare att koppla till en manuellt tillagd deltagare
// (visas i "Koppla till Jobin-konto"-dialogen)
export interface JobinLinkSuggestion {
  userId: string
  fullName: string
  email: string
  initials: string
  registeredAt: string
  matchReason: string
}

export const LINK_SUGGESTIONS_FOR_KERSTIN: JobinLinkSuggestion[] = [
  { userId: 'u-9821', fullName: 'Kerstin Olofsson', email: 'kerstin.o****@gmail.com', initials: 'KO', registeredAt: '3 maj 2026', matchReason: 'Namn + program=steg_till_arbete + samma konsulent' },
  { userId: 'u-7712', fullName: 'Kerstin Ohlsson', email: 'kerstin.ohlsson@****.se', initials: 'KO', registeredAt: '12 apr 2026', matchReason: 'Liknande namn (möjlig felstavning)' },
]

// Counts per part (KPI-rad)
export const CONSULTANT_KPI = {
  active: CONSULTANT_PARTICIPANTS.length,
  perPart: {
    1: CONSULTANT_PARTICIPANTS.filter((p) => p.currentPart === 1).length,
    2: CONSULTANT_PARTICIPANTS.filter((p) => p.currentPart === 2).length,
    3: CONSULTANT_PARTICIPANTS.filter((p) => p.currentPart === 3).length,
    4: CONSULTANT_PARTICIPANTS.filter((p) => p.currentPart === 4).length,
  },
  deadlinesThisWeek: 6,
  deadlinesToday: 2,
  draftsToReview: 3,
  assessmentsInProgress: 7,
}

// Acute deadlines
export interface StaDeadline {
  id: string
  level: 'red' | 'amber' | 'green'
  due: string
  title: string
  participantName: string
  partInfo?: string
  cta: { label: string; primary: boolean }
}

export const CONSULTANT_DEADLINES: StaDeadline[] = [
  { id: 'd1', level: 'red', due: 'Idag 17:00', title: 'Delredovisning Del 1', participantName: 'Anna Karlsson', cta: { label: 'Öppna AI-utkast', primary: true } },
  { id: 'd2', level: 'red', due: 'Idag 17:00', title: 'Skattning AWP — station kundmottagning', participantName: 'Mahmoud Ali', partInfo: 'Del 2', cta: { label: 'Öppna formulär', primary: true } },
  { id: 'd3', level: 'amber', due: 'Om 2 dagar', title: 'Initial planering', participantName: 'Sofia Berg', partInfo: 'start 15 maj', cta: { label: 'Generera utkast', primary: false } },
  { id: 'd4', level: 'amber', due: 'Om 3 dagar', title: 'Anmäl arbetsprövningsplats', participantName: 'Johan Lindqvist', partInfo: 'Företag: Lidl Sundsvall', cta: { label: 'Skicka till AF', primary: false } },
  { id: 'd5', level: 'green', due: 'Om 6 dagar', title: 'Slutredovisning Del 3', participantName: 'Kerstin Olofsson', cta: { label: 'Förbered', primary: false } },
]

// Document drafts
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

export const CONSULTANT_DRAFTS: StaDocumentDraft[] = [
  { id: 'doc-1', docType: 'delredovisning', title: 'Delredovisning Del 1', participantName: 'Anna Karlsson', subtext: 'AI-utkast · 4 sektioner ifyllda', due: 'Inskick idag', dueLevel: 'red', aiDrafted: true },
  { id: 'doc-2', docType: 'initial_planering', title: 'Initial planering', participantName: 'Sofia Berg', subtext: 'Genereras automatiskt efter startsamtal', due: 'Om 2 dgr', dueLevel: 'amber', aiDrafted: false },
  { id: 'doc-3', docType: 'information_arbetsprovning', title: 'Information från arbetsprövningsplats', participantName: 'Johan Lindqvist', subtext: 'Lidl Sundsvall · skickas till AF', due: 'Om 3 dgr', dueLevel: 'amber', aiDrafted: true },
]

// AI weekly summary mock — för per-deltagar-detaljvyn
export const AI_SUMMARY_ANNA = `Anna har genomfört dag 1–6 i den dagliga slingan utan frånvaro. Reflektionerna pekar på att hon har god dag-till-dag-rutin men kämpar med kvällsstress. Hon nämnde i Dag 3 att hon ofta vaknar tidigt; vi flyttar fokus till Dag 7 (sömn) idag.

DOA-självskattningen är 62% klar. Hon har angett höga värden för "noggrannhet" och "tålamod" och låga värden för "uthållighet vid lång tids stillasittande". Det matchar hennes önskemål om kortare pass.

Fokusyrke ej fastställt — vi har två alternativ aktuella: administration och bibliotek/arkiv. Förslag: använd Dag 13 (Mål) för att låta henne reflektera kring båda.`

// Activity timeline for participant (consultant view)
export interface ActivityLogEntry {
  id: string
  date: string
  title: string
  subtext: string
  type: 'activity' | 'reflection' | 'assessment' | 'note'
  highlight?: boolean
}

export const ACTIVITY_LOG_ANNA: ActivityLogEntry[] = [
  { id: 'a1', date: 'Mån 12 maj', title: 'Dag 6 · Karriärvägledning del 2', subtext: '60 min · reflektion sparad', type: 'activity', highlight: true },
  { id: 'a2', date: 'Sön 11 maj', title: 'DOA-självskattning · 12/24 frågor', subtext: 'pågående', type: 'assessment' },
  { id: 'a3', date: 'Fre 9 maj', title: 'Dag 5 · Karriärvägledning del 1', subtext: '60 min', type: 'activity' },
  { id: 'a4', date: 'Tor 8 maj 19:42', title: 'Reflektion · "Stressig kväll, dåligt med sömn"', subtext: 'känsla: 😐 sådär', type: 'reflection' },
  { id: 'a5', date: 'Tor 8 maj', title: 'Dag 4 · Funktionsnedsättning eller ohälsa', subtext: '60 min', type: 'activity' },
  { id: 'a6', date: 'Ons 7 maj', title: 'Dag 3 · Stress', subtext: '60 min · reflektion sparad', type: 'activity' },
  { id: 'a7', date: 'Tis 6 maj', title: 'Kartläggningssamtal 2', subtext: '60 min · Erik och Anna', type: 'note' },
]

// Workplaces (Del 3-4)
export interface StaWorkplace {
  id: string
  companyName: string
  orgNumber?: string
  contactName: string
  contactPhone?: string
  participantName: string
  startedAt: string
  weeksInfo: string
  inriktning: 'aktiverande' | 'introducerande'
  afStatus: 'approved' | 'pending' | 'submitted'
  assessments: string
}

export const CONSULTANT_WORKPLACES: StaWorkplace[] = [
  { id: 'wp-1', companyName: 'Lidl Sundsvall', orgNumber: '556789-1234', contactName: 'Carina Holm', participantName: 'Johan Lindqvist', startedAt: '5 maj', weeksInfo: 'Vecka 1 av 12', inriktning: 'aktiverande', afStatus: 'approved', assessments: 'AWC/AWP v.1 pågående' },
  { id: 'wp-2', companyName: 'Region Västernorrland (vaktmästeri)', orgNumber: '232100-0024', contactName: 'Anders Sundberg', participantName: 'Kerstin Olofsson', startedAt: '24 feb', weeksInfo: 'Vecka 11 av 12', inriktning: 'introducerande', afStatus: 'approved', assessments: 'Alla skattningar klara' },
  { id: 'wp-3', companyName: 'Företag X (ej godkänt än)', contactName: 'Marie Lundgren', participantName: 'Johan Lindqvist', startedAt: '—', weeksInfo: 'Anmäld 12 maj', inriktning: 'aktiverande', afStatus: 'submitted', assessments: '—' },
]

// Assessments overview
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

export const CONSULTANT_ASSESSMENTS: StaAssessmentRow[] = [
  { id: 'as-1', participantName: 'Anna Karlsson', participantInitials: 'AK', instrument: 'DOA', part: 1, progress: 62, status: 'in_progress' },
  { id: 'as-2', participantName: 'Anna Karlsson', participantInitials: 'AK', instrument: 'WRI', part: 1, progress: 0, status: 'pending' },
  { id: 'as-3', participantName: 'Anna Karlsson', participantInitials: 'AK', instrument: 'MOHOST', part: 1, progress: 0, status: 'pending' },
  { id: 'as-4', participantName: 'Mahmoud Ali', participantInitials: 'MA', instrument: 'AWP', part: 2, progress: 80, status: 'in_progress', dueLabel: 'Idag', dueLevel: 'red' },
  { id: 'as-5', participantName: 'Mahmoud Ali', participantInitials: 'MA', instrument: 'AWC', part: 2, progress: 100, status: 'complete' },
  { id: 'as-6', participantName: 'Mahmoud Ali', participantInitials: 'MA', instrument: 'MOHOST', part: 2, progress: 40, status: 'in_progress' },
  { id: 'as-7', participantName: 'Johan Lindqvist', participantInitials: 'JL', instrument: 'AWP', part: 3, progress: 25, status: 'in_progress' },
  { id: 'as-8', participantName: 'Johan Lindqvist', participantInitials: 'JL', instrument: 'AWC', part: 3, progress: 100, status: 'complete' },
  { id: 'as-9', participantName: 'Lars Persson', participantInitials: 'LP', instrument: 'DOA', part: 1, progress: 0, status: 'pending', dueLabel: 'Om 4 dgr', dueLevel: 'amber' },
]
