/**
 * Tools Tab
 * Links to actual app features and tools
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Wrench,
  FileText,
  PenTool,
  Briefcase,
  Compass,
  ArrowRight,
  Calendar,
  User
} from '@/components/ui/icons'
import { Card } from '@/components/ui'

interface AppTool {
  id: string
  titleKey: string
  descriptionKey: string
  icon: React.ElementType
  link: string
  color: string
  iconColor: string
}

const appTools: AppTool[] = [
  {
    id: 'cv-builder',
    titleKey: 'knowledgeBase.tools.cvBuilder.title',
    descriptionKey: 'knowledgeBase.tools.cvBuilder.description',
    icon: FileText,
    link: '/cv',
    color: 'bg-violet-50 border-violet-100',
    iconColor: 'bg-violet-100 text-violet-600',
  },
  {
    id: 'cover-letter',
    titleKey: 'knowledgeBase.tools.coverLetter.title',
    descriptionKey: 'knowledgeBase.tools.coverLetter.description',
    icon: PenTool,
    link: '/cover-letter',
    color: 'bg-emerald-50 border-emerald-100',
    iconColor: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'job-search',
    titleKey: 'knowledgeBase.tools.jobSearch.title',
    descriptionKey: 'knowledgeBase.tools.jobSearch.description',
    icon: Briefcase,
    link: '/jobs',
    color: 'bg-blue-50 border-blue-100',
    iconColor: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'interest-guide',
    titleKey: 'knowledgeBase.tools.interestGuide.title',
    descriptionKey: 'knowledgeBase.tools.interestGuide.description',
    icon: Compass,
    link: '/interest-guide',
    color: 'bg-amber-50 border-amber-100',
    iconColor: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'diary',
    titleKey: 'knowledgeBase.tools.diary.title',
    descriptionKey: 'knowledgeBase.tools.diary.description',
    icon: Calendar,
    link: '/diary',
    color: 'bg-rose-50 border-rose-100',
    iconColor: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'profile',
    titleKey: 'knowledgeBase.tools.profile.title',
    descriptionKey: 'knowledgeBase.tools.profile.description',
    icon: User,
    link: '/settings',
    color: 'bg-slate-50 border-slate-200',
    iconColor: 'bg-slate-100 text-slate-600',
  },
]

export default function ToolsTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('knowledgeBase.tools.title')}
            </h2>
            <p className="text-slate-600 mt-1">
              {t('knowledgeBase.tools.description')}
            </p>
          </div>
        </div>
      </Card>

      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appTools.map((tool) => {
          const Icon = tool.icon

          return (
            <Link
              key={tool.id}
              to={tool.link}
              className="block"
            >
              <Card
                className={`group hover:shadow-lg transition-all h-full ${tool.color}`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {t(tool.titleKey)}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {t(tool.descriptionKey)}
                  </p>
                </div>

                {/* Link indicator */}
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                  {t('knowledgeBase.tools.goTo')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
