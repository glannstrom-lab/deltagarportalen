/**
 * Flytta — jämför städer, se vad hyran tar av lönen, håll ordning på flytten.
 *
 * Granskad 2026-08-21. Det som var fel:
 *
 * · **Nettolönen var en schablon.** `monthlySalary * 0.7` bar hela hyresandelen,
 *   "överkomlig"-bedömningen och sammanfattningen. Vid 25 000 kr är den
 *   faktiska nettoandelen ca 78–80 %, så hyresandelen överdrevs med ungefär
 *   tolv procentenheter och städer klassades felaktigt som för dyra. Samma
 *   schablon revs ur lönesidan 2026-08-20 (`00d8be26`) och ersattes av
 *   `lib/skatt.ts`. Den importeras nu även här.
 * · **Fyrtioåtta påståenden utan källa.** Tolv städer × hyra, lön, kötid,
 *   jobbmarknad. `avgSalary` motsade dessutom portalens egen lönesida
 *   (Stockholm 48 000 här mot 47 150 ur `lonedata.ts`) — kolumnen är borttagen,
 *   lönefrågan ägs av /salary. `jobMarket` var etiketter ingen mätt ("Mycket
 *   stark", "God") och är ersatt av Arbetsförmedlingens verkliga antal
 *   publicerade annonser per kommun. Hyra och kötid finns kvar, men ligger i
 *   `data/flyttdata.ts` med ett datum och en stämpel i gränssnittet som säger
 *   exakt vad de är.
 * · **"Infinity%".** Lön 0 gav `Math.round(hyra / 0 * 100)` rakt ut i tabellen
 *   och i "Bäst alternativ: Sundsvall (Infinity% av inkomst)".
 * · **Ett hämtningsfel raderade användarens data.** `catch` loggade, `finally`
 *   släckte spinnern, och nästa klick lät autosparet skriva det tomma
 *   tillståndet över molnet. Nu blockerar ett läsfel sparningen helt.
 * · **Målstäderna gick inte att välja med tangentbord** — `<tr onClick>` utan
 *   roll, tabindex eller namn, och ett hjärta utan text som enda signal.
 * · **Skiftlägesbugg:** `jobMarket.includes('stark')` matchade aldrig "Stark".
 *
 * Regeln som gäller: ett tal utan underlag visar vad det är, eller visas inte.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Home, MapPin, Calculator, ExternalLink, CheckCircle,
  AlertCircle, Loader2, Cloud, CloudOff, Heart, Info,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { relocationApi } from '@/services/careerApi'
import { unifiedProfileApi } from '@/services/unifiedProfileApi'
import { trendsApi } from '@/services/afTrendsApi'
import { showToast } from '@/components/Toast'
import { beraknaNetto, KOMMUNALSKATT_RIKSGENOMSNITT, SKATTEAR } from '@/lib/skatt'
import {
  FLYTTREGIONER,
  BOSTADSSAJTER,
  FLYTTCHECKLISTA,
  UPPGIFTERNA_ANGAVS,
  hittaFlyttregion,
} from '@/data/flyttdata'

/** Tumregeln som fotnoten anger. Hyran bör inte ta mer än så av nettot. */
const RIMLIG_HYRESANDEL = 30

/** AF:s stödöversikt A–Ö. Kontrollerad 2026-08-21 → HTTP 200. */
const AF_STOD_AO = 'https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o'

interface Overkomlighet {
  netto: number
  andel: number
  kvar: number
  rimlig: boolean
}

export default function RelocationTab() {
  const { t } = useTranslation()

  const [targetRegions, setTargetRegions] = useState<string[]>([])
  const [currentRegion, setCurrentRegion] = useState<string>('')
  const [salary, setSalary] = useState<string>('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [profileLocation, setProfileLocation] = useState<string>('')

  /** Verkliga annonsantal per kommun från Arbetsförmedlingen. */
  const [jobbPerStad, setJobbPerStad] = useState<Record<string, number>>({})

  const [isLoading, setIsLoading] = useState(true)
  /**
   * Tredje läget. `isLoading === false` räckte inte: efter ett läsfel såg ett
   * tomt tillstånd exakt ut som "du har inte fyllt i något än", och autosparet
   * skrev sedan tomheten över molnet.
   */
  const [loadError, setLoadError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  /** Sätts när ett spar begärdes medan ett annat pågick, så inget tappas. */
  const pendingSave = useRef(false)

  useEffect(() => {
    let avbruten = false

    const loadData = async () => {
      try {
        const prefs = await relocationApi.get()
        if (avbruten) return
        if (prefs) {
          setTargetRegions(prefs.target_regions || [])
          setCurrentRegion(prefs.current_region || '')
          setSalary(prefs.expected_salary?.toString() || '')
          setCheckedItems(prefs.checklist_completed || [])
          setLastSaved(new Date(prefs.updated_at))
        }

        const profile = await unifiedProfileApi.getProfile()
        if (avbruten) return
        const ort = profile?.core?.location
        if (ort) {
          setProfileLocation(ort)
          if (!prefs?.current_region) {
            const traff = FLYTTREGIONER.find((r) =>
              ort.toLowerCase().includes(r.namn.toLowerCase())
            )
            if (traff) setCurrentRegion(traff.id)
          }
        }
      } catch (err) {
        console.error('Failed to load relocation data:', err)
        if (!avbruten) setLoadError(true)
      } finally {
        if (!avbruten) setIsLoading(false)
      }
    }

    loadData()
    return () => { avbruten = true }
  }, [])

  /**
   * Jobbsiffrorna hämtas separat och får falla för sig. Går AF ner ska
   * flyttplanen fortfarande gå att använda — kolumnen visar då att siffran
   * inte hämtats, inte en nolla.
   */
  useEffect(() => {
    let avbruten = false
    trendsApi
      .getPopularSearches('municipalities', 30)
      .then((kommuner) => {
        if (avbruten) return
        const karta: Record<string, number> = {}
        for (const k of kommuner) {
          const region = FLYTTREGIONER.find((r) => r.namn === k.term)
          if (region && typeof k.count === 'number') karta[region.id] = k.count
        }
        setJobbPerStad(karta)
      })
      .catch((err) => console.error('Kunde inte hämta jobbsiffror per kommun:', err))
    return () => { avbruten = true }
  }, [])

  const saveToCloud = useCallback(async () => {
    if (loadError) return // skriv aldrig över molnet med ett tillstånd vi inte läst
    if (isSaving) { pendingSave.current = true; return }

    setIsSaving(true)
    try {
      await relocationApi.save({
        target_regions: targetRegions,
        // null, inte undefined: undefined faller bort ur JSON och lämnade det
        // gamla värdet kvar i databasen, så ett tömt fält kom tillbaka.
        current_region: currentRegion || null,
        expected_salary: salary.trim() === '' ? null : Number(salary),
        checklist_completed: checkedItems,
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Failed to save:', err)
      showToast.error(t('career.relocation.saveFailed'))
    } finally {
      setIsSaving(false)
      if (pendingSave.current) {
        pendingSave.current = false
        setHasUnsavedChanges(true) // triggar om debouncen nedan
      }
    }
  }, [targetRegions, currentRegion, salary, checkedItems, isSaving, loadError, t])

  useEffect(() => {
    if (!hasUnsavedChanges || isLoading || loadError) return
    const timer = setTimeout(() => { saveToCloud() }, 2000)
    return () => clearTimeout(timer)
  }, [targetRegions, currentRegion, salary, checkedItems, hasUnsavedChanges, isLoading, loadError, saveToCloud])

  const toggleTargetRegion = (regionId: string) => {
    setTargetRegions((prev) =>
      prev.includes(regionId) ? prev.filter((r) => r !== regionId) : [...prev, regionId]
    )
    setHasUnsavedChanges(true)
  }

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
    setHasUnsavedChanges(true)
  }

  /**
   * Nettolönen. `beraknaNetto` returnerar null för indata som inte går att
   * räkna på — ett tomt eller orimligt fält ska visa ingenting, inte en
   * påhittad siffra. Det är den vakten som gjorde "Infinity%" omöjlig.
   */
  const nettoUppgift = useMemo(() => {
    const brutto = Number(salary)
    if (!Number.isFinite(brutto) || brutto <= 0) return null
    return beraknaNetto(brutto)
  }, [salary])

  const overkomlighet = useCallback(
    (regionId: string): Overkomlighet | null => {
      const region = hittaFlyttregion(regionId)
      if (!region || !nettoUppgift || nettoUppgift.nettoManad <= 0) return null
      const andel = Math.round((region.uppskattadHyra / nettoUppgift.nettoManad) * 100)
      return {
        netto: nettoUppgift.nettoManad,
        andel,
        kvar: nettoUppgift.nettoManad - region.uppskattadHyra,
        rimlig: andel <= RIMLIG_HYRESANDEL,
      }
    },
    [nettoUppgift]
  )

  const bastaVal = useMemo(() => {
    if (targetRegions.length === 0 || !nettoUppgift) return null
    const kandidater = targetRegions
      .map((id) => ({ id, o: overkomlighet(id) }))
      .filter((k): k is { id: string; o: Overkomlighet } => k.o !== null)
      .sort((a, b) => a.o.andel - b.o.andel)
    if (kandidater.length === 0) return null
    return { region: hittaFlyttregion(kandidater[0].id), ...kandidater[0].o }
  }, [targetRegions, nettoUppgift, overkomlighet])

  /** Klampad: gamla id i `checklist_completed` kunde annars ge över 100 %. */
  const giltigaKryss = checkedItems.filter((id) =>
    FLYTTCHECKLISTA.some((p) => p.id === id)
  ).length
  const checklistProgress = Math.round((giltigaKryss / FLYTTCHECKLISTA.length) * 100)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)]" aria-hidden="true" />
        <span className="ml-3 text-stone-600 dark:text-stone-400">
          {t('career.relocation.loading')}
        </span>
      </div>
    )
  }

  if (loadError) {
    return (
      <Card className="p-8 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('career.relocation.loadErrorTitle')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mb-4 max-w-md mx-auto">
          {t('career.relocation.loadErrorBody')}
        </p>
        <Button onClick={() => window.location.reload()}>
          {t('career.relocation.retry')}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sparstatus — annonseras, inte bara färgad */}
      <div className="flex items-center justify-end gap-2 text-sm min-h-6" role="status" aria-live="polite">
        {isSaving ? (
          <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            {t('career.relocation.saving')}
          </span>
        ) : hasUnsavedChanges ? (
          <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
            <CloudOff className="w-4 h-4" aria-hidden="true" />
            {t('career.relocation.unsaved')}
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1 text-[var(--c-text)]">
            <Cloud className="w-4 h-4" aria-hidden="true" />
            {t('career.relocation.saved')}
          </span>
        ) : null}
      </div>

      {/* Rubrik. Pastellbandet med ikonruta togs bort — skenan säger redan
          vilken sida det är, och DESIGN.md §3 räknar upprepningen som en
          kvarglömd hjälte. */}
      <div>
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
          {t('career.relocation.heading')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          {t('career.relocation.intro')}
        </p>
        {profileLocation && (
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 flex items-center gap-1">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            {t('career.relocation.fromProfile')} <strong>{profileLocation}</strong>
          </p>
        )}
      </div>

      {/* Sammanfattning — visas bara när det finns något att sammanfatta */}
      {(targetRegions.length > 0 || giltigaKryss > 0) && (
        <Card className="p-4 bg-[var(--c-bg)] border-[var(--c-accent)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                {t('career.relocation.planTitle')}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {targetRegions.length > 0 && t('career.relocation.planRegions', { count: targetRegions.length })}
                {targetRegions.length > 0 && giltigaKryss > 0 && ' • '}
                {giltigaKryss > 0 && t('career.relocation.planChecklist', {
                  count: giltigaKryss,
                  total: FLYTTCHECKLISTA.length,
                })}
              </p>
            </div>
            {bastaVal?.region && (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--c-accent)]/40 text-[var(--c-text)]">
                {bastaVal.region.namn} — {bastaVal.andel} % {t('career.relocation.colShare').toLowerCase()}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Budget */}
      <Card className="p-6">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('career.relocation.budgetTitle')}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {t('career.relocation.budgetIntro')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="flytt-lon" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              {t('career.relocation.salaryLabel')}
            </label>
            <input
              id="flytt-lon"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={salary}
              onChange={(e) => { setSalary(e.target.value); setHasUnsavedChanges(true) }}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] text-stone-800 dark:text-stone-100"
              placeholder="30000"
            />
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              {t('career.relocation.salaryHelp')}{' '}
              <Link to="/salary" className="text-[var(--c-text)] underline">
                {t('career.relocation.salaryLink')}
              </Link>
            </p>
          </div>
          <div>
            <label htmlFor="flytt-nuvarande" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              {t('career.relocation.currentRegionLabel')}
            </label>
            <select
              id="flytt-nuvarande"
              value={currentRegion}
              onChange={(e) => { setCurrentRegion(e.target.value); setHasUnsavedChanges(true) }}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] text-stone-800 dark:text-stone-100"
            >
              <option value="">{t('career.relocation.choose')}</option>
              {FLYTTREGIONER.map((r) => (
                <option key={r.id} value={r.id}>{r.namn}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Räkningen redovisas — antaganden och allt. Tidigare räknades
            `afterTax` ut och kastades utan att någonsin visas. */}
        {nettoUppgift && (
          <p className="text-sm text-stone-700 dark:text-stone-300 mt-4 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-[var(--c-solid)]" aria-hidden="true" />
            {t('career.relocation.netExplained', {
              netto: nettoUppgift.nettoManad.toLocaleString('sv-SE'),
              skatt: KOMMUNALSKATT_RIKSGENOMSNITT,
              ar: SKATTEAR,
            })}
          </p>
        )}
      </Card>

      {/* Jämför städer */}
      <Card className="p-6">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('career.relocation.compareTitle')}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {t('career.relocation.compareHint')}
        </p>

        {/* Desktop: tabell. Mobil: kort — de två sista kolumnerna låg tidigare
            utanför en overflow-container utan scroll-affordans och var i
            praktiken osynliga på 390 px. */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">{t('career.relocation.compareTitle')}</caption>
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-600 text-left text-sm font-medium text-stone-700 dark:text-stone-300">
                <th scope="col" className="py-3 px-2">{t('career.relocation.colCity')}</th>
                <th scope="col" className="py-3 px-2">{t('career.relocation.colRent')}</th>
                <th scope="col" className="py-3 px-2">{t('career.relocation.colQueue')}</th>
                <th scope="col" className="py-3 px-2">{t('career.relocation.colJobs')}</th>
                {nettoUppgift && <th scope="col" className="py-3 px-2">{t('career.relocation.colShare')}</th>}
                {nettoUppgift && <th scope="col" className="py-3 px-2">{t('career.relocation.colLeft')}</th>}
              </tr>
            </thead>
            <tbody>
              {FLYTTREGIONER.map((region) => {
                const isTarget = targetRegions.includes(region.id)
                const isCurrent = currentRegion === region.id
                const o = overkomlighet(region.id)
                const jobb = jobbPerStad[region.id]

                return (
                  <tr
                    key={region.id}
                    className={cn(
                      'border-b border-stone-100 dark:border-stone-700',
                      (isTarget || isCurrent) && 'bg-[var(--c-bg)]'
                    )}
                  >
                    <th scope="row" className="py-2 px-2 text-left font-normal">
                      {/* Riktig knapp: nåbar med tangentbord, har namn, har
                          tillstånd. Tidigare låg klicket på <tr> och enda
                          signalen var ett fyllt kontra tomt hjärta. */}
                      <button
                        type="button"
                        onClick={() => toggleTargetRegion(region.id)}
                        aria-pressed={isTarget}
                        className="inline-flex items-center gap-2 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
                      >
                        <Heart
                          className={cn(
                            'w-5 h-5 shrink-0',
                            isTarget ? 'text-[var(--c-solid)] fill-current' : 'text-stone-500 dark:text-stone-400'
                          )}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-stone-800 dark:text-stone-100">{region.namn}</span>
                        <span className="sr-only">
                          {t(isTarget ? 'career.relocation.unpickCity' : 'career.relocation.pickCity', { city: region.namn })}
                        </span>
                      </button>
                      {isCurrent && (
                        <span className="ml-2 text-xs bg-[var(--c-accent)]/40 text-[var(--c-text)] px-1.5 py-0.5 rounded">
                          {t('career.relocation.youLiveHere')}
                        </span>
                      )}
                    </th>
                    <td className="py-2 px-2 text-stone-700 dark:text-stone-300 tabular-nums">
                      {region.uppskattadHyra.toLocaleString('sv-SE')} kr
                    </td>
                    <td className="py-2 px-2 text-stone-700 dark:text-stone-300">{region.uppskattadKotid}</td>
                    <td className="py-2 px-2 text-stone-700 dark:text-stone-300 tabular-nums">
                      {typeof jobb === 'number'
                        ? jobb.toLocaleString('sv-SE')
                        : <span className="text-stone-500 dark:text-stone-400">{t('career.relocation.jobsUnavailable')}</span>}
                    </td>
                    {nettoUppgift && (
                      <td className="py-2 px-2 tabular-nums">
                        <span className={cn('font-semibold', o?.rimlig ? 'text-[var(--c-text)]' : 'text-stone-800 dark:text-stone-100')}>
                          {o ? `${o.andel} %` : '—'}
                        </span>
                      </td>
                    )}
                    {nettoUppgift && (
                      <td className="py-2 px-2 text-stone-700 dark:text-stone-300 tabular-nums">
                        {o ? `${o.kvar.toLocaleString('sv-SE')} kr` : '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ul className="sm:hidden space-y-2">
          {FLYTTREGIONER.map((region) => {
            const isTarget = targetRegions.includes(region.id)
            const isCurrent = currentRegion === region.id
            const o = overkomlighet(region.id)
            const jobb = jobbPerStad[region.id]

            return (
              <li key={region.id}>
                <button
                  type="button"
                  onClick={() => toggleTargetRegion(region.id)}
                  aria-pressed={isTarget}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-colors',
                    isTarget || isCurrent
                      ? 'bg-[var(--c-bg)] border-[var(--c-accent)]'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Heart
                      className={cn('w-5 h-5 shrink-0', isTarget ? 'text-[var(--c-solid)] fill-current' : 'text-stone-500 dark:text-stone-400')}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-stone-800 dark:text-stone-100">{region.namn}</span>
                    {isCurrent && (
                      <span className="text-xs bg-[var(--c-accent)]/40 text-[var(--c-text)] px-1.5 py-0.5 rounded">
                        {t('career.relocation.youLiveHere')}
                      </span>
                    )}
                    <span className="sr-only">
                      {t(isTarget ? 'career.relocation.unpickCity' : 'career.relocation.pickCity', { city: region.namn })}
                    </span>
                  </span>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-stone-600 dark:text-stone-400">{t('career.relocation.colRent')}</dt>
                    <dd className="text-stone-800 dark:text-stone-100 tabular-nums">{region.uppskattadHyra.toLocaleString('sv-SE')} kr</dd>
                    <dt className="text-stone-600 dark:text-stone-400">{t('career.relocation.colQueue')}</dt>
                    <dd className="text-stone-800 dark:text-stone-100">{region.uppskattadKotid}</dd>
                    <dt className="text-stone-600 dark:text-stone-400">{t('career.relocation.colJobs')}</dt>
                    <dd className="text-stone-800 dark:text-stone-100 tabular-nums">
                      {typeof jobb === 'number' ? jobb.toLocaleString('sv-SE') : t('career.relocation.jobsUnavailable')}
                    </dd>
                    {o && (
                      <>
                        <dt className="text-stone-600 dark:text-stone-400">{t('career.relocation.colShare')}</dt>
                        <dd className="text-stone-800 dark:text-stone-100 tabular-nums">{o.andel} %</dd>
                        <dt className="text-stone-600 dark:text-stone-400">{t('career.relocation.colLeft')}</dt>
                        <dd className="text-stone-800 dark:text-stone-100 tabular-nums">{o.kvar.toLocaleString('sv-SE')} kr</dd>
                      </>
                    )}
                  </dl>
                </button>
              </li>
            )
          })}
        </ul>

        {!nettoUppgift && (
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-4">
            {t('career.relocation.needSalary')}
          </p>
        )}

        {/* Stämpeln. Utan den kunde talen ligga i tre år utan att någon
            reagerade — jfr ValideringTab på /international. */}
        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-700 space-y-2 text-xs text-stone-600 dark:text-stone-400">
          <p>{t('career.relocation.estimateNote', { datum: UPPGIFTERNA_ANGAVS })}</p>
          <p>
            {t('career.relocation.estimateSources')}{' '}
            <a href="https://www.hyresgastforeningen.se" target="_blank" rel="noopener noreferrer" className="text-[var(--c-text)] underline">
              Hyresgästföreningen
            </a>
            {' · '}
            <a href="https://www.scb.se" target="_blank" rel="noopener noreferrer" className="text-[var(--c-text)] underline">
              SCB
            </a>
          </p>
          <p>{t('career.relocation.jobsSource')}</p>
          <p>{t('career.relocation.rentRule')}</p>
        </div>
      </Card>

      {/* Innan du flyttar för ett jobb — inga belopp, inga villkor */}
      <Card className="p-6 bg-[var(--c-bg)] border-[var(--c-accent)]">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('career.relocation.supportTitle')}
        </h3>
        <p className="text-sm text-stone-700 dark:text-stone-300">
          {t('career.relocation.supportBody')}
        </p>
        <a
          href={AF_STOD_AO}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--c-text)] underline"
        >
          {t('career.relocation.supportLink')}
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </Card>

      {/* Bostadssajter */}
      <Card className="p-6">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
          <Home className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
          {t('career.relocation.housingTitle')}
        </h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {t('career.relocation.housingDisclaimer')}
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BOSTADSSAJTER.map((sajt) => (
            <li key={sajt.nyckel}>
              <a
                href={sajt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] transition-colors bg-white dark:bg-stone-800"
              >
                <span className="flex items-center justify-between">
                  <span className="font-medium text-stone-800 dark:text-stone-100">{sajt.namn}</span>
                  <ExternalLink className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
                </span>
                <span className="block text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t(sajt.beskrivningKey)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      {/* Checklista */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('career.relocation.checklistTitle')}
          </h3>
          {/* "0/12 (0%)" stod här och var precis den prestationsnolla
              DESIGN.md §2 förbjuder. Räknaren visas först när något är gjort. */}
          {giltigaKryss > 0 && (
            <span className="text-sm font-medium text-[var(--c-text)] tabular-nums shrink-0">
              {t('career.relocation.checklistProgress', { count: giltigaKryss, total: FLYTTCHECKLISTA.length })}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
          {t('career.relocation.checklistIntro')}
        </p>

        {giltigaKryss > 0 && (
          <div
            className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-4"
            role="progressbar"
            aria-valuenow={giltigaKryss}
            aria-valuemin={0}
            aria-valuemax={FLYTTCHECKLISTA.length}
            aria-label={t('career.relocation.checklistTitle')}
          >
            <div className="h-full bg-[var(--c-solid)] transition-all duration-300" style={{ width: `${checklistProgress}%` }} />
          </div>
        )}

        <ul className="space-y-2">
          {FLYTTCHECKLISTA.map((item) => {
            const klar = checkedItems.includes(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  aria-pressed={klar}
                  className={cn(
                    // flex-col under sm: badgen pressades tidigare in mitt i
                    // etikettens brödtext på 390 px.
                    'w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-colors text-left',
                    klar
                      ? 'bg-[var(--c-bg)] border-[var(--c-accent)]'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)]'
                  )}
                >
                  <span className="flex items-center gap-3 flex-1 min-w-0">
                    {klar ? (
                      <CheckCircle className="w-5 h-5 text-[var(--c-solid)] shrink-0" aria-hidden="true" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-stone-400 dark:border-stone-500 shrink-0" aria-hidden="true" />
                    )}
                    <span className={cn('text-sm', klar ? 'text-[var(--c-text)] line-through' : 'text-stone-700 dark:text-stone-300')}>
                      {t(item.labelKey)}
                    </span>
                  </span>
                  {/* Tidsangivelsen bär inte längre en röd/gul prioritetsfärg —
                      DESIGN.md §4 reserverar rött för destruktivt. */}
                  <span className="text-xs text-stone-600 dark:text-stone-400 sm:shrink-0 pl-8 sm:pl-0">
                    {t(item.narKey)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-[var(--c-bg)] border-[var(--c-accent)]">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('career.relocation.tipsTitle')}
        </h3>
        <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-2 list-disc pl-5">
          <li>{t('career.relocation.tips.queue')}</li>
          <li>{t('career.relocation.tips.sublet')}</li>
          <li>{t('career.relocation.tips.jobFirst')}</li>
          <li>{t('career.relocation.tips.firstMonths')}</li>
        </ul>
      </Card>
    </div>
  )
}
