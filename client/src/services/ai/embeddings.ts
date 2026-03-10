/**
 * Embeddings Service - Fas 3
 * 
 * Genererar och hanterar vektor-representationer (embeddings) för CV och jobb
 * för semantisk matchning.
 * 
 * NOTE: Denna implementation använder en förenklad "mock"-approach med
 * TF-IDF-liknande vektorer. I produktion bör detta ersättas med:
 * - OpenAI text-embedding-3-small (1536 dim)
 * - Eller lokal model (all-MiniLM-L6-v2)
 */

import { supabase } from '@/lib/supabase'
import type { CVData } from '../supabaseApi'
import type { PlatsbankenJob } from '../arbetsformedlingenApi'

// ============================================
// TYPES
// ============================================

export interface Embedding {
  vector: number[]
  metadata: {
    source: 'cv' | 'job'
    id: string
    generatedAt: string
  }
}

export interface SemanticMatch {
  jobId: string
  job: PlatsbankenJob
  similarity: number // 0-1 (cosine similarity)
  matchedKeywords: string[]
  explanation: string
}

export interface SkillGap {
  skill: string
  importance: 'critical' | 'recommended' | 'optional'
  reason: string
  learningTime?: string // e.g., "2 veckor"
  newJobsIfLearned?: number // Estimated new job matches
}

// ============================================
// SIMPLIFIED EMBEDDING GENERATION (Mock/Tf-Idf-like)
// ============================================

// Vocabulary of important terms in job searching
const VOCABULARY = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'ruby', 'php', 'go', 'rust',
  'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'sql', 'nosql',
  
  // Frontend
  'react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'less', 'webpack',
  'vite', 'nextjs', 'nuxt', 'gatsby', 'tailwind', 'bootstrap', 'mui',
  
  // Backend
  'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'aspnet',
  'fastapi', 'nestjs', 'graphql', 'rest', 'api', 'microservices', 'serverless',
  
  // Databases
  'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firebase',
  'supabase', 'dynamodb', 'cassandra', 'neo4j', 'sqlite',
  
  // DevOps/Cloud
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
  'terraform', 'ansible', 'nginx', 'apache', 'linux', 'ubuntu', 'debian',
  
  // Mobile
  'reactnative', 'flutter', 'ionic', 'android', 'ios', 'xamarin', 'cordova',
  
  // Data/AI
  'machinelearning', 'ai', 'datascience', 'pandas', 'numpy', 'tensorflow',
  'pytorch', 'scikitlearn', 'opencv', 'nlp', 'deeplearning',
  
  // Methods/Processes
  'agil', 'scrum', 'kanban', 'devops', 'cicd', 'tdd', 'bdd', 'ddd', 'lean',
  'safe', 'extremeprogramming', 'pairprogramming', 'codereview',
  
  // Version Control
  'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
  
  // Tools
  'jira', 'confluence', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
  'xd', 'invision', 'miro', 'notion', 'slack', 'teams', 'trello', 'asana',
  
  // Soft Skills
  'kommunikation', 'samarbete', 'ledarskap', 'problemlösning', 'analytisk',
  'kreativ', 'initiativ', 'självständig', 'flexibel', 'strukturerad',
  
  // Healthcare
  'sjuksköterska', 'undersköterska', 'läkare', 'vård', 'omsorg', 'patient',
  'medicin', 'hälsa', 'sjukhus', 'vårdcentral', 'äldreomsorg', 'barn',
  
  // Education
  'lärare', 'pedagog', 'förskola', 'grundskola', 'gymnasium', 'universitet',
  'undervisning', 'barn', 'elever', 'studenter', 'klassrum', 'läroplan',
  
  // Sales/Business
  'säljare', 'försäljning', 'affärer', 'kund', 'kundservice', 'accountmanager',
  'business', 'marknadsföring', 'kommunikation', 'pr', 'reklam', 'varumärke',
  
  // Administration
  'administratör', 'sekreterare', 'kontor', 'ekonomi', 'redovisning', 'bokföring',
  'fakturering', 'arkivering', 'dokumentation', 'kvalitet', 'kontroll',
  
  // Trades/Manual
  'snickare', 'målare', 'elektriker', 'rörmokare', 'mekaniker', 'tekniker',
  'bygg', 'anläggning', 'underhåll', 'reparation', 'installation',
  
  // Transportation
  'chaufför', 'buss', 'lastbil', 'truck', 'transport', 'logistik', 'lager',
  'distribution', 'bud', 'leverans', 'fordon',
  
  // Hospitality
  'servitör', 'kock', 'kök', 'restaurang', 'hotell', 'reception', 'städning',
  'konferens', 'catering', 'barista', 'bar',
  
  // Experience levels
  'junior', 'senior', 'lead', 'principal', 'chef', 'manager', 'director',
  'specialist', 'expert', 'konsult', 'rådgivare'
]

const VOCAB_SIZE = VOCABULARY.length

/**
 * Generera en enkel "embedding" (vektor) från text
 * Detta är en förenklad TF-IDF-liknande approach
 * I produktion: Använd OpenAI eller lokal transformer model
 */
function generateSimpleEmbedding(text: string): number[] {
  const normalizedText = text.toLowerCase()
    .replace(/[^\w\såäöÅÄÖ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  const words = normalizedText.split(' ')
  const wordFreq = new Map<string, number>()
  
  // Count word frequencies
  for (const word of words) {
    if (word.length > 2) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  }
  
  // Create vector based on vocabulary
  const vector = VOCABULARY.map(term => {
    // Check if term appears in text (exact or partial match)
    let score = 0
    
    // Exact match
    if (wordFreq.has(term)) {
      score = wordFreq.get(term)! * 2
    }
    
    // Partial match (e.g., "javascript" matches "javascript-utvecklare")
    for (const [word, freq] of wordFreq) {
      if (word.includes(term) || term.includes(word)) {
        score = Math.max(score, freq)
      }
    }
    
    // Normalize by text length to avoid bias towards longer texts
    return score / Math.sqrt(words.length + 1)
  })
  
  // L2 normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    return vector.map(val => val / magnitude)
  }
  
  return vector
}

/**
 * Beräkna cosine similarity mellan två vektorer
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  if (normA === 0 || normB === 0) return 0
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// ============================================
// CV EMBEDDINGS
// ============================================

/**
 * Generera embedding för CV
 */
export function generateCVEmbedding(cv: CVData): Embedding {
  // Combine all CV text
  const cvText = [
    cv.title,
    cv.summary,
    ...(cv.skills || []),
    ...(cv.work_experience || []).map(e => `${e.title} ${e.description} ${e.company}`).join(' '),
    ...(cv.education || []).map(e => `${e.degree} ${e.school}`).join(' ')
  ].filter(Boolean).join(' ')
  
  return {
    vector: generateSimpleEmbedding(cvText),
    metadata: {
      source: 'cv',
      id: cv.id || 'current',
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Spara CV embedding till databas (för caching)
 */
export async function saveCVEmbedding(cvId: string, embedding: Embedding): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await supabase
      .from('cv_embeddings')
      .upsert({
        user_id: user.id,
        embedding: embedding.vector,
        generated_at: embedding.metadata.generatedAt
      }, {
        onConflict: 'user_id'
      })
  } catch (error) {
    console.error('Fel vid sparande av CV embedding:', error)
  }
}

/**
 * Hämta sparad CV embedding
 */
export async function getCVEmbedding(): Promise<Embedding | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data } = await supabase
      .from('cv_embeddings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (!data) return null
    
    return {
      vector: data.embedding,
      metadata: {
        source: 'cv',
        id: user.id,
        generatedAt: data.generated_at
      }
    }
  } catch (error) {
    console.error('Fel vid hämtning av CV embedding:', error)
    return null
  }
}

// ============================================
// JOB EMBEDDINGS
// ============================================

/**
 * Generera embedding för jobb
 */
export function generateJobEmbedding(job: PlatsbankenJob): Embedding {
  const jobText = [
    job.headline,
    job.description?.text,
    job.employer?.name,
    job.occupation?.label,
    job.employment_type?.label
  ].filter(Boolean).join(' ')
  
  return {
    vector: generateSimpleEmbedding(jobText),
    metadata: {
      source: 'job',
      id: job.id,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Spara jobb embedding (för caching i localStorage)
 */
export function saveJobEmbedding(jobId: string, embedding: Embedding): void {
  try {
    const cache = JSON.parse(localStorage.getItem('job_embeddings_cache') || '{}')
    cache[jobId] = {
      vector: embedding.vector,
      generatedAt: embedding.metadata.generatedAt
    }
    localStorage.setItem('job_embeddings_cache', JSON.stringify(cache))
  } catch {
    // Ignore errors
  }
}

/**
 * Hämta cachad jobb embedding
 */
export function getCachedJobEmbedding(jobId: string): Embedding | null {
  try {
    const cache = JSON.parse(localStorage.getItem('job_embeddings_cache') || '{}')
    const cached = cache[jobId]
    
    if (!cached) return null
    
    // Check if cache is fresh (< 7 days)
    const age = Date.now() - new Date(cached.generatedAt).getTime()
    if (age > 7 * 24 * 60 * 60 * 1000) return null
    
    return {
      vector: cached.vector,
      metadata: {
        source: 'job',
        id: jobId,
        generatedAt: cached.generatedAt
      }
    }
  } catch {
    return null
  }
}

// ============================================
// SEMANTIC MATCHING
// ============================================

/**
 * Hitta semantiskt liknande jobb
 */
export function findSemanticMatches(
  cv: CVData,
  jobs: PlatsbankenJob[],
  threshold: number = 0.3
): SemanticMatch[] {
  const cvEmbedding = generateCVEmbedding(cv)
  
  const matches: SemanticMatch[] = []
  
  for (const job of jobs) {
    // Try cache first
    let jobEmbedding = getCachedJobEmbedding(job.id)
    
    if (!jobEmbedding) {
      jobEmbedding = generateJobEmbedding(job)
      saveJobEmbedding(job.id, jobEmbedding)
    }
    
    const similarity = cosineSimilarity(cvEmbedding.vector, jobEmbedding.vector)
    
    if (similarity >= threshold) {
      // Find matched keywords for explanation
      const matchedKeywords = findMatchedKeywords(cv, job)
      
      matches.push({
        jobId: job.id,
        job,
        similarity,
        matchedKeywords,
        explanation: generateMatchExplanation(similarity, matchedKeywords, job)
      })
    }
  }
  
  // Sort by similarity
  return matches.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Hitta vilka keywords som matchade
 */
function findMatchedKeywords(cv: CVData, job: PlatsbankenJob): string[] {
  const matched: string[] = []
  
  const cvText = [
    cv.title,
    cv.summary,
    ...(cv.skills || [])
  ].filter(Boolean).join(' ').toLowerCase()
  
  const jobText = [
    job.headline,
    job.description?.text
  ].filter(Boolean).join(' ').toLowerCase()
  
  for (const term of VOCABULARY) {
    if (cvText.includes(term) && jobText.includes(term)) {
      matched.push(term)
    }
  }
  
  return matched.slice(0, 5) // Top 5
}

/**
 * Generera förklaring för matchning
 */
function generateMatchExplanation(
  similarity: number,
  matchedKeywords: string[],
  job: PlatsbankenJob
): string {
  if (similarity > 0.7) {
    return `Utmärkt match! Dina kompetenser passar perfekt för ${job.employer?.name || 'detta företag'}.`
  } else if (similarity > 0.5) {
    return `God match. ${matchedKeywords.slice(0, 2).join(' och ')} är direkt relevanta.`
  } else {
    return `Intressant möjlighet med viss kompetensöverlappning.`
  }
}

// ============================================
// EXPLORE SIMILAR ROLES
// ============================================

export interface SimilarRole {
  role: string
  similarity: number
  requiredSkills: string[]
  transferableSkills: string[]
  reason: string
}

/**
 * Hitta närliggande roller baserat på nuvarande CV
 */
export function exploreSimilarRoles(cv: CVData): SimilarRole[] {
  const skills = (cv.skills || []).map(s => s.toLowerCase())
  
  const roleMappings: SimilarRole[] = [
    {
      role: 'Frontend-utvecklare',
      similarity: 0,
      requiredSkills: ['javascript', 'react', 'vue', 'angular', 'html', 'css'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'Backend-utvecklare',
      similarity: 0,
      requiredSkills: ['java', 'python', 'nodejs', 'sql', 'api'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'Fullstack-utvecklare',
      similarity: 0,
      requiredSkills: ['javascript', 'react', 'nodejs', 'sql', 'api'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'DevOps-ingenjör',
      similarity: 0,
      requiredSkills: ['docker', 'kubernetes', 'aws', 'cicd', 'linux'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'Tech Lead',
      similarity: 0,
      requiredSkills: ['arkitektur', 'ledarskap', 'mentorskap', 'code review'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'UX/UI-designer',
      similarity: 0,
      requiredSkills: ['figma', 'sketch', 'adobe', 'användbarhet', 'design'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'Produktägare',
      similarity: 0,
      requiredSkills: ['agil', 'scrum', 'kravanalys', 'stakeholder'],
      transferableSkills: [],
      reason: ''
    },
    {
      role: 'Data Analyst',
      similarity: 0,
      requiredSkills: ['sql', 'python', 'excel', 'visualisering', 'statistik'],
      transferableSkills: [],
      reason: ''
    }
  ]
  
  // Calculate similarity for each role
  for (const role of roleMappings) {
    const matchingSkills = role.requiredSkills.filter(reqSkill =>
      skills.some(cvSkill => 
        cvSkill.includes(reqSkill) || reqSkill.includes(cvSkill)
      )
    )
    
    role.similarity = matchingSkills.length / role.requiredSkills.length
    role.transferableSkills = matchingSkills
    
    if (role.similarity > 0.5) {
      role.reason = `Du har redan ${matchingSkills.length} av ${role.requiredSkills.length} viktiga kompetenser`
    } else if (role.similarity > 0.2) {
      role.reason = 'Viss kompetensöverlappning - skulle kunna vara en intressant övergång'
    } else {
      role.reason = 'Ny riktning som skulle kräva kompetensutveckling'
    }
  }
  
  return roleMappings
    .filter(r => r.similarity > 0.2)
    .sort((a, b) => b.similarity - a.similarity)
}

// ============================================
// SKILL GAP ANALYSIS
// ============================================

/**
 * Analysera vilka skills som skulle ge fler jobbmatchningar
 */
export function analyzeSkillGaps(
  cv: CVData,
  allJobs: PlatsbankenJob[]
): SkillGap[] {
  const currentSkills = new Set((cv.skills || []).map(s => s.toLowerCase()))
  
  // Count how many jobs require each skill
  const skillJobCount = new Map<string, number>()
  
  for (const job of allJobs) {
    const jobText = `${job.headline} ${job.description?.text || ''}`.toLowerCase()
    
    for (const term of VOCABULARY) {
      if (jobText.includes(term)) {
        skillJobCount.set(term, (skillJobCount.get(term) || 0) + 1)
      }
    }
  }
  
  // Find high-impact skills not in CV
  const gaps: SkillGap[] = []
  
  const skillLearningEstimates: Record<string, { time: string; newJobs: number }> = {
    'typescript': { time: '2-4 veckor', newJobs: 15 },
    'docker': { time: '2-3 veckor', newJobs: 12 },
    'aws': { time: '4-8 veckor', newJobs: 18 },
    'kubernetes': { time: '6-10 veckor', newJobs: 14 },
    'react': { time: '3-6 veckor', newJobs: 20 },
    'python': { time: '4-8 veckor', newJobs: 16 },
    'sql': { time: '2-3 veckor', newJobs: 14 },
    'git': { time: '1-2 veckor', newJobs: 10 },
    'agil': { time: '1-2 veckor', newJobs: 8 },
    'scrum': { time: '1-2 veckor', newJobs: 8 }
  }
  
  for (const [skill, jobCount] of skillJobCount) {
    if (!currentSkills.has(skill) && jobCount >= 3) {
      const estimate = skillLearningEstimates[skill]
      
      gaps.push({
        skill,
        importance: jobCount > 10 ? 'critical' : jobCount > 5 ? 'recommended' : 'optional',
        reason: `${jobCount} jobbannonser nämner denna kompetens`,
        learningTime: estimate?.time,
        newJobsIfLearned: estimate?.newJobs
      })
    }
  }
  
  return gaps
    .sort((a, b) => (b.newJobsIfLearned || 0) - (a.newJobsIfLearned || 0))
    .slice(0, 5)
}

// ============================================
// API
// ============================================

export const embeddingsApi = {
  generateCVEmbedding,
  saveCVEmbedding,
  getCVEmbedding,
  generateJobEmbedding,
  findSemanticMatches,
  exploreSimilarRoles,
  analyzeSkillGaps,
  cosineSimilarity
}
