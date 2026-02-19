import { useState } from 'react'
import { MapPin, Briefcase, Clock, Heart, ChevronRight, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import type { Job } from '@/services/mockApi'

interface JobCardProps {
  job: Job
  isSaved?: boolean
  onSave?: (jobId: string) => void
  onApply?: (job: Job) => void
  onClick?: (job: Job) => void
  showMatch?: boolean
}

export function JobCard({ job, isSaved, onSave, onApply, onClick, showMatch = true }: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    if (diffDays < 7) return `${diffDays} dagar sedan`
    return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-orange-600 bg-orange-50'
  }

  return (
    <div 
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(job)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 text-lg truncate">{job.title}</h3>
            {showMatch && job.matchPercentage && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${getMatchColor(job.matchPercentage)}`}>
                {job.matchPercentage}% match
              </span>
            )}
          </div>
          
          <p className="text-slate-600 font-medium">{job.company}</p>
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <Briefcase size={14} />
              {job.employmentType}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {formatDate(job.publishedDate)}
            </div>
          </div>

          {/* Description preview */}
          <p className="text-sm text-slate-600 mt-3 line-clamp-2">
            {job.description}
          </p>

          {/* Matching skills */}
          {showMatch && job.matchingSkills && job.matchingSkills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">Matchar ditt CV:</p>
              <div className="flex flex-wrap gap-1">
                {job.matchingSkills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
                  >
                    <CheckCircle size={10} />
                    {skill}
                  </span>
                ))}
                {job.matchingSkills.length > 3 && (
                  <span className="text-xs px-2 py-1 text-slate-500">
                    +{job.matchingSkills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {showMatch && job.missingKeywords && job.missingKeywords.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Saknas i ditt CV:</p>
              <div className="flex flex-wrap gap-1">
                {job.missingKeywords.slice(0, 2).map((skill, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full flex items-center gap-1"
                  >
                    <XCircle size={10} />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSave?.(job.id)
            }}
            className={`p-2 rounded-full transition-colors ${
              isSaved 
                ? 'bg-red-50 text-red-500' 
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApply?.(job)
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca] transition-colors"
            >
              <Sparkles size={14} />
              AI-ansök
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {job.salaryRange && <span>💰 {job.salaryRange}</span>}
          {job.deadline && (
            <span className="text-red-500">
              ⏰ Ansök senast {new Date(job.deadline).toLocaleDateString('sv-SE')}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-[#4f46e5] text-sm font-medium">
          Läs mer
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  )
}
