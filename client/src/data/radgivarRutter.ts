/**
 * Vilka rutter har rådgivarinnehåll — och vilken nyckel i `PAGE_COACH_CONTENT`.
 *
 * Egen fil av en enda anledning: `Layout.tsx` behöver veta *om* en sida har en
 * rådgivare innan den bestämmer sig för att reservera en 300 px-kolumn åt
 * panelen. Frågan är billig; svaret ligger i `coaches.ts`, som är 43 kB text
 * och lazy-laddas med panelen. Att importera den från Layout hade dragit in
 * hela rådgivartexten i entry-bundlen för en boolean.
 *
 * Tabellen och `coaches.ts` PAGE_COACH_CONTENT har exakt samma nyckelmängd
 * (kontrollerat 2026-08-18: noll rutter utan innehåll, noll innehåll utan
 * rutt). Det är därför `harRadgivarinnehall` kan svara utan att läsa texten.
 * Vaktas av `radgivarRutter.test.ts` — glider de isär reserverar layouten
 * plats åt en panel som renderar null igen.
 */

import { avkodaSokvag } from '@/lib/sokvag'

/**
 * Mappar URL-pathname → pageKey i `PAGE_COACH_CONTENT`. Längsta match vinner,
 * så att t.ex. /career/credentials matchar `career` även om /career har en
 * mer specifik pageKey senare.
 */
export const ROUTE_TO_PAGE_KEY: Array<[string, string]> = [
  // Hubbarna. De fyra kategorierna fick rådgivarinnehåll 2026-08-18 — fram till
  // dess saknade de det, och högerkolumnen renderades därför inte alls på dem
  // (se `harRadgivarinnehall` och Layout.tsx).
  ['/oversikt', 'dashboard'],
  ['/jobb', 'jobbHub'],
  ['/karriar', 'karriarHub'],
  ['/resurser', 'resurserHub'],
  ['/min-vardag', 'vardagHub'],
  // Verktygssidor — ordnade alfabetiskt
  ['/ai-team', 'aiTeam'],
  ['/applications', 'applications'],
  ['/calendar', 'calendar'],
  ['/career', 'career'],
  ['/cover-letter', 'coverLetter'],
  ['/cv', 'cv'],
  ['/diary', 'diary'],
  ['/education', 'education'],
  ['/exercises', 'exercises'],
  ['/external-resources', 'resources'],
  ['/externa-resurser', 'resources'],
  ['/interest-guide', 'interestGuide'],
  ['/international', 'international'],
  ['/interview-simulator', 'interviewSimulator'],
  ['/job-search', 'jobSearch'],
  ['/knowledge-base', 'knowledgeBase'],
  ['/linkedin-optimizer', 'linkedinOptimizer'],
  ['/my-consultant', 'myConsultant'],
  ['/personal-brand', 'personalBrand'],
  ['/print-resources', 'resources'],
  ['/profile', 'profile'],
  ['/resources', 'resources'],
  ['/salary', 'salary'],
  ['/settings', 'settings'],
  ['/skills-gap-analysis', 'skillsGapAnalysis'],
  ['/spontanansökan', 'spontaneous'],
  ['/spontaneous', 'spontaneous'],
  ['/wellness', 'wellness'],
]

export function getPageKeyForPath(pathname: string): string | undefined {
  if (!pathname) return undefined
  // Avkoda först: `/spontanansökan` når hit som `/spontanans%C3%B6kan` och
  // matchade aldrig raden i tabellen, så rådgivaren försvann på just de två
  // rutter som har svenska tecken. Se lib/sokvag.ts.
  const sokvag = avkodaSokvag(pathname)
  // Längsta-match-vinner
  let best: [string, string] | null = null
  for (const entry of ROUTE_TO_PAGE_KEY) {
    if (sokvag === entry[0] || sokvag.startsWith(entry[0] + '/')) {
      if (!best || entry[0].length > best[0].length) best = entry
    }
  }
  return best?.[1]
}

/** Har sidan en rådgivare att visa? Frågan Layout ställer före den reserverar plats. */
export function harRadgivarinnehall(pathname: string): boolean {
  return getPageKeyForPath(pathname) !== undefined
}
