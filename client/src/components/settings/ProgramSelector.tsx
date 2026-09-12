import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/services/supabaseApi'
import { PROGRAMS, type ProgramSlug } from '@/lib/programs'
import { cn } from '@/lib/utils'
import { Briefcase, CheckCircle2, AlertCircle, Loader2 } from '@/components/ui/icons'
import { laslogg, type AiPolicyRad } from '@/services/laslogg'

/**
 * Låter en fri deltagare ange vilket arbetsmarknadsprojekt hen deltar i.
 * Single-select med "Inget projekt" som default. Skriver till profiles.program.
 *
 * PG10 (2026-09-12): en deltagare som är kopplad till en organisation (kommun
 * eller leverantör, via my_ai_policy) får INTE valet — hens projekt följer
 * organisationen, och att erbjuda "Rusta och Matcha" åt en kommundeltagare var
 * brus. Löftet "sidor för projektet kommer i en kommande uppdatering" är borta:
 * valet sparas på profilen, mer lovar vi inte.
 */
export function ProgramSelector() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const [selected, setSelected] = useState<ProgramSlug | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)
  const [organisationer, setOrganisationer] = useState<AiPolicyRad[] | null>(null)

  useEffect(() => {
    let aktiv = true
    laslogg
      .minAiPolicy()
      .then((rader) => { if (aktiv) setOrganisationer(rader) })
      .catch(() => { if (aktiv) setOrganisationer([]) })
    return () => { aktiv = false }
  }, [])

  useEffect(() => {
    const current = (profile?.program as ProgramSlug | null) ?? null
    setSelected(current)
  }, [profile?.program])

  const handleSelect = async (next: ProgramSlug | null) => {
    if (next === selected) return
    const previous = selected
    setSelected(next)
    setIsSaving(true)
    setFeedback(null)
    try {
      await userApi.updateProfile({ program: next })
      setFeedback('saved')
      setTimeout(() => setFeedback(null), 2500)
    } catch (err) {
      console.error('[ProgramSelector] kunde inte spara program:', err)
      setSelected(previous)
      setFeedback('error')
    } finally {
      setIsSaving(false)
    }
  }

  const options: Array<{ slug: ProgramSlug | null; label: string; description: string }> = [
    { slug: null, label: t('settings.programSelector.none'), description: t('settings.programSelector.noneDesc') },
    ...PROGRAMS.map((p) => ({ slug: p.slug, label: p.label, description: p.shortDescription })),
  ]

  if (organisationer && organisationer.length > 0) {
    const namn = organisationer.map((o) => o.org_name).join(', ')
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('settings.programSelector.title')}</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
          {t('settings.programSelector.viaOrganisation', { org: namn })}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{t('settings.programSelector.title')}</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
          {t('settings.programSelector.description')}
        </p>
      </div>

      <div className="p-6 space-y-3">
        {options.map((opt) => {
          const isActive = selected === opt.slug
          const key = opt.slug ?? 'none'
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(opt.slug)}
              disabled={isSaving}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                'disabled:opacity-60 disabled:cursor-wait',
                isActive
                  ? 'border-[var(--c-solid)] bg-[var(--c-bg)]/50'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700/40',
              )}
              aria-pressed={isActive}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  isActive ? 'bg-[var(--c-bg)]' : 'bg-stone-100 dark:bg-stone-700',
                )}
              >
                <Briefcase
                  className={cn('w-6 h-6', isActive ? 'text-[var(--c-text)]' : 'text-stone-500 dark:text-stone-400')}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{opt.label}</span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--c-accent)]/40 text-[var(--c-text)] text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('settings.programSelector.selected')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">{opt.description}</p>
              </div>

              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  isActive ? 'border-[var(--c-solid)] bg-[var(--c-solid)]' : 'border-stone-300 dark:border-stone-600',
                )}
              >
                {isActive && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="px-6 py-3 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-100 dark:border-stone-700 min-h-[44px] flex items-center">
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('settings.programSelector.saving')}</span>
          </div>
        )}
        {!isSaving && feedback === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('settings.programSelector.saved')}</span>
          </div>
        )}
        {!isSaving && feedback === 'error' && (
          <div className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4" />
            <span>{t('career.credentials.saveFailed')}</span>
          </div>
        )}
        {!isSaving && !feedback && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('settings.programSelector.sparasDirekt')}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProgramSelector
