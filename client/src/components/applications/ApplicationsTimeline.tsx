/**
 * ApplicationsTimeline — historiken över dina ansökningar
 *
 * Tre saker rättades 2026-08-19:
 * - Anteckningshändelser visade bara etiketten "Anteckning tillagd". Texten
 *   skrivs av databastriggern till `old_value`/`new_value` (se
 *   `20260408100000_applications_enhancement.sql`), medan komponenten läste
 *   `entry.note` — som är null för allt triggern skriver.
 * - Ett trasigt anrop ritades som "Ingen aktivitet än". Nu tre lägen.
 * - Datumrubriken versaliserades med CSS-klassen `capitalize`, som ger
 *   "Söndag 9 Augusti 2026". Svenska skriver inte månad med versal.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Clock, Send, Users, Trophy, CheckCircle,
  MessageSquare, Bell, User, FileText, Archive, Sparkles
} from '@/components/ui/icons'
import { Card, EmptyState, ErrorState, SkeletonList } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplicationLookup } from '@/hooks/useApplications'
import { applicationHistoryApi } from '@/services/applicationsApi'
import { useQuery } from '@tanstack/react-query'
import {
  getStatusLabel,
  type ApplicationHistoryEntry,
  type ApplicationStatus,
  type HistoryEventType
} from '@/types/application.types'

/**
 * Hur många händelser som hämtas.
 *
 * Talet fanns förut bara som en naken `50` i anropet, utan att något i UI:t
 * sa att listan var kapad. Nu står det under listan när taket är nått.
 */
const HANDELSETAK = 50

// label = svensk fallback; visningstexten hämtas via t('applications.timeline.events.*')
// En sida = en hub-färg (DESIGN.md §4): ikonen skiljer händelserna åt, inte
// sex olika pasteller.
const EVENT_CONFIG: Record<HistoryEventType, { icon: React.ElementType; label: string }> = {
  created: { icon: Sparkles, label: 'Sparad' },
  status_change: { icon: Send, label: 'Status ändrad' },
  note_added: { icon: MessageSquare, label: 'Anteckning tillagd' },
  note_updated: { icon: MessageSquare, label: 'Anteckning ändrad' },
  document_attached: { icon: FileText, label: 'Dokument bifogat' },
  reminder_set: { icon: Bell, label: 'Påminnelse satt' },
  reminder_completed: { icon: CheckCircle, label: 'Påminnelse klar' },
  contact_added: { icon: User, label: 'Kontakt tillagd' },
  contact_updated: { icon: User, label: 'Kontakt ändrad' },
  interview_scheduled: { icon: Users, label: 'Intervju bokad' },
  offer_received: { icon: Trophy, label: 'Erbjudande mottaget' },
  archived: { icon: Archive, label: 'Arkiverad' }
}

// Ogardat uppslag tidigare: en händelsetyp som inte finns i unionen (t.ex. en
// ny rad i CHECK-listan) kraschade hela fliken på `config.icon`.
const OKAND_HANDELSE = { icon: Clock, label: 'Händelse' }

function handelsekonfig(typ: HistoryEventType) {
  return EVENT_CONFIG[typ] ?? OKAND_HANDELSE
}

/** Versal på första tecknet — inte CSS `capitalize`, som versaliserar varje ord. */
function stortForsta(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function TimelineEntry({ entry, applicationName }: { entry: ApplicationHistoryEntry; applicationName?: string }) {
  const { t, i18n } = useTranslation()
  const config = handelsekonfig(entry.eventType)
  const Icon = config.icon

  const statusLabel = (value: string) => {
    const status = value.toLowerCase() as ApplicationStatus
    return t(`applications.status.${status}`, getStatusLabel(status))
  }

  const formatStatusChange = () => {
    const oldLabel = entry.oldValue ? statusLabel(entry.oldValue) : null
    const newLabel = entry.newValue ? statusLabel(entry.newValue) : null
    return (
      <span>
        {oldLabel && <span className="text-stone-700">{oldLabel}</span>}
        {oldLabel && newLabel && <span className="text-stone-600"> → </span>}
        {newLabel && <span className="font-medium">{newLabel}</span>}
      </span>
    )
  }

  /**
   * Raden under rubriken.
   *
   * Alla poster i prod är `created` eller `status_change`, och `created` sa
   * bara "Skapad" — tolv rader i rad med exakt samma text säger ingenting om
   * vad som hände. Nu säger varje rad vad den faktiskt gäller: statusen
   * ansökan sparades i, texten i anteckningen, det nya statusnamnet.
   */
  const detalj = () => {
    switch (entry.eventType) {
      case 'status_change':
        return formatStatusChange()
      case 'created':
        // Triggern skriver `NEW.status` till new_value.
        return entry.newValue
          ? t('applications.timeline.createdAs', 'Lades till som {{status}}', { status: statusLabel(entry.newValue) })
          : null
      case 'note_added':
      case 'note_updated':
        // Triggern skriver LEFT(NEW.notes, 200) till new_value — INTE till
        // `note`. Att läsa `entry.note` här gav alltid null, så anteckningen
        // syntes aldrig trots att den låg i raden.
        return entry.newValue
          ? <span className="italic">&quot;{entry.newValue}&quot;</span>
          : null
      default:
        return entry.note ? <span className="italic">&quot;{entry.note}&quot;</span> : null
    }
  }

  const innehall = detalj()

  return (
    <div className="flex gap-3 group">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center bg-[var(--c-bg)]')}>
          <Icon className="w-4 h-4 text-[var(--c-text)]" aria-hidden="true" />
        </div>
        <div className="w-0.5 flex-1 bg-stone-200 group-last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-stone-900 text-sm">
            {t(`applications.timeline.events.${entry.eventType}`, config.label)}
          </p>
          <span className="text-xs text-stone-600 flex-shrink-0">
            {new Date(entry.createdAt).toLocaleTimeString(i18n.language, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {applicationName && (
          <p className="text-xs text-stone-700 mt-0.5">{applicationName}</p>
        )}

        {innehall && (
          <p className="text-sm text-stone-600 mt-1">{innehall}</p>
        )}
      </div>
    </div>
  )
}

export function ApplicationsTimeline() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  // Bara uppslagningen id → ansökan. Tidigare `useApplications()`, som drog
  // igång fem queries för att kunna skriva ut en jobbtitel.
  const {
    byId,
    isLoading: laddarAnsokningar,
    isError: felAnsokningar,
    refetch: hamtaAnsokningarIgen
  } = useApplicationLookup()

  const historik = useQuery({
    queryKey: ['application-history-recent'],
    queryFn: () => applicationHistoryApi.getRecent(HANDELSETAK),
    staleTime: 60 * 1000
  })

  const recentHistory = useMemo(() => historik.data ?? [], [historik.data])

  // Group history by date
  const groupedHistory = useMemo(() => {
    const groups: Array<{ rubrik: string; poster: ApplicationHistoryEntry[] }> = []
    let senasteNyckel: string | null = null

    for (const entry of recentHistory) {
      const datum = new Date(entry.createdAt)
      // Nyckel på lokalt dygn, inte på den formaterade strängen: två olika
      // datum kan formateras lika i en annan locale.
      const nyckel = `${datum.getFullYear()}-${datum.getMonth()}-${datum.getDate()}`
      if (nyckel !== senasteNyckel) {
        senasteNyckel = nyckel
        groups.push({
          rubrik: stortForsta(datum.toLocaleDateString(i18n.language, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })),
          poster: []
        })
      }
      groups[groups.length - 1].poster.push(entry)
    }

    return groups
  }, [recentHistory, i18n.language])

  // Tre uttryckliga lägen. Tidigare fanns bara två, och ett trasigt anrop
  // ritades som "Ingen aktivitet än".
  if (historik.isPending || laddarAnsokningar) {
    return (
      <div className="space-y-6 pb-24">
        <SkeletonList count={5} />
      </div>
    )
  }

  if (historik.isError || felAnsokningar) {
    return (
      <div className="pb-24">
        <ErrorState
          title={t('applications.timeline.errorTitle', 'Historiken kunde inte hämtas')}
          message={t('applications.timeline.errorMessage', 'Vi når inte din aktivitet just nu. Det är inget du gjort fel — försök igen om en stund.')}
          onRetry={() => {
            void historik.refetch()
            void hamtaAnsokningarIgen()
          }}
        />
      </div>
    )
  }

  // pb-24: den fixerade "Öppna mina samlingar"-knappen (z-40) ligger annars
  // ovanpå sista kortet.
  return (
    <div className="space-y-6 pb-24">
      {groupedHistory.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t('applications.timeline.emptyHeading', 'Här ser du vad som hänt')}
          description={t('applications.timeline.emptyLead', 'Varje gång du sparar ett jobb, flyttar en ansökan framåt eller skriver en anteckning hamnar det här — så du slipper minnas allt själv.')}
          action={{
            label: t('applications.timeline.emptyAction', 'Öppna dina ansökningar'),
            onClick: () => navigate('/applications')
          }}
        />
      ) : (
        <>
          <div className="space-y-8">
            {groupedHistory.map(grupp => (
              <div key={grupp.rubrik}>
                <h3 className="text-sm font-medium text-stone-700 mb-4">{grupp.rubrik}</h3>
                <Card className="p-4">
                  {grupp.poster.map(entry => (
                    <TimelineEntry
                      key={entry.id}
                      entry={entry}
                      applicationName={(() => {
                        const app = byId.get(entry.applicationId)
                        if (!app) return undefined
                        return app.jobTitle
                          || (app.jobData as { headline?: string } | undefined)?.headline
                          || t('applications.common.unknownTitle', 'Okänd tjänst')
                      })()}
                    />
                  ))}
                </Card>
              </div>
            ))}
          </div>

          {recentHistory.length >= HANDELSETAK && (
            <p className="text-xs text-stone-600">
              {t('applications.timeline.limitNote', 'Här visas dina {{count}} senaste händelser.', { count: HANDELSETAK })}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default ApplicationsTimeline
