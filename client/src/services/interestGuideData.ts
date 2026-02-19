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
  lowLabel?: string
  highLabel?: string
}

export type SectionId = 'riasec' | 'bigfive' | 'strong' | 'icf' | 'physical'

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
  kognitiv: number
  kommunikation: number
  koncentration: number
  motorik: number
  sensorisk: number
  energi: number
}

export interface PhysicalScores {
  kraft: number
  uthallighet: number
  rorlighet: number
  precision: number
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

export interface UserProfile {
  riasec: RiasecScores
  bigFive: BigFiveScores
  icf: ICFScores
  physical: PhysicalScores
  strongInterest: StrongInterestCategories
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

export interface JobMatch {
  occupation: Occupation
  matchPercentage: number
  isSuitable: boolean
  needsAdaptation: boolean
  adaptations?: string[]
  warnings?: string[]
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
  { id: 'icf', name: 'ICF-profil', subtitle: 'Dina funktionsförutsättningar', count: 6 },
  { id: 'physical', name: 'Fysiska utmaningar', subtitle: 'Dina fysiska förmågor', count: 8 },
]

// ===== FRÅGOR =====

// RIASEC Frågor (6 st - 1 per kategori)
const riasecQuestions: Omit<Question, 'type'>[] = [
  { id: 'r1', text: 'Jag gillar att arbeta praktiskt med händerna, maskiner eller utomhus', category: 'R', section: 'riasec' },
  { id: 'i1', text: 'Jag gillar att analysera, forska och förstå komplexa problem', category: 'I', section: 'riasec' },
  { id: 'a1', text: 'Jag älskar att vara kreativ, skapa och uttrycka mig estetiskt', category: 'A', section: 'riasec' },
  { id: 's1', text: 'Jag trivs bäst när jag får hjälpa, undervisa eller stötta andra', category: 'S', section: 'riasec' },
  { id: 'e1', text: 'Jag gillar att leda, påverka, sälja eller driva projekt', category: 'E', section: 'riasec' },
  { id: 'c1', text: 'Jag gillar att organisera, strukturera och arbeta med detaljer/data', category: 'C', section: 'riasec' },
]

// Big Five Frågor (10 st - 2 per trait)
const bigFiveQuestions: Omit<Question, 'type'>[] = [
  { id: 'bf_o1', text: 'Jag är nyfiken, kreativ och gillar nya idéer och upplevelser', category: 'openness', section: 'bigfive' },
  { id: 'bf_o2', text: 'Jag uppskattar konst, fantasi och att tänka utanför boxen', category: 'openness', section: 'bigfive' },
  { id: 'bf_c1', text: 'Jag är noggrann, organiserad och gör alltid mitt bästa', category: 'conscientiousness', section: 'bigfive' },
  { id: 'bf_c2', text: 'Jag är pålitlig, planerar mitt arbete och håller deadlines', category: 'conscientiousness', section: 'bigfive' },
  { id: 'bf_e1', text: 'Jag är utåtriktad, pratsam och trivs med andra människor', category: 'extraversion', section: 'bigfive' },
  { id: 'bf_e2', text: 'Jag blir energisk av sociala sammanhang och tycker om att uttrycka mig', category: 'extraversion', section: 'bigfive' },
  { id: 'bf_a1', text: 'Jag bryr mig om andra, är empatisk och samarbetsvillig', category: 'agreeableness', section: 'bigfive' },
  { id: 'bf_a2', text: 'Jag litar på människor, undviker konflikter och ser det bästa i andra', category: 'agreeableness', section: 'bigfive' },
  { id: 'bf_n1', text: 'Jag hanterar stress väl och håller mig lugn under press', category: 'stability', section: 'bigfive' },
  { id: 'bf_n2', text: 'Jag är stabil i humöret och återhämtar mig snabbt från motgångar', category: 'stability', section: 'bigfive' },
]

// Strong Interest Inventory (10 frågor)
const strongInterestQuestions: Omit<Question, 'type'>[] = [
  { id: 'si1', text: 'Teknik, mekanik och att förstå hur maskiner fungerar', category: 'teknik_mekanik', section: 'strong' },
  { id: 'si2', text: 'Naturvetenskap, biologi, kemi och forskning', category: 'natur_vetenskap', section: 'strong' },
  { id: 'si3', text: 'Konst, kultur, design och estetiskt skapande', category: 'konst_kultur', section: 'strong' },
  { id: 'si4', text: 'Socialt arbete, vård och att hjälpa människor i svårigheter', category: 'social_vard', section: 'strong' },
  { id: 'si5', text: 'Affärer, försäljning och entreprenörskap', category: 'affarer_forsaljning', section: 'strong' },
  { id: 'si6', text: 'Administration, kontorsarbete och organisering', category: 'administration_kontor', section: 'strong' },
  { id: 'si7', text: 'Utomhusarbete och arbete i naturen', category: 'utomhusarbete', section: 'strong' },
  { id: 'si8', text: 'Ledarskap, organisation och att styra projekt', category: 'ledarskap_organisation', section: 'strong' },
  { id: 'si9', text: 'Data, IT, programmering och digitala system', category: 'data_it', section: 'strong' },
  { id: 'si10', text: 'Undervisning, pedagogik och att lära ut', category: 'undervisning_pedagogik', section: 'strong' },
]

// ICF-baserad arbetsstilsmodell (6 frågor)
const icfQuestions: Omit<Question, 'type'>[] = [
  { id: 'icf_cog', text: 'Jag har lätt att komma ihåg, planera, organisera och lösa problem', category: 'kognitiv', section: 'icf', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'icf_com', text: 'Jag kan uttrycka mig tydligt, förstå sociala koder och samarbeta', category: 'kommunikation', section: 'icf', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'icf_con', text: 'Jag kan fokusera på uppgifter, växla fokus och ignorera störningar', category: 'koncentration', section: 'icf', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'icf_mot', text: 'Jag kan röra mig fritt, hantera fysiska uppgifter och variera kroppsställning', category: 'motorik', section: 'icf', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'icf_sen', text: 'Jag hanterar ljud, ljus och andra sinnesintryck utan att bli överväldigad', category: 'sensorisk', section: 'icf', lowLabel: 'Mycket känslig', highLabel: 'Inte känslig' },
  { id: 'icf_en', text: 'Jag har ork att arbeta hela dagen och återhämtar mig efter ansträngning', category: 'energi', section: 'icf', lowLabel: 'Mycket trött', highLabel: 'Mycket energi' },
]

// Fysiska utmaningar (8 frågor)
const physicalQuestions: Omit<Question, 'type'>[] = [
  { id: 'phy_kraft1', text: 'Jag klarar av att lyfta och bära tyngre föremål', category: 'kraft', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_kraft2', text: 'Jag hanterar fysiskt krävande arbete med hög belastning', category: 'kraft', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_uth1', text: 'Jag orkar med arbete som kräver god kondition under hela dagen', category: 'uthallighet', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_uth2', text: 'Jag klarar av att röra mig mycket utan att bli andfådd eller trött', category: 'uthallighet', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_ror1', text: 'Jag kan böja mig, sträcka mig och arbeta i olika positioner', category: 'rorlighet', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_ror2', text: 'Jag klarar av att arbeta i obekväma ställningar (knästående, över huvudet, etc.)', category: 'rorlighet', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_prec1', text: 'Jag har stadiga händer och kan utföra precisionsarbete', category: 'precision', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
  { id: 'phy_prec2', text: 'Jag klarar av finmotoriska uppgifter som kräver noggrannhet (skruva, knäppa, etc.)', category: 'precision', section: 'physical', lowLabel: 'Mycket svårt', highLabel: 'Mycket lätt' },
]

// Kombinera alla frågor
export const allQuestions: Question[] = [
  ...riasecQuestions.map(q => ({ ...q, type: 'likert' as const })),
  ...bigFiveQuestions.map(q => ({ ...q, type: 'likert' as const })),
  ...strongInterestQuestions.map(q => ({ ...q, type: 'likert' as const })),
  ...icfQuestions.map(q => ({ ...q, type: 'slider' as const })),
  ...physicalQuestions.map(q => ({ ...q, type: 'slider' as const })),
]

// ===== YRKESDATABAS =====

export const occupations: Occupation[] = [
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
]

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
  filterUniversity?: boolean | null
): JobMatch[] {
  const matches: JobMatch[] = occupations.map(occupation => {
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

    // 1. RIASEC-matchning (25%)
    const riasecScore = calculateRiasecMatch(profile.riasec, occupation.riasec)
    totalScore += riasecScore * 0.25
    totalWeight += 0.25

    // 2. Big Five-matchning (20%)
    const bigFiveScore = calculateBigFiveMatch(profile.bigFive, occupation.bigFive)
    totalScore += bigFiveScore * 0.20
    totalWeight += 0.20

    // 3. ICF-matchning (25%) - viktigt för anpassningsbarhet
    const icfResult = calculateICFMatch(profile.icf, occupation.icf)
    totalScore += icfResult.score * 0.25
    totalWeight += 0.25
    adaptations.push(...icfResult.adaptations)

    // 4. Fysiska krav (15%)
    const physicalResult = calculatePhysicalMatch(profile.physical, occupation.challenges)
    totalScore += physicalResult.score * 0.15
    totalWeight += 0.15
    warnings.push(...physicalResult.warnings)

    // 5. Intresseområden (15%)
    const interestScore = calculateInterestMatch(profile.strongInterest, occupation.categories)
    totalScore += interestScore * 0.15
    totalWeight += 0.15

    const matchPercentage = Math.round((totalScore / totalWeight) * 100)
    
    // Bestäm lämplighet
    const isSuitable = matchPercentage >= 60 && warnings.length === 0
    const needsAdaptation = adaptations.length > 0 || (matchPercentage >= 50 && matchPercentage < 70)

    return {
      occupation,
      matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
      isSuitable,
      needsAdaptation,
      adaptations: adaptations.slice(0, 5),
      warnings: warnings.slice(0, 3),
    }
  }).filter((match): match is JobMatch => match !== null)

  // Sortera efter matchningsprocent
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage)
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

function calculateICFMatch(user: ICFScores, job: ICFScores): { score: number; adaptations: string[] } {
  const keys: (keyof ICFScores)[] = ['kognitiv', 'kommunikation', 'koncentration', 'motorik', 'sensorisk', 'energi']
  let scoreSum = 0
  const adaptations: string[] = []

  keys.forEach(key => {
    const userScore = user[key]
    const jobScore = job[key]
    
    if (userScore >= jobScore) {
      scoreSum += 1
    } else {
      const gap = jobScore - userScore
      scoreSum += Math.max(0, 1 - (gap / 5))
      
      // Lägg till anpassningsrekommendationer
      if (gap >= 2 && icfAdaptations[key]) {
        adaptations.push(`${icfAdaptations[key].name}: ${icfAdaptations[key].adaptations[0]}`)
      }
    }
  })

  return { score: scoreSum / keys.length, adaptations }
}

function calculatePhysicalMatch(
  user: PhysicalScores,
  challenges: JobChallenges
): { score: number; warnings: string[] } {
  const warnings: string[] = []
  let scoreSum = 0
  let count = 0

  if (challenges.fysisk_rorlighet) {
    const userScore = user.rorlighet
    if (userScore < challenges.fysisk_rorlighet) {
      warnings.push('Arbetet kräver mer rörlighet än du indikerat')
    }
    scoreSum += Math.min(1, userScore / challenges.fysisk_rorlighet)
    count++
  }

  if (challenges.fysisk_styrka) {
    const userScore = user.kraft
    if (userScore < challenges.fysisk_styrka) {
      warnings.push('Arbetet kan vara fysiskt krävande')
    }
    scoreSum += Math.min(1, userScore / challenges.fysisk_styrka)
    count++
  }

  if (challenges.stillasittande && challenges.stillasittande > 3) {
    const userScore = user.uthallighet
    if (userScore < 3) {
      warnings.push('Stillasittande arbete kan vara påfrestande')
    }
    scoreSum += Math.min(1, userScore / challenges.stillasittande)
    count++
  }

  return { score: count > 0 ? scoreSum / count : 0.5, warnings }
}

function calculateInterestMatch(
  user: StrongInterestCategories,
  categories: JobRequirements
): number {
  let matchSum = 0
  let count = 0

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
  }

  Object.entries(categories).forEach(([cat, weight]) => {
    const userCat = mappings[cat]
    if (userCat && weight) {
      const userScore = user[userCat]
      matchSum += Math.min(1, userScore / (weight * 20))
      count++
    }
  })

  return count > 0 ? matchSum / count : 0.5
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

  // ICF och Physical
  const icf: ICFScores = { kognitiv: 3, kommunikation: 3, koncentration: 3, motorik: 3, sensorisk: 3, energi: 3 }
  const physical: PhysicalScores = { kraft: 3, uthallighet: 3, rorlighet: 3, precision: 3 }

  // Summera svar
  Object.entries(answers).forEach(([questionId, value]) => {
    const question = allQuestions.find(q => q.id === questionId)
    if (!question) return

    const normalizedValue = value / 100 // Konvertera till 0-1

    if (question.section === 'riasec') {
      riasec[question.category as keyof RiasecScores] += normalizedValue * 5
      riasecCounts[question.category]++
    } else if (question.section === 'bigfive') {
      bigFiveCounts[question.category].sum += normalizedValue * 100
      bigFiveCounts[question.category].count++
    } else if (question.section === 'strong') {
      strongCounts[question.category].sum += normalizedValue * 100
      strongCounts[question.category].count++
    } else if (question.section === 'icf') {
      icf[question.category as keyof ICFScores] = normalizedValue * 5
    } else if (question.section === 'physical') {
      physical[question.category as keyof PhysicalScores] = normalizedValue * 5
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

  return { riasec, bigFive, icf, physical, strongInterest }
}

// ===== RIASEC FÄRGER =====

export const riasecColors: Record<string, { bg: string; text: string; gradient: string }> = {
  R: { bg: 'bg-red-500', text: 'text-red-500', gradient: 'from-red-500 to-red-600' },
  I: { bg: 'bg-blue-500', text: 'text-blue-500', gradient: 'from-blue-500 to-blue-600' },
  A: { bg: 'bg-purple-500', text: 'text-purple-500', gradient: 'from-purple-500 to-purple-600' },
  S: { bg: 'bg-green-500', text: 'text-green-500', gradient: 'from-green-500 to-green-600' },
  E: { bg: 'bg-amber-500', text: 'text-amber-500', gradient: 'from-amber-500 to-amber-600' },
  C: { bg: 'bg-teal-500', text: 'text-teal-500', gradient: 'from-teal-500 to-teal-600' },
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
