import { type AbsenceKind } from '@/services/staApi'

// ===========================================================================
// HELPERS — frånvaro-formatering
// ===========================================================================

export function formatAbsenceDate(iso: string): string {
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export function labelForAbsenceKind(kind: AbsenceKind): string {
  switch (kind) {
    case 'sick': return 'Sjuk'
    case 'vab': return 'VAB'
    case 'allowed': return 'Beviljad frånvaro'
    case 'other': return 'Annan orsak'
  }
}

