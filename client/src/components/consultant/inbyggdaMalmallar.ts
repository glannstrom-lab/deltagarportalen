/**
 * De inbyggda målmallarna — EN källa för måldialogen (GoalCreationDialog) och
 * Resurser → Målmallar.
 *
 * RK21/RR17 (rollspelet 2026-09-27): måldialogen visade fem mallar medan
 * Resurser → Målmallar sa "Inga mallar matchade din sökning" utan att någon
 * sökt — Resurser läste bara konsulentens egna rader i
 * consultant_goal_templates, och de fem mallarna låg inlåsta i dialogen.
 */
export type MalmallKategori = 'cv' | 'job_search' | 'interview' | 'networking' | 'skills'

export interface InbyggdMalmall {
  id: string
  title: string
  category: MalmallKategori
  description: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
  defaultDeadlineDays: number
}

export const INBYGGDA_MALMALLAR: readonly InbyggdMalmall[] = [
  {
    id: 'cv-improve',
    title: 'Förbättra CV till 80+ poäng',
    category: 'cv',
    description: 'Uppnå ett CV-score på minst 80% genom optimering',
    specific: 'Förbättra mitt CV så att det får minst 80 poäng i ATS-systemet genom att optimera nyckelord, struktur och innehåll',
    measurable: 'CV-poängen ökar från nuvarande nivå till minst 80/100',
    achievable: 'Genomförbart genom att följa CV-guiden steg för steg och få feedback',
    relevant: 'Högre CV-poäng ökar chansen att passera automatiska urvalssystem',
    timeBound: '2 veckor',
    defaultDeadlineDays: 14,
  },
  {
    id: 'job-applications',
    title: 'Skicka 10 ansökningar per vecka',
    category: 'job_search',
    description: 'Systematiskt jobbsökande med fokus på kvalitet',
    specific: 'Skicka 10 kvalitativa, anpassade jobbansökningar varje vecka inom mitt yrkesområde',
    measurable: '10 ansökningar loggade i systemet varje vecka',
    achievable: 'Ca 2 ansökningar per dag, 5 dagar i veckan är rimligt',
    relevant: 'Fler kvalitativa ansökningar ökar chansen att få intervjuer',
    timeBound: 'Pågående, utvärdering varje fredag',
    defaultDeadlineDays: 7,
  },
  {
    id: 'interview-prep',
    title: 'Förbereda för intervju',
    category: 'interview',
    description: 'Strukturerad förberedelse inför kommande intervju',
    specific: 'Förbereda svar på de 10 vanligaste intervjufrågorna och researcha företaget grundligt',
    measurable: '10 förberedda svar nedskrivna, 5 frågor till arbetsgivaren, företagsresearch klar',
    achievable: 'Använd intervjusimulatorn och läs guider i kunskapsbanken',
    relevant: 'God förberedelse ökar chansen att imponera och få jobbet',
    timeBound: 'Klart minst 2 dagar före intervjun',
    defaultDeadlineDays: 5,
  },
  {
    id: 'linkedin-network',
    title: 'Utöka LinkedIn-nätverket',
    category: 'networking',
    description: 'Strategiskt nätverkande för att öka synlighet',
    specific: 'Anslut med 20 nya relevanta kontakter inom min bransch och engagera mig i minst 5 inlägg per vecka',
    measurable: '20 nya accepterade kontakter, 5 kommentarer/delningar per vecka',
    achievable: 'Skicka 3-4 personliga inbjudningar dagligen',
    relevant: 'Större nätverk ökar chansen att hitta dolda jobbmöjligheter',
    timeBound: '1 månad',
    defaultDeadlineDays: 30,
  },
  {
    id: 'new-skill',
    title: 'Lära sig ny kompetens',
    category: 'skills',
    description: 'Strukturerat lärande av efterfrågad kompetens',
    specific: 'Genomföra en online-kurs inom vald kompetens och tillämpa kunskapen i ett eget projekt',
    measurable: 'Kurs genomförd med certifikat, projekt dokumenterat',
    achievable: '1-2 timmar studier per dag under kursperioden',
    relevant: 'Ökar anställningsbarhet och ger konkurrensfördelar',
    timeBound: '4 veckor',
    defaultDeadlineDays: 28,
  },
]
