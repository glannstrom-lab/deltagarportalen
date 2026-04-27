/**
 * Plan Tab - Career plan with SMART goals and visual timeline (cloud storage)
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, MapPin, Flag, Calendar, CheckCircle, Clock,
  Sparkles, ChevronRight, Plus, Award, TrendingUp, AlertCircle,
  Zap, X, Trash2, Loader2, Heart, FileText
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { careerPlanApi, milestonesApi, favoriteOccupationsApi, type CareerPlan, type CareerMilestone, type FavoriteOccupation } from '@/services/careerApi'
import { CalendarSync } from '@/components/calendar/CalendarSync'
import { useProfileStore } from '@/stores/profileStore'

export default function PlanTab() {
  const { t, i18n } = useTranslation()
  const [currentSituation, setCurrentSituation] = useState('')
  const [goal, setGoal] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [plan, setPlan] = useState<CareerPlan | null>(null)
  const [milestones, setMilestones] = useState<CareerMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSMARTHelper, setShowSMARTHelper] = useState(false)
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [favoriteOccupations, setFavoriteOccupations] = useState<FavoriteOccupation[]>([])
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    timeframe: '',
    target_date: '',
    steps: ''
  })

  // Profile and CV data for auto-fill
  const { profile, cvData, preferences, loadAll: loadProfileData } = useProfileStore()

  // Generate current situation summary from CV and profile
  const generatedSituation = useMemo(() => {
    const parts: string[] = []
    const isEn = i18n.language === 'en'

    // Current/most recent job from CV
    const workExp = cvData?.workExperience || cvData?.work_experience || []
    if (workExp.length > 0) {
      const currentJob = workExp[0]
      if (currentJob.title && currentJob.company) {
        const isCurrent = currentJob.current || !currentJob.endDate
        if (isCurrent) {
          parts.push(isEn
            ? `Currently working as ${currentJob.title} at ${currentJob.company}`
            : `Arbetar just nu som ${currentJob.title} på ${currentJob.company}`)
        } else {
          parts.push(isEn
            ? `Most recently worked as ${currentJob.title} at ${currentJob.company}`
            : `Senast arbetade som ${currentJob.title} på ${currentJob.company}`)
        }
      }
    } else if (cvData?.title) {
      parts.push(isEn
        ? `Professional title: ${cvData.title}`
        : `Yrkestitel: ${cvData.title}`)
    }

    // Education from CV
    const education = cvData?.education || []
    if (education.length > 0) {
      const latestEdu = education[0]
      if (latestEdu.degree && latestEdu.school) {
        parts.push(isEn
          ? `Education: ${latestEdu.degree} from ${latestEdu.school}`
          : `Utbildning: ${latestEdu.degree} från ${latestEdu.school}`)
      }
    }

    // Skills from CV
    const skills = cvData?.skills || []
    if (skills.length > 0) {
      const topSkills = skills.slice(0, 5).map((s: string | { name: string }) =>
        typeof s === 'string' ? s : s.name
      ).filter(Boolean)
      if (topSkills.length > 0) {
        parts.push(isEn
          ? `Key skills: ${topSkills.join(', ')}`
          : `Nyckelkompetenser: ${topSkills.join(', ')}`)
      }
    }

    // Location
    const location = cvData?.location || profile?.location
    if (location) {
      parts.push(isEn ? `Based in ${location}` : `Bor i ${location}`)
    }

    // Desired jobs from preferences
    const desiredJobs = preferences?.desired_jobs || []
    if (desiredJobs.length > 0) {
      parts.push(isEn
        ? `Interested in: ${desiredJobs.join(', ')}`
        : `Intresserad av: ${desiredJobs.join(', ')}`)
    }

    return parts.join('. ') + (parts.length > 0 ? '.' : '')
  }, [cvData, profile, preferences, i18n.language])

  const hasProfileData = generatedSituation.length > 0

  const autoFillCurrentSituation = () => {
    if (generatedSituation) {
      setCurrentSituation(generatedSituation)
    }
  }

  // Load existing plan and favorites from cloud
  useEffect(() => {
    loadData()
    loadProfileData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load plan and favorites in parallel
      const [activePlan, favorites] = await Promise.all([
        careerPlanApi.getActive(),
        favoriteOccupationsApi.getAll()
      ])

      setFavoriteOccupations(favorites)

      if (activePlan) {
        setPlan(activePlan)
        setMilestones(activePlan.milestones || [])
        setCurrentSituation(activePlan.current_situation)
        setGoal(activePlan.goal)
        setTimeframe(activePlan.timeframe || '')
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePlan = async () => {
    if (!currentSituation.trim() || !goal.trim()) return
    setIsSaving(true)
    try {
      const newPlan = await careerPlanApi.create({
        current_situation: currentSituation,
        goal,
        timeframe: timeframe || undefined
      })
      setPlan(newPlan)
      setMilestones([])

      // Create default milestones
      const defaultMilestones = [
        {
          plan_id: newPlan.id,
          title: i18n.language === 'en' ? 'Update CV and LinkedIn' : 'Uppdatera CV och LinkedIn',
          timeframe: i18n.language === 'en' ? 'Month 1-2' : 'Månad 1-2',
          steps: i18n.language === 'en'
            ? ['Add recent experiences', 'Optimize keywords', 'Update profile picture']
            : ['Lägg till senaste erfarenheter', 'Optimera nyckelord', 'Uppdatera profilbild'],
          sort_order: 0
        },
        {
          plan_id: newPlan.id,
          title: i18n.language === 'en' ? 'Identify target companies' : 'Identifiera målföretag',
          timeframe: i18n.language === 'en' ? 'Month 2-3' : 'Månad 2-3',
          steps: i18n.language === 'en'
            ? ['List 10 dream employers', 'Follow them on LinkedIn', 'Contact people within the companies']
            : ['Lista 10 drömarbetsgivare', 'Följ dem på LinkedIn', 'Kontakta personer inom företagen'],
          sort_order: 1
        },
        {
          plan_id: newPlan.id,
          title: i18n.language === 'en' ? 'Send applications' : 'Skicka ansökningar',
          timeframe: i18n.language === 'en' ? 'Month 3-6' : 'Månad 3-6',
          steps: i18n.language === 'en'
            ? ['Tailor CV for each role', 'Write cover letters', 'Follow up applications']
            : ['Skräddarsy CV för varje roll', 'Skriv personliga brev', 'Följa upp ansökningar'],
          sort_order: 2
        }
      ]

      const createdMilestones = await Promise.all(
        defaultMilestones.map(m => milestonesApi.create(m))
      )
      setMilestones(createdMilestones)
    } catch (err) {
      console.error('Failed to create career plan:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMilestone = async (id: string) => {
    try {
      const updated = await milestonesApi.toggleComplete(id)
      setMilestones(prev => prev.map(m => m.id === id ? updated : m))
      // Refresh plan to get updated progress
      const refreshedPlan = await careerPlanApi.getActive()
      if (refreshedPlan) setPlan(refreshedPlan)
    } catch (err) {
      console.error('Failed to toggle milestone:', err)
    }
  }

  const updateMilestoneProgress = async (id: string, progress: number) => {
    try {
      const updated = await milestonesApi.updateProgress(id, progress)
      setMilestones(prev => prev.map(m => m.id === id ? updated : m))
      // Refresh plan to get updated progress
      const refreshedPlan = await careerPlanApi.getActive()
      if (refreshedPlan) setPlan(refreshedPlan)
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const addMilestone = async () => {
    if (!plan || !newMilestone.title.trim()) return
    setIsSaving(true)
    try {
      const created = await milestonesApi.create({
        plan_id: plan.id,
        title: newMilestone.title,
        timeframe: newMilestone.timeframe || undefined,
        target_date: newMilestone.target_date || undefined,
        steps: newMilestone.steps ? newMilestone.steps.split('\n').filter(s => s.trim()) : [],
        sort_order: milestones.length
      })
      setMilestones(prev => [...prev, created])
      setNewMilestone({ title: '', timeframe: '', target_date: '', steps: '' })
      setIsAddingMilestone(false)
    } catch (err) {
      console.error('Failed to add milestone:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteMilestone = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna milstolpe?')) return
    try {
      await milestonesApi.delete(id)
      setMilestones(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Failed to delete milestone:', err)
    }
  }

  const deletePlan = async () => {
    if (!plan) return
    if (!confirm('Är du säker på att du vill ta bort hela karriärplanen?')) return
    try {
      await careerPlanApi.delete(plan.id)
      setPlan(null)
      setMilestones([])
      setCurrentSituation('')
      setGoal('')
      setTimeframe('')
    } catch (err) {
      console.error('Failed to delete plan:', err)
    }
  }

  const completedCount = milestones.filter(m => m.is_completed).length
  const totalProgress = plan?.total_progress ||
    (milestones.length > 0 ? Math.round(milestones.reduce((sum, m) => sum + (m.progress || 0), 0) / milestones.length) : 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Laddar karriärplan...</span>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('career.plan.createCareerPlan')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('career.plan.describeWhere')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                {t('career.plan.whereAreYou')}
              </label>

              {/* Auto-fill from CV/Profile */}
              {hasProfileData && !currentSituation && (
                <div className="mb-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-sky-700 dark:text-sky-300 mb-2">
                        {i18n.language === 'en'
                          ? 'We found information from your CV and profile:'
                          : 'Vi hittade information från ditt CV och din profil:'}
                      </p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 mb-3 line-clamp-3">
                        {generatedSituation}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={autoFillCurrentSituation}
                        className="border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/30"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {i18n.language === 'en' ? 'Use this information' : 'Använd denna information'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder={t('career.plan.currentPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 resize-y text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                {t('career.plan.whereWantToGo')}
              </label>

              {/* Favorite occupations suggestions */}
              {favoriteOccupations.length > 0 && !goal && (
                <div className="mb-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-700">
                  <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300 mb-2">
                    <Heart className="w-4 h-4" />
                    {i18n.language === 'en' ? 'Set goal based on favorites:' : 'Sätt mål baserat på favoriter:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {favoriteOccupations.slice(0, 5).map((fav) => (
                      <button
                        key={fav.id}
                        onClick={() => setGoal(i18n.language === 'en'
                          ? `Get a job as ${fav.occupation_title}`
                          : `Få jobb som ${fav.occupation_title}`
                        )}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-stone-700 rounded-full border border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800/30 transition-colors"
                      >
                        {fav.occupation_title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('career.plan.goalPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 resize-y text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                Tidsram (valfritt)
              </label>
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="T.ex. 6 månader, 1 år"
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 text-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generatePlan}
                disabled={!currentSituation.trim() || !goal.trim() || isSaving}
                className="w-full flex-1"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t('career.plan.generatePlan')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSMARTHelper(!showSMARTHelper)}
                title="SMART goals helper"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {showSMARTHelper && (
          <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">SMART-mål hjälpare</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Se till att ditt mål är Specifikt, Mätbart, Uppnåeligt, Relevant och Tidsbundet:
                </p>
                <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                  <li><strong>S</strong> - Specifikt: Vad exakt vill du uppnå?</li>
                  <li><strong>M</strong> - Mätbart: Hur vet du när du har nått målet?</li>
                  <li><strong>A</strong> - Uppnåeligt: Är det realistiskt under din tidsram?</li>
                  <li><strong>R</strong> - Relevant: Matchar det dina värden och ambitioner?</li>
                  <li><strong>T</strong> - Tidsbundet: Har du en tidsram i åtanke?</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.plan.whyCareerPlan')}</h4>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-teal-500 dark:text-teal-400 mt-0.5" />
              {t('career.plan.reason1')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-teal-500 dark:text-teal-400 mt-0.5" />
              {t('career.plan.reason2')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-teal-500 dark:text-teal-400 mt-0.5" />
              {t('career.plan.reason3')}
            </li>
          </ul>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('career.plan.yourCareerPlan')}</h3>
            <p className="text-gray-600 dark:text-gray-300"><strong>Från:</strong> {plan.current_situation}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Till:</strong> {plan.goal}</p>
            {plan.timeframe && (
              <p className="text-gray-500 dark:text-gray-400 text-sm"><strong>Tidsram:</strong> {plan.timeframe}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={deletePlan}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Overall Progress */}
        <div
          className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl border border-teal-200 dark:border-teal-700"
          role="region"
          aria-label="Övergripande framsteg för karriärplan"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">Övergripande framsteg</span>
            </div>
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400" aria-live="polite">{totalProgress}%</span>
          </div>
          <div
            className="h-3 bg-white dark:bg-stone-700 rounded-full overflow-hidden border border-teal-200 dark:border-teal-600"
            role="progressbar"
            aria-valuenow={totalProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Karriärplan framsteg: ${totalProgress}%`}
          >
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500 transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="text-xs text-teal-700 dark:text-teal-300 mt-2" role="status">
            {completedCount} av {milestones.length} milstolpar slutförda
          </p>
        </div>

        {/* Add Milestone Button */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingMilestone(true)}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Lägg till milstolpe
          </Button>
          <CalendarSync compact showSync={true} showUpcoming={false} />
        </div>

        {/* Add Milestone Form */}
        {isAddingMilestone && (
          <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-700 rounded-xl">
            <div className="grid gap-3">
              <input
                type="text"
                placeholder="Milstolpens titel"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tidsram (t.ex. Månad 1-2)"
                  value={newMilestone.timeframe}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
                />
                <input
                  type="date"
                  value={newMilestone.target_date}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, target_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
                />
              </div>
              <textarea
                placeholder="Steg (ett per rad)"
                value={newMilestone.steps}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, steps: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addMilestone} disabled={isSaving} className="bg-teal-500 hover:bg-teal-600">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingMilestone(false)}>Avbryt</Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6" role="region" aria-label="Tidslinje för karriärplan">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            Tidslinje för karriärplan
          </h4>

          <div className="relative pl-6" role="list" aria-label="Milstolpar">
            {milestones.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Inga milstolpar ännu.</p>
                <p className="text-sm">Klicka på "Lägg till milstolpe" för att komma igång.</p>
              </div>
            ) : milestones.map((milestone, index) => (
              <div key={milestone.id} className="mb-6 relative">
                {/* Timeline dot */}
                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white dark:bg-stone-800"
                  style={{
                    borderColor: milestone.is_completed ? '#14b8a6' : '#d1d5db',
                  }}
                >
                  {milestone.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                  )}
                </div>

                {/* Connector line */}
                {index < milestones.length - 1 && (
                  <div
                    className={cn(
                      "absolute -left-7 top-7 w-0.5 h-20 transition-colors",
                      milestone.is_completed ? "bg-teal-200 dark:bg-teal-700" : "bg-stone-200 dark:bg-stone-600"
                    )}
                  />
                )}

                {/* Milestone card */}
                <div
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    milestone.is_completed
                      ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-600'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-semibold',
                        milestone.is_completed ? 'text-teal-700 dark:text-teal-300 line-through' : 'text-gray-800 dark:text-gray-100'
                      )}>
                        {milestone.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs">
                        {milestone.timeframe && (
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {milestone.timeframe}
                          </span>
                        )}
                        {milestone.target_date && (
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(milestone.target_date).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleMilestone(milestone.id)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-colors flex-shrink-0',
                          milestone.is_completed
                            ? 'bg-teal-200 dark:bg-teal-800 text-teal-700 dark:text-teal-200'
                            : 'bg-stone-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                        )}
                        aria-pressed={milestone.is_completed}
                        aria-label={milestone.is_completed ? `Markera ${milestone.title} som ej klar` : `Markera ${milestone.title} som klar`}
                      >
                        {milestone.is_completed ? '✓ Klar' : 'Markera klar'}
                      </button>
                      <button
                        onClick={() => deleteMilestone(milestone.id)}
                        className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label={`Ta bort milstolpe: ${milestone.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!milestone.is_completed && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor={`progress-${milestone.id}`} className="text-xs text-gray-600 dark:text-gray-400">Framsteg</label>
                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400" aria-live="polite">{milestone.progress || 0}%</span>
                      </div>
                      <input
                        id={`progress-${milestone.id}`}
                        type="range"
                        min="0"
                        max="100"
                        value={milestone.progress || 0}
                        onChange={(e) => updateMilestoneProgress(milestone.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-200 dark:bg-stone-600 rounded-full appearance-none cursor-pointer accent-teal-500"
                        aria-label={`Framsteg för ${milestone.title}`}
                        aria-valuetext={`${milestone.progress || 0} procent`}
                      />
                    </div>
                  )}

                  {/* Steps */}
                  {milestone.steps && milestone.steps.length > 0 && (
                    <ul className="space-y-2">
                      {milestone.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <div className={cn(
                            'w-1.5 h-1.5 rounded-full flex-shrink-0',
                            milestone.is_completed ? 'bg-teal-400 dark:bg-teal-500' : 'bg-gray-400 dark:bg-gray-500'
                          )} />
                          {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={deletePlan}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('career.plan.updatePlan')}
        </Button>
      </Card>
    </div>
  )
}
