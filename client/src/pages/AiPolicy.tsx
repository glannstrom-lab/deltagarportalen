import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Bot,
  Brain,
  Shield,
  Eye,
  Lock,
  HelpCircle,
  Mail,
  CheckCircle,
  XCircle,
  Scale,
  Database
} from '@/components/ui/icons'

export default function AiPolicy() {
  const { t, i18n } = useTranslation()

  const formatDate = () => {
    const locale = i18n.language === 'en' ? 'en-US' : 'sv-SE'
    return new Date('2026-03-27').toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <section className="scroll-mt-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
        <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        {title}
      </h2>
      {children}
    </section>
  )

  const ListItem = ({ icon: Icon, title, desc, positive = true }: { icon?: any; title?: string; desc: string; positive?: boolean }) => (
    <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
      {Icon ? (
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${positive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`} />
      ) : (
        <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
      )}
      <span>
        {title && <strong className="text-gray-800 dark:text-gray-100">{title}</strong>} {desc}
      </span>
    </li>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition">
      {/* Header */}
      <nav className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <span className="text-xl font-bold text-teal-600 dark:text-teal-400">Jobin</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('aiPolicy.backToHome')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('aiPolicy.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t('aiPolicy.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8 lg:p-12 space-y-10">
          {/* Introduction */}
          <Section icon={Eye} title={t('aiPolicy.intro.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('aiPolicy.intro.text')}</p>
          </Section>

          {/* AI Models */}
          <Section icon={Brain} title={t('aiPolicy.models.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('aiPolicy.models.intro')}</p>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-100 dark:border-teal-800">
              <h3 className="font-bold text-teal-900 dark:text-teal-100 text-lg mb-3">{t('aiPolicy.models.openai')}</h3>
              <p className="text-teal-800 dark:text-teal-200 mb-4">{t('aiPolicy.models.openaiDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-teal-700 dark:text-teal-300">{t('aiPolicy.models.provider')}</span>
                  <p className="text-teal-600 dark:text-teal-400">OpenAI, Inc.</p>
                </div>
                <div>
                  <span className="font-medium text-teal-700 dark:text-teal-300">{t('aiPolicy.models.purpose')}</span>
                  <p className="text-teal-600 dark:text-teal-400">CV & Cover Letter</p>
                </div>
                <div>
                  <span className="font-medium text-teal-700 dark:text-teal-300">{t('aiPolicy.models.location')}</span>
                  <p className="text-teal-600 dark:text-teal-400">USA (EU-US DPF)</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Data Flow */}
          <Section icon={Database} title={t('aiPolicy.dataFlow.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('aiPolicy.dataFlow.intro')}</p>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{t('aiPolicy.dataFlow.cv')}</h4>
                <p className="text-green-700 dark:text-green-300 text-sm">{t('aiPolicy.dataFlow.cvData')}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{t('aiPolicy.dataFlow.coverLetter')}</h4>
                <p className="text-green-700 dark:text-green-300 text-sm">{t('aiPolicy.dataFlow.coverLetterData')}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">{t('aiPolicy.dataFlow.notSent')}</h4>
                <p className="text-red-700 dark:text-red-300 text-sm">{t('aiPolicy.dataFlow.notSentList')}</p>
              </div>
            </div>
          </Section>

          {/* User Control */}
          <Section icon={Shield} title={t('aiPolicy.userControl.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('aiPolicy.userControl.intro')}</p>
            <ul className="space-y-3">
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.consent')} desc={t('aiPolicy.userControl.consentDesc')} />
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.review')} desc={t('aiPolicy.userControl.reviewDesc')} />
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.withdraw')} desc={t('aiPolicy.userControl.withdrawDesc')} />
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.delete')} desc={t('aiPolicy.userControl.deleteDesc')} />
            </ul>
          </Section>

          {/* No Decisions */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-3">
              <XCircle className="w-6 h-6" />
              {t('aiPolicy.noDecisions.title')}
            </h2>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">{t('aiPolicy.noDecisions.text')}</p>
          </div>

          {/* Security */}
          <Section icon={Lock} title={t('aiPolicy.security.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('aiPolicy.security.intro')}</p>
            <ul className="space-y-2">
              <ListItem desc={t('aiPolicy.security.encryption')} />
              <ListItem desc={t('aiPolicy.security.minimize')} />
              <ListItem desc={t('aiPolicy.security.noTraining')} />
              <ListItem desc={t('aiPolicy.security.logs')} />
            </ul>
          </Section>

          {/* Compliance */}
          <Section icon={Scale} title={t('aiPolicy.compliance.title')}>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">{t('aiPolicy.compliance.aiAct')}</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">{t('aiPolicy.compliance.aiActDesc')}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">{t('aiPolicy.compliance.gdpr')}</h4>
                <p className="text-indigo-700 dark:text-indigo-300 text-sm mt-1">{t('aiPolicy.compliance.gdprDesc')}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">{t('aiPolicy.compliance.dataAct')}</h4>
                <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">{t('aiPolicy.compliance.dataActDesc')}</p>
              </div>
            </div>
          </Section>

          {/* FAQ */}
          <Section icon={HelpCircle} title={t('aiPolicy.questions.title')}>
            <div className="space-y-4">
              <div className="border-b border-stone-100 dark:border-stone-700 pb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{t('aiPolicy.questions.q1')}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{t('aiPolicy.questions.a1')}</p>
              </div>
              <div className="border-b border-stone-100 dark:border-stone-700 pb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{t('aiPolicy.questions.q2')}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{t('aiPolicy.questions.a2')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{t('aiPolicy.questions.q3')}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{t('aiPolicy.questions.a3')}</p>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title={t('aiPolicy.contact.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('aiPolicy.contact.text')}{' '}
              <a href="mailto:privacy@jobin.se" className="text-teal-600 dark:text-teal-400 hover:underline">
                privacy@jobin.se
              </a>
            </p>
          </Section>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('aiPolicy.lastUpdated')} {formatDate()}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 dark:bg-stone-950 text-stone-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">&copy; {t('aiPolicy.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}
