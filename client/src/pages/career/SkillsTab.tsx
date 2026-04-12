/**
 * Skills Tab - Skills gap analysis with AI and cloud storage
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, Search, CheckCircle, AlertCircle, BookOpen,
  Sparkles, TrendingUp, Award, Loader2, Trash2, History
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { skillsAnalysisApi, careerPlanApi, milestonesApi, type SkillsAnalysis, type SkillComparison, type CourseRecommendation, type ActionPlanItem } from '@/services/careerApi'
import { useAIStream } from '@/hooks/useAIStream'
import { cn } from '@/lib/utils'

export default function SkillsTab() {
  const { t, i18n } = useTranslation()
  const [cvText, setCvText] = useState('')
  const [dreamJob, setDreamJob] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState<SkillsAnalysis | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<SkillsAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [isAddingToPlan, setIsAddingToPlan] = useState(false)
  const [addedToPlan, setAddedToPlan] = useState(false)

  const { streamedText, isStreaming, startStream, reset } = useAIStream({
    onComplete: async (fullText) => {
      // Parse AI response and save to cloud
      try {
        const parsed = parseAIResponse(fullText)
        const saved = await skillsAnalysisApi.create({
          dream_job: dreamJob,
          cv_text: cvText,
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

  // Load previous analyses from cloud
  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    setIsLoading(true)
    try {
      const analyses = await skillsAnalysisApi.getAll()
      setPreviousAnalyses(analyses)
      if (analyses.length > 0) {
        setCurrentAnalysis(analyses[0])
      }
    } catch (err) {
      console.error('Failed to load analyses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const parseAIResponse = (text: string): {
    matchPercentage: number
    skills: SkillComparison[]
    courses: CourseRecommendation[]
    actionPlan: ActionPlanItem[]
  } => {
    // Parse the AI response - this is a simplified parser
    // In production, you'd want more robust parsing or structured output
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
      skillLines.slice(0, 5).forEach(line => {
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
        { name: i18n.language === 'en' ? 'Communication' : 'Kommunikation', current: 4, target: 5, gap: 'small' }
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
            title: cleanLine.substring(0, 50),
            provider: 'Online',
            duration: '8 veckor',
            type: 'online',
            cost: 'Gratis'
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
      actionLines.slice(0, 3).forEach((line, idx) => {
        const cleanLine = line.replace(/^[-•*\d.)\s]+/, '').trim()
        if (cleanLine.length > 5) {
          actionPlan.push({
            order: idx + 1,
            title: cleanLine.substring(0, 50),
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
    if (!cvText.trim() || !dreamJob.trim()) return

    reset()

    // Start AI streaming for analysis
    await startStream('kompetensgap', {
      cvText,
      dromjobb: dreamJob
    })
  }

  const deleteAnalysis = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna analys?')) return
    try {
      await skillsAnalysisApi.delete(id)
      setPreviousAnalyses(prev => prev.filter(a => a.id !== id))
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(previousAnalyses.find(a => a.id !== id) || null)
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
        // Check if similar milestone already exists
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
    setCvText('')
    setDreamJob('')
    reset()
  }

  const getGapColor = (gap: string) => {
    switch (gap) {
      case 'none': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'small': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
      case 'large': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-stone-100 dark:bg-stone-700'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Laddar kompetensanalyser...</span>
      </div>
    )
  }

  // Show analysis form if no current analysis and not streaming
  if (!currentAnalysis && !isStreaming) {
    return (
      <div className="space-y-6">
        {/* Previous Analyses */}
        {previousAnalyses.length > 0 && (
          <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <History className="w-4 h-4" />
                Tidigare analyser
              </h4>
              <span className="text-sm text-gray-500">{previousAnalyses.length} sparade</span>
            </div>
            <div className="space-y-2">
              {previousAnalyses.slice(0, 3).map(analysis => (
                <button
                  key={analysis.id}
                  onClick={() => selectAnalysis(analysis)}
                  className="w-full text-left p-3 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{analysis.dream_job}</span>
                    <span className="text-sm text-teal-600 dark:text-teal-400">{analysis.match_percentage}% match</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(analysis.created_at).toLocaleDateString('sv-SE')}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('career.skills.skillsGapAnalysis')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('career.skills.compareSkills')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                {t('career.skills.yourProfile')}
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={t('career.skills.profilePlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 resize-y text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Search className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                {t('career.skills.dreamJob')}
              </label>
              <textarea
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                placeholder={t('career.skills.dreamJobPlaceholder')}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 resize-y text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <Button
            onClick={analyze}
            disabled={!cvText.trim() || !dreamJob.trim() || isStreaming}
            className="w-full mt-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('career.skills.analyzeGap')}
          </Button>
        </Card>
      </div>
    )
  }

  // Show streaming progress
  if (isStreaming) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="status" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Analyserar dina kompetenser...</h3>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-stone-50 dark:bg-stone-700 p-4 rounded-lg" aria-label="AI-analys pågår">
              {streamedText || 'Startar analys...'}
            </pre>
          </div>
        </Card>
      </div>
    )
  }

  // Show analysis results
  const analysis = currentAnalysis!
  const skills = analysis.skills_comparison || []
  const courses = analysis.recommended_courses || []
  const actionPlan = analysis.action_plan || []

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('career.skills.analysisResults')}</h3>
            <p className="text-gray-600 dark:text-gray-300">Drömjobb: {analysis.dream_job}</p>
            <p className="text-sm text-gray-500">{new Date(analysis.created_at).toLocaleDateString('sv-SE')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{analysis.match_percentage}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={startNewAnalysis}>
                Ny analys
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteAnalysis(analysis.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={analysis.match_percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Matchning mot drömjobb: ${analysis.match_percentage}%`}
        >
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 transition-all duration-500"
            style={{ width: `${analysis.match_percentage}%` }}
          />
        </div>

        <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {analysis.match_percentage >= 80
              ? 'Du har en stark grund! Fokusera på att finslipa de sista kompetenserna.'
              : analysis.match_percentage >= 60
              ? 'Du har en god grund! Med fokuserad utveckling kan du nå ditt mål.'
              : 'Det finns potential! Börja med de viktigaste kompetenserna nedan.'}
          </p>
        </div>
      </Card>

      {/* Skills Gap */}
      {skills.length > 0 && (
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="region" aria-label="Kompetensanalys">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.skills.skillsComparison')}</h3>
          <div className="space-y-4" role="list" aria-label="Lista över kompetenser">
            {skills.map((skill, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{skill.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getGapColor(skill.gap)}`}>
                    Gap: {skill.target - skill.current} nivåer
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
                      <span>Nuvarande: {skill.current}/5</span>
                      <span>Mål: {skill.target}/5</span>
                    </div>
                    <div className="h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all"
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
            <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {t('career.skills.recommendedCourses')}
          </h3>
          <div className="space-y-3">
            {courses.map((course, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-teal-300 dark:hover:border-teal-600 transition-colors bg-white dark:bg-stone-700">
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
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{course.cost}</span>
                  {course.url && (
                    <Button size="sm" variant="outline" className="mt-1 block" onClick={() => window.open(course.url, '_blank')}>
                      {t('common.learnMore')}
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
            <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            {t('career.skills.yourActionPlan')}
          </h3>
          <div className="space-y-3">
            {actionPlan.map((item) => (
              <div key={item.order} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-700">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{item.order}</span>
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  {i18n.language === 'en' ? 'Added to your career plan!' : 'Tillagt i din karriärplan!'}
                </span>
                <a
                  href="/career?tab=plan"
                  className="ml-auto text-sm font-medium text-green-700 dark:text-green-300 hover:underline"
                >
                  {i18n.language === 'en' ? 'View plan' : 'Visa plan'} →
                </a>
              </div>
            ) : (
              <Button
                onClick={addToCareerPlan}
                disabled={isAddingToPlan}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
              >
                {isAddingToPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {i18n.language === 'en' ? 'Adding to plan...' : 'Lägger till i plan...'}
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    {i18n.language === 'en' ? 'Add to Career Plan' : 'Lägg till i karriärplan'}
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
            {t('career.skills.newAnalysis')}
          </Button>
        </Card>
      )}

      {/* History */}
      {previousAnalyses.length > 1 && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-gray-700 dark:text-gray-300"
          >
            <span className="font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              Visa tidigare analyser ({previousAnalyses.length - 1} till)
            </span>
            <span>{showHistory ? '−' : '+'}</span>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {previousAnalyses.filter(a => a.id !== currentAnalysis?.id).map(a => (
                <button
                  key={a.id}
                  onClick={() => selectAnalysis(a)}
                  className="w-full text-left p-3 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{a.dream_job}</span>
                    <span className="text-sm text-teal-600">{a.match_percentage}%</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString('sv-SE')}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
