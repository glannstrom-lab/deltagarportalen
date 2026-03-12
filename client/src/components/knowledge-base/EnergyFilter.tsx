/**
 * Energy Level Filter for Knowledge Base
 * Filters articles based on user's energy level
 */

import { useState } from 'react'
import { Zap, Battery, BatteryLow, BatteryFull } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface EnergyFilterProps {
  selectedLevel: 'low' | 'medium' | 'high' | null
  onChange: (level: 'low' | 'medium' | 'high' | null) => void
  articleCount: Record<'low' | 'medium' | 'high', number>
}

const energyOptions = [
  {
    level: 'low' as const,
    label: 'Låg energi',
    description: 'Korta artiklar under 5 min',
    icon: BatteryLow,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    activeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    iconColor: 'text-sky-500',
  },
  {
    level: 'medium' as const,
    label: 'Medel energi',
    description: 'Standard-längd 5-15 min',
    icon: Battery,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    activeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    iconColor: 'text-amber-500',
  },
  {
    level: 'high' as const,
    label: 'Hög energi',
    description: 'Djupgående 15+ min',
    icon: BatteryFull,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    activeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    iconColor: 'text-rose-500',
  },
]

export function EnergyFilter({ selectedLevel, onChange, articleCount }: EnergyFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
            selectedLevel === 'low' && "bg-sky-100",
            selectedLevel === 'medium' && "bg-amber-100",
            selectedLevel === 'high' && "bg-rose-100",
            !selectedLevel && "bg-slate-200"
          )}>
            <Zap className={cn(
              "w-5 h-5",
              selectedLevel === 'low' && "text-sky-600",
              selectedLevel === 'medium' && "text-amber-600",
              selectedLevel === 'high' && "text-rose-600",
              !selectedLevel && "text-slate-500"
            )} />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-800">
              {selectedLevel 
                ? `Filtrerat: ${energyOptions.find(e => e.level === selectedLevel)?.label}`
                : 'Filtrera efter energinivå'}
            </p>
            <p className="text-sm text-slate-500">
              {selectedLevel
                ? `${articleCount[selectedLevel]} artiklar passar din energi`
                : 'Anpassa innehåll efter hur du mår idag'}
            </p>
          </div>
        </div>
        <svg 
          className={cn("w-5 h-5 text-slate-400 transition-transform", isExpanded && "rotate-180")}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="space-y-2 pl-2">
          <button
            onClick={() => onChange(null)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
              !selectedLevel
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
              <Zap className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">Visa alla</p>
              <p className="text-xs text-slate-500">
                {articleCount.low + articleCount.medium + articleCount.high} artiklar
              </p>
            </div>
          </button>
          
          {energyOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedLevel === option.level
            
            return (
              <button
                key={option.level}
                onClick={() => onChange(option.level)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                  isSelected ? option.activeColor : `${option.color} opacity-60 hover:opacity-100`
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", option.iconColor)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs opacity-80">{option.description}</p>
                </div>
                <span className="text-sm font-medium">
                  {articleCount[option.level]} st
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
