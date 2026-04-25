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

// Hämta aktuellt översättningsspråk från Google Translate cookie
function getActiveTranslation(): string | null {
  const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/)
  return match ? match[1] : null
}

// Rensa alla Google Translate cookies
function clearGoogleTranslateCookies() {
  const domain = window.location.hostname
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1'
  const expiredDate = 'Thu, 01 Jan 1970 00:00:00 UTC'

  // Alla möjliga cookie-namn som Google Translate använder
  const cookieNames = ['googtrans', 'googtrans-b']

  // Alla möjliga paths och domains
  const paths = ['/', '', '/deltagarportal']
  const domains = ['', domain, `.${domain}`]

  if (isLocalhost) {
    domains.push('localhost', '.localhost', '127.0.0.1')
  }

  // Rensa alla kombinationer
  for (const name of cookieNames) {
    for (const path of paths) {
      for (const d of domains) {
        const domainPart = d ? `; domain=${d}` : ''
        const pathPart = `; path=${path || '/'}`
        document.cookie = `${name}=; expires=${expiredDate}${pathPart}${domainPart}`
      }
    }
  }
}

// Sätt Google Translate cookie och ladda om
function setTranslation(langCode: string | null) {
  // Rensa alltid alla cookies först
  clearGoogleTranslateCookies()

  // Rensa sessionStorage om Google Translate lagrar något där
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('translate') || key.toLowerCase().includes('goog')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch {
    // Ignorera om sessionStorage inte är tillgänglig
  }

  if (langCode !== null) {
    // Sätt ny översättning
    const value = `/sv/${langCode}`
    document.cookie = `googtrans=${value}; path=/`

    const domain = window.location.hostname
    const isLocalhost = domain === 'localhost' || domain === '127.0.0.1'
    if (!isLocalhost) {
      document.cookie = `googtrans=${value}; path=/; domain=.${domain}`
    }
  }

  // Navigera till samma sida utan cache
  const url = new URL(window.location.href)
  url.searchParams.set('_gt', Date.now().toString())
  window.location.replace(url.toString())
}

export function GoogleTranslate() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Kolla aktivt språk vid mount
  useEffect(() => {
    setActiveLanguage(getActiveTranslation())
  }, [])

  // Ladda Google Translate script (behövs för att översättningen ska fungera)
  useEffect(() => {
    if (scriptLoaded) return

    const existingScript = document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')
    if (existingScript) {
      setScriptLoaded(true)
      return
    }

    // Skapa ett dolt element för Google Translate
    const hiddenDiv = document.createElement('div')
    hiddenDiv.id = 'google_translate_element'
    hiddenDiv.style.display = 'none'
    document.body.appendChild(hiddenDiv)

    // Definiera init-funktionen
    ;(window as Window & { googleTranslateElementInit?: () => void }).googleTranslateElementInit = () => {
      const google = (window as Window & { google?: { translate?: { TranslateElement: new (config: object, id: string) => void } } }).google
      if (google?.translate?.TranslateElement) {
        new google.translate.TranslateElement(
          {
            pageLanguage: 'sv',
            autoDisplay: false,
          },
          'google_translate_element'
        )
      }
      setScriptLoaded(true)
    }

    // Ladda scriptet
    const script = document.createElement('script')
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.head.appendChild(script)
  }, [scriptLoaded])

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
    setTranslation(langCode)
  }

  const handleResetTranslation = () => {
    setTranslation(null)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200',
          'shadow-sm hover:shadow-md focus:outline-none',
          activeLanguage
            ? 'bg-emerald-200 dark:bg-emerald-800/60 ring-2 ring-emerald-400/50'
            : isOpen
              ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400/50'
              : 'bg-emerald-100/80 hover:bg-emerald-200/90 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/50'
        )}
        aria-label={t('language.translate', 'Översätt sidan')}
        aria-expanded={isOpen}
        title={activeLanguage
          ? t('language.translatedTo', 'Sidan är översatt')
          : t('language.translate', 'Översätt till fler språk')
        }
      >
        <Globe size={20} className={cn(
          activeLanguage
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-emerald-600 dark:text-emerald-400'
        )} />
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
