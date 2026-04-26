/**
 * Cover Letter Page - Main entry with 5 tabs
 * Clean modern design matching CV page
 */

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { coverLetterTabDefs } from '@/data/coverLetterTabs'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'
import { CoverLetterWrite } from '@/components/cover-letter/CoverLetterWrite'
import { CoverLetterMyLetters } from '@/components/cover-letter/CoverLetterMyLetters'
import { CoverLetterTemplates } from '@/components/cover-letter/CoverLetterTemplates'
import { Mail } from '@/components/ui/icons'

export default function CoverLetterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Build tabs with translated labels
  const coverLetterTabs = coverLetterTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey),
  }))

  // Get current active tab
  const currentPath = location.pathname
  const activeTab = coverLetterTabs.find(tab =>
    tab.path === currentPath ||
    (tab.path === '/cover-letter' && (currentPath === '/cover-letter' || currentPath === '/cover-letter/'))
  )?.id || 'write'

  return (
    <>
      <div className="pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">
                {t('coverLetter.title', 'Personligt brev')}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('coverLetter.description', 'Skapa professionella personliga brev som öppnar dörrar till nya möjligheter')}
              </p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-x-auto">
            {coverLetterTabs.map((tab) => {
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
          <Route path="/" element={<CoverLetterWrite />} />
          <Route path="/my-letters" element={<CoverLetterMyLetters />} />
          <Route path="/templates" element={<CoverLetterTemplates />} />
          <Route path="*" element={<Navigate to="/cover-letter" replace />} />
        </Routes>
      </div>
      <HelpButton content={helpContent.coverLetter} />
    </>
  )
}
