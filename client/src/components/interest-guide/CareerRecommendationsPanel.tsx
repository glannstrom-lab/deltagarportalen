/**
 * Career Recommendations Panel
 * Connects InterestGuide test results to career recommendations,
 * education paths, and salary data
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  type UserProfile,
  calculateJobMatches,
  type JobMatch,
} from '@/services/interestGuideData'
import { educationApi, type Education } from '@/services/educationApi'
import { scbSalaryService, type SalaryData } from '@/services/scbSalaryApi'
import {
  GraduationCap,
  Briefcase,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  DollarSign,
  MapPin,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Lightbulb,
  BookOpen,
} from '@/components/ui/icons'
import { Card, Button, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CareerRecommendationsPanelProps {
  profile: UserProfile
  topMatches?: JobMatch[]
  className?: string
}

interface CareerPathRecommendation {
  occupation: string
  salaryData: SalaryData | null
  educations: Education[]
  matchPercentage: number
}

export function CareerRecommendationsPanel({
  profile,
  topMatches,
  className,
}: CareerRecommendationsPanelProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<CareerPathRecommendation[]>([])
  const [expandedOccupation, setExpandedOccupation] = useState<string | null>(null)

  // Get top matches if not provided
  const matches = topMatches || calculateJobMatches(profile).slice(0, 5)

  // Load career data for top matches
  useEffect(() => {
    async function loadCareerData() {
      setIsLoading(true)

      try {
        const recommendationPromises = matches.slice(0, 3).map(async (match) => {
          const occupationName = match.occupation.name

          // Fetch salary and education data in parallel
          const [salaryData, educationResult] = await Promise.all([
            scbSalaryService.getSalaryByOccupation(occupationName),
            educationApi.matchByJobTitle(occupationName, { limit: 3 }),
          ])

          return {
            occupation: occupationName,
            salaryData,
            educations: educationResult.educations,
            matchPercentage: match.matchPercentage,
          }
        })

        const results = await Promise.all(recommendationPromises)
        setRecommendations(results)
      } catch (error) {
        console.error('[CareerRecommendations] Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (matches.length > 0) {
      loadCareerData()
    }
  }, [matches])

  // Get RIASEC code for career suggestions
  const riasecCode = Object.entries(profile.riasec)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => key)
    .join('')

  // Navigate to skills gap with pre-filled occupation
  const handleAnalyzeSkills = (occupation: string) => {
    navigate(`/skills-gap-analysis?occupation=${encodeURIComponent(occupation)}`)
  }

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 border-b border-brand-100 dark:border-brand-900">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-700 to-emerald-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Karriärrekommendationer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Baserat på din {riasecCode}-profil och personlighet
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6 space-y-6">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.occupation}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Occupation Header */}
            <button
              onClick={() => setExpandedOccupation(
                expandedOccupation === rec.occupation ? null : rec.occupation
              )}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                  <span className="text-lg font-bold text-brand-900 dark:text-brand-400">
                    {index + 1}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {rec.occupation}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-brand-700" />
                      {rec.matchPercentage}% match
                    </span>
                    {rec.salaryData && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        {rec.salaryData.median.toLocaleString('sv-SE')} kr/mån
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  rec.matchPercentage >= 80
                    ? 'bg-brand-100 text-brand-900 dark:bg-brand-900/30 dark:text-brand-300'
                    : rec.matchPercentage >= 60
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                )}>
                  {rec.matchPercentage >= 80 ? 'Utmärkt' : rec.matchPercentage >= 60 ? 'Bra' : 'Möjlig'}
                </span>
                {expandedOccupation === rec.occupation ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedOccupation === rec.occupation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-gray-100 dark:border-gray-700"
              >
                <div className="p-4 space-y-6">
                  {/* Salary Info */}
                  {rec.salaryData && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                          Löneinformation
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">10:e percentilen</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300">
                            {rec.salaryData.p10.toLocaleString('sv-SE')} kr
                          </p>
                        </div>
                        <div className="border-x border-emerald-200 dark:border-emerald-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Median</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                            {rec.salaryData.median.toLocaleString('sv-SE')} kr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">90:e percentilen</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300">
                            {rec.salaryData.p90.toLocaleString('sv-SE')} kr
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education Paths */}
                  {rec.educations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="w-5 h-5 text-brand-900 dark:text-brand-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          Utbildningsvägar
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {rec.educations.map((edu) => (
                          <div
                            key={edu.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <BookOpen className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {edu.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {edu.provider && (
                                  <span>{edu.provider}</span>
                                )}
                                {edu.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {edu.duration}
                                  </span>
                                )}
                              </div>
                            </div>
                            {edu.url && (
                              <a
                                href={edu.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-brand-900 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAnalyzeSkills(rec.occupation)}
                      className="gap-2 bg-brand-700 hover:bg-brand-900"
                    >
                      <Target className="w-4 h-4" />
                      Analysera kompetensgap
                    </Button>
                    <Link to="/education">
                      <Button size="sm" variant="outline" className="gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Sök utbildningar
                      </Button>
                    </Link>
                    <Link to="/jobs">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Briefcase className="w-4 h-4" />
                        Se lediga jobb
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}

        {/* Career Insights */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Tips för din karriärväg
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Med en {riasecCode}-profil passar du ofta bra för yrken som kombinerar{' '}
                  {riasecCode.charAt(0) === 'R' && 'praktiskt arbete '}
                  {riasecCode.charAt(0) === 'I' && 'analytiskt tänkande '}
                  {riasecCode.charAt(0) === 'A' && 'kreativt skapande '}
                  {riasecCode.charAt(0) === 'S' && 'social kontakt '}
                  {riasecCode.charAt(0) === 'E' && 'ledarskap '}
                  {riasecCode.charAt(0) === 'C' && 'strukturerat arbete '}
                  med dina personliga styrkor.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Använd kompetensgap-analysen för att se vilka färdigheter du kan utveckla.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Prata med din arbetskonsulent för personlig karriärvägledning.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA to full exploration */}
        <div className="flex justify-center pt-4">
          <Link to="/interest-guide/occupations">
            <Button variant="outline" className="gap-2">
              Utforska alla matchande yrken
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default CareerRecommendationsPanel
