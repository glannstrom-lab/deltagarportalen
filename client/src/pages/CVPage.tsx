/**
 * CV Page - Main entry with 5 tabs
 * Clean modern design matching Calendar and AI Team pages
 */

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { cvTabDefs } from '@/data/cvTabs'
import CVBuilder from './CVBuilder'
import JobAdaptPage from './JobAdaptPage'
import { MyCVs } from '@/components/cv/MyCVs'
import { ATSAnalysis } from '@/components/cv/ATSAnalysis'
import { CVTips } from '@/components/cv/CVTips'
import { SaveIndicator } from '@/components/cv/SaveIndicator'
import { FileText } from '@/components/ui/icons'

export default function CVPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Build tabs with translated labels
  const cvTabs = cvTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  // Check if we're on the CV builder page (show save indicator)
  const isBuilderPage = location.pathname === '/cv' || location.pathname === '/cv/'

  // Get current active tab
  const currentPath = location.pathname
  const activeTab = cvTabs.find(tab =>
    tab.path === currentPath ||
    (tab.path === '/cv' && (currentPath === '/cv' || currentPath === '/cv/'))
  )?.id || 'create'

  return (
    <div className="pb-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
                {t('cv.title')}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('cv.subtitle', 'Skapa och optimera ditt CV')}
              </p>
            </div>
          </div>
          {isBuilderPage && <SaveIndicator />}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-x-auto">
          {cvTabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/50 dark:hover:bg-stone-700/50'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<CVBuilder />} />
        <Route path="/my-cvs" element={<MyCVs />} />
        <Route path="/adapt" element={<JobAdaptPage />} />
        <Route path="/ats" element={<ATSAnalysis />} />
        <Route path="/tips" element={<CVTips />} />
        <Route path="*" element={<Navigate to="/cv" replace />} />
      </Routes>
    </div>
  )
}
