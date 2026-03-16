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
} from 'lucide-react'

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
      description={t('helpPage.description')}
      showTabs={false}
    >
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-violet-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('help.title')}</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          {t('helpPage.intro')}
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {quickLinkDefs.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.titleKey}
              to={item.link}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-violet-200 transition-all text-center"
            >
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-medium text-slate-800 text-sm">{t(item.titleKey)}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t(item.descKey)}</p>
            </Link>
          )
        })}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {faqCategoryDefs.map((category) => {
          const Icon = category.icon
          return (
            <section key={category.titleKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <Icon className="w-5 h-5 text-violet-600" />
                <h2 className="font-semibold text-slate-800">{t(category.titleKey)}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {category.items.map((item, index) => (
                  <div key={index} className="p-6">
                    <h3 className="font-medium text-slate-800 mb-2">{t(item.qKey)}</h3>
                    <p className="text-slate-600 text-sm mb-3">{t(item.aKey)}</p>
                    {item.link && (
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium"
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
      <section className="mt-10 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              {t('helpPage.noAnswer')}
            </h2>
            <p className="text-slate-600 mb-4">
              {t('helpPage.contactConsultant')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                to="/diary"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {t('helpPage.bookMeeting')}
              </Link>
              <a
                href="mailto:support@jobin.se"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t('helpPage.emailSupport')}
              </a>
            </div>
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <MessageCircle className="w-8 h-8 text-violet-600" />
          </div>
        </div>
      </section>

      {/* Version Info */}
      <div className="mt-10 text-center text-sm text-slate-400">
        <p>{t('helpPage.version')}</p>
      </div>
    </div>
    </PageLayout>
  )
}
