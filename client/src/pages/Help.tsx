import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import {
  HelpCircle,
  BookOpen,
  Mail,
  MessageCircle,
  ChevronRight,
  Search,
  FileText,
  Briefcase,
  Target,
  Compass,
  LucideIcon
} from '@/components/ui/icons'

interface FaqItem {
  qKey: string
  aKey: string
  link: string
}

interface FaqCategory {
  titleKey: string
  icon: LucideIcon
  items: FaqItem[]
}

const faqCategoryDefs: FaqCategory[] = [
  {
    titleKey: 'helpPage.categories.gettingStarted',
    icon: BookOpen,
    items: [
      { qKey: 'helpPage.faq.createCV.q', aKey: 'helpPage.faq.createCV.a', link: '/cv' },
      { qKey: 'helpPage.faq.interestGuide.q', aKey: 'helpPage.faq.interestGuide.a', link: '/interest-guide' },
      { qKey: 'helpPage.faq.saveJobs.q', aKey: 'helpPage.faq.saveJobs.a', link: '/job-search' },
    ]
  },
  {
    titleKey: 'helpPage.categories.cvCoverLetter',
    icon: FileText,
    items: [
      { qKey: 'helpPage.faq.multipleCVs.q', aKey: 'helpPage.faq.multipleCVs.a', link: '/cv' },
      { qKey: 'helpPage.faq.aiWriter.q', aKey: 'helpPage.faq.aiWriter.a', link: '/cover-letter' },
      { qKey: 'helpPage.faq.atsAnalysis.q', aKey: 'helpPage.faq.atsAnalysis.a', link: '/cv' },
    ]
  },
  {
    titleKey: 'helpPage.categories.jobSearch',
    icon: Briefcase,
    items: [
      { qKey: 'helpPage.faq.howToSearch.q', aKey: 'helpPage.faq.howToSearch.a', link: '/job-search' },
      { qKey: 'helpPage.faq.saveVsApply.q', aKey: 'helpPage.faq.saveVsApply.a', link: '/job-search' },
      { qKey: 'helpPage.faq.jobAlerts.q', aKey: 'helpPage.faq.jobAlerts.a', link: '/settings' },
    ]
  },
  {
    titleKey: 'helpPage.categories.careerDevelopment',
    icon: Target,
    items: [
      { qKey: 'helpPage.faq.knowledgeBase.q', aKey: 'helpPage.faq.knowledgeBase.a', link: '/knowledge-base' },
      { qKey: 'helpPage.faq.exercises.q', aKey: 'helpPage.faq.exercises.a', link: '/exercises' },
      { qKey: 'helpPage.faq.saveArticles.q', aKey: 'helpPage.faq.saveArticles.a', link: '/resources' },
    ]
  },
]

interface QuickLink {
  titleKey: string
  descKey: string
  icon: LucideIcon
  link: string
}

const quickLinkDefs: QuickLink[] = [
  { titleKey: 'nav.knowledgeBase', descKey: 'helpPage.quickLinks.articlesGuides', icon: BookOpen, link: '/dashboard/knowledge-base' },
  { titleKey: 'nav.interestGuide', descKey: 'helpPage.quickLinks.findCareer', icon: Compass, link: '/dashboard/interest-guide' },
  { titleKey: 'cv.createCV', descKey: 'helpPage.quickLinks.buildCV', icon: FileText, link: '/cv' },
  { titleKey: 'nav.jobSearch', descKey: 'helpPage.quickLinks.findJobs', icon: Briefcase, link: '/job-search' },
]

export default function Help() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title={t('help.title')}
      description={t('helpPage.intro')}
      showTabs={false}
    >
    <div className="max-w-4xl mx-auto">
      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {quickLinkDefs.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.titleKey}
              to={item.link}
              className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover: hover:border-brand-200 dark:hover:border-brand-900 transition-all text-center"
            >
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-brand-900 dark:text-brand-400" />
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-100 text-sm">{t(item.titleKey)}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{t(item.descKey)}</p>
            </Link>
          )
        })}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {faqCategoryDefs.map((category) => {
          const Icon = category.icon
          return (
            <section key={category.titleKey} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-brand-700 to-brand-900 dark:from-brand-900 dark:to-brand-900 flex items-center gap-3">
                <Icon className="w-5 h-5 text-white" />
                <h2 className="font-semibold text-white">{t(category.titleKey)}</h2>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {category.items.map((item, index) => (
                  <div key={index} className="p-6">
                    <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">{t(item.qKey)}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{t(item.aKey)}</p>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-sm text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-medium"
                      >
                        {t('helpPage.goTo', { section: t(category.titleKey).toLowerCase() })}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Contact Section */}
      <section className="mt-10 bg-gradient-to-br from-brand-50 to-cyan-50 dark:from-brand-900/20 dark:to-cyan-900/20 rounded-xl border border-brand-100 dark:border-brand-900 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t('helpPage.noAnswer')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('helpPage.contactConsultant')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                to="/diary"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 dark:bg-brand-900 text-white rounded-lg font-medium hover:bg-brand-900 dark:hover:bg-brand-900 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {t('helpPage.bookMeeting')}
              </Link>
              <a
                href="mailto:support@jobin.se"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-700 text-gray-700 dark:text-gray-200 border border-stone-200 dark:border-stone-600 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t('helpPage.emailSupport')}
              </a>
            </div>
          </div>
          <div className="w-16 h-16 bg-white dark:bg-stone-700 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-brand-900 dark:text-brand-400" />
          </div>
        </div>
      </section>

      {/* Version Info */}
      <div className="mt-10 text-center text-sm text-gray-600 dark:text-gray-300">
        <p>{t('helpPage.version')}</p>
      </div>
    </div>
    </PageLayout>
  )
}
