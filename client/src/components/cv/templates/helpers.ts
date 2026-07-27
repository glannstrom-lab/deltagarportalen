/**
 * CV Template Helpers - Shared utility functions for CV templates
 */

import type { CVData } from '@/services/supabaseApi'
import type { TemplateCVData } from './types'

/**
 * Filtrera bort halvtomma entries så preview matchar PDF — annars syns
 * "• -" eller bara datum för en oifylld erfarenhet.
 *
 * Låg här i stället för i tre identiska kopior (CVPreview, CVPrintLayout,
 * PagedCVPrint). Returtypen är `TemplateCVData`: efter det här anropet är de
 * sex listorna garanterat arrayer, vilket är precis vad mallarna förutsätter.
 */
export const sanitizeForTemplate = (data: CVData): TemplateCVData => ({
  ...data,
  workExperience: (data.workExperience || []).filter(
    (e) => (e?.title?.trim() || e?.company?.trim()),
  ),
  education: (data.education || []).filter(
    (e) => (e?.degree?.trim() || e?.school?.trim()),
  ),
  skills: (data.skills || []).filter((s) => {
    const name = typeof s === 'string' ? s : s?.name
    return !!name?.trim()
  }),
  languages: (data.languages || []).filter((l) => {
    const name = (l as { language?: string; name?: string })?.language || (l as { name?: string })?.name
    return !!name?.trim()
  }),
  certificates: (data.certificates || []).filter((c) => c?.name?.trim()),
  links: (data.links || []).filter((l) => l?.url?.trim()),
})

export const getLanguageLevelDisplay = (level: string): string => {
  const levelMap: Record<string, string> = {
    'basic': 'Grundläggande',
    'good': 'God',
    'fluent': 'Flytande',
    'native': 'Modersmål',
    'Grundläggande': 'Grundläggande',
    'God': 'God',
    'Flytande': 'Flytande',
    'Modersmål': 'Modersmål',
  }
  return levelMap[level] || level
}

export const getLanguageLevelPercent = (level: string): number => {
  const map: Record<string, number> = {
    'native': 100, 'fluent': 85, 'good': 70, 'basic': 50,
    'Modersmål': 100, 'Flytande': 85, 'God': 70, 'Grundläggande': 50,
  }
  return map[level] || 50
}

export const getSkillName = (skill: string | { name: string; category?: string }): string => {
  return typeof skill === 'string' ? skill : skill?.name || ''
}

/**
 * Initialer för profil-placeholder. Tomma värden hanteras så vi alltid får
 * 1–2 tecken, default "C" + "V" om båda namn saknas.
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const f = (firstName || '').trim()
  const l = (lastName || '').trim()
  if (!f && !l) return 'CV'
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || 'CV'
}
