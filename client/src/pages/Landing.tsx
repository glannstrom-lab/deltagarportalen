import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ArrowRight,
  FileText,
  Lightbulb,
  Briefcase,
  Mic,
  Heart,
  Menu,
  ChevronDown,
  Target,
  ChevronRight,
  Mail,
  Search,
  Star,
  X
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
    <div className={`border-b border-stone-100 dark:border-stone-700 transition-colors ${isOpen ? 'bg-white dark:bg-stone-800' : ''}`}>
      <button
        onClick={onClick}
        className="w-full px-5 sm:px-6 py-5 sm:py-6 text-left flex justify-between items-start sm:items-center group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-stone-800 dark:text-stone-100 pr-4 text-base sm:text-lg leading-snug">{question}</span>
        <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 text-stone-400 dark:text-stone-500 transition-transform duration-300 flex-shrink-0 mt-0.5 sm:mt-0 ${isOpen ? 'rotate-180 text-[var(--c-text)] dark:text-[var(--c-solid)]' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}
      >
        <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-base sm:text-base px-5 sm:px-6">{answer}</p>
      </div>
    </div>
  )
}

// Simple Feature Card
function FeatureCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="group p-6 rounded-2xl bg-white dark:bg-stone-800 sm:bg-transparent sm:dark:bg-transparent border border-stone-100 dark:border-stone-700 sm:border-0 shadow-sm sm:shadow-none transition-all hover:shadow-md sm:hover:shadow-none">
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-[var(--c-accent)]/40 dark:group-hover:bg-[var(--c-bg)]/60 transition-colors shadow-sm">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 sm:mb-3">{title}</h3>
      <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-base">{description}</p>
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
    setMobileMenuOpen(false)
    // Small delay to allow menu to close before scrolling
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        const offset = 80 // Account for fixed navbar
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  const faqs = [
    { question: t('landing.faq.q1'), answer: t('landing.faq.a1') },
    { question: t('landing.faq.q2'), answer: t('landing.faq.a2') },
    { question: t('landing.faq.q3'), answer: t('landing.faq.a3') },
    { question: t('landing.faq.q4'), answer: t('landing.faq.a4') },
    { question: t('landing.faq.q5'), answer: t('landing.faq.a5') },
    { question: t('landing.faq.q6'), answer: t('landing.faq.a6') }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-stone-900">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-stone-900/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen ? 'bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-sm dark:shadow-stone-950/50' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <OptimizedImage
                src="/logo-icon.svg"
                alt="jobin.se"
                loading="eager"
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain"
              />
              <span className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-white">jobin.se</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 h-full">
              <button
                onClick={() => scrollToSection('funktioner')}
                className="h-full inline-flex items-center text-stone-700 dark:text-stone-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] font-medium transition-colors"
              >
                {t('landing.nav.features')}
              </button>
              <button
                onClick={() => scrollToSection('hur-det-funkar')}
                className="h-full inline-flex items-center text-stone-700 dark:text-stone-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] font-medium transition-colors"
              >
                {t('landing.nav.howItWorks')}
              </button>
              <button
                onClick={() => scrollToSection('priser')}
                className="h-full inline-flex items-center text-stone-700 dark:text-stone-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] font-medium transition-colors"
              >
                {t('landing.nav.pricing')}
              </button>
              <Link to="/login" className="h-full inline-flex items-center text-stone-700 dark:text-stone-300 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] font-medium transition-colors">
                {t('landing.nav.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center bg-[var(--c-solid)] hover:bg-[var(--c-text)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)] text-white px-6 py-2.5 rounded-full font-medium transition-colors"
              >
                {t('landing.nav.getStarted')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 active:bg-stone-200 dark:active:bg-stone-700 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t('landing.nav.openMenu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-stone-700 dark:text-stone-300" />
              ) : (
                <Menu className="w-6 h-6 text-stone-700 dark:text-stone-300" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="space-y-1 pt-4 pb-6 border-t border-stone-100 dark:border-stone-700">
              <button
                onClick={() => scrollToSection('funktioner')}
                className="block w-full text-left text-stone-700 dark:text-stone-300 active:text-[var(--c-text)] dark:active:text-[var(--c-solid)] hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-[var(--c-bg)] dark:active:bg-[var(--c-bg)]/40 py-3.5 px-4 rounded-xl font-medium transition-all"
              >
                {t('landing.nav.features')}
              </button>
              <button
                onClick={() => scrollToSection('hur-det-funkar')}
                className="block w-full text-left text-stone-700 dark:text-stone-300 active:text-[var(--c-text)] dark:active:text-[var(--c-solid)] hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-[var(--c-bg)] dark:active:bg-[var(--c-bg)]/40 py-3.5 px-4 rounded-xl font-medium transition-all"
              >
                {t('landing.nav.howItWorks')}
              </button>
              <button
                onClick={() => scrollToSection('priser')}
                className="block w-full text-left text-stone-700 dark:text-stone-300 active:text-[var(--c-text)] dark:active:text-[var(--c-solid)] hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-[var(--c-bg)] dark:active:bg-[var(--c-bg)]/40 py-3.5 px-4 rounded-xl font-medium transition-all"
              >
                {t('landing.nav.pricing')}
              </button>
              <Link
                to="/login"
                className="block text-stone-700 dark:text-stone-300 active:text-[var(--c-text)] dark:active:text-[var(--c-solid)] hover:bg-stone-50 dark:hover:bg-stone-800 active:bg-[var(--c-bg)] dark:active:bg-[var(--c-bg)]/40 py-3.5 px-4 rounded-xl font-medium transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.login')}
              </Link>
              <div className="pt-2">
                <Link
                  to="/register"
                  className="block bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white px-5 py-4 rounded-full font-semibold text-center active:bg-[var(--c-text)] dark:active:bg-[var(--c-solid)] transition-colors shadow-md"
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
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Hero Image - bakgrund på alla viewports, med olika overlay för mobil/desktop */}
        <div className="absolute inset-0">
          {/* Mjuk pastell-bas under bilden så texten är läsbar oavsett bildens del */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--c-bg)] via-white to-stone-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800" />
          <OptimizedImage
            src="/hero-landing.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right dark:opacity-60"
            loading="eager"
          />
          {/* Fade overlay — starkare och bottom-up på mobil så texten ovanpå alltid är läsbar,
              starkare till vänster på desktop så vänsterspaltens text dominerar. */}
          <div className="sm:hidden absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/30 dark:from-stone-900/95 dark:via-stone-900/80 dark:to-stone-900/30" />
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-white/95 dark:from-stone-900/95 via-40% to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-20 pt-32 sm:py-32">
          <div className="max-w-xl text-center sm:text-left mx-auto sm:mx-0">
            <p className="text-[var(--c-text)] dark:text-[var(--c-solid)] font-semibold mb-4 tracking-wide text-sm sm:text-base uppercase">
              {t('landing.hero.badge')}
            </p>

            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-white mb-5 sm:mb-6 leading-[1.15] sm:leading-tight">
              {t('landing.hero.titleStart')}{' '}
              <span className="text-[var(--c-text)] dark:text-[var(--c-solid)]">{t('landing.hero.titleHighlight')}</span>
              {' '}{t('landing.hero.titleEnd')}
            </h1>

            <p className="text-lg sm:text-lg text-stone-600 dark:text-stone-300 mb-8 sm:mb-8 leading-relaxed max-w-lg mx-auto sm:mx-0">
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-10">
              <Link
                to="/register"
                className="group bg-[var(--c-solid)] hover:bg-[var(--c-text)] active:bg-[var(--c-text)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)] dark:active:bg-[var(--c-text)] text-white px-8 py-4 rounded-full font-semibold text-base sm:text-lg inline-flex items-center justify-center gap-2 transition-all shadow-lg dark:hover:shadow-xl "
              >
                {t('landing.hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => scrollToSection('funktioner')}
                className="text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white active:text-stone-900 px-8 py-4 rounded-full font-semibold text-base sm:text-lg inline-flex items-center justify-center gap-2 border-2 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 active:border-stone-400 transition-all bg-white dark:bg-stone-800"
              >
                {t('landing.nav.features')}
              </button>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2 sm:gap-6 text-sm text-stone-600 dark:text-stone-300">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0" />
                <span>{t('landing.hero.free')}</span>
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0" />
                <span>{t('landing.hero.secure')}</span>
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0" />
                <span>{t('landing.hero.quickStart')}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 sm:py-16 bg-stone-50 dark:bg-stone-800/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:flex sm:flex-row sm:items-center sm:justify-center gap-6 sm:gap-12 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">5 000+</p>
              <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-base mt-1">{t('landing.socialProof.users')}</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-stone-200 dark:bg-stone-700" />
            <div>
              <div className="flex justify-center gap-0.5 sm:gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-base">{t('landing.socialProof.rating')}</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-stone-200 dark:bg-stone-700" />
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">30+</p>
              <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-base mt-1">{t('landing.trust.municipalities')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funktioner" className="py-16 sm:py-24 scroll-mt-20 dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-[var(--c-text)] dark:text-[var(--c-solid)] font-semibold mb-3 text-sm sm:text-base uppercase tracking-wide">{t('landing.features.sectionLabel')}</p>
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4 sm:mb-4 leading-tight">
              {t('landing.features.title')}
            </h2>
            <p className="text-stone-600 dark:text-stone-300 text-base sm:text-lg leading-relaxed">
              {t('landing.features.description')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-12">
            <FeatureCard
              icon={FileText}
              title={t('landing.features.cv.title')}
              description={t('landing.features.cv.description')}
            />
            <FeatureCard
              icon={Lightbulb}
              title={t('landing.features.interests.title')}
              description={t('landing.features.interests.description')}
            />
            <FeatureCard
              icon={Briefcase}
              title={t('landing.features.jobs.title')}
              description={t('landing.features.jobs.description')}
            />
            <FeatureCard
              icon={Mic}
              title={t('landing.features.interview.title')}
              description={t('landing.features.interview.description')}
            />
            <FeatureCard
              icon={Heart}
              title={t('landing.features.wellness.title')}
              description={t('landing.features.wellness.description')}
            />
            <FeatureCard
              icon={Search}
              title={t('landing.features.coach.title')}
              description={t('landing.features.coach.description')}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="hur-det-funkar" className="py-16 sm:py-24 bg-stone-50 dark:bg-stone-800/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-[var(--c-text)] dark:text-[var(--c-solid)] font-semibold mb-3 text-sm sm:text-base uppercase tracking-wide">{t('landing.steps.sectionLabel')}</p>
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4 sm:mb-4 leading-tight">
              {t('landing.steps.title')}
            </h2>
            <p className="text-stone-600 dark:text-stone-300 text-base sm:text-lg leading-relaxed">
              {t('landing.steps.description')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative">
                <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 sm:p-8 h-full shadow-sm dark:shadow-stone-950/30">
                  <div className="w-12 h-12 bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white rounded-full flex items-center justify-center text-xl font-bold mb-5 sm:mb-6 shadow-md ">
                    {step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-stone-800 dark:text-stone-100 mb-3 sm:mb-3">
                    {t(`landing.steps.step${step}Title`)}
                  </h3>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-base sm:text-base">
                    {t(`landing.steps.step${step}Description`)}
                  </p>
                </div>
                {step < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="priser" className="py-16 sm:py-24 scroll-mt-20 dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="text-[var(--c-text)] dark:text-[var(--c-solid)] font-semibold mb-3 text-sm sm:text-base uppercase tracking-wide">{t('landing.pricing.sectionLabel')}</p>
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4 sm:mb-4 leading-tight">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-stone-600 dark:text-stone-300 text-base sm:text-lg leading-relaxed">
              {t('landing.pricing.description')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8 max-w-5xl mx-auto">
            {/* Organization */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-7 sm:p-8 border-2 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 relative sm:col-span-2 md:col-span-1 shadow-lg dark:shadow-stone-950/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
                  {t('landing.pricing.mostPopular')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 mt-1">
                {t('landing.pricing.organization.title')}
              </h3>
              <p className="text-stone-600 dark:text-stone-300 text-sm mb-5 leading-relaxed">
                {t('landing.pricing.organization.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">{t('landing.pricing.organization.price')}</span>
                <span className="text-stone-600 dark:text-stone-400 text-sm"> {t('landing.pricing.organization.currency')}{t('landing.pricing.organization.period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.organization.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-300">
                    <Check className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@jobin.se"
                className="block w-full bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white text-center py-3.5 rounded-full font-semibold hover:bg-[var(--c-text)] dark:hover:bg-[var(--c-solid)] active:bg-[var(--c-text)] transition-colors shadow-md"
              >
                {t('landing.pricing.cta')}
              </a>
            </div>

            {/* Consultant */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-7 sm:p-8 border border-stone-200 dark:border-stone-700 shadow-sm dark:shadow-stone-950/30">
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                {t('landing.pricing.consultant.title')}
              </h3>
              <p className="text-stone-600 dark:text-stone-300 text-sm mb-5 leading-relaxed">
                {t('landing.pricing.consultant.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">{t('landing.pricing.consultant.price')}</span>
                <span className="text-stone-600 dark:text-stone-400 text-sm"> {t('landing.pricing.consultant.currency')}{t('landing.pricing.consultant.period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.consultant.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-300">
                    <Check className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@jobin.se"
                className="block w-full border-2 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 text-center py-3.5 rounded-full font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 active:bg-stone-100 transition-colors"
              >
                {t('landing.pricing.cta')}
              </a>
            </div>

            {/* Free */}
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-7 sm:p-8 border border-stone-200 dark:border-stone-700 shadow-sm dark:shadow-stone-950/30">
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                {t('landing.pricing.participant.title')}
              </h3>
              <p className="text-stone-600 dark:text-stone-300 text-sm mb-5 leading-relaxed">
                {t('landing.pricing.participant.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{t('landing.pricing.participant.priceLabel')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.participant.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-300">
                    <Check className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full bg-stone-900 dark:bg-stone-700 text-white text-center py-3.5 rounded-full font-semibold hover:bg-stone-800 dark:hover:bg-stone-600 active:bg-stone-700 transition-colors"
              >
                {t('landing.nav.getStartedFree')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 bg-stone-50 dark:bg-stone-800/50">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[var(--c-text)] dark:text-[var(--c-solid)] font-semibold mb-3 text-sm sm:text-base uppercase tracking-wide">{t('landing.faq.sectionLabel')}</p>
            <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4 sm:mb-4 leading-tight">
              {t('landing.faq.title')}
            </h2>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm dark:shadow-stone-950/30 overflow-hidden">
            {faqs.map((faq, idx) => (
              <div key={idx} className={idx !== 0 ? '' : ''}>
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === idx}
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 dark:bg-stone-900">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-4 sm:mb-4 leading-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-stone-600 dark:text-stone-300 text-lg sm:text-lg mb-8 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            {t('landing.cta.description')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[var(--c-solid)] hover:bg-[var(--c-text)] active:bg-[var(--c-text)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)] dark:active:bg-[var(--c-text)] text-white px-8 py-4 rounded-full font-semibold text-lg sm:text-lg transition-all shadow-lg dark:hover:shadow-xl "
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-sm mt-5">
            {t('landing.cta.noCard')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-12 sm:mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <OptimizedImage
                  src="/logo-jobin-new.webp"
                  alt="jobin.se"
                  className="w-9 h-9 object-contain"
                />
                <span className="text-white font-semibold text-xl">jobin.se</span>
              </div>
              <p className="text-sm leading-relaxed">
                {t('landing.footer.brand')}
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">{t('landing.footer.featuresTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors inline-block">{t('landing.footer.cvGenerator')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors inline-block">{t('landing.footer.interestGuide')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors inline-block">{t('landing.footer.jobSearch')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">{t('landing.footer.aboutTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:support@jobin.se" className="hover:text-white transition-colors inline-block">{t('landing.footer.contact')}</a></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors inline-block">{t('landing.footer.privacyPolicy')}</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors inline-block">{t('landing.footer.termsOfUse')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">{t('landing.footer.accountTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors inline-block">{t('landing.footer.login')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors inline-block">{t('landing.footer.createAccount')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-center sm:text-left">&copy; {t('landing.footer.copyright')}</p>
            <a href="mailto:support@jobin.se" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
              support@jobin.se
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
