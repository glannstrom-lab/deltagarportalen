import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, RotateCcw } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

import { OVERSATT_SPRAK, oversattTill, valtOversattSprak, visaOriginal } from '@/services/sidoversattning'

// Mekaniken bor i services/sidoversattning.ts (2026-10-13). Den här menyn hade
// en egen kopia, och kopian rensade inte Googles cookie på moderdomänen och
// lät "English" bli maskinöversättning. Här bor bara flaggorna.
const FLAGGOR: Record<string, string> = {
  en: '🇬🇧', ar: '🇸🇦', fa: '🇮🇷', so: '🇸🇴', ti: '🇪🇷', uk: '🇺🇦', pl: '🇵🇱',
  de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', fi: '🇫🇮', ru: '🇷🇺', 'zh-CN': '🇨🇳',
}
const LANGUAGES = OVERSATT_SPRAK.map((s) => ({ ...s, flag: FLAGGOR[s.code] ?? '🌐' }))

export function GoogleTranslate() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  // Sätts aldrig om av klienten — ett språkbyte laddar om sidan
  // (window.location.reload), och nästa mount läser cookien/localStorage på
  // nytt via initieraren.
  const [activeLanguage] = useState<string | null>(() => valtOversattSprak())
  const [isLoading, setIsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Skriptet laddas vid appstart av startaSparadOversattning() (main.tsx),
  // så att översättningen fungerar även där den här komponenten inte monteras (mobil).

  // Stäng menyn vid klick utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Stäng vid Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleSelectLanguage = (langCode: string) => {
    setIsLoading(true)
    setIsOpen(false)
    oversattTill(langCode) // sparar, sätter cookien och laddar om
  }

  const handleResetTranslation = () => {
    setIsLoading(true)
    setIsOpen(false)
    visaOriginal() // tar bort valet och cookien på alla domännivåer, laddar om
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
          'hover:bg-stone-100 dark:hover:bg-stone-800',
          'focus:outline-none',
          isLoading && 'opacity-50 cursor-wait',
          isOpen && 'bg-stone-100 dark:bg-stone-800',
          activeLanguage && 'text-[var(--c-text)] dark:text-[var(--c-solid)]'
        )}
        aria-label={t('language.translate', 'Översätt sidan')}
        aria-expanded={isOpen}
        title={activeLanguage
          ? `${t('language.translatedTo', 'Översatt till')} ${LANGUAGES.find(l => l.code === activeLanguage)?.name || activeLanguage}`
          : t('language.translate', 'Översätt till fler språk')
        }
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Globe size={20} className={activeLanguage ? 'text-[var(--c-text)] dark:text-[var(--c-solid)]' : 'text-stone-500 dark:text-stone-400'} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 dark:from-emerald-900/20 dark:to-[var(--c-bg)]/30 border-b border-stone-100 dark:border-stone-700">
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                <Globe size={16} className="text-emerald-500" />
                {t('language.translatePage', 'Översätt sidan')}
              </h3>
            </div>

            {/* Språklista */}
            <div className="p-2 max-h-80 overflow-y-auto">
              {/* Svenska (Original) - alltid först */}
              <button
                onClick={handleResetTranslation}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors mb-1',
                  !activeLanguage
                    ? 'bg-sky-50 dark:bg-sky-900/30'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" role="img" aria-label="Swedish">
                    🇸🇪
                  </span>
                  <div className="flex flex-col items-start">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        !activeLanguage
                          ? 'text-sky-700 dark:text-sky-300'
                          : 'text-stone-700 dark:text-stone-200'
                      )}
                    >
                      Svenska
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-400">
                      Original
                    </span>
                  </div>
                </div>
                {!activeLanguage ? (
                  <Check size={16} className="text-sky-500" />
                ) : (
                  <RotateCcw size={14} className="text-stone-400" />
                )}
              </button>

              {/* Divider */}
              <div className="border-t border-stone-100 dark:border-stone-700 my-2" />

              {/* Andra språk */}
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors',
                    activeLanguage === lang.code
                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" role="img" aria-label={lang.english}>
                      {lang.flag}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        activeLanguage === lang.code
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-stone-700 dark:text-stone-200'
                      )}
                    >
                      {lang.name}
                    </span>
                  </div>
                  {activeLanguage === lang.code && (
                    <Check size={16} className="text-emerald-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer — maskinöversättning + integritetsnotis.
                A34 (2026-09-01): notisen fanns, men var oläsbar och otydlig.
                · Kontrast mätt: `text-stone-400` på vitt gav 2,52:1 och
                  stone-500 i mörkt läge, på stone-900, gav 3,65:1 — båda under AA:s 4,5:1,
                  och i 11 px. En upplysning om att text lämnar portalen får inte vara
                  det minst läsbara i menyn.
                · Texten sa "sidans innehåll", vilket den som står på Dagboken inte
                  nödvändigtvis läser som "det jag själv har skrivit". Nu står det. */}
            <div className="px-4 py-2.5 border-t border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
              <p className="text-xs font-medium text-stone-600 dark:text-stone-300 text-center">
                {t('language.machineTranslation', 'Maskinöversättning via Google')}
              </p>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 text-center leading-snug">
                {t('language.translationPrivacy', 'När du översätter skickas sidans innehåll till Google — även det du själv har skrivit, till exempel ett dagboksinlägg du har öppet.')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GoogleTranslate
