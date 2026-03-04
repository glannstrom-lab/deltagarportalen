import { useState } from 'react'
import { 
  Users, 
  MessageCircle, 
  Mail, 
  Linkedin, 
  Coffee, 
  ChevronDown, 
  ChevronUp,
  Copy,
  CheckCircle2,
  Lightbulb,
  Target,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetworkTemplate {
  id: string
  title: string
  description: string
  template: string
  tips: string[]
}

const networkTemplates: NetworkTemplate[] = [
  {
    id: 'reconnect',
    title: 'Återkontakt med gammal kollega',
    description: 'Perfekt för att värma upp en gammal kontakt',
    template: `Hej [Namn]!

Det var länge sedan vi hördes! Jag hoppas allt är bra med dig.

Jag skriver för att jag just nu är på jakt efter nya möjligheter inom [område/bransch] och tänkte att jag skulle höra om du har några tips eller känner någon som skulle kunna vara intressant att prata med?

Det vore jättekul att få höra hur du har det också! Har du tid för en kaffe eller ett samtal någon dag?

Ha det bra!
[Ditt namn]`,
    tips: [
      'Nämns något specifikt ni gjort tillsammans för att väcka minnen',
      'Var tydlig med vad du söker men inte för krävande',
      'Föreslå ett konkret sätt att mötas'
    ]
  },
  {
    id: 'linkedin',
    title: 'LinkedIn-kontakt (kall)',
    description: 'För att kontakta någon du beundrar men inte känner',
    template: `Hej [Namn],

Jag heter [Ditt namn] och arbetar/intresserar mig för [kort beskrivning]. Jag har följt ditt arbete inom [specifikt område] och blev särskilt inspirerad av [specifik sak de gjort].

Just nu utforskar jag möjligheter inom [bransch/område] och skulle vara otroligt tacksam för 15 minuter av din tid för att höra om din resa och eventuellt få några råd.

Om du har möjlighet, skulle du kunna tänka dig ett kort samtal eller besvara några frågor via mejl?

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Nämn något specifikt de gjort - visar att du gjort research',
      'Var respektfull för deras tid',
      'Gör det enkelt att säga ja (låg tröskel)'
    ]
  },
  {
    id: 'after-meeting',
    title: 'Uppföljning efter nätverksträff',
    description: 'För att befästa ett nytt kontakt efter event/möte',
    template: `Hej [Namn]!

Det var jättetrevligt att träffas på [event/möte] igår! Jag uppskattade särskilt vår diskussion om [specifikt ämne ni pratade om].

Som jag nämnde söker jag just nu [vad du söker] och skulle gärna vilja fortsätta vårt samtal. Du nämnde att du kände [namn/kontakt] - skulle du kunna tänka dig att förmedla en kontakt?

Oavsett önskar jag dig en fortsatt fin vecka!

Vänliga hälsningar,
[Ditt namn]

[LinkedIn-profil eller kontaktuppgifter]`,
    tips: [
      'Referera till något specifikt ni pratade om',
      'Påminn om eventuella löften eller leads',
      'Håll dörren öppen för framtida kontakt'
    ]
  },
  {
    id: 'thank-you',
    title: 'Tack efter tips/hjälp',
    description: 'För att visa uppskattning och hålla relationen varm',
    template: `Hej [Namn]!

Jag ville bara säga ett stort tack för att du tog dig tid att [vad de hjälpte med] förra veckan. Det betydde verkligen mycket för mig!

Jag har nu [vad du gjort med deras tips, t.ex. "kontaktat Maria som du rekommenderade" / "uppdaterat mitt CV enligt dina råd"] och känner mig mycket mer redo.

Jag återkommer gärna med en uppdatering om hur det går. Ha det så bra tills dess!

Varmt tack igen,
[Ditt namn]`,
    tips: [
      'Var specifik med vad du tackar för',
      'Berätta vad du gjort med deras råd',
      'Lämna en öppning för framtida kontakt'
    ]
  }
]

const networkingTips = [
  {
    title: 'Kvalitet över kvantitet',
    description: 'Det är bättre med 5 djupa relationer än 50 ytliga kontakter.',
    icon: Target
  },
  {
    title: 'Ge innan du ber',
    description: 'Erbjud hjälp eller värde innan du ber om något.',
    icon: Sparkles
  },
  {
    title: 'Följ upp regelbundet',
    description: 'En kort hälsning var 3:e månad håller relationen vid liv.',
    icon: Coffee
  },
  {
    title: 'Var genuin',
    description: 'Människor känner av äkta intresse. Var dig själv.',
    icon: Lightbulb
  }
]

export function NetworkingGuide() {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (template: NetworkTemplate) => {
    navigator.clipboard.writeText(template.template)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <h2 className="text-2xl font-bold">Nätverkande</h2>
        </div>
        <p className="text-amber-100 max-w-2xl">
          70% av alla jobb tillsätts via nätverk. Här hittar du verktyg och mallar 
          för att bygga och underhålla professionella relationer.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Linkedin className="text-blue-600" size={20} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Optimera LinkedIn</h3>
          <p className="text-sm text-slate-600">
            Se till att din profil är uppdaterad och professionell.
          </p>
          <a 
            href="/cv" 
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            Gå till CV-byggaren <ChevronDown size={14} className="-rotate-90" />
          </a>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
            <Coffee className="text-emerald-600" size={20} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Informationsmöte</h3>
          <p className="text-sm text-slate-600">
            Be om 15 minuter för att lära dig mer om ett företag eller roll.
          </p>
          <span className="inline-block text-xs text-slate-500 mt-3 bg-slate-100 px-2 py-1 rounded">
            Mallar nedan
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-3">
            <MessageCircle className="text-violet-600" size={20} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Följ upp</h3>
          <p className="text-sm text-slate-600">
            Skicka alltid ett tack efter möten. Det gör skillnad!
          </p>
          <span className="inline-block text-xs text-slate-500 mt-3 bg-slate-100 px-2 py-1 rounded">
            Mallar nedan
          </span>
        </div>
      </div>

      {/* Tips Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-amber-500" />
          Grundprinciper för nätverkande
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networkingTips.map((tip) => (
            <div 
              key={tip.title}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <tip.icon size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-600">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail size={20} className="text-blue-500" />
          Färdiga mallar för nätverkande
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Klicka på en mall för att se hela texten. Kopiera och anpassa efter din situation.
        </p>

        <div className="space-y-3">
          {networkTemplates.map((template) => (
            <div 
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setExpandedTemplate(
                  expandedTemplate === template.id ? null : template.id
                )}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-medium text-slate-800">{template.title}</h4>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </div>
                {expandedTemplate === template.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedTemplate === template.id && (
                <div className="px-5 pb-5">
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Mall
                      </span>
                      <button
                        onClick={() => handleCopy(template)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          copiedId === template.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        )}
                      >
                        {copiedId === template.id ? (
                          <>
                            <CheckCircle2 size={14} />
                            Kopierad!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Kopiera
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {template.template}
                    </pre>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      Tips för denna mall
                    </h5>
                    <ul className="space-y-1.5">
                      {template.tips.map((tip, index) => (
                        <li 
                          key={index}
                          className="text-sm text-slate-600 flex items-start gap-2"
                        >
                          <span className="text-teal-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Redo att nätverka?</h3>
            <p className="text-teal-100 text-sm">
              Börja med någon du redan känner - det är lättare än du tror!
            </p>
          </div>
          <a
            href="/exercises"
            className="px-5 py-2.5 bg-white text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors flex items-center gap-2"
          >
            <Sparkles size={18} />
            Öva på pitch
          </a>
        </div>
      </div>
    </div>
  )
}
