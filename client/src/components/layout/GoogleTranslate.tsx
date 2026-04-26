import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, RotateCcw } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

// Språk med namn på sitt eget språk och flagg-emoji
const LANGUAGES = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦', english: 'Arabic' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', english: 'Persian' },
  { code: 'so', name: 'Soomaali', flag: '🇸🇴', english: 'Somali' },
  { code: 'ti', name: 'ትግርኛ', flag: '🇪🇷', english: 'Tigrinya' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', english: 'Ukrainian' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', english: 'Polish' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', english: 'German' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', english: 'French' },
  { code: 'es', name: 'Español', flag: '🇪🇸', english: 'Spanish' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮', english: 'Finnish' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', english: 'Russian' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳', english: 'Chinese' },
] as const

const STORAGE_KEY = 'googleTranslateLanguage'

// Hämta valt språk från localStorage
function getSelectedLanguage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

// Spara valt språk till localStorage
function setSelectedLanguage(langCode: string | null) {
  try {
    if (langCode) {
      localStorage.setItem(STORAGE_KEY, langCode)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignorera
  }
}

// Sätt Google Translate cookie
function setGoogleTranslateCookie(langCode: string) {
  const value = `/sv/${langCode}`
  const domain = window.location.hostname

  document.cookie = `googtrans=${value}; path=/`

  if (domain !== 'localhost' && domain !== '127.0.0.1') {
    document.cookie = `googtrans=${value}; path=/; domain=.${domain}`
  }
}

// Rensa Google Translate cookies så gott det går
function clearGoogleTranslateCookies() {
  const domain = window.location.hostname
  const expiredDate = 'Thu, 01 Jan 1970 00:00:00 UTC'

  document.cookie = `googtrans=; expires=${expiredDate}; path=/`
  document.cookie = `googtrans=; expires=${expiredDate}; path=/; domain=.${domain}`
  document.cookie = `googtrans=; expires=${expiredDate}; path=/; domain=${domain}`
}

// Ladda Google Translate scriptet
function loadGoogleTranslateScript(targetLang: string): Promise<void> {
  return new Promise((resolve) => {
    // Skapa element för Google Translate
    let container = document.getElementById('google_translate_element')
    if (!container) {
      container = document.createElement('div')
      container.id = 'google_translate_element'
      container.style.display = 'none'
      document.body.appendChild(container)
    }

    // Sätt cookie innan scriptet laddas
    setGoogleTranslateCookie(targetLang)

    // Definiera callback
    const win = window as Window & { googleTranslateElementInit?: () => void }
    win.googleTranslateElementInit = () => {
      const google = (window as Window & {
        google?: {
          translate?: {
            TranslateElement: new (config: object, id: string) => void
          }
        }
      }).google

      if (google?.translate?.TranslateElement) {
        new google.translate.TranslateElement(
          {
            pageLanguage: 'sv',
            autoDisplay: false,
          },
          'google_translate_element'
        )
      }
      resolve()
    }

    // Kolla om scriptet redan finns
    const existingScript = document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')
    if (existingScript) {
      // Scriptet finns redan - Google Translate borde vara aktiv
      resolve()
      return
    }

    // Ladda scriptet
    const script = document.createElement('script')
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.head.appendChild(script)
  })
}

export function GoogleTranslate() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Kolla sparad översättning vid mount och ladda scriptet om det behövs
  useEffect(() => {
    const savedLang = getSelectedLanguage()
    setActiveLanguage(savedLang)

    if (savedLang) {
      // Användaren hade en översättning aktiv - ladda scriptet
      loadGoogleTranslateScript(savedLang)
    }
  }, [])

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

  const handleSelectLanguage = async (langCode: string) => {
    setIsLoading(true)
    setIsOpen(false)

    // Spara valet
    setSelectedLanguage(langCode)
    setGoogleTranslateCookie(langCode)

    // Ladda om sidan för att aktivera översättningen
    window.location.reload()
  }

  const handleResetTranslation = () => {
    setIsLoading(true)
    setIsOpen(false)

    // Ta bort sparad översättning
    setSelectedLanguage(null)
    clearGoogleTranslateCookies()

    // Ladda om sidan - utan sparad översättning laddas inte scriptet
    window.location.reload()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200',
          ' hover: focus:outline-none',
          isLoading && 'opacity-50 cursor-wait',
          activeLanguage
            ? 'bg-emerald-200 dark:bg-emerald-800/60 ring-2 ring-emerald-400/50'
            : isOpen
              ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400/50'
              : 'bg-emerald-100/80 hover:bg-emerald-200/90 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/50'
        )}
        aria-label={t('language.translate', 'Översätt sidan')}
        aria-expanded={isOpen}
        title={activeLanguage
          ? `${t('language.translatedTo', 'Översatt till')} ${LANGUAGES.find(l => l.code === activeLanguage)?.name || activeLanguage}`
          : t('language.translate', 'Översätt till fler språk')
        }
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Globe size={20} className={cn(
            activeLanguage
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-emerald-600 dark:text-emerald-400'
          )} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/50 dark:border-stone-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-brand-50 dark:from-emerald-900/20 dark:to-brand-900/20 border-b border-stone-100 dark:border-stone-700">
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
                    <span className="text-xs text-stone-400 dark:text-stone-500">
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

            {/* Footer */}
            <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
              <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
                {t('language.machineTranslation', 'Maskinöversättning via Google')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GoogleTranslate
