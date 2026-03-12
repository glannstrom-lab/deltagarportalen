/**
 * Tools Tab
 * Downloadable templates, checklists, and practical tools
 */

import { Wrench, Download, FileText, CheckSquare, Calculator, Calendar, Star } from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface Tool {
  id: string
  title: string
  description: string
  icon: typeof FileText
  format: string
  downloads: number
  category: 'template' | 'checklist' | 'calculator' | 'planner'
  isNew?: boolean
  isPopular?: boolean
}

const tools: Tool[] = [
  {
    id: 'cv-template-modern',
    title: 'CV-mall (Modern)',
    description: 'Clean och professionell CV-mall som fungerar för de flesta branscher',
    icon: FileText,
    format: 'Word + PDF',
    downloads: 1234,
    category: 'template',
    isPopular: true,
  },
  {
    id: 'cv-template-functional',
    title: 'CV-mall (Funktionell)',
    description: 'Perfekt om du har begränsad arbetslivserfarenhet eller byter karriär',
    icon: FileText,
    format: 'Word + PDF',
    downloads: 856,
    category: 'template',
  },
  {
    id: 'cover-letter-template',
    title: 'Personligt brev-mall',
    description: 'Strukturerad mall som följer STAR-metoden',
    icon: FileText,
    format: 'Word',
    downloads: 987,
    category: 'template',
    isPopular: true,
  },
  {
    id: 'interview-checklist',
    title: 'Intervju-checklista',
    description: 'Komplett förberedelse inför jobbintervjun',
    icon: CheckSquare,
    format: 'PDF',
    downloads: 654,
    category: 'checklist',
  },
  {
    id: 'salary-calculator',
    title: 'Lönekalkylator',
    description: 'Beräkna rimlig lön baserat på roll och erfarenhet',
    icon: Calculator,
    format: 'Excel',
    downloads: 432,
    category: 'calculator',
    isNew: true,
  },
  {
    id: 'weekly-planner',
    title: 'Veckoplanerare för jobbsökare',
    description: 'Strukturera din vecka med aktiviteter och mål',
    icon: Calendar,
    format: 'PDF',
    downloads: 543,
    category: 'planner',
  },
  {
    id: 'application-tracker',
    title: 'Ansöknings-tracker',
    description: 'Håll koll på alla dina jobbansökningar',
    icon: CheckSquare,
    format: 'Excel',
    downloads: 321,
    category: 'planner',
    isNew: true,
  },
  {
    id: 'networking-script',
    title: 'Nätverksscript',
    description: 'Färdiga mallar för LinkedIn och nätverksevent',
    icon: FileText,
    format: 'PDF',
    downloads: 298,
    category: 'template',
  },
]

const categoryLabels: Record<string, { label: string; color: string }> = {
  template: { label: 'Mall', color: 'bg-blue-100 text-blue-700' },
  checklist: { label: 'Checklista', color: 'bg-emerald-100 text-emerald-700' },
  calculator: { label: 'Kalkylator', color: 'bg-amber-100 text-amber-700' },
  planner: { label: 'Planerare', color: 'bg-violet-100 text-violet-700' },
}

export function ToolsTab() {
  const handleDownload = (toolId: string) => {
    // Track download
    console.log(`Downloading ${toolId}`)
    // In real implementation, this would trigger file download
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Verktyg & Mallar
            </h2>
            <p className="text-slate-600 mt-1">
              Nedladdningsbara resurser som hjälper dig i din jobbsökarprocess. 
              Alla verktyg är gratis och utvecklade av experter.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon
          const category = categoryLabels[tool.category]
          
          return (
            <Card 
              key={tool.id} 
              className="group hover:shadow-lg transition-all"
            >
              {/* Header with badges */}
              <div className="flex items-start justify-between mb-3">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${category.color.split(' ')[0]}
                `}>
                  <Icon className={`w-6 h-6 ${category.color.split(' ')[1]}`} />
                </div>
                <div className="flex gap-1">
                  {tool.isNew && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      Ny
                    </span>
                  )}
                  {tool.isPopular && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Populär
                    </span>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="mb-4">
                <span className={`
                  inline-block px-2 py-0.5 text-xs font-medium rounded mb-2
                  ${category.color}
                `}>
                  {category.label}
                </span>
                <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {tool.description}
                </p>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  <span>{tool.format}</span>
                  <span className="mx-2">•</span>
                  <span>{tool.downloads} nedladdningar</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload(tool.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Ladda ner
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
      
      {/* Request tool */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="text-center py-4">
          <p className="text-slate-600">
            Saknar du ett verktyg? 
            <button className="text-amber-600 font-medium hover:underline ml-1">
              Föreslå en ny mall
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}
