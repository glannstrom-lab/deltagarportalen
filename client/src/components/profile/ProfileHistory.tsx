/**
 * ProfileHistory - Visa ändringshistorik för profilen
 */

import { useState, useEffect } from 'react'
import { History, Loader2, ChevronDown, ChevronUp, Clock } from '@/components/ui/icons'
import { profileHistoryApi, type ProfileHistoryEntry } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

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
  // Add more as needed
}

export function ProfileHistory({ className }: Props) {
  const [history, setHistory] = useState<ProfileHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const data = await profileHistoryApi.getAll(50)
      setHistory(data)
    } catch (err) {
      console.error('Error loading history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just nu'
    if (diffMins < 60) return `${diffMins} min sedan`
    if (diffHours < 24) return `${diffHours} tim sedan`
    if (diffDays < 7) return `${diffDays} dagar sedan`

    return d.toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'create': return 'Skapad'
      case 'update': return 'Uppdaterad'
      case 'delete': return 'Borttagen'
      default: return type
    }
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      case 'update': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      case 'delete': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      default: return 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(tomt)'
    if (typeof value === 'string') return value || '(tomt)'
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '(tomt)'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brand-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-stone-500" />
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">Ändringshistorik</h3>
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
                    {FIELD_LABELS[entry.field_name] || entry.field_name}
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
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Tidigare värde</p>
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs text-stone-600 dark:text-stone-400 whitespace-pre-wrap break-words">
                          {formatValue(entry.old_value)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Nytt värde</p>
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
          Ingen ändringshistorik än. Ändringar du gör i din profil loggas här.
        </p>
      )}
    </div>
  )
}
