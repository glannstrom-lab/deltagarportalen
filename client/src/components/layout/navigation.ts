import type { LegacyColorDomain } from '@/lib/domains'
// `/spontanansökan` och `/nätverk` når koden procentkodade. Utan avkodning
// matchar de aldrig sina literaler och skulle tyst falla ur besökshistoriken —
// samma fälla som slog ut aktiv navigationsmarkering på just de två rutterna.
import { avkodaSokvag } from '@/lib/sokvag'
import {
  LayoutDashboard,
  Briefcase,
  Compass,
  BookOpen,
  Dumbbell,
  Mail,
  Target,
  Shield,
  Users,
  Heart,
  Bookmark,
  Wallet,
  Globe,
  Star,
  FileUser,
  ClipboardList,
  NotebookPen,
  Smile,
  Search,
  GraduationCap,
  Calendar,
  Linkedin,
  TrendingUp,
  Mic,
  Building2,
  UserCheck,
  Bot,
  ExternalLink,
  Printer,
} from '@/components/ui/icons'

// ============================================
// GROUPED NAVIGATION - Reduces cognitive load
// Miller's Law: 7±2 items optimal for working memory
// ============================================

export interface NavItem {
  path: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  isNew?: boolean // Track if feature is new (for smart badge system)
}

export type NavDomain = 'action' | 'reflection' | 'outbound'

export interface NavGroup {
  id: string
  labelKey: string
  /** Semantisk domän — driver färgaccent i sidebaren (DESIGN.md 2026-04-28) */
  domain: NavDomain
  /** Fallback-label om i18n-nyckeln saknas */
  fallbackLabel: string
  items: NavItem[]
}

// Smart badge system: Only show badge for most recent unvisited feature
// This is tracked via localStorage in the component
export const NEWEST_FEATURE = '/ai-team' // Change this when launching new features

/**
 * Domängrupperad navigation — 3 semantiska domäner enligt DESIGN.md.
 * Mobilnavigation använder den platta `navItems`-listan nedan, så denna
 * omorganisation påverkar bara desktop-sidebaren.
 */
export const navGroups: NavGroup[] = [
  {
    id: 'action',
    labelKey: 'nav.groups.action',
    domain: 'action',
    fallbackLabel: 'Översikt',
    items: [
      { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { path: '/profile', labelKey: 'nav.profile', icon: Users },
      { path: '/my-consultant', labelKey: 'nav.myConsultant', icon: UserCheck },
      { path: '/ai-team', labelKey: 'nav.aiTeam', icon: Bot, isNew: true },
      { path: '/nätverk', labelKey: 'nav.network', icon: Users },
      { path: '/knowledge-base', labelKey: 'nav.knowledgeBase', icon: BookOpen },
      { path: '/resources', labelKey: 'nav.myDocuments', icon: Bookmark },
    ],
  },
  {
    id: 'reflection',
    labelKey: 'nav.groups.reflection',
    domain: 'reflection',
    fallbackLabel: 'Reflektion',
    items: [
      { path: '/cv', labelKey: 'nav.cv', icon: FileUser },
      { path: '/cover-letter', labelKey: 'nav.coverLetter', icon: Mail },
      { path: '/wellness', labelKey: 'nav.wellness', icon: Smile },
      { path: '/diary', labelKey: 'nav.diary', icon: NotebookPen },
      { path: '/career', labelKey: 'nav.career', icon: Target },
      { path: '/interest-guide', labelKey: 'nav.interestGuide', icon: Compass },
      { path: '/skills-gap-analysis', labelKey: 'nav.skillsGap', icon: TrendingUp },
      { path: '/personal-brand', labelKey: 'nav.personalBrand', icon: Star },
      { path: '/education', labelKey: 'nav.education', icon: GraduationCap },
      { path: '/interview-simulator', labelKey: 'nav.interviewSimulator', icon: Mic },
      { path: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
      { path: '/exercises', labelKey: 'nav.exercises', icon: Dumbbell },
    ],
  },
  {
    id: 'outbound',
    labelKey: 'nav.groups.outbound',
    domain: 'outbound',
    fallbackLabel: 'Utåtriktat',
    items: [
      { path: '/job-search', labelKey: 'nav.jobSearch', icon: Search },
      { path: '/applications', labelKey: 'nav.applications', icon: ClipboardList },
      { path: '/spontanansökan', labelKey: 'nav.spontaneous', icon: Building2, isNew: true },
      { path: '/salary', labelKey: 'nav.salary', icon: Wallet },
      { path: '/print-resources', labelKey: 'nav.printResources', icon: Printer, isNew: true },
      { path: '/externa-resurser', labelKey: 'nav.externalResources', icon: ExternalLink },
    ],
  },
]

// Flat list for backward compatibility (mobile nav, etc.)
export const navItems = navGroups.flatMap(group => group.items)

// Admin navigation (visas för SUPERADMIN och ADMIN)
export const adminNavItems = [
  { path: '/admin', labelKey: 'nav.adminPanel', icon: Shield },
]

// Konsulent navigation (visas för CONSULTANT)
export const consultantNavItems = [
  { path: '/consultant', labelKey: 'nav.consultantPortal', icon: Users },
]

// ============================================
// VISITED FEATURES TRACKING
// For smart "Ny!" badge - only show for unvisited
// ============================================
const VISITED_FEATURES_KEY = 'jobin_visited_features'

export function getVisitedFeatures(): string[] {
  try {
    const stored = localStorage.getItem(VISITED_FEATURES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function markFeatureVisited(path: string): void {
  try {
    const visited = getVisitedFeatures()
    if (!visited.includes(path)) {
      visited.push(path)
      localStorage.setItem(VISITED_FEATURES_KEY, JSON.stringify(visited))
    }
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================
// SENAST BESÖKTA SIDOR
// ============================================
/**
 * Tidsordnad besökshistorik — separat från `VISITED_FEATURES_KEY`.
 *
 * `getVisitedFeatures()` ovan är en **mängd i förstabesöksordning utan
 * tidsstämplar**. Den duger till "Ny!"-brickan (har jag sett den här sidan
 * någon gång?) men kan inte svara på "vad gjorde jag senast?" — försöker man
 * ändå får man en lista i den ordning användaren upptäckte portalen, vilket
 * är nästan omvänd sanning för den som varit inne länge.
 *
 * Därför en egen nyckel med `{ path, ts }`. Den skrivs från `Layout.tsx` vid
 * varje ruttbyte, alltså oavsett om sidomenyn eller toppnaven är på.
 *
 * **Varför det behövdes:** fram till 2026-08-18 anropades `markFeatureVisited`
 * bara från `Sidebar.tsx` — och sidomenyn renderas inte när toppnaven är på,
 * vilket den är som default sedan `c7c11ca2`. Ingen besökshistorik skrevs
 * alltså någonsin i drift, och Översiktens rad 2 fastnade för alltid på
 * fallbacken "Börja här". Buggen syntes inte i testerna, som sätter
 * localStorage själva i stället för att navigera.
 */
const SENASTE_SIDOR_KEY = 'jobin_senaste_sidor'

/** Hur många besök som sparas. Raden visar högst åtta; resten är historik. */
const SENASTE_TAK = 20

export interface SenastBesokt {
  path: string
  /** Millisekunder sedan epoch. */
  ts: number
}

/**
 * Sökvägar som får hamna i historiken.
 *
 * Unionen av båda navigationsmodellerna: `navHubs` är sanningen för hubbarna
 * (se CLAUDE.md) medan `navGroups`/`navItems` fortfarande driver mobilens
 * hamburgermeny. Att bara läsa den ena hade tappat sidor som finns i den andra.
 * `navHubs` deklareras längre ner i filen — det går bra, funktionen körs långt
 * efter att modulen initierats.
 */
function kandaSidor(): Set<string> {
  return new Set([
    ...navItems.map((i) => i.path),
    ...navHubs.flatMap((h) => h.items.map((i) => i.path)),
  ])
}

export function senasteBesok(): SenastBesokt[] {
  try {
    const rått = localStorage.getItem(SENASTE_SIDOR_KEY)
    if (!rått) return []
    const tolkat: unknown = JSON.parse(rått)
    if (!Array.isArray(tolkat)) return []
    // Filtrera bort skräp: en post utan giltig `ts` kan inte sorteras, och en
    // sökväg som inte längre finns i navigationen ska inte länkas till.
    const giltigaPaths = kandaSidor()
    return (tolkat as SenastBesokt[])
      .filter((p) => p && typeof p.path === 'string' && typeof p.ts === 'number' && giltigaPaths.has(p.path))
      .sort((a, b) => b.ts - a.ts)
  } catch {
    return []
  }
}

/**
 * Registrera ett besök. Anropas vid varje ruttbyte.
 *
 * Bara sökvägar som finns i navigationen sparas — annars hade hubbrötter,
 * djuplänkar och 404:or hamnat i listan, och raden hade pekat på sidor som
 * inte är verktyg.
 */
export function registreraBesok(path: string): void {
  try {
    const sokvag = avkodaSokvag(path)
    if (!kandaSidor().has(sokvag)) return
    const utan = senasteBesok().filter((p) => p.path !== sokvag)
    const nästa = [{ path: sokvag, ts: Date.now() }, ...utan].slice(0, SENASTE_TAK)
    localStorage.setItem(SENASTE_SIDOR_KEY, JSON.stringify(nästa))
  } catch {
    // localStorage kan vara blockerad (privat läge, hårda kakinställningar).
    // Historiken är en bekvämlighet, inte en funktion — fail open.
  }
}

export function shouldShowBadge(item: NavItem): boolean {
  // Only show badge if:
  // 1. Feature is marked as new
  // 2. It's the newest feature (NEWEST_FEATURE)
  // 3. User hasn't visited it yet
  if (!item.isNew) return false
  if (item.path !== NEWEST_FEATURE) return false

  const visited = getVisitedFeatures()
  return !visited.includes(item.path)
}

// ============================================
// HUB NAVIGATION (v1.0 milestone — Phase 1; permanent sedan 2026-07-10, C3)
// 5 domain-oriented hubs. navGroups ovan lever kvar för mobilens
// MobileMainMenu ("alla sidor"-hamburgermenyn i Layout.tsx).
// ============================================

export type HubId = 'oversikt' | 'jobb' | 'karriar' | 'resurser' | 'min-vardag'

export interface NavHub {
  id: HubId
  path: string
  labelKey: string
  fallbackLabel: string
  /** Design domain — drives --c-* tokens in sidebar, bottom nav, and on hub page */
  domain: LegacyColorDomain
  icon: React.ComponentType<{ className?: string }>
  /** Pages reachable via this hub. Used by pageToHub map and active-hub detection.
   *  NEVER add a path here that also appears in another hub. */
  memberPaths: string[]
  /** Deep-link sub-items shown beneath the hub when expanded in sidebar */
  items: NavItem[]
}

export const navHubs: NavHub[] = [
  {
    id: 'oversikt',
    path: '/oversikt',
    labelKey: 'nav.hubs.oversikt',
    fallbackLabel: 'Översikt',
    domain: 'action',
    icon: LayoutDashboard,
    // Översikt is a meta-hub — it owns no leaf pages, only the hub page itself.
    // '/' is included so legacy bookmarks resolve cleanly until the redirect runs.
    memberPaths: ['/'],
    items: [],
  },
  {
    id: 'jobb',
    path: '/jobb',
    labelKey: 'nav.hubs.jobb',
    fallbackLabel: 'Söka jobb',
    domain: 'activity',
    icon: Briefcase,
    memberPaths: [
      '/job-search',
      '/applications',
      '/spontanansökan',
      '/cv',
      '/cover-letter',
      '/interview-simulator',
      '/salary',
      '/linkedin-optimizer',
      '/international',
    ],
    items: [
      { path: '/job-search', labelKey: 'nav.jobSearch', icon: Search },
      { path: '/applications', labelKey: 'nav.applications', icon: ClipboardList },
      { path: '/spontanansökan', labelKey: 'nav.spontaneous', icon: Building2 },
      { path: '/cv', labelKey: 'nav.cv', icon: FileUser },
      { path: '/cover-letter', labelKey: 'nav.coverLetter', icon: Mail },
      { path: '/interview-simulator', labelKey: 'nav.interviewSimulator', icon: Mic },
      { path: '/salary', labelKey: 'nav.salary', icon: Wallet },
      { path: '/linkedin-optimizer', labelKey: 'nav.linkedinOptimizer', icon: Linkedin },
      { path: '/international', labelKey: 'nav.international', icon: Globe },
    ],
  },
  {
    id: 'karriar',
    path: '/karriar',
    labelKey: 'nav.hubs.karriar',
    fallbackLabel: 'Karriär',
    domain: 'coaching',
    icon: Target,
    memberPaths: [
      '/career',
      '/interest-guide',
      '/skills-gap-analysis',
      '/personal-brand',
      '/education',
    ],
    items: [
      { path: '/career', labelKey: 'nav.career', icon: Target },
      { path: '/interest-guide', labelKey: 'nav.interestGuide', icon: Compass },
      { path: '/skills-gap-analysis', labelKey: 'nav.skillsGap', icon: TrendingUp },
      { path: '/personal-brand', labelKey: 'nav.personalBrand', icon: Star },
      { path: '/education', labelKey: 'nav.education', icon: GraduationCap },
    ],
  },
  {
    id: 'resurser',
    path: '/resurser',
    labelKey: 'nav.hubs.resurser',
    fallbackLabel: 'Resurser',
    domain: 'info',
    icon: BookOpen,
    memberPaths: [
      '/knowledge-base',
      '/resources',
      '/print-resources',
      '/externa-resurser',
      '/ai-team',
      '/help',
      '/nätverk',
    ],
    items: [
      { path: '/knowledge-base', labelKey: 'nav.knowledgeBase', icon: BookOpen },
      { path: '/resources', labelKey: 'nav.myDocuments', icon: Bookmark },
      { path: '/print-resources', labelKey: 'nav.printResources', icon: Printer },
      { path: '/externa-resurser', labelKey: 'nav.externalResources', icon: ExternalLink },
      { path: '/ai-team', labelKey: 'nav.aiTeam', icon: Bot, isNew: true },
      { path: '/nätverk', labelKey: 'nav.network', icon: Users },
    ],
  },
  {
    id: 'min-vardag',
    path: '/min-vardag',
    labelKey: 'nav.hubs.min-vardag',
    fallbackLabel: 'Min vardag',
    domain: 'wellbeing',
    icon: Heart,
    memberPaths: [
      '/wellness',
      '/diary',
      '/calendar',
      '/exercises',
      '/my-consultant',
      // Tillagd 2026-08-17. `/profile` låg i navGroups men i ingen hub, så
      // `pageToHub` mappade den inte: uppmätt i webbläsaren markerades ingen
      // huvudkategori som aktiv på /profile, och undersidesraden föll från
      // hubbens 5 länkar till 3. Deltagaren klickade sig in via kortet "Din
      // profil" på Min vardag och navigationen tappade bort var hen var.
      // Kortet i MinVardagHub.tsx har pekat hit hela tiden — det var
      // memberPaths som saknade sidan, precis som CLAUDE.md:s hub-tabell
      // redan säger (Min vardag innehåller Profile). Fallgrop 2.
      '/profile',
    ],
    items: [
      { path: '/wellness', labelKey: 'nav.wellness', icon: Smile },
      { path: '/diary', labelKey: 'nav.diary', icon: NotebookPen },
      { path: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
      { path: '/exercises', labelKey: 'nav.exercises', icon: Dumbbell },
      { path: '/my-consultant', labelKey: 'nav.myConsultant', icon: UserCheck },
      { path: '/profile', labelKey: 'nav.profile', icon: Users },
    ],
  },
]

/**
 * Lookup map: deep-link path -> owning hub id.
 * Built at module load by iterating navHubs[].memberPaths.
 * NEVER use URL prefix matching for active-hub detection (PITFALLS.md Pitfall 2).
 */
export const pageToHub: Record<string, HubId> = (() => {
  const map: Record<string, HubId> = {}
  for (const hub of navHubs) {
    for (const path of hub.memberPaths) {
      map[path] = hub.id
    }
    // Also map the hub's own path (e.g. '/jobb' -> 'jobb')
    map[hub.path] = hub.id
  }
  return map
})()

/**
 * Resolve which hub owns a given pathname.
 * Strategy: explicit map lookup, with fallback for sub-paths under a member path
 * (e.g. '/cv/builder' resolves to 'jobb' because '/cv' is a member of 'jobb').
 * Returns undefined for unknown paths (e.g. '/login', '/admin', '/settings').
 */
export function getActiveHub(pathname: string): NavHub | undefined {
  // Avkoda URL-encoded tecken (t.ex. /spontanans%C3%B6kan -> /spontanansökan)
  // så att member-paths med svenska tecken matchar oavsett browser-beteende.
  const decoded = (() => {
    try {
      return decodeURIComponent(pathname)
    } catch {
      return pathname
    }
  })()

  // Exact match first
  const directHubId = pageToHub[decoded]
  if (directHubId) {
    return navHubs.find(h => h.id === directHubId)
  }
  // Sub-path match: find a member path that the pathname starts with + '/'
  for (const hub of navHubs) {
    for (const memberPath of hub.memberPaths) {
      if (decoded === memberPath || decoded.startsWith(memberPath + '/')) {
        return hub
      }
    }
  }
  return undefined
}

// VITE_HUB_NAV_ENABLED + isHubNavEnabled() borttagna 2026-07-10 (C3):
// hub-nav har varit permanent på i alla miljöer sedan v1.0-utrullningen.
// OBS: navGroups är INTE död kod — mobilens MobileMainMenu (Layout.tsx)
// renderar den som "alla sidor"-hamburgermeny.
