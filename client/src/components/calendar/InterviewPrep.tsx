import { useState } from 'react'
import { Brain, CheckCircle, Lightbulb, Shirt, FileText, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { CalendarEvent, InterviewPrep } from '@/services/calendarData'
import { interviewQuestions, dressCodeGuide } from '@/services/calendarData'

interface InterviewPrepProps {
  event: CalendarEvent
  prep?: InterviewPrep
  onPrepChange: (prep: InterviewPrep) => void
}

export function InterviewPrepPanel({ event, prep, onPrepChange }: InterviewPrepProps) {
  const [expanded, setExpanded] = useState(true)

  const generateAIQuestions = () => {
    // Simulerad AI-generering
    const company = event.with?.split(',')[0] || 'Företaget'
    const questions = [
      `Vad vet du om ${company}s affärsmodell?`,
      `Hur skulle du bidra till ${company}s tillväxt?`,
      `Vad lockar dig mest med att arbeta på ${company}?`,
      `Beskriv hur du hanterar [relevant utmaning för rollen]`,
    ]
    
    onPrepChange({
      ...prep,
      commonQuestions: [...(prep?.commonQuestions || []), ...questions],
    })
  }

  const getDressCode = () => {
    // Gissa klädkod baserat på företagstyp eller default
    const desc = (event.description || '').toLowerCase()
    if (desc.includes('bank') || desc.includes('finans')) return dressCodeGuide.bank
    if (desc.includes('tech') || desc.includes('it')) return dressCodeGuide.tech
    if (desc.includes('startup')) return dressCodeGuide.startup
    if (desc.includes('vård') || desc.includes('sjuk')) return dressCodeGuide.healthcare
    return dressCodeGuide.default
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Förberedelseassistent</h3>
            <p className="text-sm text-slate-500">AI-genererade tips och frågor</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* AI Generator */}
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">Skräddarsydda frågor</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Generera intervjufrågor baserade på företaget och rollen
                </p>
                <button
                  onClick={generateAIQuestions}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Brain size={16} />
                  Generera frågor
                </button>
              </div>
            </div>
          </div>

          {/* Klädkod */}
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-start gap-3">
              <Shirt className="w-5 h-5 text-teal-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">Klädrekommendation</h4>
                <p className="text-sm text-slate-700 mt-1">{getDressCode()}</p>
              </div>
            </div>
          </div>

          {/* Vanliga frågor */}
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <h4 className="font-medium text-slate-900">Vanliga intervjufrågor</h4>
            </div>
            <div className="space-y-2">
              {(prep?.commonQuestions || interviewQuestions.common.slice(0, 5)).map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-400 mt-1">•</span>
                  <span className="text-slate-700">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frågor att ställa */}
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-slate-900">Frågor att ställa till dem</h4>
            </div>
            <div className="space-y-2">
              {interviewQuestions.questionsToAsk.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-slate-700">{q}</span>
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
              className="flex items-center justify-center gap-2 p-3 bg-white border border-indigo-100 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors text-sm font-medium"
            >
              <ExternalLink size={16} />
              Sök efter information om företaget
            </a>
          )}
        </div>
      )}
    </div>
  )
}
