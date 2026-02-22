import { useEffect, useState } from 'react'
import { X, MapPin, Briefcase, Clock, DollarSign, Calendar, Heart, Sparkles, Send, Building } from 'lucide-react'
import type { Job, CVData } from '@/services/mockApi'
import { jobsApi } from '@/services/api'

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
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [_loading, setLoading] = useState(false)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{job.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-slate-600">
              <Building size={16} />
              {job.company}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Match score */}
          {matchResult && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#4f46e5]/10 to-purple-50 rounded-xl border border-[#4f46e5]/20">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#4f46e5]">{matchResult.matchPercentage}%</div>
                  <div className="text-xs text-slate-600">match</div>
                </div>
                <div className="flex-1">
                  {matchResult.matchingSkills.length > 0 && (
                    <p className="text-sm text-green-700 mb-1">
                      ✅ Matchar: {matchResult.matchingSkills.join(', ')}
                    </p>
                  )}
                  {matchResult.missingSkills.length > 0 && (
                    <p className="text-sm text-orange-600">
                      ⚠️ Saknas: {matchResult.missingSkills.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              {matchResult.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#4f46e5]/20">
                  <p className="text-sm font-medium text-slate-700 mb-1">Förslag för bättre match:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
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
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={18} className="text-[#4f46e5]" />
              {job.location}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Briefcase size={18} className="text-[#4f46e5]" />
              {job.employmentType}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock size={18} className="text-[#4f46e5]" />
              {job.experienceLevel}
            </div>
            {job.salaryRange && (
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign size={18} className="text-[#4f46e5]" />
                {job.salaryRange}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-2">Om tjänsten</h3>
            <p className="text-slate-600 leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-2">Krav</h3>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((req, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              Publicerad: {new Date(job.publishedDate || job.publishedAt || Date.now()).toLocaleDateString('sv-SE')}
            </div>
            {job.deadline && (
              <div className="flex items-center gap-1 text-red-500">
                <Calendar size={14} />
                Sista ansökningsdag: {new Date(job.deadline).toLocaleDateString('sv-SE')}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={onSave}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
              isSaved
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Sparad' : 'Spara'}
          </button>
          
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] transition-colors"
          >
            <Sparkles size={18} />
            Skapa AI-ansökan
          </button>
          
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Send size={18} />
            Ansök externt
          </a>
        </div>
      </div>
    </div>
  )
}
