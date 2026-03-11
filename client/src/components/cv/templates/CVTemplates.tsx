/**
 * CV Templates Gallery
 * Creative and stylish templates downloadable in Word format
 */

import { useState } from 'react'
import { 
  Download, 
  FileText, 
  Eye, 
  Check, 
  Sparkles,
  Palette,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb,
  Heart,
  Star,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CVTemplate {
  id: string
  name: string
  description: string
  category: 'Creative' | 'Professional' | 'Modern' | 'Simple'
  color: string
  preview: string
  features: string[]
  downloads: number
  isNew?: boolean
  isPopular?: boolean
}

const templates: CVTemplate[] = [
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Modern design med gradientbakgrund och ikoner',
    category: 'Creative',
    color: 'from-purple-500 via-pink-500 to-orange-500',
    preview: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    features: ['Gradient header', 'Ikoner för sektioner', 'Färgstark design', 'Modern typografi'],
    downloads: 1234,
    isPopular: true
  },
  {
    id: 'minimal-Scandinavian',
    name: 'Scandinavian Minimal',
    description: 'Luftig nordisk design med fokus på läsbarhet',
    category: 'Simple',
    color: 'from-slate-100 to-slate-200',
    preview: 'bg-gradient-to-br from-slate-100 to-slate-200',
    features: ['Mycket whitespace', 'Clean typografi', 'Diskret färgpalett', 'Fokus på innehåll'],
    downloads: 892
  },
  {
    id: 'bold-statement',
    name: 'Bold Statement',
    description: 'Dramatisk design för de som vill sticka ut',
    category: 'Creative',
    color: 'from-indigo-600 to-blue-700',
    preview: 'bg-gradient-to-br from-indigo-600 to-blue-700',
    features: ['Stor rubrik', 'Kontrastrik design', 'Färgblock', 'Dramatiskt intryck'],
    downloads: 756,
    isNew: true
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    description: 'Klassisk elegance med serif-typsnitt',
    category: 'Professional',
    color: 'from-amber-100 to-amber-200',
    preview: 'bg-gradient-to-br from-amber-100 to-amber-200',
    features: ['Serif-typsnitt', 'Guld-accenter', 'Traditionell layout', 'Premium känsla'],
    downloads: 2341,
    isPopular: true
  },
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Perfekt för IT och tech-branschen',
    category: 'Modern',
    color: 'from-cyan-500 to-blue-600',
    preview: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    features: ['Tech-färger', 'Kompetens-bars', 'Modern layout', 'Kod-vänlig'],
    downloads: 1567
  },
  {
    id: 'artistic-portfolio',
    name: 'Artistic Portfolio',
    description: 'För kreativa yrken som design och konst',
    category: 'Creative',
    color: 'from-rose-400 via-fuchsia-500 to-indigo-500',
    preview: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500',
    features: ['Portfolio-sektion', 'Kreativ layout', 'Färgexplosion', 'Unik design'],
    downloads: 623,
    isNew: true
  },
  {
    id: 'corporate-clean',
    name: 'Corporate Clean',
    description: ' Professionell design för företagsvärlden',
    category: 'Professional',
    color: 'from-slate-700 to-slate-900',
    preview: 'bg-gradient-to-br from-slate-700 to-slate-900',
    features: ['Stram design', 'Professionell färgskala', 'Tydlig hierarki', 'Företagsanpassad'],
    downloads: 3102,
    isPopular: true
  },
  {
    id: 'nature-inspired',
    name: 'Nature Inspired',
    description: 'Organisk design med jordnära färger',
    category: 'Creative',
    color: 'from-emerald-400 via-teal-500 to-cyan-600',
    preview: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
    features: ['Naturliga färger', 'Organisk känsla', 'Lugnande design', 'Hållbarhetsfokus'],
    downloads: 445
  },
  {
    id: 'retro-vintage',
    name: 'Retro Vintage',
    description: 'Nostalgisk design med retro-känsla',
    category: 'Creative',
    color: 'from-orange-400 via-red-400 to-pink-500',
    preview: 'bg-gradient-to-br from-orange-400 via-red-400 to-pink-500',
    features: ['Retro-färger', 'Vintage-typografi', 'Nostalgisk känsla', 'Unik stil'],
    downloads: 389,
    isNew: true
  },
  {
    id: 'sidebar-colorful',
    name: 'Colorful Sidebar',
    description: 'Färgstark sidopanel med modern layout',
    category: 'Modern',
    color: 'from-violet-500 to-fuchsia-500',
    preview: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
    features: ['Färgstark sidebar', 'Modern layout', 'Lättläst', 'Visuellt tilltalande'],
    downloads: 987
  },
  {
    id: 'minimalist-mono',
    name: 'Minimalist Mono',
    description: 'Svartvitt design för tidlöst intryck',
    category: 'Simple',
    color: 'from-gray-100 to-gray-300',
    preview: 'bg-gradient-to-br from-gray-100 to-gray-300',
    features: ['Svartvitt', 'Tidlös design', 'Minimalistisk', 'Klassiskt'],
    downloads: 1123
  },
  {
    id: 'creative-story',
    name: 'Creative Story',
    description: 'Berättande design som visar din resa',
    category: 'Creative',
    color: 'from-amber-400 via-orange-500 to-red-500',
    preview: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
    features: ['Tidslinje-layout', 'Berättande struktur', 'Visuell resa', 'Engagerande design'],
    downloads: 567
  }
]

const categories = [
  { id: 'all', label: 'Alla mallar' },
  { id: 'Creative', label: 'Kreativa' },
  { id: 'Professional', label: 'Professionella' },
  { id: 'Modern', label: 'Moderna' },
  { id: 'Simple', label: 'Enkla' },
]

export function CVTemplates() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<CVTemplate | null>(null)
  const [downloadedId, setDownloadedId] = useState<string | null>(null)

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const handleDownload = (template: CVTemplate) => {
    // Generate Word document
    generateWordDoc(template)
    
    setDownloadedId(template.id)
    setTimeout(() => setDownloadedId(null), 2000)
  }

  const generateWordDoc = (template: CVTemplate) => {
    // Create HTML content for Word
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
body { font-family: 'Calibri', sans-serif; margin: 40px; }
.header { 
  background: linear-gradient(135deg, ${getGradientColors(template.color)}); 
  padding: 30px; 
  color: white; 
  border-radius: 8px;
  margin-bottom: 30px;
}
.name { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
.title { font-size: 18px; opacity: 0.9; }
.section { margin-bottom: 25px; }
.section-title { 
  font-size: 16px; 
  font-weight: bold; 
  color: #4f46e5; 
  border-bottom: 2px solid #4f46e5;
  padding-bottom: 5px;
  margin-bottom: 15px;
  text-transform: uppercase;
}
.content { line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div class="name">[Ditt Namn]</div>
    <div class="title">[Din Titel/Profession]</div>
  </div>
  
  <div class="section">
    <div class="section-title">Kontaktuppgifter</div>
    <div class="content">
      E-post: [din.email@exempel.se]<br>
      Telefon: [070-123 45 67]<br>
      Plats: [Stad, Land]
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Sammanfattning</div>
    <div class="content">
      [Skriv en kort sammanfattning om dig själv, dina styrkor och vad du söker]
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Arbetslivserfarenhet</div>
    <div class="content">
      <strong>[Jobbtitel]</strong> - [Företag]<br>
      [Månad År] - [Månad År]<br>
      [Beskriv dina arbetsuppgifter och resultat]<br><br>
      
      <strong>[Tidigare Jobbtitel]</strong> - [Tidigare Företag]<br>
      [Månad År] - [Månad År]<br>
      [Beskriv dina arbetsuppgifter]
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Utbildning</div>
    <div class="content">
      <strong>[Examen]</strong> - [Skola/Universitet]<br>
      [År] - [År]<br><br>
      
      <strong>[Tidigare Utbildning]</strong> - [Skola]<br>
      [År] - [År]
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Kompetenser</div>
    <div class="content">
      • [Kompetens 1]<br>
      • [Kompetens 2]<br>
      • [Kompetens 3]<br>
      • [Kompetens 4]
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Språk</div>
    <div class="content">
      Svenska - [Modersmål/Flytande]<br>
      Engelska - [Nivå]<br>
      [Annat språk] - [Nivå]
    </div>
  </div>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    CV skapat med mallen "${template.name}" från Jobin
  </div>
</body>
</html>`

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `CV-Mall-${template.name.replace(/\s+/g, '-')}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getGradientColors = (colorClass: string) => {
    // Extract colors from tailwind class
    const colors: Record<string, string> = {
      'from-purple-500 via-pink-500 to-orange-500': '#a855f7, #ec4899, #f97316',
      'from-slate-100 to-slate-200': '#f1f5f9, #e2e8f0',
      'from-indigo-600 to-blue-700': '#4f46e5, #1d4ed8',
      'from-amber-100 to-amber-200': '#fef3c7, #fde68a',
      'from-cyan-500 to-blue-600': '#06b6d4, #2563eb',
      'from-rose-400 via-fuchsia-500 to-indigo-500': '#fb7185, #d946ef, #6366f1',
      'from-slate-700 to-slate-900': '#334155, #0f172a',
      'from-emerald-400 via-teal-500 to-cyan-600': '#34d399, #14b8a6, #0891b2',
      'from-orange-400 via-red-400 to-pink-500': '#fb923c, #f87171, #ec4899',
      'from-violet-500 to-fuchsia-500': '#8b5cf6, #d946ef',
      'from-gray-100 to-gray-300': '#f3f4f6, #d1d5db',
      'from-amber-400 via-orange-500 to-red-500': '#fbbf24, #f97316, #ef4444',
    }
    return colors[colorClass] || '#4f46e5, #7c3aed'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">CV-mallar</h2>
        <p className="text-slate-600">
          Välj bland våra kreativa och professionella mallar. Alla är gratis att ladda ner i Word-format.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div 
            key={template.id}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Preview */}
            <div className={cn(
              'h-48 bg-gradient-to-br relative overflow-hidden',
              template.preview
            )}>
              {/* Mock CV Layout */}
              <div className="absolute inset-4 bg-white/95 rounded-lg shadow-lg p-4 transform group-hover:scale-105 transition-transform duration-300">
                <div className={cn(
                  'h-8 rounded mb-3 bg-gradient-to-r',
                  template.preview
                )} />
                <div className="space-y-2">
                  <div className="h-2 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 rounded w-2/3" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-1.5 bg-slate-100 rounded w-full" />
                  <div className="h-1.5 bg-slate-100 rounded w-5/6" />
                  <div className="h-1.5 bg-slate-100 rounded w-4/6" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {template.isNew && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    NY
                  </span>
                )}
                {template.isPopular && (
                  <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    POPULÄR
                  </span>
                )}
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-3 right-3">
                <span className="px-3 py-1 bg-white/90 text-slate-700 text-xs font-medium rounded-full">
                  {template.category}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <h3 className="font-semibold text-slate-800 text-lg mb-1">{template.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{template.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {template.features.slice(0, 2).map((feature, i) => (
                  <span key={i} className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
                {template.features.length > 2 && (
                  <span className="text-xs text-slate-400 px-2 py-1">
                    +{template.features.length - 2}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {template.downloads.toLocaleString('sv-SE')}
                </span>
                <span>Word (.doc)</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Förhandsgranska
                </button>
                <button
                  onClick={() => handleDownload(template)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
                    downloadedId === template.id
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  )}
                >
                  {downloadedId === template.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Nedladdad!
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Ladda ner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={cn(
              'px-6 py-4 bg-gradient-to-r text-white',
              previewTemplate.preview
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{previewTemplate.name}</h3>
                  <p className="text-white/80">{previewTemplate.category}</p>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-slate-100 rounded-xl p-8">
                {/* Mock CV */}
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                  <div className={cn(
                    'h-24 rounded-lg mb-6 bg-gradient-to-r',
                    previewTemplate.preview
                  )} />
                  
                  <div className="space-y-6">
                    <div>
                      <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-full" />
                      <div className="h-3 bg-slate-200 rounded w-5/6" />
                      <div className="h-3 bg-slate-200 rounded w-4/6" />
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="h-5 bg-slate-300 rounded w-1/4 mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6">
                <h4 className="font-semibold text-slate-800 mb-3">Funktioner</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {previewTemplate.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600">
                      <Check className="w-5 h-5 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Stäng
              </button>
              <button
                onClick={() => {
                  handleDownload(previewTemplate)
                  setPreviewTemplate(null)
                }}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Ladda ner Word-mall
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">Tips för att välja mall</h3>
            <ul className="text-indigo-700 text-sm space-y-1">
              <li>• <strong>Kreativa branscher</strong> (design, marknadsföring) - välj en färgstark mall</li>
              <li>• <strong>Konservativa branscher</strong> (bank, juridik) - välj en professionell mall</li>
              <li>• <strong>Tech/IT</strong> - moderna mallar med clean design fungerar bra</li>
              <li>• Alla mallar är <strong>kompatibla med ATS</strong> (rekryteringssystem)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CVTemplates
