/**
 * RiasecTips - Shows personalized cover letter tips based on RIASEC profile
 */

import { useState, useEffect } from 'react'
import { Compass, Lightbulb, ChevronDown, ChevronUp, Sparkles } from '@/components/ui/icons'
import { useInterestProfile, RIASEC_TYPES } from '@/hooks/useInterestProfile'
import { getCoverLetterTips, getPersonalityStrengths, calculateInterestMatch, type RiasecScores } from '@/services/interestPersonalization'
import { cn } from '@/lib/utils'

interface RiasecTipsProps {
  jobDescription: string
  className?: string
}

export function RiasecTips({ jobDescription, className }: RiasecTipsProps) {
  const { profile, isLoading } = useInterestProfile()
  const [isExpanded, setIsExpanded] = useState(true)
  const [tips, setTips] = useState<string[]>([])
  const [strengths, setStrengths] = useState<string[]>([])
  const [matchScore, setMatchScore] = useState<number | null>(null)

  useEffect(() => {
    if (profile.hasResult && profile.riasecScores && jobDescription.length > 50) {
      // Calculate interest match
      const score = calculateInterestMatch(jobDescription, profile.riasecScores)
      setMatchScore(score)

      // Get personalized tips
      const coverLetterTips = getCoverLetterTips(profile.riasecScores, jobDescription)
      setTips(coverLetterTips)

      // Get personality strengths
      const personalStrengths = getPersonalityStrengths(profile.riasecScores)
      setStrengths(personalStrengths)
    }
  }, [profile, jobDescription])

  if (isLoading || !profile.hasResult || !profile.riasecScores) {
    return null
  }

  if (jobDescription.length < 50) {
    return null
  }

  const dominantType = profile.dominantTypes[0]
  const dominantRiasec = dominantType ? RIASEC_TYPES[dominantType.code] : null

  return (
    <div className={cn("bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Compass className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              Tips från din intresseprofil
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            {matchScore !== null && (
              <p className="text-sm text-slate-600">
                {matchScore >= 60
                  ? 'Detta jobb matchar dina intressen väl!'
                  : matchScore >= 30
                    ? 'Delvis matchning med dina intressen'
                    : 'Jobbet ligger utanför dina typiska intressen'}
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Interest match score */}
          {matchScore !== null && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Intressematch:</span>
              <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    matchScore >= 60 ? "bg-green-500" :
                      matchScore >= 30 ? "bg-amber-500" : "bg-slate-400"
                  )}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
              <span className={cn(
                "font-bold text-sm",
                matchScore >= 60 ? "text-green-600" :
                  matchScore >= 30 ? "text-amber-600" : "text-slate-500"
              )}>
                {matchScore}%
              </span>
            </div>
          )}

          {/* RIASEC type */}
          {dominantRiasec && (
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <p className="text-sm text-slate-600 mb-1">Din profil:</p>
              <p className="font-medium text-slate-800">
                {dominantRiasec.nameSv} ({dominantRiasec.code.charAt(0).toUpperCase()})
              </p>
              <p className="text-xs text-slate-500 mt-1">{dominantRiasec.description}</p>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Tips för ditt brev
              </h4>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-amber-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths to highlight */}
          {strengths.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">
                Styrkor att framhäva
              </h4>
              <div className="flex flex-wrap gap-2">
                {strengths.slice(0, 6).map((strength, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white text-amber-700 text-sm rounded-full border border-amber-200"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RiasecTips
