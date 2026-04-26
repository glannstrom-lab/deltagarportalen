import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileText, Scale, Users, AlertCircle, CheckCircle } from '@/components/ui/icons'

export default function Terms() {
  const { t, i18n } = useTranslation()

  const formatDate = () => {
    const locale = i18n.language === 'en' ? 'en-US' : 'sv-SE'
    return new Date().toLocaleDateString(locale)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 page-transition">
      {/* Header */}
      <nav className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
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
              {t('terms.backToHome')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('terms.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('terms.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-8 lg:p-12 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {t('terms.acceptance.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.acceptance.text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {t('terms.account.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {t('terms.account.intro')}
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.account.truthful')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.account.password')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.account.notify')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.account.oneAccount')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
              <Scale className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {t('terms.usage.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {t('terms.usage.intro')}
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.usage.illegal')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.usage.false')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.usage.harass')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.usage.hack')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.usage.bots')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {t('terms.content.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {t('terms.content.intro')}
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.content.ownership')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.content.license')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-2 flex-shrink-0" />
                <span>{t('terms.content.rights')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {t('terms.liability.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.liability.text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('terms.termination.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.termination.text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('terms.contact.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.contact.text')}{' '}
              <a href="mailto:support@jobin.se" className="text-teal-600 dark:text-teal-400 hover:underline">
                support@jobin.se
              </a>
            </p>
          </section>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('terms.lastUpdated')} {formatDate()}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 dark:bg-stone-950 text-stone-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            &copy; {t('terms.copyright')}
          </p>
        </div>
      </footer>
    </div>
  )
}
