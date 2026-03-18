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
    const secondaryColor = colors.split(',')[1]?.trim() || primaryColor

    // Determine layout style based on template
    const isSidebar = template.id.includes('sidebar') || template.id.includes('nature')
    const isMinimal = template.id.includes('minimal') || template.id.includes('mono') || template.id.includes('Scandinavian')
    const isExecutive = template.id.includes('elegant') || template.id.includes('corporate')
    const isCreative = template.id.includes('creative') || template.id.includes('artistic') || template.id.includes('retro') || template.id.includes('story')
    const isTech = template.id.includes('tech') || template.id.includes('bold')

    // Get template-specific HTML
    let htmlContent: string

    if (isSidebar) {
      htmlContent = generateSidebarTemplate(template, primaryColor, secondaryColor)
    } else if (isCreative) {
      htmlContent = generateCreativeTemplate(template, primaryColor, secondaryColor)
    } else if (isExecutive) {
      htmlContent = generateExecutiveTemplate(template, primaryColor)
    } else if (isMinimal) {
      htmlContent = generateMinimalTemplate(template, primaryColor)
    } else if (isTech) {
      htmlContent = generateTechTemplate(template, primaryColor, secondaryColor)
    } else {
      htmlContent = generateModernTemplate(template, primaryColor, secondaryColor)
    }

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

  // SIDEBAR LAYOUT - Two column with colored sidebar
  const generateSidebarTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 0; size: A4; }
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; line-height: 1.5; font-size: 10pt; }
.cv-container { display: flex; min-height: 100vh; }
.sidebar { width: 35%; background: linear-gradient(180deg, ${primaryColor}, ${secondaryColor}); color: white; padding: 40px 25px; }
.main { width: 65%; padding: 40px 35px; background: #ffffff; }
.photo-circle { width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 4px solid rgba(255,255,255,0.3); margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
.sidebar-name { font-size: 22pt; font-weight: bold; text-align: center; margin-bottom: 5px; }
.sidebar-title { font-size: 11pt; text-align: center; opacity: 0.9; margin-bottom: 30px; }
.sidebar-section { margin-bottom: 25px; }
.sidebar-section-title { font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-bottom: 12px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; }
.contact-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 9.5pt; }
.contact-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.skill-tag { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 9pt; margin: 4px 4px 4px 0; }
.lang-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
.lang-level { opacity: 0.8; font-size: 9pt; background: rgba(255,255,255,0.15); padding: 2px 10px; border-radius: 10px; }
.main-header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${primaryColor}; }
.main-name { font-size: 28pt; font-weight: bold; color: #1e293b; margin-bottom: 5px; }
.main-title { font-size: 14pt; color: ${primaryColor}; font-weight: 500; }
.section { margin-bottom: 28px; }
.section-title { font-size: 11pt; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
.section-icon { color: ${primaryColor}; font-size: 16px; }
.profile-text { font-size: 10.5pt; color: #475569; line-height: 1.7; background: #f8fafc; padding: 18px; border-radius: 10px; border-left: 4px solid ${primaryColor}; }
.timeline { position: relative; padding-left: 20px; }
.timeline::before { content: ''; position: absolute; left: 0; top: 5px; bottom: 5px; width: 2px; background: #e2e8f0; }
.timeline-item { position: relative; margin-bottom: 22px; }
.timeline-dot { position: absolute; left: -24px; top: 3px; width: 10px; height: 10px; background: ${primaryColor}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px ${primaryColor}; }
.job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.job-title { font-weight: bold; font-size: 11pt; color: #1e293b; }
.job-date { font-size: 8.5pt; color: ${primaryColor}; background: #eef2ff; padding: 4px 12px; border-radius: 15px; }
.job-company { font-size: 10pt; color: ${primaryColor}; font-weight: 600; margin-bottom: 6px; }
.job-desc { font-size: 9.5pt; color: #64748b; line-height: 1.6; }
.edu-card { background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 3px solid ${primaryColor}; }
.edu-degree { font-weight: bold; color: #1e293b; margin-bottom: 2px; }
.edu-school { color: ${primaryColor}; font-size: 9.5pt; }
.edu-date { color: #94a3b8; font-size: 9pt; margin-top: 4px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="cv-container">
  <div class="sidebar">
    <div class="photo-circle">👤</div>
    <div class="sidebar-name">[Ditt Namn]</div>
    <div class="sidebar-title">[Din Titel]</div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">Kontakt</div>
      <div class="contact-item"><div class="contact-icon">📧</div><span>[din.email@exempel.se]</span></div>
      <div class="contact-item"><div class="contact-icon">📱</div><span>[070-123 45 67]</span></div>
      <div class="contact-item"><div class="contact-icon">📍</div><span>[Stockholm]</span></div>
      <div class="contact-item"><div class="contact-icon">🔗</div><span>[linkedin.com/in/dittnamn]</span></div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">Kompetenser</div>
      <span class="skill-tag">[Kompetens 1]</span>
      <span class="skill-tag">[Kompetens 2]</span>
      <span class="skill-tag">[Kompetens 3]</span>
      <span class="skill-tag">[Kompetens 4]</span>
      <span class="skill-tag">[Kompetens 5]</span>
      <span class="skill-tag">[Kompetens 6]</span>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">Språk</div>
      <div class="lang-item"><span>Svenska</span><span class="lang-level">Modersmål</span></div>
      <div class="lang-item"><span>Engelska</span><span class="lang-level">Flytande</span></div>
      <div class="lang-item"><span>[Annat]</span><span class="lang-level">[Nivå]</span></div>
    </div>
  </div>

  <div class="main">
    <div class="main-header">
      <div class="main-name">[Ditt Fullständiga Namn]</div>
      <div class="main-title">[Din Yrkestitel / Profession]</div>
    </div>

    <div class="section">
      <div class="section-title"><span class="section-icon">✨</span> Profil</div>
      <div class="profile-text">
        [Skriv en engagerande sammanfattning om dig själv här. Beskriv dina styrkor, dina viktigaste erfarenheter och vad du söker. 2-3 meningar som fångar uppmärksamhet.]
      </div>
    </div>

    <div class="section">
      <div class="section-title"><span class="section-icon">💼</span> Erfarenhet</div>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="job-header">
            <span class="job-title">[Jobbtitel]</span>
            <span class="job-date">[År] - Nu</span>
          </div>
          <div class="job-company">[Företagsnamn], [Stad]</div>
          <div class="job-desc">• [Beskriv en nyckelprestation]<br>• [Beskriv en annan viktig uppgift]<br>• [Lägg till fler punkter]</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="job-header">
            <span class="job-title">[Tidigare Titel]</span>
            <span class="job-date">[År] - [År]</span>
          </div>
          <div class="job-company">[Tidigare Företag], [Stad]</div>
          <div class="job-desc">• [Beskriv dina uppgifter och resultat]</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><span class="section-icon">🎓</span> Utbildning</div>
      <div class="edu-card">
        <div class="edu-degree">[Examen / Program]</div>
        <div class="edu-school">[Skola / Universitet]</div>
        <div class="edu-date">[Startår] - [Slutår]</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`

  // CREATIVE LAYOUT - Bold, colorful, artistic
  const generateCreativeTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 0; size: A4; }
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #faf5ff; }
.header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 50px 40px 60px; color: white; text-align: center; position: relative; }
.header::after { content: ''; position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; background: white; border-radius: 50%; border: 5px solid ${primaryColor}; display: flex; align-items: center; justify-content: center; }
.photo-placeholder { position: absolute; bottom: -35px; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; background: white; border-radius: 50%; border: 5px solid ${primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 40px; z-index: 10; }
.name { font-size: 32pt; font-weight: bold; margin-bottom: 8px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
.title { font-size: 14pt; opacity: 0.95; font-weight: 300; }
.contact-bar { display: flex; justify-content: center; gap: 25px; margin-top: 20px; font-size: 10pt; }
.contact-pill { background: rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 25px; backdrop-filter: blur(5px); }
.content { padding: 60px 50px 40px; }
.section { margin-bottom: 35px; }
.section-title { font-size: 13pt; font-weight: bold; color: ${primaryColor}; margin-bottom: 18px; display: flex; align-items: center; gap: 12px; }
.section-title::after { content: ''; flex: 1; height: 3px; background: linear-gradient(90deg, ${primaryColor}, transparent); border-radius: 3px; }
.profile-box { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); font-size: 11pt; color: #475569; line-height: 1.8; position: relative; }
.profile-box::before { content: '"'; position: absolute; top: 10px; left: 15px; font-size: 60pt; color: ${primaryColor}; opacity: 0.15; font-family: Georgia, serif; }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.exp-card { background: white; padding: 22px; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.06); border-left: 4px solid ${primaryColor}; }
.exp-title { font-weight: bold; font-size: 11pt; color: #1e293b; margin-bottom: 4px; }
.exp-company { color: ${primaryColor}; font-weight: 600; font-size: 10pt; margin-bottom: 4px; }
.exp-date { font-size: 9pt; color: #94a3b8; margin-bottom: 10px; display: inline-block; background: #f1f5f9; padding: 3px 10px; border-radius: 12px; }
.exp-desc { font-size: 9.5pt; color: #64748b; line-height: 1.6; }
.skills-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
.skill-bubble { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white; padding: 10px 20px; border-radius: 25px; font-size: 10pt; font-weight: 500; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.two-col { display: flex; gap: 30px; }
.col { flex: 1; }
.mini-card { background: white; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.mini-title { font-weight: bold; color: #1e293b; font-size: 10pt; margin-bottom: 3px; }
.mini-sub { color: ${primaryColor}; font-size: 9pt; }
.mini-detail { color: #94a3b8; font-size: 8.5pt; margin-top: 3px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <div class="name">[Ditt Namn]</div>
  <div class="title">[Din Kreativa Titel]</div>
  <div class="contact-bar">
    <span class="contact-pill">📧 [email@exempel.se]</span>
    <span class="contact-pill">📱 [070-123 45 67]</span>
    <span class="contact-pill">📍 [Stockholm]</span>
  </div>
  <div class="photo-placeholder">👤</div>
</div>

<div class="content">
  <div class="section">
    <div class="section-title">✨ Om Mig</div>
    <div class="profile-box">
      [Berätta din historia här! Vad driver dig? Vad är din superkraft? Vad gör dig unik? Skriv med personlighet och passion - låt din kreativitet synas redan här.]
    </div>
  </div>

  <div class="section">
    <div class="section-title">🚀 Erfarenheter</div>
    <div class="card-grid">
      <div class="exp-card">
        <div class="exp-title">[Kreativ Titel]</div>
        <div class="exp-company">[Företag/Studio]</div>
        <span class="exp-date">[År] - Nu</span>
        <div class="exp-desc">• [Projekt eller prestation]<br>• [Kreativ lösning du bidrog med]</div>
      </div>
      <div class="exp-card">
        <div class="exp-title">[Tidigare Roll]</div>
        <div class="exp-company">[Tidigare Plats]</div>
        <span class="exp-date">[År] - [År]</span>
        <div class="exp-desc">• [Vad du skapade eller åstadkom]</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚡ Superkrafter</div>
    <div class="skills-cloud">
      <span class="skill-bubble">[Kreativ Kompetens]</span>
      <span class="skill-bubble">[Design Tool]</span>
      <span class="skill-bubble">[Mjuk Kompetens]</span>
      <span class="skill-bubble">[Teknisk Skill]</span>
      <span class="skill-bubble">[Passion]</span>
      <span class="skill-bubble">[Expertis]</span>
    </div>
  </div>

  <div class="two-col">
    <div class="col">
      <div class="section">
        <div class="section-title">🎓 Utbildning</div>
        <div class="mini-card">
          <div class="mini-title">[Program/Examen]</div>
          <div class="mini-sub">[Skola/Universitet]</div>
          <div class="mini-detail">[År] - [År]</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-title">🌍 Språk</div>
        <div class="mini-card">
          <div class="mini-title">Svenska</div>
          <div class="mini-sub">Modersmål</div>
        </div>
        <div class="mini-card">
          <div class="mini-title">Engelska</div>
          <div class="mini-sub">Flytande</div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`

  // EXECUTIVE/ELEGANT LAYOUT - Sophisticated, classic
  const generateExecutiveTemplate = (template: CVTemplate, primaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 0; size: A4; }
body { font-family: 'Georgia', 'Times New Roman', serif; margin: 0; padding: 0; background: #fffbeb; color: #1c1917; }
.header { background: #0f172a; color: #f8fafc; padding: 45px 50px; }
.header-content { max-width: 700px; margin: 0 auto; }
.name { font-size: 34pt; font-weight: normal; letter-spacing: 3px; margin-bottom: 8px; }
.title { font-size: 13pt; font-style: italic; color: #d4af37; letter-spacing: 1px; margin-bottom: 20px; }
.contact-line { display: flex; gap: 30px; font-size: 10pt; color: #94a3b8; }
.gold-bar { height: 5px; background: linear-gradient(90deg, #d4af37, #fbbf24, #d4af37); }
.content { max-width: 700px; margin: 0 auto; padding: 40px 50px; }
.section { margin-bottom: 35px; }
.section-title { font-size: 11pt; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; padding-bottom: 12px; margin-bottom: 18px; border-bottom: 2px solid #d4af37; display: flex; align-items: center; gap: 12px; }
.gold-icon { color: #d4af37; font-size: 14px; }
.profile-elegant { font-size: 11pt; line-height: 1.9; color: #374151; font-style: italic; padding: 25px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 3px solid #d4af37; }
.exp-item { margin-bottom: 25px; padding-left: 20px; border-left: 2px solid #e5e7eb; }
.exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
.exp-title { font-size: 12pt; font-weight: bold; color: #0f172a; }
.exp-date { font-size: 9pt; color: #d4af37; background: #fef3c7; padding: 4px 14px; border: 1px solid #d4af37; }
.exp-company { font-size: 10.5pt; color: #d4af37; font-weight: 600; margin-bottom: 8px; }
.exp-desc { font-size: 10pt; color: #4b5563; line-height: 1.7; }
.skills-elegant { display: flex; flex-wrap: wrap; gap: 10px; }
.skill-gold { background: #fffbeb; color: #92400e; padding: 8px 18px; border: 1px solid #d4af37; font-size: 9.5pt; letter-spacing: 0.5px; }
.two-col { display: flex; gap: 40px; }
.col { flex: 1; }
.edu-elegant { padding: 18px; background: #fefce8; margin-bottom: 15px; }
.edu-degree { font-weight: bold; color: #0f172a; font-size: 11pt; margin-bottom: 3px; }
.edu-school { color: #d4af37; font-size: 10pt; }
.edu-date { color: #6b7280; font-size: 9pt; margin-top: 5px; }
.lang-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #fde68a; }
.lang-name { font-weight: 600; color: #0f172a; }
.lang-level { color: #d4af37; font-size: 9.5pt; }
.footer { text-align: center; padding: 25px; color: #9ca3af; font-size: 9pt; border-top: 1px solid #e5e7eb; font-style: italic; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <div class="header-content">
    <div class="name">[DITT FULLSTÄNDIGA NAMN]</div>
    <div class="title">[Din Professionella Titel]</div>
    <div class="contact-line">
      <span>📧 [email@företag.se]</span>
      <span>📱 [070-123 45 67]</span>
      <span>📍 [Stockholm, Sverige]</span>
    </div>
  </div>
</div>
<div class="gold-bar"></div>

<div class="content">
  <div class="section">
    <div class="section-title"><span class="gold-icon">✦</span> Professionell Profil</div>
    <div class="profile-elegant">
      [Skriv en elegant och professionell sammanfattning. Fokusera på din ledarskapserfarenhet, strategiska kompetens och de resultat du har åstadkommit under din karriär. Håll tonen sofistikerad men personlig.]
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="gold-icon">✦</span> Professionell Erfarenhet</div>
    <div class="exp-item">
      <div class="exp-header">
        <span class="exp-title">[Senior Titel / Chef]</span>
        <span class="exp-date">[År] - Nuvarande</span>
      </div>
      <div class="exp-company">[Företagsnamn], [Stad]</div>
      <div class="exp-desc">
        • [Strategiskt initiativ du ledde och resultatet]<br>
        • [Ledarskapsprestation med mätbara resultat]<br>
        • [Affärspåverkan eller förändring du drev]
      </div>
    </div>
    <div class="exp-item">
      <div class="exp-header">
        <span class="exp-title">[Tidigare Seniorposition]</span>
        <span class="exp-date">[År] - [År]</span>
      </div>
      <div class="exp-company">[Tidigare Företag], [Stad]</div>
      <div class="exp-desc">• [Betydande bidrag och resultat]</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="gold-icon">✦</span> Kärnkompetenser</div>
    <div class="skills-elegant">
      <span class="skill-gold">[Strategisk Planering]</span>
      <span class="skill-gold">[Ledarskap]</span>
      <span class="skill-gold">[Affärsutveckling]</span>
      <span class="skill-gold">[Förhandling]</span>
      <span class="skill-gold">[Projektledning]</span>
      <span class="skill-gold">[Förändringsledning]</span>
    </div>
  </div>

  <div class="two-col">
    <div class="col">
      <div class="section">
        <div class="section-title"><span class="gold-icon">✦</span> Utbildning</div>
        <div class="edu-elegant">
          <div class="edu-degree">[Examen, t.ex. MBA eller Civilingenjör]</div>
          <div class="edu-school">[Universitet/Högskola]</div>
          <div class="edu-date">[År]</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-title"><span class="gold-icon">✦</span> Språk</div>
        <div class="lang-row"><span class="lang-name">Svenska</span><span class="lang-level">Modersmål</span></div>
        <div class="lang-row"><span class="lang-name">Engelska</span><span class="lang-level">Flytande</span></div>
        <div class="lang-row"><span class="lang-name">[Annat]</span><span class="lang-level">[Nivå]</span></div>
      </div>
    </div>
  </div>
</div>

<div class="footer">CV skapat med mallen "${template.name}"</div>
</body>
</html>`

  // MINIMAL/SCANDINAVIAN LAYOUT - Clean, airy, focused
  const generateMinimalTemplate = (template: CVTemplate, primaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 30px 40px; size: A4; }
body { font-family: 'Segoe UI', -apple-system, Arial, sans-serif; margin: 0; padding: 40px 50px; background: #ffffff; color: #171717; line-height: 1.7; font-size: 10.5pt; }
.header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #e5e5e5; }
.name { font-size: 28pt; font-weight: 300; letter-spacing: 4px; color: #171717; margin-bottom: 8px; text-transform: uppercase; }
.title { font-size: 11pt; color: #737373; letter-spacing: 2px; margin-bottom: 20px; }
.contact-minimal { display: flex; justify-content: center; gap: 30px; font-size: 9.5pt; color: #525252; }
.contact-minimal span { display: flex; align-items: center; gap: 6px; }
.section { margin-bottom: 35px; }
.section-title { font-size: 9pt; text-transform: uppercase; letter-spacing: 3px; color: #a3a3a3; margin-bottom: 15px; font-weight: 600; }
.profile-minimal { font-size: 10.5pt; color: #404040; line-height: 1.9; max-width: 600px; }
.exp-minimal { margin-bottom: 25px; }
.exp-row { display: flex; gap: 30px; }
.exp-date-col { width: 120px; flex-shrink: 0; font-size: 9pt; color: #737373; padding-top: 3px; }
.exp-content { flex: 1; }
.exp-title { font-weight: 600; color: #171717; font-size: 11pt; margin-bottom: 2px; }
.exp-company { color: #525252; font-size: 10pt; margin-bottom: 8px; }
.exp-desc { color: #737373; font-size: 9.5pt; line-height: 1.6; }
.skills-minimal { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-plain { background: #f5f5f5; color: #404040; padding: 6px 14px; font-size: 9pt; }
.two-col { display: flex; gap: 50px; }
.col { flex: 1; }
.edu-minimal { margin-bottom: 15px; }
.edu-degree { font-weight: 600; color: #171717; font-size: 10pt; }
.edu-school { color: #525252; font-size: 9.5pt; }
.edu-date { color: #a3a3a3; font-size: 9pt; margin-top: 3px; }
.lang-minimal { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.footer { margin-top: 50px; text-align: center; font-size: 8pt; color: #d4d4d4; }
</style>
</head>
<body>
<div class="header">
  <div class="name">[Ditt Namn]</div>
  <div class="title">[Din Titel]</div>
  <div class="contact-minimal">
    <span>📧 [email@exempel.se]</span>
    <span>📱 [070-123 45 67]</span>
    <span>📍 [Stockholm]</span>
  </div>
</div>

<div class="section">
  <div class="section-title">Profil</div>
  <div class="profile-minimal">
    [Skriv en rak och tydlig sammanfattning. Fokusera på det viktigaste - vem du är professionellt och vad du söker. Håll det kort och koncist.]
  </div>
</div>

<div class="section">
  <div class="section-title">Erfarenhet</div>
  <div class="exp-minimal">
    <div class="exp-row">
      <div class="exp-date-col">[År] — Nu</div>
      <div class="exp-content">
        <div class="exp-title">[Jobbtitel]</div>
        <div class="exp-company">[Företag], [Stad]</div>
        <div class="exp-desc">[Kortfattad beskrivning av dina viktigaste uppgifter och resultat]</div>
      </div>
    </div>
  </div>
  <div class="exp-minimal">
    <div class="exp-row">
      <div class="exp-date-col">[År] — [År]</div>
      <div class="exp-content">
        <div class="exp-title">[Tidigare Titel]</div>
        <div class="exp-company">[Tidigare Företag]</div>
        <div class="exp-desc">[Beskrivning av roll och resultat]</div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Kompetenser</div>
  <div class="skills-minimal">
    <span class="skill-plain">[Kompetens 1]</span>
    <span class="skill-plain">[Kompetens 2]</span>
    <span class="skill-plain">[Kompetens 3]</span>
    <span class="skill-plain">[Kompetens 4]</span>
    <span class="skill-plain">[Kompetens 5]</span>
  </div>
</div>

<div class="two-col">
  <div class="col">
    <div class="section">
      <div class="section-title">Utbildning</div>
      <div class="edu-minimal">
        <div class="edu-degree">[Examen / Program]</div>
        <div class="edu-school">[Lärosäte]</div>
        <div class="edu-date">[År] — [År]</div>
      </div>
    </div>
  </div>
  <div class="col">
    <div class="section">
      <div class="section-title">Språk</div>
      <div class="lang-minimal"><span>Svenska</span><span>Modersmål</span></div>
      <div class="lang-minimal"><span>Engelska</span><span>Flytande</span></div>
    </div>
  </div>
</div>

<div class="footer">CV skapat med ${template.name}</div>
</body>
</html>`

  // TECH/MODERN LAYOUT - Clean tech aesthetic
  const generateTechTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 0; size: A4; }
body { font-family: 'Segoe UI', -apple-system, Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #0f172a; }
.header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 40px 50px; color: white; }
.header-grid { display: flex; justify-content: space-between; align-items: flex-start; }
.header-left { }
.name { font-size: 28pt; font-weight: bold; margin-bottom: 5px; }
.title { font-size: 13pt; opacity: 0.9; margin-bottom: 15px; }
.header-right { text-align: right; font-size: 9.5pt; opacity: 0.9; line-height: 2; }
.tech-bar { background: #0f172a; padding: 15px 50px; display: flex; gap: 15px; flex-wrap: wrap; }
.tech-tag { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white; padding: 6px 16px; border-radius: 20px; font-size: 9pt; font-weight: 500; }
.content { padding: 35px 50px; background: white; margin: 0; }
.section { margin-bottom: 30px; }
.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.section-icon { width: 36px; height: 36px; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; }
.section-title { font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
.profile-tech { font-size: 10.5pt; color: #475569; line-height: 1.8; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid ${primaryColor}; }
.exp-card { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 15px; }
.exp-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.exp-title { font-weight: bold; font-size: 11pt; color: #0f172a; }
.exp-date { font-size: 8.5pt; color: white; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 4px 12px; border-radius: 15px; }
.exp-company { color: ${primaryColor}; font-weight: 600; font-size: 10pt; margin-bottom: 10px; }
.exp-desc { font-size: 9.5pt; color: #64748b; line-height: 1.6; }
.exp-stack { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.stack-tag { background: white; color: #475569; padding: 3px 10px; border-radius: 4px; font-size: 8pt; border: 1px solid #e2e8f0; }
.skills-section { background: #f8fafc; padding: 25px; border-radius: 12px; }
.skill-category { margin-bottom: 18px; }
.skill-label { font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.skill-bars { }
.skill-item { display: flex; align-items: center; gap: 15px; margin-bottom: 8px; }
.skill-name { width: 120px; font-size: 9.5pt; color: #0f172a; }
.skill-bar { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.skill-fill { height: 100%; background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}); border-radius: 4px; }
.two-col { display: flex; gap: 30px; }
.col { flex: 1; }
.edu-tech { background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 12px; }
.edu-degree { font-weight: bold; color: #0f172a; font-size: 10pt; }
.edu-school { color: ${primaryColor}; font-size: 9.5pt; }
.edu-date { color: #94a3b8; font-size: 9pt; margin-top: 4px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <div class="header-grid">
    <div class="header-left">
      <div class="name">[Ditt Namn]</div>
      <div class="title">[Din Tech-titel, t.ex. Full-Stack Developer]</div>
    </div>
    <div class="header-right">
      📧 [email@exempel.se]<br>
      📱 [070-123 45 67]<br>
      💻 [github.com/dittnamn]<br>
      🔗 [linkedin.com/in/dittnamn]
    </div>
  </div>
</div>

<div class="tech-bar">
  <span class="tech-tag">[JavaScript]</span>
  <span class="tech-tag">[React]</span>
  <span class="tech-tag">[Node.js]</span>
  <span class="tech-tag">[TypeScript]</span>
  <span class="tech-tag">[Python]</span>
  <span class="tech-tag">[AWS]</span>
</div>

<div class="content">
  <div class="section">
    <div class="section-header">
      <div class="section-icon">👨‍💻</div>
      <div class="section-title">Om Mig</div>
    </div>
    <div class="profile-tech">
      [Beskriv din passion för teknologi och vad som driver dig som utvecklare. Nämn dina specialområden och vad du söker i din nästa roll. Var konkret med teknologier och metoder du behärskar.]
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-icon">💼</div>
      <div class="section-title">Erfarenhet</div>
    </div>
    <div class="exp-card">
      <div class="exp-top">
        <span class="exp-title">[Senior Developer / Tech Lead]</span>
        <span class="exp-date">[År] - Nu</span>
      </div>
      <div class="exp-company">[Tech-företag], [Stad]</div>
      <div class="exp-desc">
        • [Tekniskt projekt du ledde eller bidrog till]<br>
        • [Prestation med mätbart resultat, t.ex. "Ökade prestanda med 40%"]<br>
        • [Arkitekturbeslut eller innovation]
      </div>
      <div class="exp-stack">
        <span class="stack-tag">[React]</span>
        <span class="stack-tag">[Node.js]</span>
        <span class="stack-tag">[PostgreSQL]</span>
        <span class="stack-tag">[Docker]</span>
      </div>
    </div>
    <div class="exp-card">
      <div class="exp-top">
        <span class="exp-title">[Tidigare Developer-roll]</span>
        <span class="exp-date">[År] - [År]</span>
      </div>
      <div class="exp-company">[Tidigare Företag]</div>
      <div class="exp-desc">• [Vad du byggde eller förbättrade]</div>
      <div class="exp-stack">
        <span class="stack-tag">[Tech]</span>
        <span class="stack-tag">[Stack]</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-icon">⚡</div>
      <div class="section-title">Teknisk Kompetens</div>
    </div>
    <div class="skills-section">
      <div class="skill-category">
        <div class="skill-label">Frontend</div>
        <div class="skill-item"><span class="skill-name">[React]</span><div class="skill-bar"><div class="skill-fill" style="width: 90%"></div></div></div>
        <div class="skill-item"><span class="skill-name">[TypeScript]</span><div class="skill-bar"><div class="skill-fill" style="width: 85%"></div></div></div>
      </div>
      <div class="skill-category">
        <div class="skill-label">Backend</div>
        <div class="skill-item"><span class="skill-name">[Node.js]</span><div class="skill-bar"><div class="skill-fill" style="width: 85%"></div></div></div>
        <div class="skill-item"><span class="skill-name">[Python]</span><div class="skill-bar"><div class="skill-fill" style="width: 75%"></div></div></div>
      </div>
    </div>
  </div>

  <div class="two-col">
    <div class="col">
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🎓</div>
          <div class="section-title">Utbildning</div>
        </div>
        <div class="edu-tech">
          <div class="edu-degree">[Dataingenjör / CS Degree]</div>
          <div class="edu-school">[Universitet/Högskola]</div>
          <div class="edu-date">[År] - [År]</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🌍</div>
          <div class="section-title">Språk</div>
        </div>
        <div class="edu-tech">
          <div class="edu-degree">Svenska</div>
          <div class="edu-school">Modersmål</div>
        </div>
        <div class="edu-tech">
          <div class="edu-degree">Engelska</div>
          <div class="edu-school">Flytande (dagligt i arbetet)</div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`

  // MODERN DEFAULT LAYOUT - Clean and professional
  const generateModernTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${template.name} - CV Mall</title>
<style>
@page { margin: 0; size: A4; }
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; line-height: 1.6; font-size: 10.5pt; }
.header { background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); padding: 40px 50px; color: white; }
.name { font-size: 30pt; font-weight: bold; margin-bottom: 6px; }
.title { font-size: 14pt; opacity: 0.9; margin-bottom: 18px; }
.contact-row { display: flex; flex-wrap: wrap; gap: 25px; font-size: 10pt; }
.contact-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 25px; }
.accent-bar { height: 4px; background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${primaryColor}); }
.content { padding: 35px 50px; }
.section { margin-bottom: 30px; }
.section-title { font-size: 12pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 10px; margin-bottom: 18px; border-bottom: 2px solid ${primaryColor}; display: flex; align-items: center; gap: 10px; }
.section-icon { font-size: 16px; }
.profile-box { background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 22px; border-radius: 12px; border-left: 4px solid ${primaryColor}; font-size: 10.5pt; color: #475569; line-height: 1.8; }
.exp-timeline { position: relative; padding-left: 25px; }
.exp-timeline::before { content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px; width: 2px; background: #e2e8f0; }
.exp-item { position: relative; margin-bottom: 25px; }
.exp-dot { position: absolute; left: -22px; top: 5px; width: 12px; height: 12px; background: ${primaryColor}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px ${primaryColor}; }
.exp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
.exp-title { font-weight: bold; font-size: 11pt; color: #1e293b; }
.exp-date { font-size: 8.5pt; color: ${primaryColor}; background: #eef2ff; padding: 4px 14px; border-radius: 15px; }
.exp-company { font-size: 10pt; color: ${primaryColor}; font-weight: 600; margin-bottom: 8px; }
.exp-desc { font-size: 9.5pt; color: #64748b; line-height: 1.6; }
.skills-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.skill-tag { background: linear-gradient(135deg, #eef2ff, #e0e7ff); color: ${primaryColor}; padding: 8px 18px; border-radius: 25px; font-size: 9.5pt; font-weight: 500; }
.two-col { display: flex; gap: 35px; }
.col { flex: 1; }
.edu-card { background: #f8fafc; padding: 18px; border-radius: 12px; margin-bottom: 15px; border-left: 3px solid ${primaryColor}; }
.edu-degree { font-weight: bold; color: #1e293b; font-size: 10.5pt; margin-bottom: 3px; }
.edu-school { color: ${primaryColor}; font-size: 10pt; }
.edu-date { color: #94a3b8; font-size: 9pt; margin-top: 5px; }
.lang-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.lang-name { font-weight: 600; color: #1e293b; }
.lang-level { color: ${primaryColor}; font-size: 9.5pt; }
.footer { text-align: center; padding: 25px; color: #94a3b8; font-size: 9pt; border-top: 1px solid #e5e7eb; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="header">
  <div class="name">[Ditt Namn]</div>
  <div class="title">[Din Yrkestitel / Profession]</div>
  <div class="contact-row">
    <span class="contact-item">📧 [din.email@exempel.se]</span>
    <span class="contact-item">📱 [070-123 45 67]</span>
    <span class="contact-item">📍 [Stockholm]</span>
    <span class="contact-item">🔗 [linkedin.com/in/dittnamn]</span>
  </div>
</div>
<div class="accent-bar"></div>

<div class="content">
  <div class="section">
    <div class="section-title"><span class="section-icon">✨</span> Profil</div>
    <div class="profile-box">
      [Skriv en engagerande och professionell sammanfattning om dig själv. Beskriv dina styrkor, viktigaste erfarenheter och vad du söker i din nästa roll. 2-3 meningar som fångar uppmärksamhet.]
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">💼</span> Arbetslivserfarenhet</div>
    <div class="exp-timeline">
      <div class="exp-item">
        <div class="exp-dot"></div>
        <div class="exp-header">
          <span class="exp-title">[Jobbtitel]</span>
          <span class="exp-date">[Månad År] - Nu</span>
        </div>
        <div class="exp-company">[Företag], [Stad]</div>
        <div class="exp-desc">
          • [Beskriv en nyckelprestation eller ansvarsområde]<br>
          • [Beskriv en annan viktig uppgift eller resultat]<br>
          • [Lägg till fler punkter vid behov]
        </div>
      </div>
      <div class="exp-item">
        <div class="exp-dot"></div>
        <div class="exp-header">
          <span class="exp-title">[Tidigare Jobbtitel]</span>
          <span class="exp-date">[Månad År] - [Månad År]</span>
        </div>
        <div class="exp-company">[Tidigare Företag], [Stad]</div>
        <div class="exp-desc">• [Beskriv dina arbetsuppgifter och prestationer]</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-icon">⭐</span> Kompetenser</div>
    <div class="skills-grid">
      <span class="skill-tag">[Kompetens 1]</span>
      <span class="skill-tag">[Kompetens 2]</span>
      <span class="skill-tag">[Kompetens 3]</span>
      <span class="skill-tag">[Kompetens 4]</span>
      <span class="skill-tag">[Kompetens 5]</span>
      <span class="skill-tag">[Lägg till fler...]</span>
    </div>
  </div>

  <div class="two-col">
    <div class="col">
      <div class="section">
        <div class="section-title"><span class="section-icon">🎓</span> Utbildning</div>
        <div class="edu-card">
          <div class="edu-degree">[Examen / Program]</div>
          <div class="edu-school">[Skola / Universitet]</div>
          <div class="edu-date">[År] - [År]</div>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-title"><span class="section-icon">🌍</span> Språk</div>
        <div class="lang-item"><span class="lang-name">Svenska</span><span class="lang-level">Modersmål</span></div>
        <div class="lang-item"><span class="lang-name">Engelska</span><span class="lang-level">Flytande</span></div>
        <div class="lang-item"><span class="lang-name">[Annat språk]</span><span class="lang-level">[Nivå]</span></div>
      </div>
    </div>
  </div>
</div>

<div class="footer">CV skapat med mallen "${template.name}" från Jobin</div>
</body>
</html>`

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
            {/* Preview - Enhanced Realistic CV Mockup */}
            <div className={cn(
              'h-64 bg-gradient-to-br relative overflow-hidden',
              template.preview
            )}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white blur-2xl" />
                <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white blur-xl" />
              </div>

              {/* Realistic CV Preview */}
              <div className="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-hidden transform group-hover:scale-[1.02] group-hover:-rotate-1 transition-all duration-500">
                {/* CV Layout varies by template */}
                {template.id.includes('sidebar') || template.id.includes('nature') ? (
                  // Sidebar Layout - Enhanced
                  <div className="flex h-full">
                    <div className={cn('w-[38%] p-3 bg-gradient-to-b', template.preview)}>
                      <div className="w-10 h-10 rounded-full bg-white/30 mx-auto mb-2 ring-2 ring-white/40" />
                      <div className="h-2 bg-white/50 rounded w-4/5 mx-auto mb-1" />
                      <div className="h-1.5 bg-white/30 rounded w-3/5 mx-auto mb-4" />
                      <div className="space-y-0.5 mb-3">
                        <div className="h-0.5 bg-white/20 rounded w-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-white/20 flex-shrink-0" />
                          <div className="h-1 bg-white/30 rounded w-full" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-white/20 flex-shrink-0" />
                          <div className="h-1 bg-white/30 rounded w-4/5" />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <div className="h-2.5 w-8 bg-white/25 rounded-full" />
                        <div className="h-2.5 w-10 bg-white/25 rounded-full" />
                        <div className="h-2.5 w-6 bg-white/25 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 p-3 bg-white">
                      <div className="h-2.5 bg-slate-800 rounded w-3/4 mb-1" />
                      <div className="h-1.5 bg-violet-400 rounded w-1/2 mb-3" />
                      <div className="h-px bg-slate-200 mb-3" />
                      <div className="space-y-0.5 mb-3">
                        <div className="h-1 bg-slate-100 rounded w-full" />
                        <div className="h-1 bg-slate-100 rounded w-5/6" />
                      </div>
                      <div className="border-l-2 border-violet-300 pl-2 space-y-2">
                        <div>
                          <div className="h-1.5 bg-slate-700 rounded w-2/3 mb-0.5" />
                          <div className="h-1 bg-violet-200 rounded w-1/2 mb-0.5" />
                          <div className="h-0.5 bg-slate-100 rounded w-full" />
                        </div>
                        <div>
                          <div className="h-1.5 bg-slate-700 rounded w-1/2 mb-0.5" />
                          <div className="h-1 bg-violet-200 rounded w-2/5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('minimal') || template.id.includes('mono') || template.id.includes('Scandinavian') ? (
                  // Minimal Layout - Enhanced
                  <div className="h-full p-5 bg-white">
                    <div className="text-center mb-4">
                      <div className="h-3 bg-slate-800 rounded w-2/5 mx-auto mb-1.5" />
                      <div className="h-1.5 bg-slate-400 rounded w-1/4 mx-auto mb-3" />
                      <div className="flex justify-center gap-4 text-slate-300">
                        <div className="h-1 bg-slate-200 rounded w-16" />
                        <div className="h-1 bg-slate-200 rounded w-12" />
                        <div className="h-1 bg-slate-200 rounded w-14" />
                      </div>
                    </div>
                    <div className="h-px bg-slate-200 mb-4" />
                    <div className="space-y-4">
                      <div>
                        <div className="h-1 bg-slate-300 rounded w-1/5 mb-2 uppercase" />
                        <div className="h-1 bg-slate-100 rounded w-full mb-0.5" />
                        <div className="h-1 bg-slate-100 rounded w-5/6" />
                      </div>
                      <div className="flex gap-6">
                        <div className="w-20 text-right">
                          <div className="h-1 bg-slate-200 rounded w-full" />
                        </div>
                        <div className="flex-1">
                          <div className="h-1.5 bg-slate-600 rounded w-1/2 mb-0.5" />
                          <div className="h-1 bg-slate-300 rounded w-1/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('elegant') || template.id.includes('corporate') ? (
                  // Executive/Corporate Layout - Enhanced
                  <div className="h-full">
                    <div className="p-4 bg-slate-900">
                      <div className="h-3 bg-white/90 rounded w-2/5 mb-1.5" />
                      <div className="h-1.5 bg-amber-400 rounded w-1/4 mb-2" />
                      <div className="flex gap-3">
                        <div className="h-1 bg-white/40 rounded w-14" />
                        <div className="h-1 bg-white/40 rounded w-12" />
                        <div className="h-1 bg-white/40 rounded w-10" />
                      </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
                    <div className="p-4 bg-amber-50/50 space-y-3">
                      <div>
                        <div className="h-1 bg-slate-400 rounded w-1/4 mb-2 uppercase" />
                        <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
                        <div className="h-1 bg-slate-200 rounded w-4/5" />
                      </div>
                      <div>
                        <div className="h-1 bg-slate-400 rounded w-1/5 mb-2" />
                        <div className="flex gap-2">
                          <div className="h-2.5 px-2 bg-amber-100 rounded border border-amber-300" style={{width: '40px'}} />
                          <div className="h-2.5 px-2 bg-amber-100 rounded border border-amber-300" style={{width: '50px'}} />
                          <div className="h-2.5 px-2 bg-amber-100 rounded border border-amber-300" style={{width: '35px'}} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('creative') || template.id.includes('artistic') || template.id.includes('retro') || template.id.includes('story') ? (
                  // Creative Layout - Enhanced
                  <div className="h-full">
                    <div className={cn('relative h-16 bg-gradient-to-r flex items-center justify-center', template.preview)}>
                      <div className="absolute -bottom-5 w-12 h-12 rounded-full bg-white shadow-lg ring-4 ring-white flex items-center justify-center text-lg">👤</div>
                    </div>
                    <div className="pt-8 px-4 pb-4 bg-gradient-to-b from-purple-50 to-white">
                      <div className="text-center mb-3">
                        <div className="h-2.5 bg-slate-700 rounded w-2/5 mx-auto mb-1" />
                        <div className="h-1.5 bg-pink-400 rounded w-1/4 mx-auto" />
                      </div>
                      <div className="flex justify-center gap-1.5 mb-3">
                        <div className="h-2.5 w-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full" />
                        <div className="h-2.5 w-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
                        <div className="h-2.5 w-12 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-purple-100">
                          <div className="h-1.5 bg-slate-600 rounded w-3/4 mb-1" />
                          <div className="h-1 bg-pink-200 rounded w-1/2" />
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-purple-100">
                          <div className="h-1.5 bg-slate-600 rounded w-2/3 mb-1" />
                          <div className="h-1 bg-purple-200 rounded w-3/5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : template.id.includes('tech') || template.id.includes('bold') ? (
                  // Tech Layout - Enhanced
                  <div className="h-full">
                    <div className={cn('p-3 bg-gradient-to-r', template.preview)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="h-2.5 bg-white/95 rounded w-24 mb-1" />
                          <div className="h-1.5 bg-white/70 rounded w-16" />
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="h-1 bg-white/50 rounded w-16" />
                          <div className="h-1 bg-white/50 rounded w-12" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900 px-3 py-2 flex gap-1.5">
                      <div className="h-2 w-10 bg-cyan-500 rounded-full" />
                      <div className="h-2 w-8 bg-blue-500 rounded-full" />
                      <div className="h-2 w-12 bg-indigo-500 rounded-full" />
                      <div className="h-2 w-9 bg-violet-500 rounded-full" />
                    </div>
                    <div className="p-3 bg-white space-y-3">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="h-1.5 bg-slate-600 rounded w-1/2 mb-1" />
                        <div className="h-1 bg-slate-200 rounded w-full" />
                      </div>
                      <div>
                        <div className="h-1 bg-slate-300 rounded w-1/4 mb-2" />
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-16 h-1 bg-slate-200 rounded" />
                          <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full w-4/5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-slate-200 rounded" />
                          <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full w-3/5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Default Modern Layout - Enhanced
                  <div className="h-full">
                    <div className={cn('p-4 bg-gradient-to-r', template.preview)}>
                      <div className="h-3 bg-white/95 rounded w-1/2 mb-1.5" />
                      <div className="h-1.5 bg-white/70 rounded w-1/3 mb-3" />
                      <div className="flex gap-2">
                        <div className="h-2 bg-white/20 rounded-full px-2" style={{width: '50px'}} />
                        <div className="h-2 bg-white/20 rounded-full px-2" style={{width: '60px'}} />
                        <div className="h-2 bg-white/20 rounded-full px-2" style={{width: '45px'}} />
                      </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                    <div className="p-3 space-y-3">
                      <div className="bg-slate-50 p-2.5 rounded-lg border-l-3 border-indigo-400">
                        <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
                        <div className="h-1 bg-slate-200 rounded w-4/5" />
                      </div>
                      <div className="pl-3 border-l-2 border-slate-200">
                        <div className="h-1.5 bg-slate-600 rounded w-1/2 mb-0.5" />
                        <div className="h-1 bg-indigo-300 rounded w-1/3 mb-0.5" />
                        <div className="h-0.5 bg-slate-100 rounded w-full" />
                      </div>
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-12 bg-indigo-100 rounded-full" />
                        <div className="h-2.5 w-10 bg-purple-100 rounded-full" />
                        <div className="h-2.5 w-14 bg-indigo-100 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                {template.isNew && (
                  <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    NY
                  </span>
                )}
                {template.isPopular && (
                  <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3" />
                    POPULÄR
                  </span>
                )}
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-2 right-2">
                <span className="px-3 py-1.5 bg-white/95 text-slate-700 text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm border border-white/50">
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
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-8">
                {/* Realistic CV Preview - Layout depends on template type */}
                <div className="bg-white rounded-xl shadow-2xl max-w-xl mx-auto overflow-hidden transform hover:scale-[1.01] transition-transform">

                  {/* Sidebar Layout Preview */}
                  {(previewTemplate.id.includes('sidebar') || previewTemplate.id.includes('nature')) ? (
                    <div className="flex min-h-[400px]">
                      <div className={cn('w-[38%] p-5 bg-gradient-to-b text-white', previewTemplate.preview)}>
                        <div className="w-16 h-16 rounded-full bg-white/30 mx-auto mb-4 ring-4 ring-white/30 flex items-center justify-center text-2xl">👤</div>
                        <h3 className="text-lg font-bold text-center mb-1">Anna Andersson</h3>
                        <p className="text-sm text-center opacity-80 mb-6">Projektledare</p>

                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Kontakt</p>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2"><span className="opacity-70">📧</span> anna@exempel.se</div>
                              <div className="flex items-center gap-2"><span className="opacity-70">📱</span> 070-123 45 67</div>
                              <div className="flex items-center gap-2"><span className="opacity-70">📍</span> Stockholm</div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-2">Kompetenser</p>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2 py-1 bg-white/20 rounded-full text-[10px]">Projektledning</span>
                              <span className="px-2 py-1 bg-white/20 rounded-full text-[10px]">Agil</span>
                              <span className="px-2 py-1 bg-white/20 rounded-full text-[10px]">Scrum</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 p-5">
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Anna Andersson</h2>
                        <p className="text-indigo-600 font-medium mb-4">Projektledare</p>
                        <div className="border-t-2 border-indigo-200 pt-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <span className="text-indigo-500">✨</span> Profil
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Erfaren projektledare med 8+ års erfarenhet av att leda tvärfunktionella team.
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <span className="text-indigo-500">💼</span> Erfarenhet
                            </h4>
                            <div className="border-l-2 border-indigo-200 pl-3">
                              <p className="font-semibold text-sm text-slate-800">Senior Projektledare</p>
                              <p className="text-xs text-indigo-600">Tech AB • 2020 - Nu</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (previewTemplate.id.includes('minimal') || previewTemplate.id.includes('mono') || previewTemplate.id.includes('Scandinavian')) ? (
                    /* Minimal Layout Preview */
                    <div className="p-8 min-h-[400px]">
                      <div className="text-center mb-6 pb-6 border-b border-slate-200">
                        <h2 className="text-2xl font-light tracking-widest text-slate-800 uppercase mb-2">Anna Andersson</h2>
                        <p className="text-sm text-slate-500 tracking-wide">Projektledare</p>
                        <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400">
                          <span>anna@exempel.se</span>
                          <span>•</span>
                          <span>070-123 45 67</span>
                          <span>•</span>
                          <span>Stockholm</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] uppercase tracking-[3px] text-slate-400 mb-3">Profil</p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            Erfaren projektledare med 8+ års erfarenhet av att leda tvärfunktionella team och leverera komplexa projekt.
                          </p>
                        </div>

                        <div className="flex gap-8">
                          <div className="w-24 text-right text-xs text-slate-400">2020 — Nu</div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">Senior Projektledare</p>
                            <p className="text-sm text-slate-500">Tech AB, Stockholm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (previewTemplate.id.includes('elegant') || previewTemplate.id.includes('corporate')) ? (
                    /* Executive Layout Preview */
                    <div className="min-h-[400px]">
                      <div className="bg-slate-900 text-white p-6">
                        <h2 className="text-2xl font-serif tracking-wide mb-1">ANNA ANDERSSON</h2>
                        <p className="text-amber-400 italic">Projektledare</p>
                        <div className="flex gap-6 mt-3 text-xs text-slate-400">
                          <span>anna@exempel.se</span>
                          <span>070-123 45 67</span>
                          <span>Stockholm</span>
                        </div>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

                      <div className="p-6 bg-amber-50/30 space-y-5">
                        <div>
                          <h4 className="text-xs uppercase tracking-[2px] text-slate-700 mb-3 pb-2 border-b-2 border-amber-400 flex items-center gap-2">
                            <span className="text-amber-500">✦</span> Professionell Profil
                          </h4>
                          <p className="text-sm text-slate-600 italic leading-relaxed">
                            Erfaren projektledare med dokumenterad förmåga att leda komplexa projekt och leverera affärsresultat.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs uppercase tracking-[2px] text-slate-700 mb-3 pb-2 border-b-2 border-amber-400 flex items-center gap-2">
                            <span className="text-amber-500">✦</span> Kärnkompetenser
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs border border-amber-300">Strategisk Planering</span>
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs border border-amber-300">Ledarskap</span>
                            <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs border border-amber-300">Projektledning</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (previewTemplate.id.includes('tech') || previewTemplate.id.includes('bold')) ? (
                    /* Tech Layout Preview */
                    <div className="min-h-[400px]">
                      <div className={cn('p-5 bg-gradient-to-r text-white', previewTemplate.preview)}>
                        <div className="flex justify-between">
                          <div>
                            <h2 className="text-xl font-bold">Anna Andersson</h2>
                            <p className="opacity-90">Full-Stack Developer</p>
                          </div>
                          <div className="text-right text-xs opacity-80">
                            <p>anna@exempel.se</p>
                            <p>github.com/anna</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-900 px-5 py-2.5 flex gap-2">
                        <span className="px-3 py-1 bg-cyan-500 text-white text-xs rounded-full font-medium">React</span>
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">TypeScript</span>
                        <span className="px-3 py-1 bg-indigo-500 text-white text-xs rounded-full font-medium">Node.js</span>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-cyan-500">
                          <p className="text-sm text-slate-600">
                            Passionerad utvecklare med fokus på moderna webbteknologier och skalbar arkitektur.
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm">⚡</span>
                            Kompetens
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="w-20 text-xs text-slate-600">React</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-[90%] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-20 text-xs text-slate-600">Node.js</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-[85%] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (previewTemplate.id.includes('creative') || previewTemplate.id.includes('artistic') || previewTemplate.id.includes('retro') || previewTemplate.id.includes('story')) ? (
                    /* Creative Layout Preview */
                    <div className="min-h-[400px]">
                      <div className={cn('relative h-32 bg-gradient-to-r flex items-center justify-center', previewTemplate.preview)}>
                        <div className="absolute -bottom-8 w-20 h-20 rounded-full bg-white shadow-xl ring-4 ring-white flex items-center justify-center text-3xl">👩‍💻</div>
                      </div>
                      <div className="pt-12 px-6 pb-6 bg-gradient-to-b from-purple-50 to-white">
                        <div className="text-center mb-4">
                          <h2 className="text-xl font-bold text-slate-800">Anna Andersson</h2>
                          <p className="text-pink-600">Kreativ Designer</p>
                        </div>

                        <div className="flex justify-center gap-2 mb-6">
                          <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-full font-medium">Figma</span>
                          <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full font-medium">Adobe CC</span>
                          <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-xs rounded-full font-medium">UX/UI</span>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-lg border border-purple-100 mb-4">
                          <p className="text-sm text-slate-600 text-center italic">
                            "Jag skapar digitala upplevelser som engagerar och inspirerar."
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                            <p className="font-semibold text-sm text-slate-800">Senior Designer</p>
                            <p className="text-xs text-pink-600">Studio AB</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                            <p className="font-semibold text-sm text-slate-800">UX Designer</p>
                            <p className="text-xs text-purple-600">Agency XYZ</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Default Modern Layout Preview */
                    <div className="min-h-[400px]">
                      <div className={cn('p-6 bg-gradient-to-r text-white', previewTemplate.preview)}>
                        <h2 className="text-2xl font-bold mb-1">Anna Andersson</h2>
                        <p className="opacity-90 mb-4">Projektledare</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-3 py-1.5 bg-white/20 rounded-full backdrop-blur">📧 anna@exempel.se</span>
                          <span className="px-3 py-1.5 bg-white/20 rounded-full backdrop-blur">📱 070-123 45 67</span>
                          <span className="px-3 py-1.5 bg-white/20 rounded-full backdrop-blur">📍 Stockholm</span>
                        </div>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                      <div className="p-6 space-y-5">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2 pb-2 border-b-2 border-indigo-400">
                            <span className="text-indigo-500">✨</span> Profil
                          </h4>
                          <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-400">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Erfaren projektledare med 8+ års erfarenhet av att leda tvärfunktionella team och leverera komplexa projekt i tid och budget.
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 pb-2 border-b-2 border-indigo-400">
                            <span className="text-indigo-500">⭐</span> Kompetenser
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <span className={cn('text-xs px-4 py-1.5 rounded-full text-white font-medium bg-gradient-to-r', previewTemplate.preview)}>Agil</span>
                            <span className={cn('text-xs px-4 py-1.5 rounded-full text-white font-medium bg-gradient-to-r', previewTemplate.preview)}>Scrum</span>
                            <span className={cn('text-xs px-4 py-1.5 rounded-full text-white font-medium bg-gradient-to-r', previewTemplate.preview)}>Ledarskap</span>
                            <span className="text-xs px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">JIRA</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6">
                <h4 className="font-semibold text-slate-800 mb-3">Funktioner i denna mall</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {previewTemplate.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
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
