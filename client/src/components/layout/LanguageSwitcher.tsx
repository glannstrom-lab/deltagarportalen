import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200',
          'shadow-sm hover:shadow-md focus:outline-none',
          isOpen
            ? 'bg-sky-100 dark:bg-sky-900/40 ring-2 ring-sky-400/50'
            : 'bg-sky-100/80 hover:bg-sky-200/90 dark:bg-sky-900/40 dark:hover:bg-sky-800/50'
        )}
        aria-label={t('language.select', 'Välj språk')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={t('language.select', 'Välj språk')}
      >
        <span className="text-xl leading-none" role="img" aria-label={currentLanguage.name}>
          {currentLanguage.flag}
        </span>
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
              {languages.map((lang) => (
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
                    <span className="text-2xl leading-none" role="img" aria-hidden="true">
                      {lang.flag}
                    </span>
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
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher
