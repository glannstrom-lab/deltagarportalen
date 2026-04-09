/**
 * CV Tips Component
 * Guides and best practices for writing a great CV
 */

import { useState } from 'react'
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Video,
  FileText,
  Target,
  Award
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface TipSection {
  id: string
  title: string
  icon: typeof BookOpen
  description: string
  tips: {
    do: string[]
    dont: string[]
  }
}

const tipSections: TipSection[] = [
  {
    id: 'structure',
    title: 'Struktur & Layout',
    icon: FileText,
    description: 'En tydlig struktur gör det lätt för rekryteraren att hitta information',
    tips: {
      do: [
        'Använd tydliga rubriker för varje sektion',
        'Ha konsekvent formatering genom hela CV:t',
        'Använd punktlistor för att lista arbetsuppgifter',
        'Låt det viktigaste informationen komma först',
        'Ha tillräckligt med whitespace för läsbarhet'
      ],
      dont: [
        'Använd för många olika typsnitt',
        'Gör CV:t för långt (max 2 sidor)',
        'Använd för komplex design som stör läsbarheten',
        'Ha för små marginaler',
        'Använd för många färger'
      ]
    }
  },
  {
    id: 'content',
    title: 'Innehåll & Formuleringar',
    icon: BookOpen,
    description: 'Vad du skriver är viktigare än hur det ser ut',
    tips: {
      do: [
        'Anpassa CV:t för varje jobb du söker',
        'Använd konkreta siffror och resultat ("Ökade försäljningen med 20%")',
        'Börja varje punkt med ett aktivt verb',
        'Fokusera på resultat, inte bara arbetsuppgifter',
        'Inkludera nyckelord från jobbannonsen'
      ],
      dont: [
        'Använd generiska formuleringar som "teamplayer"',
        'Skriv för långa texter - var koncis',
        'Inkludera irrelevant information',
        'Använd jargong som bara din nuvarande arbetsplats förstår',
        'Ljuga eller överdriva dina meriter'
      ]
    }
  },
  {
    id: 'sections',
    title: 'Viktiga Sektioner',
    icon: Target,
    description: 'Vad ska du inkludera och i vilken ordning?',
    tips: {
      do: [
        'Börja med kontaktinformation överst',
        'Ha en kort sammanfattning (2-3 meningar)',
        'Lista arbetslivserfarenhet i omvänd kronologisk ordning',
        'Inkludera utbildning och certifikat',
        'Lägg till relevanta kompetenser och språk'
      ],
      dont: [
        'Inkludera personnummer (säkerhetsrisk)',
        'Skriv "CV" eller "Curriculum Vitae" som rubrik',
        'Lägg till referenser ("Finns på begäran")',
        'Inkludera hobbyer som inte är relevanta',
        'Skriv ut hela adressen (stad räcker)'
      ]
    }
  },
  {
    id: 'ats',
    title: 'ATS & Rekryteringssystem',
    icon: Award,
    description: 'Så här klarar du den automatiska screeningen',
    tips: {
      do: [
        'Använd standardrubriker som "Arbetslivserfarenhet"',
        'Spara som PDF eller Word (.docx)',
        'Använd vanliga typsnitt som Arial eller Calibri',
        'Inkludera nyckelord från jobbannonsen',
        'Se till att texten är markerbar (inte bilder)'
      ],
      dont: [
        'Använd tabeller eller komplex layout',
        'Spara som bild (JPG/PNG)',
        'Använd kreativa rubriker som "Min resa"',
        'Ha viktig information i sidhuvud/sidfot',
        'Använd specialtecken som kan krångla'
      ]
    }
  },
  {
    id: 'adjustments',
    title: 'Anpassa för Långtidsarbetslöshet',
    icon: Lightbulb,
    description: 'Särskilda tips för dig som varit borta från arbetsmarknaden',
    tips: {
      do: [
        'Fokusera på överförbara färdigheter',
        'Inkludera frivilligarbete eller praktik',
        'Nämn kurser eller utbildning du gjort under tiden',
        'Var ärlig men positiv om luckor',
        'Använd funktionell CV-format om du byter bransch'
      ],
      dont: [
        'Känn skam över luckor i CV:t',
        'Lämna helt tomma perioder utan förklaring',
        'Fokusera för mycket på datum',
        'Skriv negativt om tidigare erfarenheter',
        'Ge upp - din erfarenhet är värdefull!'
      ]
    }
  }
]

const quickTips = [
  {
    title: 'Håll det kort',
    content: 'Max 2 sidor. Rekryterare spenderar i genomsnitt 6 sekunder på första screeningen.',
    icon: Target
  },
  {
    title: 'Anpassa varje gång',
    content: 'Läs jobbannonsen och anpassa ditt CV för varje ansökan. Det tar tid men lönar sig.',
    icon: Star
  },
  {
    title: 'Be om feedback',
    content: 'Låt någon du litar på läsa igenom ditt CV. Nya ögon ser saker du missat.',
    icon: Lightbulb
  },
  {
    title: 'PDF är säkrast',
    content: 'Spara alltid som PDF när du skickar in. Då behålls formateringen.',
    icon: FileText
  }
]

export function CVTips() {
  const [expandedSection, setExpandedSection] = useState<string | null>('structure')

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">CV-tips & Guide</h2>
        <p className="text-slate-600">
          Lär dig skriva ett CV som faktiskt ger resultat. Följ våra tips för att öka dina chanser 
          att bli kallad till intervju.
        </p>
      </div>

      {/* Quick Tips Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickTips.map((tip, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
              <tip.icon className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{tip.title}</h3>
            <p className="text-sm text-slate-600">{tip.content}</p>
          </div>
        ))}
      </div>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {tipSections.map(section => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          
          return (
            <div 
              key={section.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-800">{section.title}</h3>
                    <p className="text-sm text-slate-700">{section.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div className="grid md:grid-cols-2 gap-6 pt-6">
                    {/* Do's */}
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-green-700 mb-4">
                        <CheckCircle2 className="w-5 h-5" />
                        Gör så här
                      </h4>
                      <ul className="space-y-3">
                        {section.tips.do.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              ✓
                            </span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Don'ts */}
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-red-700 mb-4">
                        <XCircle className="w-5 h-5" />
                        Undvik detta
                      </h4>
                      <ul className="space-y-3">
                        {section.tips.dont.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              ✕
                            </span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Common Mistakes */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-3">Vanliga misstag att undvika</h3>
            <ul className="space-y-2 text-amber-800 text-sm">
              <li>• <strong>Stavfel och grammatik</strong> - Läs igenom flera gånger eller be någon annan kolla</li>
              <li>• <strong>För generiskt</strong> - "Jag är en positiv person" säger ingenting. Ge exempel!</li>
              <li>• <strong>För långt</strong> - Ingen orkar läsa 4 sidor. Prioritera det viktigaste.</li>
              <li>• <strong>Oprofessionell e-post</strong> - Skaffa en ny e-post om din nuvarande är "partyqueen95"</li>
              <li>• <strong>Saknar nyckelord</strong> - Läs jobbannonsen och använd samma ord de använder</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
        <div>
          <h3 className="font-semibold text-slate-800">Redo att skapa ditt CV?</h3>
          <p className="text-slate-600 text-sm">Använd vår CV-byggare med inbyggda tips</p>
        </div>
        <a
          href="/cv"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <FileText className="w-5 h-5" />
          Skapa CV nu
        </a>
      </div>

      {/* Additional Resources */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Video className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-slate-800">Video-guider</h4>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Se våra video-tutorials om hur du skriver ett vinnande CV
          </p>
          <button className="text-indigo-600 text-sm font-medium hover:underline">
            Kommer snart →
          </button>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-slate-800">ATS-optimering</h4>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Testa hur väl ditt CV klarar rekryteringssystem
          </p>
          <a 
            href="/cv/ats"
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            Gå till ATS-analys →
          </a>
        </div>
      </div>
    </div>
  )
}

export default CVTips
