import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  // Stäng dropdown vid klick utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Stäng med Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 p-2 sm:p-2.5 rounded-xl transition-colors',
          isOpen
            ? 'bg-violet-100 dark:bg-violet-900/30'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800'
        )}
        aria-label={t('language.select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe
          size={20}
          className={cn(
            isOpen ? 'text-violet-600 dark:text-violet-400' : 'text-stone-500 dark:text-stone-400'
          )}
        />
        <span className="hidden sm:inline text-sm font-medium text-stone-700 dark:text-stone-300">
          {currentLanguage.flag}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'hidden sm:block transition-transform text-stone-400',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-100 dark:border-stone-700 py-1 z-50"
            role="listbox"
            aria-label={t('language.select')}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  lang.code === currentLanguage.code
                    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-700/50 text-stone-700 dark:text-stone-200'
                )}
                role="option"
                aria-selected={lang.code === currentLanguage.code}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSelector
