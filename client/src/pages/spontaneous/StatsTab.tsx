/**
 * Stats Tab - View statistics and upcoming follow-ups
 *
 * Tre uttryckliga lägen: laddar / fel / klart (lärdomen 2026-08-09 — ett
 * hämtningsfel renderade tidigare som "du har inte gjort något").
 *
 * Siffrorna här mäter användarens egen loggning, inte verkligheten. Därför:
 * inga procent under minimiunderlag, inga nollor i hjälteposition, ingen
 * benchmark vi inte kan belägga.
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Send,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Target,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/LoadingState'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import { statusConfig } from './spontaneousStatus'
import { formatOrgNumber } from '@/services/bolagsverketApi'
import type { SpontaneousCompany, SpontaneousStatus } from '@/services/supabaseApi'

/**
 * Minsta underlag innan procent visas.
 *
 * Samma tal och samma motivering som `applications.analytics.tooFewForRates`:
 * 1 av 1 blir "100 %" med full stapel, vilket är sant och samtidigt
 * meningslöst — och står dessutom bredvid tips om vad som är "normalt".
 */
const MINSTA_UNDERLAG = 5

const STATUS_ORDNING: SpontaneousStatus[] = [
  'saved',
  'to_contact',
  'contacted',
  'waiting',
  'response_positive',
  'response_negative',
  'no_response',
  'archived',
]

/** Statusar som förutsätter att användaren hört av sig */
const EFTER_KONTAKT: SpontaneousStatus[] = [
  'contacted',
  'waiting',
  'response_positive',
  'response_negative',
  'no_response',
]

/** Lokalt datum som `YYYY-MM-DD` — `toISOString()` är UTC och tippar över vid midnatt */
function lokaltDatum(d: Date): string {
  const ar = d.getFullYear()
  const man = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${ar}-${man}-${dag}`
}

// Stat card component
function StatCard({
  label,
  value,
  invit,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string
  value: number
  /**
   * Texten som ersätter siffran när värdet är noll. En rad utan underlag visar
   * en invit, aldrig en fet nolla (DESIGN.md §2, lärdomen 2026-08-09).
   */
  invit?: string
  icon: typeof Building2
  color: string
  bgColor: string
}) {
  const visaInvit = value === 0 && !!invit

  return (
    <Card className="p-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
        </div>
        <div>
          {visaInvit ? (
            <p className="text-sm text-stone-700 dark:text-stone-300">{invit}</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 tabular-nums">{value}</p>
              <p className="text-sm text-stone-600 dark:text-stone-400">{label}</p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function StatsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    stats,
    companies,
    upcomingFollowups,
    isLoading,
    isLoaded,
    error,
    refreshCompanies,
  } = useSpontaneousCompanies()

  /**
   * "Klart" härleds ur `isLoading || !isLoaded`, inte ur `isLoading === false`.
   * Frågan har `enabled: !!userId`; innan användarens id hunnit sättas är den
   * `pending` men inte `fetching`, och React Query rapporterar då `isLoading`
   * som falskt fast ingenting hämtats. Utan den här raden hade tomtillståndet
   * blinkat förbi för varje deltagare vid sidladdning.
   */
  const laddar = isLoading || (!isLoaded && !error)

  const matt = useMemo(() => berakna(companies), [companies])

  const idag = lokaltDatum(new Date())
  const forsenade = upcomingFollowups.filter(c => (c.followup_date ?? '') < idag)
  const kommande = upcomingFollowups.filter(c => (c.followup_date ?? '') >= idag)

  if (laddar) {
    return (
      <div className="flex justify-center items-center py-12">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--c-solid)]"
          role="status"
          aria-label={t('common.loadingStatus', 'Laddar')}
        />
      </div>
    )
  }

  // Ett hämtningsfel är inte ett tomt konto. Det egna läget, med väg tillbaka —
  // toasten är flyktig och `staleTime`/`refetchOnWindowFocus: false` gör
  // felläget bestående tills någon ber om en ny hämtning.
  if (error) {
    return (
      <ErrorState
        title={t('spontaneous.stats.errorTitle', 'Statistiken kunde inte hämtas')}
        message={t('spontaneous.stats.errorDescription', 'Vi når inte dina sparade företag just nu. Siffrorna skulle bli fel, så vi visar dem inte.')}
        onRetry={() => { void refreshCompanies() }}
      />
    )
  }

  const totalCompanies = companies.length

  // Inga företag än — bjud in i stället för att visa nollor
  if (totalCompanies === 0) {
    return (
      <EmptyState
        illustration="jobb"
        title={t('spontaneous.stats.emptyTitle')}
        description={t('spontaneous.stats.emptyDescription')}
        action={{
          label: t('spontaneous.stats.emptyCta'),
          onClick: () => navigate('/spontanansökan'),
        }}
      />
    )
  }

  const harUnderlag = matt.kontaktade >= MINSTA_UNDERLAG

  return (
    /* pb-24 pa mobil: SamlingarFab ligger fixed i hornet och tackte
       tomtillstandets text. */
    <div className="space-y-6 pb-24 sm:pb-0">
      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
          <TrendingUp className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" aria-hidden="true" />
          {t('spontaneous.stats.overview')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={t('spontaneous.stats.totalSaved')}
            value={totalCompanies}
            icon={Building2}
            color="text-stone-600"
            bgColor="bg-stone-100 dark:bg-stone-800"
          />
          {/*
            Etiketten var "Kontaktade" och stod bredvid statusraden "Kontaktad"
            — två olika tal under nästan samma ord på samma skärm. Kortet räknar
            alla företag du hört av dig till; statusraden räknar bara dem som
            fortfarande står i status "Kontaktad".
          */}
          <StatCard
            label={t('spontaneous.stats.reachedOut', 'Företag du hört av dig till')}
            value={matt.kontaktade}
            invit={t('spontaneous.stats.reachedOutNone', 'Du har inte hört av dig till något företag än')}
            icon={Send}
            color="text-[var(--c-text)]"
            bgColor="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30"
          />
          <StatCard
            label={t('spontaneous.stats.responses')}
            value={matt.svar}
            invit={t('spontaneous.stats.responsesNone', 'Inget svar har kommit än')}
            icon={CheckCircle}
            color="text-[var(--c-text)]"
            bgColor="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30"
          />
          <StatCard
            label={t('spontaneous.stats.waiting')}
            value={stats.waiting}
            invit={t('spontaneous.stats.waitingNone', 'Du väntar inte på något svar just nu')}
            icon={Clock}
            /* amber-600 på amber-100 mätte 2,86:1 — under 3:1 även för ikoner.
               amber-700 mäter 4,51:1. */
            color="text-amber-700 dark:text-amber-300"
            bgColor="bg-amber-100 dark:bg-amber-900/30"
          />
        </div>
      </div>

      {/* Response Rates */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
            <Target className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" aria-hidden="true" />
            {t('spontaneous.stats.responseRate')}
          </h3>

          {matt.kontaktade === 0 ? (
            <EmptyState
              compact
              icon={Send}
              title={t('spontaneous.stats.noContactYetTitle', 'Här ser du hur företagen svarar')}
              description={t('spontaneous.stats.contactToSeeStats')}
              action={{
                label: t('spontaneous.stats.noContactYetCta', 'Se dina sparade företag'),
                onClick: () => navigate('/spontanansökan/mina-foretag'),
              }}
            />
          ) : harUnderlag ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 text-stone-700 dark:text-stone-300">
                  <span>{t('spontaneous.stats.responses')}</span>
                  <span className="font-medium tabular-nums">{matt.svarsfrekvens} %</span>
                </div>
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--c-solid)] rounded-full transition-all"
                    style={{ width: `${matt.svarsfrekvens}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1 text-stone-700 dark:text-stone-300">
                  <span>{t('spontaneous.stats.positiveRate')}</span>
                  <span className="font-medium tabular-nums">
                    {matt.positivFrekvens === null ? '—' : `${matt.positivFrekvens} %`}
                  </span>
                </div>
                {/* Utan fullständigt utfall visas "—" och skälet — aldrig 0 %,
                    och aldrig en siffra som steg av att man arkiverade. */}
                {matt.positivFrekvens === null ? (
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {matt.arkiveradeMedSvar > 0
                      ? t('spontaneous.stats.archivedResponsesExcluded', 'Du har {{count}} arkiverade svar. Utfallet sparas inte när du arkiverar, så andelen positiva skulle bli missvisande.', { count: matt.arkiveradeMedSvar })
                      : t('spontaneous.stats.positiveRateNoBasis', 'Inget av dina svar har kvar sitt utfall, så andelen positiva går inte att räkna ut.')}
                  </p>
                ) : (
                  <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${matt.positivFrekvens}%` }}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('spontaneous.stats.selfReportedHint', 'Siffrorna bygger på de statusar du själv sätter — portalen får inga svar från företagen.')}
              </p>
            </div>
          ) : (
            /* Under minimiunderlaget: antal i stället för procent. Samma
               hållning som applications.analytics.tooFewForRates. */
            <div className="space-y-3">
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {t('spontaneous.stats.reachedOutCount', 'Du har hört av dig till {{count}} företag', { count: matt.kontaktade })}
              </p>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {t('spontaneous.stats.responsesCount', '{{count}} av dem har svarat', { count: matt.svar })}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('spontaneous.stats.tooFewForRates', 'Procentsiffror visas när du hört av dig till minst fem företag — ett litet underlag ger missvisande siffror.')}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('spontaneous.stats.selfReportedHint', 'Siffrorna bygger på de statusar du själv sätter — portalen får inga svar från företagen.')}
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold mb-4 text-stone-800 dark:text-stone-100">{t('spontaneous.stats.statusDistribution')}</h3>
          {/* Bara statusar som förekommer får en rad. Alla åtta ritades
              tidigare alltid, så den som sparat sitt första företag möttes av
              en rad med sju nollor — det läser som ett underkännande, inte som
              en fördelning. Ordningen är fast så listan inte hoppar när en
              status byter antal. */}
          <div className="space-y-2">
            {STATUS_ORDNING.filter(status => stats[status] > 0).map((status) => (
              <StatusRow
                key={status}
                label={t(`spontaneous.status.${status}`)}
                icon={statusConfig[status].icon}
                value={stats[status]}
                total={totalCompanies}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100">
          <Calendar className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-solid)]" aria-hidden="true" />
          {t('spontaneous.followups.title')}
        </h3>

        {upcomingFollowups.length === 0 ? (
          <EmptyState
            compact
            icon={Calendar}
            title={t('spontaneous.followups.emptyTitle', 'Här håller du koll på dina uppföljningar')}
            description={t('spontaneous.followups.empty')}
            action={{
              label: t('spontaneous.followups.emptyCta', 'Planera en uppföljning'),
              onClick: () => navigate('/spontanansökan/mina-foretag'),
            }}
          />
        ) : (
          /*
            Försenade låg tidigare osorterat bland "Kommande" — hookens filter
            har ingen undre gräns. Att filtrera bort dem hade dolt just de
            uppföljningar som behöver göras; de får därför en egen, märkt grupp
            överst i stället.
          */
          <div className="space-y-6">
            {forsenade.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  {t('spontaneous.followups.overdueGroup', 'Försenade')}
                </h4>
                <div className="space-y-3">
                  {forsenade.map((company) => (
                    <FollowupRow key={company.id} company={company} idag={idag} t={t} />
                  ))}
                </div>
              </div>
            )}
            {kommande.length > 0 && (
              <div>
                {forsenade.length > 0 && (
                  <h4 className="text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">
                    {t('spontaneous.followups.upcomingGroup', 'Kommande')}
                  </h4>
                )}
                <div className="space-y-3">
                  {kommande.map((company) => (
                    <FollowupRow key={company.id} company={company} idag={idag} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
        <h3 className="font-semibold mb-2 text-stone-800 dark:text-stone-100">{t('spontaneous.tips.title')}</h3>
        <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-1.5">
          <li>{t('spontaneous.tips.tip1')}</li>
          <li>{t('spontaneous.tips.tip4')}</li>
          {/*
            `tips.tip3Stat` ("En svarsfrekvens på 10-20 % är normalt") är
            borttagen: siffran har ingen källa i docs/ eller .planning/, och
            stod dessutom direkt under användarens egen procentsats. Ersatt av
            ett råd som inte påstår en statistik vi inte kan belägga.
          */}
          <li>{t('spontaneous.tips.responseRateNoBenchmark', 'Svarsfrekvensen säger mer om läget hos arbetsgivarna än om dig — jämför hellre med hur det gick för dig förra månaden än med en siffra.')}</li>
          <li>{t('spontaneous.tips.tip4Stat')}</li>
        </ul>
      </Card>
    </div>
  )
}

/**
 * En rad i statusfördelningen.
 *
 * Staplarna hade sex hårdkodade färger — bl.a. `bg-sky-500` för `contacted`,
 * vilket är Resurser-hubbens färg på en `activity`-sida, och dessutom en annan
 * färg än badgen för samma status (stone i `spontaneousStatus.tsx`).
 *
 * Fördelningen bär nu EN färg: sidans egen `--c-solid`. Identiteten kommer
 * från ikon och etikett, precis som DESIGN.md §4 föreskriver ("differentiering
 * kommer från typografi och ikon — inte från färgsallad"). Ikonen hämtas ur
 * `statusConfig`, så raden och badgen inte kan glida isär igen.
 */
function StatusRow({
  label,
  icon: Icon,
  value,
  total,
}: {
  label: string
  icon: typeof Building2
  value: number
  total: number
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 flex-shrink-0 text-stone-600 dark:text-stone-400" aria-hidden="true" />
      <span className="text-sm w-24 truncate text-stone-700 dark:text-stone-300">{label}</span>
      <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--c-solid)] rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right text-stone-700 dark:text-stone-300 tabular-nums">{value}</span>
    </div>
  )
}

function FollowupRow({
  company,
  idag,
  t,
}: {
  company: SpontaneousCompany
  idag: string
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  const datum = company.followup_date
  const forsenad = !!datum && datum < idag

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50">
      <div>
        <p className="font-medium text-stone-800 dark:text-stone-100">{company.company_name}</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {formatOrgNumber(company.org_number)}
        </p>
      </div>
      <div className="text-right">
        {/* amber-600 på stone-50 mätte 2,82:1 (krav 4,5:1). amber-800 mäter
            6,27:1 i ljust läge, amber-300 8,94:1 i mörkt. */}
        <p className={`text-sm font-medium ${forsenad ? 'text-amber-800 dark:text-amber-300' : 'text-stone-700 dark:text-stone-300'}`}>
          {datum && new Date(datum).toLocaleDateString('sv-SE')}
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {datum && getDaysUntil(datum, idag, t)}
        </p>
      </div>
    </div>
  )
}

/**
 * Härled måtten ur företagslistan i stället för ur statusräknarna.
 *
 * Varför: statusräknarna tappar historik. Arkiverar man sina två avslag föll de
 * ur BÅDE täljare och nämnare i den gamla beräkningen — svarsfrekvensen gick
 * 20 % → 0 % och "positiva svar" 50 % → 100 % av att användaren städade. Ett
 * tal som ändras av att man rensar mäter inte det det heter.
 *
 * Nämnaren är därför händelsebaserad: `outreach_date`/`response_date` sätts av
 * `buildStatusUpdates` när statusen passeras och ligger kvar även efter
 * arkivering. Statusunionen finns med för rader som skapades innan datumen
 * började skrivas.
 *
 * Kvarstående gräns, uttalad i UI: arkivering bevarar ATT ett svar kom, men
 * inte OM det var positivt. Arkiverade svar räknas därför i svarsfrekvensen men
 * hålls utanför andelen positiva, med en rad som säger det.
 */
function berakna(companies: SpontaneousCompany[]) {
  let kontaktade = 0
  let svar = 0
  let positiva = 0
  let kantUtfall = 0
  let arkiveradeMedSvar = 0

  for (const c of companies) {
    const harSvarat = !!c.response_date || c.status === 'response_positive' || c.status === 'response_negative'
    const harKontaktat = !!c.outreach_date || harSvarat || EFTER_KONTAKT.includes(c.status)

    if (harKontaktat) kontaktade++
    if (harSvarat) svar++
    if (c.status === 'response_positive' || c.status === 'response_negative') {
      kantUtfall++
      if (c.status === 'response_positive') positiva++
    } else if (harSvarat) {
      arkiveradeMedSvar++
    }
  }

  return {
    kontaktade,
    svar,
    arkiveradeMedSvar,
    svarsfrekvens: kontaktade > 0 ? Math.round((svar / kontaktade) * 100) : 0,
    /*
     * `null` så snart utfallet är ofullständigt — inte bara när det saknas helt.
     * Med 1 positivt och 2 arkiverade avslag är "100 %" formellt sant om de
     * svar vi fortfarande känner utfallet på, och samtidigt precis den siffra
     * som steg av att användaren städade. Ett tal som ändras av arkivering
     * mäter inte det det heter, så det visas inte alls; skälet skrivs ut i UI.
     */
    positivFrekvens: kantUtfall > 0 && arkiveradeMedSvar === 0
      ? Math.round((positiva / kantUtfall) * 100)
      : null,
  }
}

/** Skillnad i hela dygn mellan två datum-strängar (`YYYY-MM-DD`), UTC-förankrat */
function getDaysUntil(datum: string, idag: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const diffDays = Math.round((Date.parse(`${datum}T00:00:00Z`) - Date.parse(`${idag}T00:00:00Z`)) / 86_400_000)

  if (diffDays < 0) return t('spontaneous.followups.overdue')
  if (diffDays === 0) return t('spontaneous.followups.today')
  if (diffDays === 1) return t('spontaneous.followups.tomorrow')
  // Nås bara för diffDays >= 2 — därför behöver `daysLeft` ingen pluralform.
  return t('spontaneous.followups.daysLeft', { days: diffDays })
}
