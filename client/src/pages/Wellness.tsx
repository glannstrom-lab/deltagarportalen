import { useState, useEffect } from 'react'
import { 
  Heart, 
  Brain, 
  Sun, 
  Moon, 
  Activity, 
  Coffee,
  Music,
  BookOpen,
  Dumbbell,
  Sparkles,
  CheckCircle,
  ArrowRight,
  PenLine,
  Lock,
  Download,
  Quote
} from 'lucide-react'

interface WellnessTip {
  id: string
  category: 'mental' | 'physical' | 'sleep' | 'social'
  title: string
  description: string
  icon: React.ElementType
  color: string
}

interface DailyActivity {
  id: string
  title: string
  completed: boolean
  icon: React.ElementType
}

const wellnessTips: WellnessTip[] = [
  {
    id: '1',
    category: 'mental',
    title: 'Mindfulness för arbetssökande',
    description: 'Ta 5 minuter varje dag för att bara andas och vara närvarande. Det hjälper dig hantera stressen i jobbsökandet.',
    icon: Brain,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: '2',
    category: 'physical',
    title: 'Rör på dig regelbundet',
    description: 'En kort promenad kan göra underverk för ditt humör och din energi. Försök röra på dig minst 30 minuter om dagen.',
    icon: Activity,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: '3',
    category: 'sleep',
    title: 'Prioritera din sömn',
    description: 'God sömn är avgörande för din prestation i intervjuer. Sikta på 7-9 timmar per natt.',
    icon: Moon,
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    id: '4',
    category: 'social',
    title: 'Behåll sociala kontakter',
    description: 'Jobbsökande kan vara isolerande. Träffa vänner och familj regelbundet för att behålla perspektivet.',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-700'
  },
]

const initialActivities: DailyActivity[] = [
  { id: '1', title: 'Gå en promenad', completed: false, icon: Activity },
  { id: '2', title: 'Meditation 10 min', completed: false, icon: Brain },
  { id: '3', title: 'Skriv 3 positiva saker', completed: false, icon: Sun },
  { id: '4', title: 'Kontakta en vän', completed: false, icon: Coffee },
]

const resources = [
  {
    title: 'Guidad meditation',
    description: 'Lugnande övningar för stresshantering',
    icon: Music,
    color: 'bg-rose-100 text-rose-700'
  },
  {
    title: 'Träningsprogram',
    description: 'Enkla övningar du kan göra hemma',
    icon: Dumbbell,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    title: 'Sömntips',
    description: 'Förbättra din sömnkvalitet',
    icon: Moon,
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    title: 'Läsguider',
    description: 'Artiklar om välmående i arbetslöshet',
    icon: BookOpen,
    color: 'bg-emerald-100 text-emerald-700'
  },
]

const affirmations = [
  "Jag är mer än mitt jobb. Mitt värde bestäms inte av min anställningsstatus.",
  "Varje nej leder mig närmare rätt ja.",
  "Jag har överlevt 100% av mina svåraste dagar.",
  "Det är okej att gå långsamt. Jag är fortfarande på väg.",
  "Jag förtjänar vila utan att behöva förtjäna den.",
  "Mina framsteg räknas, även om de är små.",
  "Jag är tillräcklig precis som jag är just nu.",
  "Detta är tillfälligt. Det känns tufft, men det kommer att bli bättre.",
]

const journalPrompts = [
  "Vad är jag stolt över idag, även om det är litet?",
  "Vad skulle jag säga till en vän i samma situation?",
  "Vilka styrkor har jag som inte syns i ett CV?",
  "Vad behöver jag höra just nu?",
  "Vad har jag lärt mig om mig själv denna vecka?",
  "Vilken är en sak jag kan vara tacksam för idag?",
]

interface JournalEntry {
  id: string
  date: string
  content: string
  mood: number
}

export default function Wellness() {
  const [activities, setActivities] = useState<DailyActivity[]>(initialActivities)
  const [mood, setMood] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentAffirmation, setCurrentAffirmation] = useState(0)

  // Load journal entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wellness-journal')
    if (saved) {
      setJournalEntries(JSON.parse(saved))
    }
  }, [])

  // Save journal entries
  useEffect(() => {
    localStorage.setItem('wellness-journal', JSON.stringify(journalEntries))
  }, [journalEntries])

  const toggleActivity = (id: string) => {
    setActivities(prev => prev.map(a => 
      a.id === id ? { ...a, completed: !a.completed } : a
    ))
  }

  const completedCount = activities.filter(a => a.completed).length
  const progress = (completedCount / activities.length) * 100

  const filteredTips = activeCategory === 'all' 
    ? wellnessTips 
    : wellnessTips.filter(t => t.category === activeCategory)

  const moodEmojis = [
    { emoji: '😔', label: 'Tungt' },
    { emoji: '😕', label: 'Nedstämd' },
    { emoji: '😐', label: 'Okej' },
    { emoji: '🙂', label: 'Bra' },
    { emoji: '😊', label: 'Jättebra' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Välmående</h1>
        <p className="text-slate-500 mt-1">Ta hand om dig själv under jobbsökandet</p>
      </div>

      {/* Mood Tracker */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Heart className="text-rose-500" size={20} />
          Hur mår du idag?
        </h2>
        <div className="flex items-center justify-center gap-4">
          {moodEmojis.map((item, index) => (
            <button
              key={index}
              onClick={() => setMood(index)}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                ${mood === index 
                  ? 'bg-teal-50 ring-2 ring-teal-500 scale-110' 
                  : 'hover:bg-slate-50'
                }
              `}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-xs text-slate-600 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        {mood !== null && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Tack för att du delar med dig. Kom ihåg att det är okej att ha både bra och mindre bra dagar.
          </p>
        )}
      </div>

      {/* Daily Activities */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            Dagliga aktiviteter
          </h2>
          <span className="text-sm text-slate-500">{completedCount}/{activities.length} klara</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-4">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                  ${activity.completed 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-slate-100 hover:border-slate-200'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${activity.completed ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'}
                `}>
                  {activity.completed ? <CheckCircle size={18} /> : <Icon size={18} />}
                </div>
                <span className={`font-medium ${activity.completed ? 'text-teal-900 line-through' : 'text-slate-700'}`}>
                  {activity.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Wellness Tips */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-semibold text-slate-900">Tips för välmående</h2>
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Alla' },
              { id: 'mental', label: 'Mental hälsa' },
              { id: 'physical', label: 'Fysisk hälsa' },
              { id: 'sleep', label: 'Sömn' },
              { id: 'social', label: 'Socialt' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  px-3 py-1.5 text-sm rounded-lg transition-colors
                  ${activeCategory === cat.id 
                    ? 'bg-teal-100 text-teal-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTips.map((tip) => {
            const Icon = tip.icon
            return (
              <div
                key={tip.id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${tip.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{tip.title}</h3>
                    <p className="text-sm text-slate-600">{tip.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">Resurser</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon
            return (
              <button
                key={index}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all text-left group"
              >
                <div className={`p-3 rounded-xl ${resource.color} w-fit mb-3`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{resource.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{resource.description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-teal-600 font-medium group-hover:gap-2 transition-all">
                  Utforska <ArrowRight size={14} />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Journal / Affirmations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Private Journal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PenLine className="text-teal-600" size={20} />
              <h2 className="font-semibold text-slate-900">Din privata dagbok</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Lock size={14} />
              <span>Ingen annan kan se detta</span>
            </div>
          </div>

          {/* Prompt */}
          <div className="p-3 bg-slate-50 rounded-lg mb-3">
            <p className="text-sm text-slate-600 italic">
              {journalPrompts[currentPrompt]}
            </p>
            <button
              onClick={() => setCurrentPrompt((prev) => (prev + 1) % journalPrompts.length)}
              className="text-xs text-teal-600 hover:text-teal-700 mt-2"
            >
              Ny fråga →
            </button>
          </div>

          {/* Text area */}
          <textarea
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            placeholder="Skriv dina tankar här... (valfritt)"
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />

          {/* Save button */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500">
              {currentEntry.length} tecken
            </p>
            <button
              onClick={() => {
                if (currentEntry.trim()) {
                  const newEntry: JournalEntry = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    content: currentEntry,
                    mood: mood ?? 2,
                  }
                  setJournalEntries([newEntry, ...journalEntries])
                  setCurrentEntry('')
                }
              }}
              disabled={!currentEntry.trim()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Spara tankar
            </button>
          </div>

          {/* Previous entries */}
          {journalEntries.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-medium text-slate-900 mb-3">Tidigare inlägg</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {journalEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">
                        {new Date(entry.date).toLocaleDateString('sv-SE')}
                      </span>
                      <span className="text-lg">{moodEmojis[entry.mood]?.emoji}</span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3">{entry.content}</p>
                  </div>
                ))}
              </div>
              {journalEntries.length > 5 && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  +{journalEntries.length - 5} till inlägg
                </p>
              )}
              <button
                onClick={() => {
                  const data = JSON.stringify(journalEntries, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `dagbok-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                }}
                className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 mt-3"
              >
                <Download size={14} />
                Exportera alla inlägg
              </button>
            </div>
          )}
        </div>

        {/* Daily Affirmation */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-xl text-white">
          <div className="flex items-center gap-2 mb-4">
            <Quote className="text-white/80" size={20} />
            <h2 className="font-semibold">Dagens affirmation</h2>
          </div>

          <div className="min-h-[120px] flex items-center justify-center">
            <p className="text-xl font-medium text-center leading-relaxed">
              "{affirmations[currentAffirmation]}"
            </p>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentAffirmation((prev) => (prev - 1 + affirmations.length) % affirmations.length)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ← Föregående
            </button>
            <span className="text-white/60 text-sm">
              {currentAffirmation + 1} / {affirmations.length}
            </span>
            <button
              onClick={() => setCurrentAffirmation((prev) => (prev + 1) % affirmations.length)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              Nästa →
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm text-white/80">
              💡 Tips: Säg affirmationen högt för dig själv. Det kan kännas konstigt först, 
              men det hjälper hjärnan att tro på orden.
            </p>
          </div>
        </div>
      </div>

      {/* Support Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 rounded-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Behöver du någon att prata med?</h3>
            <p className="text-rose-100">
              Det är viktigt att söka hjälp när du behöver det. Prata med din arbetskonsulent eller sök professionellt stöd.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-rose-600 rounded-lg font-semibold hover:bg-rose-50 transition-colors whitespace-nowrap">
            Få stöd
          </button>
        </div>
      </div>
    </div>
  )
}
