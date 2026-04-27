/**
 * Cover Letter Template Definitions
 * Visual templates for cover letter preview and PDF export
 */

import type { LucideIcon } from 'lucide-react'

export interface CoverLetterTemplateConfig {
  id: string
  name: string
  description: string
  icon: string // Icon name from lucide-react
  colors: {
    header: string      // Header/name color (hex)
    text: string        // Main text color (hex)
    muted: string       // Secondary text color (hex)
    accent: string      // Lines/details color (hex)
    headerBg?: string   // Header background (for modern layout)
  }
  layout: 'classic' | 'modern' | 'minimal'
  fontFamily: 'sans' | 'serif'
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplateConfig[] = [
  {
    id: 'professional',
    name: 'Professionell',
    description: 'Klassisk och tidlös design för de flesta branscher',
    icon: 'FileText',
    layout: 'classic',
    fontFamily: 'sans',
    colors: {
      header: '#0f172a',    // slate-900
      text: '#1e293b',      // slate-800
      muted: '#64748b',     // slate-500
      accent: '#14b8a6'     // teal-500
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Ren och luftig med färgaccent',
    icon: 'Sparkles',
    layout: 'modern',
    fontFamily: 'sans',
    colors: {
      header: '#1e40af',    // blue-800
      text: '#1e293b',      // slate-800
      muted: '#64748b',     // slate-500
      accent: '#3b82f6',    // blue-500
      headerBg: '#eff6ff'   // blue-50
    }
  },
  {
    id: 'minimal',
    name: 'Minimalistisk',
    description: 'Enkel och fokuserad utan överflöd',
    icon: 'Minus',
    layout: 'minimal',
    fontFamily: 'sans',
    colors: {
      header: '#171717',    // neutral-900
      text: '#171717',      // neutral-900
      muted: '#737373',     // neutral-500
      accent: '#171717'     // neutral-900
    }
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Formell med serif-typsnitt för ledningspositioner',
    icon: 'Briefcase',
    layout: 'classic',
    fontFamily: 'serif',
    colors: {
      header: '#0f172a',    // slate-900
      text: '#0f172a',      // slate-900
      muted: '#475569',     // slate-600
      accent: '#d4af37'     // gold
    }
  }
]

export const getTemplateById = (id: string): CoverLetterTemplateConfig | undefined => {
  return COVER_LETTER_TEMPLATES.find(t => t.id === id)
}

export const getDefaultTemplate = (): CoverLetterTemplateConfig => {
  return COVER_LETTER_TEMPLATES[0]
}

// Template props interface for preview components
export interface CoverLetterTemplateProps {
  content: string
  company?: string
  jobTitle?: string
  date: string
  sender: {
    name: string
    email?: string
    phone?: string
    location?: string
  }
  template: CoverLetterTemplateConfig
  className?: string
}
