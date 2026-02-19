import { Check, Layout, Palette, Sparkles, Type } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  primaryColor: string
  secondaryColor: string
  font: string
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean och professionell med färgaccenter',
    icon: <Layout size={24} />,
    primaryColor: '#4f46e5',
    secondaryColor: '#6366f1',
    font: 'Inter',
  },
  {
    id: 'classic',
    name: 'Klassisk',
    description: 'Traditionell layout för konservativa branscher',
    icon: <Type size={24} />,
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    font: 'Georgia',
  },
  {
    id: 'creative',
    name: 'Kreativ',
    description: 'Unik design för kreativa yrken',
    icon: <Palette size={24} />,
    primaryColor: '#ec4899',
    secondaryColor: '#f97316',
    font: 'Inter',
  },
  {
    id: 'minimal',
    name: 'Minimalistisk',
    description: 'Enkel och luftig med mycket whitespace',
    icon: <Sparkles size={24} />,
    primaryColor: '#0f172a',
    secondaryColor: '#64748b',
    font: 'Inter',
  },
]

interface CVTemplateSelectorProps {
  selectedTemplate: string
  onSelect: (templateId: string) => void
}

export function CVTemplateSelector({ selectedTemplate, onSelect }: CVTemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Välj CV-mall</h3>
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              selectedTemplate === template.id
                ? 'border-[#4f46e5] bg-[#eef2ff]'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: selectedTemplate === template.id
                    ? template.primaryColor
                    : '#f1f5f9',
                  color: selectedTemplate === template.id ? 'white' : '#64748b',
                }}
              >
                {template.icon}
              </div>
              {selectedTemplate === template.id && (
                <Check size={20} className="text-[#4f46e5]" />
              )}
            </div>
            <h4 className="font-semibold text-slate-800">{template.name}</h4>
            <p className="text-sm text-slate-500 mt-1">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export { templates }
export type { Template }
