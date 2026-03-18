/**
 * Negotiation Tab - Salary negotiation guide and tips
 */
import { useState } from 'react'
import { TrendingUp, CheckCircle, AlertCircle, MessageSquare, Target, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface NegotiationStep {
  id: number
  title: string
  description: string
  tips: string[]
  phrases: string[]
}

const NEGOTIATION_STEPS: NegotiationStep[] = [
  {
    id: 1,
    title: 'Förberedelse',
    description: 'Grunden för en lyckad förhandling läggs innan mötet.',
    tips: [
      'Undersök marknadslön för din roll och erfarenhet',
      'Dokumentera dina prestationer och resultat',
      'Bestäm ditt mål och din lägsta acceptabla nivå',
      'Förbered konkreta exempel på ditt värde',
    ],
    phrases: [
      '"Jag har undersökt marknaden och ser att liknande roller ligger på X-Y kr..."',
      '"Under senaste året har jag bidragit till..."',
    ],
  },
  {
    id: 2,
    title: 'Inledning',
    description: 'Börja samtalet på rätt sätt.',
    tips: [
      'Tacka för möjligheten att diskutera lön',
      'Uttryck entusiasm för rollen/företaget',
      'Var tydlig med att du vill diskutera kompensation',
      'Lyssna aktivt på arbetsgivarens perspektiv',
    ],
    phrases: [
      '"Jag uppskattar möjligheten att diskutera min kompensation..."',
      '"Jag trivs verkligen här och vill gärna prata om hur min lön speglar mitt bidrag..."',
    ],
  },
  {
    id: 3,
    title: 'Argumentation',
    description: 'Presentera ditt case med fakta och resultat.',
    tips: [
      'Fokusera på värdet du tillför, inte vad du behöver',
      'Använd konkreta siffror och exempel',
      'Jämför med marknadslöner objektivt',
      'Var beredd att motivera varje punkt',
    ],
    phrases: [
      '"Baserat på mina resultat där jag ökade försäljningen med X%..."',
      '"Jag tog på mig ansvar för Y-projektet som sparade företaget Z kr..."',
    ],
  },
  {
    id: 4,
    title: 'Förhandling',
    description: 'Hantera motbud och kompromisser.',
    tips: [
      'Be aldrig om ursäkt för att förhandla',
      'Var beredd på motbud - det är normalt',
      'Överväg hela paketet: bonus, förmåner, semester',
      'Ta tid på dig att överväga om det behövs',
    ],
    phrases: [
      '"Jag förstår budgeten är begränsad. Kan vi titta på andra förmåner?"',
      '"Kan vi komma överens om en utvärdering om 6 månader?"',
    ],
  },
  {
    id: 5,
    title: 'Avslutning',
    description: 'Avsluta professionellt oavsett utfall.',
    tips: [
      'Sammanfatta vad ni kommit överens om',
      'Be om skriftlig bekräftelse',
      'Tacka för samtalet och möjligheten',
      'Sätt datum för uppföljning om relevant',
    ],
    phrases: [
      '"Kan vi sammanfatta vad vi kommit överens om skriftligt?"',
      '"Tack för ett konstruktivt samtal. Jag ser fram emot att fortsätta bidra."',
    ],
  },
]

const DO_AND_DONT = {
  do: [
    'Var förberedd med fakta och siffror',
    'Fokusera på värdet du tillför',
    'Lyssna aktivt och ställ frågor',
    'Var professionell och lugn',
    'Ha en BATNA (bästa alternativ)',
    'Dokumentera allt skriftligt',
  ],
  dont: [
    'Nämn inte personliga ekonomiska behov',
    'Jämför dig inte med kollegor',
    'Ge inte ultimatum tidigt',
    'Acceptera inte första erbjudandet direkt',
    'Bli inte defensiv vid motbud',
    'Glöm inte bort förmåner utöver lön',
  ],
}

export default function NegotiationTab() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Löneförhandlingsguide</h2>
            <p className="text-slate-600 mt-1">
              Steg-för-steg guide för att förhandla lön i svensk arbetskultur.
              Förberedd förhandling ger bättre resultat.
            </p>
          </div>
        </div>
      </Card>

      {/* Swedish context note */}
      <Card className="bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Svensk arbetsmarknad</p>
            <p className="text-sm text-blue-700 mt-1">
              I Sverige är löneförhandling ofta mer strukturerad än i andra länder.
              Många branscher har kollektivavtal som sätter ramarna.
              Individuella förhandlingar sker ofta vid årliga lönesamtal.
            </p>
          </div>
        </div>
      </Card>

      {/* Step-by-step guide */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-violet-600" />
          Förhandlingens 5 steg
        </h3>

        <div className="space-y-3">
          {NEGOTIATION_STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                expandedStep === step.id ? "border-violet-200 bg-violet-50/30" : "border-slate-200"
              )}
            >
              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    expandedStep === step.id
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {step.id}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
                {expandedStep === step.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedStep === step.id && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Tips */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Tips:</p>
                    <ul className="space-y-2">
                      {step.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phrases */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Exempelfraser:
                    </p>
                    <div className="space-y-2">
                      {step.phrases.map((phrase, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-violet-100 text-sm text-slate-700 italic">
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Do and Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-200">
          <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Gör detta
          </h3>
          <ul className="space-y-3">
            {DO_AND_DONT.do.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-rose-200">
          <h3 className="font-semibold text-rose-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            Undvik detta
          </h3>
          <ul className="space-y-3">
            {DO_AND_DONT.dont.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Timing advice */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          När ska du förhandla?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="font-medium text-amber-900">Vid jobbstart</p>
            <p className="text-sm text-amber-700 mt-1">Bästa tillfället att sätta rätt nivå</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="font-medium text-amber-900">Årligt lönesamtal</p>
            <p className="text-sm text-amber-700 mt-1">Planerat tillfälle - var förberedd</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="font-medium text-amber-900">Efter stora framgångar</p>
            <p className="text-sm text-amber-700 mt-1">Dokumentera och kapitalisera</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="font-medium text-amber-900">Vid nya ansvar</p>
            <p className="text-sm text-amber-700 mt-1">Mer ansvar = mer kompensation</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
