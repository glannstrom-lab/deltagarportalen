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
} from '@/components/ui/icons'
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

  // SIDEBAR LAYOUT - Two column with colored sidebar (Word-compatible)
  const generateSidebarTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${template.name} - CV Mall</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page { margin: 0cm; size: A4; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 0; line-height: 1.5; font-size: 10pt; }
table { border-collapse: collapse; }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="min-height: 842px;">
<tr>
<!-- SIDEBAR -->
<td width="35%" valign="top" style="background-color: ${primaryColor}; color: white; padding: 35px 25px;">

<!-- Photo Circle -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding-bottom: 20px;">
<table cellpadding="0" cellspacing="0">
<tr><td style="width: 100px; height: 100px; background-color: rgba(255,255,255,0.3); border: 4px solid rgba(255,255,255,0.5); text-align: center; font-size: 42px; vertical-align: middle;">👤</td></tr>
</table>
</td></tr>
</table>

<!-- Name & Title -->
<p style="font-size: 20pt; font-weight: bold; text-align: center; margin: 0 0 5px 0;">[Ditt Namn]</p>
<p style="font-size: 11pt; text-align: center; margin: 0 0 25px 0; opacity: 0.9;">[Din Titel]</p>

<!-- Contact Section -->
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px; margin-bottom: 12px;">Kontakt</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr><td style="padding: 6px 0; font-size: 9.5pt;">📧 &nbsp; [din.email@exempel.se]</td></tr>
<tr><td style="padding: 6px 0; font-size: 9.5pt;">📱 &nbsp; [070-123 45 67]</td></tr>
<tr><td style="padding: 6px 0; font-size: 9.5pt;">📍 &nbsp; [Stockholm]</td></tr>
<tr><td style="padding: 6px 0; font-size: 9.5pt;">🔗 &nbsp; [linkedin.com/in/dittnamn]</td></tr>
</table>

<!-- Skills Section -->
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px; margin-bottom: 12px;">Kompetenser</p>
<p style="font-size: 9pt; line-height: 2.2;">
<span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; margin: 2px;">[Kompetens 1]</span>
<span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; margin: 2px;">[Kompetens 2]</span>
<span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; margin: 2px;">[Kompetens 3]</span>
<span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; margin: 2px;">[Kompetens 4]</span>
<span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; margin: 2px;">[Kompetens 5]</span>
</p>

<!-- Languages Section -->
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px; margin: 20px 0 12px 0;">Språk</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding: 5px 0; font-size: 9.5pt;">Svenska</td><td align="right" style="padding: 5px 0; font-size: 9pt; opacity: 0.8;">Modersmål</td></tr>
<tr><td style="padding: 5px 0; font-size: 9.5pt;">Engelska</td><td align="right" style="padding: 5px 0; font-size: 9pt; opacity: 0.8;">Flytande</td></tr>
<tr><td style="padding: 5px 0; font-size: 9.5pt;">[Annat]</td><td align="right" style="padding: 5px 0; font-size: 9pt; opacity: 0.8;">[Nivå]</td></tr>
</table>

</td>

<!-- MAIN CONTENT -->
<td width="65%" valign="top" style="background-color: #ffffff; padding: 35px 35px;">

<!-- Header -->
<p style="font-size: 26pt; font-weight: bold; color: #1e293b; margin: 0 0 5px 0;">[Ditt Fullständiga Namn]</p>
<p style="font-size: 13pt; color: ${primaryColor}; font-weight: 500; margin: 0 0 20px 0;">[Din Yrkestitel / Profession]</p>
<hr style="border: none; border-top: 3px solid ${primaryColor}; margin-bottom: 25px;">

<!-- Profile Section -->
<p style="font-size: 11pt; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">✨ Profil</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr><td style="background-color: #f8fafc; padding: 15px; border-left: 4px solid ${primaryColor}; font-size: 10.5pt; color: #475569; line-height: 1.7;">
[Skriv en engagerande sammanfattning om dig själv här. Beskriv dina styrkor, dina viktigaste erfarenheter och vad du söker. 2-3 meningar som fångar uppmärksamhet.]
</td></tr>
</table>

<!-- Experience Section -->
<p style="font-size: 11pt; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;">💼 Erfarenhet</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px; border-left: 3px solid #e2e8f0; padding-left: 15px;">
<tr>
<td style="padding-left: 15px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-weight: bold; font-size: 11pt; color: #1e293b;">[Jobbtitel]</span></td>
<td align="right"><span style="font-size: 9pt; color: ${primaryColor}; background-color: #eef2ff; padding: 3px 10px;">[År] - Nu</span></td>
</tr>
</table>
<p style="font-size: 10pt; color: ${primaryColor}; font-weight: 600; margin: 4px 0 6px 0;">[Företagsnamn], [Stad]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0;">• [Beskriv en nyckelprestation]<br>• [Beskriv en annan viktig uppgift]<br>• [Lägg till fler punkter]</p>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border-left: 3px solid #e2e8f0; padding-left: 15px;">
<tr>
<td style="padding-left: 15px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-weight: bold; font-size: 11pt; color: #1e293b;">[Tidigare Titel]</span></td>
<td align="right"><span style="font-size: 9pt; color: ${primaryColor}; background-color: #eef2ff; padding: 3px 10px;">[År] - [År]</span></td>
</tr>
</table>
<p style="font-size: 10pt; color: ${primaryColor}; font-weight: 600; margin: 4px 0 6px 0;">[Tidigare Företag], [Stad]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0;">• [Beskriv dina uppgifter och resultat]</p>
</td>
</tr>
</table>

<!-- Education Section -->
<p style="font-size: 11pt; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">🎓 Utbildning</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr><td style="background-color: #f8fafc; padding: 12px 15px; border-left: 3px solid ${primaryColor};">
<p style="font-weight: bold; color: #1e293b; margin: 0 0 2px 0;">[Examen / Program]</p>
<p style="color: ${primaryColor}; font-size: 9.5pt; margin: 0 0 4px 0;">[Skola / Universitet]</p>
<p style="color: #94a3b8; font-size: 9pt; margin: 0;">[Startår] - [Slutår]</p>
</td></tr>
</table>

</td>
</tr>
</table>
</body>
</html>`

  // CREATIVE LAYOUT - Bold, colorful, artistic (Word-compatible)
  const generateCreativeTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${template.name} - CV Mall</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
<![endif]-->
<style>
@page { margin: 0cm; size: A4; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 0; }
table { border-collapse: collapse; }
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${primaryColor};">
<tr><td style="padding: 45px 40px 55px; text-align: center; color: white;">
<p style="font-size: 30pt; font-weight: bold; margin: 0 0 8px 0;">[Ditt Namn]</p>
<p style="font-size: 13pt; margin: 0 0 20px 0; opacity: 0.95;">[Din Kreativa Titel]</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="background-color: rgba(255,255,255,0.2); padding: 8px 18px; font-size: 10pt; margin-right: 10px;">📧 [email@exempel.se]</td>
<td width="15"></td>
<td style="background-color: rgba(255,255,255,0.2); padding: 8px 18px; font-size: 10pt;">📱 [070-123 45 67]</td>
<td width="15"></td>
<td style="background-color: rgba(255,255,255,0.2); padding: 8px 18px; font-size: 10pt;">📍 [Stockholm]</td>
</tr>
</table>
</td></tr>
</table>

<!-- PHOTO CIRCLE -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff;">
<tr><td align="center" style="padding: 0;">
<table cellpadding="0" cellspacing="0" style="margin-top: -35px;">
<tr><td style="width: 90px; height: 90px; background-color: white; border: 5px solid ${primaryColor}; text-align: center; vertical-align: middle; font-size: 36px;">👤</td></tr>
</table>
</td></tr>
</table>

<!-- CONTENT -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff;">
<tr><td style="padding: 30px 50px 40px;">

<!-- Profile Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr>
<td style="font-size: 13pt; font-weight: bold; color: ${primaryColor}; padding-bottom: 5px;">✨ Om Mig</td>
<td style="border-bottom: 3px solid ${primaryColor}; width: 70%;"></td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr><td style="background-color: white; padding: 25px; font-size: 11pt; color: #475569; line-height: 1.8;">
<span style="font-size: 48pt; color: ${primaryColor}; opacity: 0.2; font-family: Georgia, serif; float: left; line-height: 0.8; margin-right: 10px;">"</span>
[Berätta din historia här! Vad driver dig? Vad är din superkraft? Vad gör dig unik? Skriv med personlighet och passion - låt din kreativitet synas redan här.]
</td></tr>
</table>

<!-- Experience Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td style="font-size: 13pt; font-weight: bold; color: ${primaryColor}; padding-bottom: 5px;">🚀 Erfarenheter</td>
<td style="border-bottom: 3px solid ${primaryColor}; width: 65%;"></td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr>
<td width="48%" valign="top" style="background-color: white; padding: 20px; border-left: 4px solid ${primaryColor};">
<p style="font-weight: bold; font-size: 11pt; color: #1e293b; margin: 0 0 4px 0;">[Kreativ Titel]</p>
<p style="color: ${primaryColor}; font-weight: 600; font-size: 10pt; margin: 0 0 4px 0;">[Företag/Studio]</p>
<p style="font-size: 9pt; color: #94a3b8; background-color: #f1f5f9; padding: 3px 10px; display: inline-block; margin: 0 0 10px 0;">[År] - Nu</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0;">• [Projekt eller prestation]<br>• [Kreativ lösning du bidrog med]</p>
</td>
<td width="4%"></td>
<td width="48%" valign="top" style="background-color: white; padding: 20px; border-left: 4px solid ${secondaryColor};">
<p style="font-weight: bold; font-size: 11pt; color: #1e293b; margin: 0 0 4px 0;">[Tidigare Roll]</p>
<p style="color: ${secondaryColor}; font-weight: 600; font-size: 10pt; margin: 0 0 4px 0;">[Tidigare Plats]</p>
<p style="font-size: 9pt; color: #94a3b8; background-color: #f1f5f9; padding: 3px 10px; display: inline-block; margin: 0 0 10px 0;">[År] - [År]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0;">• [Vad du skapade eller åstadkom]</p>
</td>
</tr>
</table>

<!-- Skills Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td style="font-size: 13pt; font-weight: bold; color: ${primaryColor}; padding-bottom: 5px;">⚡ Superkrafter</td>
<td style="border-bottom: 3px solid ${primaryColor}; width: 65%;"></td>
</tr>
</table>
<p style="margin-bottom: 30px; line-height: 2.5;">
<span style="background-color: ${primaryColor}; color: white; padding: 10px 20px; font-size: 10pt; font-weight: 500; margin: 5px;">[Kreativ Kompetens]</span>
<span style="background-color: ${secondaryColor}; color: white; padding: 10px 20px; font-size: 10pt; font-weight: 500; margin: 5px;">[Design Tool]</span>
<span style="background-color: ${primaryColor}; color: white; padding: 10px 20px; font-size: 10pt; font-weight: 500; margin: 5px;">[Mjuk Kompetens]</span>
<span style="background-color: ${secondaryColor}; color: white; padding: 10px 20px; font-size: 10pt; font-weight: 500; margin: 5px;">[Teknisk Skill]</span>
<span style="background-color: ${primaryColor}; color: white; padding: 10px 20px; font-size: 10pt; font-weight: 500; margin: 5px;">[Passion]</span>
</p>

<!-- Education & Languages -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td style="font-size: 13pt; font-weight: bold; color: ${primaryColor}; padding-bottom: 5px;">🎓 Utbildning</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color: white; padding: 15px;">
<p style="font-weight: bold; color: #1e293b; font-size: 10pt; margin: 0 0 3px 0;">[Program/Examen]</p>
<p style="color: ${primaryColor}; font-size: 9pt; margin: 0 0 3px 0;">[Skola/Universitet]</p>
<p style="color: #94a3b8; font-size: 8.5pt; margin: 0;">[År] - [År]</p>
</td></tr>
</table>
</td>
<td width="4%"></td>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td style="font-size: 13pt; font-weight: bold; color: ${primaryColor}; padding-bottom: 5px;">🌍 Språk</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
<tr><td style="background-color: white; padding: 12px 15px;">
<p style="font-weight: bold; color: #1e293b; font-size: 10pt; margin: 0 0 2px 0;">Svenska</p>
<p style="color: ${primaryColor}; font-size: 9pt; margin: 0;">Modersmål</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color: white; padding: 12px 15px;">
<p style="font-weight: bold; color: #1e293b; font-size: 10pt; margin: 0 0 2px 0;">Engelska</p>
<p style="color: ${primaryColor}; font-size: 9pt; margin: 0;">Flytande</p>
</td></tr>
</table>
</td>
</tr>
</table>

</td></tr>
</table>
</body>
</html>`

  // EXECUTIVE/ELEGANT LAYOUT - Sophisticated, classic (Word-compatible)
  const generateExecutiveTemplate = (template: CVTemplate, primaryColor: string) => `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${template.name} - CV Mall</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
<![endif]-->
<style>
@page { margin: 0cm; size: A4; }
body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #fffbeb; color: #1c1917; }
table { border-collapse: collapse; }
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
<tr><td style="padding: 40px 50px; color: #f8fafc;">
<p style="font-size: 32pt; font-weight: normal; letter-spacing: 3px; margin: 0 0 8px 0;">[DITT FULLSTÄNDIGA NAMN]</p>
<p style="font-size: 13pt; font-style: italic; color: #d4af37; letter-spacing: 1px; margin: 0 0 18px 0;">[Din Professionella Titel]</p>
<table cellpadding="0" cellspacing="0">
<tr>
<td style="font-size: 10pt; color: #94a3b8; padding-right: 30px;">📧 [email@företag.se]</td>
<td style="font-size: 10pt; color: #94a3b8; padding-right: 30px;">📱 [070-123 45 67]</td>
<td style="font-size: 10pt; color: #94a3b8;">📍 [Stockholm, Sverige]</td>
</tr>
</table>
</td></tr>
</table>

<!-- GOLD BAR -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="height: 5px; background-color: #d4af37;"></td></tr>
</table>

<!-- CONTENT -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb;">
<tr><td style="padding: 35px 50px;">

<!-- Profile Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr><td style="font-size: 11pt; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; padding-bottom: 12px; border-bottom: 2px solid #d4af37;">
<span style="color: #d4af37;">✦</span> &nbsp; Professionell Profil
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr><td style="font-size: 11pt; line-height: 1.9; color: #374151; font-style: italic; padding: 22px; background-color: #fef3c7; border-left: 3px solid #d4af37;">
[Skriv en elegant och professionell sammanfattning. Fokusera på din ledarskapserfarenhet, strategiska kompetens och de resultat du har åstadkommit under din karriär. Håll tonen sofistikerad men personlig.]
</td></tr>
</table>

<!-- Experience Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr><td style="font-size: 11pt; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; padding-bottom: 12px; border-bottom: 2px solid #d4af37;">
<span style="color: #d4af37;">✦</span> &nbsp; Professionell Erfarenhet
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-left: 2px solid #e5e7eb; padding-left: 20px;">
<tr><td style="padding-left: 18px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-size: 12pt; font-weight: bold; color: #0f172a;">[Senior Titel / Chef]</span></td>
<td align="right"><span style="font-size: 9pt; color: #d4af37; background-color: #fef3c7; padding: 4px 14px; border: 1px solid #d4af37;">[År] - Nuvarande</span></td>
</tr>
</table>
<p style="font-size: 10.5pt; color: #d4af37; font-weight: 600; margin: 6px 0 8px 0;">[Företagsnamn], [Stad]</p>
<p style="font-size: 10pt; color: #4b5563; line-height: 1.7; margin: 0;">
• [Strategiskt initiativ du ledde och resultatet]<br>
• [Ledarskapsprestation med mätbara resultat]<br>
• [Affärspåverkan eller förändring du drev]
</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; border-left: 2px solid #e5e7eb; padding-left: 20px;">
<tr><td style="padding-left: 18px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-size: 12pt; font-weight: bold; color: #0f172a;">[Tidigare Seniorposition]</span></td>
<td align="right"><span style="font-size: 9pt; color: #d4af37; background-color: #fef3c7; padding: 4px 14px; border: 1px solid #d4af37;">[År] - [År]</span></td>
</tr>
</table>
<p style="font-size: 10.5pt; color: #d4af37; font-weight: 600; margin: 6px 0 8px 0;">[Tidigare Företag], [Stad]</p>
<p style="font-size: 10pt; color: #4b5563; line-height: 1.7; margin: 0;">• [Betydande bidrag och resultat]</p>
</td></tr>
</table>

<!-- Skills Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr><td style="font-size: 11pt; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; padding-bottom: 12px; border-bottom: 2px solid #d4af37;">
<span style="color: #d4af37;">✦</span> &nbsp; Kärnkompetenser
</td></tr>
</table>
<p style="margin-bottom: 30px; line-height: 2.2;">
<span style="background-color: #fffbeb; color: #92400e; padding: 8px 18px; border: 1px solid #d4af37; font-size: 9.5pt; letter-spacing: 0.5px; margin: 3px;">[Strategisk Planering]</span>
<span style="background-color: #fffbeb; color: #92400e; padding: 8px 18px; border: 1px solid #d4af37; font-size: 9.5pt; letter-spacing: 0.5px; margin: 3px;">[Ledarskap]</span>
<span style="background-color: #fffbeb; color: #92400e; padding: 8px 18px; border: 1px solid #d4af37; font-size: 9.5pt; letter-spacing: 0.5px; margin: 3px;">[Affärsutveckling]</span>
<span style="background-color: #fffbeb; color: #92400e; padding: 8px 18px; border: 1px solid #d4af37; font-size: 9.5pt; letter-spacing: 0.5px; margin: 3px;">[Förhandling]</span>
<span style="background-color: #fffbeb; color: #92400e; padding: 8px 18px; border: 1px solid #d4af37; font-size: 9.5pt; letter-spacing: 0.5px; margin: 3px;">[Projektledning]</span>
</p>

<!-- Education & Languages -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr><td style="font-size: 11pt; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; padding-bottom: 12px; border-bottom: 2px solid #d4af37;">
<span style="color: #d4af37;">✦</span> &nbsp; Utbildning
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding: 15px; background-color: #fefce8;">
<p style="font-weight: bold; color: #0f172a; font-size: 11pt; margin: 0 0 3px 0;">[Examen, t.ex. MBA]</p>
<p style="color: #d4af37; font-size: 10pt; margin: 0 0 5px 0;">[Universitet/Högskola]</p>
<p style="color: #6b7280; font-size: 9pt; margin: 0;">[År]</p>
</td></tr>
</table>
</td>
<td width="4%"></td>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr><td style="font-size: 11pt; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; padding-bottom: 12px; border-bottom: 2px solid #d4af37;">
<span style="color: #d4af37;">✦</span> &nbsp; Språk
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">
<table width="100%"><tr>
<td style="font-weight: 600; color: #0f172a;">Svenska</td>
<td align="right" style="color: #d4af37; font-size: 9.5pt;">Modersmål</td>
</tr></table>
</td></tr>
<tr><td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">
<table width="100%"><tr>
<td style="font-weight: 600; color: #0f172a;">Engelska</td>
<td align="right" style="color: #d4af37; font-size: 9.5pt;">Flytande</td>
</tr></table>
</td></tr>
<tr><td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">
<table width="100%"><tr>
<td style="font-weight: 600; color: #0f172a;">[Annat]</td>
<td align="right" style="color: #d4af37; font-size: 9.5pt;">[Nivå]</td>
</tr></table>
</td></tr>
</table>
</td>
</tr>
</table>

</td></tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb;">
<tr><td style="text-align: center; padding: 20px; color: #9ca3af; font-size: 9pt; font-style: italic; border-top: 1px solid #e5e7eb;">
CV skapat med mallen "${template.name}"
</td></tr>
</table>
</body>
</html>`

  // MINIMAL/SCANDINAVIAN LAYOUT - Clean, airy, focused (Word-compatible)
  const generateMinimalTemplate = (template: CVTemplate, primaryColor: string) => `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${template.name} - CV Mall</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
<![endif]-->
<style>
@page { margin: 2.5cm 3cm; size: A4; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 0; background: #ffffff; color: #171717; line-height: 1.7; font-size: 10.5pt; }
table { border-collapse: collapse; }
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 35px; padding-bottom: 25px; border-bottom: 1px solid #e5e5e5;">
<tr><td align="center">
<p style="font-size: 26pt; font-weight: 300; letter-spacing: 4px; color: #171717; margin: 0 0 8px 0; text-transform: uppercase;">[Ditt Namn]</p>
<p style="font-size: 11pt; color: #737373; letter-spacing: 2px; margin: 0 0 18px 0;">[Din Titel]</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="font-size: 9.5pt; color: #525252; padding: 0 15px;">📧 [email@exempel.se]</td>
<td style="font-size: 9.5pt; color: #737373;">•</td>
<td style="font-size: 9.5pt; color: #525252; padding: 0 15px;">📱 [070-123 45 67]</td>
<td style="font-size: 9.5pt; color: #737373;">•</td>
<td style="font-size: 9.5pt; color: #525252; padding: 0 15px;">📍 [Stockholm]</td>
</tr>
</table>
</td></tr>
</table>

<!-- Profile Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr><td>
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 3px; color: #a3a3a3; margin: 0 0 12px 0; font-weight: 600;">Profil</p>
<p style="font-size: 10.5pt; color: #404040; line-height: 1.9; margin: 0;">
[Skriv en rak och tydlig sammanfattning. Fokusera på det viktigaste - vem du är professionellt och vad du söker. Håll det kort och koncist.]
</p>
</td></tr>
</table>

<!-- Experience Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr><td>
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 3px; color: #a3a3a3; margin: 0 0 15px 0; font-weight: 600;">Erfarenhet</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr>
<td width="110" valign="top" style="font-size: 9pt; color: #737373; padding-top: 3px; text-align: right; padding-right: 25px;">[År] — Nu</td>
<td valign="top">
<p style="font-weight: 600; color: #171717; font-size: 11pt; margin: 0 0 2px 0;">[Jobbtitel]</p>
<p style="color: #525252; font-size: 10pt; margin: 0 0 8px 0;">[Företag], [Stad]</p>
<p style="color: #737373; font-size: 9.5pt; line-height: 1.6; margin: 0;">[Kortfattad beskrivning av dina viktigaste uppgifter och resultat]</p>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr>
<td width="110" valign="top" style="font-size: 9pt; color: #737373; padding-top: 3px; text-align: right; padding-right: 25px;">[År] — [År]</td>
<td valign="top">
<p style="font-weight: 600; color: #171717; font-size: 11pt; margin: 0 0 2px 0;">[Tidigare Titel]</p>
<p style="color: #525252; font-size: 10pt; margin: 0 0 8px 0;">[Tidigare Företag]</p>
<p style="color: #737373; font-size: 9.5pt; line-height: 1.6; margin: 0;">[Beskrivning av roll och resultat]</p>
</td>
</tr>
</table>

<!-- Skills Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
<tr><td>
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 3px; color: #a3a3a3; margin: 0 0 12px 0; font-weight: 600;">Kompetenser</p>
<p style="margin: 0; line-height: 2.2;">
<span style="background-color: #f5f5f5; color: #404040; padding: 6px 14px; font-size: 9pt; margin: 3px;">[Kompetens 1]</span>
<span style="background-color: #f5f5f5; color: #404040; padding: 6px 14px; font-size: 9pt; margin: 3px;">[Kompetens 2]</span>
<span style="background-color: #f5f5f5; color: #404040; padding: 6px 14px; font-size: 9pt; margin: 3px;">[Kompetens 3]</span>
<span style="background-color: #f5f5f5; color: #404040; padding: 6px 14px; font-size: 9pt; margin: 3px;">[Kompetens 4]</span>
<span style="background-color: #f5f5f5; color: #404040; padding: 6px 14px; font-size: 9pt; margin: 3px;">[Kompetens 5]</span>
</p>
</td></tr>
</table>

<!-- Education & Languages -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48%" valign="top">
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 3px; color: #a3a3a3; margin: 0 0 12px 0; font-weight: 600;">Utbildning</p>
<p style="font-weight: 600; color: #171717; font-size: 10pt; margin: 0 0 2px 0;">[Examen / Program]</p>
<p style="color: #525252; font-size: 9.5pt; margin: 0 0 3px 0;">[Lärosäte]</p>
<p style="color: #a3a3a3; font-size: 9pt; margin: 0;">[År] — [År]</p>
</td>
<td width="4%"></td>
<td width="48%" valign="top">
<p style="font-size: 9pt; text-transform: uppercase; letter-spacing: 3px; color: #a3a3a3; margin: 0 0 12px 0; font-weight: 600;">Språk</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">
<table width="100%"><tr>
<td>Svenska</td>
<td align="right" style="color: #737373;">Modersmål</td>
</tr></table>
</td></tr>
<tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f5;">
<table width="100%"><tr>
<td>Engelska</td>
<td align="right" style="color: #737373;">Flytande</td>
</tr></table>
</td></tr>
</table>
</td>
</tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 45px;">
<tr><td align="center" style="font-size: 8pt; color: #d4d4d4;">
CV skapat med ${template.name}
</td></tr>
</table>
</body>
</html>`

  // TECH/MODERN LAYOUT - Clean tech aesthetic (Word-compatible)
  const generateTechTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${template.name} - CV Mall</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
<![endif]-->
<style>
@page { margin: 0cm; size: A4; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #0f172a; }
table { border-collapse: collapse; }
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${primaryColor};">
<tr><td style="padding: 35px 50px; color: white;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td valign="top">
<p style="font-size: 26pt; font-weight: bold; margin: 0 0 5px 0;">[Ditt Namn]</p>
<p style="font-size: 13pt; opacity: 0.9; margin: 0;">[Din Tech-titel, t.ex. Full-Stack Developer]</p>
</td>
<td valign="top" align="right" style="font-size: 9.5pt; opacity: 0.9; line-height: 2;">
📧 [email@exempel.se]<br>
📱 [070-123 45 67]<br>
💻 [github.com/dittnamn]<br>
🔗 [linkedin.com/in/dittnamn]
</td>
</tr>
</table>
</td></tr>
</table>

<!-- TECH BAR -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
<tr><td style="padding: 15px 50px;">
<span style="background-color: ${primaryColor}; color: white; padding: 6px 16px; font-size: 9pt; font-weight: 500; margin-right: 10px;">[JavaScript]</span>
<span style="background-color: ${secondaryColor}; color: white; padding: 6px 16px; font-size: 9pt; font-weight: 500; margin-right: 10px;">[React]</span>
<span style="background-color: ${primaryColor}; color: white; padding: 6px 16px; font-size: 9pt; font-weight: 500; margin-right: 10px;">[Node.js]</span>
<span style="background-color: ${secondaryColor}; color: white; padding: 6px 16px; font-size: 9pt; font-weight: 500; margin-right: 10px;">[TypeScript]</span>
<span style="background-color: ${primaryColor}; color: white; padding: 6px 16px; font-size: 9pt; font-weight: 500; margin-right: 10px;">[Python]</span>
<span style="background-color: ${secondaryColor}; color: white; padding: 6px 16px; font-size: 9pt; font-weight: 500;">[AWS]</span>
</td></tr>
</table>

<!-- CONTENT -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: white;">
<tr><td style="padding: 30px 50px;">

<!-- About Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr>
<td width="40" valign="middle" style="background-color: ${primaryColor}; padding: 10px; text-align: center; color: white; font-size: 16px;">👨‍💻</td>
<td style="padding-left: 12px; font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Om Mig</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr><td style="background-color: #f8fafc; padding: 20px; border-left: 4px solid ${primaryColor}; font-size: 10.5pt; color: #475569; line-height: 1.8;">
[Beskriv din passion för teknologi och vad som driver dig som utvecklare. Nämn dina specialområden och vad du söker i din nästa roll. Var konkret med teknologier och metoder du behärskar.]
</td></tr>
</table>

<!-- Experience Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td width="40" valign="middle" style="background-color: ${primaryColor}; padding: 10px; text-align: center; color: white; font-size: 16px;">💼</td>
<td style="padding-left: 12px; font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Erfarenhet</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr><td style="background-color: #f8fafc; padding: 18px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-weight: bold; font-size: 11pt; color: #0f172a;">[Senior Developer / Tech Lead]</span></td>
<td align="right"><span style="font-size: 8.5pt; color: white; background-color: ${primaryColor}; padding: 4px 12px;">[År] - Nu</span></td>
</tr>
</table>
<p style="color: ${primaryColor}; font-weight: 600; font-size: 10pt; margin: 6px 0 10px 0;">[Tech-företag], [Stad]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0 0 10px 0;">
• [Tekniskt projekt du ledde eller bidrog till]<br>
• [Prestation med mätbart resultat, t.ex. "Ökade prestanda med 40%"]<br>
• [Arkitekturbeslut eller innovation]
</p>
<p style="margin: 0;">
<span style="background-color: white; color: #475569; padding: 3px 10px; font-size: 8pt; border: 1px solid #e2e8f0; margin-right: 5px;">[React]</span>
<span style="background-color: white; color: #475569; padding: 3px 10px; font-size: 8pt; border: 1px solid #e2e8f0; margin-right: 5px;">[Node.js]</span>
<span style="background-color: white; color: #475569; padding: 3px 10px; font-size: 8pt; border: 1px solid #e2e8f0; margin-right: 5px;">[PostgreSQL]</span>
<span style="background-color: white; color: #475569; padding: 3px 10px; font-size: 8pt; border: 1px solid #e2e8f0;">[Docker]</span>
</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr><td style="background-color: #f8fafc; padding: 18px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-weight: bold; font-size: 11pt; color: #0f172a;">[Tidigare Developer-roll]</span></td>
<td align="right"><span style="font-size: 8.5pt; color: white; background-color: ${secondaryColor}; padding: 4px 12px;">[År] - [År]</span></td>
</tr>
</table>
<p style="color: ${primaryColor}; font-weight: 600; font-size: 10pt; margin: 6px 0 10px 0;">[Tidigare Företag]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0 0 10px 0;">• [Vad du byggde eller förbättrade]</p>
<p style="margin: 0;">
<span style="background-color: white; color: #475569; padding: 3px 10px; font-size: 8pt; border: 1px solid #e2e8f0; margin-right: 5px;">[Tech]</span>
<span style="background-color: white; color: #475569; padding: 3px 10px; font-size: 8pt; border: 1px solid #e2e8f0;">[Stack]</span>
</p>
</td></tr>
</table>

<!-- Skills Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td width="40" valign="middle" style="background-color: ${primaryColor}; padding: 10px; text-align: center; color: white; font-size: 16px;">⚡</td>
<td style="padding-left: 12px; font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Teknisk Kompetens</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; background-color: #f8fafc; padding: 20px;">
<tr><td style="padding: 20px;">
<!-- Frontend -->
<p style="font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Frontend</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
<tr>
<td width="100" style="font-size: 9.5pt; color: #0f172a;">[React]</td>
<td><table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="90%" style="background-color: #e2e8f0; height: 8px;"><div style="width: 90%; height: 8px; background-color: ${primaryColor};"></div></td>
<td width="10%"></td>
</tr></table></td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr>
<td width="100" style="font-size: 9.5pt; color: #0f172a;">[TypeScript]</td>
<td><table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="85%" style="background-color: #e2e8f0; height: 8px;"><div style="width: 85%; height: 8px; background-color: ${primaryColor};"></div></td>
<td width="15%"></td>
</tr></table></td>
</tr>
</table>
<!-- Backend -->
<p style="font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Backend</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
<tr>
<td width="100" style="font-size: 9.5pt; color: #0f172a;">[Node.js]</td>
<td><table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="85%" style="background-color: #e2e8f0; height: 8px;"><div style="width: 85%; height: 8px; background-color: ${secondaryColor};"></div></td>
<td width="15%"></td>
</tr></table></td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="100" style="font-size: 9.5pt; color: #0f172a;">[Python]</td>
<td><table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="75%" style="background-color: #e2e8f0; height: 8px;"><div style="width: 75%; height: 8px; background-color: ${secondaryColor};"></div></td>
<td width="25%"></td>
</tr></table></td>
</tr>
</table>
</td></tr>
</table>

<!-- Education & Languages -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr>
<td width="40" valign="middle" style="background-color: ${primaryColor}; padding: 10px; text-align: center; color: white; font-size: 16px;">🎓</td>
<td style="padding-left: 12px; font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Utbildning</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color: #f8fafc; padding: 15px;">
<p style="font-weight: bold; color: #0f172a; font-size: 10pt; margin: 0 0 2px 0;">[Dataingenjör / CS Degree]</p>
<p style="color: ${primaryColor}; font-size: 9.5pt; margin: 0 0 4px 0;">[Universitet/Högskola]</p>
<p style="color: #94a3b8; font-size: 9pt; margin: 0;">[År] - [År]</p>
</td></tr>
</table>
</td>
<td width="4%"></td>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr>
<td width="40" valign="middle" style="background-color: ${primaryColor}; padding: 10px; text-align: center; color: white; font-size: 16px;">🌍</td>
<td style="padding-left: 12px; font-size: 12pt; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Språk</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
<tr><td style="background-color: #f8fafc; padding: 12px 15px;">
<p style="font-weight: bold; color: #0f172a; font-size: 10pt; margin: 0 0 2px 0;">Svenska</p>
<p style="color: ${primaryColor}; font-size: 9.5pt; margin: 0;">Modersmål</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color: #f8fafc; padding: 12px 15px;">
<p style="font-weight: bold; color: #0f172a; font-size: 10pt; margin: 0 0 2px 0;">Engelska</p>
<p style="color: ${primaryColor}; font-size: 9.5pt; margin: 0;">Flytande (dagligt i arbetet)</p>
</td></tr>
</table>
</td>
</tr>
</table>

</td></tr>
</table>
</body>
</html>`

  // MODERN DEFAULT LAYOUT - Clean and professional (Word-compatible)
  const generateModernTemplate = (template: CVTemplate, primaryColor: string, secondaryColor: string) => `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${template.name} - CV Mall</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
<![endif]-->
<style>
@page { margin: 0cm; size: A4; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; line-height: 1.6; font-size: 10.5pt; }
table { border-collapse: collapse; }
</style>
</head>
<body>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${primaryColor};">
<tr><td style="padding: 35px 50px; color: white;">
<p style="font-size: 28pt; font-weight: bold; margin: 0 0 6px 0;">[Ditt Namn]</p>
<p style="font-size: 13pt; opacity: 0.9; margin: 0 0 18px 0;">[Din Yrkestitel / Profession]</p>
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background-color: rgba(255,255,255,0.15); padding: 8px 16px; font-size: 10pt; margin-right: 10px;">📧 [din.email@exempel.se]</td>
<td width="10"></td>
<td style="background-color: rgba(255,255,255,0.15); padding: 8px 16px; font-size: 10pt;">📱 [070-123 45 67]</td>
<td width="10"></td>
<td style="background-color: rgba(255,255,255,0.15); padding: 8px 16px; font-size: 10pt;">📍 [Stockholm]</td>
<td width="10"></td>
<td style="background-color: rgba(255,255,255,0.15); padding: 8px 16px; font-size: 10pt;">🔗 [linkedin.com/in/dittnamn]</td>
</tr>
</table>
</td></tr>
</table>

<!-- ACCENT BAR -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="height: 4px; background-color: ${secondaryColor};"></td></tr>
</table>

<!-- CONTENT -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding: 30px 50px;">

<!-- Profile Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr><td style="font-size: 12pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor};">
✨ &nbsp; Profil
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr><td style="background-color: #f8fafc; padding: 20px; border-left: 4px solid ${primaryColor}; font-size: 10.5pt; color: #475569; line-height: 1.8;">
[Skriv en engagerande och professionell sammanfattning om dig själv. Beskriv dina styrkor, viktigaste erfarenheter och vad du söker i din nästa roll. 2-3 meningar som fångar uppmärksamhet.]
</td></tr>
</table>

<!-- Experience Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr><td style="font-size: 12pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor};">
💼 &nbsp; Arbetslivserfarenhet
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px; border-left: 3px solid #e2e8f0;">
<tr><td style="padding-left: 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-weight: bold; font-size: 11pt; color: #1e293b;">[Jobbtitel]</span></td>
<td align="right"><span style="font-size: 8.5pt; color: ${primaryColor}; background-color: #eef2ff; padding: 4px 14px;">[Månad År] - Nu</span></td>
</tr>
</table>
<p style="font-size: 10pt; color: ${primaryColor}; font-weight: 600; margin: 5px 0 8px 0;">[Företag], [Stad]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0;">
• [Beskriv en nyckelprestation eller ansvarsområde]<br>
• [Beskriv en annan viktig uppgift eller resultat]<br>
• [Lägg till fler punkter vid behov]
</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border-left: 3px solid #e2e8f0;">
<tr><td style="padding-left: 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td><span style="font-weight: bold; font-size: 11pt; color: #1e293b;">[Tidigare Jobbtitel]</span></td>
<td align="right"><span style="font-size: 8.5pt; color: ${primaryColor}; background-color: #eef2ff; padding: 4px 14px;">[Månad År] - [Månad År]</span></td>
</tr>
</table>
<p style="font-size: 10pt; color: ${primaryColor}; font-weight: 600; margin: 5px 0 8px 0;">[Tidigare Företag], [Stad]</p>
<p style="font-size: 9.5pt; color: #64748b; line-height: 1.6; margin: 0;">• [Beskriv dina arbetsuppgifter och prestationer]</p>
</td></tr>
</table>

<!-- Skills Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr><td style="font-size: 12pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor};">
⭐ &nbsp; Kompetenser
</td></tr>
</table>
<p style="margin-bottom: 25px; line-height: 2.2;">
<span style="background-color: #eef2ff; color: ${primaryColor}; padding: 8px 18px; font-size: 9.5pt; font-weight: 500; margin: 3px;">[Kompetens 1]</span>
<span style="background-color: #eef2ff; color: ${primaryColor}; padding: 8px 18px; font-size: 9.5pt; font-weight: 500; margin: 3px;">[Kompetens 2]</span>
<span style="background-color: #eef2ff; color: ${primaryColor}; padding: 8px 18px; font-size: 9.5pt; font-weight: 500; margin: 3px;">[Kompetens 3]</span>
<span style="background-color: #eef2ff; color: ${primaryColor}; padding: 8px 18px; font-size: 9.5pt; font-weight: 500; margin: 3px;">[Kompetens 4]</span>
<span style="background-color: #eef2ff; color: ${primaryColor}; padding: 8px 18px; font-size: 9.5pt; font-weight: 500; margin: 3px;">[Kompetens 5]</span>
</p>

<!-- Education & Languages -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr><td style="font-size: 12pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor};">
🎓 &nbsp; Utbildning
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background-color: #f8fafc; padding: 15px; border-left: 3px solid ${primaryColor};">
<p style="font-weight: bold; color: #1e293b; font-size: 10.5pt; margin: 0 0 3px 0;">[Examen / Program]</p>
<p style="color: ${primaryColor}; font-size: 10pt; margin: 0 0 5px 0;">[Skola / Universitet]</p>
<p style="color: #94a3b8; font-size: 9pt; margin: 0;">[År] - [År]</p>
</td></tr>
</table>
</td>
<td width="4%"></td>
<td width="48%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
<tr><td style="font-size: 12pt; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor};">
🌍 &nbsp; Språk
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
<table width="100%"><tr>
<td style="font-weight: 600; color: #1e293b;">Svenska</td>
<td align="right" style="color: ${primaryColor}; font-size: 9.5pt;">Modersmål</td>
</tr></table>
</td></tr>
<tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
<table width="100%"><tr>
<td style="font-weight: 600; color: #1e293b;">Engelska</td>
<td align="right" style="color: ${primaryColor}; font-size: 9.5pt;">Flytande</td>
</tr></table>
</td></tr>
<tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
<table width="100%"><tr>
<td style="font-weight: 600; color: #1e293b;">[Annat språk]</td>
<td align="right" style="color: ${primaryColor}; font-size: 9.5pt;">[Nivå]</td>
</tr></table>
</td></tr>
</table>
</td>
</tr>
</table>

</td></tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="text-align: center; padding: 20px; color: #94a3b8; font-size: 9pt; border-top: 1px solid #e5e7eb;">
CV skapat med mallen "${template.name}" från Jobin
</td></tr>
</table>
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
