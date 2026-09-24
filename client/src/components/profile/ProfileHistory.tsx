/**
 * ProfileHistory - Visa ändringshistorik för profilen
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { History, Loader2, ChevronDown, ChevronUp, Clock } from '@/components/ui/icons'
import { profileHistoryApi, type ProfileHistoryEntry } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'
import { datumSprak } from '@/lib/datumsprak'

interface Props {
  className?: string
}

/**
 * Fältnamnen i historiken. Svenskan är reservtext; engelskan bor i
 * `profile.history.fields.<fält>`. Ett okänt fält visas med sitt tekniska namn.
 * Tidigare var hela komponenten svensk i engelskt läge — fältnamn, "Just nu",
 * "5 min sedan", "Skapad", "(tomt)" (prod-svepet 2026-09-24).
 */
const FIELD_LABELS: Record<string, string> = {
  first_name: 'Förnamn',
  last_name: 'Efternamn',
  phone: 'Telefon',
  location: 'Ort',
  bio: 'Bio',
  ai_summary: 'AI-sammanfattning',
  profile_image_url: 'Profilbild',
  desired_jobs: 'Önskade jobb',
  interests: 'Intressen',
  availability: 'Tillgänglighet',
  skills: 'Kompetenser',
}

const ANDRINGSTYPER: Record<string, string> = {
  create: 'Skapad',
  update: 'Uppdaterad',
  delete: 'Borttagen',
}

/**
 * "För 5 minuter sedan" / "5 minutes ago" på aktivt språk, via
 * Intl.RelativeTimeFormat. Äldre än en vecka: datum och tid. Under en minut:
 * "Just nu" / "Just now". `nu` är parameter för testbarhetens skull.
 */
function formateraRelativTid(
  datum: string,
  sprak: string,
  justNu: string,
  nu: Date = new Date()
): string {
  const d = new Date(datum)
  const diffMins = Math.floor((nu.getTime() - d.getTime()) / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const tagg = datumSprak(sprak)

  if (diffMins < 1) return justNu
  const rtf = new Intl.RelativeTimeFormat(tagg, { numeric: 'always' })
  if (diffMins < 60) return rtf.format(-diffMins, 'minute')
  if (diffHours < 24) return rtf.format(-diffHours, 'hour')
  if (diffDays < 7) return rtf.format(-diffDays, 'day')

  return d.toLocaleDateString(tagg, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function ProfileHistory({ className }: Props) {
  const { t, i18n } = useTranslation()
  const [history, setHistory] = useState<ProfileHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  // Läsfel är inte tomhet: profileEnhancementsApi kastar vid läsfel sedan
  // 2026-09-24, och ett fel ska synas som fel — inte som en tom lista.
  const [loadFailed, setLoadFailed] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const data = await profileHistoryApi.getAll(50)
      setHistory(data)
    } catch (err) {
      console.error('Error loading history:', err)
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) =>
    formateraRelativTid(date, i18n.language, t('profile.history.justNow', 'Just nu'))

  const getChangeTypeLabel = (type: string) =>
    ANDRINGSTYPER[type] ? t(`profile.history.changeType.${type}`, ANDRINGSTYPER[type]) : type

  const faltNamn = (falt: string) =>
    FIELD_LABELS[falt] ? t(`profile.history.fields.${falt}`, FIELD_LABELS[falt]) : falt

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      case 'update': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      case 'delete': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      default: return 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
    }
  }

  const formatValue = (value: unknown): string => {
    const tomt = t('profile.history.emptyValue', '(tomt)')
    if (value === null || value === undefined) return tomt
    if (typeof value === 'string') return value || tomt
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : tomt
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[var(--c-solid)] animate-spin" />
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div
        role="alert"
        className={cn('p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800', className)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-stone-800 dark:text-stone-100 flex-1">
            {t('profile.support.historyLoadError')}
          </p>
          <button
            type="button"
            onClick={loadHistory}
            className="self-start sm:self-auto px-3 py-1.5 text-sm font-medium text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-stone-500" />
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('profile.support.changeHistory')}</h3>
      </div>

      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(entry => (
            <div
              key={entry.id}
              className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', getChangeTypeColor(entry.change_type))}>
                    {getChangeTypeLabel(entry.change_type)}
                  </span>
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                    {faltNamn(entry.field_name)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.created_at)}
                  </span>
                  {expanded === entry.id ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </div>
              </button>

              {expanded === entry.id && (
                <div className="px-3 pb-3 border-t border-stone-100 dark:border-stone-700">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.history.previousValue')}</p>
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs text-stone-600 dark:text-stone-400 whitespace-pre-wrap break-words">
                          {formatValue(entry.old_value)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.history.newValue')}</p>
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-stone-600 dark:text-stone-400 whitespace-pre-wrap break-words">
                          {formatValue(entry.new_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
          {t('profile.history.empty', 'Ingen ändringshistorik än. Ändringar du gör i din profil loggas här.')}
        </p>
      )}
    </div>
  )
}
