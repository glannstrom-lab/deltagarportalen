/**
 * ApplicationsAnalytics Component
 * Statistics and insights about job applications
 *
 * 2026-08-19: siffrorna räknas i klienten ur `applications`, INTE ur RPC:n
 * `get_application_stats`. RPC:ns `total`/`active` är `COUNT(*) FROM saved_jobs`
 * utan statusfilter — den räknar alltså bokmärken som ansökningar. I prod är 20
 * av 26 rader `SAVED` och 3 `INTERESTED`; kortet sa "Totalt ansökningar: 8"
 * samtidigt som samma vy sa "Skickade ansökningar: 0". Ett sparat jobb och en
 * skickad ansökan är två olika saker och etiketterna säger numera vilken.
 * (RPC:n är orörd — schemaändringar kräver beslut av Mikael.)
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart3, PieChart,
  Clock, CheckCircle, Send, Users, Trophy,
  Target, Briefcase
} from '@/components/ui/icons'
import { Card, EmptyState, ErrorState } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  type Application,
  type ApplicationStatus
} from '@/types/application.types'

// Hur långt en ansökan bevisligen kommit i processen (statusordning).
// Terminala statusar säger inte var man var när processen tog slut:
// avslag räknas som "har ansökt" (man kan inte få avslag utan att ha sökt),
// återkallad räknas som "har ansökt" bara om ansökningsdatum finns.
function reachedOrder(app: Application): number {
  if (app.status === 'rejected') {
    return APPLICATION_STATUS_CONFIG.applied.order
  }
  if (app.status === 'withdrawn') {
    return app.applicationDate ? APPLICATION_STATUS_CONFIG.applied.order : 0
  }
  return APPLICATION_STATUS_CONFIG[app.status].order
}

const APPLIED_ORDER = APPLICATION_STATUS_CONFIG.applied.order
const SCREENING_ORDER = APPLICATION_STATUS_CONFIG.screening.order
const PHONE_ORDER = APPLICATION_STATUS_CONFIG.phone.order

// Statuskonfigurationens `bgColor` är 100-nyanser — tänkta som bakgrund bakom
// text, inte som färgfält. I statusstapeln läste `bg-slate-100` ("Sparad") som
// ett glapp i stapeln i stället för som ett segment. 300-nyansen syns.
// (Literala klassnamn krävs — Tailwind ser inte ihopsatta strängar.)
const SEGMENTFARG: Record<ApplicationStatus, string> = {
  interested: 'bg-purple-300',
  saved: 'bg-slate-400',
  applied: 'bg-blue-300',
  screening: 'bg-cyan-300',
  phone: 'bg-teal-300',
  interview: 'bg-teal-500',
  assessment: 'bg-sky-300',
  offer: 'bg-amber-300',
  accepted: 'bg-green-400',
  rejected: 'bg-red-300',
  withdrawn: 'bg-stone-400',
}

/** Har personen faktiskt sökt jobbet, eller bara bokmärkt det? */
function harSokts(app: Application): boolean {
  return reachedOrder(app) >= APPLIED_ORDER
}

/** Pågående = sökt, inte arkiverad, inte avslutad. */
function arPagaende(app: Application): boolean {
  return (
    harSokts(app) &&
    !app.archivedAt &&
    !['accepted', 'rejected', 'withdrawn'].includes(app.status)
  )
}

interface StatCardProps {
  title: string
  value: number | string
  /**
   * Visas i stället för siffran när `value` är 0. Ett tomt fält är inte en
   * nolla, och "0 ansökningar" är prestationsspråk i en deltagarvy
   * (DESIGN.md §2 regel 3, §7).
   */
  invit?: string
  subtitle?: string
  icon: React.ElementType
  color?: string
  bgColor?: string
}

function StatCard({ title, value, invit, subtitle, icon: Icon, color = 'text-stone-600', bgColor = 'bg-stone-100' }: StatCardProps) {
  const visaInvit = invit !== undefined && value === 0

  return (
    <Card className="p-4 min-w-0">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
          <Icon className={cn("w-5 h-5", color)} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3">
        {visaInvit ? (
          <p className="text-base font-medium text-stone-900 leading-snug">{invit}</p>
        ) : (
          <p className="text-2xl font-bold text-stone-900">{value}</p>
        )}
        <p className="text-sm font-medium text-stone-700">{title}</p>
        {subtitle && !visaInvit && <p className="text-xs text-stone-700 mt-1">{subtitle}</p>}
      </div>
    </Card>
  )
}

function StatusDistribution({ applicationsByStatus }: { applicationsByStatus: Record<ApplicationStatus, Application[]> }) {
  const { t } = useTranslation()
  const statusCounts = useMemo(() => {
    const counts: { status: ApplicationStatus; count: number; percentage: number }[] = []
    const total = Object.values(applicationsByStatus).flat().length

    Object.entries(applicationsByStatus).forEach(([status, apps]) => {
      if (apps.length > 0) {
        counts.push({
          status: status as ApplicationStatus,
          count: apps.length,
          percentage: Math.round((apps.length / total) * 100)
        })
      }
    })

    return counts.sort((a, b) => b.count - a.count)
  }, [applicationsByStatus])

  const total = statusCounts.reduce((sum, s) => sum + s.count, 0)

  if (total === 0) return null

  return (
    <Card className="p-4 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
        <h3 className="font-semibold text-stone-900">{t('applications.analytics.statusDistribution', 'Statusfördelning')}</h3>
      </div>

      {/* Stapeln är en illustration av listan under — allt den säger står i
          klartext i legenden, därför aria-hidden. Tidigare fanns procenten
          bara i `title=`, dvs. osynlig för tangentbord och skärmläsare. */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4" aria-hidden="true">
        {statusCounts.map(({ status, percentage }) => (
          <div
            key={status}
            className={cn("h-full", SEGMENTFARG[status])}
            style={{ width: `${percentage}%` }}
          />
        ))}
      </div>

      {/* Legenden visar ALLA statusar som finns — den kapades tidigare till 6
          medan stapeln ritade alla, så delar av bilden saknade förklaring. */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {statusCounts.map(({ status, count, percentage }) => {
          return (
            <li key={status} className="flex items-center gap-2 text-sm min-w-0">
              <span className={cn("w-3 h-3 rounded-full flex-shrink-0", SEGMENTFARG[status])} aria-hidden="true" />
              <span className="text-stone-700 break-words min-w-0">{t(`applications.status.${status}`, getStatusLabel(status))}</span>
              <span className="text-stone-700 ml-auto tabular-nums flex-shrink-0">
                {t('applications.analytics.legendCount', '{{count}} st ({{percentage}} %)', { count, percentage })}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ConversionFunnel({ applications }: { applications: Application[] }) {
  const { t } = useTranslation()
  // Kumulativ tratt: varje steg räknar ansökningar som nått MINST det steget.
  // (Nulägesräkning gav missvisande siffror — "Ansökt" sjönk när någon gick vidare.)
  const stages = useMemo(() => {
    const defs: { status: ApplicationStatus; icon: React.ElementType }[] = [
      { status: 'applied', icon: Send },
      { status: 'screening', icon: Clock },
      { status: 'phone', icon: Users },
      { status: 'interview', icon: Users },
      { status: 'assessment', icon: Briefcase },
      { status: 'offer', icon: Trophy },
      { status: 'accepted', icon: CheckCircle },
    ]
    return defs.map(d => ({
      label: t(`applications.status.${d.status}`, getStatusLabel(d.status)),
      icon: d.icon,
      count: applications.filter(a => reachedOrder(a) >= APPLICATION_STATUS_CONFIG[d.status].order).length
    }))
  }, [applications, t])

  const maxCount = Math.max(...stages.map(s => s.count), 0)

  // Tratten klipps efter det längsta steg som faktiskt nåtts, plus ETT steg
  // framåt som visas som nästa steg utan siffra. Tidigare ritades alla sju
  // steg alltid — sex nollor i rad i en deltagarvy (DESIGN.md §2 regel 3).
  const sistaNadda = stages.reduce((idx, s, i) => (s.count > 0 ? i : idx), -1)
  const synligaSteg = stages.slice(0, Math.min(sistaNadda + 2, stages.length))
  const doldaSteg = stages.length - synligaSteg.length

  return (
    <Card className="p-4 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
        <h3 className="font-semibold text-stone-900">{t('applications.analytics.funnel', 'Ansökningstratt')}</h3>
      </div>
      <p className="text-xs text-stone-600 mb-4">{t('applications.analytics.funnelHint', 'Antal ansökningar som nått minst varje steg')}</p>

      {maxCount === 0 ? (
        /* Sju stubbar med "0" i är ingen tratt — det är sju tomma påståenden.
           Visa i stället vad som fyller den. */
        <p className="text-sm text-stone-700">
          {t('applications.analytics.funnelEmpty', 'Tratten fylls när du skickat din första ansökan.')}
        </p>
      ) : (
        <div className="space-y-3">
          {synligaSteg.map((stage, index) => {
            const arNastaSteg = index > sistaNadda
            const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
            const Icon = stage.icon
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className={cn(
                  "w-24 flex-shrink-0 flex items-center gap-2 text-sm",
                  arNastaSteg ? "text-stone-600" : "text-stone-700"
                )}>
                  <Icon className="w-4 h-4 text-stone-600 flex-shrink-0" aria-hidden="true" />
                  {/* break-words, inte truncate — en avklippt etikett i en
                      tratt döljer just det steget den ska namnge. */}
                  <span className="break-words">{stage.label}</span>
                </div>
                <div className="flex-1 min-w-0 h-6 bg-stone-100 rounded-full overflow-hidden">
                  {!arNastaSteg && (
                    <div
                      className="h-full bg-[var(--c-solid)] rounded-full"
                      style={{ width: `${width}%` }}
                    />
                  )}
                </div>
                {/* Siffran ligger utanför stapeln: dels blev den osynlig i en
                    5 %-stub, dels gav `text-white` på ett BARN till
                    bg-[var(--c-solid)] 1,73:1 i mörkt läge (bryggregeln i
                    tokens.css kräver båda klasserna på samma element). */}
                {arNastaSteg ? (
                  <span className="w-20 text-right text-xs text-stone-600 flex-shrink-0">
                    {t('applications.analytics.funnelNextStep', 'nästa steg')}
                  </span>
                ) : (
                  <span className="w-20 text-right text-sm font-medium text-stone-900 tabular-nums flex-shrink-0">
                    {stage.count}
                  </span>
                )}
              </div>
            )
          })}
          {doldaSteg > 0 && (
            <p className="text-xs text-stone-600">
              {t('applications.analytics.funnelMoreSteps', 'Stegen därefter visas när du kommer dit.')}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function RecentActivity({ applications }: { applications: Application[] }) {
  const { t } = useTranslation()
  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [applications])

  if (recentApps.length === 0) return null

  return (
    <Card className="p-4 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
        <h3 className="font-semibold text-stone-900">{t('applications.analytics.recentActivity', 'Senaste aktivitet')}</h3>
      </div>

      <div className="space-y-3">
        {recentApps.map((app) => {
          const config = APPLICATION_STATUS_CONFIG[app.status as ApplicationStatus]
          const jobData = app.jobData as { employer?: { name?: string }; headline?: string } | undefined
          const companyName = app.companyName || jobData?.employer?.name || t('applications.common.unknownCompany', 'Okänt företag')
          const jobTitle = app.jobTitle || jobData?.headline || t('applications.common.unknownTitle', 'Okänd tjänst')

          return (
            <div key={app.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", config.bgColor)} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{jobTitle}</p>
                <p className="text-xs text-stone-700">{companyName}</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full flex-shrink-0", config.bgColor, config.color)}>
                {t(`applications.status.${app.status}`, getStatusLabel(app.status))}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function ApplicationsAnalytics() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { applications, applicationsByStatus, staleApplications, isLoading, error, refetch } = useApplications()

  // Alla siffror räknas ur `applications` (kumulativt via reachedOrder).
  const metrics = useMemo(() => {
    const now = new Date()

    // Bokmärken: sparade/intresserade jobb som ännu inte sökts.
    const savedNotApplied = applications.filter(a => !harSokts(a) && !a.archivedAt).length

    const submitted = applications.filter(harSokts).length
    // "Svar" här = de statusar deltagaren själv dragit kortet till. Ingen
    // kolumn i saved_jobs registrerar ett arbetsgivarsvar (alla 24 kolumner
    // kontrollerade 2026-08-19), så texterna säger "du har markerat".
    const marked = applications.filter(
      a => reachedOrder(a) >= SCREENING_ORDER || a.status === 'rejected'
    ).length
    const interviews = applications.filter(a => reachedOrder(a) >= PHONE_ORDER).length

    const markedRate = submitted > 0 ? Math.round((marked / submitted) * 100) : 0
    const interviewRate = submitted > 0 ? Math.round((interviews / submitted) * 100) : 0

    const ongoing = applications.filter(arPagaende)

    // Åldern mäts från ansökningsdatumet, inte från när jobbet sparades.
    // `application_date` är NULL på 2 av 3 APPLIED-rader i prod — de posterna
    // räknas bort ur nämnaren i stället för att få ett gissat datum, och
    // antalet borträknade skrivs ut under siffran.
    const ongoingWithDate = ongoing.filter(a => {
      if (!a.applicationDate) return false
      return !Number.isNaN(new Date(a.applicationDate).getTime())
    })
    const avgDaysInPipeline = ongoingWithDate.length > 0
      ? Math.round(
          ongoingWithDate.reduce((sum, app) => {
            const days = Math.floor(
              (now.getTime() - new Date(app.applicationDate as string).getTime()) / (1000 * 60 * 60 * 24)
            )
            return sum + Math.max(days, 0)
          }, 0) / ongoingWithDate.length
        )
      : null
    const ongoingWithoutDate = ongoing.length - ongoingWithDate.length

    return {
      savedNotApplied,
      submitted,
      marked,
      interviews,
      markedRate,
      interviewRate,
      ongoingCount: ongoing.length,
      avgDaysInPipeline,
      ongoingWithoutDate,
      staleCount: staleApplications.length
    }
  }, [applications, staleApplications])

  // Tre uttryckliga lägen: laddar / fel / klart. Tidigare fanns bara laddar,
  // och ett trasigt anrop landade i "0" — dvs. samma bild som "du har inte
  // börjat söka jobb än" fast åt någon med tjugo ansökningar.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-solid)]" role="status" aria-label={t('common.loadingStatus', 'Laddar')} />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        title={t('applications.analytics.errorTitle', 'Statistiken kunde inte hämtas')}
        message={t('applications.analytics.errorDescription', 'Vi når inte dina ansökningar just nu. Siffrorna skulle bli fel, så vi visar dem inte.')}
        onRetry={() => { void refetch() }}
      />
    )
  }

  // Tomtillståndet avgörs av samma källa som korten läser — `applications`.
  // (Tidigare läste grinden RPC:ns `stats.total`, som räknar bokmärken.)
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t('applications.analytics.emptyTitle', 'Här ser du hur ditt jobbsökande går')}
        description={t('applications.analytics.emptyDescription', 'När du börjar spåra ansökningar visas statistik och insikter om din process här.')}
        action={{
          label: t('applications.analytics.emptyCta', 'Hitta jobb att söka'),
          onClick: () => navigate('/job-search')
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('applications.analytics.submittedTitle', 'Ansökningar du skickat')}
          value={metrics.submitted}
          invit={t('applications.analytics.submittedInvit', 'Du har inte sökt något jobb än')}
          subtitle={t('applications.analytics.savedNotApplied', '{{count}} sparade jobb du inte sökt än', { count: metrics.savedNotApplied })}
          icon={Send}
          color="text-[var(--c-text)]"
          bgColor="bg-[var(--c-accent)]/40"
        />
        <StatCard
          title={t('applications.analytics.savedTitle', 'Sparade jobb')}
          value={metrics.savedNotApplied}
          invit={t('applications.analytics.savedInvit', 'Inga sparade jobb kvar att söka')}
          subtitle={t('applications.analytics.savedSubtitle', 'Bokmärken — inte ansökningar')}
          icon={Briefcase}
          color="text-[var(--c-text)]"
          bgColor="bg-[var(--c-accent)]/40"
        />
        <StatCard
          title={t('applications.analytics.interviewsTitle', 'Intervjuer')}
          value={metrics.interviews}
          invit={t('applications.analytics.interviewsInvit', 'Ingen intervju inbokad än')}
          subtitle={t('applications.analytics.interviewsSubtitle', 'Telefon- och platsintervjuer')}
          icon={Users}
          color="text-[var(--c-text)]"
          bgColor="bg-[var(--c-accent)]/40"
        />
        <StatCard
          title={t('applications.analytics.staleTitle', 'Behöver uppföljning')}
          value={metrics.staleCount}
          invit={t('applications.analytics.staleInvit', 'Allt är uppdaterat')}
          subtitle={t('applications.analytics.staleSubtitle', 'Ej uppdaterade 7+ dagar')}
          icon={Clock}
          color={metrics.staleCount > 0 ? "text-amber-600" : "text-[var(--c-text)]"}
          bgColor={metrics.staleCount > 0 ? "bg-amber-100" : "bg-[var(--c-accent)]/40"}
        />
      </div>

      {/* Charts row.
          `items-start` gör att korten slutar där innehållet slutar — grid
          sträcker annars ut det korta kortet till grannens höjd (uppmätt
          205 respektive 253 px tom yta i drift 2026-08-19). */}
      <div className="grid gap-4 md:grid-cols-2 items-start">
        <StatusDistribution applicationsByStatus={applicationsByStatus} />
        <ConversionFunnel applications={applications} />
      </div>

      {/* Additional metrics and activity */}
      <div className="grid gap-4 md:grid-cols-3 items-start">
        <Card className="p-4 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
            <h3 className="font-semibold text-stone-900">{t('applications.analytics.successMetrics', 'Så går din process')}</h3>
          </div>
          {metrics.submitted >= 5 ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-stone-700">{t('applications.analytics.markedRespondedTitle', 'Andel du markerat som besvarade')}</span>
                  <span className="font-medium text-stone-900 tabular-nums">{metrics.markedRate} %</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--c-solid)] rounded-full"
                    style={{ width: `${metrics.markedRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-stone-700">{t('applications.analytics.interviewRateTitle', 'Intervjufrekvens')}</span>
                  <span className="font-medium text-stone-900 tabular-nums">{metrics.interviewRate} %</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--c-solid)] rounded-full"
                    style={{ width: `${metrics.interviewRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-stone-700">{t('applications.analytics.avgPipeline', 'Genomsnitt i pipeline')}</span>
                  <span className="font-medium text-stone-900 tabular-nums">
                    {metrics.avgDaysInPipeline === null
                      ? '—'
                      : t('applications.analytics.days', { count: metrics.avgDaysInPipeline })}
                  </span>
                </div>
                {/* Ett värde utan underlag visar "—" plus raden om varför —
                    aldrig "0 dagar" (lärdomen 2026-08-09). */}
                {metrics.avgDaysInPipeline === null ? (
                  <p className="text-xs text-stone-600">
                    {t('applications.analytics.avgPipelineNoBasis', 'Ingen av dina pågående ansökningar har ett ansökningsdatum, så snittet går inte att räkna ut.')}
                  </p>
                ) : metrics.ongoingWithoutDate > 0 && (
                  <p className="text-xs text-stone-600">
                    {t('applications.analytics.avgPipelineExcluded', '{{count}} pågående ansökningar saknar ansökningsdatum och är inte medräknade.', { count: metrics.ongoingWithoutDate })}
                  </p>
                )}
              </div>
              <p className="text-xs text-stone-600">
                {t('applications.analytics.selfReportedHint', 'Siffrorna bygger på de statusar du själv sätter — portalen får inga svar från arbetsgivarna.')}
              </p>
            </div>
          ) : (
            /* Under 5 skickade: antal istället för procent — små underlag ger
               missvisande (och potentiellt nedslående) siffror. DESIGN.md §2. */
            <div className="space-y-3">
              {metrics.submitted === 0 ? (
                <>
                  <p className="text-sm font-medium text-stone-900">
                    {t('applications.analytics.noApplicationsYet', 'Du har inte skickat någon ansökan än')}
                  </p>
                  <p className="text-sm text-stone-700">
                    {t('applications.analytics.noApplicationsYetHint', 'Du har {{count}} sparade jobb — när du söker ett av dem följer du processen här.', { count: metrics.savedNotApplied })}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">{t('applications.analytics.submitted', 'Skickade ansökningar')}</span>
                    <span className="font-medium text-stone-900 tabular-nums">{metrics.submitted}</span>
                  </div>
                  {metrics.marked > 0 && (
                    <p className="text-sm text-stone-700">
                      {t('applications.analytics.markedRespondedCount', 'Du har markerat {{count}} som besvarad', { count: metrics.marked })}
                    </p>
                  )}
                  {metrics.interviews > 0 && (
                    <p className="text-sm text-stone-700">
                      {t('applications.analytics.interviewsCount', { count: metrics.interviews })}
                    </p>
                  )}
                  <p className="text-xs text-stone-600">
                    {t('applications.analytics.tooFewForRates', 'Procentsiffror visas när du har skickat minst fem ansökningar — ett litet underlag ger missvisande siffror.')}
                  </p>
                  <p className="text-xs text-stone-600">
                    {t('applications.analytics.selfReportedHint', 'Siffrorna bygger på de statusar du själv sätter — portalen får inga svar från arbetsgivarna.')}
                  </p>
                </>
              )}
            </div>
          )}
        </Card>

        {/* `min-w-0`: en grid-kolumn krymper inte under sitt innehålls
            min-content, och RecentActivitys `truncate`-titlar gav kolumnen
            580 px min-content. Resultatet var 138 px sidoskroll på 390 px
            mobil — synligt bara på `main.scrollWidth`, inte på
            `documentElement.scrollWidth`, därför fångade ingen grind det. */}
        <div className="md:col-span-2 min-w-0">
          <RecentActivity applications={applications} />
        </div>
      </div>

    </div>
  )
}

export default ApplicationsAnalytics
