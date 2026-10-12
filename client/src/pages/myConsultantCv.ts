/** Vilka delar av CV:t som har innehåll. Ett faktum, inte ett betyg (ingen procent i deltagarvyn). */
export const CV_DEL_STANDARD = {
  summary: 'Sammanfattning',
  work_experience: 'Erfarenhet',
  education: 'Utbildning',
  skills: 'Kompetenser',
} as const

export type CvDel = keyof typeof CV_DEL_STANDARD

export const CV_DEL_NYCKEL: Record<CvDel, string> = {
  summary: 'myConsultant.sharedInfo.cvPart.summary',
  work_experience: 'myConsultant.sharedInfo.cvPart.workExperience',
  education: 'myConsultant.sharedInfo.cvPart.education',
  skills: 'myConsultant.sharedInfo.cvPart.skills',
}

export function cvIfyllda(cv: Partial<Record<CvDel, unknown>>): CvDel[] {
  return (Object.keys(CV_DEL_STANDARD) as CvDel[]).filter((k) => {
    const v = cv[k]
    if (typeof v === 'string') return v.trim().length > 0
    if (Array.isArray(v)) return v.length > 0
    return false
  })
}
