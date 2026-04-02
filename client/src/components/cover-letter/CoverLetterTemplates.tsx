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
  formal: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-600' },
  creative: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
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
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Färdiga mallar att utgå ifrån
            </h2>
            <p className="text-slate-600 mt-1">
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
              className="p-5 hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-200"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
                  <Icon className={cn('w-5 h-5', colors.icon)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
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
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Struktur preview */}
              <div className="space-y-1.5 mb-4">
                {Object.entries(template.structure).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                    <span className="text-slate-500 line-clamp-1">{value}</span>
                  </div>
                ))}
                <div className="text-xs text-slate-400 pl-5">
                  + {Object.keys(template.structure).length - 2} delar till
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  {template.tips.length} tips
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1.5 text-indigo-600 group-hover:bg-indigo-50"
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
              <Icon className={cn('w-6 h-6', colors.icon)} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{template.name}</h2>
              <p className="text-slate-600 mt-1">{template.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100">
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
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
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
              <p className="text-slate-600">
                Denna mall är uppbyggd i {Object.keys(template.structure).length} delar:
              </p>
              {Object.entries(template.structure).map(([key, value], index) => (
                <div key={key} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 capitalize">
                      {key === 'introduction' && 'Inledning'}
                      {key === 'motivation' && 'Motivering'}
                      {key === 'experience' && 'Erfarenhet'}
                      {key === 'closing' && 'Avslutning'}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'example' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Så här kan ett brev se ut med denna mall:
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                {template.example}
              </div>
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <Lightbulb size={16} />
                <span>Kom ihåg att alltid anpassa exemplet till din egen situation!</span>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <p className="text-slate-600">Tips för att använda denna mall:</p>
              {template.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
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
