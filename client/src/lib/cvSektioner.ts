/**
 * Vilka delar av ett sparat CV som är tomma (FN4, "Fortsätt där du slutade").
 *
 * Det enda utkast som faktiskt sparas i molnet är CV:t självt — autosparet
 * skriver raden i `cvs` löpande. `user_drafts`/`draftsApi` har noll anropare
 * och noll rader i prod (mätt 2026-10-30), och övriga utkast (intervju,
 * spontanansökan) bor i webbläsaren och syns inte för Översikten. Därför bygger
 * "fortsätt" på CV-raden och inget annat.
 *
 * Ordningen är CV-byggarens: profil, erfarenhet, utbildning, kompetenser.
 */

export type CvSektion = 'summary' | 'work_experience' | 'education' | 'skills'

export const CV_SEKTIONER: readonly CvSektion[] = ['summary', 'work_experience', 'education', 'skills']

export interface CvRadForSektioner {
  first_name?: string | null
  summary?: string | null
  work_experience?: unknown
  education?: unknown
  skills?: unknown
}

function harInnehall(v: unknown): boolean {
  if (typeof v === 'string') return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  return false
}

export function tommaCvSektioner(rad: CvRadForSektioner): CvSektion[] {
  return CV_SEKTIONER.filter((s) => !harInnehall(rad[s]))
}

/** Har personen börjat? Ett namn eller minst en ifylld sektion räcker. */
export function arCvPaborjat(rad: CvRadForSektioner): boolean {
  return harInnehall(rad.first_name) || CV_SEKTIONER.some((s) => harInnehall(rad[s]))
}
