import { useState, useEffect, useRef } from 'react'
import { Heart, X, Phone, ExternalLink, MessageCircle, Shield } from 'lucide-react'

interface CrisisResource {
  name: string
  phone: string
  hours: string
  description: string
  urgent?: boolean
  category: 'immediate' | 'health' | 'support'
}

const crisisResources: CrisisResource[] = [
  {
    name: 'Självmordslinjen',
    phone: '901 01',
    hours: 'Dygnet runt',
    description: 'För dig som har tankar på att ta ditt liv',
    urgent: true,
    category: 'immediate',
  },
  {
    name: 'Jourhavande medmänniska',
    phone: '08-702 16 80',
    hours: '21-06',
    description: 'Någon att prata med när det känns tufft',
    category: 'support',
  },
  {
    name: 'Jourhavande präst',
    phone: '112',
    hours: 'Dygnet runt',
    description: 'Via 112 - begär att få tala med jourhavande präst',
    category: 'support',
  },
  {
    name: '1177 Vårdguiden',
    phone: '1177',
    hours: 'Dygnet runt',
    description: 'Sjukvårdsrådgivning och hjälp',
    category: 'health',
  },
  {
    name: 'Barn- och ungdomspsykiatrisk akut',
    phone: '1177',
    hours: 'Dygnet runt',
    description: 'För dig under 18 år',
    category: 'health',
  },
]

const selfHelpResources = [
  {
    name: 'Mind.se',
    url: 'https://mind.se',
    description: 'Information och stöd för psykisk hälsa',
  },
  {
    name: 'UMO.se',
    url: 'https://umo.se',
    description: 'Stöd för unga om psykisk hälsa',
  },
  {
    name: '1177.se',
    url: 'https://1177.se',
    description: 'Sjukvårdsinformation och e-tjänster',
  },
]

export default function CrisisSupport() {
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
      {/* Support Button - mer prominent men fortfarande diskret */}
      <button
        ref={openButtonRef}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border-2 border-rose-200 rounded-full shadow-lg hover:shadow-xl hover:border-rose-300 hover:bg-rose-50 transition-all text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        aria-label="Öppna stöd och hjälp - för dig som mår dåligt eller behöver någon att prata med"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Heart size={18} className="text-rose-500" aria-hidden="true" />
        <span className="hidden sm:inline font-medium">Behöver du prata med någon?</span>
        <span className="sm:hidden">Stöd</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Shield className="text-rose-600" size={24} aria-hidden="true" />
                </div>
                <div>
                  <h2 
                    id="crisis-modal-title" 
                    className="text-lg font-semibold text-slate-900"
                  >
                    Du är inte ensam
                  </h2>
                  <p className="text-sm text-slate-500">Hjälp finns tillgänglig</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Stäng"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Intro text */}
              <div 
                id="crisis-modal-description"
                className="bg-teal-50 border border-teal-100 rounded-xl p-4"
              >
                <p className="text-teal-800 text-sm leading-relaxed">
                  Det är modigt att söka hjälp. Om du mår dåligt, har ångest, 
                  eller bara behöver prata med någon - finns det alltid någon som lyssnar. 
                  Du behöver inte gå igenom detta ensam.
                </p>
              </div>

              {/* Akut hjälp - highlighted */}
              <div>
                <h3 className="text-sm font-semibold text-rose-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" aria-hidden="true" />
                  Akut hjälp - dygnet runt
                </h3>
                <div className="space-y-3">
                  {crisisResources
                    .filter(r => r.urgent)
                    .map((resource) => (
                      <a
                        key={resource.name}
                        href={`tel:${resource.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <div className="p-3 rounded-xl bg-rose-500 text-white">
                          <Phone size={20} aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-rose-900">
                            {resource.name}
                          </div>
                          <div className="text-2xl font-bold text-rose-700">
                            {resource.phone}
                          </div>
                          <div className="text-sm text-rose-600 mt-1">
                            {resource.description}
                          </div>
                        </div>
                        <div className="text-xs text-rose-500 font-medium bg-white px-2 py-1 rounded">
                          {resource.hours}
                        </div>
                      </a>
                    ))}
                </div>
              </div>

              {/* Övriga resurser */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MessageCircle size={16} aria-hidden="true" />
                  Någon att prata med
                </h3>
                <div className="space-y-2">
                  {crisisResources
                    .filter(r => !r.urgent)
                    .map((resource) => (
                      <a
                        key={resource.name}
                        href={`tel:${resource.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <div className="p-2 rounded-lg bg-white text-slate-600">
                          <Phone size={18} aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {resource.name}
                          </div>
                          <div className="text-sm text-slate-600">
                            {resource.description}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-700">
                            {resource.phone}
                          </div>
                          <div className="text-xs text-slate-400">
                            {resource.hours}
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>

              {/* Självhjälp och information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Information och stöd
                </h3>
                <div className="space-y-2">
                  {selfHelpResources.map((resource) => (
                    <a
                      key={resource.name}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <ExternalLink size={18} className="text-slate-400" aria-hidden="true" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {resource.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {resource.description}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Uppmuntrande avslutning */}
              <div className="bg-gradient-to-r from-teal-50 to-rose-50 border border-teal-100 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-700">
                  <strong>Du är viktig.</strong> Det finns alltid hopp, 
                  även när det inte känns så just nu. 
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
