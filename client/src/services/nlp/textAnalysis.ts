/**
 * NLP Text Analysis Service
 * Analyserar CV, personliga brev och jobbannonser för att ge feedback
 */

import { z } from 'zod'

// Zod-schemas för validering
export const CVAnalysisSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  keywords: z.array(z.string()),
  readability: z.object({
    score: z.number().min(0).max(100),
    grade: z.enum(['excellent', 'good', 'fair', 'needs_improvement']),
    issues: z.array(z.string())
  }),
  actionVerbs: z.array(z.string()),
  quantifiableAchievements: z.array(z.string()),
  skillsDetected: z.array(z.string()),
  completeness: z.object({
    hasContact: z.boolean(),
    hasSummary: z.boolean(),
    hasExperience: z.boolean(),
    hasEducation: z.boolean(),
    hasSkills: z.boolean(),
    missing: z.array(z.string())
  })
})

export const CoverLetterAnalysisSchema = z.object({
  personalization: z.object({
    score: z.number().min(0).max(100),
    mentionsCompany: z.boolean(),
    mentionsPosition: z.boolean(),
    genericPhrases: z.array(z.string())
  }),
  structure: z.object({
    hasOpening: z.boolean(),
    hasBody: z.boolean(),
    hasClosing: z.boolean(),
    length: z.enum(['short', 'good', 'long'])
  }),
  enthusiasm: z.object({
    score: z.number().min(0).max(100),
    tone: z.enum(['too_formal', 'professional', 'enthusiastic', 'too_casual']),
    specificMotivations: z.array(z.string())
  }),
  suggestions: z.array(z.string())
})

export type CVAnalysis = z.infer<typeof CVAnalysisSchema>
export type CoverLetterAnalysis = z.infer<typeof CoverLetterAnalysisSchema>

// Action verbs som visar resultat
const strongActionVerbs = [
  'led', 'hanterade', 'utvecklade', 'skapade', 'förbättrade',
  'effektiviserade', 'genomförde', 'samordnade', 'implementerade',
  'ökade', 'minskade', 'lanserade', 'etablerade', 'byggde',
  'designade', 'analyserade', 'löste', 'vann', 'förhandlade',
  'tränade', 'mentorerade', 'initierade', 'drev', 'transformerade'
]

const weakPhrases = [
  'ansvarig för', 'hjälpte till med', 'arbetade med', 'var med om',
  'deltog i', 'assisterade', 'stödde', 'bidrog till'
]

const genericCoverLetterPhrases = [
  'jag skriver för att söka',
  'jag är intresserad av',
  'jag har alltid drömt om',
  'jag är en lagspelare',
  'jag arbetar hårt',
  'jag är en snabb inlärare',
  'jag ser fram emot',
  'vid frågor är du välkommen'
]

// Analysera CV-text
export function analyzeCV(text: string): CVAnalysis {
  const lowerText = text.toLowerCase()
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Hitta action verbs
  const actionVerbs = strongActionVerbs.filter(verb => 
    lowerText.includes(verb.toLowerCase())
  )
  
  // Hitta kvantifierbara resultat (siffror, procent)
  const quantifiableRegex = /(\d+|\d+%|första|andra|tredje|dubbl|halver|ökade|minskade)/gi
  const quantifiableAchievements: string[] = []
  sentences.forEach(sentence => {
    if (quantifiableRegex.test(sentence)) {
      quantifiableAchievements.push(sentence.trim())
    }
  })
  
  // Detektera kompetenser (simplifierad keyword-extraction)
  const commonSkills = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node',
    'python', 'java', 'c#', 'sql', 'mongodb', 'aws', 'azure',
    'git', 'agil', 'scrum', 'kanban', 'projektledning', 'kundservice',
    'försäljning', 'marknadsföring', 'redovisning', 'bokföring',
    'hr', 'personal', 'logistik', 'lager', 'vård', 'omsorg',
    'undervisning', 'pedagogik', 'svenska', 'engelska', 'tyska',
    'franska', 'spanska', 'körkort', 'truckkort', 'heta arbeten'
  ]
  
  const skillsDetected = commonSkills.filter(skill =>
    lowerText.includes(skill.toLowerCase())
  )
  
  // Beräkna läsbarhet (simplifierad)
  const avgSentenceLength = text.length / sentences.length
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2))
  
  let readabilityGrade: CVAnalysis['readability']['grade']
  if (readabilityScore >= 80) readabilityGrade = 'excellent'
  else if (readabilityScore >= 60) readabilityGrade = 'good'
  else if (readabilityScore >= 40) readabilityGrade = 'fair'
  else readabilityGrade = 'needs_improvement'
  
  const readabilityIssues: string[] = []
  if (avgSentenceLength > 25) {
    readabilityIssues.push('Meningarna är lite långa - försök korta ner dem')
  }
  if (sentences.some(s => s.length > 200)) {
    readabilityIssues.push('Vissa stycken är för långa')
  }
  
  // Kompletthet
  const completeness = {
    hasContact: /\b(\+46|0[\d\s-]{6,})\b/i.test(text) || /\S+@\S+\.\S+/.test(text),
    hasSummary: /sammanfattning|profil|om mig/i.test(lowerText),
    hasExperience: /erfarenhet|arbetslivserfarenhet|anställning/i.test(lowerText),
    hasEducation: /utbildning|examen|skola|universitet|gymnasium/i.test(lowerText),
    hasSkills: /kompetenser|färdigheter|kunskaper/i.test(lowerText),
    missing: [] as string[]
  }
  
  if (!completeness.hasContact) completeness.missing.push('kontaktuppgifter')
  if (!completeness.hasSummary) completeness.missing.push('sammanfattning/profil')
  if (!completeness.hasExperience) completeness.missing.push('arbetslivserfarenhet')
  if (!completeness.hasEducation) completeness.missing.push('utbildning')
  if (!completeness.hasSkills) completeness.missing.push('kompetenser')
  
  // Styrkor och svagheter
  const strengths: string[] = []
  const weaknesses: string[] = []
  const suggestions: string[] = []
  
  if (actionVerbs.length >= 5) {
    strengths.push('Bra användning av aktiva verb som visar resultat')
  } else {
    weaknesses.push('Få aktiva verb - använd mer resultatorienterat språk')
    suggestions.push('Byt ut "arbetade med" mot specifika verb som "utvecklade", "ledde" eller "förbättrade"')
  }
  
  if (quantifiableAchievements.length >= 2) {
    strengths.push('Du kvantifierar dina resultat - det är starkt!')
  } else {
    weaknesses.push('Saknar siffror och konkreta resultat')
    suggestions.push('Lägg till siffror: "Hanterade 50+ kunder" eller "Ökade försäljningen med 20%"')
  }
  
  if (skillsDetected.length >= 5) {
    strengths.push('Bra med många relevanta kompetenser')
  }
  
  if (completeness.missing.length > 0) {
    weaknesses.push('CV:t saknar viktiga delar')
    suggestions.push(`Lägg till: ${completeness.missing.join(', ')}`)
  }
  
  return {
    strengths,
    weaknesses,
    suggestions,
    keywords: skillsDetected,
    readability: {
      score: Math.round(readabilityScore),
      grade: readabilityGrade,
      issues: readabilityIssues
    },
    actionVerbs,
    quantifiableAchievements: quantifiableAchievements.slice(0, 5),
    skillsDetected,
    completeness
  }
}

// Analysera personligt brev
export function analyzeCoverLetter(text: string, jobTitle?: string, company?: string): CoverLetterAnalysis {
  const lowerText = text.toLowerCase()
  
  // Personifiering
  const mentionsCompany = company ? lowerText.includes(company.toLowerCase()) : false
  const mentionsPosition = jobTitle ? lowerText.includes(jobTitle.toLowerCase()) : false
  
  const foundGenericPhrases = genericCoverLetterPhrases.filter(phrase =>
    lowerText.includes(phrase.toLowerCase())
  )
  
  const personalizationScore = Math.max(0, 100 - foundGenericPhrases.length * 15 - (mentionsCompany ? 0 : 20) - (mentionsPosition ? 0 : 15))
  
  // Struktur
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  const hasOpening = paragraphs.length > 0 && paragraphs[0].length < 300
  const hasBody = paragraphs.length >= 2
  const hasClosing = /hälsningar|vänliga|med|med|tack/i.test(lowerText.slice(-500))
  
  const charCount = text.length
  let length: CoverLetterAnalysis['structure']['length']
  if (charCount < 1000) length = 'short'
  else if (charCount > 2500) length = 'long'
  else length = 'good'
  
  // Entusiasm
  const enthusiasmWords = ['intresserad', 'passion', 'dröm', 'älskar', 'motiverad', 'engagerad', 'verkligen', 'gärna']
  const enthusiasmCount = enthusiasmWords.filter(word => lowerText.includes(word)).length
  const enthusiasmScore = Math.min(100, enthusiasmCount * 15 + 30)
  
  let tone: CoverLetterAnalysis['enthusiasm']['tone']
  if (lowerText.includes('är ett fan av') || lowerText.includes('älskar')) {
    tone = 'too_casual'
  } else if (enthusiasmCount >= 3) {
    tone = 'enthusiastic'
  } else if (enthusiasmCount >= 1) {
    tone = 'professional'
  } else {
    tone = 'too_formal'
  }
  
  // Specifika motivationer
  const specificMotivations: string[] = []
  if (/kultur|värderingar|mission/i.test(lowerText)) {
    specificMotivations.push('Företagskultur och värderingar')
  }
  if (/utveckling|växa|lära|utmaning/i.test(lowerText)) {
    specificMotivations.push('Personlig utveckling')
  }
  if (/bransch|sektor|marknad/i.test(lowerText)) {
    specificMotivations.push('Branschintresse')
  }
  
  // Förslag
  const suggestions: string[] = []
  
  if (!mentionsCompany) {
    suggestions.push('Nämn företagets namn för att visa att brevet är skrivet specifikt för dem')
  }
  if (!mentionsPosition) {
    suggestions.push('Nämn den specifika tjänsten i inledningen')
  }
  if (foundGenericPhrases.length > 2) {
    suggestions.push('Undvik för generiska fraser som "jag är en lagspelare" - ge konkreta exempel istället')
  }
  if (length === 'short') {
    suggestions.push('Brevet är lite kort - utveckla varför just du passar för rollen')
  }
  if (length === 'long') {
    suggestions.push('Brevet är långt - försök korta ner till max 1 sida')
  }
  if (tone === 'too_formal') {
    suggestions.push('Låt lite mer personlighet komma fram - visa att du är genuint intresserad')
  }
  if (specificMotivations.length < 2) {
    suggestions.push('Förklara specifikt vad som lockar dig med denna roll och detta företag')
  }
  
  return {
    personalization: {
      score: personalizationScore,
      mentionsCompany,
      mentionsPosition,
      genericPhrases: foundGenericPhrases
    },
    structure: {
      hasOpening,
      hasBody,
      hasClosing,
      length
    },
    enthusiasm: {
      score: enthusiasmScore,
      tone,
      specificMotivations
    },
    suggestions
  }
}

// Generera nyckelord från jobbannons
export function extractJobKeywords(jobDescription: string): string[] {
  const lowerDesc = jobDescription.toLowerCase()
  
  // Vanliga skills att matcha mot
  const skillKeywords = [
    'kommunikation', 'ledarskap', ' problemlösning', 'kundservice',
    'försäljning', 'marknadsföring', 'projektledning', 'analys',
    'teamwork', 'självständig', 'initiativtagande', 'strukturerad',
    'flexibel', 'kreativ', 'noggrann', 'effektiv'
  ]
  
  const technicalSkills = [
    'excel', 'powerpoint', 'word', 'crm', 'sap', 'salesforce',
    'javascript', 'python', 'sql', 'photoshop', 'illustrator'
  ]
  
  const foundSkills = [...skillKeywords, ...technicalSkills].filter(skill =>
    lowerDesc.includes(skill.toLowerCase())
  )
  
  return foundSkills
}

// Matcha CV mot jobbannons
export function matchCVToJob(cvText: string, jobDescription: string): {
  matchScore: number
  matchingSkills: string[]
  missingSkills: string[]
  suggestions: string[]
} {
  const jobKeywords = extractJobKeywords(jobDescription)
  const cvLower = cvText.toLowerCase()
  
  const matchingSkills: string[] = []
  const missingSkills: string[] = []
  
  jobKeywords.forEach(keyword => {
    if (cvLower.includes(keyword.toLowerCase())) {
      matchingSkills.push(keyword)
    } else {
      missingSkills.push(keyword)
    }
  })
  
  const matchScore = jobKeywords.length > 0 
    ? Math.round((matchingSkills.length / jobKeywords.length) * 100)
    : 50
  
  const suggestions: string[] = []
  if (missingSkills.length > 0) {
    suggestions.push(`Överväg att lägga till erfarenheter som visar: ${missingSkills.slice(0, 3).join(', ')}`)
  }
  if (matchScore < 60) {
    suggestions.push('Anpassa ditt CV mer för denna specifika tjänst - lyft fram relevanta erfarenheter')
  }
  
  return {
    matchScore,
    matchingSkills,
    missingSkills,
    suggestions
  }
}
