/**
 * Quick Help Tab
 * Emergency/urgent help for common job search situations
 */

import { AlertCircle, Clock, ChevronRight, Phone, Calendar, FileText, Briefcase } from 'lucide-react'
import { Card } from '@/components/ui'
import type { Article } from '@/types/knowledge'

interface QuickHelpTabProps {
  articles: Article[]
}

const emergencyTopics = [
  {
    id: 'interview-tomorrow',
    title: 'Jag har intervju imorgon!',
    description: 'Sista-minuten förberedelse och checklista',
    icon: Calendar,
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    urgency: 'high',
    readingTime: 5,
  },
  {
    id: 'empty-cv',
    title: 'Mitt CV ser tomt ut',
    description: 'Hur du skriver ett starkt CV utan erfarenhet',
    icon: FileText,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    urgency: 'medium',
    readingTime: 8,
  },
  {
    id: 'rejection-followup',
    title: 'Fick avslag – hur går jag vidare?',
    description: 'Hantera besvikelse och komma tillbaka starkare',
    icon: AlertCircle,
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    urgency: 'medium',
    readingTime: 6,
  },
  {
    id: 'first-meeting',
    title: 'Ska på mitt första arbetsmöte',
    description: 'Vad väntar och hur du förbereder dig',
    icon: Briefcase,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    urgency: 'medium',
    readingTime: 7,
  },
  {
    id: 'explain-gap',
    title: 'Hur förklarar jag ett glapp i CV:t?',
    description: 'Vänd ett svaghet till en styrka',
    icon: FileText,
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    urgency: 'low',
    readingTime: 5,
  },
  {
    id: 'phone-interview',
    title: 'Telefonintervju – vad ska jag säga?',
    description: 'Tips för att lyckas över telefon',
    icon: Phone,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    urgency: 'high',
    readingTime: 4,
  },
]

const quickChecklists = [
  {
    title: 'Innan intervjun – snabbcheck',
    items: [
      'Klädsel vald och redo',
      'Vägbeskrivning/Zoom-länk testad',
      '3 styrkor förberedda',
      'Frågor att ställa nedskrivna',
      'CV och personligt brev utskrivna',
    ],
  },
  {
    title: 'Efter intervjun – glöm inte!',
    items: [
      'Skicka tack-mail inom 24h',
      'Reflektera över vad som gick bra',
      'Notera vad du ska fråga om nästa gång',
      'Uppdatera din jobbtracker',
    ],
  },
]

export function QuickHelpTab({ onArticleClick }: QuickHelpTabProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-rose-50 to-amber-50 border-rose-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Snabbhjälp
            </h2>
            <p className="text-slate-600 mt-1">
              Akuta situationer och snabba svar på vanliga problem. 
              Här hittar du hjälp när du behöver det som mest.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Emergency topics */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Vanliga situationer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyTopics.map((topic) => {
            const Icon = topic.icon
            return (
              <button
                key={topic.id}
                onClick={() => onArticleClick(topic.id)}
                className={`
                  text-left p-4 rounded-xl border transition-all hover:shadow-md
                  ${topic.color}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{topic.title}</h4>
                      {topic.urgency === 'high' && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-medium rounded-full">
                          Akut
                        </span>
                      )}
                    </div>
                    <p className="text-sm opacity-80 mt-1">
                      {topic.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{topic.readingTime} min</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </div>
              </button>
            )
          })}
        </div>
      </section>
      
      {/* Quick checklists */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Snabbchecklistor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickChecklists.map((checklist) => (
            <Card key={checklist.title} className="bg-slate-50">
              <h4 className="font-semibold text-slate-800 mb-3">
                {checklist.title}
              </h4>
              <ul className="space-y-2">
                {checklist.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded border-slate-300"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Crisis support */}
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              Behöver du prata med någon?
            </h3>
            <p className="text-slate-600 mt-1 text-sm">
              Om du känner dig överväldigad eller behöver stöd, 
              tveka inte att kontakta din arbetskonsulent.
            </p>
            <a
              href="/dashboard/diary"
              className="inline-flex items-center gap-2 mt-3 text-sky-700 font-medium hover:underline"
            >
              Boka ett möte
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}
