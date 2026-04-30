import type { LegacyColorDomain } from '@/lib/domains'
import {
  LayoutDashboard,
  FileText,
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
  Sparkles,
  Wallet,
  Globe,
  Star,
  Map,
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
      { path: '/linkedin-optimizer', labelKey: 'nav.linkedinOptimizer', icon: Linkedin },
      { path: '/salary', labelKey: 'nav.salary', icon: Wallet },
      { path: '/international', labelKey: 'nav.international', icon: Globe },
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
// HUB NAVIGATION (v1.0 milestone — Phase 1)
// 5 domain-oriented hubs replacing the flat 27-item nav
// Coexists with navGroups via VITE_HUB_NAV_ENABLED
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
      '/international',
      '/linkedin-optimizer',
    ],
    items: [
      { path: '/job-search', labelKey: 'nav.jobSearch', icon: Search },
      { path: '/applications', labelKey: 'nav.applications', icon: ClipboardList },
      { path: '/spontanansökan', labelKey: 'nav.spontaneous', icon: Building2 },
      { path: '/cv', labelKey: 'nav.cv', icon: FileUser },
      { path: '/cover-letter', labelKey: 'nav.coverLetter', icon: Mail },
      { path: '/interview-simulator', labelKey: 'nav.interviewSimulator', icon: Mic },
      { path: '/salary', labelKey: 'nav.salary', icon: Wallet },
      { path: '/international', labelKey: 'nav.international', icon: Globe },
      { path: '/linkedin-optimizer', labelKey: 'nav.linkedinOptimizer', icon: Linkedin },
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

/**
 * Read VITE_HUB_NAV_ENABLED once at module load.
 * Default: false (old navigation stays active until env var is explicitly set to 'true').
 * Per STATE.md decision: rollout via env flag only, no per-user DB flag (PITFALLS.md Pitfall 16).
 */
const HUB_NAV_FLAG = import.meta.env.VITE_HUB_NAV_ENABLED === 'true'

export function isHubNavEnabled(): boolean {
  return HUB_NAV_FLAG
}
