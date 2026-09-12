/**
 * UnderlagDialog — F10 (2026-09-13): konsulenten lämnar avvikelseunderlaget
 * till biståndshandläggaren och det blir spårbart: när, av vem, till vem, för
 * vilken period och med vilken närvarosammanfattning. Raden hamnar i
 * `activity_plan_handovers` (migration 20260913020000).
 *
 * Sammanfattningen räknas ur passen i vald period och visas innan konsulenten
 * markerar — det som lämnas är det som syns. Beslutet om nedsättning fattas av
 * socialnämnden, aldrig här; dialogen säger det rakt ut.
 *
 * Samma dialog används för att ångra (läge 'angra'): ett skäl krävs, och
 * databasens vakt släpper bara igenom samma dag som underlaget lämnades.
 */
import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { notifications } from '@/lib/toast'
import {
  sammanfattaNarvaro,
  underlagApi,
  type ActivityPlan,
  type ActivitySession,
  type PlanHandover,
} from '@/services/aktivitetApi'
import { formatLocalDate } from '@/services/aktivitetSchema'

interface LamnaProps {
  lage: 'lamna'
  plan: Pick<ActivityPlan, 'id' | 'participant_id' | 'org_id' | 'start_date'>
  sessions: readonly (Pick<ActivitySession, 'date' | 'attendance'> & { absence_reported_at?: string | null })[]
  onClose: () => void
  onSparat: (h: PlanHandover) => void
}

interface AngraProps {
  lage: 'angra'
  underlag: PlanHandover
  onClose: () => void
  onSparat: (h: PlanHandover) => void
}

export type UnderlagDialogProps = LamnaProps | AngraProps

function forstaIManaden(datum: string): string {
  return `${datum.slice(0, 7)}-01`
}

export function UnderlagDialog(props: UnderlagDialogProps) {
  const { t } = useTranslation()
  const rubrikId = useId()
  const [sparar, setSparar] = useState(false)
  const idag = formatLocalDate(new Date())

  const [mottagare, setMottagare] = useState('')
  const [from, setFrom] = useState(props.lage === 'lamna' ? forstaIManaden(idag) : '')
  const [to, setTo] = useState(idag)
  const [anteckning, setAnteckning] = useState('')
  const [skal, setSkal] = useState('')

  const sammanfattning = useMemo(
    () => (props.lage === 'lamna' && from && to && from <= to ? sammanfattaNarvaro(props.sessions, from, to) : null),
    [props, from, to],
  )

  const lamna = async () => {
    if (props.lage !== 'lamna' || !sammanfattning) return
    setSparar(true)
    try {
      const h = await underlagApi.lamna({
        plan: props.plan,
        recipient: mottagare,
        period_from: from,
        period_to: to,
        summary: sammanfattning,
        note: anteckning,
      })
      notifications.success(t('consultant.underlag.sparat'))
      props.onSparat(h)
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : t('consultant.underlag.fel'))
    } finally {
      setSparar(false)
    }
  }

  const angra = async () => {
    if (props.lage !== 'angra') return
    setSparar(true)
    try {
      const h = await underlagApi.angra(props.underlag.id, skal)
      props.onSparat(h)
    } catch (err) {
      notifications.error(err instanceof Error ? err.message : t('consultant.underlag.fel'))
    } finally {
      setSparar(false)
    }
  }

  if (props.lage === 'angra') {
    return (
      <Dialog isOpen onClose={props.onClose} labelledBy={rubrikId} className="max-w-md">
        <div className="p-6 space-y-4">
          <h2 id={rubrikId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t('consultant.underlag.angraBekrafta')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">{t('consultant.underlag.angraForklaring')}</p>
          <Textarea
            label={t('consultant.underlag.angraSkal')}
            value={skal}
            onChange={(e) => setSkal(e.target.value)}
            rows={3}
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={props.onClose} disabled={sparar}>{t('consultant.underlag.avbryt')}</Button>
            <Button variant="danger" onClick={() => void angra()} disabled={sparar || !skal.trim()}>{t('consultant.underlag.angraBekrafta')}</Button>
          </div>
        </div>
      </Dialog>
    )
  }

  const periodOk = Boolean(from && to && from <= to)
  const kanSkicka = periodOk && !!sammanfattning && sammanfattning.pass > 0 && mottagare.trim().length > 0 && !sparar

  return (
    <Dialog isOpen onClose={props.onClose} labelledBy={rubrikId} className="max-w-lg">
      <div className="p-6 space-y-4">
        <h2 id={rubrikId} className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {t('consultant.underlag.dialogTitel')}
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-300">{t('consultant.underlag.dialogIngress')}</p>

        <Input
          label={t('consultant.underlag.mottagare')}
          value={mottagare}
          onChange={(e) => setMottagare(e.target.value)}
          placeholder={t('consultant.underlag.mottagarePlaceholder')}
          maxLength={200}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" label={t('consultant.underlag.periodFrom')} value={from} min={props.plan.start_date} max={to || idag} onChange={(e) => setFrom(e.target.value)} required />
          <Input type="date" label={t('consultant.underlag.periodTo')} value={to} min={from || props.plan.start_date} max={idag} onChange={(e) => setTo(e.target.value)} required />
        </div>

        <div className="rounded-lg bg-stone-50 dark:bg-stone-800/60 p-3 text-sm" role="status" aria-live="polite">
          <p className="font-medium text-stone-800 dark:text-stone-200 mb-1">{t('consultant.underlag.sammanfattning')}</p>
          {sammanfattning && sammanfattning.pass > 0 ? (
            <p className="text-stone-700 dark:text-stone-300">{t('consultant.underlag.sammanfattningRad', { ...sammanfattning } as Record<string, number>)}</p>
          ) : (
            <p className="text-stone-600 dark:text-stone-400">{t('consultant.underlag.ingaPass')}</p>
          )}
        </div>

        <Textarea
          label={t('consultant.underlag.anteckning')}
          value={anteckning}
          onChange={(e) => setAnteckning(e.target.value)}
          placeholder={t('consultant.underlag.anteckningPlaceholder')}
          rows={3}
          maxLength={2000}
        />
        <p className="text-xs text-stone-500">{t('consultant.underlag.raknasIvo')}</p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={props.onClose} disabled={sparar}>{t('consultant.underlag.avbryt')}</Button>
          <Button onClick={() => void lamna()} disabled={!kanSkicka}>{t('consultant.underlag.skicka')}</Button>
        </div>
      </div>
    </Dialog>
  )
}
