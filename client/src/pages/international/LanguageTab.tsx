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
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-sky-100 dark:border-sky-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-500 dark:from-sky-600 dark:to-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Svenska för arbetslivet</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Resurser och tips för att lära dig svenska. Grundläggande svenska
              uppskattas mycket på svenska arbetsplatser.
            </p>
          </div>
        </div>
      </Card>

      {/* Language levels */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          Språknivåer (CEFR)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {LEVELS.map((level, idx) => (
            <div
              key={level.id}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                idx < 2 ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700" :
                idx < 4 ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700" :
                "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700"
              )}
            >
              <p className="font-bold text-gray-800 dark:text-gray-100">{level.id}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{level.description}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
          <strong className="text-gray-800 dark:text-gray-100">Tips:</strong> B1-nivå är ofta tillräckligt för att fungera bra på en svensk arbetsplats
          där engelska också används.
        </p>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedLevel(null)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !selectedLevel ? "bg-sky-600 dark:bg-sky-700 text-white" : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600"
          )}
        >
          Alla nivåer
        </button>
        <button
          onClick={() => setSelectedLevel('beginner')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedLevel === 'beginner' ? "bg-sky-600 dark:bg-sky-700 text-white" : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600"
          )}
        >
          Nybörjare
        </button>
        <button
          onClick={() => setSelectedLevel('intermediate')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedLevel === 'intermediate' ? "bg-sky-600 dark:bg-sky-700 text-white" : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600"
          )}
        >
          Mellannivå
        </button>
      </div>

      {/* Resources */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Resurser för att lära dig svenska
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-600 hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    resource.type === 'course' && "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400",
                    resource.type === 'app' && "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
                    resource.type === 'podcast' && "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400",
                    resource.type === 'practice' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {resource.type === 'course' && <BookOpen className="w-5 h-5" />}
                    {resource.type === 'app' && <Play className="w-5 h-5" />}
                    {resource.type === 'podcast' && <Headphones className="w-5 h-5" />}
                    {resource.type === 'practice' && <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {resource.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        resource.level === 'beginner' && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
                        resource.level === 'intermediate' && "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
                        resource.level === 'advanced' && "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                      )}>
                        {resource.level === 'beginner' ? 'Nybörjare' :
                         resource.level === 'intermediate' ? 'Mellannivå' : 'Avancerad'}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        resource.cost === 'free' && "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300",
                        resource.cost === 'paid' && "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
                        resource.cost === 'both' && "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
                      )}>
                        {resource.cost === 'free' ? 'Gratis' :
                         resource.cost === 'paid' ? 'Betald' : 'Gratis/Betald'}
                      </span>
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{resource.description}</p>
            </a>
          ))}
        </div>
      </Card>

      {/* Work phrases */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Vanliga fraser på jobbet
        </h3>

        <div className="space-y-3">
          {WORK_PHRASES.map((phrase, idx) => (
            <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{phrase.swedish}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{phrase.english}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-white dark:bg-stone-600 rounded-full text-gray-600 dark:text-gray-300 border border-stone-200 dark:border-stone-500">
                  {phrase.context}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800">
        <h3 className="font-semibold text-sky-900 dark:text-sky-100 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Tips för att lära dig snabbare
        </h3>
        <ul className="space-y-2 text-sm text-sky-800 dark:text-sky-200">
          <li>- Prata svenska på jobbet så mycket du kan - kollegor uppskattar det</li>
          <li>- Lyssna på svensk radio/podcasts under pendling</li>
          <li>- Ställ in telefon och dator på svenska</li>
          <li>- Delta i "fika" - det är bästa stället att öva vardagssvenska</li>
          <li>- Var inte rädd för att göra fel - svenskar är tålmodiga</li>
        </ul>
      </Card>
    </div>
  )
}
