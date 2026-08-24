/**
 * Vilka innehållsmoduler som översätts, och vilka av deras exporter som bär
 * text. Listan används av extraktorn, av grinden och av körningen — lägg till
 * en modul här och alla tre följer med.
 *
 * `ladda` returnerar bara de exporter som ska översättas. Exporter som är
 * uppslagstabeller för kod (t.ex. `riasecColors`) ska INTE med: de innehåller
 * CSS-klasser, inte text.
 */
export interface Innehallsmodul {
  namn: string
  ladda: () => Promise<Record<string, unknown>>
}

export const INNEHALLSMODULER: Innehallsmodul[] = [
  {
    namn: 'exercises',
    ladda: async () => {
      const m = await import('@/data/exercises')
      return { exercises: m.exercises }
    },
  },
  {
    namn: 'interestGuide',
    ladda: async () => {
      const m = await import('@/services/interestGuideData')
      return {
        sections: m.sections,
        allQuestions: m.allQuestions,
        occupations: m.occupations,
        icfAdaptations: m.icfAdaptations,
        riasecNames: m.riasecNames,
        bigFiveNames: m.bigFiveNames,
      }
    },
  },
  {
    namn: 'externaResurser',
    ladda: async () => {
      const m = await import('@/data/externaResurser')
      return { EXTERNA_RESURSER: m.EXTERNA_RESURSER, HUVUDFLIKAR: m.HUVUDFLIKAR }
    },
  },
  {
    namn: 'coaches',
    ladda: async () => {
      const m = await import('@/data/coaches')
      return { COACHES: m.COACHES, PAGE_COACH_CONTENT: m.PAGE_COACH_CONTENT }
    },
  },
]
