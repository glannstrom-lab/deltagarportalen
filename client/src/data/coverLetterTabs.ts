/**
 * Cover Letter Page Tabs Configuration
 * 5 tabs: Skriv brev, Mina brev, Dina ansökningar, Färdiga mallar, Din statistik
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  FileEdit,
  Folder,
  Send,
  Layout,
  BarChart3,
} from 'lucide-react'

export const coverLetterTabs: Tab[] = [
  { 
    id: 'write', 
    label: 'Skriv brev', 
    path: '/dashboard/cover-letter', 
    icon: FileEdit 
  },
  { 
    id: 'my-letters', 
    label: 'Mina brev', 
    path: '/dashboard/cover-letter/my-letters', 
    icon: Folder 
  },
  { 
    id: 'applications', 
    label: 'Dina ansökningar', 
    path: '/dashboard/cover-letter/applications', 
    icon: Send 
  },
  { 
    id: 'templates', 
    label: 'Färdiga mallar', 
    path: '/dashboard/cover-letter/templates', 
    icon: Layout 
  },
  { 
    id: 'statistics', 
    label: 'Din statistik', 
    path: '/dashboard/cover-letter/statistics', 
    icon: BarChart3 
  },
]
