/**
 * Career Recommendations Panel
 * Connects InterestGuide test results to career recommendations,
 * education paths, and salary data
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  calculateJobMatches,
  type UserProfile,
  type JobMatch,
} from '@/services/interestGuideData'
import { educationApi, type Education } from '@/services/educationApi'
import { sakerUrl } from '@/lib/sakerUrl'
import { EXTERNA_LONEKALLOR } from '@/data/lonedata'
import {
  GraduationCap,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
} from '@/components/ui/icons'
import { Card, Button, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CareerRecommendationsPanelProps {
  profile: UserProfile
  topMatches?: JobMatch[]
  /** Hur många yrken som finns totalt — för "Nr 2 av 142". */
  totalMatches?: number
  className?: string
}

interface CareerPathRecommendation {
  occupation: string
  educations: Education[]
  /** Anropet mot utbildningsregistret föll. Skiljs från "inga utbildningar". */
  utbildningsfel: boolean
  /** Platsen i rangordningen (1 = närmast dina svar). Ingen procent: se matchningsplats. */
  place: number
}

/** SCB:s lönesök — den officiella källan, hämtad ur den delade källistan i lonedata.ts. */
const SCB_LONESOK_URL = EXTERNA_LONEKALLOR.find((k) => k.nyckel === 'scb')!.url

export function CareerRecommendationsPanel({
  profile,
  topMatches,
  totalMatches,
  className,
}: CareerRecommendationsPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<CareerPathRecommendation[]>([])
  const [expandedOccupation, setExpandedOccupation] = useState<string | null>(null)

  // Get top matches if not provided.
  //
  // MEDVETET inte översatt: `occupationName` (nedan) skickas rätt in som
  // sökterm till `educationApi.matchByJobTitle`, som matchar mot SVENSKA
  // yrkestitlar (utbildningsregistret). Ett engelskt namn skulle inte hitta
  // någon träff där. Namnet är alltså en uppslagsnyckel här, inte bara
  // renderad text — samma undantag som poängberäkningen i
  // `useJobbmatchningar`s docstring pekar ut.
  //
  // Lön hämtas INTE här längre: `scbSalaryApi` är tjugo handskrivna rader, inte
  // SCB-data, och panelen visade dem som "Löneläge 2026" med percentiler.
  // Panelen pekar i stället på SCB:s lönesök (EXTERNA_LONEKALLOR).
  const matches = topMatches || calculateJobMatches(profile).slice(0, 5)

  // Load career data for top matches
  useEffect(() => {
    async function loadCareerData() {
      setIsLoading(true)

      try {
        const recommendationPromises = matches.slice(0, 3).map(async (match, index) => {
          const occupationName = match.occupation.name

          const educationResult = await educationApi.matchByJobTitle(occupationName, { limit: 3 })

          return {
            occupation: occupationName,
            educations: educationResult.educations,
            // `'error'` betyder att anropet FÖLL — inte att yrket saknar
            // utbildningar. Utan den här flaggan blev ett avbrott en tyst
            // tom sektion. Se docstringen på SearchResult.source.
            utbildningsfel: educationResult.source === 'error',
            place: index + 1,
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

  // Första bokstaven i profilkoden avgör vilken typ av arbete tipset nämner.
  const riasecFokusPerTyp: Record<string, string> = {
    R: t('interestGuide.rec.focus.R', 'praktiskt arbete'),
    I: t('interestGuide.rec.focus.I', 'analytiskt tänkande'),
    A: t('interestGuide.rec.focus.A', 'kreativt skapande'),
    S: t('interestGuide.rec.focus.S', 'social kontakt'),
    E: t('interestGuide.rec.focus.E', 'ledarskap'),
    C: t('interestGuide.rec.focus.C', 'strukturerat arbete'),
  }
  const riasecFokus = riasecFokusPerTyp[riasecCode.charAt(0)] ?? ''

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
      <div className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-b border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--c-solid)] rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('interestGuide.rec.title', 'Karriärrekommendationer')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('interestGuide.rec.basedOn', 'Baserat på din {{code}}-profil och personlighet', { code: riasecCode })}
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
                <div className="flex items-center justify-center w-10 h-10 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 rounded-lg">
                  <span className="text-lg font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">
                    {index + 1}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {rec.occupation}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-[var(--c-solid)]" aria-hidden="true" />
                      {totalMatches
                        ? t('interestGuide.results.rankPlace', 'Nr {{place}} av {{total}} utifrån dina svar', { place: rec.place, total: totalMatches })
                        : t('interestGuide.results.rankPlaceShort', 'Nr {{place}} utifrån dina svar', { place: rec.place })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  {/*
                    Här stod "Löneläge 2026" med median, 10:e och 90:e percentilen
                    ur SALARY_DATA_2026 i scbSalaryApi.ts — tjugo handskrivna rader,
                    mest IT- och kontorsyrken, som aldrig varit hämtade från SCB
                    (filen säger det själv). Talen såg ut som statistik och
                    saknade märkning. Ett värde utan underlag visas inte: vi
                    hänvisar till SCB:s lönesök, som har den riktiga siffran.
                  */}
                  <div className="rounded-xl p-4 bg-[var(--c-bg)] border border-[var(--c-accent)]">
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      {t('interestGuide.rec.salaryNoteBefore', 'Vi visar ingen lön här, eftersom vi inte har officiell lönestatistik per yrke. Titta i')}{' '}
                      <a
                        href={SCB_LONESOK_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[var(--c-text)]"
                      >
                        {t('interestGuide.rec.scbSalarySearch', 'SCB:s lönesök (officiell statistik)')}
                      </a>{' '}
                      {t('interestGuide.rec.salaryNoteMiddle', 'eller på')}{' '}
                      <Link to="/salary" className="underline text-[var(--c-text)]">
                        {t('interestGuide.rec.salaryPage', 'lönesidan i portalen')}
                      </Link>
                      .
                    </p>
                  </div>

                  {/* Utbildningsregistret svarade inte. Utan den här raden
                      blev ett avbrott en sektion som bara inte fanns — och
                      läsaren drog slutsatsen att yrket saknar utbildningar. */}
                  {rec.utbildningsfel && rec.educations.length === 0 && (
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      {t('interestGuide.rec.educationDown', 'Vi når inte utbildningsregistret just nu, så utbildningsvägarna saknas här. Försök igen om en stund.')}
                    </p>
                  )}

                  {/* Education Paths */}
                  {rec.educations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {t('interestGuide.rec.educationPaths', 'Utbildningsvägar')}
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
                            {sakerUrl(edu.url) && (
                              <a
                                href={sakerUrl(edu.url)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-[var(--c-text)] dark:text-[var(--c-solid)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/40 rounded-lg"
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
                      className="gap-2 bg-[var(--c-solid)] hover:bg-[var(--c-solid)]"
                    >
                      <Target className="w-4 h-4" />
                      {t('interestGuide.rec.analyzeSkills', 'Analysera kompetensgap')}
                    </Button>
                    <Link to="/education">
                      <Button size="sm" variant="outline" className="gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {t('interestGuide.rec.searchEducation', 'Sök utbildningar')}
                      </Button>
                    </Link>
                    <Link to="/job-search">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Briefcase className="w-4 h-4" />
                        {t('interestGuide.rec.seeJobs', 'Se lediga jobb')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}

        {/* Career Insights */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {t('interestGuide.rec.tipsTitle', 'Tips för din karriärväg')}
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {t('interestGuide.rec.tipProfile', 'Med en {{code}}-profil passar du ofta bra för yrken som kombinerar {{focus}} med dina personliga styrkor.', { code: riasecCode, focus: riasecFokus })}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {t('interestGuide.rec.tipSkills', 'Använd kompetensgap-analysen för att se vilka färdigheter du kan utveckla.')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {t('interestGuide.rec.tipConsultant', 'Prata med din arbetskonsulent för personlig karriärvägledning.')}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA to full exploration */}
        <div className="flex justify-center pt-4">
          <Link to="/interest-guide/occupations">
            <Button variant="outline" className="gap-2">
              {t('interestGuide.rec.exploreAll', 'Utforska alla matchande yrken')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default CareerRecommendationsPanel
