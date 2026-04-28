import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mail,
  FileText,
  Clock,
  Plus,
  Copy,
  ArrowRight,
  Send,
  CheckCircle2,
  Edit3,
  TrendingUp,
  Sparkles,
  Target,
  Briefcase,
  Zap,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  Trash2
} from '@/components/ui/icons'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface CoverLetterWidgetProps {
  count: number
  recentLetters?: { id: string; title: string; company: string; createdAt: string }[]
  applicationsCount?: number
  applicationsStatus?: {
    applied: number
    interview: number
    offer: number
  }
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// Pipeline step configuration with translation keys
const pipelineSteps = [
  {
    key: 'applied',
    labelKey: 'coverLetterWidget.pipeline.applied',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Send
  },
  {
    key: 'interview',
    labelKey: 'coverLetterWidget.pipeline.interview',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Target
  },
  {
    key: 'offer',
    labelKey: 'coverLetterWidget.pipeline.offer',
    color: 'emerald',
    gradient: 'from-emerald-500 to-[var(--c-solid)]',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2
  },
]

// Hook for relative date formatting
const useRelativeDate = () => {
  const { t, i18n } = useTranslation()

  return (dateString: string): { text: string; color: string } => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 5) return { text: t('coverLetterWidget.time.justNow'), color: 'text-emerald-600' }
    if (diffMins < 60) return { text: t('coverLetterWidget.time.minAgo', { count: diffMins }), color: 'text-emerald-600' }
    if (diffHours < 2) return { text: t('coverLetterWidget.time.hourAgo'), color: 'text-emerald-600' }
    if (diffHours < 24) return { text: t('coverLetterWidget.time.hoursAgo', { count: diffHours }), color: 'text-stone-700 dark:text-stone-300' }
    if (diffDays === 0) return { text: t('coverLetterWidget.time.today'), color: 'text-blue-600' }
    if (diffDays === 1) return { text: t('coverLetterWidget.time.yesterday'), color: 'text-stone-600 dark:text-stone-400' }
    if (diffDays < 7) return { text: t('coverLetterWidget.time.daysAgo', { count: diffDays }), color: 'text-stone-700 dark:text-stone-300' }
    if (diffDays < 30) return { text: t('coverLetterWidget.time.weeksAgo', { count: Math.floor(diffDays / 7) }), color: 'text-stone-600 dark:text-stone-400' }
    const locale = i18n.language === 'en' ? 'en-US' : 'sv-SE'
    return { text: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }), color: 'text-stone-600 dark:text-stone-400' }
  }
}

// SMALL - Ultra kompakt
function CoverLetterWidgetSmall({ count, applicationsCount = 0, loading, error, onRetry }: Omit<CoverLetterWidgetProps, 'size' | 'recentLetters' | 'applicationsStatus'>) {
  const { t } = useTranslation()
  const getStatus = (): WidgetStatus => {
    if (count === 0 && applicationsCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const totalActivity = count + applicationsCount

  return (
    <DashboardWidget
      title={t('coverLetterWidget.letters')}
      icon={<Mail size={14} />}
      to="/cover-letter"
      color="rose"
      status={status}
      progress={totalActivity > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        <Mail size={14} className="text-rose-500" />
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-stone-800 dark:text-stone-100">{count}</span>
          <span className="text-xs text-stone-700 dark:text-stone-300">
            {t('coverLetterWidget.lettersCount', { count })}
          </span>
        </div>
        {applicationsCount > 0 && (
          <span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded ml-1">
            {t('coverLetterWidget.applicationsShort', { count: applicationsCount })}
          </span>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Enhanced with pipeline badges and letter list
function CoverLetterWidgetMedium({ count, recentLetters = [], applicationsCount = 0, applicationsStatus, loading, error, onRetry }: CoverLetterWidgetProps) {
  const { t } = useTranslation()
  const formatRelativeDate = useRelativeDate()
  const getStatus = (): WidgetStatus => {
    if (count === 0 && applicationsCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title={t('coverLetterWidget.coverLettersAndApplications')}
      icon={<Mail size={20} className="text-rose-600" />}
      to="/cover-letter"
      color="rose"
      status={status}
      progress={count > 0 || applicationsCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: t('coverLetterWidget.createNewLetter'),
      }}
    >
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl border border-rose-100">
            <div className="w-12 h-12 bg-white dark:bg-stone-900 rounded-xl flex items-center justify-center shadow-sm">
              <FileText size={22} className="text-rose-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{count}</p>
              <p className="text-xs text-stone-700 dark:text-stone-300">{t('coverLetterWidget.savedLetters', { count })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
            <div className="w-12 h-12 bg-white dark:bg-stone-900 rounded-xl flex items-center justify-center shadow-sm">
              <Briefcase size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{applicationsCount}</p>
              <p className="text-xs text-stone-700 dark:text-stone-300">{t('coverLetterWidget.applications', { count: applicationsCount })}</p>
            </div>
          </div>
        </div>

        {/* Pipeline Status */}
        {applicationsStatus && applicationsCount > 0 && (
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} />
              {t('coverLetterWidget.applicationPipeline')}
            </p>
            <div className="flex gap-2">
              {pipelineSteps.map((step) => {
                const value = applicationsStatus[step.key as keyof typeof applicationsStatus] || 0
                if (value === 0) return null
                const Icon = step.icon
                return (
                  <div
                    key={step.key}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 ${step.bg} rounded-lg border ${step.border}`}
                  >
                    <Icon size={14} className={step.text} />
                    <div>
                      <p className={`text-sm font-bold ${step.text}`}>{value}</p>
                      <p className="text-xs text-stone-700 dark:text-stone-300">{t(step.labelKey)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Letters */}
        {recentLetters.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} />
              {t('coverLetterWidget.recentLetters')}
            </p>
            <div className="space-y-2">
              {recentLetters.slice(0, 2).map((letter) => {
                const dateInfo = formatRelativeDate(letter.createdAt)
                return (
                  <div
                    key={letter.id}
                    className="group flex items-center gap-3 p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                      <FileText size={16} className="text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate group-hover:text-rose-700 transition-colors">
                        {letter.title}
                      </p>
                      <p className="text-xs text-stone-700 dark:text-stone-300 truncate">{letter.company}</p>
                    </div>
                    <span className={`text-xs font-medium ${dateInfo.color}`}>{dateInfo.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {count === 0 && applicationsCount === 0 && (
          <div className="relative overflow-hidden p-4 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-xl border border-rose-100">
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 bg-white dark:bg-stone-900 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Sparkles size={20} className="text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-900">{t('coverLetterWidget.createPersonalLetters')}</p>
                <p className="text-xs text-rose-700/80 mt-1 leading-relaxed">
                  {t('coverLetterWidget.wellWrittenLetterTip')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full featured with visual pipeline and enhanced letter cards
function CoverLetterWidgetLarge({ count, recentLetters = [], applicationsCount = 0, applicationsStatus, loading, error, onRetry }: CoverLetterWidgetProps) {
  const { t } = useTranslation()
  const formatRelativeDate = useRelativeDate()
  const getStatus = (): WidgetStatus => {
    if (count === 0 && applicationsCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (e: React.MouseEvent, letterId: string) => {
    e.stopPropagation()
    setCopiedId(letterId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <DashboardWidget
      title={t('coverLetterWidget.coverLettersAndApplications')}
      icon={<Mail size={22} className="text-rose-600" />}
      to="/cover-letter"
      color="rose"
      status={status}
      progress={count > 0 || applicationsCount > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: t('coverLetterWidget.createNewLetter'),
      }}
    >
      <div className="space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Letters Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-5 text-white">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-stone-900/20 backdrop-blur-sm flex items-center justify-center">
                <FileText size={32} className="text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold">{count}</p>
                <p className="text-sm text-white/80 font-medium mt-1">
                  {t('coverLetterWidget.savedLetters', { count })}
                </p>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white dark:bg-stone-900/10" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white dark:bg-stone-900/5" />
          </div>

          {/* Applications Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-stone-900/20 backdrop-blur-sm flex items-center justify-center">
                <Briefcase size={32} className="text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold">{applicationsCount}</p>
                <p className="text-sm text-white/80 font-medium mt-1">
                  {t('coverLetterWidget.registeredApplications', { count: applicationsCount })}
                </p>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white dark:bg-stone-900/10" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white dark:bg-stone-900/5" />
          </div>
        </div>

        {/* Visual Pipeline */}
        {applicationsCount > 0 && applicationsStatus && (
          <div className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-rose-500" />
              {t('coverLetterWidget.yourApplicationJourney')}
            </p>

            {/* Pipeline Steps */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-8 left-12 right-12 h-1 bg-stone-200 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((applicationsStatus.interview + applicationsStatus.offer) / Math.max(1, applicationsCount)) * 100)}%`
                  }}
                />
              </div>

              {/* Steps */}
              <div className="relative grid grid-cols-3 gap-4">
                {pipelineSteps.map((step, index) => {
                  const value = applicationsStatus[step.key as keyof typeof applicationsStatus] || 0
                  const Icon = step.icon
                  const isActive = value > 0

                  return (
                    <div key={step.key} className="text-center">
                      <div className={`
                        relative w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-2
                        transition-all duration-300
                        ${isActive
                          ? `bg-gradient-to-br ${step.gradient} text-white shadow-lg shadow-${step.color}-200`
                          : 'bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                        }
                      `}>
                        <Icon size={28} />
                        {/* Badge count */}
                        <div className={`
                          absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md
                          ${isActive ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}
                        `}>
                          {value}
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${isActive ? step.text : 'text-stone-600 dark:text-stone-400'}`}>
                        {t(step.labelKey)}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                        {t(`coverLetterWidget.pipelineSubtext.${index === 0 ? 'sent' : index === 1 ? 'inProgress' : 'goal'}`)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 hover:border-rose-300 hover:bg-rose-50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
              <Plus size={24} className="text-rose-600" />
            </div>
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-rose-700">{t('coverLetterWidget.newLetter')}</span>
          </button>

          <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 hover:border-orange-300 hover:bg-orange-50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Send size={24} className="text-orange-600" />
            </div>
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-orange-700">{t('coverLetterWidget.registerApplication')}</span>
          </button>

          <button className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 hover:border-amber-300 hover:bg-amber-50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Target size={24} className="text-amber-600" />
            </div>
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-amber-700">{t('coverLetterWidget.updateStatus')}</span>
          </button>
        </div>

        {/* Letters List */}
        {recentLetters.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <FileText size={16} className="text-rose-500" />
                {t('coverLetterWidget.yourRecentLetters')}
              </p>
              <span className="text-xs text-stone-600 dark:text-stone-400">{t('coverLetterWidget.totalCount', { count })}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {recentLetters.slice(0, 4).map((letter) => {
                const dateInfo = formatRelativeDate(letter.createdAt)
                const isHovered = hoveredLetter === letter.id
                const isCopied = copiedId === letter.id
                
                return (
                  <div 
                    key={letter.id}
                    className="group relative p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredLetter(letter.id)}
                    onMouseLeave={() => setHoveredLetter(null)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-rose-100 group-hover:to-orange-100 transition-all">
                        <FileText size={18} className="text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 truncate group-hover:text-rose-700 transition-colors">
                          {letter.title}
                        </p>
                        <p className="text-xs text-stone-700 dark:text-stone-300 truncate">{letter.company}</p>
                        <p className={`text-xs font-medium mt-1 ${dateInfo.color}`}>
                          {dateInfo.text}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className={`
                      absolute top-2 right-2 flex items-center gap-1
                      transition-opacity duration-200
                      ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}>
                      <button 
                        onClick={(e) => handleCopy(e, letter.id)}
                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-100 text-stone-700 dark:text-stone-300 hover:text-rose-600 transition-colors"
                        title={t('coverLetterWidget.actions.copy')}
                      >
                        {isCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button 
                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-blue-100 text-stone-700 dark:text-stone-300 hover:text-blue-600 transition-colors"
                        title={t('coverLetterWidget.actions.edit')}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-orange-100 text-stone-700 dark:text-stone-300 hover:text-orange-600 transition-colors"
                        title={t('coverLetterWidget.actions.send')}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                    
                    {/* Arrow indicator */}
                    <ChevronRight 
                      size={16} 
                      className="absolute bottom-2 right-2 text-stone-300 group-hover:text-rose-400 transition-colors" 
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Empty State with CTA */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 p-6 text-white">
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white dark:bg-stone-900/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold mb-2">{t('coverLetterWidget.createFirstLetter')}</p>
                  <p className="text-sm text-white/80 leading-relaxed max-w-md">
                    {t('coverLetterWidget.createFirstLetterDescription')}
                  </p>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="flex items-center gap-1.5 text-xs bg-white dark:bg-stone-900/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} />
                      {t('coverLetterWidget.benefits.templates')}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs bg-white dark:bg-stone-900/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} />
                      {t('coverLetterWidget.benefits.quickAndEasy')}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs bg-white dark:bg-stone-900/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} />
                      {t('coverLetterWidget.benefits.saveAndReuse')}
                    </span>
                  </div>

                  {/* CTA Button */}
                  <button className="mt-5 px-5 py-2.5 bg-white dark:bg-stone-900 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-colors shadow-lg flex items-center gap-2">
                    <Plus size={18} />
                    {t('coverLetterWidget.createNewLetter')}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-stone-900/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white dark:bg-stone-900/5 rounded-full translate-y-1/2 -translate-x-1/3" />
          </div>
        )}

        {/* Tips Section */}
        {count > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl border border-rose-100">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-900 mb-0.5">{t('coverLetterWidget.tips.tipTitle')}</p>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {t('coverLetterWidget.tips.customizeTip')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <Target size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-0.5">{t('coverLetterWidget.tips.nextStepTitle')}</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {t('coverLetterWidget.tips.nextStepDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Main component
export const CoverLetterWidget = memo(function CoverLetterWidget(props: CoverLetterWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <CoverLetterWidgetLarge {...rest} />
    case 'medium':
      return <CoverLetterWidgetMedium {...rest} />
    case 'small':
    default:
      return <CoverLetterWidgetSmall {...rest} />
  }
})
