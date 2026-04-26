/**
 * BottomBar Component - FAQ section for each page
 * Clean pastel design with collapsible FAQ items
 * Shows contextual help based on current route
 */

import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, HelpCircle, MessageCircle } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface PageFAQ {
  title: string
  items: FAQItem[]
}

// FAQ content for each page/route
const pageFAQs: Record<string, PageFAQ> = {
  '/': {
    title: 'Vanliga frågor om Översikten',
    items: [
      { question: 'Vad är "Kom igång"-stegen?', answer: 'Det är en guide som hjälper dig att komma igång med de viktigaste funktionerna. Följ stegen i ordning för bästa resultat.' },
      { question: 'Hur uppdateras min framgång?', answer: 'Din framgång uppdateras automatiskt när du slutför varje steg, till exempel skapar CV eller sparar ett jobb.' },
      { question: 'Kan jag hoppa över steg?', answer: 'Ja, du kan klicka på vilket steg som helst för att börja där. Men vi rekommenderar att följa ordningen för bästa upplevelse.' },
    ]
  },
  '/cv': {
    title: 'Vanliga frågor om CV-byggaren',
    items: [
      { question: 'Hur sparas mitt CV?', answer: 'Ditt CV sparas automatiskt medan du skriver. Du ser en bekräftelse i hörnet när det sparas.' },
      { question: 'Kan jag exportera mitt CV?', answer: 'Ja, klicka på "Exportera" för att ladda ner ditt CV som PDF. Du kan också dela det direkt med arbetsgivare.' },
      { question: 'Vad är AI-hjälpen?', answer: 'AI-hjälpen kan föreslå förbättringar, hjälpa dig formulera meningar och optimera ditt CV för specifika jobb.' },
      { question: 'Kan jag ha flera CV:n?', answer: 'Ja, du kan skapa flera versioner av ditt CV anpassade för olika typer av jobb.' },
    ]
  },
  '/job-search': {
    title: 'Vanliga frågor om Jobbsökning',
    items: [
      { question: 'Varifrån kommer jobben?', answer: 'Vi hämtar jobb från Platsbanken och andra källor. Jobben uppdateras dagligen.' },
      { question: 'Hur sparar jag ett jobb?', answer: 'Klicka på bokmärkes-ikonen på jobbannonsen för att spara det till din lista.' },
      { question: 'Vad betyder matchningen?', answer: 'Matchningen visar hur väl jobbet passar din profil och dina intressen baserat på din intresseguide.' },
      { question: 'Kan jag söka jobb med mitt CV?', answer: 'Ja, när du ansöker kan du bifoga ditt CV direkt från jobin.se.' },
    ]
  },
  '/cover-letter': {
    title: 'Vanliga frågor om Personligt brev',
    items: [
      { question: 'Hur fungerar AI-genereringen?', answer: 'AI:n använder information från ditt CV och jobbannonsen för att skapa ett personligt brev. Du kan sedan redigera det.' },
      { question: 'Kan jag spara flera brev?', answer: 'Ja, varje brev sparas separat så du kan ha anpassade brev för olika jobb.' },
      { question: 'Hur lång tid tar det?', answer: 'AI:n genererar ett förslag på några sekunder. Sedan kan du redigera och anpassa det efter behov.' },
    ]
  },
  '/interest-guide': {
    title: 'Vanliga frågor om Intresseguiden',
    items: [
      { question: 'Vad mäter testet?', answer: 'Testet mäter dina intressen enligt RIASEC-modellen för att hitta yrken som passar din personlighet.' },
      { question: 'Hur lång tid tar det?', answer: 'Testet tar cirka 5-10 minuter att genomföra.' },
      { question: 'Kan jag göra om testet?', answer: 'Ja, du kan göra om testet när som helst för att uppdatera dina resultat.' },
      { question: 'Vad händer med resultatet?', answer: 'Ditt resultat sparas och används för att ge dig bättre jobbmatchningar och rekommendationer.' },
    ]
  },
  '/profile': {
    title: 'Vanliga frågor om Min profil',
    items: [
      { question: 'Vilken information behövs?', answer: 'Grundläggande kontaktuppgifter räcker för att komma igång. Ju mer du fyller i, desto bättre matchningar får du.' },
      { question: 'Är min information säker?', answer: 'Ja, all din information lagras säkert och delas endast med din arbetskonsulent om du godkänner det.' },
      { question: 'Kan jag ta bort min profil?', answer: 'Ja, gå till Inställningar för att radera ditt konto och all din data.' },
    ]
  },
  '/wellness': {
    title: 'Vanliga frågor om Välmående',
    items: [
      { question: 'Vad är måendeloggningen?', answer: 'Det är ett verktyg för att följa hur du mår över tid. Det hjälper dig och din konsulent att anpassa stödet.' },
      { question: 'Vem kan se min logg?', answer: 'Endast du kan se dina loggningar, om du inte väljer att dela dem med din arbetskonsulent.' },
      { question: 'Hur ofta ska jag logga?', answer: 'Vi rekommenderar daglig loggning, men det är helt upp till dig.' },
    ]
  },
  '/applications': {
    title: 'Vanliga frågor om Ansökningar',
    items: [
      { question: 'Hur spårar jag mina ansökningar?', answer: 'Alla jobb du ansöker till via jobin.se läggs automatiskt till här. Du kan även lägga till ansökningar manuellt.' },
      { question: 'Vad betyder statusarna?', answer: 'Statusarna visar var i processen du är: Skickad, Under granskning, Intervju, Erbjudande eller Avslutad.' },
      { question: 'Kan jag sätta påminnelser?', answer: 'Ja, du kan lägga till uppföljningsdatum och få påminnelser om att följa upp dina ansökningar.' },
    ]
  },
  '/diary': {
    title: 'Vanliga frågor om Dagboken',
    items: [
      { question: 'Vad kan jag skriva i dagboken?', answer: 'Du kan skriva reflektioner, sätta mål, logga aktiviteter och följa ditt jobbsökande över tid.' },
      { question: 'Är dagboken privat?', answer: 'Ja, endast du kan se din dagbok om du inte aktivt väljer att dela den.' },
      { question: 'Kan jag exportera mina anteckningar?', answer: 'Ja, du kan exportera dina dagboksanteckningar som PDF för att spara eller dela.' },
    ]
  },
  '/calendar': {
    title: 'Vanliga frågor om Kalendern',
    items: [
      { question: 'Kan jag synka med min vanliga kalender?', answer: 'Ja, du kan koppla din Google- eller Outlook-kalender för att se alla händelser på ett ställe.' },
      { question: 'Hur lägger jag till en intervju?', answer: 'Klicka på önskat datum och välj "Lägg till händelse". Du kan också göra det direkt från en jobbansökan.' },
      { question: 'Får jag påminnelser?', answer: 'Ja, du får påminnelser via e-post och i appen innan dina bokade möten och intervjuer.' },
    ]
  },
  '/career': {
    title: 'Vanliga frågor om Karriär',
    items: [
      { question: 'Vad är karriärplanen?', answer: 'Det är ett verktyg för att sätta upp långsiktiga mål och planera stegen dit.' },
      { question: 'Hur hittar jag utbildningar?', answer: 'Under Utbildning kan du söka kurser och program som passar dina karriärmål.' },
      { question: 'Vad är kompetensanalysen?', answer: 'Den jämför dina nuvarande kompetenser med vad som krävs för ditt drömjobb och visar vad du kan utveckla.' },
    ]
  },
}

// Default FAQ for pages without specific content
const defaultFAQ: PageFAQ = {
  title: 'Vanliga frågor',
  items: [
    { question: 'Behöver du hjälp?', answer: 'Kontakta din arbetskonsulent eller besök vår hjälpsida för mer information.' },
    { question: 'Hur kontaktar jag support?', answer: 'Gå till Hjälp i menyn eller kontakta din arbetskonsulent direkt.' },
    { question: 'Var hittar jag inställningar?', answer: 'Klicka på din profil längst upp till höger och välj Inställningar.' },
  ]
}

function FAQItemComponent({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-stone-100 dark:border-stone-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset rounded"
      >
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300 pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-stone-400 transition-transform shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-3 pr-8">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  )
}

export function BottomBar() {
  const location = useLocation()
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [openItems, setOpenItems] = useState<number[]>([])

  // Get FAQ for current page or use default
  const currentPath = location.pathname
  const faq = pageFAQs[currentPath] || defaultFAQ

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset"
      >
        <HelpCircle className="w-4 h-4" />
        <span>{faq.title}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* FAQ content */}
      {isExpanded && (
        <div className="px-4 pb-4 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4">
            {faq.items.map((item, index) => (
              <FAQItemComponent
                key={index}
                item={item}
                isOpen={openItems.includes(index)}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </div>

          {/* Contact support link */}
          <div className="mt-4 text-center">
            <Link
              to="/help"
              className="inline-flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <MessageCircle className="w-4 h-4" />
              Behöver du mer hjälp? Besök vår hjälpsida
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default BottomBar
