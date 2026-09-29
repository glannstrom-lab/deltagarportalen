/**
 * EG3: vilket steg CV-byggaren ska öppna på. Ett CV som redan finns återupptas
 * på första ofullständiga steg (2–5), eller Granska när allt är ifyllt.
 * Den som saknar CV börjar på mallvalet (steg 1).
 */
interface CvUnderlag {
  firstName?: string
  lastName?: string
  title?: string
  summary?: string
  workExperience?: Array<{ title?: string; company?: string } | null>
  education?: Array<{ degree?: string; school?: string } | null>
  skills?: Array<string | { name?: string } | null>
}

export function cvStartSteg(cv: CvUnderlag | null | undefined): number {
  if (!cv || !(cv.firstName || cv.lastName || cv.title || cv.summary)) return 1
  if (!(cv.firstName && cv.lastName)) return 2
  if (!cv.summary) return 3
  const harJobbEllerUtb =
    (cv.workExperience ?? []).some(e => e?.title?.trim() || e?.company?.trim()) ||
    (cv.education ?? []).some(e => e?.degree?.trim() || e?.school?.trim())
  if (!harJobbEllerUtb) return 4
  const harKompetens = (cv.skills ?? []).some(s => {
    const n = typeof s === 'string' ? s : s?.name
    return !!n?.trim()
  })
  if (!harKompetens) return 5
  return 6
}
