/**
 * DocumentSelector Component
 * Allows selecting CV versions and cover letters to attach to an application
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Check, Plus, ChevronDown, ExternalLink, X
} from '@/components/ui/icons'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useDocuments, type CVVersion, type CoverLetter } from '@/hooks/useDocuments'

interface DocumentSelectorProps {
  selectedCVId?: string | null
  selectedCoverLetterId?: string | null
  onSelectCV: (id: string | null) => void
  onSelectCoverLetter: (id: string | null) => void
  companyName?: string
  jobTitle?: string
}

export function DocumentSelector({
  selectedCVId,
  selectedCoverLetterId,
  onSelectCV,
  onSelectCoverLetter,
  companyName,
  jobTitle
}: DocumentSelectorProps) {
  const { cvVersions, coverLetters, isLoading } = useDocuments()
  const [showCVDropdown, setShowCVDropdown] = useState(false)
  const [showLetterDropdown, setShowLetterDropdown] = useState(false)

  const selectedCV = cvVersions.find(cv => cv.id === selectedCVId)
  const selectedLetter = coverLetters.find(l => l.id === selectedCoverLetterId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-12 bg-slate-100 animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* CV Version Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          CV-version
        </label>

        {selectedCV ? (
          <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-900" />
              <span className="font-medium text-brand-900">{selectedCV.name}</span>
              <span className="text-xs text-brand-900">
                {new Date(selectedCV.created_at).toLocaleDateString('sv-SE')}
              </span>
            </div>
            <button
              onClick={() => onSelectCV(null)}
              className="p-1 hover:bg-brand-100 rounded"
            >
              <X className="w-4 h-4 text-brand-900" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowCVDropdown(!showCVDropdown)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">Välj CV-version</span>
              <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform", showCVDropdown && "rotate-180")} />
            </button>

            {showCVDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCVDropdown(false)} />
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                  {cvVersions.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-700 mb-2">Inga CV-versioner sparade</p>
                      <Link
                        to="/cv"
                        className="text-sm text-brand-900 hover:text-brand-900 font-medium"
                      >
                        Skapa CV →
                      </Link>
                    </div>
                  ) : (
                    cvVersions.map(cv => (
                      <button
                        key={cv.id}
                        onClick={() => {
                          onSelectCV(cv.id)
                          setShowCVDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 p-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                      >
                        <FileText className="w-4 h-4 text-slate-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{cv.name}</p>
                          <p className="text-xs text-slate-700">
                            {new Date(cv.created_at).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {cvVersions.length > 0 && !selectedCV && (
          <Link
            to="/cv"
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand-900 hover:text-brand-900"
          >
            <Plus className="w-3 h-3" />
            Skapa ny CV-version
          </Link>
        )}
      </div>

      {/* Cover Letter Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Personligt brev
        </label>

        {selectedLetter ? (
          <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-900" />
              <div>
                <span className="font-medium text-brand-900">
                  {selectedLetter.title || `${selectedLetter.company_name || 'Brev'}`}
                </span>
                {selectedLetter.job_title && (
                  <span className="text-xs text-brand-900 ml-2">
                    ({selectedLetter.job_title})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelectCoverLetter(null)}
              className="p-1 hover:bg-brand-100 rounded"
            >
              <X className="w-4 h-4 text-brand-900" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowLetterDropdown(!showLetterDropdown)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">Välj personligt brev</span>
              <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform", showLetterDropdown && "rotate-180")} />
            </button>

            {showLetterDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLetterDropdown(false)} />
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                  {coverLetters.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-700 mb-2">Inga personliga brev sparade</p>
                      <Link
                        to={`/cover-letter${companyName ? `?company=${encodeURIComponent(companyName)}` : ''}${jobTitle ? `&title=${encodeURIComponent(jobTitle)}` : ''}`}
                        className="text-sm text-brand-900 hover:text-brand-900 font-medium"
                      >
                        Skapa brev →
                      </Link>
                    </div>
                  ) : (
                    coverLetters.map(letter => (
                      <button
                        key={letter.id}
                        onClick={() => {
                          onSelectCoverLetter(letter.id)
                          setShowLetterDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 p-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                      >
                        <FileText className="w-4 h-4 text-slate-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {letter.title || letter.company_name || 'Utan titel'}
                          </p>
                          <p className="text-xs text-slate-700">
                            {letter.job_title && `${letter.job_title} • `}
                            {new Date(letter.created_at).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {coverLetters.length > 0 && !selectedLetter && (
          <Link
            to={`/cover-letter${companyName ? `?company=${encodeURIComponent(companyName)}` : ''}${jobTitle ? `&title=${encodeURIComponent(jobTitle)}` : ''}`}
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand-900 hover:text-brand-900"
          >
            <Plus className="w-3 h-3" />
            Skapa nytt brev för denna ansökan
          </Link>
        )}
      </div>
    </div>
  )
}

export default DocumentSelector
