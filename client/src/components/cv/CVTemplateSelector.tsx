import { Check, Layout, Palette, Sparkles, Type, Briefcase, GraduationCap, Code, Building2 } from 'lucide-react'

export interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  primaryColor: string
  secondaryColor: string
  font: string
  category: 'professional' | 'creative' | 'academic' | 'technical'
}

export interface ColorScheme {
  id: string
  name: string
  primary: string
  secondary: string
}

export interface FontOption {
  id: string
  name: string
  family: string
  category: 'sans' | 'serif' | 'mono'
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
    category: 'professional',
  },
  {
    id: 'classic',
    name: 'Klassisk',
    description: 'Traditionell layout för konservativa branscher',
    icon: <Type size={24} />,
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    font: 'Georgia',
    category: 'professional',
  },
  {
    id: 'creative',
    name: 'Kreativ',
    description: 'Unik design för kreativa yrken',
    icon: <Palette size={24} />,
    primaryColor: '#ec4899',
    secondaryColor: '#f97316',
    font: 'Inter',
    category: 'creative',
  },
  {
    id: 'minimal',
    name: 'Minimalistisk',
    description: 'Enkel och luftig med mycket whitespace',
    icon: <Sparkles size={24} />,
    primaryColor: '#0f172a',
    secondaryColor: '#64748b',
    font: 'Inter',
    category: 'professional',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern design för IT och utvecklare',
    icon: <Code size={24} />,
    primaryColor: '#0891b2',
    secondaryColor: '#06b6d4',
    font: 'JetBrains Mono',
    category: 'technical',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premiumdesign för ledningspositioner',
    icon: <Briefcase size={24} />,
    primaryColor: '#1e3a5f',
    secondaryColor: '#3d5a80',
    font: 'Playfair Display',
    category: 'professional',
  },
  {
    id: 'academic',
    name: 'Akademisk',
    description: 'Strukturerad för forskare och lärare',
    icon: <GraduationCap size={24} />,
    primaryColor: '#7c3aed',
    secondaryColor: '#8b5cf6',
    font: 'Merriweather',
    category: 'academic',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Företagsstil för stora organisationer',
    icon: <Building2 size={24} />,
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    font: 'Roboto',
    category: 'professional',
  },
]

const colorSchemes: ColorScheme[] = [
  { id: 'indigo', name: 'Indigo', primary: '#4f46e5', secondary: '#6366f1' },
  { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', secondary: '#38bdf8' },
  { id: 'forest', name: 'Forest', primary: '#10b981', secondary: '#34d399' },
  { id: 'berry', name: 'Berry', primary: '#ec4899', secondary: '#f472b6' },
  { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#fb923c' },
  { id: 'ruby', name: 'Ruby', primary: '#ef4444', secondary: '#f87171' },
  { id: 'slate', name: 'Slate', primary: '#1e293b', secondary: '#475569' },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', secondary: '#8b5cf6' },
  { id: 'cyan', name: 'Cyan', primary: '#06b6d4', secondary: '#22d3ee' },
  { id: 'rose', name: 'Rose', primary: '#e11d48', secondary: '#fb7185' },
]

const fontOptions: FontOption[] = [
  { id: 'inter', name: 'Inter', family: 'Inter, sans-serif', category: 'sans' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif', category: 'sans' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif', category: 'serif' },
  { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif', category: 'serif' },
  { id: 'merriweather', name: 'Merriweather', family: 'Merriweather, serif', category: 'serif' },
  { id: 'jetbrains', name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', category: 'mono' },
  { id: 'opensans', name: 'Open Sans', family: 'Open Sans, sans-serif', category: 'sans' },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'sans' },
  { id: 'dyslexic', name: 'OpenDyslexic', family: 'OpenDyslexic, sans-serif', category: 'sans' },
]

interface CVTemplateSelectorProps {
  selectedTemplate: string
  selectedColorScheme?: string
  selectedFont?: string
  onSelect: (templateId: string) => void
  onSelectColorScheme?: (schemeId: string) => void
  onSelectFont?: (fontId: string) => void
  showAdvanced?: boolean
}

export function CVTemplateSelector({ 
  selectedTemplate, 
  selectedColorScheme = 'indigo',
  selectedFont = 'inter',
  onSelect,
  onSelectColorScheme,
  onSelectFont,
  showAdvanced = false,
}: CVTemplateSelectorProps) {
  
  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Välj CV-mall</h3>
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
              <p className="text-xs text-slate-500 mt-1 capitalize">{template.category}</p>
              <p className="text-sm text-slate-500 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme Selection */}
      {showAdvanced && onSelectColorScheme && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Färgschema</h3>
          <div className="grid grid-cols-5 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => onSelectColorScheme(scheme.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedColorScheme === scheme.id
                    ? 'border-[#4f46e5]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div 
                  className="w-full h-8 rounded-lg mb-2"
                  style={{ backgroundColor: scheme.primary }}
                />
                <p className="text-xs text-center text-slate-600">{scheme.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Selection */}
      {showAdvanced && onSelectFont && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Typsnitt</h3>
          <div className="grid grid-cols-3 gap-3">
            {fontOptions.map((font) => (
              <button
                key={font.id}
                onClick={() => onSelectFont(font.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedFont === font.id
                    ? 'border-[#4f46e5] bg-[#eef2ff]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p 
                  className="font-medium text-slate-800"
                  style={{ fontFamily: font.family }}
                >
                  {font.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">{font.category}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { templates, colorSchemes, fontOptions }
