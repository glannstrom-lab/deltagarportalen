/**
 * HelpButton - Floating help button with page-specific FAQ
 * Displays in bottom-right corner with expandable Q&A
 */

import { useState } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp, MessageCircle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HelpItem {
  question: string
  answer: string
}

export interface HelpContent {
  title: string
  description?: string
  tips?: string[]
  faqs: HelpItem[]
}

interface HelpButtonProps {
  content: HelpContent
}

export function HelpButton({ content }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full',
          'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
          'shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40',
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className={cn(
            'relative w-full max-w-lg max-h-[85vh] overflow-hidden',
            'bg-white rounded-2xl shadow-2xl',
            'animate-in slide-in-from-bottom-4 fade-in duration-300'
          )}>
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{content.title}</h2>
                    {content.description && (
                      <p className="text-indigo-100 text-sm">{content.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[60vh] p-5 space-y-5">
              {/* Tips Section */}
              {content.tips && content.tips.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold mb-3">
                    <Lightbulb className="w-5 h-5" />
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
              <div>
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                  <span>Vanliga frågor</span>
                </div>
                <div className="space-y-2">
                  {content.faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        className={cn(
                          'w-full px-4 py-3 text-left flex items-center justify-between gap-3',
                          'hover:bg-slate-50 transition-colors',
                          expandedIndex === index && 'bg-slate-50'
                        )}
                      >
                        <span className="font-medium text-slate-700 text-sm">{faq.question}</span>
                        {expandedIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedIndex === index && (
                        <div className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <p className="text-center text-sm text-slate-500">
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
