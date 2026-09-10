/**
 * Det som är igång — Översiktens andra nivå.  (2026-09-10)
 *
 * Tre kort med riktigt innehåll, i den storlek som gör att man ser det.
 * Regeln: bara sådant som har underlag hamnar här. En ansökan som väntar på
 * svar, en analys som är gjord, samtal som förts. Är allt tomt renderas
 * sektionen inte alls — inviterna bor i hubbkorten under, inte här.
 *
 * Ordningen är fast (ansökningar, analys, AI-team, mående, kalender) och de
 * tre första med data visas. Talen beskriver vad som FINNS, aldrig hur väl
 * man presterar (DESIGN.md §1). Varje kort bär sin hubbfärg som en strimma
 * till vänster — Översikten är det uttryckliga undantaget från
 * en-färg-per-sida (DESIGN.md §4).
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type { OversiktSummary } from '@/hooks/useOversiktHubSummary'
import { datumSprak } from '@/lib/datumsprak'
import { narText } from './oversiktTid'
import { oversiktBilder } from './oversiktBilder'
import type { PanelTillstand } from './OversiktPanel'

interface Kort {
  id: string
  domain: 'activity' | 'coaching' | 'info' | 'wellbeing'
  rubrik: string
  /** Stort tal, eller ett kort ord när det som pågår inte är ett antal. */
  varde: string
  /** Enhet efter talet ("sparade jobb"). Utelämnas när `varde` är text. */
  enhet?: string
  /** Rad under: det konkreta. */
  rad: string
  till: string
}

function kortaTitel(text: string, max = 40): string {
  const s = text.trim().replace(/\s+/g, ' ')
  if (s.length <= max) return s
  const kap = s.slice(0, max)
  const bryt = kap.lastIndexOf(' ')
  return (bryt > max * 0.5 ? kap.slice(0, bryt) : kap).replace(/[\s,.;:–—-]+$/, '') + '…'
}

function byggPagar(s: OversiktSummary, t: TFunction, sprak: string): Kort[] {
  const ut: Kort[] = []
  const jobsok = s.jobsok
  const karriar = s.karriar
  const resurser = s.resurser
  const vardag = s.minVardag

  const stats = jobsok?.applicationStats
  if (stats && stats.total > 0) {
    const vantar = stats.segments.find((seg) => seg.key === 'awaiting')?.count ?? 0
    const delar: string[] = []
    if (vantar > 0) delar.push(t('hubOverview.pagar.awaiting', { defaultValue: '{{count}} väntar på svar', count: vantar }))
    if (stats.awaitingSince) {
      delar.push(
        t('hubOverview.pagar.sentOn', {
          defaultValue: 'skickad {{datum}}',
          datum: new Date(stats.awaitingSince).toLocaleDateString(sprak, { day: 'numeric', month: 'long' }),
        })
      )
    }
    ut.push({
      id: 'applications',
      domain: 'activity',
      rubrik: t('hubOverview.pagar.applications', 'Dina ansökningar'),
      varde: String(stats.total),
      enhet: t('hubOverview.pagar.savedJobs', { defaultValue: 'sparade jobb', count: stats.total }),
      rad: delar.join(' · '),
      till: '/applications',
    })
  }

  const analys = karriar?.latestSkillsAnalysis
  if (analys) {
    ut.push({
      id: 'skills',
      domain: 'coaching',
      rubrik: t('hubOverview.pagar.skills', 'Din kompetensanalys'),
      varde: kortaTitel(analys.dream_job),
      rad: t('hubOverview.pagar.skillsDone', { defaultValue: 'Gjord {{nar}}', nar: narText(analys.created_at, t, sprak) ?? '' }),
      till: '/skills-gap-analysis',
    })
  }

  const samtal = resurser?.aiTeamSessionCount ?? 0
  if (samtal > 0) {
    const senaste = resurser?.aiTeamSessions?.[0]
    const namnNyckel = senaste ? `aiTeam.agents.${senaste.agent_id}.name` : null
    const namn = namnNyckel && t(namnNyckel) !== namnNyckel ? t(namnNyckel) : null
    ut.push({
      id: 'aiTeam',
      domain: 'info',
      rubrik: t('hubOverview.pagar.aiTeam', 'Ditt AI-team'),
      varde: String(samtal),
      enhet: t('hubOverview.pagar.sessions', { defaultValue: 'samtal', count: samtal }),
      rad: namn ? t('hubOverview.pagar.lastWith', { defaultValue: 'Senast med {{namn}}', namn }) : '',
      till: '/ai-team',
    })
  }

  const mood = vardag?.recentMoodLogs ?? []
  if (mood.length > 0) {
    ut.push({
      id: 'mood',
      domain: 'wellbeing',
      rubrik: t('hubOverview.pagar.mood', 'Hur du mår'),
      varde: String(mood.length),
      enhet: t('hubOverview.pagar.moodLogs', { defaultValue: 'loggningar', count: mood.length }),
      rad: t('hubOverview.pagar.moodLatest', { defaultValue: 'Senast {{nar}}', nar: narText(mood[0].log_date, t, sprak) ?? '' }),
      till: '/wellness',
    })
  }

  const handelse = vardag?.upcomingEvents?.[0]
  if (handelse) {
    ut.push({
      id: 'event',
      domain: 'wellbeing',
      rubrik: t('hubOverview.pagar.event', 'Nästa i kalendern'),
      varde: kortaTitel(handelse.title),
      rad: new Date(handelse.date).toLocaleDateString(sprak, { weekday: 'long', day: 'numeric', month: 'long' }),
      till: '/calendar',
    })
  }

  return ut.slice(0, 3)
}

export default function Pagar({
  summary,
  tillstand,
}: {
  summary: OversiktSummary | undefined
  tillstand: PanelTillstand
}) {
  const { t, i18n } = useTranslation()
  if (tillstand !== 'klart' || !summary) return null
  const kort = byggPagar(summary, t, datumSprak(i18n.language))
  if (kort.length === 0) return null

  return (
    <section aria-labelledby="pagar-rubrik" data-testid="pagar">
      <h2
        id="pagar-rubrik"
        className="m-0 mb-2.5 flex items-center gap-2.5 text-[15px] font-semibold text-stone-600 dark:text-stone-400"
      >
        {/* Stiltest 2026-09-10: sneakers = "igång". Dekorativ. */}
        <img src={oversiktBilder().sneakers} alt="" aria-hidden="true" loading="lazy" className="h-9 w-9 object-contain" />
        {t('hubOverview.pagar.heading', 'Det som är igång')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kort.map((k) => (
          <Link
            key={k.id}
            to={k.till}
            data-domain={k.domain}
            className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 border-l-[3px] border-l-[var(--c-solid)] bg-white dark:bg-stone-900 px-4 py-4 no-underline hover:border-stone-300 dark:hover:border-stone-600 hover:border-l-[var(--c-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]"
          >
            <span className="text-[15px] font-semibold text-stone-900 dark:text-stone-100">{k.rubrik}</span>
            <span className="flex items-baseline gap-2 min-w-0">
              <span
                className={
                  /^\d+$/.test(k.varde)
                    ? 'text-[30px] font-semibold leading-none tracking-tight tabular-nums text-stone-900 dark:text-stone-100'
                    : 'text-[20px] font-semibold leading-tight tracking-tight text-stone-900 dark:text-stone-100 truncate'
                }
              >
                {k.varde}
              </span>
              {k.enhet && (
                <span className="text-[15px] font-medium text-stone-500 dark:text-stone-400">{k.enhet}</span>
              )}
            </span>
            {k.rad && <span className="text-[14px] text-stone-600 dark:text-stone-300">{k.rad}</span>}
          </Link>
        ))}
      </div>
    </section>
  )
}
