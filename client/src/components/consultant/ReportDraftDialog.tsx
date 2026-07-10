/**
 * ReportDraftDialog
 * AI-utkast till periodrapport från konsulentens journalanteckningar + mål.
 * Anropar /api/ai (funktion: konsulent-rapportutkast). Deltagarens namn
 * skickas aldrig — personen refereras som "deltagaren" (GDPR-minimering).
 */

import { useState } from 'react'
import { X, Sparkles, Loader2, Copy, Check, AlertTriangle } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { notifications } from '@/lib/toast'
import { callAI } from '@/services/aiApi'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ReportDraftDialogProps {
  isOpen: boolean
  onClose: () => void
  participantId: string
}

type Period = '30' | '90' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  '30': 'senaste 30 dagarna',
  '90': 'senaste 90 dagarna',
  all: 'hela insatsperioden',
}

export function ReportDraftDialog({ isOpen, onClose, participantId }: ReportDraftDialogProps) {
  const [period, setPeriod] = useState<Period>('30')
  const [includeConcern, setIncludeConcern] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setDraft('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Hämta journalanteckningar för perioden
      let journalQuery = supabase
        .from('consultant_journal')
        .select('content, category, created_at')
        .eq('consultant_id', user.id)
        .eq('participant_id', participantId)
        .order('created_at', { ascending: true })

      if (period !== 'all') {
        const from = new Date(Date.now() - parseInt(period, 10) * 24 * 60 * 60 * 1000)
        journalQuery = journalQuery.gte('created_at', from.toISOString())
      }

      const [{ data: journalData, error: journalError }, { data: goalsData }] = await Promise.all([
        journalQuery,
        supabase
          .from('consultant_goals')
          .select('title, status, deadline, progress')
          .eq('consultant_id', user.id)
          .eq('participant_id', participantId),
      ])

      if (journalError) throw journalError

      // CONCERN-anteckningar är interna arbetsanteckningar — exkluderas som
      // standard så de inte hamnar i rapporter till tredje part av misstag.
      const entries = (journalData || [])
        .filter(e => includeConcern || e.category !== 'CONCERN')
        .map(e => ({
          date: new Date(e.created_at).toLocaleDateString('sv-SE'),
          category: e.category,
          content: e.content,
        }))

      if (entries.length === 0 && (goalsData || []).length === 0) {
        notifications.info('Det finns inga journalanteckningar eller mål att utgå ifrån för den valda perioden.')
        return
      }

      const result = await callAI<string>('konsulent-rapportutkast', {
        periodLabel: PERIOD_LABELS[period],
        entries,
        goals: (goalsData || []).map(g => ({
          title: g.title,
          status: g.status,
          deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('sv-SE') : null,
          progress: g.progress,
        })),
      })

      const text = (result as Record<string, unknown>)?.utkast
      if (typeof text === 'string' && text.trim()) {
        setDraft(text.trim())
      } else {
        throw new Error('Tomt svar från AI')
      }
    } catch (err) {
      console.error('Error generating report draft:', err)
      notifications.error('Utkastet kunde inte skapas. Försök igen om en stund.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notifications.error('Kunde inte kopiera till urklipp.')
    }
  }

  const handleClose = () => {
    setDraft('')
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Rapportutkast från journalen
            </h3>
          </div>
          <button
            onClick={handleClose}
            aria-label="Stäng"
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Inställningar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="report-period" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                Period
              </label>
              <select
                id="report-period"
                value={period}
                onChange={e => setPeriod(e.target.value as Period)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600',
                  'text-stone-900 dark:text-stone-100'
                )}
              >
                <option value="30">Senaste 30 dagarna</option>
                <option value="90">Senaste 90 dagarna</option>
                <option value="all">Hela insatsperioden</option>
              </select>
            </div>
            <label className="flex items-center gap-2 sm:mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={includeConcern}
                onChange={e => setIncludeConcern(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700 dark:text-stone-300">
                Ta med orosanteckningar
              </span>
            </label>
          </div>

          {!includeConcern && (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Orosanteckningar (kategori "Oro") är interna och tas inte med i utkastet om du inte aktivt väljer det.
            </p>
          )}

          {/* Resultat */}
          {draft && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Detta är ett AI-utkast baserat på dina journalanteckningar. Läs igenom och
                  korrigera innan det används i officiell rapportering.
                </p>
              </div>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={14}
                aria-label="Rapportutkast"
                data-ai-generated="true"
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm leading-relaxed',
                  'bg-stone-50 dark:bg-stone-800',
                  'border border-stone-200 dark:border-stone-700 focus:border-amber-500 dark:focus:border-amber-400',
                  'text-stone-900 dark:text-stone-100'
                )}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <div>
            {draft && (
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Kopierat' : 'Kopiera'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Stäng
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skriver utkast...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {draft ? 'Skapa nytt utkast' : 'Skapa utkast'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
