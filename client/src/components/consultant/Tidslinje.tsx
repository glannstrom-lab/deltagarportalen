/**
 * Tidslinje — deltagarens händelser i tidsordning (PG16/F14, 2026-09-12).
 *
 * Ersätter texten "Aktivitetshistorik kommer". Tre lägen: laddar / fel / klart.
 * Tomt underlag är en invit, inte ett löfte. Varje händelse länkar in i den
 * sektion där den hör hemma (journal, mål, aktivitet, översikt).
 */

import { useEffect, useState, type ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Target, CheckCircle, Calendar, Briefcase, ClipboardCheck, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { tidslinjeApi, type TidslinjeHandelse, type TidslinjeSektion, type TidslinjeTyp } from '@/services/tidslinjeApi'

const IKON: Record<TidslinjeTyp, ElementType> = {
  journal: MessageSquare,
  mal: Target,
  mal_klart: CheckCircle,
  mote: Calendar,
  plats: Briefcase,
  pass: ClipboardCheck,
}

interface Props {
  participantId: string
  /** Öppnar sektionen händelsen hör hemma i. */
  onGaTill: (sektion: TidslinjeSektion) => void
}

type Lage =
  | { status: 'laddar' }
  | { status: 'fel'; meddelande: string }
  | { status: 'klart'; handelser: TidslinjeHandelse[]; misslyckadeKallor: string[] }

export function Tidslinje({ participantId, onGaTill }: Props) {
  const { t } = useTranslation()
  const [lage, setLage] = useState<Lage>({ status: 'laddar' })

  useEffect(() => {
    let aktiv = true
    setLage({ status: 'laddar' })
    tidslinjeApi
      .hamtaTidslinje(participantId)
      .then((r) => { if (aktiv) setLage({ status: 'klart', ...r }) })
      .catch((err) => { if (aktiv) setLage({ status: 'fel', meddelande: err instanceof Error ? err.message : String(err) }) })
    return () => { aktiv = false }
  }, [participantId])

  if (lage.status === 'laddar') {
    return (
      <Card className="p-5">
        <p role="status" aria-live="polite" className="text-sm text-stone-500 dark:text-stone-400">
          {t('consultant.participantDetail.timelineLoading')}
        </p>
      </Card>
    )
  }

  if (lage.status === 'fel') {
    return (
      <Card className="p-5">
        <div role="alert" className="flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-stone-700 dark:text-stone-200">{t('consultant.participantDetail.timelineError')}</p>
        </div>
      </Card>
    )
  }

  const { handelser, misslyckadeKallor } = lage

  return (
    <Card className="p-5">
      {misslyckadeKallor.length > 0 && (
        <p role="status" className="mb-4 text-sm text-amber-700 dark:text-amber-300">
          {t('consultant.participantDetail.timelinePartial', { kallor: misslyckadeKallor.join(', ') })}
        </p>
      )}

      {handelser.length === 0 ? (
        <div className="py-10 text-center">
          <Clock className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-500 mb-3" aria-hidden="true" />
          <p className="font-medium text-stone-700 dark:text-stone-200">
            {t('consultant.participantDetail.timelineEmptyTitle')}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
            {t('consultant.participantDetail.timelineEmptyDesc')}
          </p>
        </div>
      ) : (
        <ol className="space-y-0" aria-label={t('consultant.participantDetail.tabs.timeline')}>
          {handelser.map((h, index) => {
            const Ikon = IKON[h.typ]
            const datum = new Date(h.tidpunkt)
            const datumText = Number.isNaN(datum.getTime())
              ? h.tidpunkt
              : datum.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            return (
              <li key={h.id} className="flex gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center">
                    <Ikon className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
                  </div>
                  {index < handelser.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-stone-200 dark:bg-stone-700" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 pb-6 min-w-0">
                  <button
                    type="button"
                    onClick={() => onGaTill(h.sektion)}
                    className="text-left font-medium text-stone-900 dark:text-stone-100 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded"
                  >
                    {h.titel}
                  </button>
                  {h.detalj && (
                    <p className="text-sm text-stone-600 dark:text-stone-300 break-words">{h.detalj}</p>
                  )}
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    <time dateTime={h.tidpunkt}>{datumText}</time>
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
