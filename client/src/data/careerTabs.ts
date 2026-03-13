/**
 * Career Page Tabs Configuration
 * 6 tabs: Utforska, Nätverk, Anpassning, Företag, Karriärplan, Kompetens
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Compass,
  Network,
  Accessibility,
  Building2,
  Target,
  BarChart3,
} from 'lucide-react'

export const careerTabs: Tab[] = [
  { 
    id: 'explore', 
    label: 'Utforska yrken', 
    path: '/career', 
    icon: Compass,
    description: 'Upptäck nya yrkesmöjligheter'
  },
  { 
    id: 'network', 
    label: 'Nätverk', 
    path: '/career/network', 
    icon: Network,
    description: 'Bygg och underhåll ditt nätverk',
    badge: 'Ny!'
  },
  { 
    id: 'adaptation', 
    label: 'Anpassning', 
    path: '/career/adaptation', 
    icon: Accessibility,
    description: 'Arbetsanpassning och stöd',
    badge: 'Ny!'
  },
  { 
    id: 'companies', 
    label: 'Företag', 
    path: '/career/companies', 
    icon: Building2,
    description: 'Utforska arbetsgivare',
    badge: 'Ny!'
  },
  { 
    id: 'plan', 
    label: 'Karriärplan', 
    path: '/career-plan', 
    icon: Target,
    description: 'Skapa din karriärväg'
  },
  { 
    id: 'skills', 
    label: 'Kompetens', 
    path: '/skills-gap', 
    icon: BarChart3,
    description: 'Analysera och utveckla kompetenser'
  },
]
