/**
 * Machine Learning Prediction Service
 * Prediktioner och rekommendationer baserade på användarbeteende
 */

import { z } from 'zod'

// Schemas för ML-prediktioner
export const JobProbabilitySchema = z.object({
  probability: z.number().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  estimatedDays: z.number().min(0),
  factors: z.array(z.object({
    name: z.string(),
    impact: z.number(), // -1 to 1
    weight: z.number() // 0 to 1
  })),
  recommendations: z.array(z.object({
    action: z.string(),
    expectedImprovement: z.number(),
    priority: z.enum(['critical', 'high', 'medium', 'low'])
  }))
})

export const UserSegmentSchema = z.object({
  segment: z.enum(['active_jobseeker', 'passive_explorer', 'frustrated_burnout', 'preparing_return']),
  characteristics: z.array(z.string()),
  risks: z.array(z.string()),
  recommendedInterventions: z.array(z.string())
})

export const TrendPredictionSchema = z.object({
  metric: z.string(),
  currentValue: z.number(),
  predictedValue: z.number(),
  trend: z.enum(['improving', 'stable', 'declining']),
  confidence: z.number(),
  changePercent: z.number()
})

export type JobProbability = z.infer<typeof JobProbabilitySchema>
export type UserSegment = z.infer<typeof UserSegmentSchema>
export type TrendPrediction = z.infer<typeof TrendPredictionSchema>

// Användarsegmentering baserad på beteende
export function segmentUser(userData: {
  applicationsPerWeek: number
  sessionFrequency: number
  diaryEntries: number
  lastActivityDays: number
  energyLevel: 'low' | 'medium' | 'high'
  frustrationSignals: number // t.ex. snabba avbrytningar, felklick
}): UserSegment {
  const { applicationsPerWeek, sessionFrequency, diaryEntries, lastActivityDays, energyLevel, frustrationSignals } = userData
  
  // Aktiv jobbsökare
  if (applicationsPerWeek >= 3 && sessionFrequency >= 3 && lastActivityDays <= 3) {
    return {
      segment: 'active_jobseeker',
      characteristics: [
        'Hög aktivitet och engagemang',
        'Regelbundna ansökningar',
        'Aktivt nätverkande'
      ],
      risks: [
        'Risk för utmattning vid för många avslag',
        'Kan behöva hjälp med att förfina ansökningar'
      ],
      recommendedInterventions: [
        'Erbjud avancerad CV-optimering',
        'Förslå intervjuträning',
        'Påminn om pauser och återhämtning'
      ]
    }
  }
  
  // Passiv utforskare
  if (applicationsPerWeek < 2 && sessionFrequency >= 2 && diaryEntries > 5) {
    return {
      segment: 'passive_explorer',
      characteristics: [
        'Utforskar möjligheter',
        'Aktiv i dagboken och reflektion',
        'Förbereder sig mentalt'
      ],
      risks: [
        'För lång förberedelsefas utan handling',
        'Kan behöva push för att ta nästa steg'
      ],
      recommendedInterventions: [
        'Föreslå "lätta" jobb att söka',
        'Erbjud steg-för-steg stöd vid första ansökningar',
        'Fira små framsteg för att bygga momentum'
      ]
    }
  }
  
  // Utmattad/utmattning
  if (frustrationSignals > 5 || (lastActivityDays > 7 && energyLevel === 'low')) {
    return {
      segment: 'frustrated_burnout',
      characteristics: [
        'Visar tecken på frustration eller utmattning',
        'Oregelbunden aktivitet',
        'Kan ha upplevt flera avslag'
      ],
      risks: [
        'Risk för att ge upp helt',
        'Sjunkande självförtroende',
        'Ökad isolering'
      ],
      recommendedInterventions: [
        'Erbjud extra stöd och uppmuntran',
        'Föreslå paus från intensivt sökande',
        'Fokusera på icke-jobbrelaterade aktiviteter',
        'Kontakta arbetskonsulent för stöd'
      ]
    }
  }
  
  // Förbereder återgång
  return {
    segment: 'preparing_return',
    characteristics: [
      'Bygger upp sin energi och kompetens',
      'Fokuserar på förberedelse',
      'Metodisk och genomtänkt'
    ],
    risks: [
      'Kan vara för försiktig',
      'Risk för att aldrig känna sig "redo"'
    ],
    recommendedInterventions: [
      'Sätta realistiska deadlines',
      'Erbuda "mjuk start" med praktik eller provjobb',
      'Regelbundna check-ins för progress'
    ]
  }
}

// Prediktera jobbsannolikhet
export function predictJobProbability(userData: {
  applicationsLastMonth: number
  interviewsLastMonth: number
  cvCompleteness: number // 0-100
  activityConsistency: number // 0-100
  daysSinceStart: number
  marketCondition: 'favorable' | 'neutral' | 'challenging'
  skillMatchScore: number // 0-100
}): JobProbability {
  const { applicationsLastMonth, interviewsLastMonth, cvCompleteness, activityConsistency, daysSinceStart, marketCondition, skillMatchScore } = userData
  
  // Viktade faktorer
  const weights = {
    applications: 0.25,
    interviewRate: 0.30,
    cvQuality: 0.15,
    consistency: 0.15,
    market: 0.10,
    skills: 0.05
  }
  
  // Beräkna intervjufrekvens
  const interviewRate = applicationsLastMonth > 0 ? interviewsLastMonth / applicationsLastMonth : 0
  
  // Normalisera till 0-1
  const normalizedApplications = Math.min(applicationsLastMonth / 20, 1) // 20+ ansökningar = max
  const normalizedInterviewRate = Math.min(interviewRate * 5, 1) // 20% intervjufrekvens = max
  const normalizedCV = cvCompleteness / 100
  const normalizedConsistency = activityConsistency / 100
  const normalizedMarket = marketCondition === 'favorable' ? 1 : marketCondition === 'neutral' ? 0.5 : 0.25
  const normalizedSkills = skillMatchScore / 100
  
  // Beräkna sannolikhet
  const probability = (
    normalizedApplications * weights.applications +
    normalizedInterviewRate * weights.interviewRate +
    normalizedCV * weights.cvQuality +
    normalizedConsistency * weights.consistency +
    normalizedMarket * weights.market +
    normalizedSkills * weights.skills
  ) * 100
  
  // Konfidens baserat på datakvalitet
  let confidence: JobProbability['confidence']
  if (daysSinceStart > 30 && applicationsLastMonth > 5) {
    confidence = 'high'
  } else if (daysSinceStart > 14 && applicationsLastMonth > 2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }
  
  // Beräkna uppskattad tid (i dagar)
  let estimatedDays: number
  if (probability > 70) {
    estimatedDays = 14 + Math.random() * 14 // 2-4 veckor
  } else if (probability > 40) {
    estimatedDays = 30 + Math.random() * 30 // 1-2 månader
  } else {
    estimatedDays = 60 + Math.random() * 60 // 2-4 månader
  }
  
  // Faktorer som påverkar
  const factors = [
    { name: 'Ansökningsvolym', impact: normalizedApplications > 0.5 ? 0.3 : -0.2, weight: weights.applications },
    { name: 'Intervjufrekvens', impact: normalizedInterviewRate > 0.2 ? 0.4 : -0.1, weight: weights.interviewRate },
    { name: 'CV-kvalitet', impact: normalizedCV > 0.7 ? 0.2 : -0.1, weight: weights.cvQuality },
    { name: 'Konsistens', impact: normalizedConsistency > 0.6 ? 0.2 : -0.2, weight: weights.consistency },
    { name: 'Marknadsläge', impact: normalizedMarket > 0.5 ? 0.1 : -0.1, weight: weights.market },
    { name: 'Kompetensmatch', impact: normalizedSkills > 0.6 ? 0.1 : 0, weight: weights.skills }
  ]
  
  // Rekommendationer
  const recommendations: JobProbability['recommendations'] = []
  
  if (normalizedApplications < 0.3) {
    recommendations.push({
      action: 'Öka antalet ansökningar till minst 5 per vecka',
      expectedImprovement: 15,
      priority: 'critical'
    })
  }
  
  if (normalizedInterviewRate < 0.1) {
    recommendations.push({
      action: 'Anpassa CV:t mer för varje jobb - öka relevans',
      expectedImprovement: 12,
      priority: 'high'
    })
  }
  
  if (normalizedCV < 0.7) {
    recommendations.push({
      action: 'Förbättra CV:t med kvantifierbara resultat',
      expectedImprovement: 8,
      priority: 'high'
    })
  }
  
  if (normalizedConsistency < 0.5) {
    recommendations.push({
      action: 'Skapa en regelbunden rutin för jobbsökning',
      expectedImprovement: 10,
      priority: 'medium'
    })
  }
  
  recommendations.push({
    action: 'Nätverka aktivt på LinkedIn och branschevent',
    expectedImprovement: 15,
    priority: 'medium'
  })
  
  return {
    probability: Math.round(probability),
    confidence,
    estimatedDays: Math.round(estimatedDays),
    factors,
    recommendations: recommendations.sort((a, b) => 
      ['critical', 'high', 'medium', 'low'].indexOf(a.priority) - 
      ['critical', 'high', 'medium', 'low'].indexOf(b.priority)
    )
  }
}

// Prediktera trender
export function predictTrends(historicalData: {
  dates: string[]
  applications: number[]
  interviews: number[]
  energyLevels: number[]
}): TrendPrediction[] {
  const { applications, interviews, energyLevels } = historicalData
  
  if (applications.length < 2) {
    return []
  }
  
  // Beräkna enkel linjär trend
  const calculateTrend = (values: number[]): { slope: number; r2: number } => {
    const n = values.length
    const sumX = values.reduce((sum, _, i) => sum + i, 0)
    const sumY = values.reduce((sum, v) => sum + v, 0)
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0)
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    
    // R² (förenklad)
    const meanY = sumY / n
    const ssTotal = values.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0)
    const ssResidual = values.reduce((sum, v, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n
      return sum + Math.pow(v - predicted, 2)
    }, 0)
    const r2 = 1 - (ssResidual / ssTotal)
    
    return { slope, r2 }
  }
  
  const appTrend = calculateTrend(applications)
  const interviewTrend = calculateTrend(interviews)
  const energyTrend = calculateTrend(energyLevels)
  
  const predictions: TrendPrediction[] = []
  
  // Ansökningstrend
  const currentApps = applications[applications.length - 1]
  const predictedApps = Math.max(0, currentApps + appTrend.slope * 4) // 4 veckor framåt
  predictions.push({
    metric: 'Ansökningar per vecka',
    currentValue: currentApps,
    predictedValue: Math.round(predictedApps),
    trend: appTrend.slope > 0.1 ? 'improving' : appTrend.slope < -0.1 ? 'declining' : 'stable',
    confidence: appTrend.r2,
    changePercent: currentApps > 0 ? Math.round(((predictedApps - currentApps) / currentApps) * 100) : 0
  })
  
  // Intervjutrend
  const currentInt = interviews[interviews.length - 1]
  const predictedInt = Math.max(0, currentInt + interviewTrend.slope * 4)
  predictions.push({
    metric: 'Intervjuer per månad',
    currentValue: currentInt,
    predictedValue: Math.round(predictedInt),
    trend: interviewTrend.slope > 0.05 ? 'improving' : interviewTrend.slope < -0.05 ? 'declining' : 'stable',
    confidence: interviewTrend.r2,
    changePercent: currentInt > 0 ? Math.round(((predictedInt - currentInt) / currentInt) * 100) : 0
  })
  
  // Energitrend
  const currentEnergy = energyLevels[energyLevels.length - 1]
  const predictedEnergy = Math.max(1, Math.min(5, currentEnergy + energyTrend.slope * 4))
  predictions.push({
    metric: 'Energivå (1-5)',
    currentValue: currentEnergy,
    predictedValue: Math.round(predictedEnergy * 10) / 10,
    trend: energyTrend.slope > 0.05 ? 'improving' : energyTrend.slope < -0.05 ? 'declining' : 'stable',
    confidence: energyTrend.r2,
    changePercent: Math.round(((predictedEnergy - currentEnergy) / currentEnergy) * 100)
  })
  
  return predictions
}

// Gruppanalys (för anonymiserad statistik)
export function analyzeGroupTrends(groupData: {
  totalUsers: number
  avgTimeToJob: number // dagar
  successRate: number // % som får jobb inom 6 mån
  avgApplicationsBeforeJob: number
  topSkills: string[]
  commonBarriers: string[]
}): {
  benchmarks: { metric: string; value: number; percentile: number }[]
  insights: string[]
  recommendations: string[]
} {
  const { totalUsers, avgTimeToJob, successRate, avgApplicationsBeforeJob } = groupData
  
  return {
    benchmarks: [
      { metric: 'Genomsnittlig tid till jobb', value: avgTimeToJob, percentile: 50 },
      { metric: 'Framgångsfrekvens (6 mån)', value: successRate, percentile: successRate > 70 ? 75 : successRate > 50 ? 50 : 25 },
      { metric: 'Ansökningar innan jobb', value: avgApplicationsBeforeJob, percentile: 50 }
    ],
    insights: [
      `Genomsnittlig tid från registrering till jobb är ${avgTimeToJob} dagar`,
      `${successRate}% av användarna får jobb inom 6 månader`,
      `Det krävs i genomsnitt ${avgApplicationsBeforeJob} ansökningar innan första jobbet`,
      `Vanligaste kompetenserna hos de som får jobb: ${groupData.topSkills.slice(0, 3).join(', ')}`
    ],
    recommendations: [
      'Fokusera på att förbättra CV-kvaliteten snarare än kvantitet',
      'Användare som nätverkar aktivt får jobb 30% snabbare',
      'Regelbunden dagboksskrivning korrelerar med högre energinivåer'
    ]
  }
}

// Anomalidetektion (identifiera användare som behöver extra stöd)
export function detectAnomalies(userData: {
  dailyActivity: number[]
  energyLevels: number[]
  applicationQuality: number[]
  typicalPatterns: {
    avgDailyActivity: number
    stdDevActivity: number
    avgEnergy: number
  }
}): {
  anomalies: { type: string; severity: 'low' | 'medium' | 'high'; description: string }[]
  shouldAlert: boolean
} {
  const { dailyActivity, energyLevels, applicationQuality, typicalPatterns } = userData
  const anomalies: { type: string; severity: 'low' | 'medium' | 'high'; description: string }[] = []
  
  // Kontrollera för plötslig aktivitetsnedgång
  const recentActivity = dailyActivity.slice(-7)
  const avgRecent = recentActivity.reduce((a, b) => a + b, 0) / recentActivity.length
  
  if (avgRecent < typicalPatterns.avgDailyActivity - 2 * typicalPatterns.stdDevActivity) {
    anomalies.push({
      type: 'activity_drop',
      severity: 'high',
      description: 'Aktiviteten har sjunkit avsevärt den senaste veckan'
    })
  }
  
  // Kontrollera för sjunkande energinivåer
  const recentEnergy = energyLevels.slice(-7)
  const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length
  
  if (avgEnergy < typicalPatterns.avgEnergy * 0.7) {
    anomalies.push({
      type: 'energy_decline',
      severity: 'medium',
      description: 'Energivåerna är märkbart lägre än vanligt'
    })
  }
  
  // Kontrollera för kvalitetsförsämring
  const recentQuality = applicationQuality.slice(-5)
  const avgQuality = recentQuality.reduce((a, b) => a + b, 0) / recentQuality.length
  
  if (avgQuality < 0.5 && recentQuality.length >= 3) {
    anomalies.push({
      type: 'quality_decline',
      severity: 'medium',
      description: 'Kvaliteten på senaste ansökningar är låg'
    })
  }
  
  // Kontrollera för oregelbundenhet
  const variance = recentActivity.reduce((sum, val) => 
    sum + Math.pow(val - avgRecent, 2), 0) / recentActivity.length
  
  if (variance > typicalPatterns.stdDevActivity * 4) {
    anomalies.push({
      type: 'irregular_pattern',
      severity: 'low',
      description: 'Oregelbundna aktivitetsmönster detekterade'
    })
  }
  
  return {
    anomalies,
    shouldAlert: anomalies.some(a => a.severity === 'high') || anomalies.length >= 2
  }
}
