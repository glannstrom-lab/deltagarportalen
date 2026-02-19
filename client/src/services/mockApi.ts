// Mock API för demo-läge (när backend inte är tillgänglig)
// Detta gör att portalen fungerar helt utan backend

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
    },
    createdAt: new Date().toISOString(),
  }
}

// Mock CV
const mockCV: any = {
  id: 'demo-cv',
  userId: 'demo-user-id',
  user: {
    firstName: 'Demo',
    lastName: 'Användare',
  },
  title: 'Butiksmedarbetare',
  email: 'demo@demo.se',
  phone: '070-123 45 67',
  location: 'Stockholm',
  summary: 'En driven och engagerad person som söker nya utmaningar. Jag har erfarenhet inom flera områden och älskar att lära mig nya saker.',
  skills: 'Kundservice, Försäljning, Datorvana, Svenska, Engelska',
  workExperience: [
    {
      id: '1',
      title: 'Butiksmedarbetare',
      company: 'ICA Supermarket',
      location: 'Stockholm',
      startDate: '2020-01',
      endDate: '2023-06',
      current: false,
      description: 'Arbetade med kundservice, varuplock och kassa.',
    }
  ],
  education: [
    {
      id: '1',
      degree: 'Gymnasieexamen',
      school: 'Stockholms Gymnasium',
      location: 'Stockholm',
      startDate: '2017-08',
      endDate: '2020-06',
      description: 'Samhällsvetenskaplig inriktning',
    }
  ],
  updatedAt: new Date().toISOString(),
}

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

// Mock API implementation
export const mockApiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  await delay(300) // Simulera nätverksfördröjning
  
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
  
  if (endpoint === '/cv/ats-analysis') {
    return {
      score: 72,
      checks: [
        { name: 'Kontaktinformation', passed: true },
        { name: 'Sammanfattning', passed: true },
        { name: 'Erfarenhet', passed: true },
        { name: 'Utbildning', passed: true },
        { name: 'Nyckelord', passed: false },
        { name: 'Längd', passed: true },
      ],
      suggestions: [
        'Lägg till fler mätbara resultat',
        'Använd fler nyckelord från jobbannonser',
        'Förkorta sammanfattningen',
      ],
      keywords: ['Kundservice', 'Försäljning', 'Datorvana'],
      missingKeywords: ['Erfarenhet', 'Utbildning'],
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
  
  // Default: return empty object
  console.log('Mock API: Unhandled endpoint', endpoint, method)
  return {}
}

// Mock API exports
export const mockAuthApi = {
  login: (email: string, password: string) =>
    mockApiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: any) =>
    mockApiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
}

export const mockCvApi = {
  getCV: () => mockApiRequest('/cv'),
  updateCV: (data: any) => mockApiRequest('/cv', { method: 'PUT', body: JSON.stringify(data) }),
  getATSAnalysis: () => mockApiRequest('/cv/ats-analysis'),
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
    // Generera ett mock personligt brev
    const generatedContent = `Hej!

Jag såg er annons om "${jobAd.slice(0, 50)}..." och blev mycket intresserad.

Med min erfarenhet inom kundservice och min drivkraft att hjälpa människor tror jag jag skulle passa perfekt i ert team.

Jag ser fram emot att höra från er!

Med vänliga hälsningar,
Demo Användare`
    return Promise.resolve({ content: generatedContent })
  },
}

// Mock artiklar
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
}
