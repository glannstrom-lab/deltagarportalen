/**
 * JobAdaptPage - Standalone page for adapting CV to job ads
 * Accessible via /cv/adapt tab
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cvApi } from '@/services/api'
import { JobAdaptPanel } from '@/components/cv/JobAdaptPanel'
import { showToast } from '@/components/Toast'
import { Loader2, FileText, ArrowRight } from '@/components/ui/icons'
import { Link } from 'react-router-dom'
import type { CVData } from '@/services/supabaseApi'

export default function JobAdaptPage() {
  const { t } = useTranslation()
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCV()
  }, [])

  const loadCV = async () => {
    try {
      const cv = await cvApi.getCV()
      setCvData(cv)
    } catch (e) {
      console.error('Failed to load CV:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = (skillName: string) => {
    if (!cvData) return

    const newSkill = {
      id: Date.now().toString(),
      name: skillName,
      level: 3,
      category: 'technical' as const
    }

    const updatedData = {
      ...cvData,
      skills: [...(cvData.skills || []), newSkill]
    }

    setCvData(updatedData)

    // Save to backend
    cvApi.updateCV(updatedData).then(() => {
      showToast.success(t('cv.jobAdapt.skillAdded', 'Kompetens tillagd: {{skill}}', { skill: skillName }))
    }).catch(() => {
      showToast.error(t('common.error', 'Något gick fel'))
    })
  }

  const handleUpdateSummary = (summary: string) => {
    if (!cvData) return

    const updatedData = { ...cvData, summary }
    setCvData(updatedData)

    // Save to backend
    cvApi.updateCV(updatedData).then(() => {
      showToast.success(t('cv.jobAdapt.summaryUpdated', 'Sammanfattning uppdaterad'))
    }).catch(() => {
      showToast.error(t('common.error', 'Något gick fel'))
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-900" />
          <span className="text-stone-600 dark:text-stone-400">
            {t('common.loading', 'Laddar...')}
          </span>
        </div>
      </div>
    )
  }

  // No CV data - show message to create CV first
  if (!cvData || (!cvData.firstName && !cvData.summary && cvData.skills?.length === 0)) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-brand-900 dark:text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            {t('cv.jobAdapt.noCVTitle', 'Skapa ett CV först')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            {t('cv.jobAdapt.noCVDescription', 'Du behöver ett CV innan du kan anpassa det för specifika jobb. Börja med att skapa ditt CV.')}
          </p>
          <Link
            to="/cv"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-xl hover:bg-brand-900 transition-colors font-medium"
          >
            {t('cv.jobAdapt.createCV', 'Skapa CV')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-2">
          {t('cv.jobAdapt.pageTitle', 'Anpassa ditt CV för jobbannonser')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400">
          {t('cv.jobAdapt.pageDescription', 'Klistra in en jobbannons nedan för att få förslag på hur du kan optimera ditt CV för just det jobbet.')}
        </p>
      </div>

      {/* Job Adapt Panel - Full width version */}
      <JobAdaptPanel
        cvData={cvData}
        onAddSkill={handleAddSkill}
        onUpdateSummary={handleUpdateSummary}
        className="w-full"
        defaultExpanded={true}
      />

      {/* Current CV Summary */}
      <div className="mt-8 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">
          {t('cv.jobAdapt.currentCV', 'Ditt nuvarande CV')}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">
              {t('cv.jobAdapt.name', 'Namn')}
            </p>
            <p className="font-medium text-stone-800 dark:text-stone-200">
              {cvData.firstName} {cvData.lastName}
            </p>
          </div>

          <div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">
              {t('cv.jobAdapt.jobTitle', 'Titel')}
            </p>
            <p className="font-medium text-stone-800 dark:text-stone-200">
              {cvData.title || '-'}
            </p>
          </div>
        </div>

        {cvData.skills && cvData.skills.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
              {t('cv.jobAdapt.skills', 'Kompetenser')} ({cvData.skills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {cvData.skills.slice(0, 10).map((skill) => (
                <span
                  key={skill.id}
                  className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300 rounded-full text-sm"
                >
                  {skill.name}
                </span>
              ))}
              {cvData.skills.length > 10 && (
                <span className="px-3 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full text-sm">
                  +{cvData.skills.length - 10} {t('common.more', 'till')}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
          <Link
            to="/cv"
            className="text-brand-900 dark:text-brand-400 hover:underline text-sm font-medium"
          >
            {t('cv.jobAdapt.editCV', 'Redigera CV')} &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
