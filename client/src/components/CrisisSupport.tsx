import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Heart, X, Phone, ExternalLink, MessageCircle, Shield } from '@/components/ui/icons'

interface CrisisResource {
  nameKey: string
  phone: string
  hoursKey: string
  descriptionKey: string
  urgent?: boolean
  category: 'immediate' | 'health' | 'support'
}

const crisisResourceDefs: CrisisResource[] = [
  {
    nameKey: 'crisis.resources.suicideLine.name',
    phone: '901 01',
    hoursKey: 'crisis.resources.suicideLine.hours',
    descriptionKey: 'crisis.resources.suicideLine.description',
    urgent: true,
    category: 'immediate',
  },
  {
    nameKey: 'crisis.resources.companion.name',
    phone: '08-702 16 80',
    hoursKey: 'crisis.resources.companion.hours',
    descriptionKey: 'crisis.resources.companion.description',
    category: 'support',
  },
  {
    nameKey: 'crisis.resources.priest.name',
    phone: '112',
    hoursKey: 'crisis.resources.priest.hours',
    descriptionKey: 'crisis.resources.priest.description',
    category: 'support',
  },
  {
    nameKey: 'crisis.resources.healthcare.name',
    phone: '1177',
    hoursKey: 'crisis.resources.healthcare.hours',
    descriptionKey: 'crisis.resources.healthcare.description',
    category: 'health',
  },
  {
    nameKey: 'crisis.resources.youth.name',
    phone: '1177',
    hoursKey: 'crisis.resources.youth.hours',
    descriptionKey: 'crisis.resources.youth.description',
    category: 'health',
  },
]

interface SelfHelpResource {
  nameKey: string
  url: string
  descriptionKey: string
}

const selfHelpResourceDefs: SelfHelpResource[] = [
  {
    nameKey: 'crisis.selfHelp.mind.name',
    url: 'https://mind.se',
    descriptionKey: 'crisis.selfHelp.mind.description',
  },
  {
    nameKey: 'crisis.selfHelp.umo.name',
    url: 'https://umo.se',
    descriptionKey: 'crisis.selfHelp.umo.description',
  },
  {
    nameKey: 'crisis.selfHelp.healthcare.name',
    url: 'https://1177.se',
    descriptionKey: 'crisis.selfHelp.healthcare.description',
  },
]

interface CrisisSupportProps {
  variant?: 'fixed' | 'inline'
}

export default function CrisisSupport({ variant = 'fixed' }: CrisisSupportProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap och ESC-hantering
  useEffect(() => {
    if (!isOpen) return

    // Fokusera på stäng-knappen när modal öppnas
    closeButtonRef.current?.focus()

    // Förhindra scroll på body
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        openButtonRef.current?.focus()
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Återställ fokus när modal stängs
  useEffect(() => {
    if (!isOpen) {
      openButtonRef.current?.focus()
    }
  }, [isOpen])

  return (
    <>
      {/* Support Button */}
      <button
        ref={openButtonRef}
        onClick={() => setIsOpen(true)}
        className={
          variant === 'fixed'
            ? 'fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center justify-center gap-2 px-4 py-3 bg-white text-stone-700 border-2 border-rose-200 rounded-full shadow-lg hover:shadow-xl hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 text-sm transition-all'
            : 'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 focus-visible:ring-2 focus-visible:ring-rose-400 transition-colors'
        }
        style={{ outline: 'none' }}
        aria-label={t('crisis.ariaLabel')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Heart size={variant === 'fixed' ? 16 : 18} className="text-rose-500" aria-hidden="true" />
        {variant === 'fixed' && (
          <>
            <span className="hidden sm:inline">{t('crisis.needToTalk', 'Behöver du prata?')}</span>
            <span className="sm:hidden">{t('crisis.support', 'Krishjälp')}</span>
          </>
        )}
      </button>

      {/* Modal - rendered via Portal to escape parent overflow/z-index issues */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crisis-modal-title"
          aria-describedby="crisis-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false)
            }
          }}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Shield className="text-rose-600" size={24} aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="crisis-modal-title"
                    className="text-lg font-semibold text-stone-900 dark:text-stone-100"
                  >
                    {t('crisis.notAlone')}
                  </h2>
                  <p className="text-sm text-stone-700 dark:text-stone-300">{t('crisis.helpAvailable')}</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
                aria-label={t('common.close')}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Intro text */}
              <div
                id="crisis-modal-description"
                className="bg-[var(--c-bg)] border border-[var(--c-accent)]/40 rounded-xl p-4"
              >
                <p className="text-[var(--c-text)] text-sm leading-relaxed">
                  {t('crisis.introText')}
                </p>
              </div>

              {/* Akut hjälp - highlighted */}
              <div>
                <h3 className="text-sm font-semibold text-rose-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" aria-hidden="true" />
                  {t('crisis.emergencyHelp')}
                </h3>
                <div className="space-y-3">
                  {crisisResourceDefs
                    .filter(r => r.urgent)
                    .map((resource) => (
                      <a
                        key={resource.nameKey}
                        href={`tel:${resource.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <div className="p-3 rounded-xl bg-rose-500 text-white">
                          <Phone size={20} aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-rose-900">
                            {t(resource.nameKey)}
                          </div>
                          <div className="text-2xl font-bold text-rose-700">
                            {resource.phone}
                          </div>
                          <div className="text-sm text-rose-600 mt-1">
                            {t(resource.descriptionKey)}
                          </div>
                        </div>
                        <div className="text-xs text-rose-500 font-medium bg-white px-2 py-1 rounded">
                          {t(resource.hoursKey)}
                        </div>
                      </a>
                    ))}
                </div>
              </div>

              {/* Övriga resurser */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MessageCircle size={16} aria-hidden="true" />
                  {t('crisis.someoneToTalk')}
                </h3>
                <div className="space-y-2">
                  {crisisResourceDefs
                    .filter(r => !r.urgent)
                    .map((resource) => (
                      <a
                        key={resource.nameKey}
                        href={`tel:${resource.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
                      >
                        <div className="p-2 rounded-lg bg-white text-stone-600">
                          <Phone size={18} aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-stone-900">
                            {t(resource.nameKey)}
                          </div>
                          <div className="text-sm text-stone-600">
                            {t(resource.descriptionKey)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-stone-700">
                            {resource.phone}
                          </div>
                          <div className="text-xs text-stone-600">
                            {t(resource.hoursKey)}
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>

              {/* Självhjälp och information */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-3">
                  {t('crisis.informationAndSupport')}
                </h3>
                <div className="space-y-2">
                  {selfHelpResourceDefs.map((resource) => (
                    <a
                      key={resource.nameKey}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-[var(--c-accent)] hover:bg-[var(--c-bg)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
                    >
                      <ExternalLink size={18} className="text-stone-600" aria-hidden="true" />
                      <div className="flex-1">
                        <div className="font-medium text-stone-900">
                          {t(resource.nameKey)}
                        </div>
                        <div className="text-sm text-stone-700">
                          {t(resource.descriptionKey)}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Uppmuntrande avslutning */}
              <div className="bg-gradient-to-r from-[var(--c-bg)] to-rose-50 border border-[var(--c-accent)]/40 rounded-xl p-4 text-center">
                <p className="text-sm text-stone-700">
                  <strong>{t('crisis.youMatter')}</strong> {t('crisis.alwaysHope')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-stone-50 dark:bg-stone-700 border-t border-stone-100 dark:border-stone-600 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-white dark:bg-stone-600 border border-stone-300 dark:border-stone-500 text-stone-700 dark:text-stone-200 py-3 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
