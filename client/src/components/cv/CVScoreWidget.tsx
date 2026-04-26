import { useState } from 'react'
import { useCVScore, getOverallTips, getScoreColor, getScoreBgColor } from '@/hooks/useCVScore'
import type { CVData } from '@/services/supabaseApi'
import { ChevronDown, ChevronUp, Award, CheckCircle, AlertCircle } from '@/components/ui/icons'

interface CVScoreWidgetProps {
  data: CVData
  isCollapsed?: boolean
}

export function CVScoreWidget({ data, isCollapsed = false }: CVScoreWidgetProps) {
  const [expanded, setExpanded] = useState(!isCollapsed)
  const { percentage, sections, total, max } = useCVScore(data)
  
  const scoreColor = getScoreColor(percentage)
  const scoreBgColor = getScoreBgColor(percentage)
  const overallTip = getOverallTips(percentage)

  if (isCollapsed && !expanded) {
    return (
      <div 
        onClick={() => setExpanded(true)}
        className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-purple-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${scoreBgColor} flex items-center justify-center text-white font-bold`}>
              {percentage}
            </div>
            <div>
              <p className="font-medium text-slate-800">CV-poäng</p>
              <p className="text-sm text-slate-700">{total}/{max} poäng</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div 
        onClick={() => isCollapsed && setExpanded(false)}
        className={`p-4 ${isCollapsed ? 'cursor-pointer hover:bg-slate-50' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${scoreBgColor} flex items-center justify-center text-white font-bold text-lg`}>
              {percentage}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">CV-poäng</h3>
              <p className="text-sm text-slate-700">{total}/{max} poäng</p>
            </div>
          </div>
          {isCollapsed && <ChevronUp className="w-5 h-5 text-slate-600" />}
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${scoreBgColor} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Overall tip */}
        <p className="mt-3 text-sm text-slate-600 flex items-start gap-2">
          <Award className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
          {overallTip}
        </p>
      </div>

      {/* Sections breakdown */}
      <div className="border-t border-slate-100">
        {sections.map((section) => (
          <div key={section.name} className="p-3 border-b border-slate-50 last:border-b-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">{section.name}</span>
              <span className={`text-sm font-semibold ${
                section.score === section.max ? 'text-green-600' : 'text-slate-700'
              }`}>
                {section.score}/{section.max}
              </span>
            </div>
            
            {/* Mini progress bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-300 ${
                  section.score === section.max ? 'bg-green-500' : 'bg-purple-500'
                }`}
                style={{ width: `${(section.score / section.max) * 100}%` }}
              />
            </div>
            
            {/* Tips */}
            {section.tips.length > 0 && (
              <div className="space-y-1">
                {section.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    {section.score === section.max ? (
                      <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                    )}
                    {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
