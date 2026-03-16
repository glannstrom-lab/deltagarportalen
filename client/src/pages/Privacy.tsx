import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Shield, Lock, Eye, FileText, Trash2, Mail } from 'lucide-react'

export default function Privacy() {
  const { t, i18n } = useTranslation()

  const formatDate = () => {
    const locale = i18n.language === 'en' ? 'en-US' : 'sv-SE'
    return new Date().toLocaleDateString(locale)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
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
              {t('privacy.backToHome')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{t('privacy.title')}</h1>
          <p className="text-slate-600">{t('privacy.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-600" />
              {t('privacy.whatWeCollect.title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              {t('privacy.whatWeCollect.intro')}
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.whatWeCollect.contact')}</strong> {t('privacy.whatWeCollect.contactDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.whatWeCollect.profile')}</strong> {t('privacy.whatWeCollect.profileDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.whatWeCollect.activity')}</strong> {t('privacy.whatWeCollect.activityDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.whatWeCollect.usage')}</strong> {t('privacy.whatWeCollect.usageDesc')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-600" />
              {t('privacy.howWeProtect.title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              {t('privacy.howWeProtect.intro')}
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeProtect.ssl')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeProtect.hash')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeProtect.audits')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeProtect.access')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              {t('privacy.howWeUse.title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              {t('privacy.howWeUse.intro')}
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeUse.manage')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeUse.personalize')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeUse.recommend')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span>{t('privacy.howWeUse.improve')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-indigo-600" />
              {t('privacy.yourRights.title')}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              {t('privacy.yourRights.intro')}
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.yourRights.access')}</strong> {t('privacy.yourRights.accessDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.yourRights.correction')}</strong> {t('privacy.yourRights.correctionDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.yourRights.deletion')}</strong> {t('privacy.yourRights.deletionDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <span><strong>{t('privacy.yourRights.portability')}</strong> {t('privacy.yourRights.portabilityDesc')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-indigo-600" />
              {t('privacy.contact.title')}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {t('privacy.contact.text')}{' '}
              <a href="mailto:support@jobin.se" className="text-indigo-600 hover:underline">
                support@jobin.se
              </a>
            </p>
          </section>

          <div className="border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-500">
              {t('privacy.lastUpdated')} {formatDate()}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            &copy; {t('privacy.copyright')}
          </p>
        </div>
      </footer>
    </div>
  )
}
