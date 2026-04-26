import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  FileText,
  Trash2,
  Mail,
  Building2,
  Scale,
  Clock,
  Users,
  Globe,
  Bot,
  Cookie,
  AlertTriangle,
  Info,
  ExternalLink
} from '@/components/ui/icons'

export default function Privacy() {
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
    <section className="scroll-mt-8" id={title.toLowerCase().replace(/\s+/g, '-')}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
        <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        {title}
      </h2>
      {children}
    </section>
  )

  const ListItem = ({ title, desc }: { title?: string; desc: string }) => (
    <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
      <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
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
              {t('privacy.backToHome')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('privacy.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t('privacy.subtitle')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('privacy.version')}</p>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8 lg:p-12 space-y-10">
          {/* Data Controller */}
          <Section icon={Building2} title={t('privacy.controller.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.controller.intro')}</p>
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 space-y-2 text-gray-700 dark:text-gray-200">
              <p className="font-semibold">{t('privacy.controller.name')}</p>
              <p>{t('privacy.controller.orgNr')}</p>
              <p>{t('privacy.controller.address')}</p>
              <p>{t('privacy.controller.email')}</p>
            </div>
            <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
              <p className="font-medium text-teal-800 dark:text-teal-200">{t('privacy.controller.dpo')}</p>
              <p className="text-teal-700 dark:text-teal-300 text-sm">{t('privacy.controller.dpoDesc')}</p>
            </div>
          </Section>

          {/* What We Collect */}
          <Section icon={Eye} title={t('privacy.whatWeCollect.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.whatWeCollect.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.whatWeCollect.contact')} desc={t('privacy.whatWeCollect.contactDesc')} />
              <ListItem title={t('privacy.whatWeCollect.profile')} desc={t('privacy.whatWeCollect.profileDesc')} />
              <ListItem title={t('privacy.whatWeCollect.activity')} desc={t('privacy.whatWeCollect.activityDesc')} />
              <ListItem title={t('privacy.whatWeCollect.usage')} desc={t('privacy.whatWeCollect.usageDesc')} />
              <ListItem title={t('privacy.whatWeCollect.technical')} desc={t('privacy.whatWeCollect.technicalDesc')} />
            </ul>
          </Section>

          {/* Legal Basis */}
          <Section icon={Scale} title={t('privacy.legalBasis.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.legalBasis.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.legalBasis.contract')} desc={t('privacy.legalBasis.contractDesc')} />
              <ListItem title={t('privacy.legalBasis.consent')} desc={t('privacy.legalBasis.consentDesc')} />
              <ListItem title={t('privacy.legalBasis.legitimate')} desc={t('privacy.legalBasis.legitimateDesc')} />
              <ListItem title={t('privacy.legalBasis.legal')} desc={t('privacy.legalBasis.legalDesc')} />
            </ul>
          </Section>

          {/* Purposes */}
          <Section icon={FileText} title={t('privacy.purposes.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.purposes.intro')}</p>
            <ul className="space-y-2">
              <ListItem desc={t('privacy.purposes.account')} />
              <ListItem desc={t('privacy.purposes.cv')} />
              <ListItem desc={t('privacy.purposes.jobs')} />
              <ListItem desc={t('privacy.purposes.ai')} />
              <ListItem desc={t('privacy.purposes.analytics')} />
              <ListItem desc={t('privacy.purposes.support')} />
              <ListItem desc={t('privacy.purposes.security')} />
            </ul>
          </Section>

          {/* Retention */}
          <Section icon={Clock} title={t('privacy.retention.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.retention.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.retention.active')} desc={t('privacy.retention.activeDesc')} />
              <ListItem title={t('privacy.retention.deleted')} desc={t('privacy.retention.deletedDesc')} />
              <ListItem title={t('privacy.retention.logs')} desc={t('privacy.retention.logsDesc')} />
              <ListItem title={t('privacy.retention.legal')} desc={t('privacy.retention.legalDesc')} />
            </ul>
          </Section>

          {/* Third Party Sharing */}
          <Section icon={Users} title={t('privacy.sharing.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.sharing.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.sharing.hosting')} desc={t('privacy.sharing.hostingDesc')} />
              <ListItem title={t('privacy.sharing.ai')} desc={t('privacy.sharing.aiDesc')} />
              <ListItem title={t('privacy.sharing.analytics')} desc={t('privacy.sharing.analyticsDesc')} />
            </ul>
            <p className="mt-4 font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
              {t('privacy.sharing.none')}
            </p>
          </Section>

          {/* International Transfers */}
          <Section icon={Globe} title={t('privacy.transfers.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.transfers.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.transfers.safeguards')} desc={t('privacy.transfers.safeguardsDesc')} />
              <ListItem title={t('privacy.transfers.minimize')} desc={t('privacy.transfers.minimizeDesc')} />
            </ul>
          </Section>

          {/* Security */}
          <Section icon={Lock} title={t('privacy.howWeProtect.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.howWeProtect.intro')}</p>
            <ul className="space-y-2">
              <ListItem desc={t('privacy.howWeProtect.ssl')} />
              <ListItem desc={t('privacy.howWeProtect.hash')} />
              <ListItem desc={t('privacy.howWeProtect.rls')} />
              <ListItem desc={t('privacy.howWeProtect.audits')} />
              <ListItem desc={t('privacy.howWeProtect.access')} />
            </ul>
          </Section>

          {/* Your Rights */}
          <Section icon={Trash2} title={t('privacy.yourRights.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.yourRights.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.yourRights.access')} desc={t('privacy.yourRights.accessDesc')} />
              <ListItem title={t('privacy.yourRights.correction')} desc={t('privacy.yourRights.correctionDesc')} />
              <ListItem title={t('privacy.yourRights.deletion')} desc={t('privacy.yourRights.deletionDesc')} />
              <ListItem title={t('privacy.yourRights.restriction')} desc={t('privacy.yourRights.restrictionDesc')} />
              <ListItem title={t('privacy.yourRights.portability')} desc={t('privacy.yourRights.portabilityDesc')} />
              <ListItem title={t('privacy.yourRights.object')} desc={t('privacy.yourRights.objectDesc')} />
              <ListItem title={t('privacy.yourRights.withdraw')} desc={t('privacy.yourRights.withdrawDesc')} />
            </ul>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="font-medium text-blue-800 dark:text-blue-200">{t('privacy.yourRights.howTo')}</p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">{t('privacy.yourRights.howToDesc')}</p>
            </div>
          </Section>

          {/* Automated Decision Making */}
          <Section icon={Bot} title={t('privacy.automated.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.automated.intro')}</p>
            <ul className="space-y-2">
              <ListItem desc={t('privacy.automated.noDecisions')} />
              <ListItem desc={t('privacy.automated.aiAssist')} />
              <ListItem desc={t('privacy.automated.consent')} />
              <ListItem desc={t('privacy.automated.transparency')} />
            </ul>
            <Link
              to="/ai-policy"
              className="mt-4 inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
            >
              {t('privacy.automated.moreInfo')}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Section>

          {/* Cookies */}
          <Section icon={Cookie} title={t('privacy.cookies.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.cookies.intro')}</p>
            <ul className="space-y-2">
              <ListItem title={t('privacy.cookies.necessary')} desc={t('privacy.cookies.necessaryDesc')} />
              <ListItem title={t('privacy.cookies.functional')} desc={t('privacy.cookies.functionalDesc')} />
              <ListItem title={t('privacy.cookies.analytics')} desc={t('privacy.cookies.analyticsDesc')} />
            </ul>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{t('privacy.cookies.manage')}</p>
          </Section>

          {/* Complaint */}
          <Section icon={AlertTriangle} title={t('privacy.complaint.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.complaint.intro')}</p>
            <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 space-y-1 text-gray-700 dark:text-gray-200">
              <p className="font-semibold">{t('privacy.complaint.authority')}</p>
              <p>{t('privacy.complaint.website')}</p>
              <p>{t('privacy.complaint.email')}</p>
            </div>
          </Section>

          {/* Mandatory Info */}
          <Section icon={Info} title={t('privacy.mandatory.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{t('privacy.mandatory.intro')}</p>
            <ul className="space-y-2">
              <ListItem desc={t('privacy.mandatory.required')} />
              <ListItem desc={t('privacy.mandatory.optional')} />
            </ul>
          </Section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('privacy.changes.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('privacy.changes.text')}</p>
          </section>

          {/* Contact */}
          <Section icon={Mail} title={t('privacy.contact.title')}>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('privacy.contact.text')}{' '}
              <a href="mailto:privacy@jobin.se" className="text-teal-600 dark:text-teal-400 hover:underline">
                privacy@jobin.se
              </a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
              {t('privacy.contact.dpo')}{' '}
              <a href="mailto:dpo@jobin.se" className="text-teal-600 dark:text-teal-400 hover:underline">
                dpo@jobin.se
              </a>
            </p>
          </Section>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('privacy.lastUpdated')} {formatDate()}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 dark:bg-stone-950 text-stone-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">&copy; {t('privacy.copyright')}</p>
        </div>
      </footer>
    </div>
  )
}
