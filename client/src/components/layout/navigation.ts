import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Compass,
  Calendar,
  BookOpen,
} from 'lucide-react'

export const navItems = [
  { path: '/', label: 'Översikt', icon: LayoutDashboard },
  { path: '/cv', label: 'CV', icon: FileText },
  { path: '/job-search', label: 'Sök jobb', icon: Briefcase },
  { path: '/interest-guide', label: 'Intresseguide', icon: Compass },
  { path: '/calendar', label: 'Kalender', icon: Calendar },
  { path: '/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
]
