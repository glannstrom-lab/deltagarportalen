/**
 * AktivitetsplanSektion — deltagarens aktivitetsplan i konsulentvyn:
 * veckoschema, närvaro och veckosaldo (KM3/KM4/KM6).
 *
 * Närvaron sätts bara här, av konsulenten. Ogiltig frånvaro är beslutsunderlag
 * för biståndshandläggaren — själva beslutet om nedsättning fattas av
 * socialnämnden i kommunens system, aldrig i portalen. Ingen AI i kedjan.
 *
 * Saldot visar `—` när inga pass finns i veckan, aldrig 0 %.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Loader2, MapPin, CheckCircle2, FileText } from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { downloadAktivitetsplanPDF } from '@/services/aktivitetsplanPdf'
import { orgApi } from '@/services/orgApi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Input'
import { LoadingState, ErrorState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog } from '@/components/ui/Dialog'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { notifications } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  aktivitetsplanApi,
  kanAngraUnderlag,
  underlagApi,
  type PlanHandover,
  FORSORJNINGSHINDER,
  FORSORJNINGSHINDER_ETIKETT,
  type ActivityPlan,
  type ActivitySession,
  type Forsorjningshinder,
  type SessionInput,
} from '@/services/aktivitetApi'
import {
  addDays,
  formatLocalDate,
  isoWeekday,
  timmar,
  veckansMandag,
  veckoampel,
  veckosaldo,
  type ActivityType,
  type Ampel,
  type Attendance,
} from '@/services/aktivitetSchema'
import { TillampaMallDialog } from './TillampaMallDialog'
import { UnderlagDialog } from './UnderlagDialog'
import { JobbsokTidKort } from './JobbsokTidKort'
import { franvaroAv, type FranvaroOrsak } from '@/services/franvaroApi'
import {
  AKTIVITETSTYP_CHIP,
  AKTIVITETSTYP_ETIKETT,
  AKTIVITETSTYP_ORDNING,
  NARVARO_CHIP,
  NARVARO_ETIKETT,
  NARVARO_ORDNING,
  VECKODAG_LANG,
  formatTimmar,
  klockslag,
  kortDatum,
  langtDatum,
} from './aktivitetEtiketter'

interface AktivitetsplanSektionProps {
  participantId: string
  participantName: string
}

type PlanLage =
  | { status: 'laddar' }
  | { status: 'fel'; fel: string }
  | { status: 'klart'; plan: ActivityPlan | null; sessions: ActivitySession[]; underlag: PlanHandover[]; underlagFel: string | null }

const AMPEL_TEXT: Record<Ampel, { text: string; klass: string }> = {
  inga_pass: { text: 'Inga pass den här veckan', klass: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  under_mal: { text: 'Under veckomålet', klass: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  pa_mal: { text: 'På veckomålet', klass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' },
  ogiltig_franvaro: { text: 'Ogiltig frånvaro i veckan', klass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200' },
}

const STATUS_TEXT: Record<ActivityPlan['status'], string> = { active: 'Aktiv', paused: 'Pausad', ended: 'Avslutad' }

export function AktivitetsplanSektion({ participantId, participantName }: AktivitetsplanSektionProps) {
  const { t } = useTranslation()
  const { confirm } = useConfirmDialog()
  const [lage, setLage] = useState<PlanLage>({ status: 'laddar' })
  // F10: lämnade underlag till handläggaren (spårbara rader, inte planens datum)
  const [underlagDialog, setUnderlagDialog] = useState<null | { lage: 'lamna' } | { lage: 'angra'; underlag: PlanHandover }>(null)
  const [vecka, setVecka] = useState(() => veckansMandag(formatLocalDate(new Date())))
  const [visaTillampa, setVisaTillampa] = useState(false)
  const [visaNyttPass, setVisaNyttPass] = useState(false)
  const [sparaPlan, setSparaPlan] = useState<'hinder' | 'pdf' | null>(null)
  const profile = useAuthStore((s) => s.profile)

  // Hämtningen bor i effekten och skriver tillstånd först efter await —
  // inget setState synkront i effekten. ladda() = laddar-läge + ny omgång.
  const [omgang, setOmgang] = useState(0)
  useEffect(() => {
    let aktiv = true
    ;(async () => {
      try {
        const plan = await aktivitetsplanApi.getForParticipant(participantId)
        const sessions = plan ? await aktivitetsplanApi.listAllSessions(plan.id) : []
        // F10: underlagen är en egen tabell (migration 20260913020000). Går den
        // inte att läsa visas planen ändå, men med felraden synlig — aldrig tyst.
        let underlag: PlanHandover[] = []
        let underlagFel: string | null = null
        if (plan) {
          try {
            underlag = await underlagApi.list(plan.id)
          } catch (err) {
            underlagFel = err instanceof Error ? err.message : 'Underlagen kunde inte hämtas'
          }
        }
        if (aktiv) setLage({ status: 'klart', plan, sessions, underlag, underlagFel })
      } catch (err) {
        if (aktiv) setLage({ status: 'fel', fel: err instanceof Error ? err.message : 'Planen kunde inte hämtas.' })
      }
    })()
    return () => { aktiv = false }
  }, [participantId, omgang])

  const ladda = useCallback(() => {
    setLage({ status: 'laddar' })
    setOmgang((n) => n + 1)
  }, [])

  const ersattPlan = (p: ActivityPlan) => {
    setLage((prev) => (prev.status === 'klart' ? { ...prev, plan: p } : prev))
  }

  // F10: nytt eller ångrat underlag in i listan, och planens synkade datum
  // (triggern i databasen) speglas lokalt så PDF:en visar samma sak.
  const taEmotUnderlag = (h: PlanHandover) => {
    setUnderlagDialog(null)
    setLage((prev) => {
      if (prev.status !== 'klart' || !prev.plan) return prev
      const utanDenna = prev.underlag.filter((u) => u.id !== h.id)
      const underlag = [h, ...utanDenna].sort((a, b) => (a.handed_over_at < b.handed_over_at ? 1 : -1))
      const senaste = underlag.find((u) => !u.withdrawn_at)
      const datum = senaste ? new Date(senaste.handed_over_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }) : null
      return { ...prev, underlag, plan: { ...prev.plan, nedsattning_underlag_lamnat_at: datum } }
    })
  }

  // KM7: kategori för IVO-underlaget. Ändras direkt på planen.
  const sattHinder = async (plan: ActivityPlan, varde: '' | Forsorjningshinder) => {
    setSparaPlan('hinder')
    try {
      ersattPlan(await aktivitetsplanApi.update(plan.id, { forsorjningshinder: varde || null }))
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Försörjningshinder kunde inte sparas')
    } finally {
      setSparaPlan(null)
    }
  }

  // KM7 → F10: "underlag lämnat" var en tidsstämpel på planen med Ångra utan spår.
  // Nu en rad per överlämning (UnderlagDialog + underlagApi); planens datum synkas av databasen.

  const laddaNerPdf = async (plan: ActivityPlan, sessions: ActivitySession[]) => {
    setSparaPlan('pdf')
    try {
      // Organisationsnamnet ur konsulentens medlemskap, matchat mot planens org_id.
      // Går hämtningen fel skrivs "-" i PDF:en — namnet är inte värt att fälla utskriften för.
      const organizationName = plan.org_id
        ? await orgApi.myMemberships().then((m) => m.find((x) => x.org_id === plan.org_id)?.organization.name ?? null).catch(() => null)
        : null
      await downloadAktivitetsplanPDF({
        plan,
        sessions,
        participantName,
        consultantName: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Arbetskonsulent',
        organizationName,
      })
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'PDF:en kunde inte skapas')
    } finally {
      setSparaPlan(null)
    }
  }

  const ersattSession = (s: ActivitySession) => {
    setLage((prev) => prev.status === 'klart'
      ? { ...prev, sessions: prev.sessions.map((x) => (x.id === s.id ? s : x)) }
      : prev)
  }

  const avslutaPlan = async (plan: ActivityPlan) => {
    const ok = await confirm({
      title: 'Avsluta aktivitetsplanen?',
      message: 'Planen markeras som avslutad. Passen och närvaron finns kvar som underlag.',
      confirmText: 'Avsluta plan',
      cancelText: 'Avbryt',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await aktivitetsplanApi.end(plan.id)
      notifications.success('Planen är avslutad')
      void ladda()
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Planen kunde inte avslutas')
    }
  }

  if (lage.status === 'laddar') return <LoadingState message="Hämtar aktivitetsplan…" />
  if (lage.status === 'fel') return <ErrorState title="Planen kunde inte hämtas" message={lage.fel} onRetry={() => void ladda()} />

  const { plan, sessions } = lage

  if (!plan) {
    return (
      <>
        <EmptyState
          icon={CalendarDays}
          title="Ingen aktivitetsplan än"
          description={`Tillämpa en schemamall så får ${participantName} ett veckoschema och du kan följa närvaron.`}
          action={{ label: 'Tillämpa schemamall', onClick: () => setVisaTillampa(true) }}
        />
        <TillampaMallDialog
          isOpen={visaTillampa}
          onClose={() => setVisaTillampa(false)}
          participantId={participantId}
          participantName={participantName}
          onCreated={() => {
            setVisaTillampa(false)
            notifications.success('Planen är skapad')
            void ladda()
          }}
        />
      </>
    )
  }

  const saldo = veckosaldo(sessions, vecka)
  const ampel = veckoampel(saldo, plan.weekly_hours_target)
  const veckansPass = sessions.filter((s) => s.date >= vecka && s.date <= addDays(vecka, 6))
  const dagar = Array.from(new Set(veckansPass.map((s) => s.date))).sort()
  const idag = formatLocalDate(new Date())

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {plan.template_name ?? 'Aktivitetsplan'}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 align-middle">
                {STATUS_TEXT[plan.status]}
              </span>
            </h3>
            <dl className="text-sm text-stone-600 dark:text-stone-300 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex gap-2"><dt className="text-stone-500">Period</dt><dd>{langtDatum(plan.start_date)}{plan.end_date ? ` – ${langtDatum(plan.end_date)}` : ''}</dd></div>
              <div className="flex gap-2"><dt className="text-stone-500">Veckomål</dt><dd>{formatTimmar(Number(plan.weekly_hours_target))}</dd></div>
              <div className="flex gap-2"><dt className="text-stone-500">Eget jobbsökande</dt><dd>{formatTimmar(Number(plan.jobsearch_hours_per_week))}/vecka i planen</dd></div>
              {plan.decided_at && <div className="flex gap-2"><dt className="text-stone-500">Beslutad</dt><dd>{langtDatum(plan.decided_at)}</dd></div>}
              <div className="flex gap-2 items-center">
                <dt className="text-stone-500">Försörjningshinder</dt>
                <dd>
                  <select
                    aria-label="Försörjningshinder"
                    className="text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-2 py-1"
                    value={plan.forsorjningshinder ?? ''}
                    disabled={sparaPlan === 'hinder'}
                    onChange={(e) => void sattHinder(plan, e.target.value as '' | Forsorjningshinder)}
                  >
                    <option value="">Inte angivet</option>
                    {FORSORJNINGSHINDER.map((f) => <option key={f} value={f}>{FORSORJNINGSHINDER_ETIKETT[f]}</option>)}
                  </select>
                </dd>
              </div>
              <div className="flex gap-2 items-start">
                <dt className="text-stone-500 pt-0.5">{t('consultant.underlag.rubrik')}</dt>
                <dd className="min-w-0">
                  {lage.underlagFel && (
                    <p className="text-xs text-rose-700 dark:text-rose-300" role="status">{lage.underlagFel}</p>
                  )}
                  {lage.underlag.length === 0 && !lage.underlagFel && (
                    <span className="text-stone-500">{t('consultant.underlag.tomt')}</span>
                  )}
                  {lage.underlag.length > 0 && (
                    <ul className="space-y-1" aria-label={t('consultant.underlag.rubrik')}>
                      {lage.underlag.map((h) => {
                        const datum = langtDatum(new Date(h.handed_over_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' }))
                        return (
                          <li key={h.id} className={cn(h.withdrawn_at && 'line-through text-stone-400')}>
                            {t('consultant.underlag.lamnat', { datum, mottagare: h.recipient })}
                            {h.handed_over_by === profile?.id && <span className="text-stone-500"> · {t('consultant.underlag.avVem', { namn: 'dig' })}</span>}
                            <span className="text-stone-500"> · {t('consultant.underlag.period', { from: kortDatum(h.period_from), to: kortDatum(h.period_to) })}</span>
                            {h.withdrawn_at && (
                              <span className="block text-xs no-underline">{t('consultant.underlag.angrat', { datum: kortDatum(h.withdrawn_at.slice(0, 10)), skal: h.withdrawn_reason ?? '' })}</span>
                            )}
                            {kanAngraUnderlag(h) && (
                              <button type="button" className="ml-2 text-xs underline text-stone-500" onClick={() => setUnderlagDialog({ lage: 'angra', underlag: h })}>
                                {t('consultant.underlag.angra')}
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  <button type="button" className="mt-1 text-xs underline text-stone-600 dark:text-stone-300" onClick={() => setUnderlagDialog({ lage: 'lamna' })}>
                    {t('consultant.underlag.lamna')}
                  </button>
                </dd>
              </div>
            </dl>
            {plan.target_reason && (
              <p className="text-sm text-stone-600 dark:text-stone-300"><span className="text-stone-500">Motivering till veckomålet:</span> {plan.target_reason}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button size="sm" variant="outline" disabled={sparaPlan === 'pdf'} onClick={() => void laddaNerPdf(plan, sessions)}>
              <FileText className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Plan som PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVisaNyttPass(true)}>
              <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Lägg till pass
            </Button>
            {plan.status !== 'ended' && (
              <Button size="sm" variant="ghost" onClick={() => avslutaPlan(plan)}>Avsluta plan</Button>
            )}
          </div>
        </div>
        {plan.plan_text && (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-200 whitespace-pre-wrap border-t border-stone-200 dark:border-stone-700 pt-3">{plan.plan_text}</p>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setVecka(addDays(vecka, -7))} aria-label="Föregående vecka">
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 min-w-[12ch] text-center">
              Vecka {kortDatum(vecka)} – {kortDatum(addDays(vecka, 6))}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setVecka(addDays(vecka, 7))} aria-label="Nästa vecka">
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setVecka(veckansMandag(idag))}>Idag</Button>
          </div>
          <span className={cn('text-sm px-3 py-1 rounded-full', AMPEL_TEXT[ampel].klass)} role="status">
            {AMPEL_TEXT[ampel].text}
          </span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Saldotal etikett="Planerat" varde={ampel === 'inga_pass' ? '—' : `${formatTimmar(saldo.planeradeTimmar)} / ${formatTimmar(Number(plan.weekly_hours_target))}`} />
          <Saldotal etikett="Närvaro" varde={ampel === 'inga_pass' ? '—' : formatTimmar(saldo.narvaroTimmar)} />
          <Saldotal etikett="Eget jobbsökande" varde={ampel === 'inga_pass' && saldo.jobbsokTimmar === 0 ? '—' : formatTimmar(saldo.jobbsokTimmar)} />
          <Saldotal
            etikett="Ogiltig frånvaro"
            varde={ampel === 'inga_pass' ? '—' : saldo.antalOgiltigFranvaro === 0 ? 'Ingen' : `${saldo.antalOgiltigFranvaro} pass`}
            varning={saldo.antalOgiltigFranvaro > 0}
          />
        </dl>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Beslut om nedsättning fattas av socialnämnden, inte här. Ogiltig frånvaro är underlag till handläggaren.
          {saldo.antalOmarkerade > 0 && ` ${saldo.antalOmarkerade} pass i veckan är inte markerade än.`}
        </p>

        {/* KM9: eget jobbsökande ur portalens data — deltagarens redovisning, inte kontroll. */}
        <JobbsokTidKort participantId={participantId} plan={plan} vecka={vecka} />

        {dagar.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">Inga pass den här veckan.</p>
        ) : (
          <div className="space-y-4">
            {dagar.map((datum) => (
              <section key={datum} aria-labelledby={`dag-${datum}`}>
                <h4 id={`dag-${datum}`} className={cn('text-sm font-semibold mb-2', datum === idag ? 'text-[var(--c-text)]' : 'text-stone-700 dark:text-stone-200')}>
                  {VECKODAG_LANG[isoWeekday(datum)]} {kortDatum(datum)}{datum === idag ? ' · idag' : ''}
                </h4>
                <ul className="space-y-2">
                  {veckansPass.filter((s) => s.date === datum).map((s) => (
                    <PassRad key={s.id} session={s} onChanged={ersattSession} onRemoved={() => void ladda()} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>

      <NyttPassDialog
        isOpen={visaNyttPass}
        onClose={() => setVisaNyttPass(false)}
        planId={plan.id}
        participantId={participantId}
        defaultDate={vecka}
        onCreated={() => { setVisaNyttPass(false); notifications.success('Passet är tillagt'); void ladda() }}
      />
      {/* F10: underlag till handläggaren — bara med en plan att lämna underlag om */}
      {underlagDialog && (
        underlagDialog.lage === 'lamna'
          ? <UnderlagDialog lage="lamna" plan={plan} sessions={sessions} onClose={() => setUnderlagDialog(null)} onSparat={taEmotUnderlag} />
          : <UnderlagDialog lage="angra" underlag={underlagDialog.underlag} onClose={() => setUnderlagDialog(null)} onSparat={taEmotUnderlag} />
      )}
    </div>
  )
}

function Saldotal({ etikett, varde, varning }: { etikett: string; varde: string; varning?: boolean }) {
  return (
    <div className={cn('rounded-xl px-3 py-2', varning ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-stone-50 dark:bg-stone-800/60')}>
      <dt className="text-xs text-stone-500 dark:text-stone-400">{etikett}</dt>
      <dd className={cn('font-semibold tabular-nums', varning ? 'text-rose-800 dark:text-rose-200' : 'text-stone-900 dark:text-stone-100')}>{varde}</dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ett pass med närvaroknappar
// ---------------------------------------------------------------------------

const FRANVARO_ORSAK_ETIKETT: Record<FranvaroOrsak, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos myndighet',
  other: 'annat skäl',
}

function PassRad({ session, onChanged, onRemoved }: { session: ActivitySession; onChanged: (s: ActivitySession) => void; onRemoved: () => void }) {
  const { confirm } = useConfirmDialog()
  const [oppen, setOppen] = useState(false)
  const [anteckning, setAnteckning] = useState(session.attendance_note ?? '')
  const [intyg, setIntyg] = useState(session.sick_certificate_received)
  const [sparar, setSparar] = useState<Attendance | 'nollstall' | null>(null)
  const egetJobbsok = session.activity_type === 'jobsearch_own'

  const markera = async (attendance: Attendance | null) => {
    setSparar(attendance ?? 'nollstall')
    try {
      const uppdaterad = await aktivitetsplanApi.markAttendance(session.id, {
        attendance,
        note: anteckning,
        sickCertificateReceived: attendance === 'sick_certified' ? intyg : false,
      })
      onChanged(uppdaterad)
      if (attendance !== 'sick_certified') setOppen(false)
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Närvaron kunde inte sparas')
    } finally {
      setSparar(null)
    }
  }

  const taBort = async () => {
    const ok = await confirm({ title: 'Ta bort passet?', message: `${session.title} ${kortDatum(session.date)} ${session.start_time}–${session.end_time} tas bort.`, confirmText: 'Ta bort', cancelText: 'Avbryt', variant: 'danger' })
    if (!ok) return
    try {
      await aktivitetsplanApi.removeSession(session.id)
      onRemoved()
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : 'Passet kunde inte tas bort')
    }
  }

  return (
    <li className={cn('rounded-xl border p-3', session.attendance === 'absent_invalid' ? 'border-rose-300 dark:border-rose-700' : 'border-stone-200 dark:border-stone-700')}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-sm tabular-nums text-stone-600 dark:text-stone-300 shrink-0 w-[11ch]">
          {session.start_time}–{session.end_time}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{session.title}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn('px-2 py-0.5 rounded-full', AKTIVITETSTYP_CHIP[session.activity_type])}>{AKTIVITETSTYP_ETIKETT[session.activity_type]}</span>
            <span>{formatTimmar(timmar(session.start_time, session.end_time))}</span>
            {session.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{session.location}</span>}
            {session.self_checkin_at && (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />Checkade in {klockslag(session.self_checkin_at)}
              </span>
            )}
            {/* F1 (2026-09-12): deltagarens egen anmälan — konsulenten bekräftar via närvaron som förut */}
            {(() => {
              const a = franvaroAv(session)
              if (!a || session.attendance) return null
              return (
                <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-200">
                  Anmäld frånvaro: {FRANVARO_ORSAK_ETIKETT[a.reason]}{a.note ? ` — „${a.note}”` : ''}
                </span>
              )
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {session.attendance ? (
            <span className={cn('text-xs px-2 py-1 rounded-full', NARVARO_CHIP[session.attendance])}>
              {NARVARO_ETIKETT[session.attendance]}{session.attendance === 'sick_certified' && session.sick_certificate_received ? ' · intyg' : ''}
            </span>
          ) : egetJobbsok ? (
            <span className="text-xs text-stone-500">Egen redovisning</span>
          ) : (
            <span className="text-xs text-stone-500">Inte markerad</span>
          )}
          {!egetJobbsok && (
            <Button size="sm" variant="outline" onClick={() => setOppen((o) => !o)} aria-expanded={oppen} aria-controls={`narvaro-${session.id}`}>
              Närvaro
            </Button>
          )}
        </div>
      </div>

      {oppen && !egetJobbsok && (
        <div id={`narvaro-${session.id}`} className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Närvaro för ${session.title} ${kortDatum(session.date)}`}>
            {NARVARO_ORDNING.map((a) => (
              <Button
                key={a}
                size="sm"
                variant={session.attendance === a ? 'primary' : 'outline'}
                onClick={() => markera(a)}
                disabled={sparar !== null}
                aria-pressed={session.attendance === a}
              >
                {sparar === a ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" /> : null}
                {NARVARO_ETIKETT[a]}
              </Button>
            ))}
            {session.attendance && (
              <Button size="sm" variant="ghost" onClick={() => markera(null)} disabled={sparar !== null}>Nollställ</Button>
            )}
          </div>
          <Checkbox
            id={`intyg-${session.id}`}
            label="Läkarintyg inkommet"
            description="Lagen kräver intyg vid sjukfrånvaro. Sparas när du markerar Sjuk."
            checked={intyg}
            onChange={(e) => setIntyg(e.target.checked)}
          />
          <Textarea
            id={`anteckning-${session.id}`}
            label="Anteckning"
            value={anteckning}
            onChange={(e) => setAnteckning(e.target.value)}
            rows={2}
            placeholder="Orsak, kontakt, överenskommelse. Sparas med nästa markering."
            fullWidth
          />
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={taBort}>Ta bort passet</Button>
          </div>
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Manuellt pass
// ---------------------------------------------------------------------------

interface NyttPassDialogProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  participantId: string
  defaultDate: string
  onCreated: () => void
}

function NyttPassDialog(props: NyttPassDialogProps) {
  // Monteras bara öppen: färskt formulär per öppning utan återställande effekt.
  if (!props.isOpen) return null
  return <NyttPassForm {...props} />
}

function NyttPassForm({ isOpen, onClose, planId, participantId, defaultDate, onCreated }: NyttPassDialogProps) {
  const [form, setForm] = useState<SessionInput>({ date: defaultDate, start_time: '09:00', end_time: '12:00', title: '', activity_type: 'jobsearch', location: '' })
  const [forsokt, setForsokt] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const valideringsfel = !form.title.trim() ? 'Passet behöver en rubrik' : form.end_time <= form.start_time ? 'Sluttiden måste vara efter starttiden' : !form.date ? 'Ange datum' : null

  const spara = async () => {
    setForsokt(true)
    if (valideringsfel) return
    setSparar(true)
    setFel(null)
    try {
      await aktivitetsplanApi.addSession(planId, participantId, form)
      onCreated()
    } catch (err) {
      setFel(err instanceof Error ? err.message : 'Passet kunde inte sparas')
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy="nytt-pass-title" className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="p-5 border-b border-stone-200 dark:border-stone-700">
        <h2 id="nytt-pass-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">Lägg till pass</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input id="pass-datum" label="Datum" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth />
          <Input id="pass-start" label="Start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} fullWidth />
          <Input id="pass-slut" label="Slut" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} fullWidth />
        </div>
        <Input id="pass-rubrik" label="Rubrik" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <Select
          id="pass-typ"
          label="Aktivitetstyp"
          options={AKTIVITETSTYP_ORDNING.map((t) => ({ value: t, label: AKTIVITETSTYP_ETIKETT[t] }))}
          value={form.activity_type}
          onChange={(e) => setForm({ ...form, activity_type: e.target.value as ActivityType })}
          fullWidth
        />
        <Input id="pass-plats" label="Plats" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} fullWidth />
        {forsokt && valideringsfel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{valideringsfel}</p>}
        {fel && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{fel}</p>}
      </div>
      <div className="flex justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
        <Button variant="ghost" onClick={onClose} disabled={sparar}>Avbryt</Button>
        <Button onClick={spara} disabled={sparar}>{sparar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}Lägg till</Button>
      </div>
    </Dialog>
  )
}
