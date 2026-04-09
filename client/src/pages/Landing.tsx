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
    <div className={`border-b border-slate-100 ${isOpen ? 'bg-slate-50/50' : ''}`}>
      <button
        onClick={onClick}
        className="w-full px-0 py-5 text-left flex justify-between items-center group"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-slate-800 pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}
      >
        <p className="text-slate-600 leading-relaxed">{answer}</p>
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
    <div className="group">
      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
        <Icon className="w-6 h-6 text-teal-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
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
    { question: t('landing.faq.q1'), answer: t('landing.faq.a1') },
    { question: t('landing.faq.q2'), answer: t('landing.faq.a2') },
    { question: t('landing.faq.q3'), answer: t('landing.faq.a3') },
    { question: t('landing.faq.q4'), answer: t('landing.faq.a4') },
    { question: t('landing.faq.q5'), answer: t('landing.faq.a5') },
    { question: t('landing.faq.q6'), answer: t('landing.faq.a6') }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <OptimizedImage
                src="/logo-jobin-new.webp"
                alt="jobin.se"
                loading="eager"
                className="w-11 h-11 object-contain"
              />
              <span className="text-2xl font-semibold text-slate-900">jobin.se</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('funktioner')}
                className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
              >
                {t('landing.nav.features')}
              </button>
              <button
                onClick={() => scrollToSection('hur-det-funkar')}
                className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
              >
                {t('landing.nav.howItWorks')}
              </button>
              <button
                onClick={() => scrollToSection('priser')}
                className="text-slate-700 hover:text-teal-600 font-medium transition-colors"
              >
                {t('landing.nav.pricing')}
              </button>
              <Link to="/login" className="text-slate-700 hover:text-teal-600 font-medium transition-colors">
                {t('landing.nav.login')}
              </Link>
              <Link
                to="/register"
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors"
              >
                {t('landing.nav.getStarted')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={t('landing.nav.openMenu')}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-80 pb-6' : 'max-h-0'
          }`}>
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <button onClick={() => scrollToSection('funktioner')} className="block w-full text-left text-slate-600 hover:text-slate-900 py-2">
                {t('landing.nav.features')}
              </button>
              <button onClick={() => scrollToSection('hur-det-funkar')} className="block w-full text-left text-slate-600 hover:text-slate-900 py-2">
                {t('landing.nav.howItWorks')}
              </button>
              <button onClick={() => scrollToSection('priser')} className="block w-full text-left text-slate-600 hover:text-slate-900 py-2">
                {t('landing.nav.pricing')}
              </button>
              <Link to="/login" className="block text-slate-600 hover:text-slate-900 py-2" onClick={() => setMobileMenuOpen(false)}>
                {t('landing.nav.login')}
              </Link>
              <Link
                to="/register"
                className="block bg-teal-600 text-white px-5 py-3 rounded-full font-medium text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.nav.getStartedFree')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Hero Image - Background */}
        <div className="absolute inset-0">
          <OptimizedImage
            src="/hero-landing.webp"
            alt=""
            className="w-full h-full object-cover object-right"
            loading="eager"
          />
          {/* Fade overlay from left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-40% to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <div className="max-w-xl">
            <p className="text-teal-600 font-medium mb-4 tracking-wide">
              {t('landing.hero.badge')}
            </p>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              {t('landing.hero.titleStart')}{' '}
              <span className="text-teal-600">{t('landing.hero.titleHighlight')}</span>
              {' '}{t('landing.hero.titleEnd')}
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to="/register"
                className="group bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full font-medium text-lg inline-flex items-center justify-center gap-2 transition-all"
              >
                {t('landing.hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => scrollToSection('funktioner')}
                className="text-slate-700 hover:text-slate-900 px-8 py-4 rounded-full font-medium text-lg inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 transition-all"
              >
                {t('landing.nav.features')}
              </button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                {t('landing.hero.free')}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                {t('landing.hero.secure')}
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-600" />
                {t('landing.hero.quickStart')}
              </span>
            </div>
            </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900">5 000+</p>
              <p className="text-slate-600 mt-1">{t('landing.socialProof.users')}</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-200" />
            <div>
              <div className="flex justify-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600">{t('landing.socialProof.rating')}</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-200" />
            <div>
              <p className="text-3xl font-bold text-slate-900">30+</p>
              <p className="text-slate-600 mt-1">{t('landing.trust.municipalities')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funktioner" className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-600 font-medium mb-3">{t('landing.features.sectionLabel')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-slate-600 text-lg">
              {t('landing.features.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
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
      <section id="hur-det-funkar" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-600 font-medium mb-3">{t('landing.steps.sectionLabel')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landing.steps.title')}
            </h2>
            <p className="text-slate-600 text-lg">
              {t('landing.steps.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative">
                <div className="bg-white rounded-2xl p-8 h-full">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">
                    {t(`landing.steps.step${step}Title`)}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {t(`landing.steps.step${step}Description`)}
                  </p>
                </div>
                {step < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="priser" className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-600 font-medium mb-3">{t('landing.pricing.sectionLabel')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-slate-600 text-lg">
              {t('landing.pricing.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Organization */}
            <div className="bg-white rounded-2xl p-8 border-2 border-teal-200 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-teal-600 text-white text-xs font-medium px-4 py-1 rounded-full">
                  {t('landing.pricing.mostPopular')}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {t('landing.pricing.organization.title')}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {t('landing.pricing.organization.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">{t('landing.pricing.organization.price')}</span>
                <span className="text-slate-600"> {t('landing.pricing.organization.currency')}{t('landing.pricing.organization.period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.organization.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@jobin.se"
                className="block w-full bg-teal-600 text-white text-center py-3 rounded-full font-medium hover:bg-teal-700 transition-colors"
              >
                {t('landing.pricing.cta')}
              </a>
            </div>

            {/* Consultant */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {t('landing.pricing.consultant.title')}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {t('landing.pricing.consultant.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">{t('landing.pricing.consultant.price')}</span>
                <span className="text-slate-600"> {t('landing.pricing.consultant.currency')}{t('landing.pricing.consultant.period')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.consultant.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@jobin.se"
                className="block w-full border border-slate-200 text-slate-700 text-center py-3 rounded-full font-medium hover:bg-slate-50 transition-colors"
              >
                {t('landing.pricing.cta')}
              </a>
            </div>

            {/* Free */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {t('landing.pricing.participant.title')}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {t('landing.pricing.participant.description')}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-teal-600">{t('landing.pricing.participant.priceLabel')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {(t('landing.pricing.participant.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full bg-slate-900 text-white text-center py-3 rounded-full font-medium hover:bg-slate-800 transition-colors"
              >
                {t('landing.nav.getStartedFree')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-teal-600 font-medium mb-3">{t('landing.faq.sectionLabel')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landing.faq.title')}
            </h2>
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
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            {t('landing.cta.description')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-all"
          >
            {t('landing.cta.button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-500 text-sm mt-4">
            {t('landing.cta.noCard')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
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
              <h4 className="text-white font-medium mb-4">{t('landing.footer.featuresTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.footer.cvGenerator')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.footer.interestGuide')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.footer.jobSearch')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">{t('landing.footer.aboutTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:support@jobin.se" className="hover:text-white transition-colors">{t('landing.footer.contact')}</a></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">{t('landing.footer.privacyPolicy')}</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">{t('landing.footer.termsOfUse')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">{t('landing.footer.accountTitle')}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">{t('landing.footer.login')}</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">{t('landing.footer.createAccount')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {t('landing.footer.copyright')}</p>
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
