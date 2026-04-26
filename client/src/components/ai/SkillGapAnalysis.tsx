/**
 * Skill Gap Analysis Component
 * Visar kompetensgap och rekommendationer för att förbättra matchning
 */

import { useState, useMemo } from 'react'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen, 
  ChevronRight,
  Zap,
  Award,
  BarChart3,
  Lightbulb,
  ArrowRight
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { analyzeSkillGaps, predictFutureMatches, type SkillRecommendation } from '@/services/ai/smartMatching'

interface SkillGapAnalysisProps {
  userSkills: string[]
  targetJobSkills: string[]
  jobTitle: string
  className?: string
}

export function SkillGapAnalysis({ 
  userSkills, 
  targetJobSkills, 
  jobTitle,
  className 
}: SkillGapAnalysisProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [showAllSkills, setShowAllSkills] = useState(false)

  const analysis = useMemo(() => {
    return analyzeSkillGaps(userSkills, targetJobSkills)
  }, [userSkills, targetJobSkills])

  const matchPercentage = Math.round(
    (analysis.matching.length / targetJobSkills.length) * 100
  )

  // Simulera prediktion för varje gap
  const predictions = useMemo(() => {
    return analysis.gaps.map(skill => ({
      skill,
      ...predictFutureMatches(userSkills, skill)
    }))
  }, [analysis.gaps, userSkills])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-slate-600 bg-slate-50 border-slate-200'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Kompetensanalys</h3>
            <p className="text-sm text-slate-700">För {jobTitle}</p>
          </div>
        </div>

        {/* Match score */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-20 h-20 rounded-xl flex items-center justify-center',
            matchPercentage >= 80 ? 'bg-emerald-100' :
            matchPercentage >= 60 ? 'bg-amber-100' : 'bg-rose-100'
          )}>
            <span className={cn(
              'text-2xl font-bold',
              matchPercentage >= 80 ? 'text-emerald-600' :
              matchPercentage >= 60 ? 'text-amber-600' : 'text-rose-600'
            )}>
              {matchPercentage}%
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800">
              {matchPercentage >= 80 ? 'Utmärkt matchning!' :
               matchPercentage >= 60 ? 'God matchning' : 'Grundläggande matchning'}
            </p>
            <p className="text-sm text-slate-700">
              Du har {analysis.matching.length} av {targetJobSkills.length} efterfrågade kompetenser
            </p>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  matchPercentage >= 80 ? 'bg-emerald-500' :
                  matchPercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${matchPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Matching skills */}
        {analysis.matching.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Dina matchande kompetenser ({analysis.matching.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.matching.map(skill => (
                <span 
                  key={skill}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skill gaps */}
        {analysis.gaps.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Kompetenser att utveckla ({analysis.gaps.length})
            </h4>

            <div className="space-y-3">
              {(showAllSkills ? predictions : predictions.slice(0, 3)).map((prediction) => (
                <div 
                  key={prediction.skill}
                  className={cn(
                    'border rounded-xl p-4 transition-all cursor-pointer',
                    selectedSkill === prediction.skill 
                      ? 'border-indigo-300 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-200'
                  )}
                  onClick={() => setSelectedSkill(
                    selectedSkill === prediction.skill ? null : prediction.skill
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-800">{prediction.skill}</span>
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        getImpactColor(predictions.find(p => p.skill === prediction.skill)?.impact || 'medium')
                      )}>
                        {prediction.newJobsUnlocked} nya jobb
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      'w-5 h-5 text-slate-600 transition-transform',
                      selectedSkill === prediction.skill && 'rotate-90'
                    )} />
                  </div>

                  {selectedSkill === prediction.skill && (
                    <div className="mt-4 pt-4 border-t border-indigo-100 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-slate-700 mb-1">Uppskattad tid</p>
                          <p className="font-medium text-slate-800 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {prediction.estimatedTime}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-slate-700 mb-1">Jobb som låses upp</p>
                          <p className="font-medium text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +{prediction.newJobsUnlocked}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Lär dig:</p>
                        <ul className="space-y-1.5">
                          {['Online-kurs på Coursera/Udemy', 'Praktiska övningar', 'LinkedIn Learning'].map((resource, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <BookOpen className="w-4 h-4 text-indigo-400" />
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" />
                        Börja lära dig nu
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {predictions.length > 3 && (
              <button
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showAllSkills ? 'Visa färre' : `Visa alla ${predictions.length} kompetenser`}
              </button>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 mb-1">Strategi för att öka matchningen</p>
              <p className="text-sm text-slate-600">
                Om du lär dig de 2-3 viktigaste kompetenserna från listan ovan, 
                kan du öka din matchning till över 80% och få tillgång till 
                betydligt fler jobbmöjligheter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillGapAnalysis
