import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { 
  Check, 
  Shield, 
  Clock, 
  ArrowRight, 
  FileText, 
  Lightbulb, 
  Briefcase, 
  Mic, 
  Heart,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'

// FAQ Item Component
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <div className={`bg-white rounded-xl mb-4 overflow-hidden shadow-sm ${isOpen ? 'ring-2 ring-indigo-100' : ''}`}>
      <button
        onClick={onClick}
        className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-800 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <p className="px-6 pb-5 text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  iconBg, 
  iconColor,
  title, 
  description, 
  features,
  large = false 
}: { 
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
  features?: string[]
  large?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100 hover:-translate-y-1 ${large ? 'row-span-2' : ''}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 mb-4 leading-relaxed">{description}</p>
      {features && (
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-slate-600 text-sm">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Step Card Component
function StepCard({ number, title, description, showArrow }: {
  number: number
  title: string
  description: string
  showArrow?: boolean
}) {
  return (
    <div className="relative bg-slate-50 rounded-2xl p-8 text-center border border-slate-100 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
      {showArrow && (
        <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-slate-300 text-2xl">
          →
        </div>
      )}
    </div>
  )
}

// Testimonial Card Component
function TestimonialCard({ quote, name, role, gradient }: {
  quote: string
  name: string
  role: string
  gradient: string
}) {
  return (
    <div className={`${gradient} rounded-2xl p-6 text-white`}>
      <blockquote className="text-lg leading-relaxed mb-5 italic opacity-95">
        "{quote}"
      </blockquote>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl">
          👤
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-white/80 text-sm">{role}</p>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const faqs = [
    {
      question: "Kostar det verkligen ingenting?",
      answer: "Ja, Jobin är helt gratis för dig som söker jobb. Inga dolda avgifter, inga premiumnivåer – alla funktioner är tillgängliga för alla. Detta är möjligt tack vare samarbete med Arbetsförmedlingen och kommuner."
    },
    {
      question: "Jag har sökt jobb länge utan resultat. Kan Jobin verkligen hjälpa mig?",
      answer: "Absolut. Många av våra användare har varit långtidsarbetslösa och har med hjälp av våra strukturerade verktyg och personliga vägledning tagit sig tillbaka till arbete. Du är inte ensam, och det finns vägar framåt. Verktygen är speciellt utformade för att ge stöd även när det känns tufft."
    },
    {
      question: "Jag vet inte ens vad jag vill jobba med. Var ska jag börja?",
      answer: "Börja med vår intresseguide! Den hjälper dig utforska dina styrkor och intressen, och ger förslag på yrken som kan passa dig. Ingen press – bara upptäckande. Många användare har upptäckt nya karriärvägar de aldrig tänkt på tidigare."
    },
    {
      question: "Är mina personuppgifter säkra?",
      answer: "Ja, vi tar din integritet på största allvar. Dina uppgifter sparas säkert med modern kryptering och delas aldrig med tredje part utan ditt samtycke. Du äger alltid dina data och kan när som helst ta bort ditt konto. Vi följer GDPR och har tydliga rutiner för datasäkerhet."
    }
  ]

  const testimonials = [
    {
      quote: "Efter 8 månaders sökande fick jag äntligen struktur på mitt CV. Två veckor senare hade jag mitt första intervju på länge.",
      name: "Anna, 34",
      role: "Hittade jobb som kundtjänstmedarbetare",
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600"
    },
    {
      quote: "Personlighetstestet gav mig ord på saker jag alltid känt men inte kunnat formulera. Det öppnade helt nya dörrar för mig.",
      name: "Marcus, 41",
      role: "Bytte karriär till UX-design",
      gradient: "bg-gradient-to-br from-teal-500 to-teal-600"
    },
    {
      quote: "Som arbetskonsulent använder jag Jobin dagligen med mina deltagare. Det sparar tid och ger dem verktyg de faktiskt kan använda själva.",
      name: "Sofia",
      role: "Arbetskonsulent i Stockholm",
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      quote: "Jag trodde aldrig jag skulle våga gå på intervju igen. Intervjuträningen gav mig modet att faktiskt söka det där jobbet.",
      name: "Erik, 52",
      role: "Tillbaka i arbete efter sjukskrivning",
      gradient: "bg-gradient-to-br from-pink-500 to-pink-600"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                J
              </div>
              <span className="text-xl font-bold text-indigo-600">Jobin</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#funktioner" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Funktioner</a>
              <a href="#hur-det-funkar" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Så funkar det</a>
              <a href="#faq" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Vanliga frågor</a>
              <Link 
                to="/login" 
                className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Logga in
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Öppna meny"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100">
              <div className="flex flex-col gap-4">
                <a href="#funktioner" className="text-slate-600 hover:text-indigo-600 font-medium py-2">Funktioner</a>
                <a href="#hur-det-funkar" className="text-slate-600 hover:text-indigo-600 font-medium py-2">Så funkar det</a>
                <a href="#faq" className="text-slate-600 hover:text-indigo-600 font-medium py-2">Vanliga frågor</a>
                <Link 
                  to="/login" 
                  className="bg-teal-500 text-white px-5 py-2.5 rounded-xl font-semibold text-center"
                >
                  Logga in
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{ background: 'linear-gradient(180deg, #eef2ff 0%, white 100%)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-3/4 h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-200 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span>✨</span>
                Nytt: AI-stödd CV-generator
              </span>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-indigo-600 mb-6 leading-tight">
                Din väg till <span className="text-orange-500">jobbet</span> börjar här
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Oavsett om du sökt jobb länge eller står inför en ny karriär, finns verktygen som hjälper dig framåt. Med personlig vägledning, smarta verktyg och stöd hela vägen behöver du inte gå den här resan ensam.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link 
                  to="/register"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Kom igång gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#funktioner"
                  className="bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-200 px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center justify-center transition-all hover:shadow-md"
                >
                  Se hur det fungerar
                </a>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Helt gratis
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  Säker och trygg
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Kom igång på 2 minuter
                </span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-2xl shadow-card-hover p-6 relative z-10">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Din översikt</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-lg mb-3">📝</div>
                    <p className="text-xs text-slate-500 mb-1">CV-progress</p>
                    <p className="font-semibold text-slate-800">85% klart</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg mb-3">💡</div>
                    <p className="text-xs text-slate-500 mb-1">Intresseguide</p>
                    <p className="font-semibold text-slate-800">Social (S)</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-lg mb-3">💼</div>
                    <p className="text-xs text-slate-500 mb-1">Sparade jobb</p>
                    <p className="font-semibold text-slate-800">12 annonser</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-lg mb-3">🎯</div>
                    <p className="text-xs text-slate-500 mb-1">Intervjuer</p>
                    <p className="font-semibold text-slate-800">2 denna vecka</p>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg animate-pulse">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span>🎉</span>
                  CV godkänt av ATS!
                </span>
              </div>
              <div className="absolute bottom-8 -left-6 bg-white rounded-xl p-3 shadow-lg">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span>⭐</span>
                  3 nya jobbmatchningar
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-y border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 mb-4">
            <span className="text-indigo-600 font-bold">10 000+</span> arbetssökande har fått hjälp att hitta rätt
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-50">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Briefcase className="w-5 h-5" />
              Arbetsförmedlingen
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <FileText className="w-5 h-5" />
              Platsbanken
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Check className="w-5 h-5" />
              Sveriges kommuner
            </span>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="hur-det-funkar" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-4">Så här fungerar det</h2>
            <p className="text-slate-600 text-lg">Tre enkla steg på din väg till nytt jobb. Vi guidar dig genom varje del.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard 
              number={1}
              title="Upptäck dina styrkor"
              description="Gör vår intresseguide och förstå vad du är bra på. Få förslag på yrken som passar just dig."
              showArrow
            />
            <StepCard 
              number={2}
              title="Skapa ditt CV"
              description="Använd vår AI-stödda CV-generator. Optimera för ATS, importera från LinkedIn, exportera som PDF."
              showArrow
            />
            <StepCard 
              number={3}
              title="Hitta och sök jobb"
              description="Sök bland tusentals jobb, förbered dig med intervjuträningen och håll koll på dina ansökningar."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funktioner" className="py-20" style={{ background: 'linear-gradient(180deg, white 0%, #eef2ff 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-4">Allt du behöver i en plattform</h2>
            <p className="text-slate-600 text-lg">Från att upptäcka vad du vill göra till att landa drömjobbet – vi har verktygen som hjälper dig.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={FileText}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              title="CV som faktiskt blir läst"
              description="Skapa ett professionellt CV med hjälp av AI – optimerat för både rekryterare och datorer. Importera från LinkedIn, få feedback direkt och exportera som PDF när du är nöjd."
              features={[
                "AI-skrivhjälp för varje sektion",
                "ATS-kompatibilitetsanalys",
                "LinkedIn-import",
                "Professionella PDF-mallar",
                "Dela med arbetskonsulent"
              ]}
              large
            />
            <FeatureCard 
              icon={Lightbulb}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
              title="Upptäck vad du är bra på"
              description="Vårt personlighetstest hjälper dig förstå dina styrkor och intressen. Få förslag på yrken som passar just dig."
            />
            <FeatureCard 
              icon={Briefcase}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              title="Fler jobb, mindre letande"
              description="Sök bland tusentals jobb från hela Sverige med smarta filter. Se direkt på kartan var jobben finns."
            />
            <FeatureCard 
              icon={Mic}
              iconBg="bg-pink-100"
              iconColor="text-pink-600"
              title="Förbered dig inför intervjun"
              description="Öva med vår intervjutränerare, lär dig STAR-metoden och gå in på intervjun med självförtroende."
            />
            <FeatureCard 
              icon={Heart}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              title="Må bra under tiden"
              description="Din välmående är viktigast. Med dagbok, reflektionsövningar och stödjande verktyg håller du balansen."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-4">Det här säger våra användare</h2>
            <p className="text-slate-600 text-lg">Verkliga historier från människor som hittat sin väg tillbaka till arbetslivet.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, idx) => (
              <TestimonialCard key={idx} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-4">Vanliga frågor</h2>
            <p className="text-slate-600 text-lg">Det du kanske undrar över innan du kommer igång.</p>
          </div>
          
          <div>
            {faqs.map((faq, idx) => (
              <FAQItem 
                key={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === idx}
                onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-700 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Redo att hitta ditt jobb?</h2>
          <p className="text-white/90 text-lg mb-8">
            Din nya start är bara några klick bort. Oavsett var du är i livet just nu, finns det en väg framåt. Ta det första steget idag – vi är med dig hela vägen.
          </p>
          <Link 
            to="/register"
            className="bg-white text-indigo-600 hover:bg-slate-50 px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            Skapa gratis konto
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/70 text-sm mt-4">
            Inga kortuppgifter krävs. Ingen bindningstid. Bara möjligheter.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  J
                </div>
                <span className="text-white font-bold text-lg">Jobin</span>
              </div>
              <p className="text-sm leading-relaxed">
                Jobin är en gratis plattform för arbetssökande. Vi tror att alla förtjänar en ärlig chans på arbetsmarknaden.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Funktioner</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">CV-generator</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Intresseguide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Jobbsök</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Intervjuträning</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Om Jobin</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Om oss</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integritetspolicy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Användarvillkor</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Hjälp</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guider</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Logga in</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2026 Jobin. Alla rättigheter förvarade.</p>
            <p>Skapad med 💜 för arbetssökande i Sverige</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
