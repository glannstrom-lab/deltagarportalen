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
  ChevronUp,
  Users,
  Star,
  TrendingUp,
  Award,
  Sparkles,
  Play,
  Zap,
  Target,
  ChevronRight,
  Mail,
  MapPin,
  Phone
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// FAQ Item Component
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <div className={`bg-white rounded-2xl mb-4 overflow-hidden shadow-lg transition-all duration-300 ${isOpen ? 'ring-2 ring-indigo-200 shadow-xl' : 'hover:shadow-md'}`}>
      <button
        onClick={onClick}
        className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-50 transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-800 pr-4 group-hover:text-indigo-600 transition-colors">{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-100 rotate-180' : 'bg-slate-100'}`}>
          <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
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
    <div className={`bg-white rounded-2xl p-6 lg:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100 hover:-translate-y-2 hover:border-indigo-100 group ${large ? 'md:row-span-2' : ''}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-slate-600 mb-5 leading-relaxed">{description}</p>
      {features && (
        <ul className="space-y-3">
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
    <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 text-center border border-slate-100 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 group">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
        {number}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
      {showArrow && (
        <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-indigo-300">
          <ArrowRight className="w-8 h-8" />
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
    <div className={`${gradient} rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-white text-white" />
        ))}
      </div>
      <blockquote className="text-lg leading-relaxed mb-6 italic opacity-95">
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

// Stats Card Component
function StatsCard({ value, label, icon: Icon, suffix = '' }: {
  value: number
  label: string
  icon: React.ElementType
  suffix?: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, hasAnimated])

  return (
    <div ref={ref} className="text-center">
      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
        {count.toLocaleString('sv-SE')}{suffix}
      </div>
      <div className="text-white/80">{label}</div>
    </div>
  )
}

export default function Landing() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/jobin-logo.png" 
                alt="Jobin" 
                className="w-10 h-10 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow object-contain bg-white"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">Jobin</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#funktioner" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Funktioner
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#hur-det-funkar" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Så funkar det
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
              </a>
              <a href="#faq" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors relative group">
                Vanliga frågor
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
              </a>
              <Link 
                to="/login" 
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
              >
                Logga in
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Kom igång
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Öppna meny"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="py-4 border-t border-slate-100 space-y-2">
              <a href="#funktioner" className="block text-slate-600 hover:text-indigo-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Funktioner</a>
              <a href="#hur-det-funkar" className="block text-slate-600 hover:text-indigo-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Så funkar det</a>
              <a href="#faq" className="block text-slate-600 hover:text-indigo-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>Vanliga frågor</a>
              <div className="pt-2 flex flex-col gap-2">
                <Link 
                  to="/login" 
                  className="text-slate-600 hover:text-indigo-600 font-medium py-2 px-2 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Logga in
                </Link>
                <Link 
                  to="/register" 
                  className="bg-teal-500 text-white px-5 py-3 rounded-xl font-semibold text-center hover:bg-teal-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Kom igång gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-200 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] bg-teal-200 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-teal-200">
                <Sparkles className="w-4 h-4" />
                Nytt: AI-stödd CV-generator
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                Din väg till{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">jobbet</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8C50 2 150 2 198 8" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </span>
                {' '}börjar här
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Oavsett om du sökt jobb länge eller står inför en ny karriär, finns verktygen som hjälper dig framåt. Med personlig vägledning, smarta verktyg och stöd hela vägen behöver du inte gå den här resan ensam.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link 
                  to="/register"
                  className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  Kom igång gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#funktioner"
                  className="group bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-300 px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center justify-center transition-all hover:shadow-lg hover:bg-indigo-50"
                >
                  <Play className="w-5 h-5 mr-2 fill-indigo-600" />
                  Se hur det fungerar
                </a>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  Helt gratis
                </span>
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Shield className="w-5 h-5 text-green-500" />
                  Säker och trygg
                </span>
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Clock className="w-5 h-5 text-green-500" />
                  Kom igång på 2 minuter
                </span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-3xl shadow-2xl p-6 relative z-10 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium">Din översikt</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-lg mb-3">📝</div>
                    <p className="text-xs text-slate-500 mb-1">CV-progress</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">85%</p>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border border-slate-100">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-lg mb-3">💡</div>
                    <p className="text-xs text-slate-500 mb-1">Intresseguide</p>
                    <p className="font-semibold text-slate-800">Social (S)</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-slate-100">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg mb-3">💼</div>
                    <p className="text-xs text-slate-500 mb-1">Sparade jobb</p>
                    <p className="font-semibold text-slate-800">12 annonser</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-slate-100">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-lg mb-3">🎯</div>
                    <p className="text-xs text-slate-500 mb-1">Intervjuer</p>
                    <p className="font-semibold text-slate-800">2 denna vecka</p>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl border border-slate-100 animate-pulse">
                <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <span>🎉</span>
                  CV godkänt av ATS!
                </span>
              </div>
              <div className="absolute bottom-8 -left-8 bg-white rounded-xl p-4 shadow-xl border border-slate-100">
                <span className="flex items-center gap-2 text-sm font-medium text-indigo-600">
                  <span>⭐</span>
                  3 nya jobbmatchningar
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <StatsCard value={12450} label="arbetssökande har fått hjälp" icon={Users} suffix="+" />
            <StatsCard value={89} label="hittar jobb inom 6 månader" icon={TrendingUp} suffix="%" />
            <StatsCard value={156000} label="aktiva jobbannonser" icon={Briefcase} suffix="+" />
            <StatsCard value={48} label="omdöme från användare" icon={Star} suffix="/5" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-wider mb-6 font-medium">
            Samarbetar med
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <span className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors">
              <Briefcase className="w-6 h-6" />
              <span className="font-semibold">Arbetsförmedlingen</span>
            </span>
            <span className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors">
              <FileText className="w-6 h-6" />
              <span className="font-semibold">Platsbanken</span>
            </span>
            <span className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors">
              <Check className="w-6 h-6" />
              <span className="font-semibold">Sveriges kommuner</span>
            </span>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="hur-det-funkar" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Processen</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Så här fungerar det</h2>
            <p className="text-slate-600 text-lg">Tre enkla steg på din väg till nytt jobb. Vi guidar dig genom varje del.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
      <section id="funktioner" className="py-20 lg:py-28 bg-gradient-to-b from-white via-indigo-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Funktioner</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Allt du behöver i en plattform</h2>
            <p className="text-slate-600 text-lg">Från att upptäcka vad du vill göra till att landa drömjobbet – vi har verktygen som hjälper dig.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
            <FeatureCard 
              icon={Zap}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              title="Karriärcoachen"
              description="Få personliga råd om löneutveckling, kompetensutveckling och hur du navigerar din karriär framåt."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Omdömen</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Det här säger våra användare</h2>
            <p className="text-slate-600 text-lg">Verkliga historier från människor som hittat sin väg tillbaka till arbetslivet.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((t, idx) => (
              <TestimonialCard key={idx} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Vanliga frågor</h2>
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

      {/* Contact Section */}
      <section id="kontakt" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">Kontakt</span>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Vi finns här för dig</h2>
                <p className="text-slate-600 text-lg mb-8">
                  Har du frågor eller behöver hjälp? Tveka inte att kontakta oss. Vi svarar vanligtvis inom 24 timmar.
                </p>
                <div className="space-y-4">
                  <a href="mailto:support@jobin.se" className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Mail className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">E-post</p>
                      <p className="text-slate-600">support@jobin.se</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Öppettider</p>
                      <p className="text-slate-600">Måndag - Fredag, 08:00 - 17:00</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="inline-block bg-white rounded-2xl p-8 shadow-lg">
                  <Target className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Redo att börja?</h3>
                  <p className="text-slate-600 mb-6">Skapa ett konto och kom igång på bara några minuter.</p>
                  <Link 
                    to="/register"
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Skapa konto gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 tracking-tight">Redo att hitta ditt jobb?</h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Din nya start är bara några klick bort. Oavsett var du är i livet just nu, finns det en väg framåt. Ta det första steget idag – vi är med dig hela vägen.
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-slate-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            Skapa gratis konto
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/70 text-sm mt-6">
            Inga kortuppgifter krävs. Ingen bindningstid. Bara möjligheter.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <span className="text-white font-bold text-xl">Jobin</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Jobin är en gratis plattform för arbetssökande. Vi tror att alla förtjänar en ärlig chans på arbetsmarknaden.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              </div>
            </div>
            
            {/* Funktioner */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Funktioner</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    CV-generator
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Intresseguide
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Jobbsök
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Intervjuträning
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Om Jobin */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Om Jobin</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Om oss
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@jobin.se" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Kontakt
                  </a>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Integritetspolicy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Användarvillkor
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Hjälp */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Hjälp</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:support@jobin.se" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Support
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    FAQ
                  </a>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Guider
                  </Link>
                </li>
              </ul>
            </div>

            {/* Logga in */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Konto</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Logga in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Skapa konto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2026 Jobin. Alla rättigheter förbehållna.</p>
            <p className="flex items-center gap-2">
              Skapad med 
              <Heart className="w-4 h-4 text-red-500 fill-red-500" /> 
              för arbetssökande i Sverige
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
