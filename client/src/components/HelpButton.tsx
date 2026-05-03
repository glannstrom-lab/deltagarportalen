/**
 * HelpButton - Floating help button with page-specific FAQ
 * Displays in bottom-right corner with expandable Q&A
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp, MessageCircle, Lightbulb } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface HelpItem {
  question: string
  answer: string
}

export interface HelpContent {
  title: string
  description?: string
  tips?: string[]
  faqs?: HelpItem[]
}

interface HelpButtonProps {
  content: HelpContent
}

export function HelpButton({ content }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Close modal with Escape key (WCAG 2.1.2)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus trap and focus management (WCAG 2.4.3)
  useEffect(() => {
    if (isOpen) {
      // Store current focus to restore later
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus close button when modal opens
      closeButtonRef.current?.focus()
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  // Focus trap - keep focus within modal
  const handleTabKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement?.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement?.focus()
    }
  }, [])

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-14 h-14 rounded-full',
          'bg-gradient-to-br from-[var(--c-solid)] to-sky-600 text-white',
          'shadow-lg hover:shadow-xl ',
          'flex items-center justify-center',
          'transition-all duration-300 hover:scale-110 active:scale-95',
          'group'
        )}
        aria-label="Hjälp"
      >
        <HelpCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          onKeyDown={handleTabKey}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div
            ref={modalRef}
            className={cn(
            'relative w-full max-w-lg max-h-[85vh] overflow-hidden',
            'bg-white rounded-2xl shadow-2xl',
            'animate-in slide-in-from-bottom-4 fade-in duration-300'
          )}>
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--c-solid)] to-sky-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="help-modal-title" className="text-lg font-bold">{content.title}</h2>
                    {content.description && (
                      <p className="text-white text-sm">{content.description}</p>
                    )}
                  </div>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsOpen(false)}
                  aria-label="Stäng hjälprutan"
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[60vh] p-5 space-y-5">
              {/* Tips Section */}
              {content.tips && content.tips.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold mb-3">
                    <Lightbulb className="w-5 h-5" aria-hidden="true" />
                    <span>Tips</span>
                  </div>
                  <ul className="space-y-2">
                    {content.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="text-amber-500 mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ Section */}
              {content.faqs && content.faqs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-stone-700 font-semibold mb-3">
                  <MessageCircle className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
                  <span>Vanliga frågor</span>
                </div>
                <div className="space-y-2">
                  {content.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-stone-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        aria-expanded={expandedIndex === index}
                        aria-controls={`faq-answer-${index}`}
                        className={cn(
                          'w-full px-4 py-3 text-left flex items-center justify-between gap-3',
                          'hover:bg-stone-50 transition-colors',
                          expandedIndex === index && 'bg-stone-50'
                        )}
                      >
                        <span className="font-medium text-stone-700 text-sm">{faq.question}</span>
                        {expandedIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-stone-600 flex-shrink-0" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-600 flex-shrink-0" aria-hidden="true" />
                        )}
                      </button>
                      <div
                        id={`faq-answer-${index}`}
                        className={cn(
                          'px-4 pb-4 text-sm text-stone-600 border-t border-stone-100 pt-3',
                          expandedIndex !== index && 'hidden'
                        )}
                        hidden={expandedIndex !== index}
                      >
                        {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 p-4 bg-stone-50">
              <p className="text-center text-sm text-stone-700">
                Behöver du mer hjälp? Kontakta din handledare.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HelpButton
