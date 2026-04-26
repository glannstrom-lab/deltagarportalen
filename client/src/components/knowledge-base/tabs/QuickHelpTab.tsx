/**
 * Quick Help Tab
 * Emergency/urgent help for common job search situations
 * Links to real app features and shows helpful checklists
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock, ChevronRight, Phone, Calendar, FileText, Briefcase, Compass, PenTool } from '@/components/ui/icons'
import { Card } from '@/components/ui'
import type { Article } from '@/types/knowledge'

interface QuickHelpTabProps {
  articles: Article[]
}

export default function QuickHelpTab({ articles }: QuickHelpTabProps) {
  const { t } = useTranslation()

  // Quick action cards that link to real app features
  const quickActions = [
    {
      id: 'cv',
      titleKey: 'knowledgeBase.quickHelp.actions.cv.title',
      descriptionKey: 'knowledgeBase.quickHelp.actions.cv.description',
      icon: FileText,
      link: '/cv',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'cover-letter',
      titleKey: 'knowledgeBase.quickHelp.actions.coverLetter.title',
      descriptionKey: 'knowledgeBase.quickHelp.actions.coverLetter.description',
      icon: PenTool,
      link: '/cover-letter',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'jobs',
      titleKey: 'knowledgeBase.quickHelp.actions.jobs.title',
      descriptionKey: 'knowledgeBase.quickHelp.actions.jobs.description',
      icon: Briefcase,
      link: '/jobs',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'interest',
      titleKey: 'knowledgeBase.quickHelp.actions.interest.title',
      descriptionKey: 'knowledgeBase.quickHelp.actions.interest.description',
      icon: Compass,
      link: '/interest-guide',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ]

  // Static checklists for quick reference
  const quickChecklists = [
    {
      titleKey: 'knowledgeBase.quickHelp.checklists.beforeInterview.title',
      items: [
        'knowledgeBase.quickHelp.checklists.beforeInterview.items.clothes',
        'knowledgeBase.quickHelp.checklists.beforeInterview.items.directions',
        'knowledgeBase.quickHelp.checklists.beforeInterview.items.strengths',
        'knowledgeBase.quickHelp.checklists.beforeInterview.items.questions',
        'knowledgeBase.quickHelp.checklists.beforeInterview.items.documents',
      ],
    },
    {
      titleKey: 'knowledgeBase.quickHelp.checklists.afterInterview.title',
      items: [
        'knowledgeBase.quickHelp.checklists.afterInterview.items.thankYou',
        'knowledgeBase.quickHelp.checklists.afterInterview.items.reflect',
        'knowledgeBase.quickHelp.checklists.afterInterview.items.notes',
        'knowledgeBase.quickHelp.checklists.afterInterview.items.tracker',
      ],
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-rose-50 to-amber-50 border-rose-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('knowledgeBase.quickHelp.title')}
            </h2>
            <p className="text-slate-600 mt-1">
              {t('knowledgeBase.quickHelp.description')}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick actions - link to real app features */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t('knowledgeBase.quickHelp.quickActions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.id}
                to={action.link}
                className={`
                  text-left p-4 rounded-xl border transition-all hover:shadow-md
                  ${action.color}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{t(action.titleKey)}</h4>
                    <p className="text-sm opacity-80 mt-1">
                      {t(action.descriptionKey)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Quick checklists */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t('knowledgeBase.quickHelp.checklists.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickChecklists.map((checklist) => (
            <Card key={checklist.titleKey} className="bg-slate-50">
              <h4 className="font-semibold text-slate-800 mb-3">
                {t(checklist.titleKey)}
              </h4>
              <ul className="space-y-2">
                {checklist.items.map((itemKey, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-slate-300"
                    />
                    <span>{t(itemKey)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Related articles from database */}
      {articles.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t('knowledgeBase.quickHelp.relatedArticles')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.slice(0, 4).map((article) => (
              <Link
                key={article.id}
                to={`/knowledge-base/article/${article.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow h-full">
                  <h4 className="font-medium text-slate-900 hover:text-teal-600">
                    {article.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                  {article.readingTime && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-700">
                      <Clock className="w-3 h-3" />
                      <span>{article.readingTime} min</span>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contact support */}
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              {t('knowledgeBase.quickHelp.needSupport.title')}
            </h3>
            <p className="text-slate-600 mt-1 text-sm">
              {t('knowledgeBase.quickHelp.needSupport.description')}
            </p>
            <Link
              to="/diary"
              className="inline-flex items-center gap-2 mt-3 text-sky-700 font-medium hover:underline"
            >
              {t('knowledgeBase.quickHelp.needSupport.action')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
