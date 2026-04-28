/**
 * Cover Letter Templates Tab
 * Visa alla 6 färdiga mallar
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Minimize2,
  Building2,
  Palette,
  Route,
  GraduationCap,
  X,
  Check,
  Copy
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { coverLetterTemplates, type CoverLetterTemplate } from '@/data/coverLetterTemplates'
import { cn } from '@/lib/utils'

const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
  standard: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
  short: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
  formal: { bg: 'bg-stone-100', text: 'text-stone-700', icon: 'text-stone-600' },
  creative: { bg: 'bg-sky-100', text: 'text-sky-700', icon: 'text-sky-600' },
  'career-change': { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
  graduate: { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'text-rose-600' },
}

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    FileText,
    Minimize2,
    Building2,
    Palette,
    Route,
    GraduationCap,
  }
  return icons[iconName] || FileText
}

export function CoverLetterTemplates() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<CoverLetterTemplate | null>(null)

  const handleUseTemplate = (templateId: string) => {
    navigate(`/cover-letter?template=${templateId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 rounded-xl p-6 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-solid)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
              Färdiga mallar att utgå ifrån
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mt-1">
              Ibland är det lättare att komma igång med ett exempel. Välj en mall som passar
              din situation – sedan gör du den till din egen.
            </p>
          </div>
        </div>
      </div>

      {/* Mall-grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coverLetterTemplates.map((template) => {
          const Icon = getIcon(template.icon)
          const colors = categoryColors[template.category]

          return (
            <Card
              key={template.id}
              className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50 hover:shadow-lg transition-all cursor-pointer group hover:border-[var(--c-accent)]/60 dark:hover:border-[var(--c-accent)]/60"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-5 h-5', colors.icon)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-solid)] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {template.category === 'standard' && 'Allround'}
                    {template.category === 'short' && 'Kort & koncis'}
                    {template.category === 'formal' && 'Formell'}
                    {template.category === 'creative' && 'Kreativ'}
                    {template.category === 'career-change' && 'Karriärbyte'}
                    {template.category === 'graduate' && 'Nyexaminerad'}
                  </p>
                </div>
              </div>

              {/* Beskrivning */}
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Struktur preview */}
              <div className="space-y-1.5 mb-4">
                {Object.entries(template.structure).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={12} className="text-[var(--c-solid)] dark:text-[var(--c-solid)] mt-0.5 shrink-0" />
                    <span className="text-stone-600 dark:text-stone-400 line-clamp-1">{value}</span>
                  </div>
                ))}
                <div className="text-xs text-stone-500 dark:text-stone-500 pl-5">
                  + {Object.keys(template.structure).length - 2} delar till
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {template.tips.length} tips
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-[var(--c-text)] dark:text-[var(--c-solid)] group-hover:bg-[var(--c-bg)] dark:group-hover:bg-[var(--c-bg)]/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUseTemplate(template.id)
                  }}
                >
                  Använd
                  <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Modal för förhandsvisning */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={() => handleUseTemplate(selectedTemplate.id)}
        />
      )}
    </div>
  )
}

// Modal-komponent för att visa mall-detajler
function TemplateModal({
  template,
  onClose,
  onUse
}: {
  template: CoverLetterTemplate
  onClose: () => void
  onUse: () => void
}) {
  const [activeTab, setActiveTab] = useState<'structure' | 'example' | 'tips'>('structure')
  const Icon = getIcon(template.icon)
  const colors = categoryColors[template.category]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-stone-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-stone-200 dark:border-stone-700/50">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colors.bg)}>
              <Icon className={cn('w-6 h-6', colors.icon)} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100">{template.name}</h2>
              <p className="text-stone-600 dark:text-stone-400 mt-1">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-100 dark:border-stone-800">
          <div className="flex">
            {[
              { id: 'structure', label: 'Struktur' },
              { id: 'example', label: 'Exempel' },
              { id: 'tips', label: 'Tips' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-solid)]'
                    : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <p className="text-stone-600 dark:text-stone-400">
                Denna mall är uppbyggd i {Object.keys(template.structure).length} delar:
              </p>
              {Object.entries(template.structure).map(([key, value], index) => (
                <div key={key} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)] flex items-center justify-center font-semibold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-800 dark:text-stone-100 capitalize">
                      {key === 'introduction' && 'Inledning'}
                      {key === 'motivation' && 'Motivering'}
                      {key === 'experience' && 'Erfarenhet'}
                      {key === 'closing' && 'Avslutning'}
                    </h4>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'example' && (
            <div className="space-y-4">
              <p className="text-stone-600 dark:text-stone-400">
                Så här kan ett brev se ut med denna mall:
              </p>
              <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap font-mono leading-relaxed">
                {template.example}
              </div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <Lightbulb size={16} />
                <span>Kom ihåg att alltid anpassa exemplet till din egen situation!</span>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <p className="text-stone-600 dark:text-stone-400">Tips för att använda denna mall:</p>
              {template.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                  <Check size={16} className="text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-stone-700 dark:text-stone-300">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Stäng
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(template.example)
              }}
            >
              <Copy size={16} />
              Kopiera exempel
            </Button>
            <Button onClick={onUse} className="gap-2">
              Använd denna mall
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
