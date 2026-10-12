/**
 * OversiktSiffror — nyckeltalen, Målöversikt och Senaste aktivitet, flyttade
 * från Översikt till Rapporter (omtaget "Kvarter", steg 3, 2026-10-11).
 *
 * Förslaget: "Snitt ATS-poäng" och "Möten denna vecka" i hjälteläge var mått
 * på CV:n, inte på konsulentens dag. Under Rapporter är de svar på en fråga
 * någon faktiskt ställer. Reglerna är oförändrade från Översikten:
 *   - KSL14 (2026-10-12): "Snitt ATS-poäng" är borta — ett mått på CV:n, inte på
 *     konsulentens uppdrag. Kortet visar i stället avtalsläget (leverantör: hur
 *     många som var under timkravet senaste avslutade vecka) eller planläget
 *     (kommun: hur många aktiva som har en aktivitetsplan). Kundtypen avgörs av
 *     useRegelverk(); medan den laddar visas ingenting om någondera.
 *   - RK6: veckan är måndag–söndag i lokal tid, även på en söndag.
 *   - KV6-S: "Profilen ändrades senast", aldrig "Loggade in".
 *   - RK23/RK24/RK26: "Oro noterad", målkategorier med samma regel som
 *     Rapporter och PDF:en, dag + klockslag.
 *   - Ett tomt fält är inte en nolla: inga mål → en invit.
 * Ett läsfel ger en rad om felet — aldrig nollor.
 *
 * Konsulentvyn översätts inte (DESIGN.md §2); de i18n-nycklar som redan fanns
 * används som förut.
 */

import { useEffect, useEffectEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Users, FileText, Calendar, Target, Activity, MessageSquare, ClipboardCheck } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import { fetchCachedConsultantParticipants } from './consultantParticipantsQuery'
import { useRegelverk } from '@/components/consultant/useRegelverk'
import { aktivitetsplanApi, type ActivityPlan } from '@/services/aktivitetApi'
import { senasteAvslutadeSondag } from '@/services/aktivitetslogg'
import { formatLocalDate, veckansMandag } from '@/services/aktivitetSchema'
import { leverantorsLage, veckansGranser, type AttGoraPass } from './oversiktRegler'
import { calculateGoalCategories } from './analytics'
import { antal } from './antal'
import { aktivitetstid } from './aktivitetstid'

interface Deltagare {
  participant_id: string
  first_name: string
  last_name: string
  status: string
  has_cv: boolean
  ats_score: number | null
  last_login: string | null
}

interface Aktivitet {
  id: string
  typ: 'cv_updated' | 'login' | 'goal_completed' | 'message'
  namn: string
  participantId: string
  beskrivning: string
  tid: string
}

interface Siffror {
  deltagare: number
  aktiva: number
  /** Aktiva deltagare, för planläget. */
  aktivaIds: string[]
  /** Egna planer och förra veckans pass; `null` = kunde inte hämtas (inte "inga"). */
  plan: { planer: ActivityPlan[]; pass: AttGoraPass[]; deltagare: Deltagare[] } | null
  motenVeckan: number
  olasta: number
  malKlara: number
  malForsenade: number
  malTotalt: number
  kategorier: Array<{ category: string; count: number; percentage: number }>
  aktivitet: Aktivitet[]
}

function Tal({ titel, varde, under, ikon: Ikon, till }: { titel: string; varde: string | number; under?: string; ikon: React.ElementType; till: string }) {
  return (
    <Link
      to={till}
      className="block p-4 sm:p-5 rounded-j-m border border-j-linje bg-j-kort hover:bg-j-sankt transition-colors focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-j-blak-2">{titel}</p>
          <p className="text-2xl sm:text-3xl font-bold text-j-blak mt-1">{varde}</p>
          {under && <p className="text-[0.8125rem] text-j-blak-3 mt-1">{under}</p>}
        </div>
        <Ikon className="w-6 h-6 text-j-blak-3 shrink-0" aria-hidden="true" />
      </div>
    </Link>
  )
}

/**
 * KSL14: kortet som ersatte "Snitt ATS-poäng". Ett värde utan underlag är "—" och en
 * rad om varför — aldrig 0.
 */
function LageTal({ s, regelverk }: { s: Siffror; regelverk: ReturnType<typeof useRegelverk> }) {
  // Kundtypen laddar: inget kundtypsspecifikt kort hellre än fel kort.
  if (regelverk === null) {
    return <Tal titel="Läget" varde="—" under="Hämtar kundtypen" ikon={ClipboardCheck} till="/consultant/participants" />
  }
  if (!s.plan) {
    return (
      <Tal
        titel={regelverk === 'leverantor' ? 'Avtalsläget' : 'Planläget'}
        varde="—"
        under="Planerna kunde inte hämtas"
        ikon={ClipboardCheck}
        till="/consultant/participants"
      />
    )
  }
  if (regelverk === 'leverantor') {
    // Avtalsläget: senaste avslutade veckan mot timkravet (samma regel som Min dag).
    const l = leverantorsLage({
      deltagare: s.plan.deltagare,
      plans: s.plan.planer,
      pass: s.plan.pass,
      moten: [],
      placeringar: [],
      idag: new Date(),
    })
    return l.bedomdaPlaner === 0
      ? <Tal titel="Avtalsläget" varde="—" under="Ingen avslutad vecka att bedöma" ikon={ClipboardCheck} till="/consultant/analytics#avtalskrav" />
      : (
        <Tal
          titel="Avtalsläget"
          varde={`${l.bedomdaPlaner - l.underTimkravet.length} av ${l.bedomdaPlaner}`}
          under="planer nådde timkravet senaste avslutade vecka"
          ikon={ClipboardCheck}
          till="/consultant/analytics#avtalskrav"
        />
      )
  }
  // Planläget: hur många aktiva deltagare som har en aktiv aktivitetsplan.
  const medPlan = new Set(s.plan.planer.filter((p) => p.status === 'active').map((p) => p.participant_id))
  if (s.aktivaIds.length === 0) {
    return <Tal titel="Planläget" varde="—" under="Inga aktiva deltagare" ikon={ClipboardCheck} till="/consultant/participants" />
  }
  const antalMed = s.aktivaIds.filter((id) => medPlan.has(id)).length
  return (
    <Tal
      titel="Planläget"
      varde={`${antalMed} av ${s.aktivaIds.length}`}
      under="aktiva deltagare har en aktivitetsplan"
      ikon={ClipboardCheck}
      till="/consultant/participants?filter=utan-plan"
    />
  )
}

export function OversiktSiffror() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [lage, setLage] = useState<'laddar' | 'fel' | 'klart'>('laddar')
  const [s, setS] = useState<Siffror | null>(null)
  const regelverk = useRegelverk()

  const hamta = async () => {
    setLage('laddar')
    try {
      const { data: { user } } = await anvandareFranSession()
      if (!user) return
      const deltagare = (await fetchCachedConsultantParticipants(queryClient)) as unknown as Deltagare[]
      // RK6: måndag–söndag i lokal tid.
      const { start, slut } = veckansGranser(new Date())
      const [moten, meddelanden, mal, journal] = await Promise.all([
        supabase.from('consultant_meetings').select('*').eq('consultant_id', user.id)
          .gte('scheduled_at', start.toISOString()).lte('scheduled_at', slut.toISOString()).eq('status', 'scheduled'),
        supabase.from('consultant_messages').select('*').eq('receiver_id', user.id).eq('is_read', false),
        supabase.from('consultant_goals').select('*').eq('consultant_id', user.id),
        supabase.from('consultant_journal')
          .select('*, profiles!consultant_journal_participant_id_fkey(first_name, last_name)')
          .eq('consultant_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])
      for (const svar of [moten, meddelanden, mal, journal]) if (svar.error) throw svar.error

      const nu = new Date()
      const lista = deltagare ?? []
      // KSL14: planläget och avtalsläget. Ett misslyckat anrop här fäller inte hela panelen.
      const sondag = senasteAvslutadeSondag(formatLocalDate(nu))
      const [planerSvar, passSvar] = await Promise.allSettled([
        aktivitetsplanApi.listAll(),
        aktivitetsplanApi.listSessionsBetween(veckansMandag(sondag), sondag),
      ])
      const planUnderlag = planerSvar.status === 'fulfilled' && passSvar.status === 'fulfilled'
        ? {
            planer: planerSvar.value.filter((p) => p.consultant_id === user.id),
            pass: passSvar.value as unknown as AttGoraPass[],
            deltagare: lista,
          }
        : null
      const malData = (mal.data ?? []) as Array<{ status: string; deadline: string | null; title?: string; description?: string }>
      const typer: Record<string, Aktivitet['typ']> = { GENERAL: 'message', PROGRESS: 'cv_updated', CONCERN: 'message', GOAL: 'goal_completed' }
      const ord: Record<string, string> = {
        GENERAL: t('consultant.overview.activity.newNote'),
        PROGRESS: t('consultant.overview.activity.progressNoted'),
        // RK23: kategorins eget namn, inte "Fråga uppmärksammad".
        CONCERN: 'Oro noterad',
        GOAL: t('consultant.overview.activity.goalRelated'),
      }
      let aktivitet: Aktivitet[] = ((journal.data ?? []) as Array<{ id: string; category: string; participant_id: string; created_at: string; profiles?: { first_name?: string; last_name?: string } }>).map((e) => ({
        id: e.id,
        typ: typer[e.category] || 'message',
        namn: e.profiles ? `${e.profiles.first_name} ${e.profiles.last_name}` : t('common.unknown'),
        participantId: e.participant_id,
        beskrivning: ord[e.category] || t('consultant.overview.activity.activity'),
        tid: e.created_at,
      }))
      if (aktivitet.length === 0) {
        // KV6-S: last_login är profiles.updated_at — ingen inloggningslogg.
        aktivitet = lista.filter((p) => p.last_login)
          .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
          .slice(0, 5)
          .map((p, i) => ({ id: `login-${i}`, typ: 'login' as const, namn: `${p.first_name} ${p.last_name}`, participantId: p.participant_id, beskrivning: 'Profilen ändrades senast', tid: p.last_login! }))
      }
      setS({
        deltagare: lista.length,
        aktiva: lista.filter((p) => p.status === 'ACTIVE').length,
        aktivaIds: lista.filter((p) => p.status === 'ACTIVE').map((p) => p.participant_id),
        plan: planUnderlag,
        motenVeckan: moten.data?.length ?? 0,
        olasta: meddelanden.data?.length ?? 0,
        malKlara: malData.filter((g) => g.status === 'COMPLETED').length,
        malForsenade: malData.filter((g) => g.deadline && new Date(g.deadline) < nu && g.status !== 'COMPLETED').length,
        malTotalt: malData.length,
        // RK24: samma regel som Rapporter och PDF:en.
        kategorier: calculateGoalCategories(malData as Parameters<typeof calculateGoalCategories>[0]).map(({ category, count }) => ({
          category, count, percentage: malData.length > 0 ? Math.round((count / malData.length) * 100) : 0,
        })),
        aktivitet,
      })
      setLage('klart')
    } catch (e) {
      console.error('[OversiktSiffror]', e)
      setLage('fel')
    }
  }

  const hamtaEnGang = useEffectEvent(() => { void hamta() })
  useEffect(() => { hamtaEnGang() }, [])

  return (
    <section aria-labelledby="oversikt-siffror-rubrik" className="space-y-4" data-testid="oversikt-siffror">
      <div>
        <h2 id="oversikt-siffror-rubrik" className="text-lg font-semibold text-j-blak">Deltagare, mål och aktivitet</h2>
        <p className="text-sm text-j-blak-2">Siffrorna som tidigare stod på Översikt.</p>
      </div>

      {lage === 'laddar' && <div className="h-24 rounded-j-m bg-j-sankt animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
      {lage === 'fel' && (
        <p role="alert" className="text-sm text-[var(--s-ogiltig-text)]">
          Siffrorna kunde inte hämtas.{' '}
          <button type="button" onClick={() => void hamta()} className="font-semibold underline underline-offset-2">Försök igen</button>
        </p>
      )}

      {lage === 'klart' && s && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Tal titel={t('consultant.overview.totalParticipants')} varde={s.deltagare} under={antal(s.aktiva, 'aktiv', 'aktiva')} ikon={Users} till="/consultant/participants" />
            <LageTal s={s} regelverk={regelverk} />
            <Tal
              titel={t('consultant.overview.meetingsThisWeek')}
              varde={s.motenVeckan}
              under={s.olasta > 0 ? antal(s.olasta, 'oläst meddelande', 'olästa meddelanden') : t('consultant.overview.scheduled')}
              ikon={Calendar}
              till="/consultant/communication"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <div className="p-4 sm:p-5 border-b border-j-linje flex items-center gap-2">
                <Activity className="w-5 h-5 text-j-blak-3" aria-hidden="true" />
                <h3 className="font-semibold text-j-blak">{t('consultant.overview.recentActivity')}</h3>
              </div>
              <div className="p-2">
                {s.aktivitet.length > 0 ? (
                  <ul className="divide-y divide-[var(--j-linje)]">
                    {s.aktivitet.map((a) => (
                      <li key={a.id}>
                        <Link to={`/consultant/participants/${a.participantId}`} className="flex items-center gap-3 p-3 hover:bg-j-sankt rounded-j-s">
                          <span className="p-2 rounded-j-s bg-j-sankt" aria-hidden="true">
                            {a.typ === 'cv_updated' && <FileText className="w-4 h-4 text-j-blak-2" />}
                            {a.typ === 'login' && <Users className="w-4 h-4 text-j-blak-2" />}
                            {a.typ === 'goal_completed' && <Target className="w-4 h-4 text-j-blak-2" />}
                            {a.typ === 'message' && <MessageSquare className="w-4 h-4 text-j-blak-2" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium text-j-blak truncate">{a.namn}</span>
                            <span
                              className="block text-sm text-j-blak-2"
                              title={a.typ === 'login' ? 'Visar när profilen senast ändrades — portalen har ingen riktig inloggningslogg.' : undefined}
                            >
                              {a.beskrivning}
                            </span>
                          </span>
                          {/* RK26: dag + klockslag. */}
                          <time dateTime={a.tid} className="text-xs text-j-blak-3 whitespace-nowrap">{aktivitetstid(a.tid)}</time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-6 text-center text-j-blak-2">{t('consultant.overview.noActivity')}</p>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-4 sm:p-5 border-b border-j-linje flex items-center gap-2">
                <Target className="w-5 h-5 text-j-blak-3" aria-hidden="true" />
                <h3 className="font-semibold text-j-blak">{t('consultant.overview.goalsOverview')}</h3>
              </div>
              <div className="p-4 sm:p-5">
                {s.malTotalt === 0 ? (
                  // Ett tomt fält är inte en nolla (drift 2026-09-22).
                  <p className="text-sm text-j-blak-2">Inga mål satta än. Mål som du och deltagarna sätter visas här.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-j-m bg-[var(--s-narvarande-bg)]">
                      <p className="text-3xl font-bold text-[var(--s-narvarande-text)]">{s.malKlara}</p>
                      <p className="text-sm text-j-blak-2 mt-1">{t('consultant.overview.completedGoals')}</p>
                    </div>
                    <div className="text-center p-4 rounded-j-m bg-[var(--s-ogiltig-bg)]">
                      <p className="text-3xl font-bold text-[var(--s-ogiltig-text)]">{s.malForsenade}</p>
                      <p className="text-sm text-j-blak-2 mt-1">{t('consultant.overview.overdueGoals')}</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-j-linje">
                  <h4 className="text-sm font-medium text-j-blak-2 mb-3">{t('consultant.overview.topGoalCategories')}</h4>
                  {s.kategorier.length > 0 ? (
                    <div className="space-y-2" data-testid="malkategorier">
                      {s.kategorier.map((k) => (
                        <div key={k.category} className="flex items-center justify-between">
                          <span className="text-sm text-j-blak-2">
                            {k.category} <span className="text-j-blak-3">({antal(k.count, 'mål', 'mål')})</span>
                          </span>
                          <span className="w-24 h-2 bg-j-sankt rounded-full overflow-hidden" aria-hidden="true">
                            <span className={cn('block h-full bg-j-gran rounded-full')} style={{ width: `${k.percentage}%` }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-j-blak-3">{t('consultant.overview.noGoalCategoriesYet')}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </section>
  )
}

