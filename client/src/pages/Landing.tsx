import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Sparkles,
  Play,
  Zap,
  Target,
  ChevronRight,
  Mail,
  BarChart3,
  Search,
  BookOpen,
  Star,
  User,
  MapPin,
  Building2,
  Users,
  UserCheck
} from '@/components/ui/icons'
import { useState, useEffect } from 'react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

// FAQ Item Component
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void 
}) {
  return (
    <div className={`bg-white rounded-2xl mb-4 overflow-hidden shadow-lg transition-all duration-300 ${isOpen ? 'ring-2 ring-violet-200 shadow-xl' : 'hover:shadow-md'}`}>
      <button
        onClick={onClick}
        className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-50 transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-slate-800 pr-4 group-hover:text-violet-600 transition-colors">{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-violet-100 rotate-180' : 'bg-slate-100'}`}>
          <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-violet-600' : 'text-slate-400'}`} />
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

// Feature Mockup Components
function CVMockup() {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-white rounded-xl p-4 border border-violet-100 shadow-sm">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-violet-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-violet-300 rounded w-3/4" />
          <div className="h-2 bg-violet-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 bg-slate-200 rounded w-full" />
        <div className="h-2 bg-slate-200 rounded w-5/6" />
        <div className="h-2 bg-slate-200 rounded w-4/6" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-violet-600 font-medium">ATS Score:</span>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full animate-pulse" style={{ width: '85%' }} />
        </div>
        <span className="text-xs font-bold text-violet-600">85%</span>
      </div>
    </div>
  )
}

function InterestMockup() {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border border-teal-100 shadow-sm">
      <div className="relative w-24 h-24 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#14b8a6" strokeWidth="8" strokeDasharray="188" strokeDashoffset="50" strokeLinecap="round" className="animate-spin" style={{ animationDuration: '8s' }} />
          <text x="50" y="50" textAnchor="middle" dy="0.35em" className="text-sm font-bold fill-teal-600">RIASEC</text>
        </svg>
      </div>
      <div className="mt-3 flex justify-center gap-1">
        {['R', 'I', 'A', 'S', 'E', 'C'].map((letter, i) => (
          <span key={letter} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${i === 3 ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'}`}>{letter}</span>
        ))}
      </div>
    </div>
  )
}

function JobSearchMockup() {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-orange-400" />
        <div className="flex-1 h-6 bg-white rounded border border-orange-200" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 hover:border-orange-200 transition-colors">
            <div className="w-8 h-8 bg-orange-100 rounded flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-slate-300 rounded w-3/4" />
              <div className="h-1.5 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InterviewMockup() {
  return (
    <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100 shadow-sm">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-pink-200 rounded-full flex-shrink-0" />
          <div className="bg-pink-100 rounded-xl rounded-tl-none px-3 py-2 max-w-[80%]">
            <div className="h-2 bg-pink-300 rounded w-full" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="bg-violet-500 text-white rounded-xl rounded-tr-none px-3 py-2 max-w-[80%]">
            <div className="h-2 bg-white/50 rounded w-full" />
          </div>
          <div className="w-6 h-6 bg-violet-200 rounded-full flex-shrink-0" />
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
          <Mic className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

function WellnessMockup() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <BookOpen className="w-5 h-5 text-green-500" />
        <div className="flex gap-1">
          {['😊', '😐', '😔'].map((emoji, i) => (
            <span key={i} className={`text-lg ${i === 0 ? 'opacity-100' : 'opacity-40'}`}>{emoji}</span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-green-200 rounded w-full" />
        <div className="h-2 bg-green-200 rounded w-5/6" />
        <div className="h-2 bg-green-200 rounded w-3/4" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Heart className="w-4 h-4 text-green-500 fill-green-500" />
        <div className="h-1.5 bg-green-300 rounded-full w-2/3" />
      </div>
    </div>
  )
}

function CoachMockup() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border border-amber-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-amber-500" />
        <span className="text-xs font-medium text-amber-600">Karriärutveckling</span>
      </div>
      <div className="flex items-end gap-1 h-16">
        {[40, 55, 45, 70, 60, 85, 75].map((height, i) => (
          <div key={i} className="flex-1 bg-gradient-to-t from-amber-400 to-amber-300 rounded-t transition-all hover:from-amber-500 hover:to-amber-400" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-amber-600">
        <span>Jan</span>
        <span className="font-medium">+35%</span>
      </div>
    </div>
  )
}

// Feature Card Component with Mockup
function FeatureCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  features,
  mockup,
  large = false
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
  features?: string[]
  mockup?: React.ReactNode
  large?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-6 lg:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-slate-100 hover:-translate-y-2 hover:border-violet-100 group ${large ? 'md:row-span-2' : ''}`}>
      {mockup && (
        <div className="mb-5">
          {mockup}
        </div>
      )}
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-violet-600 transition-colors">{title}</h3>
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

// Step Illustration Components
function Step1Illustration() {
  return (
    <div className="relative w-full h-32 mb-4">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
            <Lightbulb className="w-10 h-10 text-teal-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="absolute -bottom-1 -left-3 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center animate-pulse">
            <Star className="w-3 h-3 text-violet-500 fill-violet-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Step2Illustration() {
  return (
    <div className="relative w-full h-32 mb-4">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-28 bg-white rounded-lg shadow-md border border-slate-200 p-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-violet-100 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-1.5 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-slate-100 rounded w-full" />
              <div className="h-1 bg-slate-100 rounded w-5/6" />
              <div className="h-1 bg-slate-100 rounded w-4/6" />
            </div>
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg shadow-lg flex items-center justify-center animate-pulse">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Step3Illustration() {
  return (
    <div className="relative w-full h-32 mb-4">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`w-14 h-16 bg-white rounded-lg shadow-sm border border-slate-200 p-1.5 transition-transform ${i === 1 ? 'scale-110 border-orange-300 shadow-md' : ''}`}>
                <div className={`w-full h-4 rounded ${i === 1 ? 'bg-orange-100' : 'bg-slate-100'}`} />
                <div className="mt-1 space-y-0.5">
                  <div className="h-0.5 bg-slate-200 rounded w-full" />
                  <div className="h-0.5 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Card Component with Illustration
function StepCard({ number, title, description, showArrow, illustration }: {
  number: number
  title: string
  description: string
  showArrow?: boolean
  illustration?: React.ReactNode
}) {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 text-center border border-slate-100 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 group">
      {illustration}
      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
        {number}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
      {showArrow && (
        <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-violet-300">
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

export default function Landing() {
  const { t } = useTranslation()
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  const faqs = [
    {
      question: t('landing.faq.q1'),
      answer: t('landing.faq.a1')
    },
    {
      question: t('landing.faq.q2'),
      answer: t('landing.faq.a2')
    },
    {
      question: t('landing.faq.q3'),
      answer: t('landing.faq.a3')
    },
    {
      question: t('landing.faq.q4'),
      answer: t('landing.faq.a4')
    },
    {
      question: t('landing.faq.q5'),
      answer: t('landing.faq.a5')
    },
    {
      question: t('landing.faq.q6'),
      answer: t('landing.faq.a6')
    }
  ]

  const testimonials = [
    {
      quote: t('landing.testimonials.quote1'),
      name: t('landing.testimonials.name1'),
      role: t('landing.testimonials.role1'),
      gradient: "bg-gradient-to-br from-violet-500 to-violet-600"
    },
    {
      quote: t('landing.testimonials.quote2'),
      name: t('landing.testimonials.name2'),
      role: t('landing.testimonials.role2'),
      gradient: "bg-gradient-to-br from-teal-500 to-teal-600"
    },
    {
      quote: t('landing.testimonials.quote3'),
      name: t('landing.testimonials.name3'),
      role: t('landing.testimonials.role3'),
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
    {
      quote: t('landing.testimonials.quote4'),
      name: t('landing.testimonials.name4'),
      role: t('landing.testimonials.role4'),
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
              <OptimizedImage
                src="/logo-icon.png"
                alt=""
                loading="eager"
                className="w-10 h-10 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow object-contain bg-white"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">Jobin</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('funktioner')} className="text-slate-600 hover:text-violet-600 font-medium transition-colors relative group">
                {t('landing.nav.features')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 transition-all duration-300 group-hover:w-full" />
              </button>
              <button onClick={() => scrollToSection('priser')} className="text-slate-600 hover:text-violet-600 font-medium transition-colors relative group">
                {t('landing.nav.pricing')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 transition-all duration-300 group-hover:w-full" />
              </button>
              <button onClick={() => scrollToSection('hur-det-funkar')} className="text-slate-600 hover:text-violet-600 font-medium transition-colors relative group">
                {t('landing.nav.howItWorks')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 transition-all duration-300 group-hover:w-full" />
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-slate-600 hover:text-violet-600 font-medium transition-colors relative group">
                {t('landing.nav.faq')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-violet-600 transition-all duration-300 group-hover:w-full" />
              </button>
              <Link
                to="/login"
                className="text-slate-600 hover:text-violet-600 font-medium transition-colors"
              >
                {t('landing.nav.login')}
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {t('landing.nav.getStarted')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t('landing.nav.openMenu')}
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="py-4 border-t border-slate-100 space-y-2">
              <button onClick={() => scrollToSection('funktioner')} className="block w-full text-left text-slate-600 hover:text-violet-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">{t('landing.nav.features')}</button>
              <button onClick={() => scrollToSection('priser')} className="block w-full text-left text-slate-600 hover:text-violet-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">{t('landing.nav.pricing')}</button>
              <button onClick={() => scrollToSection('hur-det-funkar')} className="block w-full text-left text-slate-600 hover:text-violet-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">{t('landing.nav.howItWorks')}</button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left text-slate-600 hover:text-violet-600 font-medium py-2 px-2 hover:bg-slate-50 rounded-lg transition-colors">{t('landing.nav.faq')}</button>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-violet-600 font-medium py-2 px-2 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-500 text-white px-5 py-3 rounded-xl font-semibold text-center hover:bg-teal-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('landing.nav.getStartedFree')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-teal-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-violet-200 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] bg-teal-200 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-teal-200">
                <Sparkles className="w-4 h-4" />
                {t('landing.hero.badge')}
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                {t('landing.hero.titleStart')}{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">{t('landing.hero.titleHighlight')}</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8C50 2 150 2 198 8" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                </span>
                {' '}{t('landing.hero.titleEnd')}
              </h1>

              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('landing.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link
                  to="/register"
                  className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => scrollToSection('funktioner')}
                  className="group bg-white text-violet-600 border-2 border-violet-100 hover:border-violet-300 px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center justify-center transition-all hover:shadow-lg hover:bg-violet-50"
                >
                  <Play className="w-5 h-5 mr-2 fill-violet-600" />
                  {t('landing.hero.watchVideo')}
                </button>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Check className="w-5 h-5 text-green-500" />
                  {t('landing.hero.free')}
                </span>
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Shield className="w-5 h-5 text-green-500" />
                  {t('landing.hero.secure')}
                </span>
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Clock className="w-5 h-5 text-green-500" />
                  {t('landing.hero.quickStart')}
                </span>
              </div>
            </div>

            {/* Hero Visual - Animated App Preview */}
            <div className="relative hidden lg:block">
              <div className="bg-white rounded-3xl shadow-2xl p-6 relative z-10 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium">{t('landing.hero.yourOverview')}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* CV Progress Card - Animated */}
                  <div className="bg-gradient-to-br from-violet-50 to-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{t('landing.hero.cvProgress')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">85%</p>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Interest Guide Card - With Animation */}
                  <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Lightbulb className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{t('landing.hero.interestGuide')}</p>
                    <div className="flex items-center gap-1">
                      {['R', 'I', 'A', 'S', 'E', 'C'].map((l, i) => (
                        <span key={l} className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition-all ${i === 3 ? 'bg-teal-500 text-white scale-110' : 'bg-teal-100 text-teal-600'}`}>{l}</span>
                      ))}
                    </div>
                  </div>

                  {/* Jobs Card - With Hover Effect */}
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{t('landing.hero.savedJobs')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">12</p>
                      <div className="flex -space-x-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-4 h-4 bg-orange-200 rounded border border-white" />
                        ))}
                        <div className="w-4 h-4 bg-orange-300 rounded border border-white flex items-center justify-center text-[8px] text-orange-700 font-bold">+9</div>
                      </div>
                    </div>
                  </div>

                  {/* Interview Card - With Animation */}
                  <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Mic className="w-5 h-5 text-pink-600" />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{t('landing.hero.interviews')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">2</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`w-1 rounded-full bg-pink-400 animate-[bounce_1s_ease-in-out_infinite]`} style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Activity Indicator */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live-uppdateringar
                    </span>
                    <span>Senast: just nu</span>
                  </div>
                </div>
              </div>

              {/* Floating badges with enhanced animations */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl border border-slate-100 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <Check className="w-4 h-4" />
                  {t('landing.hero.cvApproved')}
                </span>
              </div>
              <div className="absolute bottom-8 -left-8 bg-white rounded-xl p-4 shadow-xl border border-slate-100 animate-pulse">
                <span className="flex items-center gap-2 text-sm font-medium text-violet-600">
                  <Star className="w-4 h-4 fill-violet-600" />
                  {t('landing.hero.newJobMatches')}
                </span>
              </div>
              <div className="absolute top-1/2 -right-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full p-3 shadow-lg animate-pulse">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-wider mb-6 font-medium">
            {t('landing.trust.partnersTitle')}
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <span className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors">
              <Briefcase className="w-6 h-6" />
              <span className="font-semibold">{t('landing.trust.arbetsformedlingen')}</span>
            </span>
            <span className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors">
              <FileText className="w-6 h-6" />
              <span className="font-semibold">{t('landing.trust.platsbanken')}</span>
            </span>
            <span className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors">
              <Check className="w-6 h-6" />
              <span className="font-semibold">{t('landing.trust.municipalities')}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="hur-det-funkar" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.steps.sectionLabel')}</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.steps.title')}</h2>
            <p className="text-slate-600 text-lg">{t('landing.steps.description')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              number={1}
              title={t('landing.steps.step1Title')}
              description={t('landing.steps.step1Description')}
              illustration={<Step1Illustration />}
              showArrow
            />
            <StepCard
              number={2}
              title={t('landing.steps.step2Title')}
              description={t('landing.steps.step2Description')}
              illustration={<Step2Illustration />}
              showArrow
            />
            <StepCard
              number={3}
              title={t('landing.steps.step3Title')}
              description={t('landing.steps.step3Description')}
              illustration={<Step3Illustration />}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funktioner" className="py-20 lg:py-28 bg-gradient-to-b from-white via-violet-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.features.sectionLabel')}</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.features.title')}</h2>
            <p className="text-slate-600 text-lg">{t('landing.features.description')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={FileText}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              title={t('landing.features.cv.title')}
              description={t('landing.features.cv.description')}
              mockup={<CVMockup />}
              features={[
                t('landing.features.cv.feature1'),
                t('landing.features.cv.feature2'),
                t('landing.features.cv.feature3'),
                t('landing.features.cv.feature4'),
                t('landing.features.cv.feature5')
              ]}
              large
            />
            <FeatureCard
              icon={Lightbulb}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
              title={t('landing.features.interests.title')}
              description={t('landing.features.interests.description')}
              mockup={<InterestMockup />}
            />
            <FeatureCard
              icon={Briefcase}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              title={t('landing.features.jobs.title')}
              description={t('landing.features.jobs.description')}
              mockup={<JobSearchMockup />}
            />
            <FeatureCard
              icon={Mic}
              iconBg="bg-pink-100"
              iconColor="text-pink-600"
              title={t('landing.features.interview.title')}
              description={t('landing.features.interview.description')}
              mockup={<InterviewMockup />}
            />
            <FeatureCard
              icon={Heart}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              title={t('landing.features.wellness.title')}
              description={t('landing.features.wellness.description')}
              mockup={<WellnessMockup />}
            />
            <FeatureCard
              icon={Zap}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              title={t('landing.features.coach.title')}
              description={t('landing.features.coach.description')}
              mockup={<CoachMockup />}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="priser" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.pricing.sectionLabel')}</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.pricing.title')}</h2>
            <p className="text-slate-600 text-lg">{t('landing.pricing.description')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Organization License */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border-2 border-violet-200 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  {t('landing.pricing.mostPopular')}
                </span>
              </div>
              <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('landing.pricing.organization.title')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('landing.pricing.organization.description')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900">{t('landing.pricing.organization.price')}</span>
                <span className="text-slate-500">{t('landing.pricing.organization.currency')}</span>
                <span className="text-slate-400">{t('landing.pricing.organization.period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.organization.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@jobin.se"
                className="block w-full bg-violet-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
              >
                {t('landing.pricing.cta')}
              </a>
            </div>

            {/* Per Consultant */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-5">
                <UserCheck className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('landing.pricing.consultant.title')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('landing.pricing.consultant.description')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900">{t('landing.pricing.consultant.price')}</span>
                <span className="text-slate-500">{t('landing.pricing.consultant.currency')}</span>
                <span className="text-slate-400">{t('landing.pricing.consultant.period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.consultant.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@jobin.se"
                className="block w-full bg-white text-teal-600 border-2 border-teal-200 text-center py-3 rounded-xl font-semibold hover:bg-teal-50 hover:border-teal-300 transition-colors"
              >
                {t('landing.pricing.cta')}
              </a>
            </div>

            {/* Participant - Free */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg border border-green-200 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t('landing.pricing.participant.title')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('landing.pricing.participant.description')}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-green-600">{t('landing.pricing.participant.priceLabel')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.participant.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                {t('landing.nav.getStartedFree')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.allFeatures.sectionLabel')}</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.allFeatures.title')}</h2>
            <p className="text-slate-600 text-lg">{t('landing.allFeatures.description')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* CV & Ansökan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-violet-600 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('landing.allFeatures.categories.cv')}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.cvBuilder')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.cvTemplates')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.linkedinImport')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.coverLetter')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.atsAnalysis')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.pdfExport')}</li>
              </ul>
            </div>

            {/* Jobbsökning */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-orange-600 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                {t('landing.allFeatures.categories.search')}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.jobSearch')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.jobAlerts')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.jobMap')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.savedJobs')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.applicationTracker')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.companyResearch')}</li>
              </ul>
            </div>

            {/* Utveckling */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-teal-600 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                {t('landing.allFeatures.categories.development')}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.interestGuide')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.interviewTraining')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.careerCoach')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.skillsAnalysis')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.salaryGuide')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.linkedinOptimizer')}</li>
              </ul>
            </div>

            {/* Välmående */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-pink-600 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                {t('landing.allFeatures.categories.wellness')}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.exercises')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.knowledgeBase')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.diary')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.moodTracking')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.crisisSupport')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.calendar')}</li>
              </ul>
            </div>

            {/* Administration */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-indigo-600 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t('landing.allFeatures.categories.admin')}
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.consultantPortal')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.participantOverview')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.progressReports')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.groupManagement')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.statistics')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />{t('landing.allFeatures.list.chat')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.testimonials.sectionLabel')}</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.testimonials.title')}</h2>
            <p className="text-slate-600 text-lg">{t('landing.testimonials.description')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((testimonial, idx) => (
              <TestimonialCard key={idx} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-violet-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-teal-100 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.faq.sectionLabel')}</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.faq.title')}</h2>
            <p className="text-slate-600 text-lg">{t('landing.faq.description')}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
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
          <div className="bg-gradient-to-br from-slate-50 to-violet-50 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('landing.contact.sectionLabel')}</span>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">{t('landing.contact.title')}</h2>
                <p className="text-slate-600 text-lg mb-8">
                  {t('landing.contact.description')}
                </p>
                <div className="space-y-4">
                  <a href="mailto:support@jobin.se" className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                      <Mail className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t('landing.contact.email')}</p>
                      <p className="text-slate-600">support@jobin.se</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t('landing.contact.openingHours')}</p>
                      <p className="text-slate-600">{t('landing.contact.openingHoursValue')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="inline-block bg-white rounded-2xl p-8 shadow-lg">
                  <Target className="w-16 h-16 text-violet-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{t('landing.contact.readyToStart')}</h3>
                  <p className="text-slate-600 mb-6">{t('landing.contact.createAccountDescription')}</p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
                  >
                    {t('landing.contact.createFreeAccount')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 tracking-tight">{t('landing.cta.title')}</h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            {t('landing.cta.description')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-violet-600 hover:bg-slate-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/70 text-sm mt-6">
            {t('landing.cta.noCard')}
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
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <span className="text-white font-bold text-xl">Jobin</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                {t('landing.footer.brand')}
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
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">{t('landing.footer.featuresTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.cvGenerator')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.interestGuide')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.jobSearch')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.interviewTraining')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Om Jobin */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">{t('landing.footer.aboutTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.aboutUs')}
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@jobin.se" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.contact')}
                  </a>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.termsOfUse')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hjälp */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">{t('landing.footer.helpTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:support@jobin.se" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.support')}
                  </a>
                </li>
                <li>
                  <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.faq')}
                  </button>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.guides')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Logga in */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">{t('landing.footer.accountTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.login')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {t('landing.footer.createAccount')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {t('landing.footer.copyright')}</p>
            <p className="flex items-center gap-2">
              {t('landing.footer.madeWith')}
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              {t('landing.footer.forJobSeekers')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
