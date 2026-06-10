/**
 * MinDagSection — konsulentens prioriterade dagsvy i OverviewTab.
 * Svarar på frågan "vem behöver mig idag?": dagens möten med förberedelse
 * (senaste journalanteckning), måldeadlines inom 7 dagar och deltagare
 * som behöver kontakt — varje rad klickbar till handling.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Target,
  Clock,
  MessageSquare,
  ChevronRight,
  CheckCircle,
  Video,
  Phone,
  MapPin,
  AlertTriangle,
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export interface MyDayMeeting {
  id: string
  participantId: string
  participantName: string
  scheduledAt: string
  meetingType: string | null
  meetingLink: string | null
  latestNote: { content: string; category: string; createdAt: string } | null
}

export interface MyDayDeadline {
  goalId: string
  goalTitle: string
  participantId: string
  participantName: string
  deadline: string
  daysLeft: number
}

export interface MyDayContact {
  participantId: string
  participantName: string
  reason: 'no_contact' | 'inactive'
}

interface MinDagSectionProps {
  meetings: MyDayMeeting[]
  deadlines: MyDayDeadline[]
  contacts: MyDayContact[]
  onMessage: (participantId: string) => void
}

const meetingTypeIcons: Record<string, React.ElementType> = {
  video: Video,
  phone: Phone,
  physical: MapPin,
}

function SectionHeading({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300">{label}</h4>
      <span className="text-xs text-stone-500 dark:text-stone-400">({count})</span>
    </div>
  )
}

export function MinDagSection({ meetings, deadlines, contacts, onMessage }: MinDagSectionProps) {
  const { t } = useTranslation()

  const isEmpty = meetings.length === 0 && deadlines.length === 0 && contacts.length === 0

  const today = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <Card>
      <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('consultant.overview.myDay.title')}
          </h3>
          <span className="text-sm text-stone-500 dark:text-stone-400 capitalize">— {today}</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" aria-hidden="true" />
          <p className="font-medium text-stone-900 dark:text-stone-100">
            {t('consultant.overview.myDay.allClear')}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {t('consultant.overview.myDay.allClearDesc')}
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Dagens möten med förberedelse */}
          <div>
            <SectionHeading
              icon={Calendar}
              label={t('consultant.overview.myDay.todaysMeetings')}
              count={meetings.length}
            />
            {meetings.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('consultant.overview.myDay.noMeetingsToday')}
              </p>
            ) : (
              <ul className="space-y-2">
                {meetings.map(m => {
                  const TypeIcon = meetingTypeIcons[m.meetingType || ''] || Calendar
                  return (
                    <li key={m.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/consultant/participants/${m.participantId}`}
                          className="font-medium text-stone-900 dark:text-stone-100 hover:underline truncate"
                        >
                          {m.participantName}
                        </Link>
                        <span className="flex items-center gap-1 text-sm font-medium text-stone-700 dark:text-stone-300 flex-shrink-0">
                          <TypeIcon className="w-4 h-4 text-stone-500" aria-hidden="true" />
                          {new Date(m.scheduledAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {m.latestNote ? (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-2">
                          <span className="font-medium">{t('consultant.overview.myDay.latestNote')}:</span>{' '}
                          {m.latestNote.content}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
                          {t('consultant.overview.myDay.noNotes')}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => onMessage(m.participantId)}
                          className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" aria-hidden="true" />
                          {t('consultant.overview.myDay.sendMessage')}
                        </button>
                        {m.meetingLink && (
                          <a
                            href={m.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            {t('consultant.overview.myDay.joinMeeting')}
                          </a>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Måldeadlines inom 7 dagar */}
          <div>
            <SectionHeading
              icon={Target}
              label={t('consultant.overview.myDay.deadlines')}
              count={deadlines.length}
            />
            {deadlines.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('consultant.overview.myDay.noDeadlines')}
              </p>
            ) : (
              <ul className="space-y-2">
                {deadlines.map(d => (
                  <li key={d.goalId}>
                    <Link
                      to={`/consultant/participants/${d.participantId}`}
                      className="block p-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      <p className="font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
                        {d.goalTitle}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {d.participantName}
                        </span>
                        <span className={cn(
                          'text-xs font-medium flex-shrink-0',
                          d.daysLeft < 0 ? 'text-rose-600' : d.daysLeft <= 2 ? 'text-amber-600' : 'text-stone-500'
                        )}>
                          {d.daysLeft < 0
                            ? t('consultant.overview.myDay.overdue', { count: Math.abs(d.daysLeft) })
                            : d.daysLeft === 0
                              ? t('consultant.overview.myDay.dueToday')
                              : t('consultant.overview.myDay.daysLeft', { count: d.daysLeft })}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Deltagare som behöver kontakt */}
          <div>
            <SectionHeading
              icon={AlertTriangle}
              label={t('consultant.overview.myDay.needsContact')}
              count={contacts.length}
            />
            {contacts.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('consultant.overview.myDay.noContactsNeeded')}
              </p>
            ) : (
              <ul className="space-y-2">
                {contacts.map(c => (
                  <li key={c.participantId} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/consultant/participants/${c.participantId}`}
                        className="font-medium text-stone-900 dark:text-stone-100 hover:underline truncate text-sm"
                      >
                        {c.participantName}
                      </Link>
                      <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {c.reason === 'no_contact'
                        ? t('consultant.alerts.noContact')
                        : t('consultant.alerts.inactive')}
                    </p>
                    <button
                      onClick={() => onMessage(c.participantId)}
                      className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-2"
                    >
                      <MessageSquare className="w-3 h-3" aria-hidden="true" />
                      {t('consultant.overview.myDay.sendMessage')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
