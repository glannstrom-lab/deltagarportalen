/**
 * MatchesTab - Job Matching with Three Independent Sources
 *
 * Each source (CV, Interest, Career) searches and matches jobs independently.
 * No combination or weighting - each source gives its own results.
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Target, CheckCircle, AlertCircle, FileText,
  Briefcase, MapPin, Heart, ExternalLink, ChevronDown,
  Loader2, RefreshCw, TrendingUp, Award, Compass,
  Settings2, X, Car, Clock, Building2
} from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import { searchJobs, type PlatsbankenJob, SWEDISH_MUNICIPALITIES } from '@/services/arbetsformedlingenApi'
import { cvApi, userApi, type ProfilePreferences } from '@/services/supabaseApi'
import { interestGuideApi } from '@/services/cloudStorage'
import { calculateUserProfile, calculateJobMatches } from '@/services/interestGuideData'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

// ============================================
// TYPES
// ============================================

type MatchSource = 'cv' | 'interest' | 'career'

interface MatchedJob {
  job: PlatsbankenJob
  score: number
  source: MatchSource
  matchDetails: string[]
}

interface SourceData {
  cv: {
    available: boolean
    skills: string[]
    workTitles: string[]
    education: string[]
  }
  interest: {
    available: boolean
    occupations: Array<{ name: string; matchPercentage: number }>
  }
  career: {
    available: boolean
    preferredRoles: string[]
    desiredJobs: string[]  // From focus mode / profile
    keywords: string[]
  }
  // Profile preferences for filtering and boosting
  preferences: {
    employmentTypes: string[]  // 'fulltime', 'parttime', etc.
    remoteWork: 'yes' | 'no' | 'hybrid' | null
    driversLicense: string[]  // ['B', 'C', etc.]
    hasCar: boolean
    maxCommuteMinutes: number | null
    industries: string[]
  }
}

// ============================================
// SKILL & JOB TITLE SYNONYMS
// ============================================

const SKILL_SYNONYMS: Record<string, string[]> = {
  // Programming languages
  'javascript': ['js', 'ecmascript', 'node', 'nodejs', 'node.js'],
  'typescript': ['ts'],
  'python': ['py', 'django', 'flask', 'pandas'],
  'java': ['jvm', 'spring', 'spring boot', 'jakarta'],
  'c#': ['csharp', 'c-sharp', '.net', 'dotnet', 'asp.net'],
  'c++': ['cpp', 'c plus plus'],
  'php': ['laravel', 'symfony', 'wordpress'],
  'ruby': ['rails', 'ruby on rails'],
  'go': ['golang'],
  'rust': ['rustlang'],
  'swift': ['ios', 'xcode'],
  'kotlin': ['android'],

  // Frontend
  'react': ['react.js', 'reactjs', 'react native', 'redux'],
  'vue': ['vue.js', 'vuejs', 'nuxt'],
  'angular': ['angularjs', 'angular.js'],
  'html': ['html5', 'markup'],
  'css': ['css3', 'sass', 'scss', 'less', 'tailwind', 'bootstrap'],
  'frontend': ['front-end', 'front end', 'ui', 'användargränssnitt'],
  'backend': ['back-end', 'back end', 'server-side', 'serversidan'],
  'fullstack': ['full-stack', 'full stack'],

  // Databases
  'sql': ['mysql', 'postgresql', 'postgres', 'mssql', 'oracle', 'mariadb', 'sqlite'],
  'nosql': ['mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb'],
  'databas': ['database', 'db', 'datalagring'],

  // DevOps & Cloud
  'devops': ['ci/cd', 'continuous integration', 'deployment'],
  'docker': ['container', 'kubernetes', 'k8s'],
  'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
  'azure': ['microsoft azure', 'azure devops'],
  'gcp': ['google cloud', 'google cloud platform'],
  'linux': ['unix', 'ubuntu', 'debian', 'centos'],

  // Office & General IT
  'excel': ['spreadsheet', 'kalkylark', 'kalkylblad', 'vba'],
  'word': ['ordbehandling', 'dokument'],
  'powerpoint': ['presentation', 'presentationer'],
  'office': ['microsoft office', 'ms office', 'office 365', 'm365'],
  'it': ['informationsteknik', 'data', 'system', 'teknik'],
  'support': ['helpdesk', 'servicedesk', 'kundsupport', 'teknisk support'],

  // Project & Management
  'projektledning': ['projektledare', 'project management', 'pm', 'projektkoordinator'],
  'scrum': ['agile', 'agil', 'sprint', 'kanban', 'scrum master'],
  'ledarskap': ['chef', 'ledare', 'teamlead', 'team lead', 'teamledare', 'manager'],
  'strategi': ['strategisk', 'affärsutveckling', 'business development'],

  // Communication & Sales
  'kommunikation': ['kommunikativ', 'kundkontakt', 'kundbemötande', 'pr'],
  'försäljning': ['säljare', 'sales', 'sälj', 'account manager', 'kundansvarig'],
  'marknadsföring': ['marketing', 'digital marknadsföring', 'content', 'seo', 'sem'],
  'kundservice': ['kundtjänst', 'customer service', 'kundsupport'],

  // Finance & Admin
  'ekonomi': ['redovisning', 'bokföring', 'accounting', 'finans', 'finance'],
  'administration': ['admin', 'administratör', 'kontorsarbete', 'reception'],
  'hr': ['personal', 'rekrytering', 'human resources', 'personalansvarig'],
  'juridik': ['jurist', 'legal', 'avtal', 'kontrakt'],

  // Healthcare & Social
  'vård': ['omsorg', 'sjukvård', 'hälsa', 'healthcare', 'omvårdnad'],
  'undersköterska': ['usk', 'vårdbiträde', 'äldreomsorg'],
  'sjuksköterska': ['ssk', 'nurse', 'nursing'],
  'läkare': ['doctor', 'physician', 'medicine'],
  'psykologi': ['psykolog', 'terapi', 'terapeut', 'counseling'],
  'socialt arbete': ['socionom', 'social worker', 'biståndshandläggare'],

  // Education
  'pedagogik': ['undervisning', 'lärare', 'utbildning', 'education', 'teacher'],
  'förskola': ['förskollärare', 'barnskötare', 'dagis'],
  'grundskola': ['mellanstadie', 'lågstadie', 'högstadie'],

  // Construction & Industry
  'bygg': ['byggnad', 'construction', 'byggnadsarbete', 'snickare'],
  'el': ['elektriker', 'elektricitet', 'elinstallation'],
  'vvs': ['rörmokare', 'plumber', 'ventilation'],
  'industri': ['produktion', 'tillverkning', 'manufacturing', 'fabrik'],
  'lager': ['logistik', 'warehouse', 'lagerpersonal', 'godshantering'],
  'transport': ['chaufför', 'driver', 'lastbil', 'truck', 'leverans'],

  // Licenses & Certificates
  'körkort': ['b-körkort', 'c-körkort', 'ce-körkort', 'driving license', 'förare'],
  'truckkort': ['truck', 'forklift', 'gaffeltruck'],
  'certifikat': ['certificate', 'behörighet', 'licens'],

  // Languages
  'engelska': ['english', 'eng'],
  'svenska': ['swedish', 'swe'],
  'tyska': ['german', 'deutsch'],
  'franska': ['french', 'français'],
  'spanska': ['spanish', 'español'],
}

const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
  'systemutvecklare': ['developer', 'utvecklare', 'programmerare', 'software engineer', 'mjukvaruutvecklare'],
  'webbutvecklare': ['web developer', 'frontendutvecklare', 'backendutvecklare', 'fullstackutvecklare'],
  'projektledare': ['project manager', 'pm', 'projektkoordinator', 'project lead'],
  'produktägare': ['product owner', 'po', 'produktchef', 'product manager'],
  'säljare': ['sales', 'försäljare', 'account manager', 'säljansvarig', 'key account'],
  'ekonom': ['accountant', 'redovisningsekonom', 'controller', 'finansanalytiker'],
  'administratör': ['admin', 'kontorsassistent', 'sekreterare', 'koordinator'],
  'receptionist': ['reception', 'front desk', 'kundmottagare'],
  'chef': ['manager', 'ledare', 'ansvarig', 'head of', 'director'],
  'konsult': ['consultant', 'rådgivare', 'specialist', 'expert'],
  'tekniker': ['technician', 'servicetekniker', 'drifttekniker'],
  'ingenjör': ['engineer', 'civilingenjör', 'högskoleingenjör'],
  'lärare': ['teacher', 'pedagog', 'utbildare', 'instructor'],
  'sjuksköterska': ['nurse', 'ssk', 'vårdpersonal'],
  'undersköterska': ['usk', 'vårdbiträde', 'omsorgspersonal'],
  'kock': ['chef', 'cook', 'köksbiträde', 'köksansvarig'],
  'städare': ['cleaner', 'lokalvårdare', 'städpersonal'],
  'chaufför': ['driver', 'förare', 'lastbilschaufför', 'budbilsförare'],
}

const SENIORITY_LEVELS = {
  junior: ['junior', 'entry', 'trainee', 'praktikant', 'nybörjar', 'graduate'],
  mid: ['mid', 'mellan', 'erfaren', 'experienced'],
  senior: ['senior', 'sr', 'lead', 'principal', 'expert', 'specialist'],
  manager: ['manager', 'chef', 'head', 'director', 'ansvarig', 'ledare']
}

const INDUSTRIES: Record<string, string[]> = {
  'tech': ['it', 'software', 'tech', 'digital', 'data', 'ai', 'startup'],
  'finance': ['bank', 'finans', 'försäkring', 'insurance', 'ekonomi', 'revision'],
  'healthcare': ['vård', 'hälsa', 'sjukvård', 'medicin', 'apotek', 'omsorg'],
  'retail': ['butik', 'retail', 'handel', 'e-handel', 'detaljhandel'],
  'manufacturing': ['industri', 'tillverkning', 'produktion', 'fabrik'],
  'construction': ['bygg', 'fastighet', 'construction', 'arkitektur'],
  'education': ['utbildning', 'skola', 'universitet', 'förskola'],
  'hospitality': ['hotell', 'restaurang', 'turism', 'event', 'catering'],
  'logistics': ['logistik', 'transport', 'lager', 'spedition', 'frakt'],
  'consulting': ['konsult', 'rådgivning', 'management', 'strategi'],
  'government': ['kommun', 'stat', 'myndighet', 'offentlig', 'region'],
}

/**
 * Generic skills that should NOT be used for job searching
 * These are basic requirements that almost every job has,
 * so using them as search terms returns irrelevant results.
 * They can still contribute minor points in scoring.
 */
const GENERIC_SKILLS = new Set([
  // Languages
  'svenska', 'swedish', 'engelska', 'english', 'tyska', 'german',
  'franska', 'french', 'spanska', 'spanish', 'arabiska', 'arabic',
  'finska', 'finnish', 'norska', 'norwegian', 'danska', 'danish',
  'polska', 'polish', 'ryska', 'russian', 'kinesiska', 'chinese',
  'japanska', 'japanese', 'portugisiska', 'portuguese',
  // Driver's licenses
  'körkort', 'b-körkort', 'c-körkort', 'ce-körkort', 'am-körkort',
  'a-körkort', 'a1-körkort', 'a2-körkort', 'driving license',
  'drivers license', 'förarbevis',
  // Basic computer skills
  'dator', 'datorer', 'datorvana', 'computer', 'it-vana',
  'microsoft office', 'ms office', 'office', 'word', 'excel', 'powerpoint',
  'outlook', 'teams', 'e-post', 'email', 'internet',
  // Soft skills (too generic)
  'kommunikation', 'kommunikativ', 'social', 'samarbete', 'teamwork',
  'flexibel', 'noggrann', 'ansvarstagande', 'självständig', 'strukturerad',
  'serviceinriktad', 'stresstålig', 'lösningsorienterad', 'positiv',
  'driven', 'engagerad', 'motiverad', 'pålitlig', 'punktlig',
  // Other generic
  'truckkort', 'truck', 'hjullastare', 'travers',
])

/**
 * Check if a skill is generic (should not be used for searching)
 */
function isGenericSkill(skill: string): boolean {
  const skillLower = skill.toLowerCase().trim()

  // Direct match
  if (GENERIC_SKILLS.has(skillLower)) return true

  // Check if any generic skill is contained in this skill
  for (const generic of GENERIC_SKILLS) {
    if (skillLower.includes(generic) || generic.includes(skillLower)) {
      return true
    }
  }

  return false
}

/**
 * Check if a skill matches in job text (with synonyms)
 */
function matchSkill(skill: string, jobText: string): boolean {
  const skillLower = skill.toLowerCase()

  // Direct match
  if (jobText.includes(skillLower)) return true

  // Check synonyms
  const synonyms = SKILL_SYNONYMS[skillLower] || []
  for (const syn of synonyms) {
    if (jobText.includes(syn)) return true
  }

  // Reverse lookup - check if skill is a synonym of something in the text
  for (const [key, syns] of Object.entries(SKILL_SYNONYMS)) {
    if (syns.includes(skillLower) && jobText.includes(key)) return true
  }

  // Partial word match for compound words
  if (skillLower.length > 4) {
    const words = skillLower.split(/[\s\-\/]+/).filter(w => w.length > 3)
    for (const word of words) {
      if (jobText.includes(word)) return true
    }
  }

  return false
}

/**
 * Check if job title matches user's work title (with synonyms)
 */
function matchJobTitle(userTitle: string, jobTitle: string, jobOccupation: string): { match: 'exact' | 'similar' | 'partial' | 'none' } {
  const titleLower = userTitle.toLowerCase()
  const jobTitleLower = jobTitle.toLowerCase()
  const jobOccLower = jobOccupation.toLowerCase()
  const combined = `${jobTitleLower} ${jobOccLower}`

  // Exact match
  if (jobTitleLower.includes(titleLower) || jobOccLower.includes(titleLower)) {
    return { match: 'exact' }
  }

  // Synonym match
  const synonyms = JOB_TITLE_SYNONYMS[titleLower] || []
  for (const syn of synonyms) {
    if (combined.includes(syn)) return { match: 'similar' }
  }

  // Reverse synonym lookup
  for (const [key, syns] of Object.entries(JOB_TITLE_SYNONYMS)) {
    if (syns.includes(titleLower) && combined.includes(key)) return { match: 'similar' }
  }

  // Partial word match
  const titleWords = titleLower.split(/[\s\-\/,]+/).filter(w => w.length > 3)
  const matchedWords = titleWords.filter(word => combined.includes(word))
  if (matchedWords.length > 0) {
    return { match: 'partial' }
  }

  return { match: 'none' }
}

/**
 * Detect seniority level from job text
 */
function detectSeniority(text: string): string | null {
  const textLower = text.toLowerCase()
  for (const [level, keywords] of Object.entries(SENIORITY_LEVELS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return level
    }
  }
  return null
}

/**
 * Detect industry from job/employer text
 */
function detectIndustry(text: string): string[] {
  const textLower = text.toLowerCase()
  const matched: string[] = []
  for (const [industry, keywords] of Object.entries(INDUSTRIES)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      matched.push(industry)
    }
  }
  return matched
}

/**
 * Extract years of experience required from job text
 */
function extractRequiredExperience(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*års?\s*erfarenhet/i,
    /minst\s*(\d+)\s*års?/i,
    /(\d+)\+?\s*years?\s*experience/i,
    /erfarenhet\s*av\s*minst\s*(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return parseInt(match[1])
  }
  return null
}

// ============================================
// PROFESSIONAL LICENSE/CERTIFICATION REQUIREMENTS
// ============================================

/**
 * Professional licenses that are legally required for certain jobs
 * Jobs requiring these should be filtered out if user doesn't have them
 */
const REQUIRED_LICENSES: Record<string, {
  keywords: string[]
  titlePatterns: string[]
  description: string
}> = {
  'sjuksköterska': {
    keywords: ['legitimerad sjuksköterska', 'leg. sjuksköterska', 'leg sjuksköterska', 'ssk-legitimation', 'sjuksköterskelegitimation'],
    titlePatterns: ['sjuksköterska', 'ssk'],
    description: 'Sjuksköterskelegitimation'
  },
  'läkare': {
    keywords: ['legitimerad läkare', 'leg. läkare', 'läkarlegitimation', 'medicine doktor'],
    titlePatterns: ['läkare', 'doktor', 'medicine'],
    description: 'Läkarlegitimation'
  },
  'lärare': {
    keywords: ['lärarlegitimation', 'legitimerad lärare', 'leg. lärare', 'behörig lärare'],
    titlePatterns: ['lärare', 'pedagog'],
    description: 'Lärarlegitimation'
  },
  'förskollärare': {
    keywords: ['legitimerad förskollärare', 'förskollärarlegitimation', 'behörig förskollärare'],
    titlePatterns: ['förskollärare'],
    description: 'Förskollärarlegitimation'
  },
  'psykolog': {
    keywords: ['legitimerad psykolog', 'leg. psykolog', 'psykologlegitimation'],
    titlePatterns: ['psykolog'],
    description: 'Psykologlegitimation'
  },
  'fysioterapeut': {
    keywords: ['legitimerad fysioterapeut', 'leg. fysioterapeut', 'fysioterapeutlegitimation', 'legitimerad sjukgymnast'],
    titlePatterns: ['fysioterapeut', 'sjukgymnast'],
    description: 'Fysioterapeutlegitimation'
  },
  'arbetsterapeut': {
    keywords: ['legitimerad arbetsterapeut', 'leg. arbetsterapeut', 'arbetsterapeutlegitimation'],
    titlePatterns: ['arbetsterapeut'],
    description: 'Arbetsterapeutlegitimation'
  },
  'tandläkare': {
    keywords: ['legitimerad tandläkare', 'leg. tandläkare', 'tandläkarlegitimation'],
    titlePatterns: ['tandläkare'],
    description: 'Tandläkarlegitimation'
  },
  'tandhygienist': {
    keywords: ['legitimerad tandhygienist', 'leg. tandhygienist'],
    titlePatterns: ['tandhygienist'],
    description: 'Tandhygienistlegitimation'
  },
  'apotekare': {
    keywords: ['legitimerad apotekare', 'leg. apotekare', 'apotekarlegitimation'],
    titlePatterns: ['apotekare'],
    description: 'Apotekarlegitimation'
  },
  'receptarie': {
    keywords: ['legitimerad receptarie', 'leg. receptarie'],
    titlePatterns: ['receptarie'],
    description: 'Receptarielegitimation'
  },
  'barnmorska': {
    keywords: ['legitimerad barnmorska', 'leg. barnmorska', 'barnmorskelegitimation'],
    titlePatterns: ['barnmorska'],
    description: 'Barnmorskelegitimation'
  },
  'dietist': {
    keywords: ['legitimerad dietist', 'leg. dietist'],
    titlePatterns: ['dietist'],
    description: 'Dietistlegitimation'
  },
  'logoped': {
    keywords: ['legitimerad logoped', 'leg. logoped'],
    titlePatterns: ['logoped'],
    description: 'Logopedlegitimation'
  },
  'optiker': {
    keywords: ['legitimerad optiker', 'leg. optiker'],
    titlePatterns: ['optiker'],
    description: 'Optikerlegitimation'
  },
  'kiropraktor': {
    keywords: ['legitimerad kiropraktor', 'leg. kiropraktor'],
    titlePatterns: ['kiropraktor'],
    description: 'Kiropraktorlegitimation'
  },
  'naprapat': {
    keywords: ['legitimerad naprapat', 'leg. naprapat'],
    titlePatterns: ['naprapat'],
    description: 'Naprapatlegitimation'
  },
  'audionom': {
    keywords: ['legitimerad audionom', 'leg. audionom'],
    titlePatterns: ['audionom'],
    description: 'Audionomlegitimation'
  },
  'biomedicinsk_analytiker': {
    keywords: ['legitimerad biomedicinsk analytiker', 'bma-legitimation'],
    titlePatterns: ['biomedicinsk analytiker', 'bma'],
    description: 'BMA-legitimation'
  },
  'röntgensjuksköterska': {
    keywords: ['legitimerad röntgensjuksköterska', 'leg. röntgensjuksköterska'],
    titlePatterns: ['röntgensjuksköterska'],
    description: 'Röntgensjuksköterskelegitimation'
  },
  'socionom': {
    keywords: ['socionomexamen', 'socionom'],
    titlePatterns: ['socionom', 'socialsekreterare', 'biståndshandläggare'],
    description: 'Socionomexamen'
  },
  'jurist': {
    keywords: ['juristexamen', 'jur. kand', 'advokat'],
    titlePatterns: ['jurist', 'advokat'],
    description: 'Juristexamen'
  },
  'revisor': {
    keywords: ['auktoriserad revisor', 'godkänd revisor', 'revisorsexamen'],
    titlePatterns: ['revisor'],
    description: 'Revisorsauktorisation'
  },
  'elektriker': {
    keywords: ['behörig elektriker', 'elinstallatör', 'elbehörighet'],
    titlePatterns: ['elektriker', 'elinstallatör'],
    description: 'Elbehörighet'
  },
  'veterinär': {
    keywords: ['legitimerad veterinär', 'leg. veterinär'],
    titlePatterns: ['veterinär'],
    description: 'Veterinärlegitimation'
  }
}

/**
 * Check if a job requires a professional license that the user doesn't have
 * Returns null if no license required, or the required license info if blocked
 */
function checkRequiredLicense(
  jobTitle: string,
  jobText: string,
  userEducation: string[],
  userWorkTitles: string[]
): { blocked: boolean; requiredLicense: string | null } {
  const titleLower = jobTitle.toLowerCase()
  const textLower = jobText.toLowerCase()
  const userBackground = [...userEducation, ...userWorkTitles].map(s => s.toLowerCase()).join(' ')

  for (const [licenseKey, license] of Object.entries(REQUIRED_LICENSES)) {
    // Check if job title matches a licensed profession
    const titleMatch = license.titlePatterns.some(pattern => {
      const patternLower = pattern.toLowerCase()
      return titleLower.includes(patternLower)
    })

    // Check if job explicitly requires the license
    const keywordMatch = license.keywords.some(keyword => textLower.includes(keyword.toLowerCase()))

    if (titleMatch || keywordMatch) {
      // Job requires this license - check if user has it
      const userHasLicense = license.titlePatterns.some(pattern => userBackground.includes(pattern.toLowerCase())) ||
                            license.keywords.some(keyword => userBackground.includes(keyword.toLowerCase()))

      if (!userHasLicense) {
        return { blocked: true, requiredLicense: license.description }
      }
    }
  }

  return { blocked: false, requiredLicense: null }
}

// ============================================
// PROFILE PREFERENCE MATCHING
// ============================================

/**
 * Check if job matches employment type preference
 */
function matchesEmploymentType(job: PlatsbankenJob, preferredTypes: string[]): { matches: boolean; boost: number } {
  if (preferredTypes.length === 0) return { matches: true, boost: 0 }

  const jobType = job.employment_type?.label?.toLowerCase() || ''

  // Map Swedish job types to our preference keys
  const typeMapping: Record<string, string[]> = {
    'fulltime': ['heltid', 'tillsvidare', 'fast anställning'],
    'parttime': ['deltid', 'halvtid'],
    'temporary': ['vikariat', 'tidsbegränsad', 'visstid', 'säsong'],
    'freelance': ['frilans', 'konsult', 'uppdrag'],
    'internship': ['praktik', 'trainee', 'lärling']
  }

  for (const pref of preferredTypes) {
    const keywords = typeMapping[pref] || []
    if (keywords.some(kw => jobType.includes(kw))) {
      return { matches: true, boost: 10 }  // +10% for matching preference
    }
  }

  // If user wants specific types but job doesn't match, slight penalty
  return { matches: true, boost: -5 }
}

/**
 * Check if job matches remote work preference
 */
function matchesRemoteWork(job: PlatsbankenJob, preference: 'yes' | 'no' | 'hybrid' | null): { matches: boolean; boost: number } {
  if (!preference) return { matches: true, boost: 0 }

  const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
  const remoteOption = job.remote_work?.option?.toLowerCase() || ''

  const isRemote = remoteOption.includes('remote') ||
    jobText.includes('distans') ||
    jobText.includes('remote') ||
    jobText.includes('hemarbete') ||
    jobText.includes('jobba hemifrån')

  const isHybrid = remoteOption.includes('hybrid') ||
    jobText.includes('hybrid') ||
    jobText.includes('delvis distans') ||
    jobText.includes('flexibel arbetsplats')

  if (preference === 'yes') {
    if (isRemote) return { matches: true, boost: 15 }
    if (isHybrid) return { matches: true, boost: 5 }
    return { matches: true, boost: -5 }
  }

  if (preference === 'hybrid') {
    if (isHybrid) return { matches: true, boost: 15 }
    if (isRemote) return { matches: true, boost: 5 }
    return { matches: true, boost: 0 }
  }

  // preference === 'no' - prefers on-site
  if (!isRemote && !isHybrid) return { matches: true, boost: 5 }
  return { matches: true, boost: 0 }
}

/**
 * Check if user has required driver's license
 */
function matchesDriversLicense(job: PlatsbankenJob, userLicenses: string[]): { matches: boolean; boost: number; detail: string | null } {
  const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()

  // Check for driver's license requirements
  const requiresLicense = jobText.includes('körkort') ||
    jobText.includes('b-körkort') ||
    jobText.includes('c-körkort') ||
    jobText.includes('ce-körkort') ||
    jobText.includes('truckkort')

  if (!requiresLicense) {
    return { matches: true, boost: 0, detail: null }
  }

  // Job requires license - check if user has it
  if (userLicenses.length === 0) {
    // User hasn't specified licenses, slight penalty for jobs requiring them
    return { matches: true, boost: -10, detail: 'Körkort krävs' }
  }

  // Check specific license types
  const hasB = userLicenses.some(l => l.toUpperCase() === 'B')
  const hasC = userLicenses.some(l => l.toUpperCase() === 'C')
  const hasCE = userLicenses.some(l => l.toUpperCase() === 'CE')

  if (jobText.includes('ce-körkort') || jobText.includes('ce körkort')) {
    if (hasCE) return { matches: true, boost: 15, detail: 'Du har CE-körkort ✓' }
    return { matches: true, boost: -15, detail: 'CE-körkort krävs' }
  }

  if (jobText.includes('c-körkort') || jobText.includes('c körkort')) {
    if (hasC || hasCE) return { matches: true, boost: 15, detail: 'Du har C-körkort ✓' }
    return { matches: true, boost: -15, detail: 'C-körkort krävs' }
  }

  if (jobText.includes('b-körkort') || jobText.includes('b körkort') ||
      (jobText.includes('körkort') && !jobText.includes('c-') && !jobText.includes('ce-'))) {
    if (hasB || hasC || hasCE) return { matches: true, boost: 10, detail: 'Du har B-körkort ✓' }
    return { matches: true, boost: -10, detail: 'B-körkort krävs' }
  }

  return { matches: true, boost: 0, detail: null }
}

/**
 * Apply all profile-based boosts/penalties to a match score
 */
function applyProfileBoosts(
  job: PlatsbankenJob,
  baseScore: number,
  preferences: SourceData['preferences'],
  matchDetails: string[]
): { score: number; details: string[] } {
  let score = baseScore
  const details = [...matchDetails]

  // Employment type
  const empMatch = matchesEmploymentType(job, preferences.employmentTypes)
  score += empMatch.boost

  // Remote work
  const remoteMatch = matchesRemoteWork(job, preferences.remoteWork)
  score += remoteMatch.boost
  if (remoteMatch.boost > 0 && preferences.remoteWork === 'yes') {
    details.push('Distansarbete ✓')
  }

  // Driver's license
  const licenseMatch = matchesDriversLicense(job, preferences.driversLicense)
  score += licenseMatch.boost
  if (licenseMatch.detail && licenseMatch.boost > 0) {
    details.push(licenseMatch.detail)
  }

  // Car requirement
  if (preferences.hasCar) {
    const jobText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
    if (jobText.includes('egen bil') || jobText.includes('tillgång till bil')) {
      score += 10
      details.push('Har bil ✓')
    }
  }

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score))

  return { score, details }
}

// ============================================
// HELPER COMPONENTS
// ============================================

function SourceToggle({
  source,
  label,
  icon: Icon,
  active,
  available,
  count,
  missingLabel,
  onToggle
}: {
  source: MatchSource
  label: string
  icon: React.ElementType
  active: boolean
  available: boolean
  count: number
  missingLabel: string
  onToggle: () => void
}) {
  const colors = {
    cv: 'bg-teal-100 text-teal-700 border-teal-300',
    interest: 'bg-amber-100 text-amber-700 border-amber-300',
    career: 'bg-teal-100 text-teal-700 border-teal-300'
  }

  return (
    <button
      onClick={onToggle}
      disabled={!available}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all",
        active && available ? colors[source] : "bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-stone-300",
        !available && "opacity-50 cursor-not-allowed",
        available && !active && "hover:border-slate-300 dark:hover:border-stone-600"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{label}</span>
      {available && count > 0 && (
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          active ? "bg-white/50" : "bg-slate-100"
        )}>
          {count}
        </span>
      )}
      {!available && (
        <span className="text-xs bg-slate-200 dark:bg-stone-700 px-2 py-0.5 rounded-full ml-1">
          {missingLabel}
        </span>
      )}
    </button>
  )
}

function LocationSelector({
  selected,
  onChange,
  labels
}: {
  selected: string[]
  onChange: (locations: string[]) => void
  labels: {
    allLocations: string
    location: string
    locations: string
    searchLocation: string
    noResults: string
    clearAll: string
  }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredMunicipalities = useMemo(() =>
    SWEDISH_MUNICIPALITIES.filter(m =>
      m.label.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20),
    [search]
  )

  const toggleLocation = (location: string) => {
    if (selected.includes(location)) {
      onChange(selected.filter(l => l !== location))
    } else {
      onChange([...selected, location])
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-slate-300 dark:hover:border-stone-600 transition-colors"
      >
        <MapPin className="w-4 h-4 text-slate-700 dark:text-stone-300" />
        <span className="font-medium text-sm text-slate-700 dark:text-stone-300">
          {selected.length === 0
            ? labels.allLocations
            : `${selected.length} ${selected.length === 1 ? labels.location : labels.locations}`
          }
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-600 dark:text-stone-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 w-72 bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-stone-700">
              <input
                type="text"
                placeholder={labels.searchLocation}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-b border-slate-100 dark:border-stone-700 bg-slate-50 dark:bg-stone-800">
                <div className="flex flex-wrap gap-1">
                  {selected.map(loc => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200"
                    >
                      {loc}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-2">
              {filteredMunicipalities.length === 0 ? (
                <p className="text-sm text-slate-700 dark:text-stone-300 text-center py-4">{labels.noResults}</p>
              ) : (
                filteredMunicipalities.map(m => (
                  <button
                    key={m.concept_id}
                    onClick={() => toggleLocation(m.label)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selected.includes(m.label)
                        ? "bg-teal-100 text-teal-700 font-medium"
                        : "hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300"
                    )}
                  >
                    {m.label}
                  </button>
                ))
              )}
            </div>

            {selected.length > 0 && (
              <div className="p-2 border-t border-slate-100 dark:border-stone-700">
                <button
                  onClick={() => onChange([])}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {labels.clearAll}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Memoized to prevent unnecessary re-renders when filtering/sorting doesn't change this card's data
const MatchCard = memo(function MatchCard({
  matchedJob,
  onSave,
  isSaved,
  labels
}: {
  matchedJob: MatchedJob
  onSave: (job: PlatsbankenJob) => void
  isSaved: boolean
  labels: {
    match: string
    cv: string
    interest: string
    career: string
    unknownCompany: string
    showMatchDetails: string
    matchesOn: string
    apply: string
  }
}) {
  const { job, score, source, matchDetails } = matchedJob
  const [showDetails, setShowDetails] = useState(false)

  const scoreColor = score >= 70
    ? 'text-green-600 bg-green-100 border-green-200'
    : score >= 50
      ? 'text-amber-600 bg-amber-100 border-amber-200'
      : 'text-slate-600 bg-slate-100 border-slate-200'

  const sourceConfig = {
    cv: { color: 'bg-teal-100 text-teal-700', label: labels.cv, icon: FileText },
    interest: { color: 'bg-amber-100 text-amber-700', label: labels.interest, icon: Compass },
    career: { color: 'bg-teal-100 text-teal-700', label: labels.career, icon: Target }
  }

  const config = sourceConfig[source]

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 p-5">
        <div className={cn(
          "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border",
          scoreColor
        )}>
          <span className="text-lg font-bold">{score}%</span>
          <span className="text-[10px] font-medium">{labels.match}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-stone-100 line-clamp-2 mb-1">
            {job.headline}
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-400 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            {job.employer?.name || labels.unknownCompany}
          </p>
          {job.workplace_address?.municipality && (
            <p className="text-sm text-slate-700 dark:text-stone-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {job.workplace_address.municipality}
            </p>
          )}
        </div>

        <button
          onClick={() => onSave(job)}
          disabled={isSaved}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isSaved
              ? "bg-red-100 text-red-600"
              : "hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-600 dark:text-stone-400 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
        </button>
      </div>

      {matchDetails.length > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-xs text-slate-700 dark:text-stone-300 hover:text-slate-700 dark:hover:text-stone-200"
          >
            <Settings2 className="w-3 h-3" />
            {labels.showMatchDetails}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showDetails && "rotate-180")} />
          </button>
        </div>
      )}

      {showDetails && matchDetails.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-medium text-slate-600 dark:text-stone-400 mb-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            {labels.matchesOn}
          </p>
          <div className="flex flex-wrap gap-1">
            {matchDetails.slice(0, 6).map((detail, i) => (
              <span key={i} className={cn("px-2 py-0.5 text-xs rounded", config.color)}>
                {detail}
              </span>
            ))}
            {matchDetails.length > 6 && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400 text-xs rounded">
                +{matchDetails.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-stone-700 bg-slate-50 dark:bg-stone-800">
        <span className="text-xs text-slate-700 dark:text-stone-300">
          {new Date(job.publication_date).toLocaleDateString('sv-SE')}
        </span>
        {job.webpage_url && (
          <a
            href={job.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {labels.apply}
          </a>
        )}
      </div>
    </div>
  )
})

function EmptyState({ type, labels }: {
  type: 'no-data' | 'no-results'
  labels: {
    createProfileFirst: string
    createProfileDesc: string
    createCV: string
    takeInterestGuide: string
    setCareerGoals: string
    noJobsFound: string
  }
}) {
  if (type === 'no-data') {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-teal-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-stone-100 mb-3">
          {labels.createProfileFirst}
        </h3>
        <p className="text-slate-700 dark:text-stone-300 mb-8 max-w-md mx-auto">
          {labels.createProfileDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/cv">
            <Button size="lg">
              <FileText className="w-5 h-5 mr-2" />
              {labels.createCV}
            </Button>
          </Link>
          <Link to="/interest-guide">
            <Button variant="outline" size="lg">
              <Compass className="w-5 h-5 mr-2" />
              {labels.takeInterestGuide}
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="lg">
              <Target className="w-5 h-5 mr-2" />
              {labels.setCareerGoals}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 text-center">
      <Sparkles className="w-12 h-12 text-slate-300 dark:text-stone-600 mx-auto mb-4" />
      <p className="text-slate-700 dark:text-stone-300">
        {labels.noJobsFound}
      </p>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MatchesTab() {
  const { t } = useTranslation()
  const { saveJob, isSaved } = useSavedJobs()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceData, setSourceData] = useState<SourceData | null>(null)
  const [activeSource, setActiveSource] = useState<MatchSource>('cv')
  const [municipalities, setMunicipalities] = useState<string[]>([])

  // Jobs per source
  const [cvJobs, setCvJobs] = useState<MatchedJob[]>([])
  const [interestJobs, setInterestJobs] = useState<MatchedJob[]>([])
  const [careerJobs, setCareerJobs] = useState<MatchedJob[]>([])

  // Load source data (CV, Interest, Career, Profile Preferences)
  const loadSourceData = useCallback(async (): Promise<SourceData> => {
    // Load all data sources in parallel for speed
    const [cv, interestProgress, unifiedProfile, profilePrefs] = await Promise.all([
      cvApi.getCV(),
      interestGuideApi.getProgress(),
      unifiedProfileApi.getProfile(),
      userApi.getPreferences().catch(() => null)
    ])

    // === CV DATA ===
    const skills = cv?.skills?.map((s: string | { name: string }) =>
      typeof s === 'string' ? s : s.name
    ).filter(Boolean) || []
    const certificates = cv?.certificates?.map((c: { name?: string }) => c.name).filter(Boolean) || []
    const languages = cv?.languages?.map((l: string | { name?: string; language?: string }) =>
      typeof l === 'string' ? l : (l.name || l.language)
    ).filter(Boolean) || []
    const allSkills = [...new Set([...skills, ...certificates, ...languages])]

    // Extract work titles - check both camelCase and snake_case (API returns camelCase)
    const workExperiences = cv?.workExperience || cv?.work_experience || []
    const workTitles = workExperiences.map((e: { title?: string; position?: string; role?: string; job_title?: string }) =>
      e.title || e.position || e.role || e.job_title
    ).filter(Boolean) || []

    const education = cv?.education?.map((e: { degree?: string; field?: string }) =>
      `${e.degree || ''} ${e.field || ''}`.trim()
    ).filter(Boolean) || []

    // === INTEREST GUIDE DATA ===
    let occupations: Array<{ name: string; matchPercentage: number }> = []
    if (interestProgress?.is_completed && interestProgress.answers) {
      try {
        const profile = calculateUserProfile(interestProgress.answers)
        if (profile) {
          const matches = calculateJobMatches(profile)
          occupations = matches
            .filter(m => m.matchPercentage >= 50)
            .slice(0, 15)
            .map(m => ({ name: m.occupation.name, matchPercentage: m.matchPercentage }))
        }
      } catch (e) {
        console.error('Error calculating interest matches:', e)
      }
    }

    // === CAREER GOALS DATA ===
    const preferredRoles = unifiedProfile?.career?.preferredRoles || []
    const careerGoals = unifiedProfile?.career?.careerGoals
    const careerKeywords: string[] = []
    if (careerGoals?.shortTerm) {
      careerKeywords.push(...careerGoals.shortTerm.split(/\s+/).filter((w: string) => w.length > 4))
    }
    if (careerGoals?.longTerm) {
      careerKeywords.push(...careerGoals.longTerm.split(/\s+/).filter((w: string) => w.length > 4))
    }

    // Get desired_jobs from profile preferences (set in focus mode)
    const desiredJobs = profilePrefs?.desired_jobs || []

    // === PROFILE PREFERENCES (for filtering/boosting) ===
    const preferences: SourceData['preferences'] = {
      employmentTypes: profilePrefs?.availability?.employmentTypes || [],
      remoteWork: profilePrefs?.availability?.remoteWork || null,
      driversLicense: profilePrefs?.mobility?.driversLicense || [],
      hasCar: profilePrefs?.mobility?.hasCar || false,
      maxCommuteMinutes: profilePrefs?.mobility?.maxCommuteMinutes || null,
      industries: profilePrefs?.work_preferences?.industries || []
    }

    // Combine preferred roles with desired jobs (dedup)
    const allCareerRoles = [...new Set([...preferredRoles, ...desiredJobs])]

    return {
      cv: {
        available: allSkills.length > 0 || workTitles.length > 0 || education.length > 0,
        skills: allSkills,
        workTitles,
        education
      },
      interest: {
        available: occupations.length > 0,
        occupations
      },
      career: {
        available: allCareerRoles.length > 0 || desiredJobs.length > 0,
        preferredRoles: allCareerRoles,
        desiredJobs,
        keywords: [...new Set(careerKeywords)].slice(0, 10)
      },
      preferences
    }
  }, [])

  // Search and match jobs for CV (based on skills, experience, education)
  // BALANCED APPROACH: Trust API results, score based on relevance quality
  const searchCvJobs = useCallback(async (
    data: SourceData['cv'],
    locations: string[],
    preferences: SourceData['preferences']
  ): Promise<MatchedJob[]> => {
    if (!data.available) return []

    // Filter out generic skills for scoring (but keep them for minor bonuses)
    const specificSkills = data.skills.filter(skill => !isGenericSkill(skill))


    // Build search terms from work titles first, then skills/education
    const searchTerms = [
      ...data.workTitles,
      ...specificSkills.slice(0, 2),
      ...data.education.slice(0, 1)
    ].filter(Boolean)

    if (searchTerms.length === 0) {
      return []
    }

    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()

    // Search for each term separately to get diverse results
    for (const searchTerm of searchTerms.slice(0, 5)) {
      try {
        const result = await searchJobs({
          query: searchTerm,
          municipality: locations.length === 1 ? locations[0] : undefined,
          limit: 25,
          publishedWithin: 'month'
        })

        let jobs = result.hits

        // Filter by location if multiple selected
        if (locations.length > 1) {
          jobs = jobs.filter(job =>
            locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
          )
        }

        // Filter out jobs requiring licenses user doesn't have
        jobs = jobs.filter(job => {
          const jobFullText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
          const licenseCheck = checkRequiredLicense(job.headline || '', jobFullText, data.education, data.workTitles)
          return !licenseCheck.blocked
        })

        for (const job of jobs) {
          if (seenJobIds.has(job.id)) continue
          seenJobIds.add(job.id)

          const jobOccupation = (job.occupation?.label || '').toLowerCase()
          const jobHeadline = (job.headline || '').toLowerCase()
          const jobText = `${jobHeadline} ${job.description?.text || ''}`.toLowerCase()
          const searchTermLower = searchTerm.toLowerCase()
          const matchDetails: string[] = []

          // ========== BASE SCORE (20 points) ==========
          // Job was returned by API for this search term, so it's relevant
          let totalScore = 20
          matchDetails.push(`Sökning: ${searchTerm}`)

          // ========== TITLE/OCCUPATION MATCHING (bonus 0-30 points) ==========
          let titleBonus = 0

          // Check work titles for matches
          for (const userTitle of data.workTitles) {
            const titleResult = matchJobTitle(userTitle, jobHeadline, jobOccupation)
            if (titleResult.match === 'exact') {
              titleBonus = Math.max(titleBonus, 30)
              matchDetails.push(`Erfarenhet: ${userTitle}`)
            } else if (titleResult.match === 'similar') {
              titleBonus = Math.max(titleBonus, 20)
              matchDetails.push(`Liknande: ${userTitle}`)
            } else if (titleResult.match === 'partial') {
              titleBonus = Math.max(titleBonus, 10)
              matchDetails.push(`Relaterat: ${userTitle}`)
            }
          }

          // Extra bonus if search term appears directly in headline/occupation
          if (jobHeadline.includes(searchTermLower)) {
            titleBonus = Math.max(titleBonus, 25)
          } else if (jobOccupation.includes(searchTermLower)) {
            titleBonus = Math.max(titleBonus, 20)
          } else if (jobText.includes(searchTermLower)) {
            titleBonus = Math.max(titleBonus, 10)
          }

          totalScore += titleBonus

          // ========== SPECIFIC SKILL MATCHING (0-30 points) ==========
          let skillMatches = 0
          for (const skill of specificSkills) {
            if (matchSkill(skill, jobText)) {
              if (skillMatches < 3) matchDetails.push(skill)
              skillMatches++
            }
          }
          // 10 points per skill, max 30
          totalScore += Math.min(skillMatches * 10, 30)

          // ========== EDUCATION MATCHING (0-15 points) ==========
          let hasEducationMatch = false
          for (const edu of data.education) {
            const words = edu.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            if (words.some(word => jobText.includes(word))) {
              hasEducationMatch = true
              matchDetails.push('Utbildning ✓')
              break
            }
          }
          if (hasEducationMatch) totalScore += 15

          // All jobs start with 20 base points since API already filtered for relevance

          // Apply profile preference boosts
          const { score, details } = applyProfileBoosts(job, totalScore, preferences, matchDetails)

          allJobs.push({
            job,
            score: Math.round(Math.min(score, 100)),
            source: 'cv' as MatchSource,
            matchDetails: details
          })
        }
      } catch (e) {
        console.error('Error searching for term:', searchTerm, e)
      }
    }

    // Sort by score and return top results
    return allJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [])

  // Search and match jobs for Interest (based on RIASEC/interest guide occupations)
  const searchInterestJobs = useCallback(async (
    data: SourceData['interest'],
    locations: string[],
    preferences: SourceData['preferences'],
    userEducation: string[],
    userWorkTitles: string[]
  ): Promise<MatchedJob[]> => {
    if (!data.available || data.occupations.length === 0) return []

    // Helper to extract clean search terms from occupation name
    const getSearchTerms = (name: string): string[] => {
      return name
        .split('/')
        .map(part => part.replace(/\(.*?\)/g, '').trim())
        .filter(part => part.length > 2)
    }

    const topOccupations = data.occupations.slice(0, 8)
    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()
    const searchTermsUsed = new Set<string>()

    for (const occ of topOccupations) {
      const searchTerms = getSearchTerms(occ.name)

      for (const searchTerm of searchTerms) {
        if (searchTermsUsed.has(searchTerm.toLowerCase())) continue
        searchTermsUsed.add(searchTerm.toLowerCase())

        try {
          const result = await searchJobs({
            query: searchTerm,
            municipality: locations.length === 1 ? locations[0] : undefined,
            limit: 25,
            publishedWithin: 'month'
          })

          let jobs = result.hits
          if (locations.length > 1) {
            jobs = jobs.filter(job =>
              locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
            )
          }

          // Filter out jobs requiring professional licenses user doesn't have
          jobs = jobs.filter(job => {
            const jobFullText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
            const licenseCheck = checkRequiredLicense(
              job.headline || '',
              jobFullText,
              userEducation,
              userWorkTitles
            )
            return !licenseCheck.blocked
          })

          jobs.forEach(job => {
            if (seenJobIds.has(job.id)) return
            seenJobIds.add(job.id)

            const jobTitle = (job.headline || '').toLowerCase()
            const jobOccupation = (job.occupation?.label || '').toLowerCase()
            const jobText = `${jobTitle} ${jobOccupation}`
            const searchTermLower = searchTerm.toLowerCase()

            // Calculate base match quality based on how well job matches the occupation
            let matchQuality = 0
            const matchDetails: string[] = []

            // Direct match in title (best)
            if (jobTitle.includes(searchTermLower)) {
              matchQuality = 100
              matchDetails.push(`Intresse: ${occ.name}`)
            }
            // Direct match in occupation label
            else if (jobOccupation.includes(searchTermLower)) {
              matchQuality = 90
              matchDetails.push(`Intresse: ${occ.name}`)
            }
            // Partial word match
            else {
              const searchWords = searchTermLower.split(/\s+/).filter(w => w.length > 3)
              const matchedWords = searchWords.filter(w => jobText.includes(w))
              if (matchedWords.length > 0) {
                matchQuality = 70 + (matchedWords.length / searchWords.length) * 20
                matchDetails.push(`Relaterat: ${occ.name}`)
              } else {
                matchQuality = 50
                matchDetails.push(`Relaterat yrke`)
              }
            }

            // Combine match quality with user's interest percentage
            // If user has 85% match to "Programmerare" and job matches "Programmerare" 100%,
            // base score = (100/100) * 85 = 85
            const baseScore = Math.round((matchQuality / 100) * occ.matchPercentage)

            // Apply profile preference boosts
            const { score, details } = applyProfileBoosts(job, baseScore, preferences, matchDetails)

            allJobs.push({
              job,
              score: Math.max(score, 30),
              source: 'interest' as MatchSource,
              matchDetails: details
            })
          })
        } catch (e) {
          console.error('Error searching for term:', searchTerm, e)
        }
      }
    }

    // Deduplicate - keep best score for each job
    const jobMap = new Map<string, MatchedJob>()
    allJobs.forEach(match => {
      const existing = jobMap.get(match.job.id)
      if (!existing || match.score > existing.score) {
        jobMap.set(match.job.id, match)
      }
    })

    return Array.from(jobMap.values())
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [])

  // Search and match jobs for Career (based on desired jobs and career goals)
  const searchCareerJobs = useCallback(async (
    data: SourceData['career'],
    locations: string[],
    preferences: SourceData['preferences'],
    userEducation: string[],
    userWorkTitles: string[]
  ): Promise<MatchedJob[]> => {
    // Career matching uses both preferredRoles AND desiredJobs
    const searchRoles = data.preferredRoles.length > 0
      ? data.preferredRoles
      : data.desiredJobs

    if (searchRoles.length === 0) return []

    const allJobs: MatchedJob[] = []
    const seenJobIds = new Set<string>()

    // Search for each career role/desired job
    for (const role of searchRoles.slice(0, 8)) {
      try {
        const result = await searchJobs({
          query: role,
          municipality: locations.length === 1 ? locations[0] : undefined,
          limit: 25,
          publishedWithin: 'month'
        })

        let jobs = result.hits
        if (locations.length > 1) {
          jobs = jobs.filter(job =>
            locations.some(loc => job.workplace_address?.municipality?.toLowerCase().includes(loc.toLowerCase()))
          )
        }

        // Filter out jobs requiring professional licenses user doesn't have
        jobs = jobs.filter(job => {
          const jobFullText = `${job.headline || ''} ${job.description?.text || ''}`.toLowerCase()
          const licenseCheck = checkRequiredLicense(
            job.headline || '',
            jobFullText,
            userEducation,
            userWorkTitles
          )
          return !licenseCheck.blocked
        })

        jobs.forEach(job => {
          if (seenJobIds.has(job.id)) return
          seenJobIds.add(job.id)

          const jobTitle = (job.headline || '').toLowerCase()
          const jobOccupation = (job.occupation?.label || '').toLowerCase()
          const jobText = `${jobTitle} ${job.description?.text || ''} ${jobOccupation}`.toLowerCase()
          const roleLower = role.toLowerCase()
          const matchDetails: string[] = []
          let baseScore = 0

          // Check if this is from desiredJobs (higher weight - user explicitly wants this)
          const isDesiredJob = data.desiredJobs.some(dj => dj.toLowerCase() === roleLower)

          // Direct title match (best)
          if (jobTitle.includes(roleLower)) {
            baseScore = isDesiredJob ? 90 : 75
            matchDetails.push(isDesiredJob ? `Önskat yrke: ${role}` : `Karriärmål: ${role}`)
          }
          // Occupation label match
          else if (jobOccupation.includes(roleLower)) {
            baseScore = isDesiredJob ? 80 : 65
            matchDetails.push(isDesiredJob ? `Önskat yrke: ${role}` : `Karriärmål: ${role}`)
          }
          // Description match
          else if (jobText.includes(roleLower)) {
            baseScore = isDesiredJob ? 60 : 50
            matchDetails.push(`Relaterat: ${role}`)
          }

          // Check career keywords for additional boost
          let keywordBoost = 0
          data.keywords.forEach(keyword => {
            if (keyword.length > 4 && jobText.includes(keyword.toLowerCase())) {
              keywordBoost += 5
              if (matchDetails.length < 4) {
                matchDetails.push(keyword)
              }
            }
          })
          baseScore += Math.min(keywordBoost, 20) // Cap keyword boost at 20

          if (baseScore >= 30) {
            // Apply profile preference boosts
            const { score, details } = applyProfileBoosts(job, baseScore, preferences, matchDetails)

            allJobs.push({
              job,
              score: Math.min(100, Math.round(score)),
              source: 'career' as MatchSource,
              matchDetails: details
            })
          }
        })
      } catch (e) {
        console.error('Error searching for role:', role, e)
      }
    }

    // Deduplicate - keep best score
    const jobMap = new Map<string, MatchedJob>()
    allJobs.forEach(match => {
      const existing = jobMap.get(match.job.id)
      if (!existing || match.score > existing.score) {
        jobMap.set(match.job.id, match)
      }
    })

    return Array.from(jobMap.values())
      .filter(m => m.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [])

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await loadSourceData()
      setSourceData(data)

      // Set default active source to first available
      if (data.cv.available) {
        setActiveSource('cv')
      } else if (data.interest.available) {
        setActiveSource('interest')
      } else if (data.career.available) {
        setActiveSource('career')
      }

      // Load jobs for each available source in parallel (pass preferences to each)
      // Also pass CV education/workTitles for license filtering in all sources
      const userEducation = data.cv.education || []
      const userWorkTitles = data.cv.workTitles || []

      const [cvResults, interestResults, careerResults] = await Promise.all([
        data.cv.available ? searchCvJobs(data.cv, municipalities, data.preferences) : Promise.resolve([]),
        data.interest.available ? searchInterestJobs(data.interest, municipalities, data.preferences, userEducation, userWorkTitles) : Promise.resolve([]),
        data.career.available ? searchCareerJobs(data.career, municipalities, data.preferences, userEducation, userWorkTitles) : Promise.resolve([])
      ])

      setCvJobs(cvResults)
      setInterestJobs(interestResults)
      setCareerJobs(careerResults)
    } catch (err) {
      console.error('Error loading matches:', err)
      setError(t('jobs.matches.errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [loadSourceData, searchCvJobs, searchInterestJobs, searchCareerJobs, municipalities])

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Reload when municipalities change
  useEffect(() => {
    if (sourceData && !isLoading) {
      loadData()
    }
  }, [municipalities])

  // Get current jobs based on active source
  const currentJobs = useMemo(() => {
    switch (activeSource) {
      case 'cv': return cvJobs
      case 'interest': return interestJobs
      case 'career': return careerJobs
      default: return []
    }
  }, [activeSource, cvJobs, interestJobs, careerJobs])

  // Stats
  const stats = useMemo(() => ({
    high: currentJobs.filter(m => m.score >= 70).length,
    medium: currentJobs.filter(m => m.score >= 50 && m.score < 70).length,
    total: currentJobs.length
  }), [currentJobs])

  const handleSave = async (job: PlatsbankenJob) => {
    await saveJob(job)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-sky-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-stone-400">{t('jobs.matches.searching')}</p>
      </div>
    )
  }

  const hasAnyData = sourceData && (sourceData.cv.available || sourceData.interest.available || sourceData.career.available)

  const emptyStateLabels = {
    createProfileFirst: t('jobs.matches.createProfileFirst'),
    createProfileDesc: t('jobs.matches.createProfileDesc'),
    createCV: t('jobs.matches.createCV'),
    takeInterestGuide: t('jobs.matches.takeInterestGuide'),
    setCareerGoals: t('jobs.matches.setCareerGoals'),
    noJobsFound: t('jobs.matches.noJobsFound')
  }

  if (!hasAnyData) {
    return <EmptyState type="no-data" labels={emptyStateLabels} />
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-stone-300 mb-2">{t('common.error')}</h3>
        <p className="text-slate-700 dark:text-stone-300 mb-4">{error}</p>
        <Button onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.tryAgain')}
        </Button>
      </Card>
    )
  }

  const locationLabels = {
    allLocations: t('jobs.matches.allLocations'),
    location: t('jobs.matches.location'),
    locations: t('jobs.matches.locations'),
    searchLocation: t('jobs.matches.searchLocation'),
    noResults: t('jobs.matches.noResults'),
    clearAll: t('jobs.matches.clearAll')
  }

  const matchCardLabels = {
    match: t('jobs.matches.match'),
    cv: t('jobs.matches.sources.cv'),
    interest: t('jobs.matches.sources.interest'),
    career: t('jobs.matches.sources.career'),
    unknownCompany: t('common.employerNotSpecified'),
    showMatchDetails: t('jobs.matches.showMatchDetails'),
    matchesOn: t('jobs.matches.matchesOn'),
    apply: t('jobs.card.apply')
  }

  return (
    <div className="space-y-6">
      {/* Header with source tabs */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-700 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-100 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t('jobs.matches.title')}
            </h2>
            <p className="text-sm text-slate-700 dark:text-stone-300">
              {t('jobs.matches.subtitle')}
            </p>
          </div>

          {/* Source tabs */}
          <div className="flex flex-wrap gap-2">
            <SourceToggle
              source="cv"
              label={t('jobs.matches.sources.myCV')}
              icon={FileText}
              active={activeSource === 'cv'}
              available={sourceData?.cv.available || false}
              count={cvJobs.length}
              missingLabel={t('jobs.matches.missing')}
              onToggle={() => setActiveSource('cv')}
            />
            <SourceToggle
              source="interest"
              label={t('jobs.matches.sources.interestGuide')}
              icon={Compass}
              active={activeSource === 'interest'}
              available={sourceData?.interest.available || false}
              count={interestJobs.length}
              missingLabel={t('jobs.matches.missing')}
              onToggle={() => setActiveSource('interest')}
            />
            <SourceToggle
              source="career"
              label={t('jobs.matches.sources.careerGoals')}
              icon={Target}
              active={activeSource === 'career'}
              available={sourceData?.career.available || false}
              count={careerJobs.length}
              missingLabel={t('jobs.matches.missing')}
              onToggle={() => setActiveSource('career')}
            />
          </div>

          {/* Location filter */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-stone-700">
            <span className="text-sm text-slate-600 dark:text-stone-400">{t('jobs.matches.locationsLabel')}:</span>
            <LocationSelector
              selected={municipalities}
              onChange={setMunicipalities}
              labels={locationLabels}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{t('jobs.matches.stats.goodMatch')}</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.high}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">{t('jobs.matches.stats.possible')}</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.medium}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-stone-800 dark:to-stone-800 rounded-xl p-4 border border-slate-100 dark:border-stone-700">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-stone-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-stone-300">{t('jobs.matches.stats.total')}</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-stone-200">{stats.total}</p>
        </div>
      </div>

      {/* Profile preferences info */}
      {sourceData?.preferences && (
        sourceData.preferences.employmentTypes.length > 0 ||
        sourceData.preferences.remoteWork ||
        sourceData.preferences.driversLicense.length > 0
      ) && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-lg flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sky-800 dark:text-sky-200 text-sm mb-1">
                {t('jobs.matches.preferencesUsed', 'Dina preferenser påverkar matchningen')}
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {sourceData.preferences.employmentTypes.length > 0 && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    {sourceData.preferences.employmentTypes.map(t =>
                      t === 'fulltime' ? 'Heltid' : t === 'parttime' ? 'Deltid' : t
                    ).join(', ')}
                  </span>
                )}
                {sourceData.preferences.remoteWork && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    {sourceData.preferences.remoteWork === 'yes' ? 'Distansarbete' :
                     sourceData.preferences.remoteWork === 'hybrid' ? 'Hybrid' : 'På plats'}
                  </span>
                )}
                {sourceData.preferences.driversLicense.length > 0 && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    Körkort {sourceData.preferences.driversLicense.join(', ')}
                  </span>
                )}
                {sourceData.preferences.hasCar && (
                  <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    Har bil
                  </span>
                )}
              </div>
            </div>
            <Link to="/profile" className="text-xs text-sky-600 dark:text-sky-400 hover:underline shrink-0">
              Ändra
            </Link>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {t('jobs.matches.refresh')}
        </Button>
      </div>

      {/* Jobs Grid */}
      {currentJobs.length === 0 ? (
        <EmptyState type="no-results" labels={emptyStateLabels} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {currentJobs.map(matchedJob => (
            <MatchCard
              key={matchedJob.job.id}
              matchedJob={matchedJob}
              onSave={handleSave}
              isSaved={isSaved(matchedJob.job.id)}
              labels={matchCardLabels}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MatchesTab
