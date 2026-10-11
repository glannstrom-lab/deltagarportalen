/** Passtypens ord i Min vecka — hela nycklar som literaler, så grinden för döda nycklar ser dem. */
import type { ActivityType } from '@/services/aktivitetSchema'

export const TYP_NYCKEL: Record<ActivityType, string> = {
  motivation: 'minVecka.typ.motivation',
  language: 'minVecka.typ.language',
  jobsearch: 'minVecka.typ.jobsearch',
  workplace: 'minVecka.typ.workplace',
  jobsearch_own: 'minVecka.typ.jobsearch_own',
  sfi: 'minVecka.typ.sfi',
  studier: 'minVecka.typ.studier',
  vagledning: 'minVecka.typ.vagledning',
  halsa: 'minVecka.typ.halsa',
}
