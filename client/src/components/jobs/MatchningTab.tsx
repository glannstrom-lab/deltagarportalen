/**
 * Matchningar — EN matchning, deltagarens faktorer (beslut Mikael 2026-10-18).
 *
 * Ersätter MatchesTab, som hade tre fristående matchningar (CV, intresseguide,
 * karriärmål) i tre flikar med tre poängskalor. Nu: deltagaren kryssar i vad som
 * räknas (FaktorPanel), valen sparas på kontot, och ALLA valda underlag söks och
 * poängsätts på en skala (services/matchning.ts). Varje träff visar sina skäl.
 *
 * Datakällorna är desamma som förut — CV, intresseguiden, profilens önskade yrken,
 * tillgänglighet och rörlighet — plus två som samlades in men aldrig användes:
 * branschen (consultant_data.targetIndustries) och yrken intresseguiden lämnat bort
 * för stora besvär. Besvären används bara i webbläsaren och skickas ingenstans.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, AlertCircle, Loader2, RefreshCw, SlidersHorizontal } from '@/components/ui/icons'
import type { PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { prefetchJobSearches, type MatchedJob } from '@/services/jobMatching'
import { aktivaFaktorer, faktorValApi, poangsatt, soktermer, type Faktor, type MatchUnderlag } from '@/services/matchning'
import { cvApi } from '@/services/cvApi'
import { userApi } from '@/services/userApi'
import { interestGuideApi } from '@/services/cloudStorage'
import { calculateUserProfile, calculateJobMatches, uteslutnaYrken } from '@/services/interestGuideData'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { Card, Button } from '@/components/ui'
import { LocationSelector } from './matches/LocationSelector'
import { MatchCard } from './matches/MatchCard'
import { MatchesEmptyState } from './matches/MatchesEmptyState'
import { FaktorPanel } from './matches/FaktorPanel'

const namn = (x: unknown): string | null =>
  typeof x === 'string' ? x : (x && typeof x === 'object' ? ((x as { name?: string; language?: string }).name || (x as { language?: string }).language || null) : null)

/** Läser allt matchningen kan räkna på. Kastar bara om CV:t inte går att läsa. */
async function lasUnderlag(): Promise<MatchUnderlag> {
  const [cv, intresse, profil, pref] = await Promise.all([
    cvApi.getCV(),
    interestGuideApi.getProgress().catch(() => null),
    unifiedProfileApi.getProfile().catch(() => null),
    userApi.getPreferences().catch(() => null),
  ])
  const kompetenser = [
    ...(cv?.skills ?? []).map(namn),
    ...(cv?.certificates ?? []).map(namn),
    ...(cv?.languages ?? []).map(namn),
  ].filter((x): x is string => !!x)
  const erfarenhet = (cv?.workExperience || (cv as { work_experience?: unknown[] } | null)?.work_experience || []) as Array<Record<string, string | undefined>>
  const tidigareYrken = erfarenhet.map((e) => e.title || e.position || e.role || e.job_title).filter((x): x is string => !!x)
  const utbildning = ((cv?.education ?? []) as Array<{ degree?: string; field?: string }>).map((e) => `${e.degree || ''} ${e.field || ''}`.trim()).filter(Boolean)

  let intresseYrken: string[] = []
  let uteslutna: string[] = []
  if (intresse?.is_completed && intresse.answers) {
    try {
      const p = calculateUserProfile(intresse.answers)
      if (p) {
        intresseYrken = calculateJobMatches(p).filter((m) => m.matchPercentage >= 50).slice(0, 15).map((m) => m.occupation.name)
        uteslutna = uteslutnaYrken(p).map((u) => u.occupation.name)
      }
    } catch (e) {
      console.error('Intresseguidens yrken kunde inte räknas:', e)
    }
  }

  const onskade = [...(pref?.desired_jobs ?? [])].sort((a, b) => a.priority - b.priority).map((j) => j.label)
  const branscher = [
    ...((pref?.consultant_data as { targetIndustries?: string[] } | undefined)?.targetIndustries ?? []),
    ...((pref?.work_preferences as { industries?: string[] } | undefined)?.industries ?? []),
  ]
  return {
    onskadeYrken: [...new Set([...onskade, ...(profil?.career?.preferredRoles ?? [])])],
    tidigareYrken,
    intresseYrken,
    kompetenser: [...new Set(kompetenser)],
    utbildning,
    uteslutnaYrken: uteslutna,
    branscher: [...new Set(branscher)],
    anstallningsformer: pref?.availability?.employmentTypes ?? [],
    distans: pref?.availability?.remoteWork ?? null,
    korkort: pref?.mobility?.driversLicense ?? [],
    harBil: !!pref?.mobility?.hasCar,
  }
}

type Lage = { status: 'laddar' } | { status: 'fel' } | { status: 'klart'; jobb: MatchedJob[] }

export function MatchningTab() {
  const { t } = useTranslation()
  const { saveJob, removeJob, isSaved } = useSavedJobs()
  const [underlag, setUnderlag] = useState<MatchUnderlag | null>(null)
  const [underlagFel, setUnderlagFel] = useState(false)
  const [av, setAv] = useState<Set<Faktor>>(new Set())
  const [valLaddade, setValLaddade] = useState(false)
  const [sparFel, setSparFel] = useState(false)
  const [orter, setOrter] = useState<string[]>([])
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })
  const [visaPanel, setVisaPanel] = useState(true)
  const [visaAlla, setVisaAlla] = useState(false)
  const omgang = useRef(0)

  const laddaUnderlag = useCallback(async () => {
    setUnderlagFel(false)
    try {
      const [u, sparade] = await Promise.all([lasUnderlag(), faktorValApi.hamta().catch(() => new Set<Faktor>())])
      setUnderlag(u)
      setAv(sparade)
    } catch (e) {
      console.error('Matchningens underlag kunde inte läsas:', e)
      setUnderlagFel(true)
    } finally {
      setValLaddade(true)
    }
  }, [])
  useEffect(() => { void laddaUnderlag() }, [laddaUnderlag])

  const aktiva = useMemo(() => (underlag ? aktivaFaktorer(underlag, av) : new Set<Faktor>()), [underlag, av])
  const termer = useMemo(() => (underlag ? soktermer(underlag, aktiva) : []), [underlag, aktiva])

  // Sök och poängsätt. Omgången skyddar mot att ett äldre svar skriver över ett nyare.
  useEffect(() => {
    if (!underlag || !valLaddade) return
    const denna = ++omgang.current
    if (termer.length === 0) { setLage({ status: 'klart', jobb: [] }); return }
    setLage({ status: 'laddar' })
    void (async () => {
      try {
        const hamtat = await prefetchJobSearches(termer, orter.length === 1 ? orter[0] : undefined)
        const basta = new Map<string, MatchedJob>()
        for (const term of termer) {
          let jobb = hamtat.get(term) ?? []
          if (orter.length > 1) jobb = jobb.filter((j) => orter.some((o) => j.workplace_address?.municipality?.toLowerCase().includes(o.toLowerCase())))
          for (const job of jobb) {
            const p = poangsatt(job, term, underlag, aktiva, t)
            if (!p) continue
            const fore = basta.get(job.id)
            if (!fore || p.score > fore.score) basta.set(job.id, { job, score: p.score, matchDetails: p.skal })
          }
        }
        if (denna !== omgang.current) return
        setLage({ status: 'klart', jobb: [...basta.values()].sort((a, b) => b.score - a.score).slice(0, 50) })
      } catch (e) {
        console.error('Matchningen kunde inte hämta jobb:', e)
        if (denna === omgang.current) setLage({ status: 'fel' })
      }
    })()
  }, [underlag, valLaddade, termer, aktiva, orter, t])

  useEffect(() => { setVisaAlla(false) }, [termer, orter, aktiva])

  const vaxla = (f: Faktor) => {
    const nytt = new Set(av)
    if (nytt.has(f)) nytt.delete(f); else nytt.add(f)
    setAv(nytt)
    setSparFel(false)
    faktorValApi.spara(nytt).catch((e) => { console.error('Faktorvalet kunde inte sparas:', e); setSparFel(true) })
  }

  const handleSave = async (job: PlatsbankenJob) => { if (isSaved(job.id)) await removeJob(job.id); else await saveJob(job) }

  const emptyLabels = {
    createProfileFirst: t('jobs.matches.createProfileFirst'),
    createProfileDesc: t('jobs.matches.createProfileDesc'),
    createCV: t('jobs.matches.createCV'),
    takeInterestGuide: t('jobs.matches.takeInterestGuide'),
    setCareerGoals: t('jobs.matches.setCareerGoals'),
    noJobsFound: t('jobs.matches.noJobsFound'),
  }

  if (!valLaddade) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="status">
        <Loader2 className="w-10 h-10 text-sky-600 animate-spin mb-4" aria-hidden="true" />
        <p className="text-stone-600 dark:text-stone-400">{t('jobs.matches.searching')}</p>
      </div>
    )
  }
  if (underlagFel || !underlag) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <p className="text-stone-700 dark:text-stone-300 mb-4">{t('jobs.matches.errorLoading')}</p>
        <Button onClick={() => void laddaUnderlag()}><RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />{t('common.tryAgain')}</Button>
      </Card>
    )
  }
  const harUnderlag = underlag.onskadeYrken.length + underlag.tidigareYrken.length + underlag.intresseYrken.length + underlag.kompetenser.length + underlag.utbildning.length > 0
  if (!harUnderlag) return <MatchesEmptyState type="no-data" labels={emptyLabels} />

  const jobb = lage.status === 'klart' ? lage.jobb : []
  const bra = jobb.filter((m) => m.score >= 50)
  const visade = visaAlla || bra.length === 0 ? jobb : bra
  const dolda = jobb.length - visade.length

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />
              {t('jobs.matches.title')}
            </h2>
            <p className="m-0 text-sm text-stone-700 dark:text-stone-300">{t('jobs.matches.faktor.intro')}</p>
          </div>
          <Button variant="outline" size="sm" aria-expanded={visaPanel} aria-controls="matchning-faktorer" onClick={() => setVisaPanel((v) => !v)}>
            <SlidersHorizontal className="w-4 h-4 mr-1" aria-hidden="true" />
            {visaPanel ? t('jobs.matches.faktor.dolj') : t('jobs.matches.faktor.visa', { antal: aktiva.size })}
          </Button>
        </div>
        {visaPanel && (
          <div id="matchning-faktorer">
            <FaktorPanel underlag={underlag} av={av} onVaxla={vaxla} sparFel={sparFel} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100 dark:border-stone-700">
          <span className="text-sm text-stone-600 dark:text-stone-400">{t('jobs.matches.locationsLabel')}:</span>
          <LocationSelector
            selected={orter}
            onChange={setOrter}
            labels={{
              allLocations: t('jobs.matches.allLocations'), location: t('jobs.matches.location'), locations: t('jobs.matches.locations'),
              searchLocation: t('jobs.matches.searchLocation'), noResults: t('jobs.matches.noResults'), clearAll: t('jobs.matches.clearAll'),
            }}
          />
        </div>
      </div>

      {termer.length === 0 ? (
        <p className="text-sm text-stone-700 dark:text-stone-300" role="status">{t('jobs.matches.faktor.ingetUnderlag')}</p>
      ) : lage.status === 'laddar' ? (
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400" role="status">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> {t('jobs.matches.searching')}
        </div>
      ) : lage.status === 'fel' ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{t('jobs.matches.errorLoading')}</p>
      ) : jobb.length === 0 ? (
        <MatchesEmptyState type="no-results" labels={emptyLabels} />
      ) : (
        <>
          <p className="m-0 text-sm text-stone-700 dark:text-stone-300" role="status">
            {t('jobs.matches.faktor.resultat', { antal: jobb.length, bra: bra.length, termer: termer.join(', ') })}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {visade.map((m) => (
              <MatchCard
                key={m.job.id}
                matchedJob={m}
                onSave={handleSave}
                isSaved={isSaved(m.job.id)}
                labels={{
                  match: t('jobs.matches.match'), levelStrong: t('jobs.matches.level.strong', 'Stark'), levelGood: t('jobs.matches.level.good', 'Bra'),
                  levelPossible: t('jobs.matches.level.possible', 'Möjlig'), cv: t('jobs.matches.sources.cv'), interest: t('jobs.matches.sources.interest'),
                  career: t('jobs.matches.sources.career'), unknownCompany: t('common.employerNotSpecified'), showMatchDetails: t('jobs.matches.showMatchDetails'),
                  matchesOn: t('jobs.matches.matchesOn'), apply: t('jobs.card.apply'),
                }}
              />
            ))}
          </div>
          {dolda > 0 && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setVisaAlla(true)}>{t('jobs.matches.showMoreMatches', { count: dolda })}</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MatchningTab
