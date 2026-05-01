/**
 * CV Template Helpers - Shared utility functions for CV templates
 */

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
