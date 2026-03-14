import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Compass,
  Calendar,
  BookOpen,
  Dumbbell,
  Mail,
  Target,
  Shield,
  Users,
  Heart,
  Bookmark,
  Sparkles,
} from 'lucide-react'

// Standard navigation för deltagare
export const navItems = [
  { path: '/', label: 'Översikt', icon: LayoutDashboard },
  { path: '/cv', label: 'CV', icon: FileText },
  { path: '/cover-letter', label: 'Personligt brev', icon: Mail },
  { path: '/job-search', label: 'Sök jobb', icon: Briefcase },
  { path: '/career', label: 'Karriär', icon: Target },
  { path: '/interest-guide', label: 'Intresseguide', icon: Compass },
  { path: '/exercises', label: 'Övningar', icon: Dumbbell },
  { path: '/diary', label: 'Dagbok', icon: Heart },
  { path: '/wellness', label: 'Hälsa', icon: Sparkles },
  { path: '/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
  { path: '/resources', label: 'Resurser', icon: Bookmark },
]

// Admin navigation (visas för SUPERADMIN och ADMIN)
export const adminNavItems = [
  { path: '/admin', label: 'Admin Panel', icon: Shield },
]

// Konsulent navigation (visas för CONSULTANT)
export const consultantNavItems = [
  { path: '/consultant', label: 'Mina Deltagare', icon: Users },
]
