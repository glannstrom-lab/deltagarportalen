import { useState } from 'react'
import { MapPin, Briefcase, Clock, Heart, ChevronRight, CheckCircle, XCircle, Bot, ExternalLink } from 'lucide-react'
import type { Job } from '@/services/mockApi'
import type { JobAd } from '@/services/arbetsformedlingenApi'

// Typ som stödjer både interna Job och externa JobAd
interface JobCardJob {
  id: string
  title?: string
  headline?: string
  company?: string
  employer?: { name: string; workplace?: string }
  location?: string
  workplace_address?: { municipality?: string; city?: string; region?: string }
  description: string
  employmentType?: string
  employment_type?: { label: string }
  experienceLevel?: string
  experience_required?: boolean
  publishedAt?: string
  publication_date?: string
  publishedDate?: string
  deadline?: string
  application_deadline?: string
  salaryRange?: string
  salary?: string
  salary_description?: string
  url?: string
  application_details?: { url?: string; via_af?: boolean; email?: string }
  matchPercentage?: number
  matchingSkills?: string[]
  missingKeywords?: string[]
  must_have?: {
    skills?: Array<{ label: string }>
  }
  // Originalobjekt för att kunna skilja på typer
  _original?: Job | JobAd
}

interface JobCardProps {
  job: Job | JobAd
  isSaved?: boolean
  onSave?: (jobId: string) => void
  onApply?: (job: Job) => void
  onClick?: (job: Job) => void
  onAnalyze?: (job: Job) => void
  showMatch?: boolean
  showApplyButton?: boolean
}

export function JobCard({ 
  job, 
  isSaved, 
  onSave, 
  onApply, 
  onClick, 
  onAnalyze, 
  showMatch = true,
  showApplyButton = true
}: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Konvertera JobAd till JobCardJob
  const normalizeJob = (job: Job | JobAd): JobCardJob => {
    // Kolla om det är en JobAd (har headline)
    if ('headline' in job) {
      return {
        id: job.id,
        headline: job.headline,
        employer: job.employer,
        workplace_address: job.workplace_address,
        description: job.description.text.substring(0, 500) + (job.description.text.length > 500 ? '...' : ''),
        employment_type: job.employment_type,
        experience_required: job.experience_required,
        publication_date: job.publication_date,
        application_deadline: job.application_deadline,
        salary_description: job.salary_description,
        application_details: job.application_details,
        must_have: job.must_have,
        _original: job
      }
    }
    // Det är ett Job
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      publishedAt: job.publishedAt,
      publishedDate: job.publishedDate,
      deadline: job.deadline,
      salaryRange: job.salaryRange,
      salary: job.salary,
      url: job.url,
      matchPercentage: job.matchPercentage,
      matchingSkills: job.matchingSkills,
      missingKeywords: job.missingKeywords,
      _original: job
    }
  }

  const normalizedJob = normalizeJob(job)

  const getDisplayTitle = () => {
    return normalizedJob.headline || normalizedJob.title || 'Jobbannons'
  }

  const getDisplayCompany = () => {
    return normalizedJob.employer?.name || normalizedJob.company || 'Arbetsgivare ej angiven'
  }

  const getDisplayLocation = () => {
    return normalizedJob.workplace_address?.municipality || 
           normalizedJob.workplace_address?.city || 
           normalizedJob.location || 
           'Ort ej angiven'
  }

  const getDisplayEmploymentType = () => {
    return normalizedJob.employment_type?.label || 
           normalizedJob.employmentType || 
           'Ej angiven'
  }

  const getDisplayDate = () => {
    const dateString = normalizedJob.publication_date || 
                      normalizedJob.publishedAt || 
                      normalizedJob.publishedDate
    if (!dateString) return 'Datum ej angivet'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    if (diffDays < 7) return `${diffDays} dagar sedan`
    return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
  }

  const getDisplayDeadline = () => {
    const deadline = normalizedJob.application_deadline || normalizedJob.deadline
    if (!deadline) return null
    return new Date(deadline).toLocaleDateString('sv-SE')
  }

  const getDisplaySalary = () => {
    return normalizedJob.salary_description || normalizedJob.salaryRange
  }

  const getApplicationUrl = (): string | null => {
    // För JobAd
    if (normalizedJob.application_details?.url) {
      return normalizedJob.application_details.url
    }
    if (normalizedJob.application_details?.via_af) {
      return `https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/${normalizedJob.id}`
    }
    // För Job
    if (normalizedJob.url && normalizedJob.url !== '#') {
      return normalizedJob.url
    }
    return null
  }

  const getMatchingSkills = (): string[] => {
    if (normalizedJob.matchingSkills) {
      return normalizedJob.matchingSkills
    }
    // För JobAd, extrahera från must_have
    if (normalizedJob.must_have?.skills) {
      return normalizedJob.must_have.skills.slice(0, 3).map(s => s.label)
    }
    return []
  }

  const getMissingSkills = (): string[] => {
    return normalizedJob.missingKeywords || []
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-orange-600 bg-orange-50'
  }

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = getApplicationUrl()
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    // Anropa även onApply callback om den finns
    if (onApply && '_original' in normalizedJob && normalizedJob._original) {
      onApply(normalizedJob._original as Job)
    }
  }

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave?.(normalizedJob.id)
  }

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAnalyze && '_original' in normalizedJob && normalizedJob._original) {
      onAnalyze(normalizedJob._original as Job)
    }
  }

  const handleCardClick = () => {
    if (onClick && '_original' in normalizedJob && normalizedJob._original) {
      onClick(normalizedJob._original as Job)
    }
  }

  const matchingSkills = getMatchingSkills()
  const missingSkills = getMissingSkills()
  const deadline = getDisplayDeadline()
  const salary = getDisplaySalary()

  return (
    <div 
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 text-lg truncate">{getDisplayTitle()}</h3>
            {showMatch && normalizedJob.matchPercentage && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${getMatchColor(normalizedJob.matchPercentage)}`}>
                {normalizedJob.matchPercentage}% match
              </span>
            )}
          </div>
          
          <p className="text-slate-600 font-medium">{getDisplayCompany()}</p>
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              {getDisplayLocation()}
            </div>
            <div className="flex items-center gap-1">
              <Briefcase size={14} />
              {getDisplayEmploymentType()}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {getDisplayDate()}
            </div>
          </div>

          {/* Description preview */}
          <p className="text-sm text-slate-600 mt-3 line-clamp-2">
            {normalizedJob.description}
          </p>

          {/* Matching skills */}
          {showMatch && matchingSkills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">Matchar ditt CV:</p>
              <div className="flex flex-wrap gap-1">
                {matchingSkills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
                  >
                    <CheckCircle size={10} />
                    {skill}
                  </span>
                ))}
                {matchingSkills.length > 3 && (
                  <span className="text-xs px-2 py-1 text-slate-500">
                    +{matchingSkills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {showMatch && missingSkills.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Saknas i ditt CV:</p>
              <div className="flex flex-wrap gap-1">
                {missingSkills.slice(0, 2).map((skill, index) => (
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
            onClick={handleSave}
            className={`p-2 rounded-full transition-colors ${
              isSaved 
                ? 'bg-red-50 text-red-500' 
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
            title={isSaved ? 'Ta bort från sparade' : 'Spara jobb'}
          >
            <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          
          {onAnalyze && (
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 transition-colors"
              title="Analysera matchning med AI"
            >
              <Bot size={14} />
              Analysera
            </button>
          )}
          
          {showApplyButton && isHovered && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca] transition-colors"
              title="Ansök på arbetsformedlingen.se"
            >
              <ExternalLink size={14} />
              Ansök
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {salary && <span>💰 {salary}</span>}
          {deadline && (
            <span className="text-red-500">
              ⏰ Ansök senast {deadline}
            </span>
          )}
          {normalizedJob.application_details?.via_af && (
            <span className="text-teal-600 flex items-center gap-1">
              🏛️ Via Arbetsförmedlingen
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

export default JobCard
