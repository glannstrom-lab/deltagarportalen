/**
 * Min vecka — deltagarens vy av sin aktivitetsplan (KM3/KM6).
 *
 * Läser activity_plans och activity_sessions direkt via minVeckaApi. Passen
 * genereras och närvaron sätts av konsulenten; deltagaren kan bara checka in
 * (self_checkin_at, vaktat av trigger i databasen). Ingen AI, inga
 * prestationsord — tonen är "lugn vän" (DESIGN.md §2). Ett tomt schema är
 * en invit, inte en nolla.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ClipboardCheck, MapPin, CheckCircle } from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { minVeckaApi, type ActivitySession } from '@/services/aktivitetApi'
import { MIN_VECKA_PLAN_KEY, minVeckaSessionsKey } from '@/services/minVeckaKeys'
import {
  addDays,
  formatLocalDate,
  veckansMandag,
  veckosaldo,
  veckoampel,
  type ActivityType,
  type Attendance,
} from '@/services/aktivitetSchema'

const TYP_NYCKEL: Record<ActivityType, string> = {
  motivation: 'minVecka.typ.motivation',
  language: 'minVecka.typ.language',
  jobsearch: 'minVecka.typ.jobsearch',
  workplace: 'minVecka.typ.workplace',
  jobsearch_own: 'minVecka.typ.jobsearch_own',
}

const NARVARO_NYCKEL: Record<Attendance, string> = {
  present: 'minVecka.narvaro.present',
  absent_valid: 'minVecka.narvaro.absent_valid',
  absent_invalid: 'minVecka.narvaro.absent_invalid',
  sick_certified: 'minVecka.narvaro.sick_certified',
  external: 'minVecka.narvaro.external',
}

function idag(): string {
  return formatLocalDate(new Date())
}

function klockslag(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export default function MinVecka() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mandag, setMandag] = useState(() => veckansMandag(idag()))
  const [status, setStatus] = useState<string | null>(null)
  const [checkinFel, setCheckinFel] = useState<string | null>(null)
  const [pagar, setPagar] = useState<string | null>(null)

  const planQuery = useQuery({
    queryKey: MIN_VECKA_PLAN_KEY,
    queryFn: () => minVeckaApi.getMyPlan(),
  })

  const sondag = addDays(mandag, 6)
  const sessionsQuery = useQuery({
    queryKey: minVeckaSessionsKey(mandag),
    queryFn: () => minVeckaApi.listMySessions(mandag, sondag),
    enabled: !!planQuery.data,
  })

  const dagens = idag()
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'sv-SE'

  const perDag = useMemo(() => {
    const map = new Map<string, ActivitySession[]>()
    for (const s of sessionsQuery.data ?? []) {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [sessionsQuery.data])

  const nastaPass = useMemo(() => {
    const nu = new Date()
    const nuTid = `${String(nu.getHours()).padStart(2, '0')}:${String(nu.getMinutes()).padStart(2, '0')}`
    return (sessionsQuery.data ?? []).find((s) => s.date > dagens || (s.date === dagens && s.start_time >= nuTid)) ?? null
  }, [sessionsQuery.data, dagens])

  const handleCheckin = async (session: ActivitySession) => {
    setPagar(session.id)
    setCheckinFel(null)
    try {
      await minVeckaApi.checkin(session.id)
      await queryClient.invalidateQueries({ queryKey: minVeckaSessionsKey(mandag) })
      setStatus(t('minVecka.incheckadStatus', 'Tack, du är incheckad.'))
    } catch {
      setCheckinFel(t('minVecka.incheckningMisslyckades', 'Incheckningen gick inte igenom. Försök igen, eller säg till din konsulent.'))
    } finally {
      setPagar(null)
    }
  }

  const rubrikdatum = (d: string) => {
    const date = new Date(`${d}T12:00:00`)
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  }

  let innehall: React.ReactNode

  if (planQuery.isLoading || (planQuery.data && sessionsQuery.isLoading)) {
    innehall = <LoadingState />
  } else if (planQuery.isError) {
    innehall = <ErrorState message={t('minVecka.kundeInteHamta', 'Din vecka kunde inte hämtas just nu.')} onRetry={() => planQuery.refetch()} />
  } else if (!planQuery.data) {
    innehall = (
      <EmptyState
        icon={ClipboardCheck}
        title={t('minVecka.ingenPlan.title', 'Ingen vecka planerad än')}
        description={t('minVecka.ingenPlan.text', 'Din konsulent lägger upp veckan tillsammans med dig. Tills dess finns det inget du behöver göra här.')}
        action={{ label: t('minVecka.ingenPlan.cta', 'Gå till din konsulent'), onClick: () => navigate('/my-consultant') }}
      />
    )
  } else if (sessionsQuery.isError) {
    innehall = <ErrorState message={t('minVecka.kundeInteHamta', 'Din vecka kunde inte hämtas just nu.')} onRetry={() => sessionsQuery.refetch()} />
  } else {
    const plan = planQuery.data
    const sessions = sessionsQuery.data ?? []
    const saldo = veckosaldo(sessions, mandag)
    const ampel = veckoampel(saldo, plan.weekly_hours_target)

    innehall = (
      <div className="space-y-6 max-w-2xl">
        <Card className="p-5">
          <p className="text-lg text-stone-900 dark:text-stone-100">
            {ampel === 'inga_pass'
              ? t('minVecka.saldo.ingaPass', 'Inget inplanerat den här veckan.')
              : t('minVecka.saldo.rad', {
                  defaultValue: 'Du har {{planerade}} av {{mal}} timmar den här veckan.',
                  planerade: saldo.planeradeTimmar,
                  mal: plan.weekly_hours_target,
                })}
            {ampel !== 'inga_pass' && plan.jobsearch_hours_per_week > 0 && (
              <> {t('minVecka.saldo.jobbsok', { defaultValue: 'Och {{h}} timmar för eget jobbsökande.', h: plan.jobsearch_hours_per_week })}</>
            )}
          </p>
          {nastaPass && (
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {t('minVecka.nastaPass', {
                defaultValue: 'Nästa: {{titel}}, {{dag}} kl {{tid}}',
                titel: nastaPass.title,
                dag: rubrikdatum(nastaPass.date),
                tid: nastaPass.start_time,
              })}
            </p>
          )}
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => setMandag(addDays(mandag, -7))} aria-label={t('minVecka.forraVeckan', 'Förra veckan')}>
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t('minVecka.forraVeckan', 'Förra veckan')}</span>
          </Button>
          <button
            type="button"
            className="text-sm font-medium text-stone-700 dark:text-stone-300 underline-offset-2 hover:underline"
            onClick={() => setMandag(veckansMandag(idag()))}
          >
            {t('minVecka.veckaRubrik', { defaultValue: 'Vecka {{fran}} – {{till}}', fran: rubrikdatum(mandag), till: rubrikdatum(sondag) })}
          </button>
          <Button variant="outline" onClick={() => setMandag(addDays(mandag, 7))} aria-label={t('minVecka.nastaVeckan', 'Nästa vecka')}>
            <span className="sr-only sm:not-sr-only">{t('minVecka.nastaVeckan', 'Nästa vecka')}</span>
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>

        <div role="status" aria-live="polite" className="sr-only">{status ?? ''}</div>
        {checkinFel && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{checkinFel}</p>}

        {perDag.length === 0 ? (
          <p className="text-stone-600 dark:text-stone-400">{t('minVecka.tomVecka', 'Inga pass den här veckan. Du kan bläddra till en annan vecka.')}</p>
        ) : (
          perDag.map(([dag, pass]) => (
            <section key={dag} aria-labelledby={`dag-${dag}`} className="space-y-3">
              <h2 id={`dag-${dag}`} className="text-base font-semibold text-stone-800 dark:text-stone-200 capitalize">
                {rubrikdatum(dag)}{dag === dagens ? ` · ${t('minVecka.idag', 'i dag')}` : ''}
              </h2>
              {pass.map((s) => (
                <Card key={s.id} className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm text-stone-600 dark:text-stone-400">{s.start_time}–{s.end_time}</span>
                      <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{t(TYP_NYCKEL[s.activity_type])}</span>
                    </div>
                    <h3 className="font-medium text-stone-900 dark:text-stone-100">{s.title}</h3>
                    {s.location && (
                      <p className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
                        <MapPin className="w-4 h-4" aria-hidden="true" />{s.location}
                      </p>
                    )}
                    {s.attendance ? (
                      <p className="text-sm text-stone-700 dark:text-stone-300">{t(NARVARO_NYCKEL[s.attendance])}</p>
                    ) : s.self_checkin_at ? (
                      <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        {t('minVecka.incheckad', { defaultValue: 'Incheckad kl {{tid}}', tid: klockslag(s.self_checkin_at, locale) })}
                      </p>
                    ) : s.date === dagens ? (
                      <Button
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => handleCheckin(s)}
                        disabled={pagar === s.id}
                      >
                        {t('minVecka.jagArHar', 'Jag är här')}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
            </section>
          ))
        )}
      </div>
    )
  }

  return (
    <PageLayout
      title={t('minVecka.title', 'Min vecka')}
      description={t('minVecka.description', 'Dina planerade aktiviteter, vecka för vecka.')}
      icon={ClipboardCheck}
      domain="wellbeing"
    >
      {innehall}
    </PageLayout>
  )
}
