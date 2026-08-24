// ==========================================
// INTRESSEGUIDE - ALL DATA
// Baserat på intress.html
// ==========================================

// ===== TYPER =====

export interface Question {
  id: string
  text: string
  category: string
  section: SectionId
  type: 'likert' | 'slider'
  subtext?: string
  lowLabel?: string
  highLabel?: string
}

export type SectionId = 'riasec' | 'bigfive' | 'strong' | 'icf'

export interface Section {
  id: SectionId
  name: string
  subtitle: string
  count: number
}

export interface RiasecScores {
  R: number // Realistic
  I: number // Investigative
  A: number // Artistic
  S: number // Social
  E: number // Enterprising
  C: number // Conventional
}

export interface BigFiveScores {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  stability: number
}

export interface ICFScores {
  kognitiv: number      // Kognitiv funktion - minne, planering, problemlösning
  kommunikation: number // Social kommunikation och samarbete
  koncentration: number // Uppmärksamhet och fokus
  motorik: number       // Grov- och finmotorik, rörlighet
  sensorisk: number     // Hantering av sinnesintryck
  energi: number        // Energinivå och uthållighet
}

export interface StrongInterestCategories {
  teknik_mekanik: number
  natur_vetenskap: number
  konst_kultur: number
  social_vard: number
  affarer_forsaljning: number
  administration_kontor: number
  utomhusarbete: number
  ledarskap_organisation: number
  data_it: number
  undervisning_pedagogik: number
}

/**
 * Hur många svar varje dimension faktiskt vilar på.
 *
 * Fanns inte före 2026-08-21, och det var därför omöjligt för en vy att skilja
 * "användaren svarade lågt" från "användaren svarade inte alls":
 * `calculateUserProfile` initierade RIASEC till 0, Big Five till 50, intressen
 * till 50 och ICF till 3, och skrev bara över det som hade svar. En dimension
 * utan underlag renderades alltså som "Realistisk 0/5" och "Öppenhet 50 %" —
 * omöjligt att skilja från en mätning. Vyer som påstår något om användaren ska
 * kontrollera coverage först och annars visa en invit, aldrig ett tal.
 */
export interface ProfileCoverage {
  riasec: Record<keyof RiasecScores, number>
  bigFive: Record<keyof BigFiveScores, number>
  icf: Record<keyof ICFScores, number>
  strongInterest: Record<keyof StrongInterestCategories, number>
  /** Antal besvarade frågor totalt. */
  answered: number
  /** Antal frågor i testet. */
  total: number
}

export interface UserProfile {
  riasec: RiasecScores
  bigFive: BigFiveScores
  icf: ICFScores
  strongInterest: StrongInterestCategories
  coverage: ProfileCoverage
}

export interface JobRequirements {
  vard?: number
  forskning?: number
  analytisk?: number
  social?: number
  noggrannhet?: number
  kommunikation?: number
  teknisk?: number
  it?: number
  kreativ?: number
  ekonomi?: number
  pedagogik?: number
  natur?: number
  praktisk?: number
  stresshantering?: number
  ledarskap_organisation?: number
  administration_kontor?: number
  konst_kultur?: number
  affarer_forsaljning?: number
}

export interface JobChallenges {
  fysisk_rorlighet?: number
  fysisk_styrka?: number
  social_energi?: number
  tidspress?: number
  multitasking?: number
  koncentration?: number
  stillasittande?: number
  repetitivt?: number
  flexibilitet?: number
  sensorisk?: number
  precision?: number
  kvallsarbete?: number
  osakra_forutsattningar?: number
  emotionell_belastning?: number
  jetlag?: number
  social_isolering?: number
  social_isolation?: number
  utomhusarbete?: number
}

export interface JobEducation {
  name: string
  length: string
  type: string
}

export interface Occupation {
  id: string
  name: string
  description: string
  riasec: RiasecScores
  bigFive: BigFiveScores
  icf: ICFScores
  categories: JobRequirements
  challenges: JobChallenges
  salary: string
  education: JobEducation
  prognosis: 'growing' | 'stable' | 'declining'
  relatedJobs: string[]
  careerPath: string[]
  requiresUniversity: boolean
}

/**
 * Varför ett yrke hamnade där det hamnade.
 *
 * Tillagd 2026-08-21. Listan var tidigare en rangordning utan motivering:
 * användaren fick ett tal och en ordning, men ingen möjlighet att bedöma om
 * den stämde. För en deltagare som ska fatta ett livsval på det här är
 * "varför" viktigare än "hur mycket".
 */
export interface MatchForklaring {
  /** Delpoängen bakom rangordningen. `andel` är vikten i procent. */
  delar: { namn: string; andel: number; poang: number }[]
  /** Användarens svar som drog UPP matchningen, starkast först. */
  drogUpp: string[]
  /** Användarens svar som drog NER den. */
  drogNer: string[]
  /** En mening i klartext, redo att visas. */
  sammanfattning: string
}

export interface JobMatch {
  occupation: Occupation
  matchPercentage: number
  isSuitable: boolean
  needsAdaptation: boolean
  adaptations?: string[]
  warnings?: string[]
  forklaring: MatchForklaring
}

export interface ICFAdaptation {
  name: string
  description: string
  adaptations: string[]
}

// ===== SEKTIONER =====

export const sections: Section[] = [
  { id: 'riasec', name: 'RIASEC', subtitle: 'Upptäck din arbetsstil', count: 6 },
  { id: 'bigfive', name: 'Big Five', subtitle: 'Din personlighetsprofil', count: 10 },
  { id: 'strong', name: 'Intresseområden', subtitle: 'Vad intresserar dig?', count: 10 },
  { id: 'icf', name: 'ICF - Funktionsförutsättningar', subtitle: 'Dina förutsättningar för arbete', count: 8 },
]

// ===== FRÅGOR =====

// RIASEC Frågor (6 st - 1 per kategori) - Tydligare formuleringar
const riasecQuestions: Omit<Question, 'type'>[] = [
  { 
    id: 'r1', 
    text: 'Jag tycker om praktiskt arbete med händerna, som att meka, bygga eller arbeta med maskiner', 
    category: 'R', 
    section: 'riasec',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  { 
    id: 'i1', 
    text: 'Jag gillar att analysera problem, forska och förstå hur saker fungerar', 
    category: 'I', 
    section: 'riasec',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  { 
    id: 'a1', 
    text: 'Jag tycker om att vara kreativ, skapa nya saker och uttrycka mig estetiskt', 
    category: 'A', 
    section: 'riasec',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  { 
    id: 's1', 
    text: 'Jag trivs med att hjälpa, undervisa eller stötta andra människor', 
    category: 'S', 
    section: 'riasec',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  { 
    id: 'e1', 
    text: 'Jag gillar att leda, påverka andra, sälja eller driva projekt', 
    category: 'E', 
    section: 'riasec',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  { 
    id: 'c1', 
    text: 'Jag tycker om att organisera, strukturera och arbeta med siffror eller detaljer', 
    category: 'C', 
    section: 'riasec',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
]

// Big Five Frågor (10 st - 2 per trait) - Tydligare formuleringar
const bigFiveQuestions: Omit<Question, 'type'>[] = [
  { 
    id: 'bf_o1', 
    text: 'Jag är nyfiken på nya idéer och gillar att prova nya sätt att göra saker på', 
    category: 'openness', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_o2', 
    text: 'Jag uppskattar konst, kreativitet och att tänka i nya banor', 
    category: 'openness', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_c1', 
    text: 'Jag är noggrann, organiserad och fullföljer det jag påbörjar', 
    category: 'conscientiousness', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_c2', 
    text: 'Jag planerar mitt arbete väl och håller deadlines', 
    category: 'conscientiousness', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_e1', 
    text: 'Jag är utåtriktad, pratsam och trivs i sociala sammanhang', 
    category: 'extraversion', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_e2', 
    text: 'Jag får energi av att vara med andra människor', 
    category: 'extraversion', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_a1', 
    text: 'Jag bryr mig om andra människor och är hjälpsam', 
    category: 'agreeableness', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_a2', 
    text: 'Jag samarbetar väl med andra och försöker undvika konflikter', 
    category: 'agreeableness', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_n1', 
    text: 'Jag hanterar stress och påfrestningar väl', 
    category: 'stability', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
  { 
    id: 'bf_n2', 
    text: 'Jag är stabil i humöret och återhämtar mig snabbt från motgångar', 
    category: 'stability', 
    section: 'bigfive',
    lowLabel: 'Stämmer inte',
    highLabel: 'Stämmer mycket bra'
  },
]

// Strong Interest Inventory (10 frågor) - Konsekvent "Jag intresserar mig för..." format
const strongInterestQuestions: Omit<Question, 'type'>[] = [
  {
    id: 'si1',
    text: 'Jag intresserar mig för teknik, mekanik och att förstå hur saker fungerar',
    category: 'teknik_mekanik',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si2',
    text: 'Jag intresserar mig för naturvetenskap, biologi, kemi och forskning',
    category: 'natur_vetenskap',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si3',
    text: 'Jag intresserar mig för konst, kultur, design och kreativt skapande',
    category: 'konst_kultur',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si4',
    text: 'Jag intresserar mig för att hjälpa och stötta människor i svåra situationer',
    category: 'social_vard',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si5',
    text: 'Jag intresserar mig för affärer, försäljning och att driva egna projekt',
    category: 'affarer_forsaljning',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si6',
    text: 'Jag intresserar mig för administration, kontorsarbete och organisation',
    category: 'administration_kontor',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si7',
    text: 'Jag intresserar mig för utomhusarbete och att arbeta i naturen',
    category: 'utomhusarbete',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si8',
    text: 'Jag intresserar mig för att leda, organisera och styra projekt',
    category: 'ledarskap_organisation',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si9',
    text: 'Jag intresserar mig för data, IT, programmering och digitala system',
    category: 'data_it',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
  {
    id: 'si10',
    text: 'Jag intresserar mig för att undervisa, lära ut och förklara saker för andra',
    category: 'undervisning_pedagogik',
    section: 'strong',
    lowLabel: 'Stämmer inte alls',
    highLabel: 'Stämmer helt'
  },
]

// ICF-baserad arbetsstilsmodell (8 frågor) - Integrerar fysiska aspekter
const icfQuestions: Omit<Question, 'type'>[] = [
  { 
    id: 'icf_cog', 
    text: 'Jag har lätt att komma ihåg saker, planera mitt arbete och lösa problem', 
    category: 'kognitiv', 
    section: 'icf', 
    lowLabel: 'Mycket svårt för mig',
    highLabel: 'Mycket lätt för mig'
  },
  { 
    id: 'icf_com', 
    text: 'Jag kan uttrycka mig tydligt, förstå sociala koder och samarbeta med andra', 
    category: 'kommunikation', 
    section: 'icf', 
    lowLabel: 'Mycket svårt för mig',
    highLabel: 'Mycket lätt för mig'
  },
  { 
    id: 'icf_con', 
    text: 'Jag kan fokusera på uppgifter under längre tid och ignorera störningar', 
    category: 'koncentration', 
    section: 'icf', 
    lowLabel: 'Mycket svårt för mig',
    highLabel: 'Mycket lätt för mig'
  },
  { 
    id: 'icf_mot_grov', 
    text: 'Jag kan röra mig fritt, stå, gå och hantera fysiska arbetsuppgifter', 
    category: 'motorik', 
    section: 'icf', 
    lowLabel: 'Mycket svårt för mig',
    highLabel: 'Mycket lätt för mig'
  },
  { 
    id: 'icf_mot_fin', 
    text: 'Jag har stadiga händer och klarar precisionsarbete som kräver noggrannhet', 
    category: 'motorik', 
    section: 'icf', 
    lowLabel: 'Mycket svårt för mig',
    highLabel: 'Mycket lätt för mig'
  },
  { 
    id: 'icf_sen', 
    text: 'Jag hanterar ljud, ljus och andra sinnesintryck bra utan att bli överväldigad', 
    category: 'sensorisk', 
    section: 'icf', 
    lowLabel: 'Bli lätt överväldigad',
    highLabel: 'Hanterar det bra'
  },
  { 
    id: 'icf_en_fys', 
    text: 'Jag har ork att vara fysiskt aktiv under arbetsdagen', 
    category: 'energi', 
    section: 'icf', 
    lowLabel: 'Blir trött/snabbt',
    highLabel: 'Mycket ork'
  },
  { 
    id: 'icf_en_men', 
    text: 'Jag har energi att tänka, lära och hantera mentalt krävande uppgifter', 
    category: 'energi', 
    section: 'icf', 
    lowLabel: 'Blir trött/snabbt',
    highLabel: 'Mycket energi'
  },
]

// Kombinera alla frågor
export const allQuestions: Question[] = [
  ...riasecQuestions.map(q => ({ ...q, type: 'likert' as const })),
  ...bigFiveQuestions.map(q => ({ ...q, type: 'likert' as const })),
  ...strongInterestQuestions.map(q => ({ ...q, type: 'likert' as const })),
  ...icfQuestions.map(q => ({ ...q, type: 'slider' as const })),
]

// ===== YRKESDATABAS =====

const occupationsRadata: Occupation[] = [
  // Högskoleyrken
  {
    id: 'lakare',
    name: 'Läkare',
    description: 'Diagnostiserar och behandlar sjukdomar, arbetar med patienter',
    riasec: { R: 2, I: 5, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 50, agreeableness: 75, stability: 70 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 5, motorik: 3, sensorisk: 4, energi: 4 },
    categories: { vard: 5, forskning: 4, analytisk: 4, social: 4, noggrannhet: 5, kommunikation: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 4, tidspress: 4, multitasking: 4, koncentration: 5 },
    salary: '45 000 - 85 000 kr/mån',
    education: { name: 'Läkarprogrammet', length: '5,5 år + AT 1,5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Sjuksköterska', 'Fysioterapeut', 'Psykolog'],
    careerPath: ['AT-läkare', 'ST-läkare', 'Specialistläkare', 'Överläkare'],
    requiresUniversity: true,
  },
  {
    id: 'civilingenjor',
    name: 'Civilingenjör',
    description: 'Utvecklar tekniska lösningar inom olika områden',
    riasec: { R: 4, I: 5, A: 2, S: 2, E: 3, C: 3 },
    bigFive: { openness: 70, conscientiousness: 80, extraversion: 40, agreeableness: 50, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { teknisk: 5, analytisk: 5, it: 4, forskning: 3, noggrannhet: 4 },
    challenges: { stillasittande: 4, koncentration: 5, multitasking: 3 },
    salary: '38 000 - 65 000 kr/mån',
    education: { name: 'Civilingenjörsprogram', length: '5 år', type: 'Teknisk högskola' },
    prognosis: 'growing',
    relatedJobs: ['Programmerare', 'Arkitekt', 'Projektledare'],
    careerPath: ['Junior ingenjör', 'Ingenjör', 'Senior ingenjör', 'Teknikchef'],
    requiresUniversity: true,
  },
  {
    id: 'psykolog',
    name: 'Psykolog',
    description: 'Hjälper människor med psykisk hälsa och beteendeproblem',
    riasec: { R: 1, I: 4, A: 2, S: 5, E: 2, C: 2 },
    bigFive: { openness: 75, conscientiousness: 75, extraversion: 45, agreeableness: 85, stability: 70 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 4, energi: 3 },
    categories: { social: 5, analytisk: 4, kommunikation: 4, pedagogik: 3, vard: 4 },
    challenges: { social_energi: 5, koncentration: 4, stillasittande: 4 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Psykologprogrammet', length: '5 år + PTP 1 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Socionom', 'Skolkurator', 'Läkare'],
    careerPath: ['PTP-psykolog', 'Legitimerad psykolog', 'Specialist'],
    requiresUniversity: true,
  },
  {
    id: 'programmerare',
    name: 'Programmerare/Systemutvecklare',
    description: 'Skapar och underhåller programvara och digitala system',
    riasec: { R: 2, I: 5, A: 2, S: 1, E: 2, C: 3 },
    bigFive: { openness: 75, conscientiousness: 80, extraversion: 30, agreeableness: 50, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 2, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, teknisk: 5, analytisk: 4, noggrannhet: 4 },
    challenges: { stillasittande: 5, koncentration: 5, social_energi: 2 },
    salary: '38 000 - 70 000 kr/mån',
    education: { name: 'Systemvetenskap/Datateknik', length: '3-5 år', type: 'Universitet/YH' },
    prognosis: 'growing',
    relatedJobs: ['Data scientist', 'UX-designer', 'Cybersäkerhetsanalytiker'],
    careerPath: ['Juniorutvecklare', 'Utvecklare', 'Senior', 'Tech Lead'],
    requiresUniversity: true,
  },
  {
    id: 'arkitekt',
    name: 'Arkitekt',
    description: 'Designar byggnader och stadsplanering',
    riasec: { R: 3, I: 3, A: 5, S: 2, E: 3, C: 3 },
    bigFive: { openness: 80, conscientiousness: 75, extraversion: 45, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, teknisk: 4, analytisk: 3, kommunikation: 3, noggrannhet: 4 },
    challenges: { stillasittande: 4, koncentration: 4, multitasking: 3 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Arkitektprogrammet', length: '5 år', type: 'Konsthögskola' },
    prognosis: 'stable',
    relatedJobs: ['Inredningsarkitekt', 'Civilingenjör', 'Landskapsarkitekt'],
    careerPath: ['Praktikant', 'Arkitekt', 'Handläggande arkitekt'],
    requiresUniversity: true,
  },
  {
    id: 'larare',
    name: 'Lärare (gymnasie/universitet)',
    description: 'Undervisar och handleder studenter',
    riasec: { R: 1, I: 3, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 70, conscientiousness: 75, extraversion: 65, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { pedagogik: 5, kommunikation: 5, social: 4, forskning: 3 },
    challenges: { social_energi: 5, fysisk_rorlighet: 3, tidspress: 3, multitasking: 4 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Lärarutbildning', length: '4-5,5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Skolkurator', 'Specialpedagog', 'Rektor'],
    careerPath: ['Lärare', 'Förstelärare', 'Lektor', 'Rektor'],
    requiresUniversity: true,
  },
  {
    id: 'ekonom',
    name: 'Ekonom/Revisor',
    description: 'Arbetar med ekonomisk analys, bokföring och revision',
    riasec: { R: 1, I: 3, A: 1, S: 2, E: 4, C: 5 },
    bigFive: { openness: 50, conscientiousness: 90, extraversion: 40, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { ekonomi: 5, analytisk: 5, noggrannhet: 5 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '35 000 - 60 000 kr/mån',
    education: { name: 'Ekonomprogrammet', length: '3-4 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Civilekonom', 'Controller', 'Revisor'],
    careerPath: ['Junior ekonom', 'Ekonom', 'Controller', 'Ekonomichef'],
    requiresUniversity: true,
  },
  {
    id: 'jurist',
    name: 'Jurist/Advokat',
    description: 'Arbetar med juridiska frågor och företräder klienter',
    riasec: { R: 1, I: 4, A: 1, S: 3, E: 5, C: 4 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 60, agreeableness: 50, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { analytisk: 5, kommunikation: 5, noggrannhet: 5, ledarskap_organisation: 3 },
    challenges: { stillasittande: 4, koncentration: 5, tidspress: 5, social_energi: 4 },
    salary: '40 000 - 90 000 kr/mån',
    education: { name: 'Juristprogrammet', length: '4,5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Åklagare', 'Domare', 'Bolagsjurist'],
    careerPath: ['Biträdande jurist', 'Advokat', 'Delägare'],
    requiresUniversity: true,
  },
  {
    id: 'forskare',
    name: 'Forskare',
    description: 'Bedriver vetenskaplig forskning inom olika områden',
    riasec: { R: 2, I: 5, A: 3, S: 2, E: 2, C: 3 },
    bigFive: { openness: 90, conscientiousness: 80, extraversion: 35, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { forskning: 5, analytisk: 5, noggrannhet: 4 },
    challenges: { stillasittande: 4, koncentration: 5, social_energi: 2 },
    salary: '32 000 - 55 000 kr/mån',
    education: { name: 'Doktorsexamen', length: '8-10 år totalt', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Universitetslektor', 'Data scientist', 'Analytiker'],
    careerPath: ['Doktorand', 'Postdoktor', 'Forskare', 'Docent', 'Professor'],
    requiresUniversity: true,
  },
  {
    id: 'veterinar',
    name: 'Veterinär',
    description: 'Vårdar och behandlar djur',
    riasec: { R: 3, I: 4, A: 1, S: 4, E: 2, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 50, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 3, sensorisk: 4, energi: 4 },
    categories: { natur: 5, vard: 4, analytisk: 4, praktisk: 3 },
    challenges: { fysisk_rorlighet: 4, fysisk_styrka: 3, social_energi: 3, tidspress: 3 },
    salary: '38 000 - 55 000 kr/mån',
    education: { name: 'Veterinärprogrammet', length: '5,5 år', type: 'SLU' },
    prognosis: 'growing',
    relatedJobs: ['Djursjukskötare', 'Djurskötare', 'Agronom'],
    careerPath: ['Veterinär', 'Klinikchef', 'Specialistveterinär'],
    requiresUniversity: true,
  },
  {
    id: 'sjukskoterska',
    name: 'Sjuksköterska',
    description: 'Vårdar patienter och assisterar läkare',
    riasec: { R: 2, I: 3, A: 1, S: 5, E: 2, C: 3 },
    bigFive: { openness: 55, conscientiousness: 85, extraversion: 55, agreeableness: 85, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 5, praktisk: 3, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 5, social_energi: 5, tidspress: 4, multitasking: 5 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Sjuksköterskeprogrammet', length: '3 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Undersköterska', 'Läkare', 'Barnmorska'],
    careerPath: ['Sjuksköterska', 'Specialistsjuksköterska', 'Vårdenhetschef'],
    requiresUniversity: true,
  },
  {
    id: 'marknadsforare',
    name: 'Marknadsförare/PR',
    description: 'Utvecklar strategier för att nå och påverka målgrupper',
    riasec: { R: 1, I: 2, A: 4, S: 3, E: 5, C: 2 },
    bigFive: { openness: 75, conscientiousness: 70, extraversion: 70, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 3, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { kreativ: 4, kommunikation: 5, ekonomi: 3, analytisk: 3 },
    challenges: { tidspress: 4, multitasking: 4, social_energi: 4 },
    salary: '32 000 - 55 000 kr/mån',
    education: { name: 'Medie-/Kommunikationsprogram', length: '3-4 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Journalist', 'Produktchef', 'UX-designer'],
    careerPath: ['Marknadsassistent', 'Marknadsförare', 'Marknadschef'],
    requiresUniversity: true,
  },
  // Icke-högskoleyrken
  {
    id: 'elektriker',
    name: 'Elektriker',
    description: 'Installerar och reparerar elektriska system',
    riasec: { R: 5, I: 3, A: 2, S: 2, E: 2, C: 3 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { teknisk: 5, praktisk: 5, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, koncentration: 4 },
    salary: '28 000 - 42 000 kr/mån',
    education: { name: 'El- och energiprogrammet', length: '3 år gymn + lärling', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['VVS-montör', 'Mekaniker', 'IT-tekniker'],
    careerPath: ['Lärling', 'Elektriker', 'Förman', 'Egen firma'],
    requiresUniversity: false,
  },
  {
    id: 'snickare',
    name: 'Snickare/Byggarbetare',
    description: 'Bygger och renoverar byggnader och strukturer',
    riasec: { R: 5, I: 1, A: 2, S: 2, E: 2, C: 2 },
    bigFive: { openness: 45, conscientiousness: 70, extraversion: 45, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 3, energi: 5 },
    categories: { praktisk: 5, teknisk: 3, noggrannhet: 3 },
    challenges: { fysisk_styrka: 5, fysisk_rorlighet: 5, sensorisk: 3 },
    salary: '27 000 - 38 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Målare', 'Plattsättare', 'Elektriker'],
    careerPath: ['Lärling', 'Snickare', 'Förman', 'Egen firma'],
    requiresUniversity: false,
  },
  {
    id: 'kock',
    name: 'Kock',
    description: 'Lagar mat i restauranger och storkök',
    riasec: { R: 3, I: 1, A: 3, S: 2, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 70, extraversion: 55, agreeableness: 55, stability: 55 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { kreativ: 4, praktisk: 5, stresshantering: 4 },
    challenges: { fysisk_rorlighet: 5, tidspress: 5, sensorisk: 3, multitasking: 5 },
    salary: '25 000 - 38 000 kr/mån',
    education: { name: 'Restaurang- och livsmedelsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Bagare', 'Bartender', 'Restaurangchef'],
    careerPath: ['Commis', 'Kock', 'Souschef', 'Kökschef'],
    requiresUniversity: false,
  },
  {
    id: 'frisor',
    name: 'Frisör',
    description: 'Klipper och stylar hår',
    riasec: { R: 3, I: 1, A: 3, S: 4, E: 3, C: 2 },
    bigFive: { openness: 60, conscientiousness: 70, extraversion: 70, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 3, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { kreativ: 4, social: 4, praktisk: 4 },
    challenges: { fysisk_rorlighet: 5, social_energi: 5, repetitivt: 4 },
    salary: '22 000 - 32 000 kr/mån',
    education: { name: 'Hantverksprogrammet - frisör', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Skönhetsterapeut', 'Stylist', 'Makeupartist'],
    careerPath: ['Lärling', 'Frisör', 'Salongsansvarig', 'Egen salong'],
    requiresUniversity: false,
  },
  {
    id: 'underskoterska',
    name: 'Undersköterska',
    description: 'Ger daglig omsorg och vård till patienter',
    riasec: { R: 2, I: 1, A: 1, S: 5, E: 1, C: 2 },
    bigFive: { openness: 50, conscientiousness: 80, extraversion: 55, agreeableness: 90, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 3, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 5, praktisk: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, social_energi: 5, tidspress: 4 },
    salary: '26 000 - 32 000 kr/mån',
    education: { name: 'Vård- och omsorgsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Sjuksköterska', 'Personlig assistent', 'Hemtjänst'],
    careerPath: ['Undersköterska', 'Specialistundersköterska', 'Samordnare'],
    requiresUniversity: false,
  },
  {
    id: 'chauffor',
    name: 'Lastbilschaufför',
    description: 'Transporterar gods mellan olika platser',
    riasec: { R: 3, I: 1, A: 1, S: 1, E: 1, C: 2 },
    bigFive: { openness: 40, conscientiousness: 75, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { praktisk: 3, noggrannhet: 3 },
    challenges: { stillasittande: 5, koncentration: 4, social_energi: 1, repetitivt: 4 },
    salary: '27 000 - 35 000 kr/mån',
    education: { name: 'Transportprogrammet + CE-körkort', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Taxichaufför', 'Bussförare', 'Logistiker'],
    careerPath: ['Chaufför', 'Åkare', 'Transportledare'],
    requiresUniversity: false,
  },
  {
    id: 'forsaljare',
    name: 'Försäljare/Butiksbiträde',
    description: 'Hjälper kunder och säljer produkter',
    riasec: { R: 1, I: 1, A: 1, S: 4, E: 4, C: 3 },
    bigFive: { openness: 50, conscientiousness: 65, extraversion: 70, agreeableness: 70, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 2, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { social: 4, kommunikation: 4, ekonomi: 2 },
    challenges: { fysisk_rorlighet: 4, social_energi: 5, repetitivt: 3 },
    salary: '23 000 - 30 000 kr/mån',
    education: { name: 'Handelsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'declining',
    relatedJobs: ['Butikschef', 'Inköpare', 'Visual merchandiser'],
    careerPath: ['Säljare', 'Avdelningsansvarig', 'Butikschef'],
    requiresUniversity: false,
  },
  {
    id: 'tradgardsmastare',
    name: 'Trädgårdsmästare',
    description: 'Sköter om trädgårdar, parker och grönytor',
    riasec: { R: 4, I: 1, A: 2, S: 1, E: 1, C: 2 },
    bigFive: { openness: 55, conscientiousness: 70, extraversion: 40, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { natur: 5, praktisk: 5, kreativ: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, social_energi: 2 },
    salary: '25 000 - 33 000 kr/mån',
    education: { name: 'Naturbruksprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Florist', 'Landskapsarkitekt', 'Fastighetsskötare'],
    careerPath: ['Trädgårdsarbetare', 'Trädgårdsmästare', 'Förman'],
    requiresUniversity: false,
  },
  {
    id: 'mekaniker',
    name: 'Mekaniker',
    description: 'Reparerar och underhåller fordon och maskiner',
    riasec: { R: 5, I: 3, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { teknisk: 5, praktisk: 5, analytisk: 3, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, fysisk_styrka: 4, koncentration: 4 },
    salary: '27 000 - 38 000 kr/mån',
    education: { name: 'Fordon- och transportprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Elektriker', 'Lastbilschaufför', 'Industrimekaniker'],
    careerPath: ['Lärling', 'Mekaniker', 'Verkstadschef'],
    requiresUniversity: false,
  },
  {
    id: 'personlig_assistent',
    name: 'Personlig assistent',
    description: 'Hjälper personer med funktionsnedsättningar i vardagen',
    riasec: { R: 2, I: 1, A: 1, S: 5, E: 1, C: 2 },
    bigFive: { openness: 55, conscientiousness: 75, extraversion: 50, agreeableness: 90, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 3, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { social: 5, vard: 4, praktisk: 3 },
    challenges: { fysisk_rorlighet: 4, fysisk_styrka: 3, social_energi: 5, flexibilitet: 4 },
    salary: '24 000 - 30 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Introduktion', type: 'Intern utbildning' },
    prognosis: 'growing',
    relatedJobs: ['Undersköterska', 'Hemtjänst', 'Stödassistent'],
    careerPath: ['Personlig assistent', 'Samordnare', 'Arbetsledare'],
    requiresUniversity: false,
  },
  // Ytterligare yrken för att komma upp i 25+
  {
    id: 'bagare',
    name: 'Bagare/Konditor',
    description: 'Bakar bröd, kakor och andra bakverk',
    riasec: { R: 3, I: 1, A: 3, S: 2, E: 2, C: 3 },
    bigFive: { openness: 55, conscientiousness: 75, extraversion: 40, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, kreativ: 4, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, tidspress: 4, sensorisk: 3 },
    salary: '24 000 - 32 000 kr/mån',
    education: { name: 'Restaurang- och livsmedelsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Kock', 'Konditor', 'Caterare'],
    careerPath: ['Lärling', 'Bagare', 'Köksmästare'],
    requiresUniversity: false,
  },
  {
    id: 'vvs_montor',
    name: 'VVS-montör',
    description: 'Installerar och reparerar värme-, ventilation- och sanitetssystem',
    riasec: { R: 5, I: 2, A: 1, S: 2, E: 2, C: 3 },
    bigFive: { openness: 45, conscientiousness: 75, extraversion: 45, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { teknisk: 5, praktisk: 5, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, koncentration: 4 },
    salary: '28 000 - 40 000 kr/mån',
    education: { name: 'VVS- och fastighetsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Elektriker', 'Snickare', 'Fastighetsskötare'],
    careerPath: ['Lärling', 'VVS-montör', 'Förman'],
    requiresUniversity: false,
  },
  {
    id: 'socionom',
    name: 'Socionom',
    description: 'Arbetar med socialt stöd och hjälp till människor i svårigheter',
    riasec: { R: 1, I: 3, A: 1, S: 5, E: 3, C: 3 },
    bigFive: { openness: 70, conscientiousness: 75, extraversion: 60, agreeableness: 85, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 4, energi: 3 },
    categories: { social: 5, vard: 4, analytisk: 3, kommunikation: 4 },
    challenges: { social_energi: 5, koncentration: 4, stillasittande: 3 },
    salary: '30 000 - 45 000 kr/mån',
    education: { name: 'Socionomprogrammet', length: '3,5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Psykolog', 'Skolkurator', 'Biståndshandläggare'],
    careerPath: ['Socionom', 'Socialsekreterare', 'Enhetschef'],
    requiresUniversity: true,
  },
  {
    id: 'polis',
    name: 'Polis',
    description: 'Arbetar för att upprätthålla lag och ordning',
    riasec: { R: 4, I: 3, A: 1, S: 4, E: 4, C: 3 },
    bigFive: { openness: 55, conscientiousness: 80, extraversion: 65, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { social: 4, praktisk: 4, ledarskap_organisation: 3, analytisk: 3 },
    challenges: { fysisk_rorlighet: 4, fysisk_styrka: 4, social_energi: 4, tidspress: 4 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Polisutbildningen', length: '2,5 år', type: 'Polishögskolan' },
    prognosis: 'stable',
    relatedJobs: ['Väktare', 'Kriminalvårdare', 'Ordningsvakt'],
    careerPath: ['Polisaspirant', 'Polis', 'Polisinspektör', 'Polismästare'],
    requiresUniversity: false,
  },
  // Ytterligare 30+ yrken
  // IT & Data
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    description: 'Analyserar stora datamängder för att hitta mönster och insikter',
    riasec: { R: 2, I: 5, A: 2, S: 2, E: 3, C: 4 },
    bigFive: { openness: 85, conscientiousness: 80, extraversion: 35, agreeableness: 50, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, analytisk: 5, forskning: 4, noggrannhet: 4 },
    challenges: { stillasittande: 5, koncentration: 5, social_energi: 2 },
    salary: '45 000 - 80 000 kr/mån',
    education: { name: 'Data Science/Statistik/Matematik', length: '3-5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Programmerare', 'Data engineer', 'BI-analytiker'],
    careerPath: ['Junior data scientist', 'Data scientist', 'Senior', 'Lead data scientist'],
    requiresUniversity: true,
  },
  {
    id: 'ux_designer',
    name: 'UX-designer',
    description: 'Designar användarupplevelser för digitala produkter',
    riasec: { R: 2, I: 3, A: 5, S: 4, E: 3, C: 2 },
    bigFive: { openness: 85, conscientiousness: 75, extraversion: 55, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, it: 4, analytisk: 3, kommunikation: 4 },
    challenges: { stillasittande: 4, koncentration: 4, tidspress: 3 },
    salary: '35 000 - 60 000 kr/mån',
    education: { name: 'UX-design/Interaktionsdesign', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'growing',
    relatedJobs: ['UI-designer', 'Grafisk designer', 'Frontend-utvecklare'],
    careerPath: ['Junior UX designer', 'UX designer', 'Senior', 'UX Lead'],
    requiresUniversity: true,
  },
  {
    id: 'it_support',
    name: 'IT-supporttekniker',
    description: 'Hjälper användare med tekniska problem och drift av IT-system',
    riasec: { R: 3, I: 4, A: 1, S: 4, E: 2, C: 3 },
    bigFive: { openness: 60, conscientiousness: 75, extraversion: 50, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, teknisk: 4, kommunikation: 4, social: 3 },
    challenges: { social_energi: 4, koncentration: 4, tidspress: 4 },
    salary: '28 000 - 42 000 kr/mån',
    education: { name: 'IT-tekniker/IT-support', length: '2 år', type: 'YH' },
    prognosis: 'growing',
    relatedJobs: ['Systemadministratör', 'Nätverkstekniker', 'Service desk'],
    careerPath: ['IT-support', 'IT-tekniker', 'Team lead support'],
    requiresUniversity: false,
  },
  // Vård & Hälsa
  {
    id: 'fysioterapeut',
    name: 'Fysioterapeut',
    description: 'Hjälper människor att återfå rörelseförmåga efter skada eller sjukdom',
    riasec: { R: 3, I: 4, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 60, agreeableness: 85, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 4, analytisk: 3, praktisk: 4 },
    challenges: { fysisk_rorlighet: 5, social_energi: 4, fysisk_styrka: 3 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Fysioterapeutprogrammet', length: '3 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Arbetsterapeut', 'Sjuksköterska', 'Läkare'],
    careerPath: ['Fysioterapeut', 'Specialist', 'Klinikchef'],
    requiresUniversity: true,
  },
  {
    id: 'arbetsterapeut',
    name: 'Arbetsterapeut',
    description: 'Hjälper människor att utföra vardagliga aktiviteter trots funktionsnedsättning',
    riasec: { R: 2, I: 3, A: 3, S: 5, E: 2, C: 3 },
    bigFive: { openness: 70, conscientiousness: 80, extraversion: 60, agreeableness: 85, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { vard: 5, social: 5, kreativ: 3, praktisk: 3 },
    challenges: { social_energi: 4, koncentration: 4, fysisk_rorlighet: 3 },
    salary: '30 000 - 42 000 kr/mån',
    education: { name: 'Arbetsterapeutprogrammet', length: '3 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Fysioterapeut', 'Sjuksköterska', 'Psykolog'],
    careerPath: ['Arbetsterapeut', 'Specialist', 'Verksamhetschef'],
    requiresUniversity: true,
  },
  {
    id: 'tandlakare',
    name: 'Tandläkare',
    description: 'Undersöker och behandlar tänder och munhälsa',
    riasec: { R: 4, I: 4, A: 2, S: 4, E: 3, C: 4 },
    bigFive: { openness: 65, conscientiousness: 85, extraversion: 55, agreeableness: 75, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 5, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { vard: 5, noggrannhet: 5, teknisk: 4, social: 3 },
    challenges: { fysisk_rorlighet: 4, precision: 5, koncentration: 5, social_energi: 4 },
    salary: '38 000 - 60 000 kr/mån',
    education: { name: 'Tandläkarprogrammet', length: '5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Tandhygienist', 'Tandsköterska', 'Läkare'],
    careerPath: ['Tandläkare', 'Specialisttandläkare', 'Klinikchef'],
    requiresUniversity: true,
  },
  {
    id: 'tandhygienist',
    name: 'Tandhygienist',
    description: 'Förebygger och behandlar munhälsoproblem',
    riasec: { R: 3, I: 3, A: 2, S: 4, E: 2, C: 4 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 55, agreeableness: 80, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 5, sensorisk: 4, energi: 3 },
    categories: { vard: 5, noggrannhet: 5, social: 4 },
    challenges: { precision: 5, koncentration: 4, social_energi: 4 },
    salary: '30 000 - 40 000 kr/mån',
    education: { name: 'Tandhygienistprogrammet', length: '2 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Tandläkare', 'Tandsköterska', 'Sjuksköterska'],
    careerPath: ['Tandhygienist', 'Specialist', 'Klinikchef'],
    requiresUniversity: true,
  },
  // Kreativa yrken
  {
    id: 'grafisk_designer',
    name: 'Grafisk designer',
    description: 'Skapar visuell kommunikation och design för tryck och digitala medier',
    riasec: { R: 2, I: 2, A: 5, S: 2, E: 3, C: 3 },
    bigFive: { openness: 85, conscientiousness: 70, extraversion: 45, agreeableness: 60, stability: 55 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, teknisk: 3, noggrannhet: 4, it: 3 },
    challenges: { stillasittande: 5, koncentration: 4, tidspress: 4 },
    salary: '28 000 - 50 000 kr/mån',
    education: { name: 'Grafisk design/Kommunikation', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['UX-designer', 'Art director', 'Illustratör'],
    careerPath: ['Junior designer', 'Designer', 'Senior', 'Art director'],
    requiresUniversity: true,
  },
  {
    id: 'fotograf',
    name: 'Fotograf',
    description: 'Tar bilder för kommersiellt bruk, journalistik eller konstnärliga ändamål',
    riasec: { R: 3, I: 2, A: 5, S: 3, E: 3, C: 2 },
    bigFive: { openness: 80, conscientiousness: 65, extraversion: 55, agreeableness: 60, stability: 55 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, teknisk: 3, praktisk: 3 },
    challenges: { fysisk_rorlighet: 4, tidspress: 4, social_energi: 3 },
    salary: '25 000 - 45 000 kr/mån',
    education: { name: 'Fotografisk bild/Visuell kommunikation', length: '2-3 år', type: 'YH/Konsthögskola' },
    prognosis: 'stable',
    relatedJobs: ['Videograf', 'Grafisk designer', 'Journalist'],
    careerPath: ['Assistent', 'Fotograf', 'Etablerad fotograf'],
    requiresUniversity: false,
  },
  {
    id: 'journalist',
    name: 'Journalist',
    description: 'Researchar och skriver nyheter och reportage för olika medier',
    riasec: { R: 2, I: 4, A: 4, S: 3, E: 4, C: 2 },
    bigFive: { openness: 80, conscientiousness: 70, extraversion: 60, agreeableness: 55, stability: 55 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { kreativ: 4, kommunikation: 5, analytisk: 4 },
    challenges: { tidspress: 5, social_energi: 4, koncentration: 4 },
    salary: '28 000 - 50 000 kr/mån',
    education: { name: 'Journalistik/Medie- och kommunikation', length: '3 år', type: 'Universitet' },
    prognosis: 'declining',
    relatedJobs: ['PR-konsult', 'Marknadsförare', 'Författare'],
    careerPath: ['Praktikant', 'Reporter', 'Journalist', 'Redaktör'],
    requiresUniversity: true,
  },
  {
    id: 'musiker',
    name: 'Musiker',
    description: 'Framför musik solo eller i ensemble, live eller i studio',
    riasec: { R: 2, I: 2, A: 5, S: 3, E: 3, C: 1 },
    bigFive: { openness: 85, conscientiousness: 60, extraversion: 60, agreeableness: 60, stability: 50 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, konst_kultur: 5 },
    challenges: { social_energi: 4, osakra_forutsattningar: 5, koncentration: 4 },
    salary: '20 000 - 50 000 kr/mån',
    education: { name: 'Musikutbildning', length: '2-4 år', type: 'Musikhögskola' },
    prognosis: 'stable',
    relatedJobs: ['Sångare', 'Kompositör', 'Musikproducent'],
    careerPath: ['Elev', 'Musiker', 'Etablerad artist'],
    requiresUniversity: false,
  },
  // Ekonomi & Administration
  {
    id: 'redovisningskonsult',
    name: 'Redovisningskonsult',
    description: 'Hjälper företag med bokföring, bokslut och deklaration',
    riasec: { R: 1, I: 3, A: 1, S: 2, E: 4, C: 5 },
    bigFive: { openness: 50, conscientiousness: 90, extraversion: 40, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { ekonomi: 5, noggrannhet: 5, analytisk: 4 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '32 000 - 55 000 kr/mån',
    education: { name: 'Redovisning/Ekonomi', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Revisor', 'Ekonom', 'Löneadministratör'],
    careerPath: ['Redovisningsassistent', 'Redovisningskonsult', 'Konsultchef'],
    requiresUniversity: false,
  },
  {
    id: 'controller',
    name: 'Controller',
    description: 'Analyserar och styr företagets ekonomiska verksamhet',
    riasec: { R: 1, I: 4, A: 1, S: 2, E: 4, C: 4 },
    bigFive: { openness: 65, conscientiousness: 85, extraversion: 50, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { ekonomi: 5, analytisk: 5, ledarskap_organisation: 3, noggrannhet: 4 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '45 000 - 75 000 kr/mån',
    education: { name: 'Ekonomie kandidat/Civilekonom', length: '3-4 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Ekonom', 'Revisor', 'CFO'],
    careerPath: ['Ekonom', 'Business controller', 'Controller', 'Head of controlling'],
    requiresUniversity: true,
  },
  {
    id: 'hr_specialist',
    name: 'HR-specialist',
    description: 'Arbetar med rekrytering, kompetensutveckling och personalfrågor',
    riasec: { R: 1, I: 3, A: 2, S: 5, E: 4, C: 3 },
    bigFive: { openness: 70, conscientiousness: 75, extraversion: 65, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { social: 5, ledarskap_organisation: 4, kommunikation: 4, analytisk: 3 },
    challenges: { social_energi: 5, koncentration: 4, tidspress: 3 },
    salary: '32 000 - 55 000 kr/mån',
    education: { name: 'Personal- och arbetslivsprogrammet/HR', length: '3 år', type: 'Universitet/YH' },
    prognosis: 'stable',
    relatedJobs: ['Rekryterare', 'HR-business partner', 'Chef'],
    careerPath: ['HR-assistent', 'HR-specialist', 'HR-manager', 'HR-direktör'],
    requiresUniversity: true,
  },
  {
    id: 'administratör',
    name: 'Administratör',
    description: 'Hanterar kontorsadministration, dokument och kommunikation',
    riasec: { R: 1, I: 2, A: 1, S: 3, E: 2, C: 4 },
    bigFive: { openness: 50, conscientiousness: 80, extraversion: 50, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { administration_kontor: 5, noggrannhet: 4, kommunikation: 3 },
    challenges: { stillasittande: 5, koncentration: 4, repetitivt: 4 },
    salary: '26 000 - 35 000 kr/mån',
    education: { name: 'Administration/Kontor', length: '1-2 år', type: 'Komvux/YH' },
    prognosis: 'declining',
    relatedJobs: ['Receptionist', 'Assistent', 'Koordinator'],
    careerPath: ['Administratör', 'Senior administratör', 'Administrativ chef'],
    requiresUniversity: false,
  },
  // Service & Handel
  {
    id: 'servitris',
    name: 'Servitör/Servitris',
    description: 'Serverar mat och dryck samt ger service till gäster',
    riasec: { R: 2, I: 1, A: 2, S: 4, E: 3, C: 2 },
    bigFive: { openness: 55, conscientiousness: 70, extraversion: 70, agreeableness: 75, stability: 55 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { social: 5, kommunikation: 4, praktisk: 3 },
    challenges: { fysisk_rorlighet: 5, social_energi: 5, tidspress: 5, multitasking: 5 },
    salary: '24 000 - 32 000 kr/mån + dricks',
    education: { name: 'Restaurang- och livsmedelsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Bartender', 'Restaurangchef', 'Hotellreceptionist'],
    careerPath: ['Servitör', 'Sommelier', 'Restaurangchef'],
    requiresUniversity: false,
  },
  {
    id: 'bartender',
    name: 'Bartender',
    description: 'Blandar drinkar och ger service vid bar',
    riasec: { R: 2, I: 1, A: 3, S: 4, E: 3, C: 2 },
    bigFive: { openness: 65, conscientiousness: 65, extraversion: 75, agreeableness: 70, stability: 55 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { social: 5, kommunikation: 4, kreativ: 3 },
    challenges: { social_energi: 5, tidspress: 5, kvallsarbete: 5 },
    salary: '24 000 - 32 000 kr/mån + dricks',
    education: { name: 'Bartenderutbildning', length: '6-12 mån', type: 'Privat utbildning' },
    prognosis: 'stable',
    relatedJobs: ['Servitör', 'Barista', 'Restaurangchef'],
    careerPath: ['Barback', 'Bartender', 'Head bartender', 'Bar manager'],
    requiresUniversity: false,
  },
  {
    id: 'receptionist',
    name: 'Receptionist/Hotellreceptionist',
    description: 'Tar emot besökare, hanterar bokningar och ger service',
    riasec: { R: 1, I: 2, A: 1, S: 4, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 75, extraversion: 65, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 3, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { social: 5, kommunikation: 4, administration_kontor: 3 },
    challenges: { social_energi: 5, multitasking: 4, stillasittande: 3 },
    salary: '25 000 - 35 000 kr/mån',
    education: { name: 'Hotell- och turismprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Resebyråassistent', 'Konferenskoordinator', 'Hotellchef'],
    careerPath: ['Receptionist', 'Senior receptionist', 'Front office manager'],
    requiresUniversity: false,
  },
  {
    id: 'detaljhandel',
    name: 'Butikssäljare/Detaljhandel',
    description: 'Säljer varor och ger service till kunder i butik',
    riasec: { R: 1, I: 1, A: 1, S: 4, E: 3, C: 2 },
    bigFive: { openness: 50, conscientiousness: 70, extraversion: 60, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 3, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { social: 4, kommunikation: 3, affarer_forsaljning: 3 },
    challenges: { social_energi: 4, fysisk_rorlighet: 4, repetitivt: 3 },
    salary: '23 000 - 30 000 kr/mån',
    education: { name: 'Handelsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'declining',
    relatedJobs: ['Key account manager', 'Visual merchandiser', 'Butikschef'],
    careerPath: ['Säljare', 'Erfaren säljare', 'Team leader', 'Butikschef'],
    requiresUniversity: false,
  },
  // Industri & Produktion
  {
    id: 'svetsare',
    name: 'Svetsare',
    description: 'Fogar metall med hjälp av värme och svetsutrustning',
    riasec: { R: 5, I: 2, A: 2, S: 1, E: 1, C: 3 },
    bigFive: { openness: 45, conscientiousness: 75, extraversion: 35, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 5, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { teknisk: 5, praktisk: 5, noggrannhet: 5 },
    challenges: { fysisk_rorlighet: 4, precision: 5, sensorisk: 4 },
    salary: '28 000 - 40 000 kr/mån',
    education: { name: 'Industritekniska programmet/Svets', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Plåtslagare', 'Industrimekaniker', 'CNC-operatör'],
    careerPath: ['Svetsare', 'Certifierad svetsare', 'Svetsföman'],
    requiresUniversity: false,
  },
  {
    id: 'cnc_operatör',
    name: 'CNC-operatör',
    description: 'Programmerar och sköter datorstyrda maskiner',
    riasec: { R: 4, I: 3, A: 1, S: 1, E: 1, C: 4 },
    bigFive: { openness: 55, conscientiousness: 80, extraversion: 35, agreeableness: 50, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 5, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { teknisk: 5, it: 4, noggrannhet: 5, praktisk: 4 },
    challenges: { stillasittande: 4, koncentration: 5, repetitivt: 4 },
    salary: '28 000 - 38 000 kr/mån',
    education: { name: 'CNC-tekniker/Maskinteknik', length: '1-2 år', type: 'YH' },
    prognosis: 'growing',
    relatedJobs: ['Industrimekaniker', 'Verktygsmakare', 'Produktionstekniker'],
    careerPath: ['CNC-operatör', 'CNC-tekniker', 'Programmerare'],
    requiresUniversity: false,
  },
  {
    id: 'lagerarbetare',
    name: 'Lagerarbetare',
    description: 'Tar emot, lagrar och packar varor på lager',
    riasec: { R: 4, I: 1, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 40, conscientiousness: 70, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 3, teknisk: 2 },
    challenges: { fysisk_styrka: 4, fysisk_rorlighet: 4, repetitivt: 4 },
    salary: '24 000 - 32 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Introduktion', type: 'Intern utbildning' },
    prognosis: 'growing',
    relatedJobs: ['Truckförare', 'Logistiker', 'Lagerchef'],
    careerPath: ['Lagerarbetare', 'Erfaren lagerarbetare', 'Team leader'],
    requiresUniversity: false,
  },
  {
    id: 'produktionschef',
    name: 'Produktionschef',
    description: 'Leder och planerar produktion i industriföretag',
    riasec: { R: 3, I: 3, A: 1, S: 3, E: 5, C: 4 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 65, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { ledarskap_organisation: 5, teknisk: 4, ekonomi: 3, noggrannhet: 4 },
    challenges: { tidspress: 5, social_energi: 4, multitasking: 5 },
    salary: '50 000 - 80 000 kr/mån',
    education: { name: 'Industriell ekonomi/Produktionsteknik', length: '3-5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Verkstadschef', 'Logistikchef', 'Fabrikschef'],
    careerPath: ['Produktionsledare', 'Produktionschef', 'Operations manager'],
    requiresUniversity: true,
  },
  // Utbildning
  {
    id: 'förskollärare',
    name: 'Förskollärare',
    description: 'Undervisar och vårdar barn i förskolan',
    riasec: { R: 2, I: 2, A: 3, S: 5, E: 3, C: 3 },
    bigFive: { openness: 75, conscientiousness: 80, extraversion: 70, agreeableness: 85, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { pedagogik: 5, social: 5, kreativ: 4 },
    challenges: { social_energi: 5, fysisk_rorlighet: 4, multitasking: 5 },
    salary: '28 000 - 38 000 kr/mån',
    education: { name: 'Förskollärarprogrammet', length: '3,5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Barnskötare', 'Fritidspedagog', 'Specialpedagog'],
    careerPath: ['Förskollärare', 'Förstelärare', 'Förskolechef'],
    requiresUniversity: true,
  },
  {
    id: 'barnskötare',
    name: 'Barnskötare',
    description: 'Arbetar med barns dagliga omvårdnad och utveckling i förskola',
    riasec: { R: 2, I: 1, A: 2, S: 5, E: 1, C: 2 },
    bigFive: { openness: 70, conscientiousness: 75, extraversion: 60, agreeableness: 90, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 3, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 5, pedagogik: 4 },
    challenges: { social_energi: 5, fysisk_rorlighet: 4, fysisk_styrka: 3 },
    salary: '24 000 - 30 000 kr/mån',
    education: { name: 'Barn- och fritidsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Förskollärare', 'Fritidsledare', 'Personlig assistent'],
    careerPath: ['Barnskötare', 'Specialiserad barnskötare', 'Teamleader'],
    requiresUniversity: false,
  },
  {
    id: 'specialpedagog',
    name: 'Specialpedagog',
    description: 'Stödjer barn och elever med särskilda behov i skolan',
    riasec: { R: 2, I: 3, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 80, conscientiousness: 80, extraversion: 60, agreeableness: 90, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 4, energi: 3 },
    categories: { pedagogik: 5, social: 5, vard: 4, analytisk: 3 },
    challenges: { social_energi: 5, koncentration: 4, stillasittande: 3 },
    salary: '38 000 - 52 000 kr/mån',
    education: { name: 'Specialpedagogik', length: '1,5 år', type: 'Universitet (påbyggnad)' },
    prognosis: 'growing',
    relatedJobs: ['Speciallärare', 'Skolkurator', 'Psykolog'],
    careerPath: ['Lärare', 'Specialpedagog', 'Specialpedagogisk rådgivare'],
    requiresUniversity: true,
  },
  // Natur & Miljö
  {
    id: 'biolog',
    name: 'Biolog',
    description: 'Forskar om eller arbetar praktiskt med växter, djur och ekosystem',
    riasec: { R: 2, I: 5, A: 2, S: 2, E: 2, C: 2 },
    bigFive: { openness: 80, conscientiousness: 80, extraversion: 40, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { natur: 5, forskning: 5, analytisk: 4 },
    challenges: { stillasittande: 3, koncentration: 5, social_energi: 2 },
    salary: '32 000 - 50 000 kr/mån',
    education: { name: 'Biologi/Naturvetenskap', length: '3-5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Veterinär', 'Agronom', 'Miljöinspektör'],
    careerPath: ['Biolog', 'Forskarbiolog', 'Senior biolog'],
    requiresUniversity: true,
  },
  {
    id: 'agronom',
    name: 'Agronom',
    description: 'Arbetar med lantbruk, djurhållning eller livsmedelsproduktion',
    riasec: { R: 3, I: 4, A: 1, S: 3, E: 3, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 50, agreeableness: 65, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 3, sensorisk: 3, energi: 4 },
    categories: { natur: 5, teknisk: 3, ledarskap_organisation: 3, ekonomi: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 3, osakra_forutsattningar: 4 },
    salary: '32 000 - 48 000 kr/mån',
    education: { name: 'Agronomprogrammet', length: '3 år', type: 'SLU' },
    prognosis: 'stable',
    relatedJobs: ['Veterinär', 'Biolog', 'Lantbrukare'],
    careerPath: ['Agronom', 'Driftledare', 'Gårdsägare', 'Rådgivare'],
    requiresUniversity: true,
  },
  {
    id: 'miljöinspektör',
    name: 'Miljöinspektör',
    description: 'Kontrollerar att företag följer miljölagstiftning',
    riasec: { R: 2, I: 4, A: 1, S: 3, E: 4, C: 4 },
    bigFive: { openness: 70, conscientiousness: 85, extraversion: 55, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { natur: 4, analytisk: 4, noggrannhet: 5, ledarskap_organisation: 3 },
    challenges: { stillasittande: 3, koncentration: 4, tidspress: 3 },
    salary: '35 000 - 50 000 kr/mån',
    education: { name: 'Miljö- och hälsoskydd/Miljövetenskap', length: '3 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Miljökonsult', 'Biolog', 'Naturvårdsbiolog'],
    careerPath: ['Miljöhandläggare', 'Miljöinspektör', 'Miljöchef'],
    requiresUniversity: true,
  },
  {
    id: 'skogsarbetare',
    name: 'Skogsarbetare/Skogshuggare',
    description: 'Sköter avverkning och skogsvård',
    riasec: { R: 5, I: 1, A: 1, S: 1, E: 1, C: 2 },
    bigFive: { openness: 40, conscientiousness: 70, extraversion: 35, agreeableness: 50, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 3, energi: 5 },
    categories: { natur: 5, praktisk: 5, teknisk: 3 },
    challenges: { fysisk_styrka: 5, fysisk_rorlighet: 5, utomhusarbete: 5, osakra_forutsattningar: 4 },
    salary: '25 000 - 35 000 kr/mån',
    education: { name: 'Skogsbruk/Maskinförare', length: '1-3 år', type: 'Gymnasium/Komvux' },
    prognosis: 'stable',
    relatedJobs: ['Trädgårdsmästare', 'Maskinförare', 'Skogsmästare'],
    careerPath: ['Skogsarbetare', 'Maskinförare', 'Skogsförmån'],
    requiresUniversity: false,
  },
  // Bygg & Fastighet
  {
    id: 'fastighetsmäklare',
    name: 'Fastighetsmäklare',
    description: 'Förmedlar köp och försäljning av fastigheter och bostäder',
    riasec: { R: 1, I: 2, A: 1, S: 4, E: 5, C: 3 },
    bigFive: { openness: 60, conscientiousness: 75, extraversion: 75, agreeableness: 70, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { affarer_forsaljning: 5, kommunikation: 5, ledarskap_organisation: 3 },
    challenges: { social_energi: 5, tidspress: 4, osakra_forutsattningar: 4 },
    salary: '35 000 - 70 000 kr/mån (provision)',
    education: { name: 'Fastighetsmäklarprogrammet', length: '2 år', type: 'YH' },
    prognosis: 'stable',
    relatedJobs: ['Försäljare', 'Affärsutvecklare', 'Fastighetschef'],
    careerPath: ['Mäklarassistent', 'Fastighetsmäklare', 'Senior mäklare'],
    requiresUniversity: false,
  },
  {
    id: 'fastighetsskötare',
    name: 'Fastighetsskötare',
    description: 'Sköter drift och underhåll av fastigheter',
    riasec: { R: 4, I: 2, A: 1, S: 3, E: 2, C: 3 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 45, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, teknisk: 4, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 4, fysisk_styrka: 3, social_energi: 3 },
    salary: '26 000 - 36 000 kr/mån',
    education: { name: 'Fastighetsskötarutbildning', length: '1-2 år', type: 'YH/Folkhögskola' },
    prognosis: 'stable',
    relatedJobs: ['VVS-montör', 'Elektriker', 'Fastighetsförvaltare'],
    careerPath: ['Fastighetsskötare', 'Drifttekniker', 'Fastighetsförvaltare'],
    requiresUniversity: false,
  },
  {
    id: 'glasmästare',
    name: 'Glasmästare',
    description: 'Hanterar montering och reparation av fönster och glas',
    riasec: { R: 4, I: 2, A: 2, S: 2, E: 2, C: 3 },
    bigFive: { openness: 55, conscientiousness: 75, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, teknisk: 4, noggrannhet: 5 },
    challenges: { fysisk_rorlighet: 5, precision: 5, fysisk_styrka: 3 },
    salary: '26 000 - 36 000 kr/mån',
    education: { name: 'Glasmästarutbildning', length: '2 år', type: 'Lärlingsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Snickare', 'Byggarbetare', 'Fönstermontör'],
    careerPath: ['Lärling', 'Glasmästare', 'Förmån', 'Egen företagare'],
    requiresUniversity: false,
  },
  // Säkerhet & Bevakning
  {
    id: 'vaktare',
    name: 'Väktare/Ordningsvakt',
    description: 'Skyddar egendom och upprätthåller ordning',
    riasec: { R: 3, I: 2, A: 1, S: 3, E: 3, C: 3 },
    bigFive: { openness: 50, conscientiousness: 80, extraversion: 55, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { social: 3, praktisk: 3, ledarskap_organisation: 2 },
    challenges: { social_energi: 4, kvallsarbete: 5, koncentration: 4 },
    salary: '25 000 - 35 000 kr/mån',
    education: { name: 'Väktarutbildning/Ordningsvaktsutbildning', length: '4-6 veckor', type: 'Privat utbildning' },
    prognosis: 'growing',
    relatedJobs: ['Polis', 'Kriminalvårdare', 'Säkerhetsansvarig'],
    careerPath: ['Väktare', 'Ordningsvakt', 'Säkerhetschef'],
    requiresUniversity: false,
  },
  // Övriga
  {
    id: 'begravningsentreprenör',
    name: 'Begravningsentreprenör',
    description: 'Arrangerar begravningar och stödjer sörjande',
    riasec: { R: 2, I: 2, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 60, conscientiousness: 80, extraversion: 50, agreeableness: 85, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 4, energi: 3 },
    categories: { social: 5, vard: 4, kommunikation: 4 },
    challenges: { social_energi: 5, emotionell_belastning: 5, koncentration: 4 },
    salary: '28 000 - 40 000 kr/mån',
    education: { name: 'Begravningsentreprenörutbildning', length: '2 år', type: 'YH' },
    prognosis: 'stable',
    relatedJobs: ['Präst', 'Begravningsrådgivare', 'Krematorietekniker'],
    careerPath: ['Praktikant', 'Begravningsrådgivare', 'Begravningsentreprenör'],
    requiresUniversity: false,
  },
  {
    id: 'flygvardinna',
    name: 'Kabinpersonal/Flygvärdinna',
    description: 'Tar hand om passagerare ombord på flygplan',
    riasec: { R: 2, I: 2, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 65, conscientiousness: 75, extraversion: 70, agreeableness: 80, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 3, sensorisk: 4, energi: 4 },
    categories: { social: 5, kommunikation: 5, vard: 3 },
    challenges: { social_energi: 5, tidspress: 4, flexibilitet: 5, jetlag: 4 },
    salary: '25 000 - 35 000 kr/mån',
    education: { name: 'Kabinpersonalutbildning', length: '6-12 mån', type: 'YH/Flygbolagsutbildning' },
    prognosis: 'growing',
    relatedJobs: ['Hotellreceptionist', 'Servitör', 'Resebyråassistent'],
    careerPath: ['Kabinpersonal', 'Senior cabin crew', 'Purser', 'Cabin manager'],
    requiresUniversity: false,
  },
  {
    id: 'sjöman',
    name: 'Sjöman/Sjöfartsarbetare',
    description: 'Arbetar ombord på fartyg med drift och underhåll',
    riasec: { R: 4, I: 2, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { teknisk: 4, praktisk: 5, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, social_isolering: 5, flexibilitet: 5 },
    salary: '28 000 - 45 000 kr/mån',
    education: { name: 'Sjöfartsutbildning/Sjöman', length: '1-2 år', type: 'Gymnasium/YH' },
    prognosis: 'stable',
    relatedJobs: ['Fartygsmekaniker', 'Kapten', 'Hamnarbetare'],
    careerPath: ['Sjöman', 'Maskinist', 'Fartygsbefäl'],
    requiresUniversity: false,
  },
  // Ytterligare yrken för ökad bredd (70+ totalt)
  // IT & Teknik forts.
  {
    id: 'cybersakerhet',
    name: 'Cybersäkerhetsanalytiker',
    description: 'Skyddar organisationers IT-system mot cyberhot och attacker',
    riasec: { R: 2, I: 5, A: 2, S: 2, E: 2, C: 4 },
    bigFive: { openness: 75, conscientiousness: 85, extraversion: 35, agreeableness: 50, stability: 70 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, analytisk: 5, noggrannhet: 5 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '40 000 - 70 000 kr/mån',
    education: { name: 'Cybersäkerhet/Nätverkssäkerhet', length: '2-4 år', type: 'YH/Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Programmerare', 'Nätverkstekniker', 'IT-säkerhetschef'],
    careerPath: ['Junior säkerhetsanalytiker', 'Säkerhetsanalytiker', 'Senior', 'CISO'],
    requiresUniversity: true,
  },
  {
    id: 'nätverkstekniker',
    name: 'Nätverkstekniker',
    description: 'Bygger och underhåller företags nätverk och kommunikationssystem',
    riasec: { R: 3, I: 4, A: 1, S: 3, E: 2, C: 4 },
    bigFive: { openness: 60, conscientiousness: 80, extraversion: 45, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { it: 5, teknisk: 4, noggrannhet: 4 },
    challenges: { stillasittande: 4, koncentration: 4 },
    salary: '32 000 - 50 000 kr/mån',
    education: { name: 'Nätverksteknik/IT-infrastruktur', length: '2 år', type: 'YH' },
    prognosis: 'growing',
    relatedJobs: ['IT-supporttekniker', 'Systemadministratör', 'Cybersäkerhetsanalytiker'],
    careerPath: ['Junior nätverkstekniker', 'Nätverkstekniker', 'Senior', 'Nätverksarkitekt'],
    requiresUniversity: false,
  },
  // Vård & Hälsa forts.
  {
    id: 'barnmorska',
    name: 'Barnmorska',
    description: 'Ger vård och stöd till gravida, födande och nyblivna mödrar',
    riasec: { R: 3, I: 3, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 65, conscientiousness: 85, extraversion: 60, agreeableness: 90, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 5, praktisk: 3 },
    challenges: { social_energi: 5, fysisk_rorlighet: 4, tidspress: 4 },
    salary: '35 000 - 48 000 kr/mån',
    education: { name: 'Barnmorskeprogrammet', length: '1,5 år', type: 'Universitet (påbyggnad)' },
    prognosis: 'growing',
    relatedJobs: ['Sjuksköterska', 'Läkare', 'BVC-sköterska'],
    careerPath: ['Barnmorska', 'Klinisk barnmorska', 'Barnmorskechef'],
    requiresUniversity: true,
  },
  {
    id: 'sjukskoterska_bvc',
    name: 'BVC-sköterska',
    description: 'Arbetar med barnhälsovård, vaccinationer och stöd till föräldrar',
    riasec: { R: 2, I: 3, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 70, conscientiousness: 85, extraversion: 65, agreeableness: 90, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 3, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 5, pedagogik: 4 },
    challenges: { social_energi: 5, koncentration: 4 },
    salary: '34 000 - 46 000 kr/mån',
    education: { name: 'Sjuksköterskeprogrammet + vidareutb.', length: '3 + 1 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Barnmorska', 'Sjuksköterska', 'Distriktssköterska'],
    careerPath: ['Sjuksköterska', 'BVC-sköterska', 'Klinisk specialist'],
    requiresUniversity: true,
  },
  {
    id: 'kurator',
    name: 'Skolkurator',
    description: 'Stödjer elevers psykiska hälsa och sociala utveckling i skolan',
    riasec: { R: 1, I: 3, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 75, conscientiousness: 75, extraversion: 60, agreeableness: 85, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 4, energi: 3 },
    categories: { social: 5, vard: 4, pedagogik: 3 },
    challenges: { social_energi: 5, koncentration: 4 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Socionomprogrammet', length: '3,5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Socionom', 'Psykolog', 'Specialpedagog'],
    careerPath: ['Socionom', 'Skolkurator', 'Kuratorssamordnare'],
    requiresUniversity: true,
  },
  // Kreativa yrken forts.
  {
    id: 'art_director',
    name: 'Art Director',
    description: 'Leder visuellt kreativt arbete inom reklam, design eller media',
    riasec: { R: 2, I: 3, A: 5, S: 3, E: 4, C: 2 },
    bigFive: { openness: 90, conscientiousness: 75, extraversion: 60, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { kreativ: 5, ledarskap_organisation: 4, kommunikation: 4 },
    challenges: { tidspress: 5, social_energi: 4, koncentration: 4 },
    salary: '40 000 - 70 000 kr/mån',
    education: { name: 'Grafisk design/Art Direction', length: '3 år', type: 'Konsthögskola/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Grafisk designer', 'UX-designer', 'Marknadsförare'],
    careerPath: ['Designer', 'Senior designer', 'Art Director', 'Creative Director'],
    requiresUniversity: true,
  },
  {
    id: 'skadespelare',
    name: 'Skådespelare',
    description: 'Framför roller inom teater, film, TV eller radio',
    riasec: { R: 2, I: 2, A: 5, S: 4, E: 4, C: 1 },
    bigFive: { openness: 90, conscientiousness: 60, extraversion: 75, agreeableness: 65, stability: 50 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, konst_kultur: 5, social: 4 },
    challenges: { social_energi: 5, osakra_forutsattningar: 5, koncentration: 4 },
    salary: '20 000 - 60 000 kr/mån (varierar mycket)',
    education: { name: 'Teaterutbildning/Skådespeleri', length: '2-4 år', type: 'Teaterhögskola' },
    prognosis: 'stable',
    relatedJobs: ['Regissör', 'Manusförfattare', 'Sångare'],
    careerPath: ['Elev', 'Skådespelare', 'Etablerad skådespelare'],
    requiresUniversity: false,
  },
  {
    id: 'forfattare',
    name: 'Författare/Copywriter',
    description: 'Skriver texter för böcker, reklam, webb eller andra medier',
    riasec: { R: 1, I: 4, A: 5, S: 2, E: 3, C: 2 },
    bigFive: { openness: 90, conscientiousness: 70, extraversion: 35, agreeableness: 55, stability: 55 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, kommunikation: 5, analytisk: 3 },
    challenges: { stillasittande: 5, koncentration: 5, osakra_forutsattningar: 4 },
    salary: '25 000 - 50 000 kr/mån',
    education: { name: 'Journalistik/Skrivande/Kreativt skrivande', length: '2-3 år', type: 'Universitet/YH' },
    prognosis: 'stable',
    relatedJobs: ['Journalist', 'PR-konsult', 'Redaktör'],
    careerPath: ['Skribent', 'Copywriter', 'Senior copywriter', 'Creative Director'],
    requiresUniversity: false,
  },
  // Handel & Försäljning forts.
  {
    id: 'key_account_manager',
    name: 'Key Account Manager',
    description: 'Ansvarar för strategiska kundrelationer och försäljning',
    riasec: { R: 1, I: 3, A: 1, S: 4, E: 5, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 75, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { affarer_forsaljning: 5, kommunikation: 5, ledarskap_organisation: 4 },
    challenges: { social_energi: 5, tidspress: 4, osakra_forutsattningar: 3 },
    salary: '40 000 - 80 000 kr/mån (inkl. provision)',
    education: { name: 'Ekonomi/Marknadsföring/Försäljning', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Säljare', 'Försäljningschef', 'Marknadschef'],
    careerPath: ['Säljare', 'Account Manager', 'Key Account Manager', 'Sales Director'],
    requiresUniversity: true,
  },
  {
    id: 'inkopare',
    name: 'Inköpare',
    description: 'Ansvarar för inköp av varor och tjänster till företag',
    riasec: { R: 1, I: 3, A: 1, S: 3, E: 4, C: 4 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 55, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { ekonomi: 4, analytisk: 4, noggrannhet: 4 },
    challenges: { tidspress: 4, koncentration: 4 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Inköp/Logistik/Supply chain', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Controller', 'Logistiker', 'Inköpschef'],
    careerPath: ['Inköpsassistent', 'Inköpare', 'Strategisk inköpare', 'Inköpschef'],
    requiresUniversity: true,
  },
  // Bygg & Anläggning forts.
  {
    id: 'plattsattare',
    name: 'Plattsättare',
    description: 'Lägger kakel, klinker och andra golv- och väggbeklädnader',
    riasec: { R: 4, I: 2, A: 3, S: 2, E: 2, C: 3 },
    bigFive: { openness: 50, conscientiousness: 80, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, teknisk: 3, noggrannhet: 5, kreativ: 3 },
    challenges: { fysisk_rorlighet: 5, precision: 5, fysisk_styrka: 3 },
    salary: '28 000 - 40 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Snickare', 'Glasmästare', 'Kakelugnsmakare'],
    careerPath: ['Lärling', 'Plattsättare', 'Förman', 'Egen företagare'],
    requiresUniversity: false,
  },
  {
    id: 'malare',
    name: 'Målare',
    description: 'Målar och tapetserar inomhus och utomhus',
    riasec: { R: 3, I: 1, A: 4, S: 2, E: 2, C: 2 },
    bigFive: { openness: 60, conscientiousness: 75, extraversion: 45, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, kreativ: 4, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 5, precision: 4 },
    salary: '27 000 - 38 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Snickare', 'Plattsättare', 'Dekoratör'],
    careerPath: ['Lärling', 'Målare', 'Förman', 'Egen företagare'],
    requiresUniversity: false,
  },
  // Transport & Logistik forts.
  {
    id: 'logistiker',
    name: 'Logistiker',
    description: 'Planerar och optimerar varuflöden och transport',
    riasec: { R: 2, I: 4, A: 1, S: 2, E: 3, C: 4 },
    bigFive: { openness: 65, conscientiousness: 85, extraversion: 45, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { analytisk: 4, noggrannhet: 4, ekonomi: 3 },
    challenges: { stillasittande: 4, koncentration: 4, tidspress: 4 },
    salary: '32 000 - 50 000 kr/mån',
    education: { name: 'Logistik/Supply Chain Management', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Inköpare', 'Transportledare', 'Lageransvarig'],
    careerPath: ['Logistikassistent', 'Logistiker', 'Logistikchef', 'Supply Chain Director'],
    requiresUniversity: true,
  },
  {
    id: 'taxichauffor',
    name: 'Taxichaufför',
    description: 'Kör taxi och transporterar passagerare',
    riasec: { R: 3, I: 1, A: 1, S: 4, E: 2, C: 2 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 60, agreeableness: 70, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 4, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { social: 4, praktisk: 3, kommunikation: 3 },
    challenges: { stillasittande: 5, social_energi: 4, koncentration: 4 },
    salary: '25 000 - 40 000 kr/mån',
    education: { name: 'Taxiförarlegitimation', length: 'Kort utbildning', type: 'Transportstyrelsen' },
    prognosis: 'declining',
    relatedJobs: ['Bussförare', 'Lastbilschaufför', 'Uber-förare'],
    careerPath: ['Taxichaufför', 'Erfaren chaufför', 'Förarcoach'],
    requiresUniversity: false,
  },
  // Övriga serviceyrken
  {
    id: 'stromare',
    name: 'Städare/Lokalvårdare',
    description: 'Sköter städning och lokalvård av arbetsplatser och offentliga miljöer',
    riasec: { R: 3, I: 1, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 40, conscientiousness: 75, extraversion: 40, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, repetitivt: 4, sensorisk: 3 },
    salary: '24 000 - 32 000 kr/mån',
    education: { name: 'Lokalvård/Städutbildning', length: 'Kort utbildning', type: 'Komvux/Företag' },
    prognosis: 'stable',
    relatedJobs: ['Fastighetsskötare', 'Hemtjänst', 'Hotellstädare'],
    careerPath: ['Städare', 'Erfaren städare', 'Team leader', 'Städchef'],
    requiresUniversity: false,
  },
  {
    id: 'vaktmastare',
    name: 'Vaktmästare',
    description: 'Sköter underhåll, reparationer och praktiska uppgifter i fastigheter',
    riasec: { R: 4, I: 2, A: 1, S: 3, E: 2, C: 3 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 45, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, teknisk: 4, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 4, fysisk_styrka: 3 },
    salary: '26 000 - 35 000 kr/mån',
    education: { name: 'Fastighetsutbildning/Vaktmästarutbildning', length: '1-2 år', type: 'Komvux/YH' },
    prognosis: 'stable',
    relatedJobs: ['Fastighetsskötare', 'Elektriker', 'Snickare'],
    careerPath: ['Vaktmästare', 'Fastighetstekniker', 'Fastighetsförvaltare'],
    requiresUniversity: false,
  },
  // ===== YTTERLIGARE YRKEN FÖR BÄTTRE MATCHNING =====
  // Tech & Digital
  {
    id: 'devops_engineer',
    name: 'DevOps Engineer',
    description: 'Automatiserar och optimerar utvecklings- och driftprocesser för mjukvara',
    riasec: { R: 3, I: 5, A: 2, S: 2, E: 2, C: 4 },
    bigFive: { openness: 70, conscientiousness: 85, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, teknisk: 5, analytisk: 4, noggrannhet: 4 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '45 000 - 75 000 kr/mån',
    education: { name: 'Systemvetenskap/Datateknik', length: '3-5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Systemadministratör', 'Cloud Engineer', 'Programmerare'],
    careerPath: ['Junior DevOps', 'DevOps Engineer', 'Senior DevOps', 'DevOps Lead'],
    requiresUniversity: true,
  },
  {
    id: 'cybersecurity',
    name: 'Cybersäkerhetsanalytiker',
    description: 'Skyddar organisationer mot digitala hot och säkerhetsrisker',
    riasec: { R: 2, I: 5, A: 2, S: 2, E: 3, C: 4 },
    bigFive: { openness: 75, conscientiousness: 90, extraversion: 35, agreeableness: 50, stability: 70 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, analytisk: 5, noggrannhet: 5 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '42 000 - 70 000 kr/mån',
    education: { name: 'IT-säkerhet/Datateknik', length: '3-5 år', type: 'Universitet/YH' },
    prognosis: 'growing',
    relatedJobs: ['Nätverkstekniker', 'Systemadministratör', 'Pentester'],
    careerPath: ['SOC-analytiker', 'Säkerhetsanalytiker', 'Senior', 'CISO'],
    requiresUniversity: true,
  },
  {
    id: 'spelutvecklare',
    name: 'Spelutvecklare',
    description: 'Utvecklar dator- och mobilspel från idé till färdig produkt',
    riasec: { R: 2, I: 4, A: 5, S: 1, E: 2, C: 3 },
    bigFive: { openness: 90, conscientiousness: 75, extraversion: 35, agreeableness: 55, stability: 55 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { it: 5, kreativ: 5, teknisk: 4 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '35 000 - 60 000 kr/mån',
    education: { name: 'Spelutveckling/Datateknik', length: '3-5 år', type: 'Universitet/YH' },
    prognosis: 'growing',
    relatedJobs: ['Programmerare', 'Grafiker', 'Speldesigner'],
    careerPath: ['Junior utvecklare', 'Spelutvecklare', 'Lead Developer', 'Creative Director'],
    requiresUniversity: true,
  },
  {
    id: 'webbdesigner',
    name: 'Webbdesigner',
    description: 'Designar och bygger användarvänliga webbplatser',
    riasec: { R: 2, I: 3, A: 5, S: 3, E: 3, C: 3 },
    bigFive: { openness: 85, conscientiousness: 70, extraversion: 50, agreeableness: 65, stability: 55 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, it: 4, teknisk: 3, kommunikation: 3 },
    challenges: { stillasittande: 5, koncentration: 4, tidspress: 3 },
    salary: '30 000 - 50 000 kr/mån',
    education: { name: 'Webbdesign/Digital design', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['UX-designer', 'Grafisk designer', 'Frontend-utvecklare'],
    careerPath: ['Junior designer', 'Webbdesigner', 'Senior designer', 'Art director'],
    requiresUniversity: false,
  },
  // Hälsa & Vård - fler roller
  {
    id: 'dietist',
    name: 'Dietist',
    description: 'Ger kostrådgivning och behandlar näringsrelaterade tillstånd',
    riasec: { R: 2, I: 4, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 70, conscientiousness: 80, extraversion: 55, agreeableness: 80, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { vard: 5, social: 4, analytisk: 4, forskning: 3 },
    challenges: { social_energi: 4, stillasittande: 3, koncentration: 4 },
    salary: '30 000 - 42 000 kr/mån',
    education: { name: 'Dietistprogrammet', length: '3 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Kostrådgivare', 'Sjuksköterska', 'Läkare'],
    careerPath: ['Dietist', 'Klinisk specialist', 'Enhetschef'],
    requiresUniversity: true,
  },
  {
    id: 'optiker',
    name: 'Optiker',
    description: 'Undersöker syn och anpassar glasögon och kontaktlinser',
    riasec: { R: 3, I: 4, A: 2, S: 4, E: 3, C: 4 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 55, agreeableness: 75, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 4, energi: 3 },
    categories: { vard: 4, teknisk: 4, social: 4, noggrannhet: 5 },
    challenges: { precision: 5, social_energi: 4, stillasittande: 4 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Optikerutbildning', length: '3 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Ögonläkare', 'Ortoptist', 'Audiolog'],
    careerPath: ['Optiker', 'Butikschef', 'Franchisetagare'],
    requiresUniversity: true,
  },
  {
    id: 'ambulanssjukvardare',
    name: 'Ambulanssjukvårdare',
    description: 'Ger akutsjukvård och transporterar patienter till sjukhus',
    riasec: { R: 4, I: 3, A: 1, S: 5, E: 2, C: 3 },
    bigFive: { openness: 55, conscientiousness: 85, extraversion: 55, agreeableness: 75, stability: 75 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 5, motorik: 4, sensorisk: 4, energi: 5 },
    categories: { vard: 5, praktisk: 4, social: 4, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 5, tidspress: 5, social_energi: 4, fysisk_styrka: 4 },
    salary: '32 000 - 40 000 kr/mån',
    education: { name: 'Ambulanssjukvårdare', length: '3 år', type: 'YH' },
    prognosis: 'growing',
    relatedJobs: ['Sjuksköterska', 'Brandman', 'Räddningstjänst'],
    careerPath: ['Ambulanssjukvårdare', 'Ambulanssjuksköterska', 'Stationschef'],
    requiresUniversity: false,
  },
  // Hantverk & Kreativa
  {
    id: 'tatuera',
    name: 'Tatuerare',
    description: 'Skapar permanenta tatueringar på kunders hud',
    riasec: { R: 4, I: 2, A: 5, S: 3, E: 3, C: 2 },
    bigFive: { openness: 85, conscientiousness: 75, extraversion: 55, agreeableness: 60, stability: 55 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 5, motorik: 5, sensorisk: 4, energi: 3 },
    categories: { kreativ: 5, praktisk: 4, social: 3 },
    challenges: { precision: 5, koncentration: 5, stillasittande: 4 },
    salary: '25 000 - 50 000 kr/mån',
    education: { name: 'Tatueringsutbildning (lärlingsplats)', length: '1-3 år', type: 'Privat' },
    prognosis: 'stable',
    relatedJobs: ['Piercerare', 'Frisör', 'Konstnär'],
    careerPath: ['Lärling', 'Tatuerare', 'Egen studio'],
    requiresUniversity: false,
  },
  {
    id: 'florister',
    name: 'Florist',
    description: 'Arrangerar blommor och växter för olika tillfällen',
    riasec: { R: 3, I: 2, A: 5, S: 4, E: 3, C: 2 },
    bigFive: { openness: 75, conscientiousness: 70, extraversion: 55, agreeableness: 75, stability: 55 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { kreativ: 5, praktisk: 4, social: 4, natur: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 4, sensorisk: 3 },
    salary: '23 000 - 30 000 kr/mån',
    education: { name: 'Floristutbildning', length: '2 år', type: 'YH/Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Trädgårdsmästare', 'Dekoratör', 'Event-arrangör'],
    careerPath: ['Florist', 'Senior florist', 'Egen butik'],
    requiresUniversity: false,
  },
  {
    id: 'skraddar',
    name: 'Skräddare',
    description: 'Syr, reparerar och anpassar kläder efter mått',
    riasec: { R: 4, I: 2, A: 4, S: 3, E: 2, C: 3 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 40, agreeableness: 65, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 5, motorik: 5, sensorisk: 4, energi: 3 },
    categories: { kreativ: 4, praktisk: 5, noggrannhet: 5 },
    challenges: { precision: 5, stillasittande: 5, koncentration: 4 },
    salary: '25 000 - 38 000 kr/mån',
    education: { name: 'Textil och mode', length: '2-3 år', type: 'YH/Gymnasium' },
    prognosis: 'declining',
    relatedJobs: ['Modedesigner', 'Kostymör', 'Sömmerska'],
    careerPath: ['Skräddare', 'Master Tailor', 'Egen ateljé'],
    requiresUniversity: false,
  },
  // Natur & Utomhus
  {
    id: 'skogsarbetare',
    name: 'Skogsarbetare',
    description: 'Arbetar med avverkning, plantering och skogsvård',
    riasec: { R: 5, I: 2, A: 1, S: 1, E: 1, C: 2 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 5 },
    categories: { natur: 5, praktisk: 5, utomhusarbete: 5 },
    challenges: { fysisk_styrka: 5, fysisk_rorlighet: 5, vaderberoende: 5 },
    salary: '27 000 - 38 000 kr/mån',
    education: { name: 'Naturbruksprogrammet', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Maskinförare', 'Trädgårdsmästare', 'Jägare'],
    careerPath: ['Skogsarbetare', 'Motorsågförare', 'Arbetsledare'],
    requiresUniversity: false,
  },
  {
    id: 'fiskare',
    name: 'Yrkesfiskare',
    description: 'Fiskar kommersiellt i hav, sjöar eller vattendrag',
    riasec: { R: 5, I: 2, A: 1, S: 2, E: 2, C: 2 },
    bigFive: { openness: 50, conscientiousness: 75, extraversion: 40, agreeableness: 55, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 3, energi: 5 },
    categories: { natur: 5, praktisk: 5, utomhusarbete: 5 },
    challenges: { fysisk_styrka: 5, fysisk_rorlighet: 5, vaderberoende: 5, osakra_forutsattningar: 4 },
    salary: '25 000 - 45 000 kr/mån',
    education: { name: 'Fiskeutbildning', length: '1-2 år', type: 'Folkhögskola/YH' },
    prognosis: 'declining',
    relatedJobs: ['Sjöman', 'Fiskodlare', 'Båtmekaniker'],
    careerPath: ['Fiskare', 'Erfaren fiskare', 'Skeppare', 'Redare'],
    requiresUniversity: false,
  },
  {
    id: 'djurskotare',
    name: 'Djurskötare',
    description: 'Vårdar och sköter djur på djurpark, gård eller i annan verksamhet',
    riasec: { R: 4, I: 2, A: 1, S: 3, E: 1, C: 2 },
    bigFive: { openness: 60, conscientiousness: 75, extraversion: 45, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { natur: 5, praktisk: 4, vard: 3, utomhusarbete: 4 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, vaderberoende: 3 },
    salary: '24 000 - 32 000 kr/mån',
    education: { name: 'Djurvård', length: '3 år gymn', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Djursjukskötare', 'Veterinär', 'Lantbrukare'],
    careerPath: ['Djurskötare', 'Erfaren skötare', 'Ansvarig djurvårdare'],
    requiresUniversity: false,
  },
  // Vetenskap & Forskning
  {
    id: 'biolog',
    name: 'Biolog',
    description: 'Studerar levande organismer och ekosystem',
    riasec: { R: 3, I: 5, A: 2, S: 2, E: 2, C: 3 },
    bigFive: { openness: 85, conscientiousness: 80, extraversion: 40, agreeableness: 60, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { forskning: 5, natur: 5, analytisk: 4 },
    challenges: { stillasittande: 4, koncentration: 5, social_energi: 2 },
    salary: '32 000 - 50 000 kr/mån',
    education: { name: 'Biologiprogrammet', length: '3-5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Miljökonsult', 'Forskare', 'Laborant'],
    careerPath: ['Biolog', 'Forskare', 'Projektledare', 'Professor'],
    requiresUniversity: true,
  },
  {
    id: 'kemist',
    name: 'Kemist',
    description: 'Forskar om och analyserar kemiska substanser och reaktioner',
    riasec: { R: 3, I: 5, A: 2, S: 2, E: 2, C: 4 },
    bigFive: { openness: 80, conscientiousness: 85, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { forskning: 5, analytisk: 5, noggrannhet: 5 },
    challenges: { stillasittande: 4, koncentration: 5, precision: 5 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Kemiprogrammet', length: '3-5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Forskare', 'Laborant', 'Processoperatör'],
    careerPath: ['Kemist', 'Senior kemist', 'FoU-chef'],
    requiresUniversity: true,
  },
  {
    id: 'laborant',
    name: 'Laborant',
    description: 'Utför analyser och tester i laboratorium',
    riasec: { R: 3, I: 4, A: 1, S: 1, E: 2, C: 4 },
    bigFive: { openness: 60, conscientiousness: 85, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 2, koncentration: 5, motorik: 4, sensorisk: 4, energi: 3 },
    categories: { forskning: 4, analytisk: 4, noggrannhet: 5 },
    challenges: { stillasittande: 4, precision: 5, repetitivt: 4 },
    salary: '28 000 - 40 000 kr/mån',
    education: { name: 'Laboratorieutbildning', length: '2-3 år', type: 'YH' },
    prognosis: 'stable',
    relatedJobs: ['Kemist', 'Biomedicinare', 'Processoperatör'],
    careerPath: ['Laborant', 'Senior laborant', 'Laboratorieansvarig'],
    requiresUniversity: false,
  },
  // Säkerhet & Skydd
  {
    id: 'brandman',
    name: 'Brandman',
    description: 'Släcker bränder och utför räddningsinsatser',
    riasec: { R: 5, I: 3, A: 1, S: 4, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 85, extraversion: 65, agreeableness: 70, stability: 80 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 5, motorik: 5, sensorisk: 4, energi: 5 },
    categories: { praktisk: 5, social: 4, ledarskap_organisation: 3 },
    challenges: { fysisk_styrka: 5, fysisk_rorlighet: 5, tidspress: 5, sensorisk: 4 },
    salary: '30 000 - 42 000 kr/mån',
    education: { name: 'Räddningstjänstutbildning (SMO)', length: '2 år', type: 'MSB' },
    prognosis: 'stable',
    relatedJobs: ['Ambulanssjukvårdare', 'Polis', 'Räddningsledare'],
    careerPath: ['Brandman', 'Styrkeledare', 'Stationschef', 'Räddningschef'],
    requiresUniversity: false,
  },
  {
    id: 'vaktare',
    name: 'Väktare',
    description: 'Bevakar och skyddar fastigheter, personer och egendom',
    riasec: { R: 3, I: 2, A: 1, S: 3, E: 3, C: 3 },
    bigFive: { openness: 45, conscientiousness: 80, extraversion: 50, agreeableness: 55, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 3, sensorisk: 4, energi: 4 },
    categories: { praktisk: 3, social: 3, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 3, kvallsarbete: 5 },
    salary: '26 000 - 35 000 kr/mån',
    education: { name: 'Väktarutbildning', length: '8 veckor', type: 'Bevakningsföretag' },
    prognosis: 'growing',
    relatedJobs: ['Ordningsvakt', 'Polis', 'Säkerhetschef'],
    careerPath: ['Väktare', 'Rondbefäl', 'Objektledare', 'Säkerhetschef'],
    requiresUniversity: false,
  },
  // Event & Upplevelse
  {
    id: 'eventkoordinator',
    name: 'Eventkoordinator',
    description: 'Planerar och genomför evenemang, konferenser och fester',
    riasec: { R: 2, I: 2, A: 4, S: 4, E: 5, C: 3 },
    bigFive: { openness: 75, conscientiousness: 80, extraversion: 75, agreeableness: 70, stability: 55 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { kreativ: 4, kommunikation: 5, ledarskap_organisation: 4, social: 4 },
    challenges: { tidspress: 5, social_energi: 5, multitasking: 5, flexibilitet: 5 },
    salary: '28 000 - 45 000 kr/mån',
    education: { name: 'Event Management', length: '2 år', type: 'YH' },
    prognosis: 'growing',
    relatedJobs: ['Projektledare', 'Marknadsförare', 'Konferensvärd'],
    careerPath: ['Eventassistent', 'Eventkoordinator', 'Senior Event Manager', 'Event Director'],
    requiresUniversity: false,
  },
  {
    id: 'reseledar',
    name: 'Reseledare/Guide',
    description: 'Leder grupper på resor och visar sevärdheter',
    riasec: { R: 3, I: 3, A: 3, S: 5, E: 4, C: 2 },
    bigFive: { openness: 80, conscientiousness: 70, extraversion: 80, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 3, motorik: 3, sensorisk: 3, energi: 4 },
    categories: { social: 5, kommunikation: 5, pedagogik: 4 },
    challenges: { social_energi: 5, fysisk_rorlighet: 4, flexibilitet: 5 },
    salary: '25 000 - 38 000 kr/mån',
    education: { name: 'Turism och resande', length: '2-3 år', type: 'YH/Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Receptionist', 'Flygvärdinna', 'Turismentreprenör'],
    careerPath: ['Guide', 'Reseledare', 'Destinationsansvarig', 'Resechef'],
    requiresUniversity: false,
  },
  // Finans & Försäkring
  {
    id: 'bankradgivare',
    name: 'Bankrådgivare',
    description: 'Ger råd om lån, sparande och finansiella produkter',
    riasec: { R: 1, I: 3, A: 1, S: 4, E: 4, C: 4 },
    bigFive: { openness: 55, conscientiousness: 85, extraversion: 65, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { ekonomi: 5, kommunikation: 4, social: 4, analytisk: 3 },
    challenges: { social_energi: 5, stillasittande: 4, tidspress: 3 },
    salary: '32 000 - 50 000 kr/mån',
    education: { name: 'Ekonom/Bank och finans', length: '3 år', type: 'Universitet/YH' },
    prognosis: 'declining',
    relatedJobs: ['Försäkringsrådgivare', 'Ekonom', 'Controller'],
    careerPath: ['Bankrådgivare', 'Senior rådgivare', 'Privatbankir', 'Kontorschef'],
    requiresUniversity: true,
  },
  {
    id: 'forsakringshandlaggare',
    name: 'Försäkringshandläggare',
    description: 'Hanterar skadeanmälningar och bedömer försäkringsärenden',
    riasec: { R: 1, I: 3, A: 1, S: 3, E: 3, C: 5 },
    bigFive: { openness: 50, conscientiousness: 85, extraversion: 45, agreeableness: 65, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { analytisk: 4, noggrannhet: 5, kommunikation: 3 },
    challenges: { stillasittande: 5, repetitivt: 4, social_energi: 3 },
    salary: '30 000 - 45 000 kr/mån',
    education: { name: 'Försäkring/Ekonomi', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Skadereglerare', 'Försäkringssäljare', 'Underwriter'],
    careerPath: ['Handläggare', 'Senior handläggare', 'Team leader', 'Chef'],
    requiresUniversity: false,
  },
  // Ledarskap & Management
  {
    id: 'projektledare',
    name: 'Projektledare',
    description: 'Planerar, driver och koordinerar projekt inom olika branscher',
    riasec: { R: 2, I: 3, A: 2, S: 4, E: 5, C: 4 },
    bigFive: { openness: 70, conscientiousness: 85, extraversion: 70, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { ledarskap_organisation: 5, kommunikation: 5, analytisk: 4 },
    challenges: { tidspress: 5, social_energi: 4, multitasking: 5 },
    salary: '40 000 - 70 000 kr/mån',
    education: { name: 'Projektledning/Management', length: '3-5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Programledare', 'Verksamhetsutvecklare', 'Chef'],
    careerPath: ['Projektkoordinator', 'Projektledare', 'Senior PM', 'Programledare'],
    requiresUniversity: true,
  },
  {
    id: 'foretagare',
    name: 'Egenföretagare/Entreprenör',
    description: 'Driver eget företag och tar ansvar för hela verksamheten',
    riasec: { R: 3, I: 4, A: 3, S: 3, E: 5, C: 3 },
    bigFive: { openness: 85, conscientiousness: 75, extraversion: 65, agreeableness: 50, stability: 60 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { ledarskap_organisation: 5, affarer_forsaljning: 5, kreativ: 4 },
    challenges: { tidspress: 5, osakra_forutsattningar: 5, multitasking: 5 },
    salary: '0 - 150 000+ kr/mån',
    education: { name: 'Varierar/Ingen formell utbildning krävs', length: 'Varierar', type: 'Varierar' },
    prognosis: 'growing',
    relatedJobs: ['Projektledare', 'Säljare', 'Konsult'],
    careerPath: ['Grundare', 'VD', 'Serieentreprenör'],
    requiresUniversity: false,
  },
  // ===== FLER YRKEN FÖR ÖKAD TÄCKNING =====
  // Flyg & Transport
  {
    id: 'pilot',
    name: 'Pilot',
    description: 'Flyger passagerar- eller fraktflyg',
    riasec: { R: 4, I: 4, A: 1, S: 2, E: 3, C: 5 },
    bigFive: { openness: 55, conscientiousness: 95, extraversion: 50, agreeableness: 55, stability: 85 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 5, motorik: 4, sensorisk: 5, energi: 4 },
    categories: { teknisk: 5, noggrannhet: 5, analytisk: 4 },
    challenges: { koncentration: 5, tidspress: 4, oregelbundna_tider: 5 },
    salary: '50 000 - 120 000 kr/mån',
    education: { name: 'Trafikflygarutbildning', length: '2-3 år', type: 'Flygskola' },
    prognosis: 'growing',
    relatedJobs: ['Flygledare', 'Flygmekaniker', 'Kabinpersonal'],
    careerPath: ['Andrepilot', 'Kapten', 'Instruktör', 'Flygchef'],
    requiresUniversity: false,
  },
  {
    id: 'flygledare',
    name: 'Flygledare',
    description: 'Övervakar och dirigerar flygtrafik för säker flygning',
    riasec: { R: 2, I: 4, A: 1, S: 2, E: 3, C: 5 },
    bigFive: { openness: 50, conscientiousness: 95, extraversion: 45, agreeableness: 55, stability: 90 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 5, motorik: 2, sensorisk: 4, energi: 4 },
    categories: { teknisk: 4, noggrannhet: 5, analytisk: 5, kommunikation: 4 },
    challenges: { koncentration: 5, tidspress: 5, multitasking: 5 },
    salary: '45 000 - 80 000 kr/mån',
    education: { name: 'Flygledare (LFV)', length: '2 år', type: 'LFV Utbildning' },
    prognosis: 'stable',
    relatedJobs: ['Pilot', 'Flygmekaniker', 'Trafikplanerare'],
    careerPath: ['Flygledare', 'Instruktör', 'Enhetschef'],
    requiresUniversity: false,
  },
  {
    id: 'kabinpersonal',
    name: 'Kabinpersonal/Flygvärdinna',
    description: 'Ansvarar för passagerarnas säkerhet och service ombord',
    riasec: { R: 2, I: 1, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 75, agreeableness: 85, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { social: 5, kommunikation: 5, praktisk: 3 },
    challenges: { social_energi: 5, oregelbundna_tider: 5, fysisk_rorlighet: 4 },
    salary: '25 000 - 38 000 kr/mån',
    education: { name: 'Kabinpersonalutbildning', length: '6-12 veckor', type: 'Flygbolag' },
    prognosis: 'growing',
    relatedJobs: ['Receptionist', 'Reseledare', 'Kundtjänst'],
    careerPath: ['Kabinpersonal', 'Purser', 'Kabinchef'],
    requiresUniversity: false,
  },
  {
    id: 'busschauffor',
    name: 'Bussförare',
    description: 'Kör buss i lokal- eller långdistanstrafik',
    riasec: { R: 3, I: 1, A: 1, S: 3, E: 2, C: 3 },
    bigFive: { openness: 45, conscientiousness: 80, extraversion: 50, agreeableness: 65, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { praktisk: 4, social: 3, noggrannhet: 3 },
    challenges: { stillasittande: 5, koncentration: 4, social_energi: 3 },
    salary: '27 000 - 35 000 kr/mån',
    education: { name: 'D-körkort + YKB', length: '3-6 månader', type: 'Trafikskola' },
    prognosis: 'stable',
    relatedJobs: ['Lastbilschaufför', 'Spårvagnsförare', 'Taxichaufför'],
    careerPath: ['Bussförare', 'Trafikledare', 'Depåchef'],
    requiresUniversity: false,
  },
  // Hantverk & Tillverkning
  {
    id: 'urmakare',
    name: 'Urmakare',
    description: 'Reparerar och underhåller klockor och tidmätare',
    riasec: { R: 5, I: 3, A: 2, S: 2, E: 1, C: 4 },
    bigFive: { openness: 55, conscientiousness: 90, extraversion: 30, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 2, koncentration: 5, motorik: 5, sensorisk: 5, energi: 3 },
    categories: { teknisk: 5, praktisk: 5, noggrannhet: 5 },
    challenges: { precision: 5, stillasittande: 5, koncentration: 5 },
    salary: '28 000 - 42 000 kr/mån',
    education: { name: 'Urmakarutbildning', length: '2-3 år', type: 'YH/Lärling' },
    prognosis: 'declining',
    relatedJobs: ['Guldsmed', 'Optiker', 'Finmekaniker'],
    careerPath: ['Lärling', 'Urmakare', 'Mästarumakare'],
    requiresUniversity: false,
  },
  {
    id: 'guldsmed',
    name: 'Guldsmed',
    description: 'Tillverkar och reparerar smycken och silverföremål',
    riasec: { R: 4, I: 2, A: 5, S: 2, E: 2, C: 3 },
    bigFive: { openness: 75, conscientiousness: 85, extraversion: 35, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 5, motorik: 5, sensorisk: 4, energi: 3 },
    categories: { kreativ: 5, praktisk: 5, noggrannhet: 5 },
    challenges: { precision: 5, stillasittande: 5, koncentration: 5 },
    salary: '28 000 - 45 000 kr/mån',
    education: { name: 'Guldsmedsutbildning', length: '3 år', type: 'Gymnasium/YH' },
    prognosis: 'stable',
    relatedJobs: ['Urmakare', 'Smyckesdesigner', 'Gravör'],
    careerPath: ['Lärling', 'Guldsmed', 'Mästare', 'Egen butik'],
    requiresUniversity: false,
  },
  {
    id: 'glasblasare',
    name: 'Glasblåsare',
    description: 'Skapar konstföremål och bruksvaror i glas',
    riasec: { R: 4, I: 2, A: 5, S: 1, E: 2, C: 2 },
    bigFive: { openness: 80, conscientiousness: 70, extraversion: 35, agreeableness: 55, stability: 55 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 5, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { kreativ: 5, praktisk: 5, konst_kultur: 5 },
    challenges: { fysisk_rorlighet: 4, koncentration: 5, varme: 5 },
    salary: '25 000 - 40 000 kr/mån',
    education: { name: 'Glasblåsarutbildning', length: '2-3 år', type: 'Konstskola/Lärling' },
    prognosis: 'declining',
    relatedJobs: ['Keramiker', 'Skulptör', 'Konstnär'],
    careerPath: ['Lärling', 'Glasblåsare', 'Mästerglasblåsare'],
    requiresUniversity: false,
  },
  {
    id: 'keramiker',
    name: 'Keramiker',
    description: 'Skapar bruksföremål och konst i keramik och lera',
    riasec: { R: 4, I: 2, A: 5, S: 2, E: 2, C: 2 },
    bigFive: { openness: 85, conscientiousness: 65, extraversion: 40, agreeableness: 60, stability: 55 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 4, energi: 3 },
    categories: { kreativ: 5, praktisk: 5, konst_kultur: 5 },
    challenges: { koncentration: 4, fysisk_rorlighet: 3 },
    salary: '22 000 - 38 000 kr/mån',
    education: { name: 'Keramikutbildning', length: '2-3 år', type: 'Konstskola/Folkhögskola' },
    prognosis: 'stable',
    relatedJobs: ['Glasblåsare', 'Skulptör', 'Konstnär'],
    careerPath: ['Elev', 'Keramiker', 'Egen verkstad'],
    requiresUniversity: false,
  },
  {
    id: 'tapetserare',
    name: 'Tapetserare/Möbelrenoverare',
    description: 'Klär om och renoverar möbler och inredning',
    riasec: { R: 4, I: 2, A: 3, S: 2, E: 2, C: 3 },
    bigFive: { openness: 60, conscientiousness: 80, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, kreativ: 4, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, precision: 4, fysisk_styrka: 3 },
    salary: '26 000 - 38 000 kr/mån',
    education: { name: 'Möbelsnickeri/Tapetserarutbildning', length: '2-3 år', type: 'YH/Lärling' },
    prognosis: 'stable',
    relatedJobs: ['Snickare', 'Inredare', 'Antikvitetshandlare'],
    careerPath: ['Lärling', 'Tapetserare', 'Egen verkstad'],
    requiresUniversity: false,
  },
  // Kultur & Media
  {
    id: 'filmregissor',
    name: 'Filmregissör',
    description: 'Leder och skapar film- och TV-produktioner',
    riasec: { R: 2, I: 3, A: 5, S: 4, E: 5, C: 2 },
    bigFive: { openness: 90, conscientiousness: 70, extraversion: 65, agreeableness: 50, stability: 50 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 4, energi: 4 },
    categories: { kreativ: 5, kommunikation: 5, ledarskap_organisation: 5, konst_kultur: 5 },
    challenges: { tidspress: 5, social_energi: 5, osakra_forutsattningar: 5 },
    salary: '30 000 - 100 000+ kr/mån',
    education: { name: 'Filmutbildning/Regi', length: '3-5 år', type: 'Filmskola/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Producent', 'Manusförfattare', 'Fotograf'],
    careerPath: ['Regiassistent', 'Regissör', 'Etablerad regissör'],
    requiresUniversity: true,
  },
  {
    id: 'ljudtekniker',
    name: 'Ljudtekniker',
    description: 'Hanterar ljud för konserter, film, TV eller radio',
    riasec: { R: 4, I: 3, A: 4, S: 2, E: 2, C: 3 },
    bigFive: { openness: 75, conscientiousness: 75, extraversion: 45, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 5, motorik: 3, sensorisk: 5, energi: 3 },
    categories: { teknisk: 5, kreativ: 4, konst_kultur: 4 },
    challenges: { koncentration: 5, oregelbundna_tider: 4, sensorisk: 3 },
    salary: '28 000 - 50 000 kr/mån',
    education: { name: 'Ljudteknik', length: '2-3 år', type: 'YH/Folkhögskola' },
    prognosis: 'stable',
    relatedJobs: ['Musikproducent', 'Ljustekniker', 'Musiker'],
    careerPath: ['Assistent', 'Ljudtekniker', 'Chefstekniker', 'Studiochef'],
    requiresUniversity: false,
  },
  {
    id: 'ljustekniker',
    name: 'Ljustekniker',
    description: 'Skapar ljussättning för teater, konserter och events',
    riasec: { R: 4, I: 3, A: 4, S: 2, E: 2, C: 3 },
    bigFive: { openness: 75, conscientiousness: 75, extraversion: 45, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { teknisk: 5, kreativ: 4, konst_kultur: 4 },
    challenges: { oregelbundna_tider: 5, fysisk_rorlighet: 4, koncentration: 4 },
    salary: '27 000 - 45 000 kr/mån',
    education: { name: 'Ljus- och scenteknik', length: '2 år', type: 'YH' },
    prognosis: 'stable',
    relatedJobs: ['Ljudtekniker', 'Scentekniker', 'Eventkoordinator'],
    careerPath: ['Assistent', 'Ljustekniker', 'Ljusdesigner', 'Teknisk chef'],
    requiresUniversity: false,
  },
  {
    id: 'skadespelare',
    name: 'Skådespelare',
    description: 'Spelar roller i teater, film och TV',
    riasec: { R: 2, I: 2, A: 5, S: 4, E: 4, C: 1 },
    bigFive: { openness: 90, conscientiousness: 60, extraversion: 75, agreeableness: 60, stability: 45 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { kreativ: 5, kommunikation: 5, konst_kultur: 5 },
    challenges: { social_energi: 5, osakra_forutsattningar: 5, koncentration: 4 },
    salary: '20 000 - 80 000 kr/mån',
    education: { name: 'Scenskola/Teaterhögskola', length: '3-4 år', type: 'Konsthögskola' },
    prognosis: 'stable',
    relatedJobs: ['Sångare', 'Dansare', 'Regissör'],
    careerPath: ['Elev', 'Skådespelare', 'Etablerad artist'],
    requiresUniversity: true,
  },
  {
    id: 'dansare',
    name: 'Dansare/Koreograf',
    description: 'Framför och skapar dans för teater, film och shower',
    riasec: { R: 3, I: 2, A: 5, S: 3, E: 3, C: 2 },
    bigFive: { openness: 85, conscientiousness: 75, extraversion: 65, agreeableness: 60, stability: 50 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 5, sensorisk: 4, energi: 5 },
    categories: { kreativ: 5, konst_kultur: 5, praktisk: 4 },
    challenges: { fysisk_rorlighet: 5, koncentration: 4, osakra_forutsattningar: 4 },
    salary: '22 000 - 45 000 kr/mån',
    education: { name: 'Dansutbildning', length: '3-4 år', type: 'Danshögskola' },
    prognosis: 'stable',
    relatedJobs: ['Skådespelare', 'Musiker', 'Fitnessinstruktör'],
    careerPath: ['Dansare', 'Koreograf', 'Konstnärlig ledare'],
    requiresUniversity: true,
  },
  {
    id: 'bibliotekarie',
    name: 'Bibliotekarie',
    description: 'Hanterar bibliotekssamlingar och hjälper besökare',
    riasec: { R: 1, I: 4, A: 3, S: 4, E: 2, C: 4 },
    bigFive: { openness: 80, conscientiousness: 80, extraversion: 45, agreeableness: 75, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { pedagogik: 4, social: 4, analytisk: 3, administration_kontor: 3 },
    challenges: { stillasittande: 4, social_energi: 3, repetitivt: 3 },
    salary: '28 000 - 38 000 kr/mån',
    education: { name: 'Biblioteks- och informationsvetenskap', length: '3 år', type: 'Universitet' },
    prognosis: 'declining',
    relatedJobs: ['Arkivarie', 'Lärare', 'Förlagsredaktör'],
    careerPath: ['Bibliotekarie', 'Specialbibliotekarie', 'Bibliotekschef'],
    requiresUniversity: true,
  },
  {
    id: 'arkivarie',
    name: 'Arkivarie',
    description: 'Bevarar och ordnar historiska dokument och material',
    riasec: { R: 2, I: 4, A: 2, S: 2, E: 2, C: 5 },
    bigFive: { openness: 70, conscientiousness: 90, extraversion: 35, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { analytisk: 4, noggrannhet: 5, forskning: 4 },
    challenges: { stillasittande: 5, repetitivt: 4, social_energi: 2 },
    salary: '30 000 - 42 000 kr/mån',
    education: { name: 'Arkivvetenskap', length: '3-5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Bibliotekarie', 'Historiker', 'Museolog'],
    careerPath: ['Arkivarie', 'Specialistarkivarie', 'Arkivchef'],
    requiresUniversity: true,
  },
  // Idrott & Fritid
  {
    id: 'personlig_tranare',
    name: 'Personlig tränare',
    description: 'Coachar och motiverar kunder att nå sina träningsmål',
    riasec: { R: 3, I: 2, A: 2, S: 5, E: 4, C: 2 },
    bigFive: { openness: 65, conscientiousness: 75, extraversion: 80, agreeableness: 75, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 3, motorik: 4, sensorisk: 3, energi: 5 },
    categories: { social: 5, vard: 3, kommunikation: 4, praktisk: 4 },
    challenges: { social_energi: 5, fysisk_rorlighet: 5, oregelbundna_tider: 4 },
    salary: '25 000 - 50 000 kr/mån',
    education: { name: 'PT-utbildning', length: '6-12 månader', type: 'Privat utbildning' },
    prognosis: 'growing',
    relatedJobs: ['Idrottslärare', 'Fysioterapeut', 'Kostrådgivare'],
    careerPath: ['PT', 'Senior PT', 'Gymagare', 'Utbildare'],
    requiresUniversity: false,
  },
  {
    id: 'idrottslakare',
    name: 'Idrottsläkare',
    description: 'Behandlar idrottares skador och optimerar prestationer',
    riasec: { R: 3, I: 5, A: 1, S: 5, E: 3, C: 3 },
    bigFive: { openness: 65, conscientiousness: 85, extraversion: 55, agreeableness: 75, stability: 70 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 5, motorik: 3, sensorisk: 4, energi: 4 },
    categories: { vard: 5, analytisk: 5, forskning: 4, social: 4 },
    challenges: { tidspress: 4, social_energi: 4, oregelbundna_tider: 4 },
    salary: '50 000 - 90 000 kr/mån',
    education: { name: 'Läkarprogrammet + specialisering', length: '7-10 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Fysioterapeut', 'Naprapat', 'Kiropraktor'],
    careerPath: ['AT-läkare', 'ST-läkare', 'Idrottsläkare', 'Överläkare'],
    requiresUniversity: true,
  },
  {
    id: 'ridlarare',
    name: 'Ridlärare',
    description: 'Undervisar i ridning och hästhantering',
    riasec: { R: 4, I: 2, A: 2, S: 5, E: 3, C: 2 },
    bigFive: { openness: 60, conscientiousness: 75, extraversion: 60, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { pedagogik: 5, social: 4, natur: 5, praktisk: 4 },
    challenges: { fysisk_rorlighet: 5, social_energi: 4, utomhusarbete: 5 },
    salary: '24 000 - 35 000 kr/mån',
    education: { name: 'Rid- och hästutbildning', length: '2-3 år', type: 'Gymnasium/Folkhögskola' },
    prognosis: 'stable',
    relatedJobs: ['Hästskötare', 'Djurskötare', 'Idrottslärare'],
    careerPath: ['Ridlärare', 'Chefinstruktör', 'Stallchef'],
    requiresUniversity: false,
  },
  {
    id: 'siminstruktor',
    name: 'Simlärare/Badmästare',
    description: 'Undervisar i simning och övervakar badanläggningar',
    riasec: { R: 3, I: 2, A: 1, S: 5, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 80, extraversion: 65, agreeableness: 80, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { pedagogik: 5, social: 5, praktisk: 4 },
    challenges: { social_energi: 5, fysisk_rorlighet: 4, koncentration: 4 },
    salary: '24 000 - 32 000 kr/mån',
    education: { name: 'Simlärare/Badmästarutbildning', length: '6-12 månader', type: 'Svenska Livräddningssällskapet' },
    prognosis: 'stable',
    relatedJobs: ['Personlig tränare', 'Idrottslärare', 'Räddningstjänst'],
    careerPath: ['Simlärare', 'Badmästare', 'Anläggningschef'],
    requiresUniversity: false,
  },
  // Jordbruk & Djur
  {
    id: 'lantbrukare',
    name: 'Lantbrukare/Bonde',
    description: 'Driver jordbruk med djur och/eller växtodling',
    riasec: { R: 5, I: 3, A: 1, S: 2, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 80, extraversion: 45, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 4, motorik: 5, sensorisk: 4, energi: 5 },
    categories: { natur: 5, praktisk: 5, utomhusarbete: 5, affarer_forsaljning: 3 },
    challenges: { fysisk_styrka: 5, fysisk_rorlighet: 5, vaderberoende: 5, oregelbundna_tider: 5 },
    salary: '25 000 - 50 000 kr/mån',
    education: { name: 'Naturbruksprogrammet/Lantmästare', length: '2-4 år', type: 'Gymnasium/SLU' },
    prognosis: 'stable',
    relatedJobs: ['Trädgårdsmästare', 'Agronom', 'Maskinförare'],
    careerPath: ['Medhjälpare', 'Lantbrukare', 'Ägare'],
    requiresUniversity: false,
  },
  {
    id: 'agronom',
    name: 'Agronom',
    description: 'Expert på växtodling och hållbart jordbruk',
    riasec: { R: 3, I: 5, A: 2, S: 3, E: 3, C: 3 },
    bigFive: { openness: 75, conscientiousness: 80, extraversion: 50, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 4, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { natur: 5, forskning: 5, analytisk: 4, utomhusarbete: 3 },
    challenges: { social_energi: 3, utomhusarbete: 3 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Agronomprogrammet', length: '5 år', type: 'SLU' },
    prognosis: 'growing',
    relatedJobs: ['Lantbrukare', 'Rådgivare', 'Forskare'],
    careerPath: ['Agronom', 'Rådgivare', 'Projektledare', 'Forskare'],
    requiresUniversity: true,
  },
  {
    id: 'djursjukskotare',
    name: 'Djursjukskötare',
    description: 'Vårdar djur och assisterar veterinärer',
    riasec: { R: 3, I: 3, A: 1, S: 4, E: 2, C: 3 },
    bigFive: { openness: 60, conscientiousness: 80, extraversion: 50, agreeableness: 85, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { vard: 5, natur: 4, praktisk: 4, social: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 3, fysisk_styrka: 3 },
    salary: '26 000 - 35 000 kr/mån',
    education: { name: 'Djursjukskötarutbildning', length: '3 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Veterinär', 'Djurskötare', 'Hundtränare'],
    careerPath: ['Djursjukskötare', 'Specialist', 'Klinikchef'],
    requiresUniversity: true,
  },
  {
    id: 'hundtranare',
    name: 'Hundtränare/Hundinstruktör',
    description: 'Tränar hundar och utbildar hundägare',
    riasec: { R: 3, I: 2, A: 2, S: 5, E: 3, C: 2 },
    bigFive: { openness: 65, conscientiousness: 75, extraversion: 60, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { social: 4, pedagogik: 5, natur: 4, praktisk: 4 },
    challenges: { fysisk_rorlighet: 5, social_energi: 4, utomhusarbete: 4 },
    salary: '22 000 - 35 000 kr/mån',
    education: { name: 'Hundtränare/Etologiutbildning', length: '1-2 år', type: 'Privat/Folkhögskola' },
    prognosis: 'growing',
    relatedJobs: ['Djurskötare', 'Djursjukskötare', 'Veterinär'],
    careerPath: ['Hundtränare', 'Certifierad instruktör', 'Egen verksamhet'],
    requiresUniversity: false,
  },
  // Teknik & Industri
  {
    id: 'cnc_operator',
    name: 'CNC-operatör',
    description: 'Programmerar och övervakar datastyrda verktyg',
    riasec: { R: 5, I: 3, A: 1, S: 1, E: 2, C: 4 },
    bigFive: { openness: 55, conscientiousness: 85, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 2, koncentration: 5, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { teknisk: 5, praktisk: 5, noggrannhet: 5, it: 3 },
    challenges: { koncentration: 5, repetitivt: 4, stillasittande: 3 },
    salary: '30 000 - 42 000 kr/mån',
    education: { name: 'Industriteknisk/CNC-utbildning', length: '2 år', type: 'YH/Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Mekaniker', 'Svetsare', 'Maskinoperatör'],
    careerPath: ['Operatör', 'Programmerare', 'Produktionsledare'],
    requiresUniversity: false,
  },
  {
    id: 'industrirobotprogrammerare',
    name: 'Industrirobottekniker',
    description: 'Programmerar och underhåller industrirobotar',
    riasec: { R: 4, I: 5, A: 2, S: 2, E: 2, C: 4 },
    bigFive: { openness: 70, conscientiousness: 85, extraversion: 40, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { teknisk: 5, it: 5, analytisk: 4, noggrannhet: 4 },
    challenges: { koncentration: 5, stillasittande: 4 },
    salary: '38 000 - 55 000 kr/mån',
    education: { name: 'Automationsteknik/Robotteknik', length: '2-3 år', type: 'YH' },
    prognosis: 'growing',
    relatedJobs: ['Automationstekniker', 'Programmerare', 'CNC-operatör'],
    careerPath: ['Tekniker', 'Programmerare', 'Projektledare', 'Automationschef'],
    requiresUniversity: false,
  },
  {
    id: 'kvalitetstekniker',
    name: 'Kvalitetstekniker',
    description: 'Säkerställer att produkter och processer uppfyller kvalitetskrav',
    riasec: { R: 3, I: 4, A: 1, S: 2, E: 2, C: 5 },
    bigFive: { openness: 60, conscientiousness: 90, extraversion: 40, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 5, motorik: 2, sensorisk: 4, energi: 3 },
    categories: { analytisk: 5, noggrannhet: 5, teknisk: 4 },
    challenges: { koncentration: 5, stillasittande: 4, repetitivt: 4 },
    salary: '35 000 - 50 000 kr/mån',
    education: { name: 'Kvalitetsteknik/Produktionsteknik', length: '2-3 år', type: 'YH/Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Produktionstekniker', 'Processoperatör', 'Projektledare'],
    careerPath: ['Kvalitetstekniker', 'Senior', 'Kvalitetschef'],
    requiresUniversity: false,
  },
  // Handel & Affärer
  {
    id: 'inkopare',
    name: 'Inköpare',
    description: 'Förhandlar och köper in varor och tjänster för företag',
    riasec: { R: 1, I: 3, A: 1, S: 3, E: 4, C: 4 },
    bigFive: { openness: 60, conscientiousness: 80, extraversion: 55, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { ekonomi: 4, analytisk: 4, affarer_forsaljning: 4, kommunikation: 4 },
    challenges: { tidspress: 4, social_energi: 4 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Ekonomi/Logistik', length: '3 år', type: 'Universitet/YH' },
    prognosis: 'stable',
    relatedJobs: ['Logistiker', 'Säljare', 'Category Manager'],
    careerPath: ['Inköpsassistent', 'Inköpare', 'Senior inköpare', 'Inköpschef'],
    requiresUniversity: true,
  },
  {
    id: 'fastighetsmaklare',
    name: 'Fastighetsmäklare',
    description: 'Förmedlar försäljning och köp av bostäder och fastigheter',
    riasec: { R: 2, I: 2, A: 2, S: 5, E: 5, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 80, agreeableness: 65, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 3, sensorisk: 3, energi: 4 },
    categories: { affarer_forsaljning: 5, kommunikation: 5, social: 5, ekonomi: 3 },
    challenges: { social_energi: 5, tidspress: 4, oregelbundna_tider: 5 },
    salary: '30 000 - 100 000+ kr/mån',
    education: { name: 'Fastighetsmäklarutbildning', length: '2 år', type: 'Universitet/YH' },
    prognosis: 'stable',
    relatedJobs: ['Säljare', 'Bankrådgivare', 'Försäkringssäljare'],
    careerPath: ['Fastighetsmäklare', 'Senior mäklare', 'Kontorschef', 'Egen byrå'],
    requiresUniversity: true,
  },
  {
    id: 'key_account_manager',
    name: 'Key Account Manager',
    description: 'Ansvarar för relationer med företagets viktigaste kunder',
    riasec: { R: 1, I: 3, A: 2, S: 5, E: 5, C: 3 },
    bigFive: { openness: 70, conscientiousness: 80, extraversion: 75, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 4 },
    categories: { affarer_forsaljning: 5, kommunikation: 5, ledarskap_organisation: 4, social: 5 },
    challenges: { social_energi: 5, tidspress: 4, resande: 4 },
    salary: '40 000 - 80 000 kr/mån',
    education: { name: 'Ekonomi/Marknadsföring', length: '3-5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Säljare', 'Marknadsförare', 'Affärsutvecklare'],
    careerPath: ['Säljare', 'Account Manager', 'KAM', 'Säljchef'],
    requiresUniversity: true,
  },
  // Offentlig sektor
  {
    id: 'tulltjansteman',
    name: 'Tulltjänsteman',
    description: 'Kontrollerar import och export av varor',
    riasec: { R: 3, I: 3, A: 1, S: 3, E: 3, C: 4 },
    bigFive: { openness: 55, conscientiousness: 85, extraversion: 50, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 4, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { analytisk: 4, noggrannhet: 5, kommunikation: 3 },
    challenges: { oregelbundna_tider: 4, social_energi: 3 },
    salary: '30 000 - 42 000 kr/mån',
    education: { name: 'Tullverkets grundutbildning', length: '1 år', type: 'Internutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Polis', 'Gränskontroll', 'Säkerhetskontrollant'],
    careerPath: ['Tulltjänsteman', 'Tullinspektör', 'Gruppchef'],
    requiresUniversity: false,
  },
  {
    id: 'miljoinspektor',
    name: 'Miljöinspektör',
    description: 'Utför tillsyn och kontroll av miljöfarlig verksamhet',
    riasec: { R: 3, I: 5, A: 1, S: 3, E: 3, C: 4 },
    bigFive: { openness: 70, conscientiousness: 85, extraversion: 50, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 4, motorik: 3, sensorisk: 4, energi: 3 },
    categories: { natur: 5, analytisk: 5, forskning: 3, kommunikation: 4 },
    challenges: { utomhusarbete: 4, social_energi: 4 },
    salary: '32 000 - 45 000 kr/mån',
    education: { name: 'Miljövetenskap/Miljöteknik', length: '3-5 år', type: 'Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Miljökonsult', 'Biolog', 'Hälsoskyddsinspektör'],
    careerPath: ['Miljöinspektör', 'Senior inspektör', 'Enhetschef'],
    requiresUniversity: true,
  },
  {
    id: 'arbetsformedlare',
    name: 'Arbetsförmedlare',
    description: 'Hjälper arbetssökande att hitta jobb och matchar med arbetsgivare',
    riasec: { R: 1, I: 3, A: 1, S: 5, E: 4, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 65, agreeableness: 80, stability: 60 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { social: 5, kommunikation: 5, ledarskap_organisation: 3 },
    challenges: { social_energi: 5, tidspress: 4 },
    salary: '30 000 - 40 000 kr/mån',
    education: { name: 'Samhällsvetenskap/Beteendevetenskap', length: '3 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['HR-specialist', 'Rekryterare', 'Studie- och yrkesvägledare'],
    careerPath: ['Arbetsförmedlare', 'Handläggare', 'Teamledare', 'Enhetschef'],
    requiresUniversity: true,
  },
  // Övriga specialistyrken
  {
    id: 'kriminaltekniker',
    name: 'Kriminaltekniker',
    description: 'Säkrar och analyserar tekniska bevis vid brottsplatser',
    riasec: { R: 4, I: 5, A: 2, S: 2, E: 2, C: 5 },
    bigFive: { openness: 70, conscientiousness: 95, extraversion: 40, agreeableness: 55, stability: 70 },
    icf: { kognitiv: 5, kommunikation: 3, koncentration: 5, motorik: 4, sensorisk: 5, energi: 3 },
    categories: { analytisk: 5, noggrannhet: 5, forskning: 4 },
    challenges: { koncentration: 5, precision: 5, oregelbundna_tider: 4 },
    salary: '32 000 - 48 000 kr/mån',
    education: { name: 'Forensisk vetenskap/Kriminaltekniker', length: '3-5 år', type: 'Universitet/Polishögskolan' },
    prognosis: 'stable',
    relatedJobs: ['Polis', 'Kemist', 'Rättsläkare'],
    careerPath: ['Kriminaltekniker', 'Specialist', 'Gruppchef'],
    requiresUniversity: true,
  },
  {
    id: 'tolk',
    name: 'Tolk',
    description: 'Översätter muntlig kommunikation mellan språk',
    riasec: { R: 1, I: 4, A: 3, S: 4, E: 2, C: 3 },
    bigFive: { openness: 80, conscientiousness: 85, extraversion: 50, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 5, koncentration: 5, motorik: 2, sensorisk: 4, energi: 4 },
    categories: { kommunikation: 5, social: 4, analytisk: 3 },
    challenges: { koncentration: 5, social_energi: 4, tidspress: 4 },
    salary: '28 000 - 50 000 kr/mån',
    education: { name: 'Tolkutbildning', length: '1-3 år', type: 'Folkhögskola/Universitet' },
    prognosis: 'growing',
    relatedJobs: ['Översättare', 'Språklärare', 'Kommunikatör'],
    careerPath: ['Tolk', 'Auktoriserad tolk', 'Konferenstolk'],
    requiresUniversity: false,
  },
  {
    id: 'oversattare',
    name: 'Översättare',
    description: 'Översätter skriven text mellan språk',
    riasec: { R: 1, I: 4, A: 4, S: 2, E: 2, C: 4 },
    bigFive: { openness: 85, conscientiousness: 85, extraversion: 35, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { kreativ: 4, analytisk: 4, kommunikation: 4, noggrannhet: 5 },
    challenges: { stillasittande: 5, koncentration: 5, social_energi: 2 },
    salary: '30 000 - 50 000 kr/mån',
    education: { name: 'Översättarutbildning/Språk', length: '3-5 år', type: 'Universitet' },
    prognosis: 'declining',
    relatedJobs: ['Tolk', 'Redaktör', 'Författare'],
    careerPath: ['Översättare', 'Senior översättare', 'Granskare', 'Projektledare'],
    requiresUniversity: true,
  },
  {
    id: 'meteorolog',
    name: 'Meteorolog',
    description: 'Analyserar väderdata och gör väderprognoser',
    riasec: { R: 3, I: 5, A: 2, S: 2, E: 3, C: 4 },
    bigFive: { openness: 75, conscientiousness: 85, extraversion: 50, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 5, kommunikation: 4, koncentration: 5, motorik: 2, sensorisk: 3, energi: 3 },
    categories: { forskning: 5, analytisk: 5, it: 4, kommunikation: 3 },
    challenges: { koncentration: 5, oregelbundna_tider: 4 },
    salary: '35 000 - 50 000 kr/mån',
    education: { name: 'Meteorologi/Fysik', length: '5 år', type: 'Universitet' },
    prognosis: 'stable',
    relatedJobs: ['Klimatforskare', 'Geofysiker', 'Dataanalytiker'],
    careerPath: ['Meteorolog', 'Prognoschef', 'Forskare'],
    requiresUniversity: true,
  },
  {
    id: 'naprapat',
    name: 'Naprapat',
    description: 'Behandlar smärtor i muskler och leder med manuella tekniker',
    riasec: { R: 4, I: 3, A: 2, S: 5, E: 3, C: 3 },
    bigFive: { openness: 65, conscientiousness: 80, extraversion: 60, agreeableness: 80, stability: 65 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { vard: 5, social: 4, praktisk: 5 },
    challenges: { fysisk_rorlighet: 5, social_energi: 4, fysisk_styrka: 3 },
    salary: '35 000 - 55 000 kr/mån',
    education: { name: 'Naprapatprogrammet', length: '4 år', type: 'Privat högskola' },
    prognosis: 'growing',
    relatedJobs: ['Fysioterapeut', 'Kiropraktor', 'Massageterapeut'],
    careerPath: ['Naprapat', 'Specialist', 'Egen klinik'],
    requiresUniversity: true,
  },
  {
    id: 'massageterapeut',
    name: 'Massageterapeut',
    description: 'Behandlar spänningar och främjar välmående genom massage',
    riasec: { R: 4, I: 2, A: 2, S: 5, E: 2, C: 2 },
    bigFive: { openness: 65, conscientiousness: 75, extraversion: 55, agreeableness: 85, stability: 60 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { vard: 4, social: 4, praktisk: 5 },
    challenges: { fysisk_rorlighet: 5, social_energi: 4, fysisk_styrka: 4 },
    salary: '24 000 - 40 000 kr/mån',
    education: { name: 'Massageterapiutbildning', length: '1-2 år', type: 'Privat utbildning/YH' },
    prognosis: 'growing',
    relatedJobs: ['Naprapat', 'Fysioterapeut', 'Friskvårdskonsult'],
    careerPath: ['Massageterapeut', 'Specialist', 'Egen verksamhet'],
    requiresUniversity: false,
  },
  // ===== TILLAGDA 2026-08-21 =====
  //
  // Fjorton yrken valda mot Arbetsförmedlingens FAKTISKA trettio största
  // yrkesgrupper (hämtade 2026-08-21 via stats=occupation-group), korsat mot
  // vad listan redan hade. Det som saknades var nästan uteslutande yrken utan
  // högskolekrav — alltså precis den del av arbetsmarknaden portalens
  // målgrupp söker sig till. Antal annonser i AF:s platsbank vid urvalet står
  // i kommentaren per yrke, som belägg för att posten hör hemma här.
  //
  // RIASEC-, Big Five- och ICF-koderna är redaktionella, precis som för de
  // 135 befintliga posterna. De kommer inte från O*NET, SSYK eller någon
  // validerad källa. Lönespannen likaså — se LONEUPPGIFTER_ANGAVS nedan.
  {
    id: 'koksbitrade',
    name: 'Köks- och restaurangbiträde',
    description: 'Förbereder råvaror, diskar och håller ordning i köket tillsammans med kockarna',
    riasec: { R: 4, I: 1, A: 2, S: 3, E: 1, C: 3 },
    bigFive: { openness: 40, conscientiousness: 65, extraversion: 45, agreeableness: 60, stability: 55 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 4, noggrannhet: 3, social: 2 },
    challenges: { fysisk_rorlighet: 4, tidspress: 4, sensorisk: 3, social_energi: 2 },
    salary: '24 000 - 28 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Kock', 'Måltidsbiträde', 'Städare/Lokalvårdare'],
    careerPath: ['Köksbiträde', 'Kockassistent', 'Kock'],
    requiresUniversity: false,
  }, // AF: 836 annonser (7:e största gruppen)
  {
    id: 'kundtjanstmedarbetare',
    name: 'Kundtjänstmedarbetare',
    description: 'Svarar på frågor från kunder via telefon, chatt och mejl och löser deras ärenden',
    riasec: { R: 1, I: 2, A: 1, S: 4, E: 3, C: 4 },
    bigFive: { openness: 45, conscientiousness: 70, extraversion: 60, agreeableness: 75, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 1, sensorisk: 3, energi: 3 },
    categories: { affarer_forsaljning: 4, kommunikation: 4, administration_kontor: 3, social: 4 },
    challenges: { stillasittande: 4, social_energi: 4, multitasking: 4, koncentration: 3 },
    salary: '26 000 - 32 000 kr/mån',
    education: { name: 'Gymnasium, ofta med intern utbildning', length: 'Några veckor upplärning', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Receptionist/Hotellreceptionist', 'Administratör', 'Butikssäljare/Detaljhandel'],
    careerPath: ['Kundtjänstmedarbetare', 'Teamledare kundtjänst', 'Kundtjänstchef'],
    requiresUniversity: false,
  }, // AF: 372 annonser
  {
    id: 'vardbitrade_hemtjanst',
    name: 'Vårdbiträde inom hemtjänst',
    description: 'Hjälper människor i deras hem med vardagen — måltider, städning, sällskap och stöd',
    riasec: { R: 2, I: 1, A: 1, S: 5, E: 1, C: 2 },
    bigFive: { openness: 45, conscientiousness: 70, extraversion: 55, agreeableness: 85, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { vard: 5, social: 5, praktisk: 3, kommunikation: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 4, kvallsarbete: 3, tidspress: 3 },
    salary: '25 000 - 29 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs — vård- och omsorgsutbildning är meriterande', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'growing',
    relatedJobs: ['Undersköterska', 'Personlig assistent', 'Boendestödjare'],
    careerPath: ['Vårdbiträde', 'Undersköterska', 'Specialistundersköterska'],
    requiresUniversity: false,
  }, // AF: 889 annonser för undersköterskor i hemtjänst (6:e största)
  {
    id: 'boendestodjare',
    name: 'Boendestödjare',
    description: 'Stöttar personer med psykisk ohälsa eller funktionsnedsättning att klara sin vardag',
    riasec: { R: 2, I: 2, A: 2, S: 5, E: 2, C: 2 },
    bigFive: { openness: 55, conscientiousness: 70, extraversion: 50, agreeableness: 85, stability: 75 },
    icf: { kognitiv: 3, kommunikation: 5, koncentration: 3, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { vard: 4, social: 5, kommunikation: 5, praktisk: 2 },
    challenges: { social_energi: 5, kvallsarbete: 3, multitasking: 2 },
    salary: '27 000 - 32 000 kr/mån',
    education: { name: 'Gymnasium, gärna vård och omsorg eller barn och fritid', length: '3 år', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Behandlingsassistent', 'Personlig assistent', 'Undersköterska'],
    careerPath: ['Boendestödjare', 'Samordnare', 'Enhetschef'],
    requiresUniversity: false,
  }, // AF: 364 annonser (Vårdare, boendestödjare)
  {
    id: 'behandlingsassistent',
    name: 'Behandlingsassistent',
    description: 'Arbetar med människor i behandling — samtal, rutiner och stöd i vardagen på boenden och behandlingshem',
    riasec: { R: 2, I: 3, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 60, conscientiousness: 75, extraversion: 50, agreeableness: 80, stability: 80 },
    icf: { kognitiv: 4, kommunikation: 5, koncentration: 4, motorik: 3, sensorisk: 3, energi: 4 },
    categories: { vard: 4, social: 5, kommunikation: 5, noggrannhet: 3 },
    challenges: { social_energi: 5, kvallsarbete: 4, tidspress: 3, koncentration: 3 },
    salary: '28 000 - 34 000 kr/mån',
    education: { name: 'Behandlingspedagog eller motsvarande yrkeshögskola', length: '2 år', type: 'Yrkeshögskola' },
    prognosis: 'growing',
    relatedJobs: ['Boendestödjare', 'Socialsekreterare', 'Undersköterska'],
    careerPath: ['Behandlingsassistent', 'Behandlingspedagog', 'Föreståndare'],
    requiresUniversity: false,
  }, // AF: 370 annonser
  {
    id: 'elevassistent',
    name: 'Elevassistent',
    description: 'Stöttar en eller flera elever i skolan, i klassrummet och på raster',
    riasec: { R: 2, I: 2, A: 2, S: 5, E: 2, C: 3 },
    bigFive: { openness: 55, conscientiousness: 70, extraversion: 50, agreeableness: 85, stability: 75 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 3, sensorisk: 2, energi: 3 },
    categories: { social: 5, pedagogik: 4, kommunikation: 4, vard: 2 },
    challenges: { social_energi: 4, sensorisk: 4, multitasking: 3, koncentration: 3 },
    salary: '24 000 - 29 000 kr/mån',
    education: { name: 'Gymnasium, gärna barn och fritid', length: '3 år', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Barnskötare', 'Boendestödjare', 'Personlig assistent'],
    careerPath: ['Elevassistent', 'Barnskötare', 'Lärarassistent'],
    requiresUniversity: false,
  },
  {
    id: 'maskinoperator',
    name: 'Maskinoperatör inom industri',
    description: 'Sköter och övervakar maskiner som tillverkar detaljer, kontrollerar kvalitet och åtgärdar stopp',
    riasec: { R: 5, I: 2, A: 1, S: 1, E: 1, C: 4 },
    bigFive: { openness: 35, conscientiousness: 80, extraversion: 35, agreeableness: 50, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { teknisk: 4, praktisk: 5, noggrannhet: 5 },
    challenges: { fysisk_rorlighet: 3, sensorisk: 4, koncentration: 4, kvallsarbete: 3 },
    salary: '28 000 - 34 000 kr/mån',
    education: { name: 'Gymnasium industriteknik eller upplärning på plats', length: '3 år alternativt upplärning', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['CNC-operatör', 'Montör inom industri', 'Underhållsmekaniker'],
    careerPath: ['Maskinoperatör', 'Maskinställare', 'Produktionsledare'],
    requiresUniversity: false,
  }, // AF: 504 annonser (Maskinställare och maskinoperatörer, metallarbete)
  {
    id: 'montor_industri',
    name: 'Montör inom industri',
    description: 'Sätter samman detaljer till färdiga produkter, ofta vid en monteringslinje',
    riasec: { R: 5, I: 1, A: 1, S: 1, E: 1, C: 4 },
    bigFive: { openness: 30, conscientiousness: 80, extraversion: 35, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 3 },
    categories: { praktisk: 5, noggrannhet: 5, teknisk: 3 },
    challenges: { fysisk_rorlighet: 4, koncentration: 4, stillasittande: 3, sensorisk: 3 },
    salary: '26 000 - 31 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Maskinoperatör inom industri', 'Lagerarbetare', 'Kvalitetstekniker'],
    careerPath: ['Montör', 'Lagledare', 'Produktionstekniker'],
    requiresUniversity: false,
  }, // AF: 432 annonser (Montörer, metall-, gummi- och plastprodukter)
  {
    id: 'underhallsmekaniker',
    name: 'Underhållsmekaniker',
    description: 'Håller maskiner igång — felsöker, byter delar och gör förebyggande underhåll',
    riasec: { R: 5, I: 3, A: 1, S: 1, E: 1, C: 3 },
    bigFive: { openness: 45, conscientiousness: 80, extraversion: 35, agreeableness: 50, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { teknisk: 5, praktisk: 5, analytisk: 3, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 5, tidspress: 4, sensorisk: 3, kvallsarbete: 3 },
    salary: '30 000 - 38 000 kr/mån',
    education: { name: 'Gymnasium industriteknik eller el', length: '3 år', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Mekaniker', 'Maskinoperatör inom industri', 'Industrirobottekniker'],
    careerPath: ['Underhållsmekaniker', 'Underhållstekniker', 'Underhållsledare'],
    requiresUniversity: false,
  }, // AF: 375 annonser
  {
    id: 'truckforare',
    name: 'Truckförare',
    description: 'Kör truck på lager och terminal, lastar och lossar gods',
    riasec: { R: 5, I: 1, A: 1, S: 1, E: 1, C: 3 },
    bigFive: { openness: 30, conscientiousness: 75, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 4, sensorisk: 4, energi: 3 },
    categories: { praktisk: 5, teknisk: 3, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 3, koncentration: 4, sensorisk: 4, kvallsarbete: 3 },
    salary: '27 000 - 33 000 kr/mån',
    education: { name: 'Truckkort A + B', length: 'Några dagar', type: 'Certifikat' },
    prognosis: 'stable',
    relatedJobs: ['Lagerarbetare', 'Terminalarbetare', 'Lastbilschaufför'],
    careerPath: ['Truckförare', 'Lagerledare', 'Logistikansvarig'],
    requiresUniversity: false,
  }, // AF: 751 annonser (Lager- och terminalpersonal, 8:e största)
  {
    id: 'terminalarbetare',
    name: 'Terminalarbetare',
    description: 'Sorterar och lastar paket och gods på en terminal, ofta i skift',
    riasec: { R: 5, I: 1, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 30, conscientiousness: 70, extraversion: 40, agreeableness: 55, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 5, kvallsarbete: 4, tidspress: 4, sensorisk: 3 },
    salary: '25 000 - 30 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Lagerarbetare', 'Truckförare', 'Bud- och distributionsförare'],
    careerPath: ['Terminalarbetare', 'Truckförare', 'Lagerledare'],
    requiresUniversity: false,
  },
  {
    id: 'budbilsforare',
    name: 'Bud- och distributionsförare',
    description: 'Kör ut paket och varor till hem och företag, planerar sin runda',
    riasec: { R: 5, I: 1, A: 1, S: 2, E: 2, C: 3 },
    bigFive: { openness: 35, conscientiousness: 75, extraversion: 45, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 4, sensorisk: 4, energi: 4 },
    categories: { praktisk: 5, social: 2, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 4, tidspress: 5, koncentration: 4, kvallsarbete: 3 },
    salary: '26 000 - 31 000 kr/mån',
    education: { name: 'B-körkort', length: 'Körkortsutbildning', type: 'Certifikat' },
    prognosis: 'growing',
    relatedJobs: ['Lastbilschaufför', 'Terminalarbetare', 'Taxichaufför'],
    careerPath: ['Budbilsförare', 'Lastbilschaufför', 'Transportledare'],
    requiresUniversity: false,
  },
  {
    id: 'maltidsbitrade',
    name: 'Måltidsbiträde',
    description: 'Lagar och serverar mat i skola, förskola eller äldreboende',
    riasec: { R: 4, I: 1, A: 2, S: 4, E: 1, C: 3 },
    bigFive: { openness: 40, conscientiousness: 70, extraversion: 50, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { praktisk: 4, social: 3, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, tidspress: 4, sensorisk: 3 },
    salary: '24 000 - 28 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs — livsmedelshygien är vanligt krav', length: 'Kort kurs', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Köks- och restaurangbiträde', 'Kock', 'Barnskötare'],
    careerPath: ['Måltidsbiträde', 'Kock', 'Kostchef'],
    requiresUniversity: false,
  },
  {
    id: 'parkarbetare',
    name: 'Parkarbetare',
    description: 'Sköter parker och grönytor — klipper, planterar, röjer och håller rent',
    riasec: { R: 5, I: 1, A: 2, S: 1, E: 1, C: 2 },
    bigFive: { openness: 40, conscientiousness: 70, extraversion: 35, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, natur: 5, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 5, sensorisk: 2, kvallsarbete: 2 },
    salary: '25 000 - 30 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs — trädgårdsutbildning är meriterande', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Trädgårdsmästare', 'Fastighetsskötare', 'Skogsarbetare/Skogshuggare'],
    careerPath: ['Parkarbetare', 'Trädgårdsmästare', 'Parkförman'],
    requiresUniversity: false,
  },
  // ===== TILLAGDA 2026-08-21, andra omgången =====
  //
  // Urvalet gjordes genom att mäta portalens täckning PER YRKESOMRÅDE mot
  // Arbetsförmedlingens egen indelning (stats=occupation-field, hämtat
  // 2026-08-21). Tre områden var underrepresenterade i förhållande till hur
  // många annonser de faktiskt har:
  //
  //   · Sanering och renhållning — 1 414 annonser, NOLL yrken i listan
  //   · Bygg och anläggning — 2 161 annonser, i praktiken bara snickare
  //   · Kropps- och skönhetsvård — 308 annonser, två yrken
  //
  // Därtill några vanliga kontors- och vårdadministrativa yrken, eftersom
  // "Administration, ekonomi, juridik" är AF:s näst största område men bara
  // representerades av "Administratör".
  //
  // Volymen i kommentarerna är OMRÅDETS annonsantal, inte yrkets — AF:s
  // per-yrkesstatistik kommer dubblerad och går inte att attribuera säkert.
  // Koderna är redaktionella, som resten av listan.

  // — Sanering och renhållning —
  {
    id: 'saneringsarbetare',
    name: 'Saneringsarbetare',
    description: 'Sanerar efter vattenskador, bränder och skadedjur, och återställer lokaler',
    riasec: { R: 5, I: 2, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 35, conscientiousness: 75, extraversion: 40, agreeableness: 55, stability: 75 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 3, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 4, teknisk: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, sensorisk: 5, kvallsarbete: 3 },
    salary: '27 000 - 33 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs — intern utbildning är vanlig', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Städare/Lokalvårdare', 'Fastighetsskötare', 'Byggnadsarbetare'],
    careerPath: ['Saneringsarbetare', 'Saneringstekniker', 'Arbetsledare sanering'],
    requiresUniversity: false,
  }, // AF-området Sanering och renhållning: 1 414 annonser
  {
    id: 'atervinningsarbetare',
    name: 'Återvinningsarbetare',
    description: 'Sorterar och hanterar avfall och material på en återvinningsanläggning',
    riasec: { R: 5, I: 1, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 30, conscientiousness: 70, extraversion: 35, agreeableness: 55, stability: 65 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { praktisk: 5, natur: 3, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 4, sensorisk: 4, kvallsarbete: 2 },
    salary: '26 000 - 31 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'growing',
    relatedJobs: ['Renhållningsarbetare', 'Terminalarbetare', 'Truckförare'],
    careerPath: ['Återvinningsarbetare', 'Maskinförare', 'Platsansvarig'],
    requiresUniversity: false,
  }, // AF-området Sanering och renhållning: 1 414 annonser
  {
    id: 'renhallningsarbetare',
    name: 'Renhållningsarbetare',
    description: 'Hämtar sopor och håller gator och offentliga platser rena',
    riasec: { R: 5, I: 1, A: 1, S: 2, E: 1, C: 2 },
    bigFive: { openness: 30, conscientiousness: 75, extraversion: 40, agreeableness: 60, stability: 65 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 4, energi: 5 },
    categories: { praktisk: 5, natur: 2 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 5, sensorisk: 4, kvallsarbete: 3 },
    salary: '27 000 - 32 000 kr/mån',
    education: { name: 'B- eller C-körkort beroende på tjänst', length: 'Körkortsutbildning', type: 'Certifikat' },
    prognosis: 'stable',
    relatedJobs: ['Återvinningsarbetare', 'Parkarbetare', 'Lastbilschaufför'],
    careerPath: ['Renhållningsarbetare', 'Chaufför renhållning', 'Arbetsledare'],
    requiresUniversity: false,
  }, // AF-området Sanering och renhållning: 1 414 annonser
  {
    id: 'fonsterputsare',
    name: 'Fönsterputsare',
    description: 'Putsar fönster och fasader åt företag och privatpersoner, ofta på höjd',
    riasec: { R: 5, I: 1, A: 1, S: 3, E: 2, C: 2 },
    bigFive: { openness: 35, conscientiousness: 75, extraversion: 45, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 4, social: 2 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 3, koncentration: 3 },
    salary: '25 000 - 31 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs — liftutbildning kan behövas', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Städare/Lokalvårdare', 'Fastighetsskötare', 'Saneringsarbetare'],
    careerPath: ['Fönsterputsare', 'Arbetsledare', 'Egen firma'],
    requiresUniversity: false,
  }, // AF-området Sanering och renhållning: 1 414 annonser

  // — Bygg och anläggning —
  {
    id: 'murare',
    name: 'Murare',
    description: 'Murar väggar och skorstenar i tegel och block, putsar fasader',
    riasec: { R: 5, I: 2, A: 3, S: 1, E: 1, C: 3 },
    bigFive: { openness: 40, conscientiousness: 80, extraversion: 35, agreeableness: 55, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 5, teknisk: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 5, precision: 4 },
    salary: '30 000 - 38 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet med lärlingstid', length: '3 år + lärling', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Snickare/Byggarbetare', 'Betongarbetare', 'Plattsättare'],
    careerPath: ['Lärling', 'Murare', 'Lagbas', 'Arbetsledare'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser
  {
    id: 'betongarbetare',
    name: 'Betongarbetare',
    description: 'Bygger formar, armerar och gjuter betongkonstruktioner',
    riasec: { R: 5, I: 2, A: 1, S: 1, E: 1, C: 3 },
    bigFive: { openness: 30, conscientiousness: 80, extraversion: 35, agreeableness: 55, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 3, energi: 5 },
    categories: { praktisk: 5, noggrannhet: 4, teknisk: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 5, precision: 3 },
    salary: '30 000 - 37 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet med lärlingstid', length: '3 år + lärling', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Murare', 'Snickare/Byggarbetare', 'Anläggningsarbetare'],
    careerPath: ['Lärling', 'Betongarbetare', 'Lagbas'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser
  {
    id: 'anlaggningsarbetare',
    name: 'Anläggningsarbetare',
    description: 'Bygger vägar, ledningar och markarbeten — gräver, lägger rör och asfalterar',
    riasec: { R: 5, I: 2, A: 1, S: 2, E: 1, C: 2 },
    bigFive: { openness: 30, conscientiousness: 75, extraversion: 40, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 2, kommunikation: 3, koncentration: 3, motorik: 5, sensorisk: 3, energi: 5 },
    categories: { praktisk: 5, teknisk: 3, natur: 2 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 5, sensorisk: 3, kvallsarbete: 2 },
    salary: '29 000 - 36 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet eller upplärning på plats', length: '3 år alternativt upplärning', type: 'Gymnasium' },
    prognosis: 'growing',
    relatedJobs: ['Betongarbetare', 'Maskinförare', 'Snickare/Byggarbetare'],
    careerPath: ['Anläggningsarbetare', 'Maskinförare', 'Lagbas'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser
  {
    id: 'maskinforare',
    name: 'Maskinförare',
    description: 'Kör grävmaskin, hjullastare eller annan anläggningsmaskin på byggen och i grustag',
    riasec: { R: 5, I: 2, A: 1, S: 1, E: 1, C: 3 },
    bigFive: { openness: 35, conscientiousness: 80, extraversion: 30, agreeableness: 50, stability: 75 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 5, motorik: 4, sensorisk: 4, energi: 3 },
    categories: { praktisk: 5, teknisk: 4, noggrannhet: 4 },
    challenges: { koncentration: 5, sensorisk: 4, stillasittande: 3, kvallsarbete: 2 },
    salary: '31 000 - 39 000 kr/mån',
    education: { name: 'Yrkesbevis anläggningsmaskinförare', length: '1–2 år inkl. praktik', type: 'Yrkesutbildning' },
    prognosis: 'growing',
    relatedJobs: ['Anläggningsarbetare', 'Truckförare', 'Lastbilschaufför'],
    careerPath: ['Maskinförare', 'Erfaren maskinförare', 'Arbetsledare'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser
  {
    id: 'golvlaggare',
    name: 'Golvläggare',
    description: 'Lägger parkett, klinker, linoleum och mattor i hem och lokaler',
    riasec: { R: 5, I: 1, A: 3, S: 2, E: 1, C: 4 },
    bigFive: { openness: 40, conscientiousness: 85, extraversion: 35, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 5, kreativ: 2 },
    challenges: { fysisk_rorlighet: 5, precision: 5, sensorisk: 3 },
    salary: '29 000 - 36 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet eller lärling', length: '3 år alternativt lärling', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Plattsättare', 'Snickare/Byggarbetare', 'Målare'],
    careerPath: ['Lärling', 'Golvläggare', 'Egen firma'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser
  {
    id: 'stallningsbyggare',
    name: 'Ställningsbyggare',
    description: 'Monterar och demonterar byggnadsställningar, ofta högt upp',
    riasec: { R: 5, I: 1, A: 1, S: 2, E: 1, C: 3 },
    bigFive: { openness: 30, conscientiousness: 80, extraversion: 40, agreeableness: 60, stability: 80 },
    icf: { kognitiv: 3, kommunikation: 3, koncentration: 4, motorik: 5, sensorisk: 4, energi: 5 },
    categories: { praktisk: 5, noggrannhet: 5, teknisk: 3 },
    challenges: { fysisk_rorlighet: 5, fysisk_styrka: 5, koncentration: 4, precision: 3 },
    salary: '30 000 - 37 000 kr/mån',
    education: { name: 'Ställningsbyggarutbildning enligt Arbetsmiljöverkets krav', length: 'Några veckor till några månader', type: 'Certifikat' },
    prognosis: 'stable',
    relatedJobs: ['Snickare/Byggarbetare', 'Betongarbetare', 'Anläggningsarbetare'],
    careerPath: ['Ställningsbyggare', 'Lagbas', 'Arbetsledare'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser
  {
    id: 'platslagare',
    name: 'Plåtslagare',
    description: 'Tillverkar och monterar plåt på tak och fasader',
    riasec: { R: 5, I: 2, A: 2, S: 1, E: 1, C: 3 },
    bigFive: { openness: 35, conscientiousness: 85, extraversion: 30, agreeableness: 55, stability: 75 },
    icf: { kognitiv: 3, kommunikation: 2, koncentration: 4, motorik: 5, sensorisk: 4, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 5, teknisk: 4 },
    challenges: { fysisk_rorlighet: 5, precision: 5, koncentration: 4 },
    salary: '30 000 - 38 000 kr/mån',
    education: { name: 'Bygg- och anläggningsprogrammet, inriktning plåtslageri', length: '3 år + lärling', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Snickare/Byggarbetare', 'Svetsare', 'Murare'],
    careerPath: ['Lärling', 'Plåtslagare', 'Lagbas'],
    requiresUniversity: false,
  }, // AF-området Bygg och anläggning: 2 161 annonser

  // — Hotell, restaurang, storhushåll —
  {
    id: 'hotellstadare',
    name: 'Hotellstädare',
    description: 'Städar hotellrum och gemensamma ytor, byter sängkläder och fyller på',
    riasec: { R: 4, I: 1, A: 1, S: 3, E: 1, C: 4 },
    bigFive: { openness: 30, conscientiousness: 80, extraversion: 40, agreeableness: 65, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 2, koncentration: 3, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { praktisk: 5, noggrannhet: 5, social: 2 },
    challenges: { fysisk_rorlighet: 5, tidspress: 4, sensorisk: 3 },
    salary: '24 000 - 28 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Städare/Lokalvårdare', 'Receptionist/Hotellreceptionist', 'Måltidsbiträde'],
    careerPath: ['Hotellstädare', 'Husfru', 'Housekeeping-ansvarig'],
    requiresUniversity: false,
  }, // AF-området Hotell, restaurang, storhushåll: 2 661 annonser
  {
    id: 'cafebitrade',
    name: 'Cafébiträde',
    description: 'Serverar kaffe och fika, tar betalt och håller ordning i caféet',
    riasec: { R: 3, I: 1, A: 2, S: 4, E: 3, C: 3 },
    bigFive: { openness: 45, conscientiousness: 70, extraversion: 60, agreeableness: 75, stability: 60 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 3, motorik: 4, sensorisk: 3, energi: 4 },
    categories: { affarer_forsaljning: 3, social: 4, praktisk: 4, noggrannhet: 3 },
    challenges: { fysisk_rorlighet: 4, social_energi: 4, tidspress: 4, sensorisk: 3 },
    salary: '24 000 - 28 000 kr/mån',
    education: { name: 'Ingen formell utbildning krävs', length: 'Upplärning på plats', type: 'Arbetsplatsutbildning' },
    prognosis: 'stable',
    relatedJobs: ['Servitör/Servitris', 'Butikssäljare/Detaljhandel', 'Bartender'],
    careerPath: ['Cafébiträde', 'Barista', 'Caféföreståndare'],
    requiresUniversity: false,
  }, // AF-området Hotell, restaurang, storhushåll: 2 661 annonser

  // — Kropps- och skönhetsvård —
  {
    id: 'hudterapeut',
    name: 'Hudterapeut',
    description: 'Ger ansiktsbehandlingar och hudvårdsråd, arbetar nära kunden',
    riasec: { R: 3, I: 2, A: 3, S: 5, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 80, extraversion: 55, agreeableness: 80, stability: 65 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { social: 4, praktisk: 4, noggrannhet: 5, vard: 3 },
    challenges: { social_energi: 4, precision: 4, stillasittande: 3 },
    salary: '25 000 - 32 000 kr/mån',
    education: { name: 'Hudterapeututbildning', length: '1–2 år', type: 'Yrkeshögskola' },
    prognosis: 'stable',
    relatedJobs: ['Frisör', 'Massageterapeut', 'Fotterapeut'],
    careerPath: ['Hudterapeut', 'Egen salong', 'Utbildare'],
    requiresUniversity: false,
  }, // AF-området Kropps- och skönhetsvård: 308 annonser
  {
    id: 'fotterapeut',
    name: 'Fotterapeut',
    description: 'Behandlar fötter och naglar, ofta för äldre och personer med diabetes',
    riasec: { R: 4, I: 3, A: 1, S: 5, E: 2, C: 4 },
    bigFive: { openness: 45, conscientiousness: 85, extraversion: 45, agreeableness: 80, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 4, motorik: 5, sensorisk: 3, energi: 3 },
    categories: { vard: 4, social: 4, noggrannhet: 5, praktisk: 4 },
    challenges: { precision: 5, social_energi: 3, stillasittande: 4 },
    salary: '26 000 - 32 000 kr/mån',
    education: { name: 'Medicinsk fotterapeututbildning', length: '1 år', type: 'Yrkesutbildning' },
    prognosis: 'growing',
    relatedJobs: ['Hudterapeut', 'Undersköterska', 'Massageterapeut'],
    careerPath: ['Fotterapeut', 'Medicinsk fotterapeut', 'Egen mottagning'],
    requiresUniversity: false,
  }, // AF-området Kropps- och skönhetsvård: 308 annonser
  {
    id: 'barberare',
    name: 'Barberare',
    description: 'Klipper och rakar, formar skägg och ger råd om hårvård',
    riasec: { R: 4, I: 1, A: 4, S: 4, E: 3, C: 3 },
    bigFive: { openness: 55, conscientiousness: 75, extraversion: 60, agreeableness: 70, stability: 65 },
    icf: { kognitiv: 2, kommunikation: 4, koncentration: 4, motorik: 5, sensorisk: 3, energi: 4 },
    categories: { konst_kultur: 3, social: 4, praktisk: 5, noggrannhet: 4 },
    challenges: { fysisk_rorlighet: 4, social_energi: 4, precision: 5 },
    salary: '24 000 - 32 000 kr/mån',
    education: { name: 'Barberar- eller frisörutbildning', length: '1–3 år', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Frisör', 'Hudterapeut', 'Stylist'],
    careerPath: ['Lärling', 'Barberare', 'Egen salong'],
    requiresUniversity: false,
  }, // AF-området Kropps- och skönhetsvård: 308 annonser

  // — Administration och vårdadministration —
  {
    id: 'ekonomiassistent',
    name: 'Ekonomiassistent',
    description: 'Hanterar fakturor, bokför löpande och stämmer av konton',
    riasec: { R: 1, I: 3, A: 1, S: 2, E: 2, C: 5 },
    bigFive: { openness: 40, conscientiousness: 90, extraversion: 35, agreeableness: 60, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 3, koncentration: 5, motorik: 1, sensorisk: 2, energi: 3 },
    categories: { administration_kontor: 5, ekonomi: 5, noggrannhet: 5, analytisk: 3 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 3 },
    salary: '28 000 - 34 000 kr/mån',
    education: { name: 'Ekonomiprogrammet eller yrkeshögskola', length: '1–3 år', type: 'Gymnasium' },
    prognosis: 'stable',
    relatedJobs: ['Redovisningskonsult', 'Löneadministratör', 'Administratör'],
    careerPath: ['Ekonomiassistent', 'Redovisningsekonom', 'Redovisningsansvarig'],
    requiresUniversity: false,
  }, // AF-området Administration, ekonomi, juridik: näst största området
  {
    id: 'loneadministrator',
    name: 'Löneadministratör',
    description: 'Räknar ut och betalar löner, håller reda på avtal, semester och avdrag',
    riasec: { R: 1, I: 3, A: 1, S: 3, E: 2, C: 5 },
    bigFive: { openness: 40, conscientiousness: 90, extraversion: 40, agreeableness: 65, stability: 75 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 5, motorik: 1, sensorisk: 2, energi: 3 },
    categories: { administration_kontor: 5, ekonomi: 4, noggrannhet: 5, kommunikation: 3 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 4 },
    salary: '31 000 - 38 000 kr/mån',
    education: { name: 'Yrkeshögskola löneadministration', length: '1–2 år', type: 'Yrkeshögskola' },
    prognosis: 'stable',
    relatedJobs: ['Ekonomiassistent', 'HR-specialist', 'Administratör'],
    careerPath: ['Löneadministratör', 'Lönespecialist', 'Löneansvarig'],
    requiresUniversity: false,
  }, // AF-området Administration, ekonomi, juridik: näst största området
  {
    id: 'medicinsk_sekreterare',
    name: 'Medicinsk sekreterare',
    description: 'Skriver journaler, bokar patienter och håller ordning på vårdens dokumentation',
    riasec: { R: 1, I: 3, A: 1, S: 4, E: 2, C: 5 },
    bigFive: { openness: 45, conscientiousness: 90, extraversion: 45, agreeableness: 75, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 5, motorik: 2, sensorisk: 2, energi: 3 },
    categories: { administration_kontor: 5, vard: 3, noggrannhet: 5, kommunikation: 4 },
    challenges: { stillasittande: 5, koncentration: 5, tidspress: 3 },
    salary: '29 000 - 35 000 kr/mån',
    education: { name: 'Yrkeshögskola vårdadministration', length: '1,5–2 år', type: 'Yrkeshögskola' },
    prognosis: 'growing',
    relatedJobs: ['Administratör', 'Undersköterska', 'Ekonomiassistent'],
    careerPath: ['Medicinsk sekreterare', 'Vårdadministratör', 'Enhetsadministratör'],
    requiresUniversity: false,
  }, // AF-området Hälso- och sjukvård: 6 152 annonser (största området)
  {
    id: 'tandskoterska',
    name: 'Tandsköterska',
    description: 'Assisterar tandläkaren, förbereder instrument och tar hand om patienten',
    riasec: { R: 3, I: 3, A: 1, S: 5, E: 2, C: 4 },
    bigFive: { openness: 45, conscientiousness: 85, extraversion: 50, agreeableness: 80, stability: 70 },
    icf: { kognitiv: 3, kommunikation: 4, koncentration: 5, motorik: 4, sensorisk: 3, energi: 3 },
    categories: { vard: 5, social: 4, noggrannhet: 5, praktisk: 3 },
    challenges: { precision: 4, social_energi: 3, stillasittande: 3, koncentration: 4 },
    salary: '27 000 - 33 000 kr/mån',
    education: { name: 'Tandsköterskeutbildning', length: '1,5 år', type: 'Yrkeshögskola' },
    prognosis: 'growing',
    relatedJobs: ['Tandhygienist', 'Undersköterska', 'Medicinsk sekreterare'],
    careerPath: ['Tandsköterska', 'Tandhygienist', 'Klinikkoordinator'],
    requiresUniversity: false,
  }, // AF-området Hälso- och sjukvård: 6 152 annonser (största området)
  {
    id: 'apotekstekniker',
    name: 'Apotekstekniker',
    description: 'Expedierar läkemedel på apotek och ger råd om egenvård',
    riasec: { R: 2, I: 3, A: 1, S: 4, E: 2, C: 5 },
    bigFive: { openness: 45, conscientiousness: 90, extraversion: 50, agreeableness: 75, stability: 70 },
    icf: { kognitiv: 4, kommunikation: 4, koncentration: 5, motorik: 3, sensorisk: 3, energi: 3 },
    categories: { vard: 4, affarer_forsaljning: 3, noggrannhet: 5, social: 3 },
    challenges: { koncentration: 5, social_energi: 3, precision: 4 },
    salary: '27 000 - 33 000 kr/mån',
    education: { name: 'Apoteksteknikerutbildning', length: '1,5 år', type: 'Yrkeshögskola' },
    prognosis: 'stable',
    relatedJobs: ['Butikssäljare/Detaljhandel', 'Undersköterska', 'Medicinsk sekreterare'],
    careerPath: ['Apotekstekniker', 'Egenvårdsrådgivare', 'Apotekschef'],
    requiresUniversity: false,
  }, // AF-området Hälso- och sjukvård: 6 152 annonser (största området)
]

/**
 * Yrkeslistan, avdubblerad på både id och namn.
 *
 * Rådatan innehåller två sorters dubbletter, båda funna 2026-08-21:
 *
 * 1. **Samma id två gånger** — biolog, agronom, skogsarbetare, vaktare,
 *    skadespelare, key_account_manager, inkopare. Fyra av dem har OLIKA
 *    RIASEC-koder i de två posterna (biolog R:2 mot R:3, agronom I:4 mot I:5,
 *    skogsarbetare I:1 mot I:2, key_account_manager A:1/S:4 mot A:2/S:5), så
 *    samma yrke fick två olika matchningspoäng. Listorna renderas per id,
 *    vilket dessutom gav React-varningen om dubbla nycklar.
 * 2. **Samma namn, olika id** — `cnc_operatör`/`cnc_operator`,
 *    `miljöinspektör`/`miljoinspektor`, `fastighetsmäklare`/`fastighetsmaklare`,
 *    `flygvardinna`/`kabinpersonal`, `cybersakerhet`/`cybersecurity`. De tre
 *    första är samma ord med och utan svenska tecken — posten är helt enkelt
 *    inlagd två gånger. En id-dedup missar dem, och användaren ser två
 *    identiska rader.
 *
 * Första posten vinner. Att städa rådatan är rätt på sikt; avdubbleringen här
 * gör felet ofarligt nu och kan inte glömmas bort.
 */
const yrkesnyckel = (yrke: Occupation) =>
  yrke.name.toLowerCase().replace(/\s+/g, ' ').trim()

export const occupations: Occupation[] = occupationsRadata.filter(
  (yrke, i, lista) =>
    lista.findIndex(y => y.id === yrke.id) === i &&
    lista.findIndex(y => yrkesnyckel(y) === yrkesnyckel(yrke)) === i
)

// ===== ICF ANPASSNINGSREKOMMENDATIONER =====

export const icfAdaptations: Record<string, ICFAdaptation> = {
  kognitiv: {
    name: 'Kognitiv funktion',
    description: 'Minne, planering, organisering och problemlösning',
    adaptations: [
      'Använd checklistor och påminnelser för dagliga uppgifter',
      'Bryt ner komplexa uppgifter i mindre, hanterbara steg',
      'Använd digitala verktyg som kalendrar och anteckningsappar',
      'Be om skriftliga instruktioner istället för muntliga',
      'Skapa tydliga rutiner och fasta strukturer',
      'Använd minnesstöd som att sätta lappar på synliga platser',
    ],
  },
  kommunikation: {
    name: 'Kommunikation',
    description: 'Social interaktion, samarbete och uttryck',
    adaptations: [
      'Be om tydliga instruktioner skriftligt',
      'Använd kommunikationshjälpmedel vid behov',
      'Be om regelbundna avstämningar med chefen',
      'Arbeta i mindre team eller med en mentor',
      'Använd tydliga kommunikationsprotokoll',
      'Be om extra tid för att formulera dig',
    ],
  },
  koncentration: {
    name: 'Koncentration och uppmärksamhet',
    description: 'Fokus, uppmärksamhet och impulskontroll',
    adaptations: [
      'Arbeta i en lugn miljö med färre störningar',
      'Använd hörlurar med brusreducering',
      'Ta regelbundna korta pauser',
      'Använd tekniker som Pomodoro',
      'Be om flexibel arbetsplacering',
      'Använd fokus-appar eller webblockerare',
    ],
  },
  motorik: {
    name: 'Motorik och rörelse',
    description: 'Grovmotorik, finmotorik och rörlighet',
    adaptations: [
      'Anpassa arbetsplatsen ergonomiskt',
      'Använd hjälpmedel vid behov',
      'Välj arbete med mindre fysiska krav',
      'Be om hjälp med tunga lyft',
      'Använd ergonomiska verktyg',
      'Planera arbetsuppgifter för att undvika överansträngning',
    ],
  },
  sensorisk: {
    name: 'Sensorisk bearbetning',
    description: 'Hantering av sinnesintryck som ljud, ljus, doft',
    adaptations: [
      'Använd hörselskydd eller brusreducerande hörlurar',
      'Justera belysningen på arbetsplatsen',
      'Arbeta i en miljö med kontrollerade sinnesintryck',
      'Ta raster för att återhämta sig från sensorisk belastning',
      'Använd doftfria produkter',
      'Be om en arbetsplats med möjlighet till avskildhet',
    ],
  },
  energi: {
    name: 'Energinivå och uthållighet',
    description: 'Ork, återhämtning och stresshantering',
    adaptations: [
      'Arbeta deltid eller med flexibla arbetstider',
      'Ha möjlighet till korta vilopauser',
      'Anpassa arbetsuppgifter efter energinivå',
      'Arbeta hemifrån delar av veckan',
      'Planera återhämtningstid mellan arbetsdagar',
      'Be om förståelse för varierande energinivåer',
    ],
  },
}

// ===== MATCHNINGSALGORITM =====

export function calculateJobMatches(
  profile: UserProfile,
  filterUniversity?: boolean | null,
  /**
   * Yrkeslistan att matcha mot. Anges för att kunna skicka in den ENGELSKA
   * listan — matchningen bär med sig hela yrkesobjektet ut i gränssnittet
   * (`m.occupation.name`), så utan den här parametern visar resultatsidan
   * svenska yrkesnamn även på engelska. Utelämnad = svenska originalet.
   */
  yrken: Occupation[] = occupations
): JobMatch[] {
  const matches: JobMatch[] = yrken.map(occupation => {
    // Filtrera på universitetskrav om angivet
    if (filterUniversity !== null && filterUniversity !== undefined) {
      if (occupation.requiresUniversity !== filterUniversity) {
        return null as unknown as JobMatch
      }
    }

    let totalScore = 0
    let totalWeight = 0
    const adaptations: string[] = []
    const warnings: string[] = []

    /*
      VIKTFÖRDELNING — omlagd 2026-08-21.

      Två fel mättes upp i granskningen, båda med formeln körd mot alla 142
      yrken:

      1. **Skalan var uppblåst.** Den som svarade 3 (mitten) på samtliga 34
         frågor fick 68–80 % mot VARJE yrke, och alla 142 passerade
         "lämplig"-tröskeln 65. Orsaken var golv i delpoängen: intressen kunde
         aldrig ge under 0,5, ICF aldrig under 0,2, toppbonusen aldrig under
         0,3. Siffran mätte alltså mest att formeln hade ett golv.

      2. **ICF drog ner matchningen**, och det slog hårdast mot dem verktyget
         finns för. Den som svarade 1 på allt — rimligt vid depression, smärta
         eller låg tilltro — fick topplistan lastbilschaufför, skogsarbetare,
         trädgårdsmästare, lagerarbetare, städare. Låga ICF-svar straffade allt
         kognitivt hårdast, så kvar blev fysiskt arbete, vilket personen just
         angett att hen inte orkar.

      ICF ingår därför inte längre i POÄNGEN. Den producerar fortfarande
      anpassningsförslag och varningar — det är där den gör nytta. Ett yrke ska
      inte matcha sämre för att någon behöver en anpassning för att göra det.
    */

    // 1. RIASEC (40 %) — arbetsstil och intresse
    const riasecScore = calculateRiasecMatch(profile.riasec, occupation.riasec)
    totalScore += riasecScore * 0.40
    totalWeight += 0.40

    // 2. Intresseområden (35 %) — konkreta preferenser
    const interestScore = calculateInterestMatch(profile.strongInterest, occupation.categories)
    totalScore += interestScore * 0.35
    totalWeight += 0.35

    // 3. ICF — vikt 0. Bidrar med anpassningar och varningar, inte med poäng.
    const icfResult = calculateICFMatch(profile.icf, occupation.icf, occupation.challenges)
    adaptations.push(...icfResult.adaptations)
    warnings.push(...icfResult.warnings)

    // 4. Big Five (15 %) — personlighet
    const bigFiveScore = calculateBigFiveMatch(profile.bigFive, occupation.bigFive)
    totalScore += bigFiveScore * 0.15
    totalWeight += 0.15

    // 5. Bonus för höga toppvärden i RIASEC (10%)
    // Om användaren har höga värden (4-5) i samma kategorier som jobbet kräver
    const topRiasecMatch = calculateTopRiasecBonus(profile.riasec, occupation.riasec)
    totalScore += topRiasecMatch * 0.10
    totalWeight += 0.10

    const matchPercentage = Math.round((totalScore / totalWeight) * 100)
    
    // Bestäm lämplighet baserat på matchningsprocent och varningar
    const isSuitable = matchPercentage >= 65 && warnings.length <= 1
    const needsAdaptation = adaptations.length > 0 || (matchPercentage >= 55 && matchPercentage < 75)

    return {
      occupation,
      matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
      isSuitable,
      needsAdaptation,
      adaptations: adaptations.slice(0, 5),
      warnings: warnings.slice(0, 3),
      forklaring: byggForklaring(profile, occupation, {
        riasec: riasecScore,
        intressen: interestScore,
        bigFive: bigFiveScore,
        toppRiasec: topRiasecMatch,
      }),
    }
  }).filter((match): match is JobMatch => match !== null)

  // Sortera efter matchningsprocent
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage)
}

/** Svenska namn på intresseområdena, för förklaringstexten. */
const intresseNamn: Record<keyof StrongInterestCategories, string> = {
  teknik_mekanik: 'teknik och mekanik',
  natur_vetenskap: 'natur och vetenskap',
  konst_kultur: 'konst och kultur',
  social_vard: 'vård och omsorg',
  affarer_forsaljning: 'affärer och försäljning',
  administration_kontor: 'administration och kontorsarbete',
  utomhusarbete: 'utomhusarbete',
  ledarskap_organisation: 'ledarskap och organisation',
  data_it: 'data och IT',
  undervisning_pedagogik: 'undervisning och pedagogik',
}

/**
 * Bygger förklaringen ur SAMMA tal som rangordningen vilar på.
 *
 * Regeln: förklaringen får bara nämna sådant som faktiskt påverkade
 * ordningen. Den ska aldrig hitta på ett skäl som låter bra — då blir den
 * ett påstående om användaren i stället för en redovisning.
 */
function byggForklaring(
  profil: UserProfile,
  yrke: Occupation,
  delpoang: { riasec: number; intressen: number; bigFive: number; toppRiasec: number }
): MatchForklaring {
  const delar = [
    { namn: 'Vilken sorts arbete du dras till (RIASEC)', andel: 40, poang: Math.round(delpoang.riasec * 100) },
    { namn: 'Dina intresseområden', andel: 35, poang: Math.round(delpoang.intressen * 100) },
    { namn: 'Hur du beskrev dig själv', andel: 15, poang: Math.round(delpoang.bigFive * 100) },
    { namn: 'Dina starkaste sidor mot yrkets krav', andel: 10, poang: Math.round(delpoang.toppRiasec * 100) },
  ]

  // Vilka av yrkets kravområden matchar användarens svar, och vilka inte?
  const kravMappning: Record<string, keyof StrongInterestCategories> = {
    vard: 'social_vard', teknisk: 'teknik_mekanik', it: 'data_it', kreativ: 'konst_kultur',
    ekonomi: 'affarer_forsaljning', pedagogik: 'undervisning_pedagogik', natur: 'natur_vetenskap',
    praktisk: 'teknik_mekanik', analytisk: 'natur_vetenskap', social: 'social_vard',
    noggrannhet: 'administration_kontor', kommunikation: 'ledarskap_organisation',
    forskning: 'natur_vetenskap', ledarskap_organisation: 'ledarskap_organisation',
    administration_kontor: 'administration_kontor', konst_kultur: 'konst_kultur',
    affarer_forsaljning: 'affarer_forsaljning', stresshantering: 'social_vard',
    utomhusarbete: 'natur_vetenskap',
  }

  const upp: { text: string; vikt: number }[] = []
  const ner: { text: string; vikt: number }[] = []
  const sedda = new Set<string>()

  Object.entries(yrke.categories).forEach(([krav, vikt]) => {
    const kategori = kravMappning[krav]
    if (!kategori || !vikt || sedda.has(kategori)) return
    sedda.add(kategori)
    const svar = profil.strongInterest[kategori]
    if (svar >= 60) upp.push({ text: intresseNamn[kategori], vikt: vikt * svar })
    else if (svar <= 40) ner.push({ text: intresseNamn[kategori], vikt: vikt * (100 - svar) })
  })

  // RIASEC: de dimensioner där yrket kräver mycket och användaren svarade högt.
  const riasecNycklar: (keyof RiasecScores)[] = ['R', 'I', 'A', 'S', 'E', 'C']
  riasecNycklar.forEach(k => {
    if (yrke.riasec[k] >= 4 && profil.riasec[k] >= 4) {
      upp.push({ text: riasecNamn[k], vikt: 400 })
    } else if (yrke.riasec[k] >= 4 && profil.riasec[k] <= 2) {
      ner.push({ text: riasecNamn[k], vikt: 400 })
    }
  })

  const sortera = (lista: { text: string; vikt: number }[]) =>
    [...new Map(lista.sort((a, b) => b.vikt - a.vikt).map(x => [x.text, x])).values()]
      .map(x => x.text)
      .slice(0, 3)

  const drogUpp = sortera(upp)
  const drogNer = sortera(ner)

  let sammanfattning: string
  if (drogUpp.length && drogNer.length) {
    sammanfattning = `Yrket hamnade här främst för att du svarade positivt om ${listaText(drogUpp)}. Det som talar emot är att du svarade lågt om ${listaText(drogNer)}.`
  } else if (drogUpp.length) {
    sammanfattning = `Yrket hamnade här främst för att du svarade positivt om ${listaText(drogUpp)}.`
  } else if (drogNer.length) {
    sammanfattning = `Yrket ligger längre ned i listan för att du svarade lågt om ${listaText(drogNer)}.`
  } else {
    /*
      Ingen dimension korsade tröskeln åt något håll. Då får texten inte säga
      att yrket "varken sticker ut eller sorteras bort" — det stod här först,
      och skrevs ut även på yrket som låg SIST i listan. Delpoängen vet
      däremot var yrket ligger, så vi använder dem.
    */
    const kandeIgen = (delpoang.riasec + delpoang.intressen) / 2
    sammanfattning = kandeIgen >= 0.6
      ? 'Dina svar låg nära mitten på de områden yrket kräver. Det gör att yrket varken sticker ut eller sorteras bort — titta på det om det lockar dig.'
      : 'Inget i dina svar pekar särskilt mot det här yrket. Det betyder inte att du inte skulle kunna trivas — bara att just de här frågorna inte fångade det.'
  }

  return { delar, drogUpp, drogNer, sammanfattning }
}

/** "a, b och c" — svensk uppräkning. */
function listaText(delar: string[]): string {
  if (delar.length <= 1) return delar[0] ?? ''
  return `${delar.slice(0, -1).join(', ')} och ${delar[delar.length - 1]}`
}

/** Beskrivande namn på RIASEC-typerna, i förklaringstextens form. */
const riasecNamn: Record<keyof RiasecScores, string> = {
  R: 'praktiskt arbete med händerna',
  I: 'att undersöka och lösa problem',
  A: 'att skapa och uttrycka dig',
  S: 'att möta och stötta andra',
  E: 'att påverka och driva',
  C: 'ordning och tydliga rutiner',
}

function calculateRiasecMatch(user: RiasecScores, job: RiasecScores): number {
  const keys: (keyof RiasecScores)[] = ['R', 'I', 'A', 'S', 'E', 'C']
  let diffSum = 0
  keys.forEach(key => {
    const diff = Math.abs(user[key] - job[key])
    diffSum += diff
  })
  const maxDiff = keys.length * 4 // Max skillnad per dimension är 4 (1-5 skala)
  return 1 - (diffSum / maxDiff)
}

function calculateBigFiveMatch(user: BigFiveScores, job: BigFiveScores): number {
  const keys: (keyof BigFiveScores)[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'stability']
  let diffSum = 0
  keys.forEach(key => {
    const diff = Math.abs(user[key] - job[key])
    diffSum += diff
  })
  const maxDiff = keys.length * 100
  return 1 - (diffSum / maxDiff)
}

/**
 * ICF: producerar ANPASSNINGAR och VARNINGAR, ingen poäng.
 *
 * Funktionen returnerade tidigare även en  som vägde 20 % av
 * matchningen. Den togs bort 2026-08-21: att någon behöver en anpassning för
 * att göra ett jobb ska inte göra jobbet till en sämre match. Effekten var
 * mätbar och gick åt fel håll — den som skattade sig lågt sorterades in i
 * fysiskt arbete, alltså precis det hen angett att hen inte orkar.
 *
 * Poängsummeringen och dess golv () är borta
 * i sin helhet, så den inte kan kopplas tillbaka av misstag.
 */
function calculateICFMatch(
  user: ICFScores,
  job: ICFScores,
  challenges: JobChallenges
): { adaptations: string[]; warnings: string[] } {
  const keys: (keyof ICFScores)[] = ['kognitiv', 'kommunikation', 'koncentration', 'motorik', 'sensorisk', 'energi']
  const adaptations: string[] = []
  const warnings: string[] = []

  keys.forEach(key => {
    const userScore = user[key]
    const jobScore = job[key]

    if (userScore < jobScore) {
      const gap = jobScore - userScore

      // Anpassningsförslag vid gap — det ICF-delen faktiskt är till för.
      if (gap >= 1 && icfAdaptations[key]) {
        const adaptationText = `${icfAdaptations[key].name}: ${icfAdaptations[key].adaptations[0]}`
        if (!adaptations.includes(adaptationText)) {
          adaptations.push(adaptationText)
        }
      }
    }
  })

  // Kontrollera specifika utmaningar och matcha mot användarens profil
  
  // Fysisk rörlighet krävs
  if (challenges.fysisk_rorlighet && challenges.fysisk_rorlighet > 3) {
    if (user.motorik < 2.5) {
      warnings.push('Arbetet kräver god fysisk rörlighet')
      adaptations.push('Motorik: Be om anpassade arbetsuppgifter eller hjälpmedel för rörlighet')
    } else if (user.motorik < 3.5) {
      adaptations.push('Motorik: Ergonomisk utrustning kan underlätta arbetsuppgifter')
    }
  }

  // Fysisk styrka krävs
  if (challenges.fysisk_styrka && challenges.fysisk_styrka > 3) {
    if (user.energi < 2.5 || user.motorik < 2.5) {
      warnings.push('Arbetet innebär tunga lyft eller fysiskt krävande uppgifter')
      adaptations.push('Energi/Motorik: Be om hjälp med tunga lyft eller ergonomiska hjälpmedel')
    }
  }

  // Stillasittande arbete
  if (challenges.stillasittande && challenges.stillasittande > 3) {
    if (user.energi < 2.5) {
      warnings.push('Långa perioder av stillasittande kan vara påfrestande')
      adaptations.push('Energi: Be om möjlighet till rörelsepauser och höj-/sänkbart bord')
    } else if (user.motorik < 3) {
      adaptations.push('Motorik: Varierande arbetsställningar rekommenderas')
    }
  }

  // Social energi krävs
  if (challenges.social_energi && challenges.social_energi > 3) {
    if (user.energi < 2.5) {
      warnings.push('Arbetet är socialt krävande med mycket mänsklig kontakt')
      adaptations.push('Energi: Be om schemalagda återhämtningspauser och tydliga rutiner')
    }
  }

  // Koncentration krävs
  if (challenges.koncentration && challenges.koncentration > 3) {
    if (user.koncentration < 2.5) {
      warnings.push('Arbetet kräver hög koncentrationsförmåga under långa perioder')
      adaptations.push('Koncentration: Be om lugn arbetsmiljö och möjlighet att minska störningar')
    }
  }

  // Sensoriska utmaningar
  if (challenges.sensorisk && challenges.sensorisk > 3) {
    if (user.sensorisk < 2.5) {
      warnings.push('Arbetsmiljön kan innebära starka ljud, ljus eller andra sinnesintryck')
      adaptations.push('Sensorisk: Be om hörselskydd, justerad belysning eller annan anpassning')
    }
  }

  // Tidspress
  if (challenges.tidspress && challenges.tidspress > 3) {
    if (user.koncentration < 2.5 || user.energi < 2.5) {
      warnings.push('Arbetet innebär ofta tidspress och högt tempo')
      adaptations.push('Koncentration/Energi: Be om tydliga prioriteringslistor och möjlighet att påverka arbetstempo')
    }
  }

  return { adaptations, warnings }
}

// Fysiska matchningen är nu integrerad i ICF-matchningen via motorik och energi

function calculateInterestMatch(
  user: StrongInterestCategories,
  categories: JobRequirements
): number {
  let matchSum = 0
  let totalWeight = 0

  const mappings: Record<string, keyof StrongInterestCategories> = {
    vard: 'social_vard',
    teknisk: 'teknik_mekanik',
    it: 'data_it',
    kreativ: 'konst_kultur',
    ekonomi: 'affarer_forsaljning',
    pedagogik: 'undervisning_pedagogik',
    natur: 'natur_vetenskap',
    praktisk: 'teknik_mekanik',
    analytisk: 'natur_vetenskap',
    social: 'social_vard',
    noggrannhet: 'administration_kontor',
    kommunikation: 'ledarskap_organisation',
    forskning: 'natur_vetenskap',
    ledarskap_organisation: 'ledarskap_organisation',
    administration_kontor: 'administration_kontor',
    konst_kultur: 'konst_kultur',
    affarer_forsaljning: 'affarer_forsaljning',
    stresshantering: 'social_vard',
    utomhusarbete: 'natur_vetenskap',
  }

  // Hitta användarens toppintressen för att ge bonus
  const userInterests = Object.entries(user).sort((a, b) => b[1] - a[1])
  const topInterests = userInterests.slice(0, 3).map(([key]) => key)

  Object.entries(categories).forEach(([cat, weight]) => {
    const userCat = mappings[cat]
    if (userCat && weight && weight > 0) {
      const userScore = user[userCat] // 0-100 skala
      const userInterest = userScore / 100 // Konvertera 0-100 till 0-1

      // Förändrad matchningslogik:
      // Om jobbet kräver mycket (vikt 4-5) och användaren har högt intresse (70%+) = perfekt
      // Om jobbet kräver lite (vikt 1-2) påverkar inte lika mycket

      let matchScore = 0
      if (weight >= 4) {
        /*
          Golven borttagna 2026-08-21. Trappan slutade tidigare på 0,2 för
          viktiga krav, 0,4 för medelviktiga, och mindre viktiga krav kunde
          aldrig ge under 0,5 (`0.5 + userInterest * 0.5`). Följden var att ett
          lågt intresse ändå gav halva poängen, och att matchningsprocenten
          landade 68–80 % för i stort sett alla yrken oavsett svar. En trappa
          som inte når noll mäter inte skillnaden mellan att vilja och att inte
          vilja.
        */
        // Viktigt krav — användaren bör ha högt intresse
        if (userScore >= 70) matchScore = 1.0
        else if (userScore >= 50) matchScore = 0.7
        else if (userScore >= 30) matchScore = 0.35
        else matchScore = 0
      } else if (weight >= 3) {
        // Medelviktigt krav
        if (userScore >= 60) matchScore = 1.0
        else if (userScore >= 40) matchScore = 0.65
        else if (userScore >= 20) matchScore = 0.3
        else matchScore = 0
      } else {
        // Mindre viktigt krav — följer intresset rakt av, utan golv
        matchScore = userInterest
      }

      // Bonus om detta är ett av användarens toppintressen
      if (topInterests.includes(userCat) && weight >= 4) {
        matchScore = Math.min(1.0, matchScore + 0.15)
      }

      matchSum += matchScore * weight
      totalWeight += weight
    }
  })

  // Inga kravviktade kategorier alls för yrket = vi vet ingenting. Returnerade
  // tidigare 0,5, alltså halva poängen för frånvaro av information.
  return totalWeight > 0 ? matchSum / totalWeight : 0
}

// Bonus för höga RIASEC-matchningar (när användaren har höga värden där jobbet kräver höga värden)
function calculateTopRiasecBonus(user: RiasecScores, job: RiasecScores): number {
  const keys: (keyof RiasecScores)[] = ['R', 'I', 'A', 'S', 'E', 'C']
  let bonusSum = 0
  let count = 0
  
  keys.forEach(key => {
    const userScore = user[key] // 1-5 skala
    const jobScore = job[key]   // 1-5 skala
    
    // Ge bonus om både användaren och jobbet har höga värden (>=4)
    // eller om användaren överträffar jobbets krav
    if (jobScore >= 4) {
      if (userScore >= jobScore) {
        bonusSum += 1 // Perfekt match
      } else if (userScore >= 3) {
        bonusSum += 0.6 // God match
      } else {
        bonusSum += 0 // Svag match — gav tidigare 0,3 i golv
      }
      count++
    } else if (userScore >= 4 && jobScore >= 3) {
      // Användaren har högt värde och jobbet kan dra nytta av det
      bonusSum += 0.5
      count++
    }
  })

  // Ingen dimension kvalade in = ingen bonus. Returnerade tidigare 0,5, alltså
  // en halv bonuspoäng för att inget matchade.
  return count > 0 ? bonusSum / count : 0
}

// ===== HJÄLPFUNKTIONER =====

export function getSectionByQuestionId(questionId: string): Section | undefined {
  const question = allQuestions.find(q => q.id === questionId)
  if (!question) return undefined
  return sections.find(s => s.id === question.section)
}

export function getQuestionsBySection(sectionId: SectionId): Question[] {
  return allQuestions.filter(q => q.section === sectionId)
}

export function calculateUserProfile(answers: Record<string, number>): UserProfile {
  // Beräkna RIASEC
  const riasec: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  const riasecCounts: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  // Beräkna Big Five
  const bigFive: BigFiveScores = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, stability: 50 }
  const bigFiveCounts: Record<string, { sum: number; count: number }> = {
    openness: { sum: 0, count: 0 },
    conscientiousness: { sum: 0, count: 0 },
    extraversion: { sum: 0, count: 0 },
    agreeableness: { sum: 0, count: 0 },
    stability: { sum: 0, count: 0 },
  }

  // Beräkna Strong Interest
  const strongInterest: StrongInterestCategories = {
    teknik_mekanik: 50,
    natur_vetenskap: 50,
    konst_kultur: 50,
    social_vard: 50,
    affarer_forsaljning: 50,
    administration_kontor: 50,
    utomhusarbete: 50,
    ledarskap_organisation: 50,
    data_it: 50,
    undervisning_pedagogik: 50,
  }
  const strongCounts: Record<string, { sum: number; count: number }> = {
    teknik_mekanik: { sum: 0, count: 0 },
    natur_vetenskap: { sum: 0, count: 0 },
    konst_kultur: { sum: 0, count: 0 },
    social_vard: { sum: 0, count: 0 },
    affarer_forsaljning: { sum: 0, count: 0 },
    administration_kontor: { sum: 0, count: 0 },
    utomhusarbete: { sum: 0, count: 0 },
    ledarskap_organisation: { sum: 0, count: 0 },
    data_it: { sum: 0, count: 0 },
    undervisning_pedagogik: { sum: 0, count: 0 },
  }

  // ICF (funktionsförutsättningar - inkluderar kognitivt, kommunikativt och fysiskt)
  const icf: ICFScores = { kognitiv: 3, kommunikation: 3, koncentration: 3, motorik: 3, sensorisk: 3, energi: 3 }
  /**
   * ALLA sex ICF-domäner samlas i arrayer, inte bara motorik.
   *
   * Före 2026-08-21 stod här `icf[category] = normalizedValue * 5` — en
   * TILLDELNING. Motorik specialbehandlades och medelvärdesberäknades, men
   * `energi` har också två frågor: `icf_en_fys` ("Jag har ork att vara fysiskt
   * aktiv under arbetsdagen") och `icf_en_men` ("energi att tänka"). Den sist
   * itererade vann, så svaret på ORKFRÅGAN påverkade ingenting. Och det är
   * just `icf.energi` som styr varningarna för fysiskt krävande yrken
   * (`calculateICFMatch`). För en målgrupp med fysiska funktionsnedsättningar
   * var det den fråga som borde väga tyngst.
   *
   * (`if (!icfMotorikValues.length) { push } else { push }` — de två grenarna
   * var dessutom identiska.)
   */
  const icfValues: Record<keyof ICFScores, number[]> = {
    kognitiv: [], kommunikation: [], koncentration: [], motorik: [], sensorisk: [], energi: [],
  }

  // Summera svar
  // Värden från QuestionCard är 1-5, normalisera till 0-1 skala
  Object.entries(answers).forEach(([questionId, value]) => {
    const question = allQuestions.find(q => q.id === questionId)
    if (!question) return

    // Konvertera 1-5 skala till 0-1 (där 1=0.0, 3=0.5, 5=1.0)
    const normalizedValue = (value - 1) / 4
    /**
     * Tillbaka till 1–5, inte 0–5.
     *
     * `normalizedValue * 5` gav ett svar på mitten (3) värdet 2,5 och ett
     * lägsta svar värdet 0. Två följder, båda belagda i prod-data:
     *   · ICF: `ICFSection` klassar `< 3` som "Utmanande – anpassningar
     *     rekommenderas" i rött. Ett MITTENSVAR blev alltså rött, och
     *     användaren fick se "2.5/5". Tre verkliga användare har i skrivande
     *     stund kognitiv/koncentration/sensorisk lagrade som exakt 2.5.
     *   · RIASEC: yrkena är kodade 1–5 och `calculateRiasecMatch` antar
     *     `maxDiff = 6 * 4`. Med användarvärde 0 kan differensen bli 5 per
     *     dimension och delpoängen bli negativ. Dessutom var värdet 2
     *     oåtkomligt (avrundningen gav {0,1,3,4,5}).
     */
    const skala1till5 = 1 + normalizedValue * 4

    if (question.section === 'riasec') {
      riasec[question.category as keyof RiasecScores] += skala1till5
      riasecCounts[question.category]++
    } else if (question.section === 'bigfive') {
      bigFiveCounts[question.category].sum += normalizedValue * 100
      bigFiveCounts[question.category].count++
    } else if (question.section === 'strong') {
      strongCounts[question.category].sum += normalizedValue * 100
      strongCounts[question.category].count++
    } else if (question.section === 'icf') {
      const category = question.category as keyof ICFScores
      if (icfValues[category]) icfValues[category].push(skala1till5)
    }
  })

  // Medelvärde per ICF-domän, avrundat likadant för alla sex. Motorik
  // avrundades tidigare men de fem övriga inte, vilket dolde skalfelet.
  ;(Object.keys(icfValues) as (keyof ICFScores)[]).forEach(k => {
    if (icfValues[k].length > 0) {
      icf[k] = Math.round(icfValues[k].reduce((a, b) => a + b, 0) / icfValues[k].length)
    }
  })

  // Normalisera RIASEC
  Object.keys(riasec).forEach(key => {
    const k = key as keyof RiasecScores
    if (riasecCounts[key] > 0) {
      riasec[k] = Math.round(riasec[k] / riasecCounts[key])
    }
  })

  // Normalisera Big Five
  Object.keys(bigFiveCounts).forEach(key => {
    const k = key as keyof BigFiveScores
    const { sum, count } = bigFiveCounts[key]
    if (count > 0) {
      bigFive[k] = Math.round(sum / count)
    }
  })

  // Normalisera Strong Interest
  Object.keys(strongCounts).forEach(key => {
    const k = key as keyof StrongInterestCategories
    const { sum, count } = strongCounts[key]
    if (count > 0) {
      strongInterest[k] = Math.round(sum / count)
    }
  })

  const coverage: ProfileCoverage = {
    riasec: {
      R: riasecCounts.R, I: riasecCounts.I, A: riasecCounts.A,
      S: riasecCounts.S, E: riasecCounts.E, C: riasecCounts.C,
    },
    bigFive: {
      openness: bigFiveCounts.openness.count,
      conscientiousness: bigFiveCounts.conscientiousness.count,
      extraversion: bigFiveCounts.extraversion.count,
      agreeableness: bigFiveCounts.agreeableness.count,
      stability: bigFiveCounts.stability.count,
    },
    icf: {
      kognitiv: icfValues.kognitiv.length,
      kommunikation: icfValues.kommunikation.length,
      koncentration: icfValues.koncentration.length,
      motorik: icfValues.motorik.length,
      sensorisk: icfValues.sensorisk.length,
      energi: icfValues.energi.length,
    },
    strongInterest: Object.fromEntries(
      Object.keys(strongCounts).map(k => [k, strongCounts[k].count])
    ) as ProfileCoverage['strongInterest'],
    answered: Object.keys(answers).filter(id => allQuestions.some(q => q.id === id)).length,
    total: allQuestions.length,
  }

  return { riasec, bigFive, icf, strongInterest, coverage }
}

/**
 * Frågorna om funktionsförmåga — ork, koncentration, motorik, sinnesintryck.
 *
 * Det är uppgifter om hälsa i GDPR art. 9:s mening, och de får därför inte
 * lagras utan uttryckligt samtycke. Exporteras så att TestTab kan utelämna
 * dem ur det som skrivs när samtycke saknas. (2026-08-21.)
 */
export const ICF_FRAGE_IDN: string[] = allQuestions
  .filter(q => q.section === 'icf')
  .map(q => q.id)

/** Är alla frågor besvarade? Villkoret för att få kalla testet slutfört. */
export function arProfilenKomplett(answers: Record<string, number>): boolean {
  return allQuestions.every(q => typeof answers[q.id] === 'number')
}

/**
 * Hur matchningen ska UTTRYCKAS i gränssnittet.
 *
 * `matchPercentage` är en relativ poäng och duger för att SORTERA, men den är
 * inte tolkbar som "hur väl passar jag". Mätt 2026-08-21 med
 * `scripts/mat-matchningsfordelning.mjs`: den som svarar 3 (mitten) på alla 34
 * frågor får 61–82 % mot varje yrke, median 75. Det är inte en egenskap hos
 * formelns golv utan hos avståndsmåttet — den som ligger i mitten ligger nära
 * allt. Yrkena är kodade 1–5, och ett neutralt svar är aldrig långt från något.
 *
 * Talet visades tidigare som "87 % match" med färgskala och som "9/10". Det
 * läses som en mätning av lämplighet, och deltagare fattar livsval på det.
 * Rangordningen är däremot äkta information: den säger vilka yrken som ligger
 * närmast just de svar personen gav.
 *
 * Regeln: visa PLATS, inte procent. Talet finns kvar i typen för sortering och
 * historik.
 */
export function matchningsplats(index: number, totalt: number): string {
  return `Nr ${index + 1} av ${totalt} utifrån dina svar`
}

/** Frågor som saknar svar — används för att peka användaren rätt. */
export function obesvaradeFragor(answers: Record<string, number>): Question[] {
  return allQuestions.filter(q => typeof answers[q.id] !== 'number')
}

// ===== RIASEC FÄRGER =====

// Kategorifärger för RIASEC-diagram (gradient-tokens borttagna 2026-07-10 — 0 användare, DESIGN.md §6)
export const riasecColors: Record<string, { bg: string; text: string }> = {
  R: { bg: 'bg-red-500', text: 'text-red-500' },
  I: { bg: 'bg-blue-500', text: 'text-blue-500' },
  A: { bg: 'bg-purple-500', text: 'text-purple-500' },
  S: { bg: 'bg-green-500', text: 'text-green-500' },
  E: { bg: 'bg-amber-500', text: 'text-amber-500' },
  C: { bg: 'bg-teal-500', text: 'text-teal-500' },
}

export const riasecNames: Record<string, string> = {
  R: 'Realistisk',
  I: 'Investigativ',
  A: 'Konstnärlig',
  S: 'Social',
  E: 'Entreprenöriell',
  C: 'Konventionell',
}

// ===== BIG FIVE NAMN =====

export const bigFiveNames: Record<string, { name: string; description: string }> = {
  openness: { name: 'Öppenhet', description: 'Nyfikenhet, kreativitet och nya upplevelser' },
  conscientiousness: { name: 'Samvetsgrannhet', description: 'Noggrannhet, organisation och pålitlighet' },
  extraversion: { name: 'Extraversion', description: 'Social, energisk och utåtriktad' },
  agreeableness: { name: 'Vänlighet', description: 'Empati, samarbete och tillit' },
  stability: { name: 'Stabilitet', description: 'Stresshantering och emotionell stabilitet' },
}
