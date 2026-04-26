/**
 * Skills Gap Analysis Page
 * Merged best features from SkillsTab and original SkillsGapAnalysis:
 * - Auto-fetches CV data from profile
 * - Cloud storage via skillsAnalysisApi
 * - AI streaming for better UX
 * - Career plan integration
 * - Favorite occupations as quick picks
 * - Export to file
 * - Skills by category with color coding
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Target, Search, TrendingUp, CheckCircle, BookOpen, Sparkles,
  Download, BarChart3, Award, Loader2, User, FileText, AlertCircle,
  Heart, History, Trash2, Plus
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { cvApi, type CVData } from '@/services/supabaseApi'
import { useAuthStore } from '@/stores/authStore'
import { useAIStream } from '@/hooks/useAIStream'
import {
  skillsAnalysisApi, careerPlanApi, milestonesApi, favoriteOccupationsApi,
  type SkillsAnalysis, type SkillComparison, type CourseRecommendation,
  type ActionPlanItem, type FavoriteOccupation
} from '@/services/careerApi'

// Skill categories with colors
const skillColors: Record<string, string> = {
  teknisk: 'from-blue-500 to-cyan-500',
  technical: 'from-blue-500 to-cyan-500',
  ledarskap: 'from-purple-500 to-pink-500',
  leadership: 'from-purple-500 to-pink-500',
  mjuk: 'from-amber-500 to-orange-500',
  soft: 'from-amber-500 to-orange-500',
  default: 'from-brand-700 to-brand-900'
}

// Helper to format CV data into a text summary for AI analysis
function formatProfileSummary(cvData: CVData | null, profile: { first_name?: string | null; email?: string } | null): string {
  if (!cvData) return ''

  const parts: string[] = []

  // Name and title
  const name = cvData.firstName || cvData.first_name || profile?.first_name || ''
  const title = cvData.title || ''
  if (name || title) {
    parts.push(`Namn: ${name}${title ? `, ${title}` : ''}`)
  }

  // Summary/Profile
  if (cvData.summary) {
    parts.push(`\nProfil: ${cvData.summary}`)
  }

  // Work experience
  const workExp = cvData.workExperience || cvData.work_experience || []
  if (workExp.length > 0) {
    parts.push('\nArbetserfarenhet:')
    workExp.forEach(exp => {
      const period = exp.startDate ? `${exp.startDate} - ${exp.endDate || 'nuvarande'}` : ''
      parts.push(`- ${exp.title || exp.position} på ${exp.company}${period ? ` (${period})` : ''}`)
      if (exp.description) {
        parts.push(`  ${exp.description.substring(0, 200)}${exp.description.length > 200 ? '...' : ''}`)
      }
    })
  }

  // Education
  const education = cvData.education || []
  if (education.length > 0) {
    parts.push('\nUtbildning:')
    education.forEach(edu => {
      parts.push(`- ${edu.degree || edu.field} på ${edu.school}${edu.year ? ` (${edu.year})` : ''}`)
    })
  }

  // Skills
  const skills = cvData.skills || []
  if (skills.length > 0) {
    parts.push('\nKompetenser:')
    const skillNames = skills.map(s => typeof s === 'string' ? s : s.name).join(', ')
    parts.push(skillNames)
  }

  // Languages
  const languages = cvData.languages || []
  if (languages.length > 0) {
    parts.push('\nSpråk:')
    const langNames = languages.map(l => typeof l === 'string' ? l : `${l.name} (${l.level})`).join(', ')
    parts.push(langNames)
  }

  // Certificates
  const certs = cvData.certificates || []
  if (certs.length > 0) {
    parts.push('\nCertifikat:')
    certs.forEach(cert => {
      parts.push(`- ${cert.name}${cert.issuer ? ` från ${cert.issuer}` : ''}`)
    })
  }

  return parts.join('\n')
}

export default function SkillsGapAnalysis() {
  const { t, i18n } = useTranslation()
  const { profile } = useAuthStore()

  // Profile data
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [profileSummary, setProfileSummary] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Analysis state
  const [dreamJob, setDreamJob] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState<SkillsAnalysis | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<SkillsAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // Career plan integration
  const [isAddingToPlan, setIsAddingToPlan] = useState(false)
  const [addedToPlan, setAddedToPlan] = useState(false)

  // Favorites
  const [favoriteOccupations, setFavoriteOccupations] = useState<FavoriteOccupation[]>([])

  // AI streaming
  const { streamedText, isStreaming, startStream, reset } = useAIStream({
    onComplete: async (fullText) => {
      try {
        const parsed = parseAIResponse(fullText)
        const saved = await skillsAnalysisApi.create({
          dream_job: dreamJob,
          cv_text: profileSummary,
          match_percentage: parsed.matchPercentage,
          skills_comparison: parsed.skills,
          recommended_courses: parsed.courses,
          action_plan: parsed.actionPlan
        })
        setCurrentAnalysis(saved)
        setPreviousAnalyses(prev => [saved, ...prev])
      } catch (err) {
        console.error('Failed to save analysis:', err)
      }
    }
  })

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    setIsLoadingProfile(true)

    try {
      // Load all data in parallel
      const [cv, analyses, favorites] = await Promise.all([
        cvApi.getCV().catch(() => null),
        skillsAnalysisApi.getAll().catch(() => []),
        favoriteOccupationsApi.getAll().catch(() => [])
      ])

      // Set CV data
      setCvData(cv)
      const summary = formatProfileSummary(cv, profile)
      setProfileSummary(summary)

      // Set analyses
      setPreviousAnalyses(analyses)
      if (analyses.length > 0) {
        setCurrentAnalysis(analyses[0])
      }

      // Set favorites
      setFavoriteOccupations(favorites)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setIsLoading(false)
      setIsLoadingProfile(false)
    }
  }

  const parseAIResponse = (text: string): {
    matchPercentage: number
    skills: SkillComparison[]
    courses: CourseRecommendation[]
    actionPlan: ActionPlanItem[]
  } => {
    let matchPercentage = 65

    // Try to extract match percentage
    const matchMatch = text.match(/(\d{1,3})%\s*(match|matchning)/i)
    if (matchMatch) {
      matchPercentage = parseInt(matchMatch[1])
    }

    // Extract skills from the response
    const skills: SkillComparison[] = []
    const skillsSection = text.match(/kompetenser?:?\s*([\s\S]*?)(?:kurser|rekommendationer|åtgärder|$)/i)
    if (skillsSection) {
      const skillLines = skillsSection[1].split('\n').filter(l => l.trim())
      skillLines.slice(0, 6).forEach(line => {
        const match = line.match(/[-•*]\s*(.+?):\s*(\d)\s*\/\s*5.*?(\d)\s*\/\s*5/i) ||
                     line.match(/[-•*]\s*(.+?).*?nuvarande:?\s*(\d).*?mål:?\s*(\d)/i)
        if (match) {
          const current = parseInt(match[2])
          const target = parseInt(match[3])
          const diff = target - current
          skills.push({
            name: match[1].trim(),
            current,
            target,
            gap: diff <= 0 ? 'none' : diff === 1 ? 'small' : diff === 2 ? 'medium' : 'large'
          })
        }
      })
    }

    // Default skills if none parsed
    if (skills.length === 0) {
      skills.push(
        { name: i18n.language === 'en' ? 'Project Management' : 'Projektledning', current: 3, target: 5, gap: 'medium' },
        { name: i18n.language === 'en' ? 'Communication' : 'Kommunikation', current: 4, target: 5, gap: 'small' },
        { name: i18n.language === 'en' ? 'Technical Skills' : 'Tekniska färdigheter', current: 3, target: 4, gap: 'small' }
      )
    }

    // Extract courses
    const courses: CourseRecommendation[] = []
    const coursesSection = text.match(/kurser?:?\s*([\s\S]*?)(?:åtgärder|handlingsplan|$)/i)
    if (coursesSection) {
      const courseLines = coursesSection[1].split('\n').filter(l => l.trim() && l.match(/[-•*\d]/))
      courseLines.slice(0, 3).forEach(line => {
        const cleanLine = line.replace(/^[-•*\d.)\s]+/, '').trim()
        if (cleanLine.length > 5) {
          courses.push({
            title: cleanLine.substring(0, 60),
            provider: 'Online',
            duration: '4-8 veckor',
            type: 'online',
            cost: 'Gratis / Pris varierar'
          })
        }
      })
    }

    // Default courses if none parsed
    if (courses.length === 0) {
      courses.push(
        { title: 'Projektledning Grundkurs', provider: 'LinkedIn Learning', duration: '20 timmar', type: 'online', cost: 'Ingår i Premium' },
        { title: 'Kommunikation i arbetslivet', provider: 'Coursera', duration: '6 veckor', type: 'online', cost: 'Gratis' }
      )
    }

    // Extract action plan
    const actionPlan: ActionPlanItem[] = []
    const actionSection = text.match(/(?:åtgärder|handlingsplan|nästa steg):?\s*([\s\S]*?)$/i)
    if (actionSection) {
      const actionLines = actionSection[1].split('\n').filter(l => l.trim() && l.match(/[-•*\d]/))
      actionLines.slice(0, 4).forEach((line, idx) => {
        const cleanLine = line.replace(/^[-•*\d.)\s]+/, '').trim()
        if (cleanLine.length > 5) {
          actionPlan.push({
            order: idx + 1,
            title: cleanLine.substring(0, 60),
            description: cleanLine
          })
        }
      })
    }

    // Default action plan if none parsed
    if (actionPlan.length === 0) {
      actionPlan.push(
        { order: 1, title: 'Börja med grundkurs', description: 'Starta med den rekommenderade grundkursen inom 2 veckor' },
        { order: 2, title: 'Praktisera dagligen', description: 'Öva dina nya kunskaper i vardagen' },
        { order: 3, title: 'Bygg portfolio', description: 'Dokumentera dina nya kompetenser' }
      )
    }

    return { matchPercentage, skills, courses, actionPlan }
  }

  const analyze = async () => {
    if (!profileSummary.trim() || !dreamJob.trim()) return

    reset()
    setAddedToPlan(false)

    // Start AI streaming for analysis
    await startStream('kompetensgap', {
      cvText: profileSummary,
      dromjobb: dreamJob
    })
  }

  const deleteAnalysis = async (id: string) => {
    if (!confirm(t('skillsGapAnalysis.confirmDelete'))) return
    try {
      await skillsAnalysisApi.delete(id)
      const remainingAnalyses = previousAnalyses.filter(a => a.id !== id)
      setPreviousAnalyses(remainingAnalyses)
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(remainingAnalyses.length > 0 ? remainingAnalyses[0] : null)
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err)
    }
  }

  const selectAnalysis = (analysis: SkillsAnalysis) => {
    setCurrentAnalysis(analysis)
    setShowHistory(false)
    setAddedToPlan(false)
  }

  const addToCareerPlan = async () => {
    if (!currentAnalysis) return
    setIsAddingToPlan(true)
    try {
      // Check if there's an active career plan
      let plan = await careerPlanApi.getActive()

      if (!plan) {
        // Create a new career plan with dream job as goal
        plan = await careerPlanApi.create({
          current_situation: currentAnalysis.cv_text?.substring(0, 200) || 'Nuvarande situation baserat på kompetensanalys',
          goal: currentAnalysis.dream_job,
          timeframe: '12 månader'
        })
      }

      // Add action plan items as milestones
      const actionPlan = currentAnalysis.action_plan || []
      const existingMilestones = plan.milestones || []

      for (const item of actionPlan) {
        const exists = existingMilestones.some(m =>
          m.title.toLowerCase() === item.title.toLowerCase()
        )

        if (!exists) {
          await milestonesApi.create({
            plan_id: plan.id,
            title: item.title,
            description: item.description,
            steps: [item.description],
            sort_order: existingMilestones.length + item.order
          })
        }
      }

      // Add skills gap courses as milestones
      const courses = currentAnalysis.recommended_courses || []
      for (let i = 0; i < Math.min(courses.length, 2); i++) {
        const course = courses[i]
        const courseTitle = `${i18n.language === 'en' ? 'Complete course' : 'Slutför kurs'}: ${course.title}`
        const exists = existingMilestones.some(m =>
          m.title.toLowerCase().includes(course.title.toLowerCase())
        )

        if (!exists) {
          await milestonesApi.create({
            plan_id: plan.id,
            title: courseTitle,
            description: `${course.provider} - ${course.duration}`,
            steps: [
              i18n.language === 'en' ? 'Sign up for the course' : 'Anmäl dig till kursen',
              i18n.language === 'en' ? 'Complete course material' : 'Slutför kursmaterialet',
              i18n.language === 'en' ? 'Apply knowledge in practice' : 'Tillämpa kunskapen i praktiken'
            ],
            sort_order: existingMilestones.length + actionPlan.length + i
          })
        }
      }

      setAddedToPlan(true)
    } catch (err) {
      console.error('Failed to add to career plan:', err)
    } finally {
      setIsAddingToPlan(false)
    }
  }

  const startNewAnalysis = () => {
    setCurrentAnalysis(null)
    setDreamJob('')
    reset()
    setAddedToPlan(false)
  }

  const downloadAnalysis = () => {
    if (!currentAnalysis) return

    const skills = currentAnalysis.skills_comparison || []
    const courses = currentAnalysis.recommended_courses || []
    const actionPlan = currentAnalysis.action_plan || []
    const dateLocale = i18n.language === 'sv' ? 'sv-SE' : 'en-US'

    const content = `${t('skillsGapAnalysis.download.title')}
${t('skillsGapAnalysis.download.date')}: ${new Date(currentAnalysis.created_at).toLocaleDateString(dateLocale)}
${t('skillsGapAnalysis.download.dreamJob')}: ${currentAnalysis.dream_job}

${t('skillsGapAnalysis.download.matchRate')}: ${currentAnalysis.match_percentage}%

${t('skillsGapAnalysis.download.skillsOverview')}:
${skills.map(s => `- ${s.name}: ${s.current}/5 → ${s.target}/5 (Gap: ${s.target - s.current})`).join('\n')}

${t('skillsGapAnalysis.download.recommendedCourses')}:
${courses.map(c => `- ${c.title} (${c.provider}, ${c.duration})`).join('\n')}

${t('skillsGapAnalysis.download.actionPlan')}:
${actionPlan.map(a => `${a.order}. ${a.title}: ${a.description}`).join('\n')}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('skillsGapAnalysis.download.filename')}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const getGapColor = (gap: string) => {
    switch (gap) {
      case 'none': return 'text-brand-900 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30'
      case 'small': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
      case 'large': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-stone-100 dark:bg-stone-700'
    }
  }

  const hasProfileData = profileSummary.trim().length > 50

  // Loading state
  if (isLoading || isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 text-brand-700 animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-stone-600 dark:text-stone-400">
            {t('skillsGapAnalysis.loadingProfile')}
          </p>
        </div>
      </div>
    )
  }

  // Streaming state
  if (isStreaming) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="status" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-brand-900" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('skillsGapAnalysis.analyzing')}
            </h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-stone-50 dark:bg-stone-700 p-4 rounded-lg" aria-label="AI-analys pågår">
              {streamedText || t('skillsGapAnalysis.startingAnalysis')}
            </pre>
          </div>
        </Card>
      </div>
    )
  }

  // Show results if we have a current analysis
  if (currentAnalysis) {
    const skills = currentAnalysis.skills_comparison || []
    const courses = currentAnalysis.recommended_courses || []
    const actionPlan = currentAnalysis.action_plan || []

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Results Header */}
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('skillsGapAnalysis.result.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('skillsGapAnalysis.dreamJobLabel')}: {currentAnalysis.dream_job}
              </p>
              <p className="text-sm text-gray-500">{new Date(currentAnalysis.created_at).toLocaleDateString('sv-SE')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 dark:from-brand-400 dark:to-brand-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{currentAnalysis.match_percentage}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" onClick={downloadAnalysis} title={i18n.language === 'en' ? 'Download' : 'Ladda ner'}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteAnalysis(currentAnalysis.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div
            className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-4"
            role="progressbar"
            aria-valuenow={currentAnalysis.match_percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${i18n.language === 'en' ? 'Match against dream job' : 'Matchning mot drömjobb'}: ${currentAnalysis.match_percentage}%`}
          >
            <div
              className="h-full bg-gradient-to-r from-brand-700 to-brand-900 dark:from-brand-400 dark:to-brand-700 transition-all duration-500"
              style={{ width: `${currentAnalysis.match_percentage}%` }}
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {currentAnalysis.match_percentage >= 80
                ? (i18n.language === 'en' ? 'You have a strong foundation! Focus on refining the last competencies.' : 'Du har en stark grund! Fokusera på att finslipa de sista kompetenserna.')
                : currentAnalysis.match_percentage >= 60
                ? (i18n.language === 'en' ? 'You have a good foundation! With focused development you can reach your goal.' : 'Du har en god grund! Med fokuserad utveckling kan du nå ditt mål.')
                : (i18n.language === 'en' ? 'There is potential! Start with the most important competencies below.' : 'Det finns potential! Börja med de viktigaste kompetenserna nedan.')}
            </p>
          </div>
        </Card>

        {/* Skills Gap */}
        {skills.length > 0 && (
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="region" aria-label="Kompetensanalys">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              {t('skillsGapAnalysis.skillsComparison')}
            </h3>
            <div className="space-y-4" role="list" aria-label="Lista över kompetenser">
              {skills.map((skill, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{skill.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getGapColor(skill.gap)}`}>
                      Gap: {skill.target - skill.current} {t('skillsGapAnalysis.levels')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <span>{t('skillsGapAnalysis.current')}: {skill.current}/5</span>
                        <span>{t('skillsGapAnalysis.goal')}: {skill.target}/5</span>
                      </div>
                      <div className="h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${skillColors.default} rounded-full transition-all`}
                          style={{ width: `${(skill.current / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Course Recommendations */}
        {courses.length > 0 && (
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              {t('skillsGapAnalysis.recommendedCourses')}
            </h3>
            <div className="space-y-3">
              {courses.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-brand-300 dark:hover:border-brand-900 transition-colors bg-white dark:bg-stone-700">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{course.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <span>{course.provider}</span>
                      <span>•</span>
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span className="capitalize">{course.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-brand-900 dark:text-brand-400">{course.cost}</span>
                    {course.url && (
                      <Button size="sm" variant="outline" className="mt-1 block" onClick={() => window.open(course.url, '_blank')}>
                        {t('skillsGapAnalysis.learnMore')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action Plan */}
        {actionPlan.length > 0 && (
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              {t('skillsGapAnalysis.yourActionPlan')}
            </h3>
            <div className="space-y-3">
              {actionPlan.map((item) => (
                <div key={item.order} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
                  <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-900 dark:text-brand-400">{item.order}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add to Career Plan Button */}
            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600">
              {addedToPlan ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900">
                  <CheckCircle className="w-5 h-5 text-brand-900 dark:text-brand-400" />
                  <span className="text-sm text-brand-900 dark:text-brand-200">
                    {t('skillsGapAnalysis.addedToCareerPlan')}
                  </span>
                  <Link
                    to="/career/plan"
                    className="ml-auto text-sm font-medium text-brand-900 dark:text-brand-300 hover:underline"
                  >
                    {t('skillsGapAnalysis.viewPlan')} →
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={addToCareerPlan}
                  disabled={isAddingToPlan}
                  className="w-full bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-900 hover:to-brand-900"
                >
                  {isAddingToPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('skillsGapAnalysis.addingToPlan')}
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      {t('skillsGapAnalysis.addToCareerPlan')}
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={startNewAnalysis}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('skillsGapAnalysis.newAnalysis')}
            </Button>
          </Card>
        )}

        {/* History */}
        {previousAnalyses.length > 1 && (
          <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-gray-700 dark:text-gray-300"
              aria-expanded={showHistory}
            >
              <span className="font-medium flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('skillsGapAnalysis.showPreviousAnalyses', { count: previousAnalyses.length - 1 })}
              </span>
              <span>{showHistory ? '−' : '+'}</span>
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2">
                {previousAnalyses.filter(a => a.id !== currentAnalysis?.id).map(a => (
                  <button
                    key={a.id}
                    onClick={() => selectAnalysis(a)}
                    className="w-full text-left p-3 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-brand-300 dark:hover:border-brand-900 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{a.dream_job}</span>
                      <span className="text-sm text-brand-900 dark:text-brand-400">{a.match_percentage}% match</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString('sv-SE')}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        <HelpButton content={helpContent.skillsGapAnalysis} />
      </div>
    )
  }

  // Input form
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-brand-100 to-sky-100 dark:from-brand-900/30 dark:to-sky-900/30 mb-2">
          <Target className="w-7 h-7 text-brand-900 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-stone-100">{t('skillsGapAnalysis.title')}</h1>
        <p className="text-slate-600 dark:text-stone-400 max-w-2xl mx-auto">
          {t('skillsGapAnalysis.description')}
        </p>
      </div>

      {/* Previous Analyses */}
      {previousAnalyses.length > 0 && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <History className="w-4 h-4" />
              {t('skillsGapAnalysis.previousAnalyses')}
            </h4>
            <span className="text-sm text-gray-500">{previousAnalyses.length} {t('skillsGapAnalysis.saved')}</span>
          </div>
          <div className="space-y-2">
            {previousAnalyses.slice(0, 3).map(analysis => (
              <button
                key={analysis.id}
                onClick={() => selectAnalysis(analysis)}
                className="w-full text-left p-3 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-brand-300 dark:hover:border-brand-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{analysis.dream_job}</span>
                  <span className="text-sm text-brand-900 dark:text-brand-400">{analysis.match_percentage}% match</span>
                </div>
                <span className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString('sv-SE')}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Profile Summary - Auto-loaded */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-stone-100">
                {t('skillsGapAnalysis.yourCurrentProfile')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-stone-400">
                {t('skillsGapAnalysis.fetchedFromCVAndProfile')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/profile"
              className="text-sm text-brand-900 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <User className="w-4 h-4" />
              {t('common.profile')}
            </Link>
            <Link
              to="/cv"
              className="text-sm text-brand-900 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              CV
            </Link>
          </div>
        </div>

        {hasProfileData ? (
          <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4 max-h-48 overflow-y-auto">
            <pre className="text-sm text-slate-700 dark:text-stone-300 whitespace-pre-wrap font-sans">
              {profileSummary}
            </pre>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  {t('skillsGapAnalysis.needMoreInfo')}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  {t('skillsGapAnalysis.goToCVPage1')}
                  <Link to="/cv" className="underline font-medium">{t('skillsGapAnalysis.cvPage')}</Link>
                  {t('skillsGapAnalysis.goToCVPage2')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dream Job Input */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-700 to-sky-500 flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-stone-100">{t('skillsGapAnalysis.dreamJob.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-stone-400">
              {t('skillsGapAnalysis.dreamJobDescription')}
            </p>
          </div>
        </div>

        {/* Favorite occupations suggestions */}
        {favoriteOccupations.length > 0 && !dreamJob && (
          <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-900">
            <div className="flex items-center gap-2 text-sm text-brand-900 dark:text-brand-300 mb-2">
              <Heart className="w-4 h-4" />
              {t('skillsGapAnalysis.favoriteOccupations')}
            </div>
            <div className="flex flex-wrap gap-2">
              {favoriteOccupations.slice(0, 5).map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => setDreamJob(fav.occupation_title)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-stone-700 rounded-full border border-brand-300 dark:border-brand-900 text-brand-900 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                >
                  {fav.occupation_title}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={dreamJob}
          onChange={(e) => setDreamJob(e.target.value)}
          placeholder={t('skillsGapAnalysis.dreamJob.placeholder')}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none resize-y bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100"
        />
        <p className="text-xs text-slate-500 dark:text-stone-400 mt-2">
          {t('skillsGapAnalysis.dreamJob.tip')}
        </p>
      </Card>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={analyze}
          disabled={!hasProfileData || !dreamJob.trim() || isStreaming}
          className="px-8 py-4 text-lg bg-gradient-to-r from-brand-700 to-sky-500 hover:from-brand-900 hover:to-sky-600 dark:from-brand-900 dark:to-sky-600 dark:hover:from-brand-700 dark:hover:to-sky-500"
        >
          <Sparkles className="w-6 h-6 mr-2" />
          {t('skillsGapAnalysis.analyzeGap')}
        </Button>
      </div>

      <HelpButton content={helpContent.skillsGapAnalysis} />
    </div>
  )
}
