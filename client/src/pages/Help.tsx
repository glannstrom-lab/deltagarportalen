import { Link } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { 
  HelpCircle, 
  BookOpen, 
  Mail, 
  MessageCircle,
  ChevronRight,
  Search,
  FileText,
  Briefcase,
  Target,
  Compass
} from 'lucide-react'

const faqCategories = [
  {
    title: 'Komma igång',
    icon: BookOpen,
    items: [
      { q: 'Hur skapar jag ett CV?', a: 'Gå till CV-sektionen och följ steg-för-steg-guiden. Du kan välja mellan olika mallar och få AI-hjälp med formuleringarna.', link: '/cv' },
      { q: 'Vad är Intresseguiden?', a: 'Intresseguiden hjälper dig att hitta yrken som passar din personlighet och dina intressen. Det tar ca 10 minuter att slutföra.', link: '/interest-guide' },
      { q: 'Hur sparar jag jobb?', a: 'När du söker jobb kan du klicka på hjärtat/spara-knappen på varje jobbannons för att spara den till din jobbtracker.', link: '/job-search' },
    ]
  },
  {
    title: 'CV & Personligt brev',
    icon: FileText,
    items: [
      { q: 'Kan jag ha flera CV-versioner?', a: 'Ja! Du kan spara flera versioner av ditt CV och välja vilken du vill använda för varje ansökan.', link: '/cv' },
      { q: 'Hur fungerar AI-brevskrivaren?', a: 'AI:n analyserar jobbannonsen och ditt CV för att skriva ett personligt brev som matchar just det jobbet.', link: '/cover-letter' },
      { q: 'Vad är ATS-analys?', a: 'ATS (Applicant Tracking System) är system som många företag använder för att filtrera CV:n. Vår analys hjälper dig att optimera ditt CV så det kommer förbi dessa system.', link: '/cv' },
    ]
  },
  {
    title: 'Jobbsökning',
    icon: Briefcase,
    items: [
      { q: 'Hur söker jag jobb via portalen?', a: 'Använd jobbsöksfunktionen för att söka bland lediga jobb. Du kan filtrera på plats, yrke och anställningstyp.', link: '/job-search' },
      { q: 'Vad är skillnaden mellan att spara och ansöka?', a: 'När du sparar ett jobb läggs det i din jobbtracker så du kan återkomma till det senare. Ansökan gör du vanligtvis via företagets hemsida.', link: '/job-search' },
      { q: 'Kan jag få notiser om nya jobb?', a: 'Ja, du kan ställa in jobbaviseringar i dina inställningar för att få mail när nya jobb som matchar dina kriterier publiceras.', link: '/settings' },
    ]
  },
  {
    title: 'Karriär & Utveckling',
    icon: Target,
    items: [
      { q: 'Vad kan jag göra i Kunskapsbanken?', a: 'Kunskapsbanken innehåller artiklar, guider och tips om allt från CV-skrivning till intervjuteknik och arbetsrätt.', link: '/knowledge-base' },
      { q: 'Hur fungerar Övningarna?', a: 'Övningarna är interaktiva verktyg som hjälper dig att träna på olika aspekter av jobbsökning, som att sälja in dig själv eller förbereda dig för intervju.', link: '/exercises' },
      { q: 'Kan jag spara artiklar?', a: 'Ja! Klicka på bokmärkes-ikonen på valfri artikel för att spara den till dina bokmärken.', link: '/resources' },
    ]
  },
]

const quickLinks = [
  { title: 'Kunskapsbanken', desc: 'Artiklar och guider', icon: BookOpen, link: '/dashboard/knowledge-base' },
  { title: 'Intresseguiden', desc: 'Hitta rätt yrke', icon: Compass, link: '/dashboard/interest-guide' },
  { title: 'Skapa CV', desc: 'Bygg ditt CV', icon: FileText, link: '/cv' },
  { title: 'Sök jobb', desc: 'Hitta lediga jobb', icon: Briefcase, link: '/job-search' },
]

export default function Help() {
  return (
    <PageLayout
      title="Hjälp & Support"
      description="Få hjälp med att använda Jobin"
      showTabs={false}
    >
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-violet-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Hjälp & Support</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          Hitta svar på vanliga frågor eller kontakta oss om du behöver mer hjälp.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.title}
              to={item.link}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-violet-200 transition-all text-center"
            >
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-medium text-slate-800 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </Link>
          )
        })}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {faqCategories.map((category) => {
          const Icon = category.icon
          return (
            <section key={category.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <Icon className="w-5 h-5 text-violet-600" />
                <h2 className="font-semibold text-slate-800">{category.title}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {category.items.map((item, index) => (
                  <div key={index} className="p-6">
                    <h3 className="font-medium text-slate-800 mb-2">{item.q}</h3>
                    <p className="text-slate-600 text-sm mb-3">{item.a}</p>
                    {item.link && (
                      <Link 
                        to={item.link}
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
                      >
                        Gå till {category.title.toLowerCase()}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Contact Section */}
      <section className="mt-10 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Hittade du inte svaret?
            </h2>
            <p className="text-slate-600 mb-4">
              Kontakta din arbetskonsulent för personlig hjälp och vägledning.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                to="/diary"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Boka möte
              </Link>
              <a
                href="mailto:support@jobin.se"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Mejla support
              </a>
            </div>
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <MessageCircle className="w-8 h-8 text-violet-600" />
          </div>
        </div>
      </section>

      {/* Version Info */}
      <div className="mt-10 text-center text-sm text-slate-400">
        <p>Deltagarportalen v2.0</p>
      </div>
    </div>
    </PageLayout>
  )
}
