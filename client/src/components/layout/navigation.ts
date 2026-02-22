import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Compass,
  Calendar,
  BookOpen,
  Dumbbell,
  Mail,
} from 'lucide-react'

export const navItems = [
  { path: '/', label: 'Översikt', icon: LayoutDashboard },
  { path: '/cv', label: 'CV', icon: FileText },
  { path: '/cover-letter-generator', label: 'Personligt brev', icon: Mail },
  { path: '/job-search', label: 'Sök jobb', icon: Briefcase },
  { path: '/interest-guide', label: 'Intresseguide', icon: Compass },
  { path: '/exercises', label: 'Övningar', icon: Dumbbell },
  { path: '/calendar', label: 'Kalender', icon: Calendar },
  { path: '/knowledge-base', label: 'Kunskapsbank', icon: BookOpen },
]
