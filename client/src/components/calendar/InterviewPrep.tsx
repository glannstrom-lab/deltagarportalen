import { useState, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Brain, CheckCircle, Lightbulb, Shirt, FileText, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from '@/components/ui/icons'
import type { CalendarEvent, InterviewPrep } from '@/services/calendarData'
import { interviewQuestions, dressCodeGuide } from '@/services/calendarData'

interface InterviewPrepProps {
  event: CalendarEvent
  prep?: InterviewPrep
  onPrepChange: (prep: InterviewPrep) => void
}

export function InterviewPrepPanel({ event, prep, onPrepChange }: InterviewPrepProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const contentId = useId()

  const generateAIQuestions = () => {
    // AI-simulated question generation
    const company = event.with?.split(',')[0] || t('calendar.interviewPrep.theCompany')
    const questions = [
      t('calendar.interviewPrep.questions.businessModel', { company }),
      t('calendar.interviewPrep.questions.contribution', { company }),
      t('calendar.interviewPrep.questions.attraction', { company }),
      t('calendar.interviewPrep.questions.challenge'),
    ]

    onPrepChange({
      ...prep,
      commonQuestions: [...(prep?.commonQuestions || []), ...questions],
    })
  }

  const getDressCode = () => {
    // Guess dress code based on company type or default
    const desc = (event.description || '').toLowerCase()
    if (desc.includes('bank') || desc.includes('finans')) return dressCodeGuide.bank
    if (desc.includes('tech') || desc.includes('it')) return dressCodeGuide.tech
    if (desc.includes('startup')) return dressCodeGuide.startup
    if (desc.includes('vård') || desc.includes('sjuk')) return dressCodeGuide.healthcare
    return dressCodeGuide.default
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-stone-800/50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">{t('calendar.interviewPrep.title')}</h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">{t('calendar.interviewPrep.subtitle')}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-stone-600 dark:text-stone-400" aria-hidden="true" /> : <ChevronDown size={20} className="text-stone-600 dark:text-stone-400" aria-hidden="true" />}
      </button>

      {expanded && (
        <div id={contentId} className="p-4 pt-0 space-y-4">
          {/* AI Generator */}
          <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('calendar.interviewPrep.tailoredQuestions')}</h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
                  {t('calendar.interviewPrep.generateDescription')}
                </p>
                <button
                  onClick={generateAIQuestions}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Brain size={16} />
                  {t('calendar.interviewPrep.generateQuestions')}
                </button>
              </div>
            </div>
          </div>

          {/* Dress code */}
          <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Shirt className="w-5 h-5 text-teal-500 dark:text-teal-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('calendar.interviewPrep.dressRecommendation')}</h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">{getDressCode()}</p>
              </div>
            </div>
          </div>

          {/* Common questions */}
          <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('calendar.interviewPrep.commonQuestions')}</h4>
            </div>
            <div className="space-y-2">
              {(prep?.commonQuestions || interviewQuestions.common.slice(0, 5)).map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-stone-600 dark:text-stone-400 mt-1">•</span>
                  <span className="text-stone-700 dark:text-stone-300">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Questions to ask */}
          <div className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-green-500 dark:text-green-400" />
              <h4 className="font-medium text-stone-900 dark:text-stone-100">{t('calendar.interviewPrep.questionsToAsk')}</h4>
            </div>
            <div className="space-y-2">
              {interviewQuestions.questionsToAsk.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5" />
                  <span className="text-stone-700 dark:text-stone-300">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Company research link */}
          {event.with && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(event.with.split(',')[0])}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-stone-800 border border-indigo-100 dark:border-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium"
            >
              <ExternalLink size={16} />
              {t('calendar.interviewPrep.searchCompany')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
