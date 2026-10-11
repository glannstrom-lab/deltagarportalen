/**
 * Tidslinje — deltagarens händelser i tidsordning (PG16/F14, 2026-09-12).
 *
 * Ersätter texten "Aktivitetshistorik kommer". Tre lägen: laddar / fel / klart.
 * Tomt underlag är en invit, inte ett löfte. Varje händelse länkar in i den
 * sektion där den hör hemma (journal, mål, aktivitet, översikt).
 */

import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Target, CheckCircle, Calendar, Briefcase, ClipboardCheck, Clock, AlertTriangle } from 'lucide-react'
import { tidslinjeApi, type TidslinjeHandelse, type TidslinjeSektion, type TidslinjeTyp } from '@/services/tidslinjeApi'

/** Omtaget "Kvarter", steg 5: en platt yta i stället för Card, färger ur tokens. */
function Yta({ children }: { children: ReactNode }) {
  return <section className="p-5 sm:p-6 bg-[var(--j-kort)] border border-[var(--j-linje)] rounded-[var(--j-r-l)] text-[var(--j-blak)]">{children}</section>
}

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

  // Flippa till "laddar" så fort deltagaren byts — härlett under render (inte
  // i effekten) så det inte blir ett extra setState-anrop innan hämtningen
  // ens startat.
  const [foregaendeParticipantId, setForegaendeParticipantId] = useState(participantId)
  if (participantId !== foregaendeParticipantId) {
    setForegaendeParticipantId(participantId)
    setLage({ status: 'laddar' })
  }

  useEffect(() => {
    let aktiv = true
    tidslinjeApi
      .hamtaTidslinje(participantId)
      .then((r) => { if (aktiv) setLage({ status: 'klart', ...r }) })
      .catch((err) => { if (aktiv) setLage({ status: 'fel', meddelande: err instanceof Error ? err.message : String(err) }) })
    return () => { aktiv = false }
  }, [participantId])

  if (lage.status === 'laddar') {
    return (
      <Yta>
        <p role="status" aria-live="polite" className="m-0 text-sm text-[var(--j-blak-3)]">
          {t('consultant.participantDetail.timelineLoading')}
        </p>
      </Yta>
    )
  }

  if (lage.status === 'fel') {
    return (
      <Yta>
        <div role="alert" className="flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-[var(--s-ogiltig-ikon)] shrink-0" aria-hidden="true" />
          <p className="m-0 text-[var(--j-blak)]">{t('consultant.participantDetail.timelineError')}</p>
        </div>
      </Yta>
    )
  }

  const { handelser, misslyckadeKallor } = lage

  return (
    <Yta>
      {misslyckadeKallor.length > 0 && (
        <p role="status" className="mb-4 rounded-[var(--j-r-m)] bg-[var(--s-vantar-bg)] px-3 py-2 text-sm text-[var(--s-vantar-text)]">
          {t('consultant.participantDetail.timelinePartial', { kallor: misslyckadeKallor.join(', ') })}
        </p>
      )}

      {handelser.length === 0 ? (
        <div className="py-10 text-center">
          <Clock className="w-10 h-10 mx-auto text-[var(--j-blak-3)] mb-3" aria-hidden="true" />
          <p className="m-0 font-semibold text-[var(--j-blak)]">
            {t('consultant.participantDetail.timelineEmptyTitle')}
          </p>
          <p className="m-0 text-sm text-[var(--j-blak-2)] mt-1 max-w-md mx-auto">
            {t('consultant.participantDetail.timelineEmptyDesc')}
          </p>
        </div>
      ) : (
        <ol className="m-0 p-0 list-none" aria-label={t('consultant.participantDetail.tabs.timeline')}>
          {handelser.map((h, index) => {
            const Ikon = IKON[h.typ]
            const datum = new Date(h.tidpunkt)
            const datumText = Number.isNaN(datum.getTime())
              ? h.tidpunkt
              : datum.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            return (
              <li key={h.id} className="flex gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[var(--j-gran-mjuk)] flex items-center justify-center">
                    <Ikon className="w-5 h-5 text-[var(--j-gran-text)]" aria-hidden="true" />
                  </div>
                  {index < handelser.length - 1 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[var(--j-linje)]" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 pb-6 min-w-0">
                  <button
                    type="button"
                    onClick={() => onGaTill(h.sektion)}
                    className="text-left font-semibold text-[var(--j-blak)] hover:underline underline-offset-4 rounded-[var(--j-r-s)] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--j-fokus)]"
                  >
                    {h.titel}
                  </button>
                  {h.detalj && (
                    <p className="m-0 text-sm text-[var(--j-blak-2)] break-words">{h.detalj}</p>
                  )}
                  <p className="m-0 text-sm text-[var(--j-blak-3)]">
                    <time dateTime={h.tidpunkt}>{datumText}</time>
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Yta>
  )
}
