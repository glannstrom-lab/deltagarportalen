import { useEffect, useState, useCallback, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { X, MapPin, Briefcase, Clock, DollarSign, Calendar, Heart, Sparkles, Send, Building, Share2, FileDown } from '@/components/ui/icons'
import type { Job } from '@/services/mockApi'
import type { CVData } from '@/services/supabaseApi'
import { jobsApi } from '@/services/api'
import { ShareJobDialog } from './ShareJobDialog'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'

interface JobDetailModalProps {
  job: Job | null
  cvData: CVData
  isOpen: boolean
  onClose: () => void
  isSaved: boolean
  onSave: () => void
  onApply: () => void
}

interface MatchResult {
  matchPercentage: number
  matchingSkills: string[]
  missingSkills: string[]
  suggestions: string[]
}

export function JobDetailModal({ job, cvData, isOpen, onClose, isSaved, onSave, onApply }: JobDetailModalProps) {
  const { t } = useTranslation()
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [_loading, setLoading] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const titleId = useId()

  // Stäng modal med Escape-tangent
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Förhindra scroll på body när modal är öppen
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    if (job && isOpen) {
      analyzeMatch()
    }
  }, [job, isOpen])

  const analyzeMatch = async () => {
    if (!job) return
    setLoading(true)
    try {
      const result = await jobsApi.matchCV(job.id, cvData)
      setMatchResult(result)
    } catch (error) {
      console.error('Match analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !job) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 p-6 flex items-start justify-between">
          <div>
            <h2 id={titleId} className="text-2xl font-bold text-stone-800 dark:text-stone-100">{job.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-stone-600 dark:text-stone-400">
              <Building size={16} />
              {job.company}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
            aria-label={t('jobs.modal.closeDialog')}
          >
            <X size={20} className="text-stone-700 dark:text-stone-300" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          {/* Match score */}
          {matchResult && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#4f46e5]/10 to-purple-50 rounded-xl border border-[#4f46e5]/20">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#4f46e5]">{matchResult.matchPercentage}%</div>
                  <div className="text-xs text-stone-600">{t('jobs.modal.match')}</div>
                </div>
                <div className="flex-1">
                  {matchResult.matchingSkills.length > 0 && (
                    <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                      ✅ {t('jobs.modal.matchingSkills')}: {matchResult.matchingSkills.join(', ')}
                    </p>
                  )}
                  {matchResult.missingSkills.length > 0 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      ⚠️ {t('jobs.modal.missingSkills')}: {matchResult.missingSkills.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              {matchResult.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#4f46e5]/20">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t('jobs.modal.suggestionsForBetterMatch')}:</p>
                  <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                    {matchResult.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Job details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <MapPin size={18} className="text-[#4f46e5]" />
              {job.location}
            </div>
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <Briefcase size={18} className="text-[#4f46e5]" />
              {job.employmentType}
            </div>
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <Clock size={18} className="text-[#4f46e5]" />
              {job.experienceLevel}
            </div>
            {job.salaryRange && (
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                <DollarSign size={18} className="text-[#4f46e5]" />
                {job.salaryRange}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">{t('jobs.modal.aboutPosition')}</h3>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">{t('jobs.modal.requirements')}</h3>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((req, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full text-sm"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-stone-700 dark:text-stone-300 mb-6">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {t('jobs.modal.published')}: {new Date(job.publishedDate || job.publishedAt || Date.now()).toLocaleDateString('sv-SE')}
            </div>
            {job.deadline && (
              <div className="flex items-center gap-1 text-red-500">
                <Calendar size={14} />
                {t('jobs.modal.applicationDeadline')}: {new Date(job.deadline).toLocaleDateString('sv-SE')}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 p-6 flex gap-3 flex-wrap">
          <button
            onClick={onSave}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
              isSaved
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
            }`}
          >
            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? t('jobs.modal.saved') : t('jobs.modal.save')}
          </button>
          
          {/* Dela med konsulent */}
          <button
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-2 px-4 py-3 border-2 border-[var(--c-accent)]/60 text-[var(--c-text)] rounded-xl hover:bg-[var(--c-bg)] transition-colors"
          >
            <Share2 size={18} />
            {t('jobs.modal.share')}
          </button>
          
          {/* PDF Export */}
          {job && (
            <PDFExportButton
              type="job"
              data={{
                headline: job.title,
                description: { text: job.description },
                employer: { name: job.company },
                workplace_address: {
                  municipality: job.location,
                  region: '',
                },
                employment_type: { label: job.employmentType },
                application_details: { url: job.url },
                publication_date: job.publishedDate || new Date().toISOString(),
                last_publication_date: job.deadline,
              }}
              variant="outline"
              size="md"
              showPreview={false}
            />
          )}
          
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] transition-colors"
          >
            <Sparkles size={18} />
            {t('jobs.modal.createAIApplication')}
          </button>
          
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <Send size={18} />
            {t('jobs.modal.apply')}
          </a>
        </div>
      </div>

      {/* Share Job Dialog */}
      {job && (
        <ShareJobDialog
          jobId={job.id}
          jobData={{
            headline: job.title,
            employer: { name: job.company },
            description: job.description,
            workplace_address: { 
              municipality: job.location, 
              region: '' 
            },
            application_details: { url: job.url },
          }}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          onShared={() => {
            setShowShareDialog(false)
          }}
        />
      )}
    </div>
  )
}
