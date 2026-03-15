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
    const colors = getGradientColors(template.color)
    const primaryColor = colors.split(',')[0].trim()

    // Determine layout style based on template
    const isSidebar = template.id.includes('sidebar') || template.id.includes('creative') || template.id.includes('nature')
    const isMinimal = template.id.includes('minimal') || template.id.includes('mono')
    const isExecutive = template.id.includes('executive') || template.id.includes('corporate')

    // Create HTML content for Word with improved styling
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 0; }
body {
  font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: #1e293b;
  line-height: 1.6;
  font-size: 11pt;
}

/* Header Styles */
.header {
  background: linear-gradient(135deg, ${colors});
  padding: ${isMinimal ? '30px 40px' : '35px 40px'};
  color: ${isMinimal ? '#1e293b' : 'white'};
  ${isMinimal ? 'background: #f8fafc; border-bottom: 3px solid ' + primaryColor + ';' : ''}
}
.header-content {
  max-width: 700px;
  margin: 0 auto;
}
.name {
  font-size: ${isExecutive ? '28pt' : '26pt'};
  font-weight: bold;
  margin-bottom: 5px;
  letter-spacing: ${isExecutive ? '1px' : '0.5px'};
  ${isExecutive ? "font-family: 'Georgia', 'Times New Roman', serif;" : ''}
}
.title {
  font-size: 14pt;
  opacity: ${isMinimal ? '1' : '0.9'};
  margin-bottom: 15px;
  ${isMinimal ? 'color: #64748b;' : ''}
  ${isExecutive ? 'font-style: italic;' : ''}
}
.contact-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 10pt;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Accent Bar */
.accent-bar {
  height: ${isExecutive ? '4px' : '3px'};
  background: ${isExecutive ? '#d4af37' : primaryColor};
}

/* Content Area */
.content {
  padding: 30px 40px;
  max-width: 700px;
  margin: 0 auto;
}

/* Section Styles */
.section {
  margin-bottom: 25px;
  page-break-inside: avoid;
}
.section-title {
  font-size: 12pt;
  font-weight: bold;
  color: ${isExecutive ? '#1e3a5f' : primaryColor};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding-bottom: 8px;
  margin-bottom: 15px;
  border-bottom: ${isExecutive ? '2px solid #d4af37' : '2px solid ' + primaryColor};
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-icon {
  width: 18px;
  height: 18px;
}

/* Entry Styles (Jobs, Education) */
.entry {
  margin-bottom: 18px;
  padding-left: 15px;
  border-left: 2px solid #e2e8f0;
}
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 3px;
}
.entry-title {
  font-weight: bold;
  font-size: 11pt;
  color: #1e293b;
}
.entry-date {
  font-size: 9pt;
  color: ${primaryColor};
  background: ${isExecutive ? '#fef3c7' : '#eef2ff'};
  padding: 3px 10px;
  border-radius: 12px;
  white-space: nowrap;
}
.entry-company {
  font-size: 10pt;
  color: ${primaryColor};
  font-weight: 600;
  margin-bottom: 5px;
}
.entry-description {
  font-size: 10pt;
  color: #475569;
  line-height: 1.5;
}

/* Summary Box */
.summary-box {
  background: #f8fafc;
  padding: 18px 20px;
  border-radius: 8px;
  border-left: 4px solid ${primaryColor};
  font-size: 10.5pt;
  color: #334155;
  line-height: 1.7;
}

/* Skills */
.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.skill-tag {
  background: ${isExecutive ? '#fef3c7' : '#eef2ff'};
  color: ${isExecutive ? '#92400e' : primaryColor};
  padding: 5px 14px;
  border-radius: ${isMinimal ? '4px' : '20px'};
  font-size: 9pt;
  font-weight: 500;
  border: 1px solid ${isExecutive ? '#d4af37' : 'transparent'};
}

/* Two Column Layout */
.two-column {
  display: flex;
  gap: 30px;
}
.column {
  flex: 1;
}

/* Language & Certificate Items */
.list-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.list-item-name {
  font-weight: 600;
  color: #1e293b;
}
.list-item-detail {
  color: #64748b;
  font-size: 9pt;
}

/* Footer */
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  font-size: 9pt;
  color: #94a3b8;
  text-align: center;
}

/* Print Styles */
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-content">
      <div class="name">[Ditt Namn]</div>
      <div class="title">[Din Titel / Profession]</div>
      <div class="contact-row">
        <span class="contact-item">📧 [din.email@exempel.se]</span>
        <span class="contact-item">📱 [070-123 45 67]</span>
        <span class="contact-item">📍 [Stockholm]</span>
      </div>
    </div>
  </div>

  ${!isMinimal ? '<div class="accent-bar"></div>' : ''}

  <div class="content">
    <!-- Sammanfattning -->
    <div class="section">
      <div class="section-title">✨ Profil</div>
      <div class="summary-box">
        [Skriv en kort och engagerande sammanfattning om dig själv. Beskriv dina styrkor,
        dina viktigaste erfarenheter och vad du söker i din nästa roll. 2-3 meningar räcker.]
      </div>
    </div>

    <!-- Arbetslivserfarenhet -->
    <div class="section">
      <div class="section-title">💼 Arbetslivserfarenhet</div>

      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">[Jobbtitel]</span>
          <span class="entry-date">[Månad År] - Nu</span>
        </div>
        <div class="entry-company">[Företag], [Stad]</div>
        <div class="entry-description">
          • [Beskriv en nyckelprestation eller ansvarsområde]<br>
          • [Beskriv en annan viktig uppgift eller resultat]<br>
          • [Lägg till fler punkter vid behov]
        </div>
      </div>

      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">[Tidigare Jobbtitel]</span>
          <span class="entry-date">[Månad År] - [Månad År]</span>
        </div>
        <div class="entry-company">[Tidigare Företag], [Stad]</div>
        <div class="entry-description">
          • [Beskriv dina arbetsuppgifter och prestationer]
        </div>
      </div>
    </div>

    <!-- Utbildning -->
    <div class="section">
      <div class="section-title">🎓 Utbildning</div>

      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">[Examen / Program]</span>
          <span class="entry-date">[År] - [År]</span>
        </div>
        <div class="entry-company">[Skola / Universitet]</div>
      </div>
    </div>

    <!-- Kompetenser -->
    <div class="section">
      <div class="section-title">⭐ Kompetenser</div>
      <div class="skills-container">
        <span class="skill-tag">[Kompetens 1]</span>
        <span class="skill-tag">[Kompetens 2]</span>
        <span class="skill-tag">[Kompetens 3]</span>
        <span class="skill-tag">[Kompetens 4]</span>
        <span class="skill-tag">[Kompetens 5]</span>
        <span class="skill-tag">[Lägg till fler...]</span>
      </div>
    </div>

    <!-- Språk & Certifikat -->
    <div class="two-column">
      <div class="column">
        <div class="section">
          <div class="section-title">🌍 Språk</div>
          <div class="list-item">
            <span class="list-item-name">Svenska</span>
            <span class="list-item-detail">Modersmål</span>
          </div>
          <div class="list-item">
            <span class="list-item-name">Engelska</span>
            <span class="list-item-detail">Flytande</span>
          </div>
          <div class="list-item">
            <span class="list-item-name">[Annat språk]</span>
            <span class="list-item-detail">[Nivå]</span>
          </div>
        </div>
      </div>

      <div class="column">
        <div class="section">
          <div class="section-title">🏆 Certifikat</div>
          <div class="list-item">
            <span class="list-item-name">[Certifikat namn]</span>
            <span class="list-item-detail">[Utfärdare], [År]</span>
          </div>
          <div class="list-item">
            <span class="list-item-name">[Annat certifikat]</span>
            <span class="list-item-detail">[Utfärdare], [År]</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      CV skapat med mallen "${template.name}" från Jobin<br>
      <small style="color: #cbd5e1;">Tips: Ersätt all text inom [hakparenteser] med din egen information</small>
    </div>
  </div>
</body>
</html>`

    // Create blob and download
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
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
            {/* Preview - Realistic CV Mockup */}
            <div className={cn(
              'h-56 bg-gradient-to-br relative overflow-hidden',
              template.preview
            )}>
              {/* Realistic CV Preview */}
              <div className="absolute inset-3 bg-white rounded-lg shadow-2xl overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-300">
                {/* CV Layout varies by template */}
                {template.id.includes('sidebar') || template.id.includes('creative') || template.id.includes('nature') ? (
                  // Sidebar Layout
                  <div className="flex h-full">
                    <div className={cn('w-[35%] p-3 bg-gradient-to-b', template.preview)}>
                      <div className="w-8 h-8 rounded-full bg-white/30 mx-auto mb-2" />
                      <div className="h-1.5 bg-white/40 rounded w-3/4 mx-auto mb-1" />
                      <div className="h-1 bg-white/30 rounded w-1/2 mx-auto mb-3" />
                      <div className="space-y-1.5">
                        <div className="h-1 bg-white/25 rounded w-full" />
                        <div className="h-1 bg-white/25 rounded w-4/5" />
                        <div className="h-1 bg-white/25 rounded w-3/5" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <div className="h-2 w-6 bg-white/20 rounded-full" />
                        <div className="h-2 w-8 bg-white/20 rounded-full" />
                        <div className="h-2 w-5 bg-white/20 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 p-3 bg-white">
                      <div className="h-2 bg-slate-200 rounded w-2/3 mb-2" />
                      <div className="space-y-1">
                        <div className="h-1 bg-slate-100 rounded w-full" />
                        <div className="h-1 bg-slate-100 rounded w-5/6" />
                      </div>
                      <div className="mt-3 border-l-2 border-slate-200 pl-2 space-y-2">
                        <div>
                          <div className="h-1.5 bg-slate-300 rounded w-1/2 mb-1" />
                          <div className="h-1 bg-slate-100 rounded w-full" />
                        </div>
                        <div>
                          <div className="h-1.5 bg-slate-300 rounded w-2/5 mb-1" />
                          <div className="h-1 bg-slate-100 rounded w-4/5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('minimal') || template.id.includes('mono') ? (
                  // Minimal Layout
                  <div className="h-full p-4">
                    <div className="text-center mb-3">
                      <div className="h-2.5 bg-slate-800 rounded w-1/3 mx-auto mb-1" />
                      <div className="h-1.5 bg-slate-300 rounded w-1/4 mx-auto" />
                    </div>
                    <div className="h-px bg-slate-200 mb-3" />
                    <div className="space-y-3">
                      <div>
                        <div className="h-1.5 bg-slate-400 rounded w-1/4 mb-1" />
                        <div className="h-1 bg-slate-100 rounded w-full" />
                        <div className="h-1 bg-slate-100 rounded w-5/6 mt-0.5" />
                      </div>
                      <div>
                        <div className="h-1.5 bg-slate-400 rounded w-1/3 mb-1" />
                        <div className="h-1 bg-slate-100 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('executive') || template.id.includes('corporate') ? (
                  // Executive/Corporate Layout
                  <div className="h-full">
                    <div className={cn('p-3 bg-gradient-to-r', template.preview)}>
                      <div className="h-2.5 bg-white/90 rounded w-2/5 mb-1" />
                      <div className="h-1.5 bg-white/60 rounded w-1/4" />
                      <div className="flex gap-2 mt-2">
                        <div className="h-1 bg-white/40 rounded w-12" />
                        <div className="h-1 bg-white/40 rounded w-10" />
                      </div>
                    </div>
                    <div className="h-1 bg-amber-400" />
                    <div className="p-3 space-y-2">
                      <div className="h-1.5 bg-slate-300 rounded w-1/4 mb-1" />
                      <div className="h-1 bg-slate-100 rounded w-full" />
                      <div className="h-1 bg-slate-100 rounded w-4/5" />
                      <div className="flex gap-1 mt-2">
                        <div className="h-2 w-8 bg-amber-100 rounded border border-amber-300" />
                        <div className="h-2 w-10 bg-amber-100 rounded border border-amber-300" />
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('retro') || template.id.includes('story') ? (
                  // Creative/Story Layout
                  <div className="h-full">
                    <div className={cn('h-12 bg-gradient-to-r flex items-center justify-center', template.preview)}>
                      <div className="w-10 h-10 rounded-full bg-white/30 border-2 border-white/50" />
                    </div>
                    <div className="p-3 bg-white">
                      <div className="h-2 bg-slate-300 rounded w-1/2 mx-auto mb-2" />
                      <div className="flex justify-center gap-1 mb-3">
                        <div className="h-1.5 w-6 bg-orange-200 rounded-full" />
                        <div className="h-1.5 w-8 bg-pink-200 rounded-full" />
                        <div className="h-1.5 w-5 bg-red-200 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-1.5 bg-slate-50 rounded">
                          <div className="h-1 bg-slate-200 rounded w-3/4 mb-1" />
                          <div className="h-0.5 bg-slate-100 rounded w-full" />
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded">
                          <div className="h-1 bg-slate-200 rounded w-2/3 mb-1" />
                          <div className="h-0.5 bg-slate-100 rounded w-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Default Modern Layout
                  <div className="h-full">
                    <div className={cn('p-3 bg-gradient-to-r', template.preview)}>
                      <div className="h-2.5 bg-white/90 rounded w-1/2 mb-1" />
                      <div className="h-1.5 bg-white/60 rounded w-1/3 mb-2" />
                      <div className="flex gap-2">
                        <div className="h-1 bg-white/40 rounded w-10" />
                        <div className="h-1 bg-white/40 rounded w-12" />
                        <div className="h-1 bg-white/40 rounded w-8" />
                      </div>
                    </div>
                    <div className="p-3 space-y-3">
                      <div>
                        <div className="h-1.5 bg-indigo-400 rounded w-1/4 mb-1" />
                        <div className="h-1 bg-slate-100 rounded w-full" />
                        <div className="h-1 bg-slate-100 rounded w-5/6 mt-0.5" />
                      </div>
                      <div>
                        <div className="h-1.5 bg-indigo-400 rounded w-1/3 mb-1" />
                        <div className="flex gap-1">
                          <div className="h-2 w-8 bg-indigo-100 rounded-full" />
                          <div className="h-2 w-10 bg-indigo-100 rounded-full" />
                          <div className="h-2 w-6 bg-indigo-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                {template.isNew && (
                  <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-2.5 h-2.5" />
                    NY
                  </span>
                )}
                {template.isPopular && (
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-2.5 h-2.5" />
                    POPULÄR
                  </span>
                )}
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-2 right-2">
                <span className="px-2.5 py-1 bg-white/95 text-slate-700 text-[10px] font-semibold rounded-full shadow-md backdrop-blur-sm">
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
              <div className="bg-slate-100 rounded-xl p-6">
                {/* Realistic CV Preview */}
                <div className="bg-white rounded-lg shadow-xl max-w-xl mx-auto overflow-hidden">
                  {/* Header Section */}
                  <div className={cn(
                    'p-6 bg-gradient-to-r text-white',
                    previewTemplate.preview
                  )}>
                    <h3 className="text-2xl font-bold mb-1">Anna Andersson</h3>
                    <p className="text-white/80 mb-3">Projektledare</p>
                    <div className="flex flex-wrap gap-3 text-sm text-white/70">
                      <span>anna@exempel.se</span>
                      <span>•</span>
                      <span>070-123 45 67</span>
                      <span>•</span>
                      <span>Stockholm</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-5">
                    {/* Profile */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className={cn('w-1 h-4 rounded bg-gradient-to-b', previewTemplate.preview)} />
                        Profil
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Erfaren projektledare med 8+ års erfarenhet av att leda
                        tvärfunktionella team och leverera komplexa projekt i tid och budget.
                      </p>
                    </div>

                    {/* Experience */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className={cn('w-1 h-4 rounded bg-gradient-to-b', previewTemplate.preview)} />
                        Erfarenhet
                      </h4>
                      <div className="space-y-3">
                        <div className="border-l-2 border-slate-200 pl-3">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800">Senior Projektledare</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">2020 - Nu</span>
                          </div>
                          <p className="text-sm text-indigo-600">Tech AB, Stockholm</p>
                        </div>
                        <div className="border-l-2 border-slate-200 pl-3">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800">Projektledare</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">2017 - 2020</span>
                          </div>
                          <p className="text-sm text-indigo-600">Konsult AB</p>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className={cn('w-1 h-4 rounded bg-gradient-to-b', previewTemplate.preview)} />
                        Kompetenser
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className={cn('text-xs px-3 py-1 rounded-full text-white bg-gradient-to-r', previewTemplate.preview)}>Agil</span>
                        <span className={cn('text-xs px-3 py-1 rounded-full text-white bg-gradient-to-r', previewTemplate.preview)}>Scrum</span>
                        <span className={cn('text-xs px-3 py-1 rounded-full text-white bg-gradient-to-r', previewTemplate.preview)}>Ledarskap</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">JIRA</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600">MS Project</span>
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
