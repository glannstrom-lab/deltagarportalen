/**
 * CV Page Tabs Configuration
 * 5 tabs: Skapa CV, Mina CV, Mallar, ATS-analys, CV-tips
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  FileEdit,
  Folder,
  Layout,
  Target,
  BookOpen,
} from 'lucide-react'

export const cvTabs: Tab[] = [
  { 
    id: 'create', 
    label: 'Skapa CV', 
    path: '/dashboard/cv', 
    icon: FileEdit 
  },
  { 
    id: 'my-cvs', 
    label: 'Mina CV', 
    path: '/dashboard/cv/my-cvs', 
    icon: Folder 
  },
  { 
    id: 'templates', 
    label: 'Mallar', 
    path: '/dashboard/cv/templates', 
    icon: Layout 
  },
  { 
    id: 'ats', 
    label: 'ATS-analys', 
    path: '/dashboard/cv/ats', 
    icon: Target 
  },
  { 
    id: 'tips', 
    label: 'CV-tips', 
    path: '/dashboard/cv/tips', 
    icon: BookOpen 
  },
]
