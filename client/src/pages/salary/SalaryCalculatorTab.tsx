/**
 * Lönekalkylatorn.
 *
 * Tre saker som var fel här och som inte får återinföras:
 *
 * 1. Nettolönen räknades som `brutto * 0.78` — en platt schablon utan statlig
 *    skatt. Vid 82 000 kr i bruttolön visade den 11 359 kr för mycket i
 *    månaden. Räkningen ligger nu i `lib/skatt.ts` med tester.
 * 2. Siffrorna kallades "svensk lönestatistik". De är grova uppskattningar
 *    utan källa. Sidan säger nu det, och pekar vidare till SCB.
 * 3. Jämförelserna låg i komponentens eget tillstånd och försvann vid varje
 *    flikbyte. De sparas nu i `salary_searches` — tabellen och API:t fanns
 *    redan, utan en enda anropare.
 */
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calculator, MapPin, Briefcase, TrendingUp, Info, Sparkles, Download,
  Plus, X, BarChart3, ExternalLink,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { IconButton } from '@/components/ui/Button'
import { SalaryInsightsPanel } from '@/components/ai'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  YRKESOMRADEN, LONEREGIONER, ERFARENHETSNIVAER, EXTERNA_LONEKALLOR,
  beraknaLonespann, hittaErfarenhet, hittaRegion,
} from '@/data/lonedata'
import {
  beraknaNetto, KOMMUNALSKATT_RIKSGENOMSNITT, KOMMUNALSKATT_MIN, KOMMUNALSKATT_MAX, SKATTEAR,
} from '@/lib/skatt'
import { salaryApi, type SavedSalarySearch } from '@/services/careerApi'
import { useProfileStore } from '@/stores/profileStore'
import { logger } from '@/lib/logger'
import type { Loneval } from '../Salary'

interface Props {
  val: Loneval
  onValChange: (val: Loneval) => void
}

export default function SalaryCalculatorTab({ val, onValChange }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const profile = useProfileStore(s => s.profile)

  const [kommunalskatt, setKommunalskatt] = useState(KOMMUNALSKATT_RIKSGENOMSNITT)
  const [visaSkattedetalj, setVisaSkattedetalj] = useState(false)
  const [visaResultat, setVisaResultat] = useState(false)
  const [sparfel, setSparfel] = useState<string | null>(null)
  const [forifyllning, setForifyllning] = useState<string | null>(null)

  const { yrke, region, erfarenhet } = val
  const sattVal = (delar: Partial<Loneval>) => {
    onValChange({ ...val, ...delar })
    setVisaResultat(false) // ett ändrat val ska räknas om medvetet, inte smyga fram
  }

  /**
   * Förifyllning: portalen vet redan var användaren bor. Att fråga en gång
   * till är att låtsas att vi inte gör det. Sker bara en gång, och bara om
   * fältet är tomt — annars skriver den över ett aktivt val.
   */
  useEffect(() => {
    if (region || !profile?.location) return
    const traff = LONEREGIONER.find(r =>
      r.namn.toLowerCase() === profile.location!.trim().toLowerCase(),
    )
    if (traff) {
      onValChange({ ...val, region: traff.namn })
      setForifyllning(traff.namn)
    }
    // Körs bara när profilen landat; `val` läses medvetet utan att vara beroende.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.location])

  const lonespann = useMemo(
    () => beraknaLonespann(yrke, region, erfarenhet),
    [yrke, region, erfarenhet],
  )

  const netto = useMemo(
    () => (lonespann ? beraknaNetto(lonespann.median, kommunalskatt) : null),
    [lonespann, kommunalskatt],
  )

  const { data: sparade = [] } = useQuery<SavedSalarySearch[]>({
    queryKey: ['salary-searches'],
    queryFn: () => salaryApi.getAll(),
    staleTime: 60_000,
  })

  const sparaMutation = useMutation({
    mutationFn: async () => {
      if (!lonespann) throw new Error('Ingen beräkning att spara')
      const regionData = hittaRegion(region)
      const erfarenhetData = hittaErfarenhet(erfarenhet)
      return salaryApi.save({
        occupation: yrke,
        median_salary: lonespann.median,
        percentile_25: lonespann.min,
        percentile_75: lonespann.max,
        region_data: regionData
          ? [{ region: regionData.namn, median: lonespann.median, job_count: 0 }]
          : [],
        experience_data: erfarenhetData
          ? [{ years: erfarenhetData.namn, median: lonespann.median }]
          : [],
        trends: { growth: 0, job_count: 0, competition: 0 },
      })
    },
    onSuccess: () => {
      setSparfel(null)
      queryClient.invalidateQueries({ queryKey: ['salary-searches'] })
    },
    onError: (error) => {
      logger.error('Kunde inte spara löneberäkning', { error })
      setSparfel(t('salary.calculator.saveFailed'))
    },
  })

  const taBortMutation = useMutation({
    mutationFn: (id: string) => salaryApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary-searches'] }),
    onError: (error) => {
      logger.error('Kunde inte ta bort löneberäkning', { error })
      setSparfel(t('salary.calculator.deleteFailed'))
    },
  })

  const handleExport = () => {
    if (!lonespann || !netto) return
    const rader = [
      t('salary.calculator.exportTitle'),
      '',
      `${t('salary.calculator.occupation')}: ${yrke}`,
      `${t('salary.calculator.region')}: ${region}`,
      `${t('salary.calculator.experience')}: ${erfarenhet}`,
      '',
      `${t('salary.calculator.grossPerMonth')}: ${lonespann.median.toLocaleString('sv-SE')} kr`,
      `${t('salary.calculator.netSalaryPerMonth')}: ${netto.nettoManad.toLocaleString('sv-SE')} kr`,
      `${t('salary.calculator.annualSalaryGross')}: ${(lonespann.median * 12).toLocaleString('sv-SE')} kr`,
      '',
      t('salary.calculator.estimateNotice'),
      t('salary.calculator.taxAssumptions', { year: SKATTEAR, rate: kommunalskatt }),
    ]
    const blob = new Blob([rader.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('salary.calculator.exportFilename')}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const kanRakna = Boolean(yrke && region && erfarenhet)
  const fornamn = profile?.first_name?.trim()
  const sprak = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'
  const kr = (n: number) => n.toLocaleString(sprak)

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {t('salary.calculator.description')}
      </p>

      {/* Formulär */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
          {t('salary.calculator.enterDetails')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="salary-occupation" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" aria-hidden="true" />
              {t('salary.calculator.occupation')}
            </label>
            <select
              id="salary-occupation"
              value={yrke}
              onChange={(e) => sattVal({ yrke: e.target.value })}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] focus:border-[var(--c-solid)] text-stone-800 dark:text-stone-100"
            >
              <option value="">{t('salary.calculator.selectCategory')}</option>
              {YRKESOMRADEN.map((y) => (
                <option key={y.nyckel} value={y.namn}>
                  {t(`salary.data.occupations.${y.nyckel}`, y.namn)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="salary-region" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" aria-hidden="true" />
              {t('salary.calculator.region')}
            </label>
            <select
              id="salary-region"
              value={region}
              onChange={(e) => sattVal({ region: e.target.value })}
              aria-describedby={forifyllning ? 'salary-region-hint' : undefined}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] focus:border-[var(--c-solid)] text-stone-800 dark:text-stone-100"
            >
              <option value="">{t('salary.calculator.selectRegion')}</option>
              {LONEREGIONER.map((r) => (
                <option key={r.nyckel} value={r.namn}>
                  {t(`salary.data.regions.${r.nyckel}`, r.namn)}
                </option>
              ))}
            </select>
            {forifyllning && (
              <p id="salary-region-hint" className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                {t('salary.calculator.prefilledFromProfile')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="salary-experience" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" aria-hidden="true" />
              {t('salary.calculator.experience')}
            </label>
            <select
              id="salary-experience"
              value={erfarenhet}
              onChange={(e) => sattVal({ erfarenhet: e.target.value })}
              className="w-full px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] focus:border-[var(--c-solid)] text-stone-800 dark:text-stone-100"
            >
              <option value="">{t('salary.calculator.selectExperience')}</option>
              {ERFARENHETSNIVAER.map((e) => (
                <option key={e.nyckel} value={e.namn}>
                  {t(`salary.data.experience.${e.nyckel}`, e.namn)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={() => setVisaResultat(true)}
          disabled={!kanRakna}
          className="mt-6 w-full sm:w-auto"
        >
          <Calculator className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('salary.calculator.calculate')}
        </Button>
      </Card>

      {/* Resultat */}
      <div role="status" aria-live="polite">
        <AnimatePresence>
          {visaResultat && lonespann && netto && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/10">
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                      {fornamn
                        ? t('salary.calculator.yourResultNamed', { name: fornamn })
                        : t('salary.calculator.yourResult')}
                    </h3>
                  </div>
                  <Button onClick={handleExport} size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" aria-hidden="true" />
                    {t('common.export')}
                  </Button>
                </div>

                {/* Lönespann */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
                    <p className="text-sm text-stone-700 dark:text-stone-300 mb-1">{t('salary.calculator.minimum')}</p>
                    <p className="text-2xl font-bold text-stone-700 dark:text-stone-200">{kr(lonespann.min)} kr</p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">{t('salary.calculator.perMonth')}</p>
                  </div>
                  <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border-2 border-[var(--c-accent)] dark:border-[var(--c-solid)] shadow-sm">
                    <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)] font-medium mb-1">{t('salary.calculator.medianRecommended')}</p>
                    <p className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">{kr(lonespann.median)} kr</p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">{t('salary.calculator.perMonth')}</p>
                  </div>
                  <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
                    <p className="text-sm text-stone-700 dark:text-stone-300 mb-1">{t('salary.calculator.maximum')}</p>
                    <p className="text-2xl font-bold text-stone-700 dark:text-stone-200">{kr(lonespann.max)} kr</p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">{t('salary.calculator.perMonth')}</p>
                  </div>
                </div>

                {/* Var talen kommer ifrån — direkt under talen, inte längst ned */}
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">
                  {t('salary.calculator.estimateNotice')}
                </p>

                {/* Nettolön */}
                <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 mb-4">
                  <button
                    onClick={() => setVisaSkattedetalj(!visaSkattedetalj)}
                    aria-expanded={visaSkattedetalj}
                    aria-controls="salary-tax-detail"
                    className="w-full flex items-center justify-between gap-3 text-left rounded-lg hover:bg-stone-50 dark:hover:bg-stone-600/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-stone-700 dark:text-stone-300">{t('salary.calculator.netSalaryPerMonth')}</p>
                      <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{kr(netto.nettoManad)} kr</p>
                    </div>
                    <span className="text-xs text-stone-700 dark:text-stone-300 text-right">
                      {t('salary.calculator.effectiveTax', { percent: netto.effektivSkattProcent })}
                      <span className="block text-[var(--c-text)] dark:text-[var(--c-text)] underline">
                        {visaSkattedetalj ? t('common.hide') : t('salary.calculator.showTaxDetail')}
                      </span>
                    </span>
                  </button>

                  <div id="salary-tax-detail" hidden={!visaSkattedetalj} className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600">
                    <dl className="text-sm text-stone-700 dark:text-stone-200 space-y-1">
                      <div className="flex justify-between gap-4">
                        <dt>{t('salary.calculator.taxRowMunicipal')}</dt>
                        <dd>−{kr(netto.poster.kommunalSkatt)} kr</dd>
                      </div>
                      {netto.poster.statligSkatt > 0 && (
                        <div className="flex justify-between gap-4">
                          <dt>{t('salary.calculator.taxRowState')}</dt>
                          <dd>−{kr(netto.poster.statligSkatt)} kr</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-4">
                        <dt>{t('salary.calculator.taxRowJobDeduction')}</dt>
                        <dd>+{kr(netto.poster.jobbskatteavdrag)} kr</dd>
                      </div>
                      <div className="flex justify-between gap-4 font-semibold pt-1 border-t border-stone-200 dark:border-stone-600">
                        <dt>{t('salary.calculator.taxRowTotal')}</dt>
                        <dd>−{kr(netto.skattManad)} kr</dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <label htmlFor="salary-municipal-tax" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                        {t('salary.calculator.municipalTaxLabel')}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="salary-municipal-tax"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={KOMMUNALSKATT_MIN}
                          max={KOMMUNALSKATT_MAX}
                          value={kommunalskatt}
                          onChange={(e) => setKommunalskatt(Number(e.target.value))}
                          aria-describedby="salary-municipal-tax-hint"
                          className="w-28 px-3 py-2 border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 rounded-lg text-stone-800 dark:text-stone-100"
                        />
                        <span className="text-sm text-stone-700 dark:text-stone-300">%</span>
                      </div>
                      <p id="salary-municipal-tax-hint" className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                        {t('salary.calculator.municipalTaxHint', { avg: KOMMUNALSKATT_RIKSGENOMSNITT })}
                      </p>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-3">
                      {t('salary.calculator.taxAssumptions', { year: SKATTEAR, rate: netto.antaganden.kommunalskattProcent })}{' '}
                      {t('salary.calculator.taxNotIncluded')}
                    </p>
                  </div>
                </div>

                {/* Årslön */}
                <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 mb-4">
                  <p className="text-sm text-stone-700 dark:text-stone-300 mb-1">{t('salary.calculator.annualSalaryGross')}</p>
                  <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{kr(lonespann.median * 12)} kr</p>
                </div>

                {/* Spannet som EN axel — inte tre staplar där den längsta alltid är 100 % */}
                <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 mb-4">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                    {t('salary.calculator.rangeTitle')}
                  </p>
                  <div className="relative h-3 bg-stone-100 dark:bg-stone-600 rounded-full">
                    <div className="absolute inset-0 bg-[var(--c-solid)]/30 rounded-full" />
                    <div
                      className="absolute -top-1 w-1.5 h-5 bg-[var(--c-solid)] rounded-full"
                      style={{
                        left: `calc(${((lonespann.median - lonespann.min) / Math.max(1, lonespann.max - lonespann.min)) * 100}% - 3px)`,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-stone-700 dark:text-stone-300">
                    <span>{kr(lonespann.min)} kr</span>
                    <span className="font-semibold text-[var(--c-text)] dark:text-[var(--c-text)]">{kr(lonespann.median)} kr</span>
                    <span>{kr(lonespann.max)} kr</span>
                  </div>
                </div>

                {sparfel && (
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">{sparfel}</p>
                )}

                <Button
                  onClick={() => sparaMutation.mutate()}
                  variant="outline"
                  className="w-full gap-2"
                  isLoading={sparaMutation.isPending}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  {t('salary.calculator.saveCalculation')}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sparade beräkningar */}
      {sparade.length > 0 && (
        <Card className="border-[var(--c-accent)] dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)]/40 dark:bg-[var(--c-bg)]/20">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" aria-hidden="true" />
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('salary.calculator.savedTitle', { count: sparade.length })}
            </h3>
          </div>

          <ul className="space-y-3">
            {sparade.map((post) => {
              const postNetto = beraknaNetto(post.median_salary, kommunalskatt)
              const regionNamn = post.region_data?.[0]?.region
              const erfarenhetNamn = post.experience_data?.[0]?.years
              return (
                <li key={post.id} className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/40">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-100">{post.occupation}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-300">
                        {[regionNamn, erfarenhetNamn].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <IconButton
                      icon={<X className="w-4 h-4" />}
                      label={t('salary.calculator.removeSaved', { occupation: post.occupation })}
                      variant="ghost"
                      size="sm"
                      onClick={() => taBortMutation.mutate(post.id)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg p-3">
                      <p className="text-xs text-stone-600 dark:text-stone-300 mb-1">{t('salary.calculator.gross')}</p>
                      <p className="font-bold text-stone-900 dark:text-stone-100">{kr(post.median_salary)} kr</p>
                    </div>
                    <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg p-3">
                      <p className="text-xs text-stone-600 dark:text-stone-300 mb-1">{t('salary.calculator.net')}</p>
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        {postNetto ? `${kr(postNetto.nettoManad)} kr` : '—'}
                      </p>
                    </div>
                  </div>

                  {lonespann && (
                    <p className={cn(
                      'text-xs mt-3 pt-3 border-t border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/40',
                      'text-stone-700 dark:text-stone-300',
                    )}>
                      {post.median_salary === lonespann.median
                        ? t('salary.calculator.sameAsCurrent')
                        : t('salary.calculator.diffToCurrent', {
                            diff: kr(Math.abs(post.median_salary - lonespann.median)),
                            direction: post.median_salary > lonespann.median
                              ? t('salary.calculator.higher')
                              : t('salary.calculator.lower'),
                          })}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* AI-lönekompassen. currentSalary skickas medvetet INTE: användaren har
          aldrig angett någon lön, och kalkylatorns uppskattning får inte gå
          vidare till modellen som "nuvarande lön". */}
      <SalaryInsightsPanel
        occupation={yrke}
        region={region}
        experienceYears={hittaErfarenhet(erfarenhet)?.arFran}
      />

      {/* Riktiga källor */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {t('salary.calculator.sourcesTitle')}
            </h3>
            <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
              {t('salary.calculator.sourcesIntro')}
            </p>
            <ul className="space-y-2">
              {EXTERNA_LONEKALLOR.map((kalla) => (
                <li key={kalla.nyckel}>
                  <a
                    href={kalla.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] underline inline-flex items-center gap-1"
                  >
                    {kalla.namn}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    <span className="sr-only">{t('salary.calculator.opensInNewTab')}</span>
                  </a>
                  <span className="text-sm text-stone-700 dark:text-stone-300"> — {t(`salary.data.sources.${kalla.nyckel}`, kalla.beskrivning)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">{t('salary.calculator.tipsTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['buildSkills', 'documentResults', 'timing', 'knowMarket'] as const).map((nyckel, i) => (
            <div key={nyckel} className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
              <div className="w-8 h-8 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-[var(--c-text)] dark:text-[var(--c-text)] font-bold" aria-hidden="true">{i + 1}</span>
              </div>
              <div>
                <p className="font-medium text-stone-800 dark:text-stone-100">{t(`salary.calculator.tips.${nyckel}`)}</p>
                <p className="text-sm text-stone-700 dark:text-stone-300">{t(`salary.calculator.tips.${nyckel}Desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
