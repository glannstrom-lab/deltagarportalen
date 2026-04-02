/**
 * Language Tab - Swedish language resources for work
 */
import { useState } from 'react'
import { Languages, BookOpen, Headphones, MessageSquare, Trophy, ExternalLink, Play, CheckCircle } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Resource {
  id: string
  name: string
  description: string
  type: 'course' | 'app' | 'podcast' | 'practice'
  level: 'beginner' | 'intermediate' | 'advanced'
  cost: 'free' | 'paid' | 'both'
  url: string
}

const RESOURCES: Resource[] = [
  {
    id: 'sfi',
    name: 'SFI (Svenska för invandrare)',
    description: 'Gratis svenskundervisning från kommunen. Olika nivåer beroende på förkunskaper.',
    type: 'course',
    level: 'beginner',
    cost: 'free',
    url: 'https://www.skolverket.se/undervisning/vuxenutbildningen/komvux-svenska-for-invandrare-sfi',
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    description: 'Populär app för att lära sig svenska. Bra för nybörjare och daglig övning.',
    type: 'app',
    level: 'beginner',
    cost: 'both',
    url: 'https://www.duolingo.com/course/sv/en/Learn-Swedish',
  },
  {
    id: 'babbel',
    name: 'Babbel',
    description: 'Strukturerade kurser med fokus på konversation och grammatik.',
    type: 'app',
    level: 'beginner',
    cost: 'paid',
    url: 'https://www.babbel.com/learn-swedish',
  },
  {
    id: 'sverigesradio',
    name: 'Sveriges Radio - Klartext',
    description: 'Nyheter på lätt svenska. Perfekt för att öva hörförståelse.',
    type: 'podcast',
    level: 'intermediate',
    cost: 'free',
    url: 'https://sverigesradio.se/klartext',
  },
  {
    id: 'swedishpod101',
    name: 'SwedishPod101',
    description: 'Podcast-baserad kurs med lektioner för alla nivåer.',
    type: 'podcast',
    level: 'beginner',
    cost: 'both',
    url: 'https://www.swedishpod101.com/',
  },
  {
    id: 'folkuniversitetet',
    name: 'Folkuniversitetet',
    description: 'Kurser i svenska på kvällar och helger. Bra för yrkesverksamma.',
    type: 'course',
    level: 'intermediate',
    cost: 'paid',
    url: 'https://www.folkuniversitetet.se/spraklanguages/svenska/',
  },
  {
    id: 'tandem',
    name: 'Tandem / HelloTalk',
    description: 'Språkutbyte med modersmålstalare. Öva konversation med svenskar.',
    type: 'practice',
    level: 'intermediate',
    cost: 'free',
    url: 'https://www.tandem.net/',
  },
]

const WORK_PHRASES = [
  { swedish: 'Godmorgon, hur mår du?', english: 'Good morning, how are you?', context: 'Hälsning' },
  { swedish: 'Jag förstår inte, kan du förklara igen?', english: "I don't understand, can you explain again?", context: 'Möten' },
  { swedish: 'Kan vi boka ett möte?', english: 'Can we book a meeting?', context: 'Möten' },
  { swedish: 'Jag skickar ett mail om det.', english: "I'll send an email about it.", context: 'Kommunikation' },
  { swedish: 'Vad trevligt att träffas!', english: 'Nice to meet you!', context: 'Hälsning' },
  { swedish: 'Jag jobbar med...', english: 'I work with...', context: 'Presentation' },
  { swedish: 'Kan du hjälpa mig med...?', english: 'Can you help me with...?', context: 'Hjälp' },
  { swedish: 'Det låter bra!', english: 'That sounds good!', context: 'Svar' },
  { swedish: 'Vi hörs!', english: "We'll be in touch!", context: 'Avslutning' },
  { swedish: 'Ha en bra helg!', english: 'Have a nice weekend!', context: 'Avslutning' },
]

const LEVELS = [
  { id: 'A1', name: 'A1 - Nybörjare', description: 'Grundläggande fraser och hälsningar' },
  { id: 'A2', name: 'A2 - Elementär', description: 'Enkla samtal om vardagliga ämnen' },
  { id: 'B1', name: 'B1 - Mellannivå', description: 'Kan delta i arbetsrelaterade samtal' },
  { id: 'B2', name: 'B2 - Övre mellannivå', description: 'Flytande i de flesta arbetssituationer' },
  { id: 'C1', name: 'C1 - Avancerad', description: 'Nära modersmålsnivå' },
]

export default function LanguageTab() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  const filteredResources = selectedLevel
    ? RESOURCES.filter(r =>
        (selectedLevel === 'beginner' && r.level === 'beginner') ||
        (selectedLevel === 'intermediate' && r.level !== 'advanced') ||
        (selectedLevel === 'advanced')
      )
    : RESOURCES

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Languages className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Svenska för arbetslivet</h2>
            <p className="text-slate-600 mt-1">
              Resurser och tips för att lära dig svenska. Grundläggande svenska
              uppskattas mycket på svenska arbetsplatser.
            </p>
          </div>
        </div>
      </Card>

      {/* Language levels */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Språknivåer (CEFR)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {LEVELS.map((level, idx) => (
            <div
              key={level.id}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                idx < 2 ? "bg-emerald-50 border-emerald-200" :
                idx < 4 ? "bg-amber-50 border-amber-200" :
                "bg-violet-50 border-violet-200"
              )}
            >
              <p className="font-bold text-slate-800">{level.id}</p>
              <p className="text-xs text-slate-500 mt-1">{level.description}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-3">
          <strong>Tips:</strong> B1-nivå är ofta tillräckligt för att fungera bra på en svensk arbetsplats
          där engelska också används.
        </p>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedLevel(null)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !selectedLevel ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Alla nivåer
        </button>
        <button
          onClick={() => setSelectedLevel('beginner')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedLevel === 'beginner' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Nybörjare
        </button>
        <button
          onClick={() => setSelectedLevel('intermediate')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedLevel === 'intermediate' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Mellannivå
        </button>
      </div>

      {/* Resources */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Resurser för att lära dig svenska
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    resource.type === 'course' && "bg-violet-100 text-violet-600",
                    resource.type === 'app' && "bg-blue-100 text-blue-600",
                    resource.type === 'podcast' && "bg-rose-100 text-rose-600",
                    resource.type === 'practice' && "bg-emerald-100 text-emerald-600"
                  )}>
                    {resource.type === 'course' && <BookOpen className="w-5 h-5" />}
                    {resource.type === 'app' && <Play className="w-5 h-5" />}
                    {resource.type === 'podcast' && <Headphones className="w-5 h-5" />}
                    {resource.type === 'practice' && <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {resource.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        resource.level === 'beginner' && "bg-emerald-100 text-emerald-700",
                        resource.level === 'intermediate' && "bg-amber-100 text-amber-700",
                        resource.level === 'advanced' && "bg-violet-100 text-violet-700"
                      )}>
                        {resource.level === 'beginner' ? 'Nybörjare' :
                         resource.level === 'intermediate' ? 'Mellannivå' : 'Avancerad'}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        resource.cost === 'free' && "bg-slate-100 text-slate-600",
                        resource.cost === 'paid' && "bg-blue-100 text-blue-600",
                        resource.cost === 'both' && "bg-purple-100 text-purple-600"
                      )}>
                        {resource.cost === 'free' ? 'Gratis' :
                         resource.cost === 'paid' ? 'Betald' : 'Gratis/Betald'}
                      </span>
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="text-sm text-slate-500 mt-2">{resource.description}</p>
            </a>
          ))}
        </div>
      </Card>

      {/* Work phrases */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          Vanliga fraser på jobbet
        </h3>

        <div className="space-y-3">
          {WORK_PHRASES.map((phrase, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-800">{phrase.swedish}</p>
                  <p className="text-sm text-slate-500">{phrase.english}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-white rounded-full text-slate-500 border">
                  {phrase.context}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-emerald-50 border-emerald-100">
        <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Tips för att lära dig snabbare
        </h3>
        <ul className="space-y-2 text-sm text-emerald-800">
          <li>• Prata svenska på jobbet så mycket du kan - kollegor uppskattar det</li>
          <li>• Lyssna på svensk radio/podcasts under pendling</li>
          <li>• Ställ in telefon och dator på svenska</li>
          <li>• Delta i "fika" - det är bästa stället att öva vardagssvenska</li>
          <li>• Var inte rädd för att göra fel - svenskar är tålmodiga</li>
        </ul>
      </Card>
    </div>
  )
}
