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

export interface NavGroup {
  id: string
  labelKey: string
  items: NavItem[]
}

// Smart badge system: Only show badge for most recent unvisited feature
// This is tracked via localStorage in the component
export const NEWEST_FEATURE = '/spontanansökan' // Change this when launching new features

// Grouped navigation for reduced cognitive load
export const navGroups: NavGroup[] = [
  {
    id: 'job-search',
    labelKey: 'nav.groups.jobSearch',
    items: [
      { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { path: '/journey', labelKey: 'nav.journey', icon: Map, isNew: true },
      { path: '/cv', labelKey: 'nav.cv', icon: FileUser },
      { path: '/cover-letter', labelKey: 'nav.coverLetter', icon: Mail },
      { path: '/job-search', labelKey: 'nav.jobSearch', icon: Search },
      { path: '/applications', labelKey: 'nav.applications', icon: ClipboardList },
      { path: '/spontanansökan', labelKey: 'nav.spontaneous', icon: Building2, isNew: true },
      { path: '/calendar', labelKey: 'nav.calendar', icon: Calendar },
    ],
  },
  {
    id: 'development',
    labelKey: 'nav.groups.development',
    items: [
      { path: '/career', labelKey: 'nav.career', icon: Target },
      { path: '/education', labelKey: 'nav.education', icon: GraduationCap, isNew: true },
      { path: '/personal-brand', labelKey: 'nav.personalBrand', icon: Star },
      { path: '/linkedin-optimizer', labelKey: 'nav.linkedinOptimizer', icon: Linkedin },
      { path: '/skills-gap-analysis', labelKey: 'nav.skillsGap', icon: TrendingUp },
      { path: '/interview-simulator', labelKey: 'nav.interviewSimulator', icon: Mic },
      { path: '/salary', labelKey: 'nav.salary', icon: Wallet },
      { path: '/interest-guide', labelKey: 'nav.interestGuide', icon: Compass },
    ],
  },
  {
    id: 'wellbeing',
    labelKey: 'nav.groups.wellbeing',
    items: [
      { path: '/diary', labelKey: 'nav.diary', icon: NotebookPen }, // Unique icon
      { path: '/wellness', labelKey: 'nav.wellness', icon: Smile }, // Unique icon
      { path: '/exercises', labelKey: 'nav.exercises', icon: Dumbbell },
    ],
  },
  {
    id: 'resources',
    labelKey: 'nav.groups.resources',
    items: [
      { path: '/knowledge-base', labelKey: 'nav.knowledgeBase', icon: BookOpen },
      { path: '/international', labelKey: 'nav.international', icon: Globe, isNew: true },
      { path: '/resources', labelKey: 'nav.resources', icon: Bookmark },
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
