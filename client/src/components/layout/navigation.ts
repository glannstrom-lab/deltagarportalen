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
} from 'lucide-react'

// Standard navigation för deltagare
// labelKey är nyckeln i översättningsfilen (nav.X)
export const navItems = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/journey', labelKey: 'nav.journey', icon: Map, badge: 'Ny!' },
  { path: '/cv', labelKey: 'nav.cv', icon: FileText },
  { path: '/cover-letter', labelKey: 'nav.coverLetter', icon: Mail },
  { path: '/job-search', labelKey: 'nav.jobSearch', icon: Briefcase },
  { path: '/career', labelKey: 'nav.career', icon: Target },
  { path: '/salary', labelKey: 'nav.salary', icon: Wallet, badge: 'Ny!' },
  { path: '/personal-brand', labelKey: 'nav.personalBrand', icon: Star, badge: 'Ny!' },
  { path: '/interest-guide', labelKey: 'nav.interestGuide', icon: Compass },
  { path: '/exercises', labelKey: 'nav.exercises', icon: Dumbbell },
  { path: '/diary', labelKey: 'nav.diary', icon: Heart },
  { path: '/wellness', labelKey: 'nav.wellness', icon: Sparkles },
  { path: '/international', labelKey: 'nav.international', icon: Globe, badge: 'Ny!' },
  { path: '/knowledge-base', labelKey: 'nav.knowledgeBase', icon: BookOpen },
  { path: '/resources', labelKey: 'nav.resources', icon: Bookmark },
]

// Admin navigation (visas för SUPERADMIN och ADMIN)
export const adminNavItems = [
  { path: '/admin', labelKey: 'nav.adminPanel', icon: Shield },
]

// Konsulent navigation (visas för CONSULTANT)
export const consultantNavItems = [
  { path: '/consultant', labelKey: 'nav.consultantPortal', icon: Users },
]
