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
} from 'lucide-react'

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
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
        <Icon className="w-5 h-5 text-purple-600" />
        {title}
      </h2>
      {children}
    </section>
  )

  const ListItem = ({ icon: Icon, title, desc, positive = true }: { icon?: any; title?: string; desc: string; positive?: boolean }) => (
    <li className="flex items-start gap-3">
      {Icon ? (
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${positive ? 'text-green-500' : 'text-red-500'}`} />
      ) : (
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
      )}
      <span>
        {title && <strong>{title}</strong>} {desc}
      </span>
    </li>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <span className="text-xl font-bold text-indigo-600">Jobin</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
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
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('aiPolicy.title')}</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('aiPolicy.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12 space-y-10">
          {/* Introduction */}
          <Section icon={Eye} title={t('aiPolicy.intro.title')}>
            <p className="text-slate-600 leading-relaxed">{t('aiPolicy.intro.text')}</p>
          </Section>

          {/* AI Models */}
          <Section icon={Brain} title={t('aiPolicy.models.title')}>
            <p className="text-slate-600 leading-relaxed mb-4">{t('aiPolicy.models.intro')}</p>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
              <h3 className="font-bold text-purple-900 text-lg mb-3">{t('aiPolicy.models.openai')}</h3>
              <p className="text-purple-800 mb-4">{t('aiPolicy.models.openaiDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-purple-700">{t('aiPolicy.models.provider')}</span>
                  <p className="text-purple-600">OpenAI, Inc.</p>
                </div>
                <div>
                  <span className="font-medium text-purple-700">{t('aiPolicy.models.purpose')}</span>
                  <p className="text-purple-600">CV & Cover Letter</p>
                </div>
                <div>
                  <span className="font-medium text-purple-700">{t('aiPolicy.models.location')}</span>
                  <p className="text-purple-600">USA (EU-US DPF)</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Data Flow */}
          <Section icon={Database} title={t('aiPolicy.dataFlow.title')}>
            <p className="text-slate-600 leading-relaxed mb-4">{t('aiPolicy.dataFlow.intro')}</p>

            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2">{t('aiPolicy.dataFlow.cv')}</h4>
                <p className="text-green-700 text-sm">{t('aiPolicy.dataFlow.cvData')}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2">{t('aiPolicy.dataFlow.coverLetter')}</h4>
                <p className="text-green-700 text-sm">{t('aiPolicy.dataFlow.coverLetterData')}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <h4 className="font-semibold text-red-800 mb-2">{t('aiPolicy.dataFlow.notSent')}</h4>
                <p className="text-red-700 text-sm">{t('aiPolicy.dataFlow.notSentList')}</p>
              </div>
            </div>
          </Section>

          {/* User Control */}
          <Section icon={Shield} title={t('aiPolicy.userControl.title')}>
            <p className="text-slate-600 leading-relaxed mb-4">{t('aiPolicy.userControl.intro')}</p>
            <ul className="space-y-3 text-slate-600">
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.consent')} desc={t('aiPolicy.userControl.consentDesc')} />
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.review')} desc={t('aiPolicy.userControl.reviewDesc')} />
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.withdraw')} desc={t('aiPolicy.userControl.withdrawDesc')} />
              <ListItem icon={CheckCircle} title={t('aiPolicy.userControl.delete')} desc={t('aiPolicy.userControl.deleteDesc')} />
            </ul>
          </Section>

          {/* No Decisions */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-amber-800 mb-3 flex items-center gap-3">
              <XCircle className="w-6 h-6" />
              {t('aiPolicy.noDecisions.title')}
            </h2>
            <p className="text-amber-700 leading-relaxed">{t('aiPolicy.noDecisions.text')}</p>
          </div>

          {/* Security */}
          <Section icon={Lock} title={t('aiPolicy.security.title')}>
            <p className="text-slate-600 leading-relaxed mb-4">{t('aiPolicy.security.intro')}</p>
            <ul className="space-y-2 text-slate-600">
              <ListItem desc={t('aiPolicy.security.encryption')} />
              <ListItem desc={t('aiPolicy.security.minimize')} />
              <ListItem desc={t('aiPolicy.security.noTraining')} />
              <ListItem desc={t('aiPolicy.security.logs')} />
            </ul>
          </Section>

          {/* Compliance */}
          <Section icon={Scale} title={t('aiPolicy.compliance.title')}>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800">{t('aiPolicy.compliance.aiAct')}</h4>
                <p className="text-blue-700 text-sm mt-1">{t('aiPolicy.compliance.aiActDesc')}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="font-semibold text-indigo-800">{t('aiPolicy.compliance.gdpr')}</h4>
                <p className="text-indigo-700 text-sm mt-1">{t('aiPolicy.compliance.gdprDesc')}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-800">{t('aiPolicy.compliance.dataAct')}</h4>
                <p className="text-purple-700 text-sm mt-1">{t('aiPolicy.compliance.dataActDesc')}</p>
              </div>
            </div>
          </Section>

          {/* FAQ */}
          <Section icon={HelpCircle} title={t('aiPolicy.questions.title')}>
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-semibold text-slate-800">{t('aiPolicy.questions.q1')}</h4>
                <p className="text-slate-600 text-sm mt-1">{t('aiPolicy.questions.a1')}</p>
              </div>
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-semibold text-slate-800">{t('aiPolicy.questions.q2')}</h4>
                <p className="text-slate-600 text-sm mt-1">{t('aiPolicy.questions.a2')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{t('aiPolicy.questions.q3')}</h4>
                <p className="text-slate-600 text-sm mt-1">{t('aiPolicy.questions.a3')}</p>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section icon={Mail} title={t('aiPolicy.contact.title')}>
            <p className="text-slate-600 leading-relaxed">
              {t('aiPolicy.contact.text')}{' '}
              <a href="mailto:privacy@jobin.se" className="text-purple-600 hover:underline">
                privacy@jobin.se
              </a>
            </p>
          </Section>

          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-500">
              {t('aiPolicy.lastUpdated')} {formatDate()}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">&copy; {t('aiPolicy.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}
