import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

// SVG Flag components for consistent rendering
function SwedishFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" className={className} aria-hidden="true">
      <rect width="16" height="12" fill="#006AA7" />
      <rect x="5" width="2" height="12" fill="#FECC00" />
      <rect y="5" width="16" height="2" fill="#FECC00" />
    </svg>
  )
}

function BritishFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#00247d" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#cf142b" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" />
    </svg>
  )
}

const languages = [
  { code: 'sv', name: 'Svenska', Flag: SwedishFlag },
  { code: 'en', name: 'English', Flag: BritishFlag },
]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const CurrentFlag = currentLanguage.Flag

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
          'text-stone-500 dark:text-stone-400',
          'hover:bg-stone-100 dark:hover:bg-stone-800',
          'focus:outline-none',
          isOpen && 'bg-stone-100 dark:bg-stone-800'
        )}
        aria-label={t('language.select', 'Välj språk')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={t('language.select', 'Välj språk')}
      >
        <CurrentFlag className="w-5 h-3.5 rounded-sm" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700 overflow-hidden z-50"
            role="listbox"
            aria-label={t('language.select', 'Välj språk')}
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-b border-stone-100 dark:border-stone-700">
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                {t('language.label', 'Språk')}
              </h3>
            </div>

            <div className="p-1.5">
              {languages.map((lang) => {
                const LangFlag = lang.Flag
                return (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors',
                      lang.code === currentLanguage.code
                        ? 'bg-sky-50 dark:bg-sky-900/30'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                    )}
                    role="option"
                    aria-selected={lang.code === currentLanguage.code}
                  >
                    <div className="flex items-center gap-3">
                      <LangFlag className="w-7 h-5 rounded-sm shadow-sm" />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          lang.code === currentLanguage.code
                            ? 'text-sky-700 dark:text-sky-300'
                            : 'text-stone-700 dark:text-stone-200'
                        )}
                      >
                        {lang.name}
                      </span>
                    </div>
                    {lang.code === currentLanguage.code && (
                      <Check size={16} className="text-sky-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher
