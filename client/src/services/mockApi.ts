// Mock API för demo-läge (när backend inte är tillgänglig)
// Detta gör att portalen fungerar helt utan backend

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
  phone?: string
  email?: string
}

export interface Skill {
  id: string
  name: string
  level?: 1 | 2 | 3 | 4 | 5
  category?: 'technical' | 'soft' | 'language' | 'tool'
}

export interface CVVersion {
  id: string
  name: string
  data: CVData
  createdAt: string
}

export interface CVData {
  id?: string
  userId?: string
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  location: string
  summary: string
  skills: Skill[]
  workExperience: WorkExperience[]
  education: Education[]
  languages: Language[]
  certificates: Certificate[]
  links: Link[]
  references: Reference[]
  // Settings
  template: string
  colorScheme: string
  font: string
  // Versioning
  version?: number
  updatedAt?: string
}

export interface JobMatch {
  id: string
  title: string
  company: string
  location: string
  matchPercentage: number
  missingKeywords: string[]
  description: string
}

// ===== MOCK DATA =====

// Mock användare
const mockUsers: Record<string, any> = {
  'demo@demo.se': {
    id: 'demo-user-id',
    email: 'demo@demo.se',
    firstName: 'Demo',
    lastName: 'Användare',
    role: 'USER',
    phone: '070-123 45 67',
    bio: 'En driven och engagerad person som söker nya utmaningar.',
    preferences: {
      notifications: true,
      newsletter: false,
      calmMode: false,
      theme: 'light',
      fontSize: 'medium',
    },
    createdAt: new Date().toISOString(),
  }
}

// Mock CV med alla nya fält
const mockCV: CVData = {
  id: 'demo-cv',
  userId: 'demo-user-id',
  firstName: 'Demo',
  lastName: 'Användare',
  title: 'Butiksmedarbetare',
  email: 'demo@demo.se',
  phone: '070-123 45 67',
  location: 'Stockholm',
  summary: 'En driven och engagerad person som söker nya utmaningar. Jag har erfarenhet inom flera områden och älskar att lära mig nya saker.',
  skills: [
    { id: '1', name: 'Kundservice', level: 5, category: 'soft' },
    { id: '2', name: 'Försäljning', level: 4, category: 'soft' },
    { id: '3', name: 'Datorvana', level: 3, category: 'technical' },
    { id: '4', name: 'Svenska', level: 5, category: 'language' },
    { id: '5', name: 'Engelska', level: 4, category: 'language' },
  ],
  workExperience: [
    {
      id: '1',
      title: 'Butiksmedarbetare',
      company: 'ICA Supermarket',
      location: 'Stockholm',
      startDate: '2020-01',
      endDate: '2023-06',
      current: false,
      description: 'Arbetade med kundservice, varuplock och kassa. Hanterade dagligen över 100 kunder.',
    },
    {
      id: '2',
      title: 'Kassör',
      company: 'Willys',
      location: 'Stockholm',
      startDate: '2018-06',
      endDate: '2019-12',
      current: false,
      description: 'Ansvarade för kassa och kundservice. Utbildade nya medarbetare.',
    }
  ],
  education: [
    {
      id: '1',
      degree: 'Gymnasieexamen',
      school: 'Stockholms Gymnasium',
      field: 'Samhällsvetenskap',
      location: 'Stockholm',
      startDate: '2017-08',
      endDate: '2020-06',
      description: 'Samhällsvetenskaplig inriktning med fokus på ekonomi.',
    }
  ],
  languages: [
    { id: '1', language: 'Svenska', level: 'Modersmål' },
    { id: '2', language: 'Engelska', level: 'Flytande' },
    { id: '3', language: 'Spanska', level: 'Grundläggande' },
  ],
  certificates: [
    { id: '1', name: 'Körkort B', issuer: 'Transportstyrelsen', date: '2018-05' },
    { id: '2', name: 'Hygienutbildning', issuer: 'Livsmedelsverket', date: '2020-01' },
  ],
  links: [
    { id: '1', type: 'linkedin', url: 'https://linkedin.com/in/demo' },
  ],
  references: [
    { id: '1', name: 'Anna Svensson', title: 'Butikschef', company: 'ICA Supermarket', phone: '070-987 65 43' },
  ],
  template: 'modern',
  colorScheme: 'indigo',
  font: 'Inter',
  version: 1,
  updatedAt: new Date().toISOString(),
}

// CV-historik (versionshantering)
const mockCVHistory: CVVersion[] = [
  {
    id: 'v1',
    name: 'Original',
    data: { ...mockCV, version: 1 },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'v2',
    name: 'Uppdaterad erfarenhet',
    data: { ...mockCV, version: 2 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Mock jobbmatchningar
const mockJobMatches: JobMatch[] = [
  {
    id: 'job1',
    title: 'Butikssäljare',
    company: 'Hemköp',
    location: 'Stockholm',
    matchPercentage: 92,
    missingKeywords: ['Visma', 'Kassasystem'],
    description: 'Vi söker en engagerad butikssäljare med erfarenhet av kundservice.',
  },
  {
    id: 'job2',
    title: 'Kundtjänstmedarbetare',
    company: 'Tele2',
    location: 'Stockholm',
    matchPercentage: 78,
    missingKeywords: ['CRM', 'Teknisk support'],
    description: 'Hjälp våra kunder via telefon och mejl.',
  },
  {
    id: 'job3',
    title: 'Receptionist',
    company: 'Scandic Hotels',
    location: 'Stockholm',
    matchPercentage: 65,
    missingKeywords: ['Hotellsystem', 'Bokningar'],
    description: 'Välkomna gäster och hantera incheckningar.',
  },
]

// Mock intresseguide-resultat
const mockInterestResult: any = {
  id: 'demo-result',
  userId: 'demo-user-id',
  riasec: {
    realistic: 65,
    investigative: 45,
    artistic: 70,
    social: 85,
    enterprising: 60,
    conventional: 50,
  },
  bigFive: {
    openness: 75,
    conscientiousness: 70,
    extraversion: 65,
    agreeableness: 80,
    neuroticism: 40,
  },
  recommendations: [
    { occupation: 'Sjuksköterska', match: 92 },
    { occupation: 'Lärare', match: 88 },
    { occupation: 'Socialsekreterare', match: 85 },
    { occupation: 'Kundtjänstmedarbetare', match: 78 },
  ],
  createdAt: new Date().toISOString(),
}

// Mock personliga brev
const mockCoverLetters: any[] = [
  {
    id: 'demo-letter-1',
    userId: 'demo-user-id',
    title: 'Butiksmedarbetare på Hemköp',
    content: 'Hej!\n\nJag söker tjänsten som butiksmedarbetare hos er...',
    createdAt: new Date().toISOString(),
  }
]

// ===== API IMPLEMENTATION =====

export const mockApiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  await delay(300)
  
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body as string) : null
  
  // Auth endpoints
  if (endpoint === '/auth/login') {
    const { email, password: _password } = body
    if (email === 'demo@demo.se' && _password === 'demo') {
      return {
        token: 'demo-token-' + Date.now(),
        user: mockUsers['demo@demo.se']
      }
    }
    throw new Error('Felaktig e-post eller lösenord')
  }
  
  if (endpoint === '/auth/register') {
    const { email, firstName, lastName } = body
    if (mockUsers[email]) {
      throw new Error('En användare med denna e-post finns redan')
    }
    const newUser = {
      id: 'user-' + Date.now(),
      email,
      firstName,
      lastName,
      role: 'USER',
      preferences: {
        notifications: true,
        newsletter: false,
        calmMode: false,
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
    }
    mockUsers[email] = newUser
    return {
      token: 'demo-token-' + Date.now(),
      user: newUser
    }
  }
  
  // CV endpoints
  if (endpoint === '/cv' && method === 'GET') {
    return mockCV
  }
  
  if (endpoint === '/cv' && method === 'PUT') {
    Object.assign(mockCV, body)
    mockCV.updatedAt = new Date().toISOString()
    return mockCV
  }

  // CV Versions/Historik
  if (endpoint === '/cv/versions' && method === 'GET') {
    return mockCVHistory
  }

  if (endpoint === '/cv/versions' && method === 'POST') {
    const newVersion: CVVersion = {
      id: 'v' + Date.now(),
      name: body.name || 'Version ' + (mockCVHistory.length + 1),
      data: { ...mockCV, ...body.data },
      createdAt: new Date().toISOString(),
    }
    mockCVHistory.unshift(newVersion)
    return newVersion
  }

  if (endpoint.match(/^\/cv\/versions\/[^/]+\/restore$/)) {
    const versionId = endpoint.split('/')[3]
    const version = mockCVHistory.find(v => v.id === versionId)
    if (version) {
      Object.assign(mockCV, version.data)
      mockCV.updatedAt = new Date().toISOString()
      return mockCV
    }
    throw new Error('Version hittades inte')
  }
  
  // CV Sharing
  if (endpoint === '/cv/share' && method === 'POST') {
    return {
      shareUrl: 'https://deltagarportalen.se/cv/share/demo-cv-' + Date.now(),
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  // Jobbmatchning
  if (endpoint === '/cv/job-matches') {
    return mockJobMatches
  }

  // Jobbannons-analys
  if (endpoint === '/cv/analyze-job' && method === 'POST') {
    const { jobDescription } = body
    // Simulera AI-analys
    const keywords = ['Kundservice', 'Försäljning', 'Teamwork', 'Kommunikation']
    const found = keywords.filter(k => jobDescription.toLowerCase().includes(k.toLowerCase()))
    const missing = keywords.filter(k => !jobDescription.toLowerCase().includes(k.toLowerCase()))
    
    return {
      matchPercentage: Math.round((found.length / keywords.length) * 100),
      foundKeywords: found,
      missingKeywords: missing,
      suggestions: [
        'Lägg till "Teamwork" i dina färdigheter',
        'Beskriv ett exempel på när du arbetat i team',
      ],
    }
  }
  
  // ATS Analysis - förbättrad
  if (endpoint === '/cv/ats-analysis') {
    const skills = mockCV.skills || []
    const hasQuantifiable = mockCV.workExperience.some((w: WorkExperience) => 
      /\d+%|\d+\s+(å|mån|år|månader)|ökade|minskade|förbättrade/.test(w.description)
    )
    
    return {
      score: 72,
      readability: {
        score: 75,
        level: 'Medel',
        wordCount: mockCV.summary?.split(' ').length || 0,
      },
      checks: [
        { name: 'Kontaktinformation', passed: !!mockCV.email && !!mockCV.phone, description: 'E-post och telefon finns' },
        { name: 'Sammanfattning', passed: mockCV.summary?.length > 50, description: 'Minst 50 tecken' },
        { name: 'Erfarenhet', passed: mockCV.workExperience.length > 0, description: 'Minst en anställning' },
        { name: 'Utbildning', passed: mockCV.education.length > 0, description: 'Minst en utbildning' },
        { name: 'Mätbara resultat', passed: hasQuantifiable, description: 'Använder siffror och procent' },
        { name: 'Färdigheter', passed: skills.length >= 3, description: 'Minst 3 färdigheter' },
        { name: 'Längd', passed: true, description: 'CV-längd är lämplig' },
      ],
      suggestions: [
        'Lägg till fler mätbara resultat med siffror',
        'Använd fler nyckelord från jobbannonser',
        'Lägg till färdighetsnivåer för bättre överblick',
        'Överväg att lägga till språkkunskaper',
      ],
      keywords: skills.map((s: Skill) => s.name),
      missingKeywords: ['Teamwork', ' problemlösning'],
    }
  }
  
  // Interest guide endpoints
  if (endpoint === '/interest/questions') {
    return [
      { id: 'r1', category: 'realistic', text: 'Jag gillar att arbeta praktiskt med händerna' },
      { id: 's1', category: 'social', text: 'Jag tycker om att hjälpa andra människor' },
      { id: 'a1', category: 'artistic', text: 'Jag är kreativ och gillar att skapa' },
    ]
  }
  
  if (endpoint === '/interest/result' && method === 'GET') {
    return mockInterestResult
  }
  
  if (endpoint === '/interest/result' && method === 'POST') {
    Object.assign(mockInterestResult, body)
    return mockInterestResult
  }
  
  if (endpoint === '/interest/recommendations') {
    return mockInterestResult.recommendations
  }
  
  // Cover letter endpoints
  if (endpoint === '/cover-letter' && method === 'GET') {
    return mockCoverLetters
  }
  
  if (endpoint === '/cover-letter' && method === 'POST') {
    const newLetter = {
      id: 'letter-' + Date.now(),
      userId: 'demo-user-id',
      ...body,
      createdAt: new Date().toISOString(),
    }
    mockCoverLetters.push(newLetter)
    return newLetter
  }
  
  // Articles endpoints
  if (endpoint === '/articles') {
    return [
      { id: '1', title: 'Så skriver du ett CV', category: 'CV', readTime: 5 },
      { id: '2', title: 'Förbered dig för intervjun', category: 'Intervju', readTime: 8 },
      { id: '3', title: 'Nätverkstips', category: 'Nätverkande', readTime: 6 },
    ]
  }
  
  if (endpoint.match(/^\/articles\/\w+$/)) {
    const id = endpoint.split('/')[2]
    return {
      id,
      title: 'Artikel ' + id,
      content: 'Detta är innehållet i artikeln...',
      category: 'Tips',
      readTime: 5,
    }
  }
  
  // User endpoints
  if (endpoint === '/users/me') {
    return mockUsers['demo@demo.se']
  }
  
  // Default
  console.log('Mock API: Unhandled endpoint', endpoint, method)
  return {}
}

// ===== API EXPORTS =====

export const mockAuthApi = {
  login: (email: string, password: string) =>
    mockApiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: any) =>
    mockApiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
}

export const mockCvApi = {
  getCV: () => mockApiRequest('/cv'),
  updateCV: (data: Partial<CVData>) => mockApiRequest('/cv', { method: 'PUT', body: JSON.stringify(data) }),
  getATSAnalysis: () => mockApiRequest('/cv/ats-analysis'),
  // Versions
  getVersions: () => mockApiRequest('/cv/versions'),
  saveVersion: (name: string, data: CVData) => 
    mockApiRequest('/cv/versions', { method: 'POST', body: JSON.stringify({ name, data }) }),
  restoreVersion: (versionId: string) => 
    mockApiRequest(`/cv/versions/${versionId}/restore`, { method: 'POST' }),
  // Sharing
  shareCV: () => mockApiRequest('/cv/share', { method: 'POST' }),
  // Job matching
  getJobMatches: () => mockApiRequest('/cv/job-matches'),
  analyzeJob: (jobDescription: string) => 
    mockApiRequest('/cv/analyze-job', { method: 'POST', body: JSON.stringify({ jobDescription }) }),
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
  generate: (jobAd: string, _styleReference?: string) => {
    const generatedContent = `Hej!

Jag såg er annons om "${jobAd.slice(0, 50)}..." och blev mycket intresserad.

Med min erfarenhet inom kundservice och min drivkraft att hjälpa människor tror jag jag skulle passa perfekt i ert team.

Jag ser fram emot att höra från er!

Med vänliga hälsningar,
Demo Användare`
    return Promise.resolve({ content: generatedContent })
  },
}

const mockArticles = [
  { id: '1', title: 'Så skriver du ett CV', category: 'CV', readTime: 5 },
  { id: '2', title: 'Förbered dig för intervjun', category: 'Intervju', readTime: 8 },
  { id: '3', title: 'Nätverkstips', category: 'Nätverkande', readTime: 6 },
  { id: '4', title: 'LinkedIn-guide', category: 'CV', readTime: 7 },
  { id: '5', title: 'Vanliga intervjufrågor', category: 'Intervju', readTime: 4 },
]

export const mockArticleApi = {
  getAll: (filters?: { search?: string; category?: string }) => {
    let result = [...mockArticles]
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(a => a.title.toLowerCase().includes(search))
    }
    if (filters?.category) {
      result = result.filter(a => a.category === filters.category)
    }
    return Promise.resolve(result)
  },
  getById: (id: string) => mockApiRequest(`/articles/${id}`),
  getCategories: () => Promise.resolve(['CV', 'Intervju', 'Nätverkande', 'Karriär']),
}

export const mockUserApi = {
  getMe: () => mockApiRequest('/users/me'),
  updateMe: (data: any) => {
    const user = mockUsers['demo@demo.se']
    Object.assign(user, data)
    return Promise.resolve(user)
  },
  updatePreferences: (preferences: any) => {
    const user = mockUsers['demo@demo.se']
    user.preferences = { ...user.preferences, ...preferences }
    return Promise.resolve(user)
  },
}

// Types are already exported above
