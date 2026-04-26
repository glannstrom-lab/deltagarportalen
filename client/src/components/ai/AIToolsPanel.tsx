import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

const toolConfigs = [
  { id: 'cv-generate', mode: 'cv-generate' as const, icon: Wand2, titleKey: 'ai.tools.cvGenerate.title', descKey: 'ai.tools.cvGenerate.description', compact: true },
  { id: 'cv-optimization', mode: 'cv-optimization' as const, icon: Sparkles, titleKey: 'ai.tools.cvOptimization.title', descKey: 'ai.tools.cvOptimization.description', compact: true },
  { id: 'cover-letter', mode: 'cover-letter' as const, icon: MessageSquare, titleKey: 'ai.tools.coverLetter.title', descKey: 'ai.tools.coverLetter.description', compact: true },
  { id: 'interview-prep', mode: 'interview-prep' as const, icon: Lightbulb, titleKey: 'ai.tools.interviewPrep.title', descKey: 'ai.tools.interviewPrep.description', compact: true }
]

export function AIToolsPanel({ cvData, onApplyToSummary }: AIToolsPanelProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const tools = useMemo(() => toolConfigs.map(tool => ({
    ...tool,
    title: t(tool.titleKey),
    description: t(tool.descKey)
  })), [t])

  const activeToolConfig = tools.find(t => t.id === activeTool)

  return (
    <Card className="p-4 border-brand-100 dark:border-brand-900 bg-gradient-to-br from-brand-50/50 to-sky-50/30 dark:from-brand-900/20 dark:to-sky-900/10">
      <div className="space-y-4">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-900 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-stone-100">{t('ai.tools.title')}</h3>
              <p className="text-sm text-gray-500 dark:text-stone-400">{t('ai.tools.subtitle')}</p>
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
                  className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 hover:border-brand-300 dark:hover:border-brand-900 hover: transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-brand-900 dark:text-brand-400" />
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
