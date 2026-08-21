/**
 * Plan Tab - Career plan with SMART goals and visual timeline (cloud storage)
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Target, MapPin, Flag, Calendar, CheckCircle, Clock,
  Sparkles, Plus, TrendingUp, AlertCircle,
  Zap, Trash2, Loader2, Heart, FileText
} from '@/components/ui/icons'
import { Card, Button, EmptyState } from '@/components/ui'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/Toast'
import { cn } from '@/lib/utils'
import { careerPlanApi, milestonesApi, favoriteOccupationsApi, type CareerPlan, type CareerMilestone, type FavoriteOccupation } from '@/services/careerApi'
import { CalendarSync } from '@/components/calendar/CalendarSync'
import { useProfileStore } from '@/stores/profileStore'
import { callAI } from '@/services/aiApi'
import { safeParseAiResponse, KarriarPlanSchema } from '@/services/aiSchemas'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { useInterestProfile, formatRiasecForPrompt } from '@/hooks/useInterestProfile'

export default function PlanTab() {
  const { t, i18n } = useTranslation()
  // Providern sitter i main.tsx. Den fristående `confirmDialog`-exporten är
  // bara en window.confirm-fallback — hooken ger projektets egen dialog.
  const { confirm } = useConfirmDialog()
  const { profile: interestProfile } = useInterestProfile()
  const [currentSituation, setCurrentSituation] = useState('')
  const [goal, setGoal] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [plan, setPlan] = useState<CareerPlan | null>(null)
  const [milestones, setMilestones] = useState<CareerMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  /**
   * Reglagets värde medan man drar. Tidigare gick varje `onChange` rakt till
   * databasen: ett drag 0→60 blev upp till 60 UPDATE plus 60 SELECT, och
   * svaren kunde landa ur ordning så ett äldre värde skrev över ett nyare.
   * Nu skrivs värdet en gång, när man släpper.
   */
  const [dragProgress, setDragProgress] = useState<Record<string, number>>({})
  const [showSMARTHelper, setShowSMARTHelper] = useState(false)
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [favoriteOccupations, setFavoriteOccupations] = useState<FavoriteOccupation[]>([])
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    timeframe: '',
    target_date: '',
    steps: ''
  })
  // B7 (2026-07-23): milstolparna AI-genereras nu på riktigt.
  // aiGenerated styr Art 50-märkningen; aiNotice visar ärligt när
  // AI-förslagen inte gick att hämta (planen skapas ändå, utan förslag).
  const [aiGenerated, setAiGenerated] = useState(false)
  const [aiNotice, setAiNotice] = useState<string | null>(null)

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

    // Desired jobs from preferences (sortera på priority + extrahera labels)
    const desiredJobs = [...(preferences?.desired_jobs || [])]
      .sort((a, b) => a.priority - b.priority)
      .map((j) => j.label)
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

  /**
   * Tre lägen krävs här, inte två. Tidigare loggades ett läsfel bara, och
   * `plan` blev `null` — vilket komponenten renderar som *skapa-formuläret*.
   * En användare med en befintlig plan fyllde då i på nytt, och
   * `careerPlanApi.create` avaktiverar den gamla planen. Ett nätverksfel
   * kostade alltså hela karriärplanen. `plan === null` (ingen plan) och
   * `loadError` (vi vet inte) måste hållas isär.
   */
  const loadData = async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
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
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePlan = async () => {
    if (!currentSituation.trim() || !goal.trim()) return
    setIsSaving(true)
    setAiNotice(null)
    try {
      const newPlan = await careerPlanApi.create({
        current_situation: currentSituation,
        goal,
        timeframe: timeframe || undefined
      })
      setPlan(newPlan)
      setMilestones([])

      // B7 (2026-07-23): riktig AI-generering av milstolpar utifrån
      // användarens situation/mål. Tidigare skapades tre hårdkodade
      // generiska milstolpar här oavsett input — presenterat som en
      // "genererad plan". Om AI:n inte kan leverera skapas planen utan
      // förslag och användaren får veta det ärligt (egna milstolpar
      // kan alltid läggas till manuellt).
      try {
        // G10: intresseprofilen med när den finns — en karriärplan som går
        // på tvärs mot vad personen dras till håller sällan.
        const riasec = formatRiasecForPrompt(interestProfile.dominantTypes)

        const response = await callAI('karriarplan', {
          currentSituation,
          goal,
          timeframe: timeframe || undefined,
          ...(riasec ? { riasec } : {})
        })
        const parsed = safeParseAiResponse(KarriarPlanSchema, response?.plan)
        if (!parsed.success || !parsed.data) {
          throw new Error(parsed.error || 'AI-svaret gick inte att validera')
        }

        const aiMilestones = parsed.data.steps
          .slice(0, 6)
          .map((step, idx) => ({
            plan_id: newPlan.id,
            title: step.title,
            description: step.description || undefined,
            timeframe: step.timeframe || undefined,
            steps: (step.actions ?? []).filter(a => a.trim()),
            sort_order: step.order ?? idx
          }))

        const createdMilestones = []
        for (const m of aiMilestones) {
          createdMilestones.push(await milestonesApi.create(m))
        }
        setMilestones(createdMilestones)
        setAiGenerated(true)
      } catch (aiErr) {
        console.error('Karriärplan: AI-förslagen kunde inte genereras:', aiErr)
        setAiNotice(t('career.plan.aiSuggestionsFailed'))
      }
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

  /** Skrivs när användaren släpper reglaget, inte per pixel. */
  const commitMilestoneProgress = async (id: string, progress: number) => {
    try {
      const updated = await milestonesApi.updateProgress(id, progress)
      setMilestones(prev => prev.map(m => m.id === id ? updated : m))
      const refreshedPlan = await careerPlanApi.getActive()
      if (refreshedPlan) setPlan(refreshedPlan)
    } catch (err) {
      console.error('Failed to update progress:', err)
      showToast.error(t('career.plan.saveFailed', 'Kunde inte spara framstegen'))
    } finally {
      setDragProgress(prev => {
        const nasta = { ...prev }
        delete nasta[id]
        return nasta
      })
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
      /*
        AI-märkningen ligger under HELA listan, inte per rad. Så fort
        användaren lägger till en egen milstolpe är listan inte längre
        AI-genererad, och att låta stämpeln stå kvar vore att märka
        användarens egna ord som AI-utdata (AI Act art. 50.2, i spegelvänd
        form mot mockGenerateLetter-felet). Kvar står den motsatta luckan: vid
        omladdning är `aiGenerated` false, så AI-genererade milstolpar visas
        omärkta. Att laga den kräver en `ai_generated`-kolumn på
        `career_milestones` — en migration mot prod, alltså Mikaels beslut.
      */
      setAiGenerated(false)
    } catch (err) {
      console.error('Failed to add milestone:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Native confirm() stod här: ostilad, hanterar inte fokus, kan vara
  // blockerad i webbläsaren, och texterna var hårdkodad svenska.
  const deleteMilestone = async (id: string) => {
    const ok = await confirm({
      title: t('career.plan.deleteMilestoneConfirmTitle'),
      message: t('career.plan.deleteMilestoneConfirmBody'),
      confirmText: t('career.plan.deleteMilestoneConfirmCta'),
      cancelText: t('career.plan.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await milestonesApi.delete(id)
      setMilestones(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error('Failed to delete milestone:', err)
      showToast.error(t('career.plan.deleteFailed', 'Kunde inte ta bort milstolpen'))
    }
  }

  const deletePlan = async () => {
    if (!plan) return
    const ok = await confirm({
      title: t('career.plan.deletePlanConfirmTitle'),
      message: t('career.plan.deletePlanConfirmBody'),
      confirmText: t('career.plan.deletePlanConfirmCta'),
      cancelText: t('career.plan.cancel'),
      variant: 'danger',
    })
    if (!ok) return
    try {
      await careerPlanApi.delete(plan.id)
      setPlan(null)
      setMilestones([])
      setCurrentSituation('')
      setGoal('')
      setTimeframe('')
      setAiGenerated(false)
    } catch (err) {
      console.error('Failed to delete plan:', err)
      showToast.error(t('career.plan.deleteFailed', 'Kunde inte ta bort planen'))
    }
  }

  const completedCount = milestones.filter(m => m.is_completed).length
  /**
   * Räknas ur milstolparna, inte ur `plan.total_progress`. Databastriggern
   * (`20260412100000_career_module_tables.sql`) kör på INSERT och UPDATE men
   * **inte** på DELETE, så kolumnen står kvar på gamla värdet när man raderar
   * de sista milstolparna. `||` valde dessutom det gamla värdet framför en
   * färsk nolla — resultatet blev "50 %" ovanför "0 av 0". Klienten har den
   * färska sanningen; använd den.
   */
  const totalProgress = milestones.length > 0
    ? Math.round(milestones.reduce((sum, m) => sum + (m.progress || 0), 0) / milestones.length)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)]" aria-hidden="true" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('career.plan.loading')}</span>
      </div>
    )
  }

  // Före skapa-formuläret: vet vi inte om en plan finns, visa inte ett
  // formulär som kan ersätta den.
  if (loadError) {
    return (
      <Card className="p-8 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('career.plan.loadErrorTitle')}
        </h3>
        <p className="text-stone-600 dark:text-stone-400 mb-4 max-w-md mx-auto">
          {t('career.plan.loadErrorBody')}
        </p>
        <Button onClick={loadData}>{t('career.plan.retry')}</Button>
      </Card>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('career.plan.createCareerPlan')}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('career.plan.describeWhere')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="plan-current-situation" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                {t('career.plan.whereAreYou')}
              </label>

              {/* Auto-fill from CV/Profile */}
              {hasProfileData && !currentSituation && (
                <div className="mb-3 p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg border border-[var(--c-accent)]">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-solid)] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)] mb-2">
                        {i18n.language === 'en'
                          ? 'We found information from your CV and profile:'
                          : 'Vi hittade information från ditt CV och din profil:'}
                      </p>
                      <p className="text-xs text-[var(--c-text)] dark:text-[var(--c-solid)] mb-3 line-clamp-3">
                        {generatedSituation}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={autoFillCurrentSituation}
                        className="border-[var(--c-accent)] dark:border-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-solid)] hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/20"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {i18n.language === 'en' ? 'Use this information' : 'Använd denna information'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                id="plan-current-situation"
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                placeholder={t('career.plan.currentPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] resize-y text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="plan-goal" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-text)]" aria-hidden="true" />
                {t('career.plan.whereWantToGo')}
              </label>

              {/* Favorite occupations suggestions */}
              {favoriteOccupations.length > 0 && !goal && (
                <div className="mb-3 p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
                  <div className="flex items-center gap-2 text-sm text-[var(--c-text)] dark:text-[var(--c-text)] mb-2">
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
                        className="px-3 py-1.5 text-sm bg-white dark:bg-stone-700 rounded-full border border-[var(--c-accent)] dark:border-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/40 transition-colors"
                      >
                        {fav.occupation_title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                id="plan-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('career.plan.goalPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] resize-y text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="plantab-f1" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                Tidsram (valfritt)
              </label>
              <input
                id="plantab-f1"
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="T.ex. 6 månader, 1 år"
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100"
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
                aria-label={t('career.plan.smartHelperLabel')}
                aria-expanded={showSMARTHelper}
                aria-controls="smart-helper"
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>

        {showSMARTHelper && (
          <Card id="smart-helper" className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 border-2 border-[var(--c-accent)] dark:border-[var(--c-accent)]/40">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[var(--c-text)] dark:text-[var(--c-solid)] mb-2">SMART-mål hjälpare</h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
                  Se till att ditt mål är Specifikt, Mätbart, Uppnåeligt, Relevant och Tidsbundet:
                </p>
                <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
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
              <CheckCircle className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-text)] mt-0.5" />
              {t('career.plan.reason1')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-text)] mt-0.5" />
              {t('career.plan.reason2')}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-text)] mt-0.5" />
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
          <div className="w-12 h-12 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('career.plan.yourCareerPlan')}</h3>
            <p className="text-gray-600 dark:text-gray-300"><strong>{t('career.plan.from')}:</strong> {plan.current_situation}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>{t('career.plan.to')}:</strong> {plan.goal}</p>
            {/*
              Tidsramen slås upp mot en etikett. Fokuslägets guide skriver
              slugen `5_years`, så här stod bokstavligen "Tidsram: 5_years".
              Är slugen okänd visas den råa strängen — den kan vara något
              användaren själv skrivit.
            */}
            {plan.timeframe && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                <strong>{t('career.plan.timeframeLabel')}:</strong>{' '}
                {t(`career.plan.timeframes.${plan.timeframe}`, { defaultValue: plan.timeframe })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={deletePlan}
            aria-label={t('career.plan.deletePlanLabel')}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {/*
          Progresskortet visade tidigare ett stort "0%" och "0 av 0 milstolpar
          slutförda" innan användaren hunnit lägga till något — särskilt när
          AI-förslagen fallerat. Ett tomt fält är inte en nolla (DESIGN.md §2).
          Utan milstolpar visas en invit i stället.
        */}
        <div
          className="mb-6 p-4 bg-[var(--c-bg)] rounded-xl border border-[var(--c-accent)]/60"
          role="region"
          aria-label={t('career.plan.overallProgress')}
        >
          {milestones.length === 0 ? (
            <p className="text-sm text-stone-700 dark:text-stone-300">
              {t('career.plan.noProgressYet')}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {t('career.plan.overallProgress')}
                  </span>
                </div>
                <span className="text-2xl font-bold text-[var(--c-text)] tabular-nums" aria-live="polite">
                  {totalProgress} %
                </span>
              </div>
              <div
                className="h-3 bg-white dark:bg-stone-700 rounded-full overflow-hidden border border-[var(--c-accent)]/60"
                role="progressbar"
                aria-valuenow={totalProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('career.plan.overallProgress')}
              >
                <div
                  className="h-full bg-[var(--c-solid)] transition-all duration-500"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--c-text)] mt-2" role="status">
                {t('career.plan.milestonesDone', { done: completedCount, total: milestones.length })}
              </p>
            </>
          )}
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
            {t('career.plan.addMilestone')}
          </Button>
          <CalendarSync compact showSync={true} showUpcoming={false} />
        </div>

        {/* Add Milestone Form */}
        {isAddingMilestone && (
          <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-700 rounded-xl">
            <div className="grid gap-3">
              <input
                type="text"
                aria-label={t('career.plan.milestoneTitleLabel')}
                placeholder={t('career.plan.milestoneTitleLabel')}
                value={newMilestone.title}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  aria-label={t('career.plan.milestoneTimeframeLabel')}
                  placeholder={t('career.plan.milestoneTimeframePlaceholder')}
                  value={newMilestone.timeframe}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
                />
                <input
                  type="date"
                  aria-label={t('career.plan.milestoneDateLabel')}
                  value={newMilestone.target_date}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, target_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
                />
              </div>
              <textarea
                aria-label={t('career.plan.milestoneStepsLabel')}
                placeholder={t('career.plan.milestoneStepsLabel')}
                value={newMilestone.steps}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, steps: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addMilestone} disabled={isSaving} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingMilestone(false)}>Avbryt</Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6" role="region" aria-label={t('career.plan.timelineHeading')}>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
            {t('career.plan.timelineHeading')}
          </h4>

          {aiNotice && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" role="status">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-800 dark:text-amber-200">{aiNotice}</p>
            </div>
          )}

          {/* EmptyState låg tidigare INUTI role="list", vilket annonseras som
              en tom lista. Nu ligger den utanför, och listan får riktiga
              listitems. */}
          {milestones.length === 0 ? (
            <EmptyState
              compact
              illustration="karriar"
              title={t('career.plan.emptyMilestonesTitle')}
              description={t('career.plan.emptyMilestonesBody')}
              action={{
                label: t('career.plan.addMilestone'),
                onClick: () => setIsAddingMilestone(true),
              }}
            />
          ) : (
          <div className="relative pl-6" role="list" aria-label={t('career.plan.timelineHeading')}>
            {milestones.map((milestone, index) => (
              <div key={milestone.id} role="listitem" className="mb-6 relative">
                {/* Timeline dot */}
                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white dark:bg-stone-800"
                  style={{
                    borderColor: milestone.is_completed ? 'var(--c-solid)' : 'var(--c-accent)',
                  }}
                >
                  {milestone.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                  )}
                </div>

                {/* Connector line */}
                {index < milestones.length - 1 && (
                  <div
                    className={cn(
                      "absolute -left-7 top-7 w-0.5 h-20 transition-colors",
                      milestone.is_completed ? "bg-[var(--c-accent)]/60 dark:bg-[var(--c-solid)]/80" : "bg-stone-200 dark:bg-stone-600"
                    )}
                  />
                )}

                {/* Milestone card */}
                <div
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    milestone.is_completed
                      ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-solid)]'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-semibold',
                        milestone.is_completed ? 'text-[var(--c-text)] dark:text-[var(--c-text)] line-through' : 'text-gray-800 dark:text-gray-100'
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
                            ? 'bg-[var(--c-accent)]/60 dark:bg-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-text)]'
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
                        <label htmlFor={`progress-${milestone.id}`} className="text-xs text-gray-600 dark:text-gray-400">
                          {t('career.plan.progressLabel')}
                        </label>
                        <span className="text-xs font-semibold text-[var(--c-text)] tabular-nums" aria-live="polite">
                          {dragProgress[milestone.id] ?? milestone.progress ?? 0} %
                        </span>
                      </div>
                      <input
                        id={`progress-${milestone.id}`}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={dragProgress[milestone.id] ?? milestone.progress ?? 0}
                        onChange={(e) =>
                          setDragProgress(prev => ({ ...prev, [milestone.id]: Number(e.target.value) }))
                        }
                        onPointerUp={(e) =>
                          commitMilestoneProgress(milestone.id, Number(e.currentTarget.value))
                        }
                        onBlur={(e) => {
                          if (dragProgress[milestone.id] !== undefined) {
                            commitMilestoneProgress(milestone.id, Number(e.currentTarget.value))
                          }
                        }}
                        className="w-full h-2 bg-stone-200 dark:bg-stone-600 rounded-full appearance-none cursor-pointer accent-[var(--c-solid)]"
                        aria-label={t('career.plan.progressFor', { title: milestone.title })}
                        aria-valuetext={`${dragProgress[milestone.id] ?? milestone.progress ?? 0} %`}
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
                            milestone.is_completed ? 'bg-[var(--c-solid)]/80 dark:bg-[var(--c-solid)]' : 'bg-gray-400 dark:bg-gray-500'
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
          )}

          {/* Art 50: milstolparna genererades av AI i denna session */}
          {aiGenerated && milestones.length > 0 && (
            <AIGeneratedWatermark contentType="karriärplan" />
          )}
        </div>

        {/* Knappen hette "Uppdatera plan", bar en plusikon och raderade
            planen. Nu säger den vad den gör; bekräftelsedialogen är samma som
            papperskorgen ovanför. */}
        <Button variant="outline" className="w-full" onClick={deletePlan}>
          <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
          {t('career.plan.startOver')}
        </Button>
      </Card>
    </div>
  )
}
