import { useState } from 'react'
import { BookOpen, Copy, Check } from 'lucide-react'

interface PhraseCategory {
  name: string
  phrases: string[]
}

const phraseCategories: PhraseCategory[] = [
  {
    name: 'Sammanfattning',
    phrases: [
      'Resultatorienterad [yrke] med [X] års erfarenhet av att driva framgångsrika projekt inom [bransch].',
      'Kundfokuserad professionell med bevisad förmåga att bygga långsiktiga relationer och öka försäljningen.',
      'Noggrann och effektiv [yrke] som brinner för att skapa struktur och optimera processer.',
      'Kreativ problemlösare med stark kommunikationsförmåga och erfarenhet av att leda tvärfunktionella team.',
    ],
  },
  {
    name: 'Arbetslivserfarenhet',
    phrases: [
      'Ökade [mätetal] med [X]% genom att implementera [åtgärd] under [tidsperiod].',
      'Ledde och mentorerade ett team om [antal] personer, vilket resulterade i [resultat].',
      'Drev framgångsrikt [projekt] från koncept till färdigställande inom [tidsram].',
      'Ansvarade för [budget/område] och överträffade målen med [X]% genom [strategi].',
      'Utvecklade och implementerade [process/system] som förbättrade [aspekt] med [X]%.',
    ],
  },
  {
    name: 'Färdigheter',
    phrases: [
      'Projektledning, Teamledning, Strategisk planering, Budgetansvar, Stakeholder management',
      'Kundservice, Försäljning, Konflikthantering, Förhandling, Relationsbyggande',
      'Dataanalys, Rapportskrivning, Excel, PowerPoint, Business Intelligence',
      'Digital marknadsföring, SEO/SEM, Sociala medier, Innehållsproduktion, Analys',
      'Programmering, Systemutveckling, Agila metoder, Testning, Kravanalys',
    ],
  },
  {
    name: 'Power Verbs',
    phrases: [
      'ledde', 'drev', 'utvecklade', 'implementerade', 'optimerade', 'förbättrade',
      'samordnade', 'skapade', 'lanserade', 'övervakade', 'analyserade', 'presenterade',
      'förhandlade', 'mentorerade', 'effektiviserade', 'strukturerade', 'automatisierade',
    ],
  },
]

interface PhraseBankProps {
  onSelectPhrase: (phrase: string) => void
}

export function PhraseBank({ onSelectPhrase }: PhraseBankProps) {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (phrase: string, index: number) => {
    onSelectPhrase(phrase)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
          <BookOpen size={24} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Färdiga formuleringar</h3>
          <p className="text-sm text-slate-500">Klicka för att kopiera</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {phraseCategories.map((category, index) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(index)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedCategory === index
                ? 'bg-[#4f46e5] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Phrases */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {phraseCategories[selectedCategory].phrases.map((phrase, index) => (
          <button
            key={index}
            onClick={() => handleCopy(phrase, index)}
            className="w-full text-left p-3 bg-slate-50 rounded-lg hover:bg-[#eef2ff] transition-colors group flex items-center justify-between"
          >
            <span className="text-sm text-slate-700 pr-2">{phrase}</span>
            {copiedIndex === index ? (
              <Check size={16} className="text-green-500 flex-shrink-0" />
            ) : (
              <Copy size={16} className="text-slate-400 group-hover:text-[#4f46e5] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
