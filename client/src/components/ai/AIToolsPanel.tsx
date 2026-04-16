import { useState } from 'react'
import { Sparkles, Wand2, MessageSquare, Lightbulb, X, ChevronDown, ChevronUp } from '@/components/ui/icons'
import { AIAssistant } from './AIAssistant'
import { Card } from '@/components/ui/Card'

interface AIToolsPanelProps {
  cvData?: {
    summary?: string
    title?: string
    workExperience?: Array<{ title: string; description: string }>
    skills?: Array<{ name: string }>
  }
  onApplyToSummary?: (text: string) => void
}

const tools = [
  {
    id: 'cv-generate',
    mode: 'cv-generate' as const,
    icon: Wand2,
    title: 'Generera CV-sammanfattning',
    description: 'Låt AI skriva en professionell sammanfattning',
    compact: true
  },
  {
    id: 'cv-optimization',
    mode: 'cv-optimization' as const,
    icon: Sparkles,
    title: 'Analysera CV',
    description: 'Få feedback och förbättringsförslag',
    compact: true
  },
  {
    id: 'cover-letter',
    mode: 'cover-letter' as const,
    icon: MessageSquare,
    title: 'Skriv personligt brev',
    description: 'Generera personligt brev från jobbannons',
    compact: true
  },
  {
    id: 'interview-prep',
    mode: 'interview-prep' as const,
    icon: Lightbulb,
    title: 'Förbered intervju',
    description: 'Få hjälp inför anställningsintervjun',
    compact: true
  }
]

export function AIToolsPanel({ cvData, onApplyToSummary }: AIToolsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const activeToolConfig = tools.find(t => t.id === activeTool)

  return (
    <Card className="p-4 border-teal-100 dark:border-teal-900 bg-gradient-to-br from-teal-50/50 to-sky-50/30 dark:from-teal-900/20 dark:to-sky-900/10">
      <div className="space-y-4">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-stone-100">AI-verktyg</h3>
              <p className="text-sm text-gray-500 dark:text-stone-400">Fa hjalp med CV, brev och intervjuer</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 dark:text-stone-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-stone-500" />
          )}
        </div>

        {/* Tools Grid */}
        {isExpanded && !activeTool && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-stone-100 text-sm">{tool.title}</p>
                    <p className="text-xs text-gray-500 dark:text-stone-400 mt-0.5">{tool.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Active Tool */}
        {isExpanded && activeTool && activeToolConfig && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-stone-100">{activeToolConfig.title}</h4>
              <button
                onClick={() => setActiveTool(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-stone-400" />
              </button>
            </div>
            
            <AIAssistant
              mode={activeToolConfig.mode}
              context={{
                cvText: cvData?.summary,
                yrke: cvData?.title,
                erfarenhet: cvData?.workExperience?.map(w => w.title).join(', '),
                styrkor: cvData?.skills?.map(s => s.name).join(', ')
              }}
              onResult={(result) => {
                if (activeTool === 'cv-generate' && onApplyToSummary) {
                  onApplyToSummary(result)
                }
              }}
              compact={false}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
