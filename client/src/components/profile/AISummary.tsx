/**
 * AISummary - AI-genererad profilsammanfattning
 * Updated with ARIA attributes and toast notifications
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, RefreshCw, Loader2, Copy, Check, Edit3 } from '@/components/ui/icons'
import { aiSummaryApi } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'
import { notifications, TOAST_MESSAGES } from '@/lib/toast'

interface Props {
  className?: string
}

export function AISummary({ className }: Props) {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const data = await aiSummaryApi.get()
      setSummary(data)
    } catch (err) {
      console.error('Error loading summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const toastId = notifications.loading(TOAST_MESSAGES.AI_GENERATING)

    try {
      const newSummary = await aiSummaryApi.generate()
      setSummary(newSummary)
      notifications.dismiss(toastId)
      notifications.success(TOAST_MESSAGES.AI_SUCCESS)
    } catch (err) {
      console.error('Error generating summary:', err)
      notifications.dismiss(toastId)
      notifications.error('Kunde inte generera sammanfattning. Kontrollera att du har fyllt i profil och CV.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      notifications.success('Kopierat till urklipp')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      notifications.error('Kunde inte kopiera')
    }
  }

  const handleEdit = () => {
    setEditValue(summary || '')
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      await aiSummaryApi.save(editValue)
      setSummary(editValue)
      setEditing(false)
      notifications.success(TOAST_MESSAGES.SAVE_SUCCESS)
    } catch (err) {
      console.error('Error saving summary:', err)
      notifications.error('Kunde inte spara sammanfattningen')
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            AI-sammanfattning
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <>
              <button
                onClick={handleCopy}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  copied
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-600'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500'
                )}
                aria-label={copied ? t('common.copied') : t('profile.aiSummary.copy')}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              </button>
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 rounded-lg transition-colors"
                aria-label={t('profile.aiSummary.edit')}
              >
                <Edit3 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-50"
            aria-busy={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span role="status">{t('profile.aiSummary.generating')}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                {summary ? t('profile.aiSummary.regenerate') : t('profile.aiSummary.generate')}
              </>
            )}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-xl text-sm text-stone-700 dark:text-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm font-medium bg-brand-900 hover:bg-brand-900/90 text-white rounded-lg transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      ) : summary ? (
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50">
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      ) : (
        <div className="p-6 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 text-center">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            Generera en professionell sammanfattning baserad på din profil och ditt CV.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Genererar...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generera sammanfattning
              </>
            )}
          </button>
        </div>
      )}

      <p className="text-xs text-stone-500 dark:text-stone-400">
        Sammanfattningen skapas automatiskt utifrån din profildata, erfarenhet och kompetenser.
      </p>
    </div>
  )
}
