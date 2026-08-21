/**
 * Allt tillstånd och alla sidoeffekter för kompetensanalysen.
 *
 * Bröts ut ur `SkillsGapAnalysis.tsx` (890 rader, en komponent, tolv
 * `useState`) 2026-08-21. Vinsten är inte kosmetisk: laddningen kunde inte
 * skilja "hämtade, tomt" från "kunde inte hämta", och det gick inte att
 * pröva utan att montera hela sidan.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cvApi } from '@/services/cvApi'
import type { CVData } from '@/services/supabaseApi'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import { safeParseAiResponse, KompetensgapSchema } from '@/services/aiSchemas'
import { useInterestProfile, formatRiasecForPrompt } from '@/hooks/useInterestProfile'
import { showToast } from '@/components/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import educationApi, { type Education } from '@/services/educationApi'
import {
  skillsAnalysisApi, careerPlanApi, milestonesApi, favoriteOccupationsApi,
  type SkillsAnalysis, type SkillComparison, type ActionPlanItem, type FavoriteOccupation
} from '@/services/careerApi'
import { formatProfileSummary, profiltackning, type Profiltackning } from './profilunderlag'
import { kortDromjobb } from './dromjobb'

/** Felsorter som kräver olika väg framåt för användaren. */
export type Felsort = 'ai-avstangd' | 'inloggning' | 'for-manga' | 'ai'

/** Samma mönster som `LinkedInOptimizer.tsx` och `CoverLetterWrite.tsx`.
 *  `callAI` kastar `AiConsentRequiredError` för AI-brytaren men platt
 *  `Error` för resten — tidigare svaldes skillnaden och den som stängt av AI
 *  fick "något gick fel, försök igen senare" i all evighet. */
export function tolkaAiFel(error: unknown): Felsort {
  if (error instanceof AiConsentRequiredError) return 'ai-avstangd'
  const text = error instanceof Error ? error.message : ''
  if (/inloggad|logga in|session/i.test(text)) return 'inloggning'
  if (/många förfrågningar|many requests/i.test(text)) return 'for-manga'
  return 'ai'
}

/** Utbildningslistans tre lägen. `'fel'` är inte samma sak som noll träffar. */
export type Utbildningslage = 'inte-hamtad' | 'hamtar' | 'klar' | 'fel'

export function useSkillsGap() {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirmDialog()
  const { profile: interestProfile } = useInterestProfile()

  const [cvData, setCvData] = useState<CVData | null>(null)
  const [profileSummary, setProfileSummary] = useState('')
  const [tackning, setTackning] = useState<Profiltackning | null>(null)

  const [dreamJob, setDreamJob] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState<SkillsAnalysis | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<SkillsAnalysis[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  /** Skilj "hämtade, tomt" från "kunde inte hämta". Fyra tysta `.catch()`
   *  gjorde ett nätverksfel identiskt med "du har inget CV" — och sidan bad
   *  då någon som har ett fullständigt CV att gå och fylla i det. */
  const [laddningsfel, setLaddningsfel] = useState<'cv' | 'analyser' | 'bada' | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<Felsort | null>(null)

  const [isAddingToPlan, setIsAddingToPlan] = useState(false)
  const [addedToPlan, setAddedToPlan] = useState(false)

  const [favoriteOccupations, setFavoriteOccupations] = useState<FavoriteOccupation[]>([])

  const [utbildningar, setUtbildningar] = useState<Education[]>([])
  const [utbildningslage, setUtbildningslage] = useState<Utbildningslage>('inte-hamtad')
  const [matchatYrke, setMatchatYrke] = useState<string | null>(null)

  /** Skyddar mot dubbla analyser om två klick hinner före en omrendering.
   *  `disabled` på knappen räcker inte — det vilar på renderingstajmning. */
  const analysPagar = useRef(false)

  const laddaAllt = useCallback(async () => {
    setIsLoading(true)
    setLaddningsfel(null)

    // `Promise.allSettled`, inte `Promise.all` med per-anrop-`.catch()`:
    // vi behöver veta VILKET anrop som föll, inte bara att listan blev tom.
    const [cvSvar, analysSvar, favoritSvar] = await Promise.allSettled([
      cvApi.getCV(),
      skillsAnalysisApi.getAll(),
      favoriteOccupationsApi.getAll(),
    ])

    const cvFel = cvSvar.status === 'rejected'
    const analysFel = analysSvar.status === 'rejected'

    if (!cvFel) {
      setCvData(cvSvar.value)
      setProfileSummary(formatProfileSummary(cvSvar.value))
      setTackning(profiltackning(cvSvar.value))
    }

    if (!analysFel) {
      setPreviousAnalyses(analysSvar.value)
      if (analysSvar.value.length > 0) setCurrentAnalysis(analysSvar.value[0])
    }

    // Favoriter är rena förslagschips — faller de bort är sidan hel.
    setFavoriteOccupations(favoritSvar.status === 'fulfilled' ? favoritSvar.value : [])

    if (cvFel && analysFel) setLaddningsfel('bada')
    else if (cvFel) setLaddningsfel('cv')
    else if (analysFel) setLaddningsfel('analyser')

    if (cvFel) console.error('Kompetensanalys: kunde inte hämta CV', cvSvar.reason)
    if (analysFel) console.error('Kompetensanalys: kunde inte hämta analyser', analysSvar.reason)

    setIsLoading(false)
  }, [])

  useEffect(() => { void laddaAllt() }, [laddaAllt])

  /** Hämtar riktiga utbildningar från Arbetsförmedlingens JobEd Connect.
   *  Ersätter de kurser AI:n hittade på — med arrangör, längd och pris. */
  const hamtaUtbildningar = useCallback(async (yrke: string) => {
    const etikett = kortDromjobb(yrke)
    if (!etikett) return

    setUtbildningslage('hamtar')
    setMatchatYrke(null)
    try {
      const svar = await educationApi.matchByJobTitle(etikett, { limit: 12 })
      if (svar.source === 'error') {
        setUtbildningar([])
        setUtbildningslage('fel')
        return
      }
      // JobEd svarar med samma utbildning en gång per kommun. Slå ihop på
      // titel så listan inte blir "Lagerarbetare, klassrum dag" tolv gånger.
      const settTitlar = new Set<string>()
      const unika = svar.educations.filter(u => {
        const nyckel = `${u.title}|${u.formLabel}`.toLowerCase()
        if (settTitlar.has(nyckel)) return false
        settTitlar.add(nyckel)
        return true
      })
      setUtbildningar(unika.slice(0, 6))
      setMatchatYrke(svar.matchedOccupation ?? null)
      setUtbildningslage('klar')
    } catch (err) {
      console.error('Kompetensanalys: kunde inte hämta utbildningar', err)
      setUtbildningar([])
      setUtbildningslage('fel')
    }
  }, [])

  // Hämta utbildningar för den analys som visas.
  useEffect(() => {
    if (!currentAnalysis?.dream_job) {
      setUtbildningar([])
      setUtbildningslage('inte-hamtad')
      return
    }
    void hamtaUtbildningar(currentAnalysis.dream_job)
  }, [currentAnalysis?.dream_job, hamtaUtbildningar])

  const analysera = useCallback(async () => {
    if (analysPagar.current) return
    if (!tackning?.racker || !dreamJob.trim()) return

    analysPagar.current = true
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAddedToPlan(false)

    try {
      const riasec = formatRiasecForPrompt(interestProfile.dominantTypes)
      const response = await callAI('kompetensgap', {
        cvText: profileSummary,
        dromjobb: dreamJob,
        ...(riasec ? { riasec } : {})
      })

      const parsed = safeParseAiResponse(KompetensgapSchema, response?.analys)
      if (!parsed.success || !parsed.data) {
        // Ärligt fel i stället för hårdkodade exempelresultat — ett påhittat
        // "resultat" är värre än inget för den som planerar sin utveckling.
        console.error('Kompetensgap: AI-svaret gick inte att validera:', parsed.error)
        setAnalysisError('ai')
        return
      }

      const skills: SkillComparison[] = parsed.data.skills
      const actionPlan: ActionPlanItem[] = (parsed.data.actionPlan ?? []).map((a, idx) => ({
        order: a.order ?? idx + 1,
        title: a.title,
        description: a.description || a.title
      }))

      const saved = await skillsAnalysisApi.create({
        dream_job: dreamJob,
        cv_text: profileSummary,
        match_percentage: parsed.data.matchPercentage,
        skills_comparison: skills,
        // Kurser begärs inte längre av modellen (se prompten i api/ai.js).
        recommended_courses: [],
        action_plan: actionPlan
      })
      setCurrentAnalysis(saved)
      setPreviousAnalyses(prev => [saved, ...prev])
    } catch (err) {
      console.error('Kompetensanalys: analysen gick inte att köra', err)
      setAnalysisError(tolkaAiFel(err))
    } finally {
      setIsAnalyzing(false)
      analysPagar.current = false
    }
  }, [dreamJob, interestProfile.dominantTypes, profileSummary, tackning])

  const raderaAnalys = useCallback(async (id: string) => {
    const bekraftat = await confirm({
      title: t('skillsGapAnalysis.confirmDeleteTitle'),
      message: t('skillsGapAnalysis.confirmDelete'),
      confirmText: t('common.delete'),
      variant: 'danger',
    })
    if (!bekraftat) return

    try {
      await skillsAnalysisApi.delete(id)
      const kvar = previousAnalyses.filter(a => a.id !== id)
      setPreviousAnalyses(kvar)
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(kvar.length > 0 ? kvar[0] : null)
      }
      showToast.success(t('skillsGapAnalysis.deleted'))
    } catch (err) {
      // Sväljdes tidigare med enbart console.error. En raderingsbegäran som
      // inte gick igenom och inte heller sa något är art. 17-relevant: den
      // som ber om radering ska få veta om den inte skedde.
      console.error('Kompetensanalys: kunde inte radera', err)
      showToast.error(t('skillsGapAnalysis.deleteFailed'))
    }
  }, [confirm, currentAnalysis?.id, previousAnalyses, t])

  const laggTillIKarriarplan = useCallback(async () => {
    if (!currentAnalysis) return
    setIsAddingToPlan(true)

    try {
      let plan = await careerPlanApi.getActive()

      if (!plan) {
        plan = await careerPlanApi.create({
          // Låg tidigare på `cv_text.substring(0, 200)` — alltså ett avhugget
          // CV-fragment som "nuvarande situation" i användarens karriärplan,
          // ofta mitt i en mening. Och tidsramen var hårdkodad till
          // "12 månader" utan att någon frågat.
          current_situation: t('skillsGapAnalysis.planSituation', {
            yrke: kortDromjobb(currentAnalysis.dream_job),
          }),
          goal: kortDromjobb(currentAnalysis.dream_job) || currentAnalysis.dream_job,
        })
      }

      const actionPlan = currentAnalysis.action_plan || []
      const befintliga = plan.milestones || []
      let tillagda = 0

      for (const item of actionPlan) {
        const finns = befintliga.some(m => m.title.toLowerCase() === item.title.toLowerCase())
        if (finns) continue
        await milestonesApi.create({
          plan_id: plan.id,
          title: item.title,
          description: item.description,
          steps: [item.description],
          sort_order: befintliga.length + item.order
        })
        tillagda++
      }

      setAddedToPlan(true)
      showToast.success(
        tillagda > 0
          ? t('skillsGapAnalysis.planAdded', { antal: tillagda })
          : t('skillsGapAnalysis.planAlreadyThere')
      )
    } catch (err) {
      // Föll tidigare tyst. Knappen slutade snurra, inget hände, och en
      // halvskriven plan kunde ligga kvar i molnet utan att någon sa det.
      console.error('Kompetensanalys: kunde inte lägga till i karriärplanen', err)
      showToast.error(t('skillsGapAnalysis.planFailed'))
    } finally {
      setIsAddingToPlan(false)
    }
  }, [currentAnalysis, t])

  const valjAnalys = useCallback((analysis: SkillsAnalysis) => {
    setCurrentAnalysis(analysis)
    setShowHistory(false)
    setAddedToPlan(false)
  }, [])

  const nyAnalys = useCallback(() => {
    setCurrentAnalysis(null)
    setDreamJob('')
    setAnalysisError(null)
    setAddedToPlan(false)
  }, [])

  const dateLocale = i18n.language === 'sv' ? 'sv-SE' : 'en-US'

  return {
    // underlag
    cvData, profileSummary, tackning,
    // analys
    dreamJob, setDreamJob, currentAnalysis, previousAnalyses,
    showHistory, setShowHistory,
    isLoading, laddningsfel, isAnalyzing, analysisError,
    // utbildningar
    utbildningar, utbildningslage, matchatYrke,
    // karriärplan
    isAddingToPlan, addedToPlan,
    favoriteOccupations,
    dateLocale,
    // handlingar
    analysera, raderaAnalys, laggTillIKarriarplan, valjAnalys, nyAnalys, laddaAllt,
  }
}
