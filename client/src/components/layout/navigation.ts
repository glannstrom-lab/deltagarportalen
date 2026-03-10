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
  BookHeart,
  Bookmark,
} from 'lucide-react'

// Standard navigation för deltagare
export const navItems = [
  { path: '/dashboard', label: 'Översikt', icon: LayoutDashboard },
  { path: '/dashboard/cv', label: 'CV', icon: FileText },
  { path: '/dashboard/cover-letter', label: 'Personligt brev', icon: Mail },
  { path: '/dashboard/job-search', label: 'Sök jobb', icon: Briefcase },
  { path: '/dashboard/career', label: 'Karriär', icon: Target },
  { path: '/dashboard/interest-guide', label: 'Intresseguide', icon: Compass },
  { path: '/dashboard/exercises', label: 'Övningar', icon: Dumbbell },
  { path: '/dashboard/diary', label: 'Dagbok', icon: BookHeart },
  { path: '/dashboard/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
  { path: '/dashboard/resources', label: 'Resurser', icon: Bookmark },
]

// Admin navigation (visas för SUPERADMIN och ADMIN)
export const adminNavItems = [
  { path: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
]

// Konsulent navigation (visas för CONSULTANT)
export const consultantNavItems = [
  { path: '/dashboard/consultant', label: 'Mina Deltagare', icon: Users },
]
