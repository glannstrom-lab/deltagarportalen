// Mock API för demo-läge (när backend inte är tillgänglig)
// Detta gör att portalen fungerar helt utan backend

import { mockArticlesData, articleCategories, type EnhancedArticle } from './articleData'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ===== TYPER =====

export interface WorkExperience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  degree: string
  school: string
  field: string
  location?: string
  startDate: string
  endDate: string
  description?: string
}

export interface Language {
  id: string
  language: string
  level: 'Grundläggande' | 'Medel' | 'Flytande' | 'Modersmål'
}

export interface Certificate {
  id: string
  name: string
  issuer: string
  date: string
  expiryDate?: string
}

export interface Link {
  id: string
  type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'other'
  url: string
  label?: string
}

export interface Reference {
  id: string
  name: string
  title: string
  company: string
  email?: string
  phone?: string
}

export interface Skill {
  id: string
  name: string
  level: 1 | 2 | 3 | 4 | 5
  category: 'technical' | 'soft' | 'tool' | 'language'
}

export interface CVData {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  location: string
  summary: string
  workExperience: WorkExperience[]
  education: Education[]
  skills: Skill[]
  languages: Language[]
  certificates: Certificate[]
  links: Link[]
  references: Reference[]
  template: string
  colorScheme: string
  font: string
}

export interface CVVersion {
  id: string
  name: string
  data: CVData
  createdAt: string
}

export interface JobFilters {
  search?: string
  location?: string
  employmentType?: string[]
  experienceLevel?: string[]
  publishedWithin?: 'today' | 'week' | 'month' | 'all'
  minMatchPercentage?: number
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements: string[]
  employmentType: string
  experienceLevel: string
  publishedAt: string
  publishedDate?: string  // Alias för bakåtkompatibilitet
  deadline?: string
  salary?: string
  salaryRange?: string  // Alias för bakåtkompatibilitet
  benefits: string[]
  matchPercentage?: number
  matchingSkills?: string[]  // För komponenter som förväntar sig detta
  missingKeywords?: string[]  // För komponenter som förväntar sig detta
  url: string
}

export interface JobApplication {
  id: string
  jobId: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  appliedAt?: string
  appliedDate?: string  // Alias för bakåtkompatibilitet
  notes?: string
  job?: Job
}

// ===== MOCK DATA =====

const mockUser = {
  id: '1',
  email: 'demo@demo.se',
  firstName: 'Anna',
  lastName: 'Andersson',
  role: 'USER',
  createdAt: '2024-01-01T00:00:00Z',
}

const mockCV: CVData = {
  firstName: 'Anna',
  lastName: 'Andersson',
  title: 'Erfaren Projektledare',
  email: 'anna.andersson@email.se',
  phone: '070-123 45 67',
  location: 'Stockholm',
  summary: 'Driven projektledare med 5 års erfarenhet av att leda team och driva framgångsrika projekt inom IT och digitalisering. Jag brinner för att skapa struktur och få människor att samarbeta effektivt.',
  workExperience: [
    {
      id: '1',
      title: 'Projektledare',
      company: 'Tech Solutions AB',
      location: 'Stockholm',
      startDate: '2022-01',
      endDate: '',
      current: true,
      description: 'Leder utvecklingsteam i agila projekt. Ansvarig för planering, budget och leverans av kundprojekt.',
    },
    {
      id: '2',
      title: 'Teamledare',
      company: 'Digitalbyrån Sverige',
      location: 'Stockholm',
      startDate: '2019-06',
      endDate: '2021-12',
      current: false,
      description: 'Ledde ett team på 8 personer inom webbutveckling. Drev förändringsarbete och implementerade nya arbetsmetoder.',
    },
  ],
  education: [
    {
      id: '1',
      degree: 'Kandidatexamen',
      school: 'Stockholms Universitet',
      field: 'Systemvetenskap',
      location: 'Stockholm',
      startDate: '2016-08',
      endDate: '2019-06',
      description: 'Inriktning mot IT-projektledning och verksamhetsutveckling',
    },
  ],
  skills: [
    { id: '1', name: 'Projektledning', level: 5, category: 'soft' },
    { id: '2', name: 'Agila metoder', level: 4, category: 'technical' },
    { id: '3', name: 'Kommunikation', level: 5, category: 'soft' },
    { id: '4', name: 'Jira', level: 4, category: 'tool' },
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'Modersmål' },
    { id: '2', language: 'Engelska', level: 'Flytande' },
  ],
  certificates: [
    { id: '1', name: 'PMP Certifiering', issuer: 'PMI', date: '2022-03' },
    { id: '2', name: 'Scrum Master', issuer: 'Scrum Alliance', date: '2021-08' },
  ],
  links: [],
  references: [],
  template: 'modern',
  colorScheme: 'indigo',
  font: 'inter',
}

const mockCVVersions: CVVersion[] = [
  {
    id: '1',
    name: 'Original',
    data: mockCV,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'IT-fokuserad',
    data: { ...mockCV, title: 'IT-Projektledare' },
    createdAt: '2024-02-01T14:30:00Z',
  },
]

const mockCoverLetters: any[] = []

const mockInterestResult = {
  realistic: 70,
  investigative: 60,
  artistic: 40,
  social: 85,
  enterprising: 75,
  conventional: 50,
  hollandCode: 'SEC',
  openness: 75,
  conscientiousness: 80,
  extraversion: 70,
  agreeableness: 85,
  neuroticism: 30,
  recommendedJobs: ['Projektledare', 'Teamledare', 'Kundtjänstchef', 'HR-specialist'],
  completedAt: '2024-01-20T12:00:00Z',
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Projektledare',
    company: 'Stora Företaget AB',
    location: 'Stockholm',
    description: 'Vi söker en erfaren projektledare som kan driva våra digitala transformationsprojekt...',
    requirements: ['3+ års erfarenhet', 'PMP-certifiering', 'Agila metoder'],
    employmentType: 'Heltid',
    experienceLevel: 'Erfaren',
    publishedAt: new Date().toISOString(),
    salary: '45 000 - 55 000 kr/mån',
    benefits: ['Flextid', 'Distansarbete', 'Kompetensutveckling'],
    matchPercentage: 85,
    url: '#',
  },
  {
    id: '2',
    title: 'Teamledare',
    company: 'Innovativa Startup Sverige',
    location: 'Göteborg',
    description: 'Kom och led vårt växande utvecklingsteam...',
    requirements: ['Ledarskapserfarenhet', 'Teknisk bakgrund', 'Kommunikationsfärdigheter'],
    employmentType: 'Heltid',
    experienceLevel: 'Erfaren',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    salary: '40 000 - 50 000 kr/mån',
    benefits: ['Aktieoptioner', 'Flextid', 'Hälsopeng'],
    matchPercentage: 78,
    url: '#',
  },
]

const mockApplications: JobApplication[] = []

const mockUsers: Record<string, any> = {
  'demo@demo.se': mockUser,
}

// ===== HJÄLPFUNKTIONER =====

async function mockApiRequest(endpoint: string, options: RequestInit = {}) {
  await delay(300) // Simulera nätverksfördröjning
  
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body as string) : undefined
  
  // Auth endpoints
  if (endpoint === '/auth/login' && method === 'POST') {
    const { email, password } = body
    if (email === 'demo@demo.se' && password === 'demo123') {
      return {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now(),
      }
    }
    throw new Error('Felaktig e-post eller lösenord')
  }
  
  if (endpoint === '/auth/register' && method === 'POST') {
    const { email, firstName, lastName } = body
    const newUser = {
      id: String(Date.now()),
      email,
      firstName,
      lastName,
      role: 'USER',
      createdAt: new Date().toISOString(),
    }
    mockUsers[email] = newUser
    return {
      user: newUser,
      token: 'mock-jwt-token-' + Date.now(),
    }
  }
  
  // CV endpoints
  if (endpoint === '/cv' && method === 'GET') {
    return { ...mockCV, user: mockUser }
  }
  
  if (endpoint === '/cv' && method === 'PUT') {
    Object.assign(mockCV, body)
    return { success: true }
  }
  
  if (endpoint === '/cv/ats-analysis') {
    return {
      score: 75,
      suggestions: ['Lägg till fler nyckelord från jobbannonsen', 'Förtydliga dina resultat'],
      keywords: ['projektledning', 'agilt', 'teamledning'],
    }
  }
  
  if (endpoint === '/cv/versions' && method === 'GET') {
    return mockCVVersions
  }
  
  if (endpoint === '/cv/versions' && method === 'POST') {
    const newVersion: CVVersion = {
      id: String(Date.now()),
      name: body.name,
      data: body.data,
      createdAt: new Date().toISOString(),
    }
    mockCVVersions.push(newVersion)
    return newVersion
  }
  
  if (endpoint.match(/^\/cv\/versions\/\w+\/restore$/) && method === 'POST') {
    const id = endpoint.split('/')[3]
    const version = mockCVVersions.find(v => v.id === id)
    if (version) {
      Object.assign(mockCV, version.data)
      return { success: true }
    }
    throw new Error('Version hittades inte')
  }
  
  if (endpoint === '/cv/share' && method === 'POST') {
    return {
      shareUrl: 'https://example.com/share/cv-' + Date.now(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
  
  if (endpoint === '/cv/job-matches') {
    return mockJobs.slice(0, 3)
  }
  
  if (endpoint === '/cv/analyze-job' && method === 'POST') {
    return {
      matchPercentage: 72,
      matchingSkills: ['Projektledning', 'Kommunikation'],
      missingSkills: ['Python', 'Dataanalys'],
      suggestions: ['Lyft fram dina ledarskapskvaliteter', 'Nämna liknande projekt'],
    }
  }
  
  // Jobs endpoints
  if (endpoint === '/jobs' && method === 'POST') {
    return mockJobs
  }
  
  if (endpoint.match(/^\/jobs\/\w+$/) && method === 'GET') {
    const id = endpoint.split('/')[2]
    const job = mockJobs.find(j => j.id === id)
    if (job) return job
    throw new Error('Jobb hittades inte')
  }
  
  if (endpoint === '/job-applications' && method === 'GET') {
    return mockApplications
  }
  
  if (endpoint === '/job-applications' && method === 'POST') {
    const newApp: JobApplication = {
      id: String(Date.now()),
      ...body,
      appliedAt: new Date().toISOString(),
    }
    mockApplications.push(newApp)
    return newApp
  }
  
  if (endpoint.match(/^\/job-applications\/\w+$/) && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const app = mockApplications.find(a => a.id === id)
    if (app) {
      Object.assign(app, body)
      return app
    }
    throw new Error('Ansökan hittades inte')
  }
  
  if (endpoint.match(/^\/job-applications\/\w+$/) && method === 'DELETE') {
    const id = endpoint.split('/')[2]
    const index = mockApplications.findIndex(a => a.id === id)
    if (index >= 0) {
      mockApplications.splice(index, 1)
    }
    return { success: true }
  }
  
  // Interest endpoints
  if (endpoint === '/interest/questions') {
    return [
      { id: '1', text: 'Jag gillar att arbeta praktiskt med händerna', category: 'realistic' },
      { id: '2', text: 'Jag tycker om att lösa problem', category: 'investigative' },
      { id: '3', text: 'Jag är kreativ och gillar att skapa', category: 'artistic' },
      { id: '4', text: 'Jag gillar att hjälpa andra människor', category: 'social' },
    ]
  }
  
  if (endpoint === '/interest/result' && method === 'GET') {
    return mockInterestResult
  }
  
  if (endpoint === '/interest/result' && method === 'POST') {
    Object.assign(mockInterestResult, body)
    return { success: true }
  }
  
  if (endpoint === '/interest/recommendations') {
    return [
      { title: 'Projektledare', description: 'Passar dig som gillar struktur och människor', match: 85 },
      { title: 'Teamledare', description: 'För dig som vill leda och inspirera', match: 78 },
      { title: 'HR-specialist', description: 'Arbeta med människor och organisation', match: 72 },
    ]
  }
  
  // Cover letter endpoints
  if (endpoint === '/cover-letter' && method === 'GET') {
    return mockCoverLetters
  }
  
  if (endpoint === '/cover-letter' && method === 'POST') {
    const newLetter = {
      id: String(Date.now()),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockCoverLetters.push(newLetter)
    return newLetter
  }
  
  if (endpoint.match(/^\/cover-letter\/\w+$/) && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const letter = mockCoverLetters.find((l: any) => l.id === id)
    if (letter) {
      Object.assign(letter, body, { updatedAt: new Date().toISOString() })
      return letter
    }
    throw new Error('Brev hittades inte')
  }
  
  if (endpoint.match(/^\/cover-letter\/\w+$/) && method === 'DELETE') {
    const id = endpoint.split('/')[2]
    const index = mockCoverLetters.findIndex((l: any) => l.id === id)
    if (index >= 0) {
      mockCoverLetters.splice(index, 1)
    }
    return { success: true }
  }
  
  if (endpoint === '/cover-letter/generate' && method === 'POST') {
    const { jobAd } = body
    const generatedContent = `Hej!

Jag skriver med stort intresse angående den utannonserade tjänsten. Efter att ha läst er beskrivning känner jag att mina erfarenheter och kompetenser stämmer väl överens med vad ni söker.

[Jobbannonsen nämner: ${jobAd?.substring(0, 100)}...]

Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ert team.

Med vänliga hälsningar,
Anna Andersson`
    return { content: generatedContent, brev: generatedContent, success: true }
  }
  
  // Articles endpoints
  if (endpoint === '/articles') {
    return mockArticlesData
  }
  
  if (endpoint.match(/^\/articles\/\w+$/)) {
    const id = endpoint.split('/')[2]
    const article = mockArticlesData.find((a: EnhancedArticle) => a.id === id)
    if (article) return article
    throw new Error('Artikel hittades inte')
  }
  
  if (endpoint === '/articles/categories') {
    return articleCategories
  }
  
  // Users endpoints
  if (endpoint === '/users/me') {
    return mockUser
  }
  
  if (endpoint === '/users/me' && method === 'PUT') {
    Object.assign(mockUser, body)
    return mockUser
  }
  
  // AI endpoints (simulerade)
  if (endpoint === '/api/ai/health') {
    return {
      status: 'OK',
      enabled: true,
      url: 'http://localhost:3002',
      aiServer: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        model: 'mock-model'
      }
    }
  }
  
  if (endpoint === '/api/ai/cv-optimering' && method === 'POST') {
    const { cvText, yrke } = body
    return {
      success: true,
      yrke: yrke || null,
      feedback: `Feedback på ditt CV${cvText ? ' (' + cvText.substring(0, 50) + '...)' : ''}:

1. ÖVERGRIPANDE BEDÖMNING
Ditt CV har en bra struktur och tydlig information.

2. FÖRBÄTTRINGSFÖRSLAG
- Lägg till fler mätbara resultat
- Förtydliga dina rolltiteln
- Lägg till nyckelord från jobbannonser

3. SAKNAD INFORMATION
- Kompetenser som är relevanta för rollen
- Certifieringar och utbildningar

4. FRÅGOR ATT REFLECTERA ÖVER
- Vilka är dina största styrkor?
- Vad skiljer dig från andra kandidater?`,
    }
  }
  
  if (endpoint === '/api/ai/personligt-brev' && method === 'POST') {
    const { jobbAnnons, erfarenhet, motivering } = body
    const brev = `Hej!

Jag skriver med stort intresse angående den utannonserade tjänsten${jobbAnnons ? ' där ni söker någon som kan bidra med erfarenhet och driv' : ''}.

${erfarenhet ? `Med min bakgrund inom ${erfarenhet} tror jag jag kan tillföra stort värde till ert team.` : 'Med min erfarenhet och driv tror jag jag kan bidra till ert team.'}

${motivering || 'Jag är mycket motiverad att ta mig an nya utmaningar och utvecklas i rollen.'}

Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ert team.

Med vänliga hälsningar,
${mockUser.firstName} ${mockUser.lastName}`
    return { success: true, brev, ton: body.ton || 'professionell' }
  }
  
  if (endpoint === '/api/ai/jobbtips' && method === 'POST') {
    return {
      success: true,
      tips: `PERSONLIGA JOBSÖKARTIPS

1. UPPMUNTRAN
Du har värdefull erfarenhet som många arbetsgivare söker!

2. NÄSTA STEG
- Uppdatera ditt CV med relevanta nyckelord
- Nätverka på LinkedIn
- Skräddarsy varje ansökan

3. YRKEN ATT UTFORSKA
- Projektledare
- Teamledare
- Kundtjänstchef
- HR-specialist

4. BEMÖTA HINDER
Fokusera på dina styrkor och var öppen med din situation.`
    }
  }
  
  if (endpoint === '/api/ai/intervju-forberedelser' && method === 'POST') {
    const { jobbTitel } = body
    return {
      success: true,
      forberedelser: `INTERVJUFÖRBEREDELSER FÖR ${jobbTitel?.toUpperCase() || 'ROLLEN'}

TROLIGA INTERVJUFRÅGOR:
1. Berätta om dig själv
2. Varför söker du denna roll?
3. Beskriv en utmanande situation och hur du hanterade den
4. Vad är dina styrkor och svagheter?
5. Varför ska vi anställa just dig?

FÖRBEREDDA SVAR (STAR-metoden):
- Situation: Beskriv kontexten
- Uppgift: Vad behövde du göra?
- Handling: Vad gjorde du?
- Resultat: Vad blev utfallet?

FRÅGOR ATT STÄLLA:
1. Kan du beskriva en typisk arbetsdag?
2. Hur ser teamet ut?
3. Vilka möjligheter finns det till utveckling?

TIPS:
- Var förberedd och punktlig
- Visa entusiasm för rollen
- Ställ egna frågor`,
      jobbTitel: jobbTitel || 'Ej specificerad'
    }
  }
  
  if (endpoint === '/api/ai/ovningshjalp' && method === 'POST') {
    return {
      success: true,
      hjalp: `VÄGLEDNING

Tänk på följande när du svarar på frågan:
- Vad är viktigast för dig i en arbetssituation?
- Vilka situationer har du trivts bäst i?
- Vad får dig att känna dig motiverad?

EXEMPEL:
"I mitt förra jobb kände jag mig mest nöjd när jag fick lösa komplexa problem tillsammans med mitt team..."

FÖLJDFRÅGOR:
1. Vad var det specifikt som gjorde den situationen positiv?
2. Hur kan du hitta liknande situationer i framtida roller?
3. Vilka egenskaper hos dig själv bidrog till framgången?`,
      ovningId: body.ovningId,
      steg: body.steg
    }
  }
  
  if (endpoint === '/api/ai/generera-cv-text' && method === 'POST') {
    const { yrke } = body
    return {
      success: true,
      cvText: `Erfaren och driven ${yrke || 'medarbetare'} med starkt fokus på resultat och samarbete. Brinner för att utvecklas och bidra till framgångsrika team. Har en dokumenterad förmåga att leverera högkvalitativt arbete under press.`,
      yrke: yrke || 'Generell'
    }
  }
  
  if (endpoint === '/api/ai/loneforhandling' && method === 'POST') {
    const { roll } = body
    return {
      success: true,
      radgivning: `LÖNEFÖRHANDLING FÖR ${roll?.toUpperCase() || 'ROLLEN'}

1. LÖNESpANN
För denna roll ligger marknadslönen vanligtvis mellan 35 000 - 50 000 kr/mån beroende på erfarenhet.

2. FÖRBEREDELSE
- Researcha marknadslöner
- Lista dina styrkor och resultat
- Bestäm din minimum-nivå

3. ARGUMENT
- Peka på konkreta resultat
- Lyft fram unika kompetenser
- Nämn marknadsläget

4. FÖRMÅNER ATT FÖRHANDLA OM
- Flextid/distansarbete
- Kompetensutveckling
- Friskvård
- Pension

5. DIALOGEXEMPEL
"Baserat på min erfarenhet och marknadsläget, skulle jag vilja diskutera en lön i spannet X-Y."`,
      roll: roll || 'Ej specificerad'
    }
  }
  
  // Om vi kommer hit har vi ingen match
  console.warn('Mock API: Ohanterad endpoint:', method, endpoint)
  throw new Error(`Endpoint not implemented in mock: ${method} ${endpoint}`)
}

// ===== EXPORTERADE API:ER =====

export const mockAuthApi = {
  login: (email: string, password: string) => mockApiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => mockApiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
}

export const mockCvApi = {
  getCV: () => mockApiRequest('/cv'),
  updateCV: (data: Partial<CVData>) => mockApiRequest('/cv', { method: 'PUT', body: JSON.stringify(data) }),
  getATSAnalysis: () => mockApiRequest('/cv/ats-analysis'),
  getVersions: () => mockApiRequest('/cv/versions'),
  saveVersion: (name: string, data: CVData) => mockApiRequest('/cv/versions', { method: 'POST', body: JSON.stringify({ name, data }) }),
  restoreVersion: (versionId: string) => mockApiRequest(`/cv/versions/${versionId}/restore`, { method: 'POST' }),
  shareCV: () => mockApiRequest('/cv/share', { method: 'POST' }),
  getJobMatches: () => mockApiRequest('/cv/job-matches'),
  analyzeJob: (jobDescription: string) => mockApiRequest('/cv/analyze-job', { method: 'POST', body: JSON.stringify({ jobDescription }) }),
}

export const mockJobsApi = {
  searchJobs: (filters?: JobFilters) => mockApiRequest('/jobs', { method: 'POST', body: JSON.stringify({ filters }) }),
  getJob: (jobId: string) => mockApiRequest(`/jobs/${jobId}`),
  matchCV: (_jobId: string, _cvData: any) => Promise.resolve({ matchPercentage: 75, matchingSkills: ['Kommunikation'], missingSkills: ['Python'] }),
  getApplications: () => mockApiRequest('/job-applications'),
  saveJob: (jobId: string, status: JobApplication['status'], notes?: string) => mockApiRequest('/job-applications', { method: 'POST', body: JSON.stringify({ jobId, status, notes }) }),
  updateApplication: (appId: string, data: Partial<JobApplication>) => mockApiRequest(`/job-applications/${appId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApplication: (appId: string) => mockApiRequest(`/job-applications/${appId}`, { method: 'DELETE' }),
}

export const mockInterestApi = {
  getQuestions: () => mockApiRequest('/interest/questions'),
  getResult: () => mockApiRequest('/interest/result'),
  saveResult: (data: any) => mockApiRequest('/interest/result', { method: 'POST', body: JSON.stringify(data) }),
  getRecommendations: () => mockApiRequest('/interest/recommendations'),
}

export const mockCoverLetterApi = {
  getAll: () => mockApiRequest('/cover-letter'),
  create: (data: any) => mockApiRequest('/cover-letter', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => {
    const index = mockCoverLetters.findIndex(l => l.id === id)
    if (index >= 0) {
      mockCoverLetters[index] = { ...mockCoverLetters[index], ...data, updatedAt: new Date().toISOString() }
    }
    return Promise.resolve(mockCoverLetters[index])
  },
  delete: (id: string) => {
    const index = mockCoverLetters.findIndex(l => l.id === id)
    if (index >= 0) {
      mockCoverLetters.splice(index, 1)
    }
    return Promise.resolve({ success: true })
  },
  generate: (jobAd: string, _styleReference?: string) => {
    const generatedContent = `Hej!

Jag såg er annons om "${jobAd.slice(0, 50)}..." och blev mycket intresserad.

Med min erfarenhet tror jag jag skulle passa perfekt i ert team.

Jag ser fram emot att höra från er!

Med vänliga hälsningar,
Anna Andersson`
    return Promise.resolve({ content: generatedContent, brev: generatedContent, success: true })
  },
}

export const mockArticleApi = {
  getAll: (filters?: { search?: string; category?: string; energyLevel?: string }) =>
    mockApiRequest('/articles', { method: 'POST', body: JSON.stringify({ filters }) }),
  getById: (id: string) => mockApiRequest(`/articles/${id}`),
  getCategories: () => mockApiRequest('/articles/categories'),
}

export const mockUserApi = {
  getMe: () => mockApiRequest('/users/me'),
  updateMe: (data: any) => {
    const user = mockUsers['demo@demo.se']
    Object.assign(user, data)
    return Promise.resolve(user)
  },
}
