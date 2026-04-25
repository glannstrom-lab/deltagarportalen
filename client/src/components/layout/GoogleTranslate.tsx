import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: new (
          config: {
            pageLanguage: string
            includedLanguages?: string
            layout: unknown
            autoDisplay: boolean
          },
          elementId: string
        ) => void
      }
    }
    googleTranslateElementInit: () => void
  }
}

// Språk som stöds (utöver svenska/engelska som hanteras av i18next)
const SUPPORTED_LANGUAGES = 'ar,fa,so,ti,uk,pl,de,fr,es,fi,ru,zh-CN'

export function GoogleTranslate() {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const initAttempted = useRef(false)

  // Ladda Google Translate-script
  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    // Skapa init-funktionen
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: i18n.language === 'en' ? 'en' : 'sv',
            includedLanguages: SUPPORTED_LANGUAGES,
            layout: (window.google.translate.TranslateElement as unknown as { InlineLayout: { SIMPLE: unknown } }).InlineLayout?.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        )
        setIsLoaded(true)
      }
    }

    // Ladda scriptet
    const script = document.createElement('script')
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup om komponenten unmountas
      const existingScript = document.querySelector('script[src*="translate.google.com"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [i18n.language])

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200',
          'shadow-sm hover:shadow-md focus:outline-none',
          isOpen
            ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400/50'
            : 'bg-emerald-100/80 hover:bg-emerald-200/90 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/50'
        )}
        aria-label={t('language.translate', 'Översätt sidan')}
        aria-expanded={isOpen}
        title={t('language.translate', 'Översätt till fler språk')}
      >
        <Globe size={20} className="text-emerald-600 dark:text-emerald-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-stone-100 dark:border-stone-700">
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                <Globe size={16} className="text-emerald-500" />
                {t('language.translatePage', 'Översätt sidan')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t('language.poweredByGoogle', 'Via Google Translate')}
              </p>
            </div>

            <div className="p-3">
              {!isLoaded ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-stone-500">
                    {t('common.loading', 'Laddar...')}
                  </span>
                </div>
              ) : (
                <>
                  {/* Google Translate Widget */}
                  <div
                    id="google_translate_element"
                    className="google-translate-wrapper"
                  />

                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-3 text-center">
                    {t('language.machineTranslation', 'Maskinöversättning - kvaliteten kan variera')}
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dold container för Google Translate om menyn är stängd */}
      {!isOpen && <div id="google_translate_element" className="hidden" />}
    </div>
  )
}

export default GoogleTranslate
