/**
 * PDF Export Service - Förbättrade moderna mallar
 * Matchar CVPreview-komponenten med bättre typografi och design
 *
 * PRESTANDA: Använder dynamisk import för att ladda jsPDF (~167KB)
 * endast när PDF-generering faktiskt efterfrågas.
 */

import type { CVData, JobData } from '@/types/pdf.types'
import type jsPDF from 'jspdf'

export type { CVData, JobData } from '@/types/pdf.types'

// Lazy-load jsPDF och autoTable för att minska initial bundle
let jsPDFModule: typeof import('jspdf') | null = null
let autoTableModule: typeof import('jspdf-autotable') | null = null

async function loadPDFLibraries(): Promise<typeof jsPDF> {
  if (!jsPDFModule) {
    const [jspdfLib, autoTableLib] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    jsPDFModule = jspdfLib
    autoTableModule = autoTableLib
    // Attach autoTable to jsPDF prototype
    ;(jsPDFModule.default as any).autoTable = autoTableModule.default
  }
  return jsPDFModule.default
}

interface TemplateConfig {
  layout: 'sidebar' | 'top' | 'split'
  colors: {
    sidebar: number[]
    sidebarText: number[]
    accent: number[]
    accentLight: number[]
    text: number[]
    muted: number[]
    border: number[]
    header?: number[]
    headerText?: number[]
    leftColumn?: number[]
    rightBg?: number[]
  }
  fonts: {
    heading: string
    body: string
  }
  features: {
    roundedPhoto?: boolean
    skillTags?: boolean
    progressBars?: boolean
    gradientHeader?: boolean
  }
}

// Template IDs match CVBuilder.tsx (English IDs)
const TEMPLATES: Record<string, TemplateConfig> = {
  sidebar: {
    layout: 'sidebar',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      sidebar: [15, 23, 42],
      sidebarText: [248, 250, 252],
      accent: [59, 130, 246],
      accentLight: [219, 234, 254],
      text: [30, 41, 59],
      muted: [100, 116, 139],
      border: [226, 232, 240],
    },
    features: { roundedPhoto: true, skillTags: true },
  },
  centered: {
    layout: 'top',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      header: [124, 58, 237],
      headerText: [255, 255, 255],
      accent: [124, 58, 237],
      accentLight: [237, 233, 254],
      text: [30, 27, 75],
      muted: [107, 114, 128],
      border: [229, 231, 235],
    },
    features: { gradientHeader: true, roundedPhoto: true },
  },
  minimal: {
    layout: 'top',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      header: [250, 250, 250],
      headerText: [23, 23, 23],
      accent: [23, 23, 23],
      accentLight: [245, 245, 245],
      text: [23, 23, 23],
      muted: [115, 115, 115],
      border: [229, 229, 229],
    },
    features: { roundedPhoto: false },
  },
  creative: {
    layout: 'split',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      leftColumn: [219, 39, 119],
      leftText: [255, 255, 255],
      rightBg: [253, 242, 248],
      accent: [190, 24, 93],
      accentLight: [252, 231, 243],
      text: [131, 24, 67],
      muted: [157, 23, 125],
      border: [251, 207, 232],
    },
    features: { progressBars: true, roundedPhoto: true },
  },
  executive: {
    layout: 'top',
    fonts: { heading: 'times', body: 'helvetica' },
    colors: {
      header: [15, 23, 42],
      headerText: [248, 250, 252],
      accent: [212, 175, 55],
      accentLight: [254, 252, 232],
      text: [15, 23, 42],
      muted: [71, 85, 105],
      border: [212, 175, 55],
    },
    features: { roundedPhoto: true },
  },
  nordic: {
    layout: 'sidebar',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      sidebar: [240, 249, 255],
      sidebarText: [12, 74, 110],
      accent: [2, 132, 199],
      accentLight: [224, 242, 254],
      text: [12, 74, 110],
      muted: [3, 105, 161],
      border: [186, 230, 253],
    },
    features: { roundedPhoto: true, skillTags: true },
  },
  // Legacy Swedish IDs for backwards compatibility
  sidokolumn: {
    layout: 'sidebar',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      sidebar: [15, 23, 42],
      sidebarText: [248, 250, 252],
      accent: [59, 130, 246],
      accentLight: [219, 234, 254],
      text: [30, 41, 59],
      muted: [100, 116, 139],
      border: [226, 232, 240],
    },
    features: { roundedPhoto: true, skillTags: true },
  },
  nordisk: {
    layout: 'sidebar',
    fonts: { heading: 'helvetica', body: 'helvetica' },
    colors: {
      sidebar: [240, 249, 255],
      sidebarText: [12, 74, 110],
      accent: [2, 132, 199],
      accentLight: [224, 242, 254],
      text: [12, 74, 110],
      muted: [3, 105, 161],
      border: [186, 230, 253],
    },
    features: { roundedPhoto: true, skillTags: true },
  },
}

// Helper för att hantera svenska tecken i PDF
// jsPDF stöder UTF-8 text direkt, men vi behöver hantera vissa specialtecken
function sanitizeText(str: string): string {
  if (!str) return ''
  // Ersätt bara problematiska tecken som kan orsaka rendering-problem
  return str
    .replace(/–/g, '-')  // en-dash
    .replace(/—/g, '-')  // em-dash
    .replace(/'/g, "'")  // smart quote
    .replace(/'/g, "'")  // smart quote
    .replace(/"/g, '"')  // smart quote
    .replace(/"/g, '"')  // smart quote
    .replace(/…/g, '...') // ellipsis
}

// Hämta bild som base64
async function getImageAsBase64(url: string): Promise<string | null> {
  try {
    if (url.startsWith('data:')) return url
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('Failed to load image:', e)
    return null
  }
}

// Beskär bild till cirkel med canvas
async function getCircularImage(url: string, size: number): Promise<string | null> {
  try {
    // Ladda bilden
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    const imgLoaded = new Promise<string>((resolve, reject) => {
      img.onload = () => {
        // Skapa canvas
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Töm canvas (transparent bakgrund)
        ctx.clearRect(0, 0, size, size)
        
        // Skapa cirkel-clip
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        
        // Rita bilden centrerad och täckande
        const aspectRatio = img.width / img.height
        let drawWidth = size
        let drawHeight = size
        let offsetX = 0
        let offsetY = 0
        
        if (aspectRatio > 1) {
          // Bred bild - anpassa höjden
          drawWidth = size * aspectRatio
          offsetX = -(drawWidth - size) / 2
        } else {
          // Hög bild - anpassa bredden
          drawHeight = size / aspectRatio
          offsetY = -(drawHeight - size) / 2
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        
        // Returnera som PNG för att behålla transparens
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    })
    
    // Om det är en URL, sätt src direkt
    if (url.startsWith('http') || url.startsWith('/')) {
      img.src = url
    } else if (url.startsWith('data:')) {
      img.src = url
    } else {
      // Försök hämta som base64 först
      const base64 = await getImageAsBase64(url)
      if (base64) {
        img.src = base64
      } else {
        return null
      }
    }
    
    return await imgLoaded
  } catch (e) {
    console.error('Failed to create circular image:', e)
    return null
  }
}

// Hämta skill name
function getSkillName(skill: string | { name: string } | Record<string, unknown>): string {
  if (typeof skill === 'string') return skill
  if (skill && typeof skill === 'object' && 'name' in skill && typeof skill.name === 'string') {
    return skill.name
  }
  return ''
}

export async function generateCVPDF(data: CVData): Promise<Blob> {
  // Ladda PDF-bibliotek dynamiskt (första gången)
  const jsPDFClass = await loadPDFLibraries()

  const template = TEMPLATES[data.template] || TEMPLATES.sidebar
  const isNordic = data.template === 'nordic' || data.template === 'nordisk'
  const isExecutive = data.template === 'executive'

  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  // Marginaler
  const margin = 15
  const pageWidth = 210
  const pageHeight = 297
  const contentWidth = pageWidth - (margin * 2)

  // ==================== SIDEBAR LAYOUT ====================
  if (template.layout === 'sidebar') {
    const sidebarWidth = isNordic ? 70 : 65
    const mainWidth = pageWidth - sidebarWidth

    // Sidokolumn bakgrund
    doc.setFillColor(...(isNordic ? [240, 249, 255] : template.colors.sidebar as [number, number, number]))
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F')

    // Profilbild (cirkelformad)
    let yPos = 20
    if (data.profileImage) {
      try {
        const imgSize = 44
        const imgX = (sidebarWidth - imgSize) / 2
        const imgY = 15
        
        // Skapa cirkelformad bild
        const circularImg = await getCircularImage(data.profileImage, 200)
        if (circularImg) {
          // Lägg till den cirkelformade bilden (PNG med transparens)
          doc.addImage(circularImg, 'PNG', imgX, imgY, imgSize, imgSize, undefined, 'FAST')
          
          // Vit kantlinje för att bilden ska synas mot mörk bakgrund
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(1.5)
          doc.circle(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 'S')
          
          yPos = 70
        }
      } catch (e) {
        console.error('Error adding profile image:', e)
        yPos = 20
      }
    }

    // Kontakt i sidokolumn
    doc.setTextColor(...(isNordic ? template.colors.sidebarText as [number, number, number] : [255, 255, 255]))
    doc.setFontSize(9)
    doc.setFont(template.fonts.heading, 'bold')
    doc.text('KONTAKT', margin, yPos)
    
    yPos += 8
    doc.setFont(template.fonts.body, 'normal')
    doc.setFontSize(8)
    
    const contactInfo = []
    if (data.email) contactInfo.push(data.email)
    if (data.phone) contactInfo.push(data.phone)
    if (data.location) contactInfo.push(data.location)
    
    contactInfo.forEach(info => {
      doc.text(sanitizeText(info), margin, yPos)
      yPos += 5
    })

    // Skills i sidokolumn
    if (data.skills?.length > 0) {
      yPos += 8
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(9)
      doc.text('EXPERTIS', margin, yPos)
      yPos += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(8)
      
      data.skills.slice(0, 10).forEach((skill) => {
        const skillText = sanitizeText(getSkillName(skill))
        doc.text(`• ${skillText}`, margin + 2, yPos)
        yPos += 4
      })
    }

    // Språk
    if (data.languages?.length > 0) {
      yPos += 8
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(9)
      doc.text('SPRÅK', margin, yPos)
      yPos += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(8)
      
      data.languages.forEach(lang => {
        const langName = sanitizeText(lang.language || lang.name || '')
        const langLevel = sanitizeText(lang.level || '')
        doc.text(`${langName} - ${langLevel}`, margin + 2, yPos)
        yPos += 4
      })
    }

    // Certifikat
    if (data.certificates?.length > 0) {
      yPos += 8
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(9)
      doc.text('CERTIFIERINGAR', margin, yPos)
      yPos += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(8)
      
      data.certificates.forEach(cert => {
        const certText = sanitizeText(cert.name)
        doc.text(`• ${certText}`, margin + 2, yPos)
        yPos += 4
      })
    }

    // HUVUDINNEHÅLL
    let mainY = 25
    const mainX = sidebarWidth + 15

    // Namn och titel
    doc.setTextColor(...template.colors.text as [number, number, number])
    doc.setFont(template.fonts.heading, 'bold')
    doc.setFontSize(24)
    doc.text(sanitizeText(`${data.firstName} ${data.lastName}`), mainX, mainY)
    
    mainY += 10
    if (data.title) {
      doc.setFontSize(14)
      doc.setTextColor(...template.colors.accent as [number, number, number])
      doc.text(sanitizeText(data.title), mainX, mainY)
      mainY += 5
    }

    // Linje under header
    doc.setDrawColor(...template.colors.border as [number, number, number])
    doc.setLineWidth(0.5)
    doc.line(mainX, mainY + 3, pageWidth - margin, mainY + 3)
    mainY += 12

    // Profil
    if (data.summary) {
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.text('PROFIL', mainX, mainY)
      mainY += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(10)
      const summaryLines = doc.splitTextToSize(sanitizeText(data.summary), mainWidth - 25)
      doc.text(summaryLines, mainX, mainY)
      mainY += summaryLines.length * 5 + 8
    }

    // Erfarenhet med timeline
    if (data.workExperience?.length > 0) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.text('ARBETSLIVSERFARENHET', mainX, mainY)
      mainY += 8

      data.workExperience.forEach(job => {
        // Sätt alltid rätt färg för jobbtitel
        doc.setTextColor(...template.colors.text as [number, number, number])
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(11)
        doc.text(sanitizeText(job.title), mainX, mainY)

        const dateText = `${job.startDate} - ${job.current ? 'Nu' : job.endDate}`
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        const dateWidth = doc.getTextWidth(dateText)
        doc.text(dateText, pageWidth - margin - dateWidth, mainY)

        mainY += 5
        doc.setFontSize(10)
        // Företagsnamn behåller accent-färg
        const companyText = sanitizeText(`${job.company}${job.location ? `, ${job.location}` : ''}`)
        doc.text(companyText, mainX, mainY)
        mainY += 5

        if (job.description) {
          doc.setTextColor(...template.colors.muted as [number, number, number])
          doc.setFontSize(9)
          const descLines = doc.splitTextToSize(sanitizeText(job.description), mainWidth - 25)
          doc.text(descLines, mainX, mainY)
          mainY += descLines.length * 4 + 6
        } else {
          mainY += 3
        }
      })
    }

    // Utbildning
    if (data.education?.length > 0) {
      mainY += 4
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.text('UTBILDNING', mainX, mainY)
      mainY += 8

      data.education.forEach(edu => {
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(11)
        doc.text(sanitizeText(edu.degree), mainX, mainY)
        
        const eduDate = `${edu.startDate} - ${edu.endDate}`
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        const dateWidth = doc.getTextWidth(eduDate)
        doc.text(eduDate, pageWidth - margin - dateWidth, mainY)
        
        mainY += 5
        doc.setFontSize(10)
        doc.text(sanitizeText(edu.school), mainX, mainY)
        mainY += 6
      })
    }
  }

  // ==================== TOP LAYOUT ====================
  else if (template.layout === 'top') {
    const isGradient = data.template === 'centered'
    
    // Header bakgrund
    if (isGradient) {
      doc.setFillColor(102, 126, 234)
      doc.rect(0, 0, pageWidth, 70, 'F')
    } else if (isExecutive) {
      doc.setFillColor(...template.colors.header as [number, number, number])
      doc.rect(0, 0, pageWidth, 70, 'F')
    } else {
      doc.setFillColor(...template.colors.header as [number, number, number])
      doc.rect(0, 0, pageWidth, 60, 'F')
    }

    let headerY = isGradient || isExecutive ? 30 : 25

    // Profilbild i header (cirkelformad)
    if (data.profileImage) {
      try {
        const imgSize = isGradient || isExecutive ? 30 : 25
        const imgX = margin
        const imgY = isGradient || isExecutive ? 20 : 15
        
        // Skapa cirkelformad bild
        const circularImg = await getCircularImage(data.profileImage, 150)
        if (circularImg) {
          // Vit bakgrundscirkel (behövs för att bilden ska synas mot färgad header)
          doc.setFillColor(255, 255, 255)
          doc.circle(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 1, 'F')
          
          // Lägg till den cirkelformade bilden (PNG med transparens)
          doc.addImage(circularImg, 'PNG', imgX + 1, imgY + 1, imgSize - 2, imgSize - 2, undefined, 'FAST')
          
          // Vit kantlinje
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(1)
          doc.circle(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 'S')
        }
      } catch (e) {
        console.error('Error adding header profile image:', e)
      }
    }

    // Namn och titel
    doc.setTextColor(...(isGradient || isExecutive ? [255, 255, 255] : template.colors.headerText as [number, number, number]))
    
    if (isExecutive) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(28)
      doc.text(sanitizeText(`${data.firstName} ${data.lastName}`), margin + (data.profileImage ? 45 : 0), headerY)
      
      headerY += 10
      if (data.title) {
        doc.setFont(template.fonts.heading, 'italic')
        doc.setFontSize(16)
        doc.text(sanitizeText(data.title), margin + (data.profileImage ? 45 : 0), headerY)
        headerY += 8
      }
    } else {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(24)
      doc.text(sanitizeText(`${data.firstName} ${data.lastName}`), margin + (data.profileImage ? 45 : 0), headerY)
      
      headerY += 10
      if (data.title) {
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(14)
        doc.text(sanitizeText(data.title), margin + (data.profileImage ? 45 : 0), headerY)
        headerY += 6
      }
    }

    // Kontakt i header
    headerY += 3
    doc.setFont(template.fonts.body, 'normal')
    doc.setFontSize(9)
    
    const contacts = []
    if (data.email) contacts.push(data.email)
    if (data.phone) contacts.push(data.phone)
    if (data.location) contacts.push(data.location)
    
    if (contacts.length > 0) {
      doc.text(sanitizeText(contacts.join(' | ')), margin + (data.profileImage ? 45 : 0), headerY)
    }

    // Huvudinnehåll
    let mainY = isGradient || isExecutive ? 85 : 75
    const colWidth = (contentWidth - 10) / 2

    // Profil (vänster kolumn, bredare)
    if (data.summary) {
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.text('OM MIG', margin, mainY)
      mainY += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(10)
      const summaryLines = doc.splitTextToSize(sanitizeText(data.summary), colWidth + 40)
      doc.text(summaryLines, margin, mainY)
      mainY += summaryLines.length * 5 + 8
    }

    // Skills
    if (data.skills?.length > 0) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.text('KOMPETENSER', margin, mainY)
      mainY += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...template.colors.muted as [number, number, number])
      
      const skillText = data.skills.map(s => sanitizeText(getSkillName(s))).join('  •  ')
      const skillLines = doc.splitTextToSize(skillText, contentWidth)
      doc.text(skillLines, margin, mainY)
      mainY += skillLines.length * 4 + 8
    }

    // Två kolumner för erfarenhet och utbildning
    const expY = mainY
    const eduY = mainY

    // Erfarenhet (vänster)
    if (data.workExperience?.length > 0) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.text('ERFARENHET', margin, expY)
      
      let expRowY = expY + 6
      doc.setFont(template.fonts.body, 'normal')
      
      data.workExperience.forEach(job => {
        // Sätt rätt färg för jobbtitel
        doc.setTextColor(...template.colors.text as [number, number, number])
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(10)
        doc.text(sanitizeText(job.title), margin, expRowY)
        expRowY += 4

        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        const dateText = `${job.startDate} - ${job.current ? 'Nu' : job.endDate}`
        doc.text(`${sanitizeText(job.company)}  •  ${dateText}`, margin, expRowY)
        expRowY += 4

        if (job.description) {
          doc.setTextColor(...template.colors.muted as [number, number, number])
          doc.setFontSize(8)
          const descLines = doc.splitTextToSize(sanitizeText(job.description), colWidth)
          doc.text(descLines, margin, expRowY)
          expRowY += descLines.length * 3.5 + 4
        } else {
          expRowY += 3
        }
      })
    }

    // Utbildning (höger)
    if (data.education?.length > 0) {
      const rightX = margin + colWidth + 10
      
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.text('UTBILDNING', rightX, eduY)
      
      let eduRowY = eduY + 6
      doc.setFont(template.fonts.body, 'normal')
      
      data.education.forEach(edu => {
        // Sätt rätt färg för utbildningstitel
        doc.setTextColor(...template.colors.text as [number, number, number])
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(10)
        doc.text(sanitizeText(edu.degree), rightX, eduRowY)
        eduRowY += 4

        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        doc.text(sanitizeText(edu.school), rightX, eduRowY)
        eduRowY += 4

        doc.setTextColor(...template.colors.muted as [number, number, number])
        doc.setFontSize(8)
        doc.text(`${edu.startDate} - ${edu.endDate}`, rightX, eduRowY)
        eduRowY += 6
      })
    }
  }

  // ==================== SPLIT LAYOUT (Kreativ) ====================
  else if (template.layout === 'split') {
    const leftWidth = 80
    const rightX = leftWidth + 15
    
    // Vänster kolumn (färgad)
    doc.setFillColor(...template.colors.leftColumn as [number, number, number])
    doc.rect(0, 0, leftWidth, pageHeight, 'F')

    let leftY = 20

    // Profilbild (cirkelformad)
    if (data.profileImage) {
      try {
        const imgSize = 45
        const imgX = (leftWidth - imgSize) / 2
        
        // Skapa cirkelformad bild
        const circularImg = await getCircularImage(data.profileImage, 200)
        if (circularImg) {
          // Lägg till den cirkelformade bilden (PNG med transparens)
          doc.addImage(circularImg, 'PNG', imgX, leftY, imgSize, imgSize, undefined, 'FAST')
          
          // Vit kantlinje för kontrast mot rosa bakgrund
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(2)
          doc.circle(imgX + imgSize/2, leftY + imgSize/2, imgSize/2, 'S')
          
          leftY += imgSize + 15
        }
      } catch (e) {
        console.error('Error adding split layout profile image:', e)
        leftY = 20
      }
    }

    // Namn (vänster)
    doc.setTextColor(255, 255, 255)
    doc.setFont(template.fonts.heading, 'bold')
    doc.setFontSize(18)
    const nameText = sanitizeText(`${data.firstName} ${data.lastName}`)
    const nameWidth = doc.getTextWidth(nameText)
    doc.text(nameText, (leftWidth - nameWidth) / 2, leftY)
    leftY += 8

    if (data.title) {
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(11)
      const titleText = sanitizeText(data.title)
      const titleWidth = doc.getTextWidth(titleText)
      doc.text(titleText, (leftWidth - titleWidth) / 2, leftY)
      leftY += 10
    }

    // Kontakt
    leftY += 5
    doc.setFontSize(9)
    
    if (data.email) {
      doc.text(sanitizeText(data.email), leftWidth / 2, leftY, { align: 'center' })
      leftY += 5
    }
    if (data.phone) {
      doc.text(sanitizeText(data.phone), leftWidth / 2, leftY, { align: 'center' })
      leftY += 5
    }
    if (data.location) {
      doc.text(sanitizeText(data.location), leftWidth / 2, leftY, { align: 'center' })
      leftY += 5
    }

    // Språk med progress bars
    if (data.languages?.length > 0) {
      leftY += 10
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(10)
      doc.text('SPRÅK', leftWidth / 2, leftY, { align: 'center' })
      leftY += 8

      data.languages.forEach(lang => {
        const langName = sanitizeText(lang.language || lang.name || '')
        const langLevel = sanitizeText(lang.level || '')
        
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.text(`${langName} - ${langLevel}`, leftWidth / 2, leftY, { align: 'center' })
        leftY += 8
      })
    }

    // Höger kolumn (innehåll)
    let rightY = 25
    const rightWidth = pageWidth - rightX - margin

    // Profil
    if (data.summary) {
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(14)
      doc.text('PROFIL', rightX, rightY)
      rightY += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(10)
      const summaryLines = doc.splitTextToSize(sanitizeText(data.summary), rightWidth)
      doc.text(summaryLines, rightX, rightY)
      rightY += summaryLines.length * 5 + 8
    }

    // Erfarenhet
    if (data.workExperience?.length > 0) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(14)
      doc.text('ERFARENHET', rightX, rightY)
      rightY += 8

      data.workExperience.forEach(job => {
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...template.colors.text as [number, number, number])
        doc.text(sanitizeText(job.title), rightX, rightY)
        
        const dateText = `${job.startDate} - ${job.current ? 'Nu' : job.endDate}`
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.muted as [number, number, number])
        const dateWidth = doc.getTextWidth(dateText)
        doc.text(dateText, pageWidth - margin - dateWidth, rightY)
        
        rightY += 5
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        doc.text(sanitizeText(job.company), rightX, rightY)
        rightY += 5
        
        if (job.description) {
          doc.setTextColor(...template.colors.muted as [number, number, number])
          doc.setFontSize(9)
          const descLines = doc.splitTextToSize(sanitizeText(job.description), rightWidth)
          doc.text(descLines, rightX, rightY)
          rightY += descLines.length * 4 + 5
        } else {
          rightY += 3
        }
      })
    }

    // Skills
    if (data.skills?.length > 0) {
      rightY += 4
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.text('KOMPETENSER', rightX, rightY)
      rightY += 6
      
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...template.colors.muted as [number, number, number])
      
      const skillText = data.skills.map(s => sanitizeText(getSkillName(s))).join('  •  ')
      const skillLines = doc.splitTextToSize(skillText, rightWidth)
      doc.text(skillLines, rightX, rightY)
      rightY += skillLines.length * 4 + 8
    }

    // Utbildning
    if (data.education?.length > 0) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...template.colors.text as [number, number, number])
      doc.text('UTBILDNING', rightX, rightY)
      rightY += 6

      data.education.forEach(edu => {
        // Sätt rätt färg för utbildningstitel
        doc.setTextColor(...template.colors.text as [number, number, number])
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(10)
        doc.text(sanitizeText(edu.degree), rightX, rightY)
        rightY += 4

        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        doc.text(sanitizeText(edu.school), rightX, rightY)
        rightY += 4
        
        doc.setTextColor(...template.colors.muted as [number, number, number])
        doc.text(`${edu.startDate} - ${edu.endDate}`, rightX, rightY)
        rightY += 6
      })
    }
  }

  return doc.output('blob')
}

/**
 * Generera PDF för jobbannons
 */
export async function generateJobPDF(job: JobData): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass()
  
  doc.setFontSize(20)
  doc.text(sanitizeText(job.title), 20, 30)
  
  doc.setFontSize(12)
  doc.text(sanitizeText(job.company), 20, 45)
  doc.text(sanitizeText(`${job.location || ''} • ${job.type || ''}`), 20, 55)
  
  doc.setFontSize(10)
  const description = job.description || ''
  const splitDescription = doc.splitTextToSize(sanitizeText(description), 170)
  doc.text(splitDescription, 20, 70)
  
  return doc.output('blob')
}

interface ApplicationHistoryItem {
  jobTitle?: string;
  job_title?: string;
  company?: string;
  status?: string;
  appliedDate?: string;
  applied_at?: string;
}

/**
 * Generera PDF för ansökningshistorik
 */
export async function generateApplicationHistoryPDF(applications: ApplicationHistoryItem[]): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass()

  doc.setFontSize(20)
  doc.text('Ansokningshistorik', 20, 30)

  let y = 50
  applications.forEach((app, index) => {
    if (y > 250) {
      doc.addPage()
      y = 30
    }

    doc.setFontSize(12)
    doc.text(sanitizeText(`${index + 1}. ${app.jobTitle || app.job_title || ''}`), 20, y)
    y += 10

    doc.setFontSize(10)
    doc.text(sanitizeText(`Företag: ${app.company || ''}`), 20, y)
    y += 7
    doc.text(sanitizeText(`Status: ${app.status || ''}`), 20, y)
    y += 7
    doc.text(sanitizeText(`Datum: ${app.appliedDate || app.applied_at || ''}`), 20, y)
    y += 15
  })

  return doc.output('blob')
}

/**
 * Ladda ner PDF
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Förhandsgranska PDF
 */
export function previewPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// ==================== ARTICLE PDF ====================

export interface ArticleForPDF {
  id: string
  title: string
  summary?: string
  content: string
  category?: string
  readingTime?: number
  difficulty?: string
  checklist?: Array<{ id: string; text: string }>
}

/**
 * Generera PDF för en artikel
 */
export async function generateArticlePDF(article: ArticleForPDF): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  const margin = 20
  const pageWidth = 210
  const contentWidth = pageWidth - (margin * 2)
  let y = margin

  // Header med kategori
  if (article.category) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(sanitizeText(article.category.toUpperCase()), margin, y)
    y += 8
  }

  // Titel
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(sanitizeText(article.title), contentWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 5

  // Metadata
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  const meta = []
  if (article.readingTime) meta.push(`${article.readingTime} min läsning`)
  if (article.difficulty) meta.push(article.difficulty)
  if (meta.length > 0) {
    doc.text(meta.join(' • '), margin, y)
    y += 8
  }

  // Linje
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Sammanfattning
  if (article.summary) {
    doc.setFontSize(11)
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'italic')
    const summaryLines = doc.splitTextToSize(sanitizeText(article.summary), contentWidth)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 10
  }

  // Innehåll - ta bort HTML-taggar
  const plainContent = article.content
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')

  const contentLines = doc.splitTextToSize(sanitizeText(plainContent), contentWidth)

  for (let i = 0; i < contentLines.length; i++) {
    if (y > 270) {
      doc.addPage()
      y = margin
    }
    doc.text(contentLines[i], margin, y)
    y += 5
  }

  // Checklista om den finns
  if (article.checklist && article.checklist.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = margin
    }
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Checklista', margin, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    article.checklist.forEach(item => {
      if (y > 270) {
        doc.addPage()
        y = margin
      }
      doc.rect(margin, y - 3, 4, 4)
      doc.text(sanitizeText(item.text), margin + 8, y)
      y += 7
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Deltagarportalen - www.deltagarportalen.se', margin, 285)

  return doc.output('blob')
}

// ==================== EXERCISE PDF ====================

export interface ExerciseForPDF {
  id: string
  title: string
  description: string
  category?: string
  duration?: string
  difficulty?: string
  steps: Array<{
    id: number
    title: string
    description: string
    questions: Array<{
      id: string
      text: string
      placeholder?: string
    }>
  }>
}

/**
 * Generera PDF för en övning
 */
export async function generateExercisePDF(exercise: ExerciseForPDF): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  const margin = 20
  const pageWidth = 210
  const contentWidth = pageWidth - (margin * 2)
  let y = margin

  // Header med kategori
  if (exercise.category) {
    doc.setFontSize(10)
    doc.setTextColor(20, 184, 166) // teal
    doc.setFont('helvetica', 'bold')
    doc.text(sanitizeText(exercise.category.toUpperCase()), margin, y)
    y += 8
  }

  // Titel
  doc.setFontSize(22)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(sanitizeText(exercise.title), contentWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 8 + 5

  // Metadata
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  const meta = []
  if (exercise.duration) meta.push(exercise.duration)
  if (exercise.difficulty) meta.push(exercise.difficulty)
  if (meta.length > 0) {
    doc.text(meta.join(' • '), margin, y)
    y += 8
  }

  // Beskrivning
  if (exercise.description) {
    doc.setFontSize(11)
    doc.setTextColor(71, 85, 105)
    const descLines = doc.splitTextToSize(sanitizeText(exercise.description), contentWidth)
    doc.text(descLines, margin, y)
    y += descLines.length * 5 + 5
  }

  // Linje
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 12

  // Steg
  exercise.steps.forEach((step, stepIndex) => {
    if (y > 240) {
      doc.addPage()
      y = margin
    }

    // Steg-rubrik
    doc.setFillColor(240, 253, 250) // teal-50
    doc.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, 'F')

    doc.setFontSize(12)
    doc.setTextColor(20, 184, 166)
    doc.setFont('helvetica', 'bold')
    doc.text(`Steg ${step.id}: ${sanitizeText(step.title)}`, margin + 4, y + 3)
    y += 15

    // Steg-beskrivning
    if (step.description) {
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.setFont('helvetica', 'normal')
      const stepDescLines = doc.splitTextToSize(sanitizeText(step.description), contentWidth - 8)
      doc.text(stepDescLines, margin + 4, y)
      y += stepDescLines.length * 5 + 8
    }

    // Frågor med skrivutrymme
    step.questions.forEach((question, qIndex) => {
      if (y > 250) {
        doc.addPage()
        y = margin
      }

      // Frågetext
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      const qLines = doc.splitTextToSize(`${qIndex + 1}. ${sanitizeText(question.text)}`, contentWidth - 8)
      doc.text(qLines, margin + 4, y)
      y += qLines.length * 5 + 3

      // Skrivutrymme (streckade linjer)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      for (let line = 0; line < 4; line++) {
        if (y > 275) {
          doc.addPage()
          y = margin
        }
        doc.setLineDashPattern([2, 2], 0)
        doc.line(margin + 4, y, pageWidth - margin - 4, y)
        y += 8
      }
      doc.setLineDashPattern([], 0)
      y += 5
    })

    y += 8
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Deltagarportalen - www.deltagarportalen.se', margin, 285)

  return doc.output('blob')
}

/**
 * Generera PDF för flera artiklar
 */
export async function generateArticlesBundlePDF(articles: ArticleForPDF[]): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  const margin = 20
  const pageWidth = 210
  const contentWidth = pageWidth - (margin * 2)

  // Försättssida
  doc.setFillColor(20, 184, 166) // teal
  doc.rect(0, 0, pageWidth, 80, 'F')

  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('Kunskapsbank', margin, 45)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`${articles.length} artiklar`, margin, 58)

  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(`Genererad: ${new Date().toLocaleDateString('sv-SE')}`, margin, 95)

  // Innehållsförteckning
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Innehåll', margin, 115)

  let tocY = 125
  articles.forEach((article, index) => {
    if (tocY > 270) {
      doc.addPage()
      tocY = margin
    }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    const tocLine = `${index + 1}. ${sanitizeText(article.title)}`
    const tocLines = doc.splitTextToSize(tocLine, contentWidth - 20)
    doc.text(tocLines[0], margin, tocY)
    tocY += 7
  })

  // Varje artikel
  for (const article of articles) {
    doc.addPage()
    let y = margin

    // Kategori
    if (article.category) {
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(sanitizeText(article.category.toUpperCase()), margin, y)
      y += 8
    }

    // Titel
    doc.setFontSize(18)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(sanitizeText(article.title), contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 7 + 8

    // Innehåll
    const plainContent = article.content
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'normal')

    const contentLines = doc.splitTextToSize(sanitizeText(plainContent), contentWidth)

    for (const line of contentLines) {
      if (y > 275) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 5
    }
  }

  // Footer på sista sidan
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Deltagarportalen - www.deltagarportalen.se', margin, 285)

  return doc.output('blob')
}

/**
 * Generera PDF för flera övningar
 */
export async function generateExercisesBundlePDF(exercises: ExerciseForPDF[]): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  const margin = 20
  const pageWidth = 210
  const contentWidth = pageWidth - (margin * 2)

  // Försättssida
  doc.setFillColor(59, 130, 246) // blue
  doc.rect(0, 0, pageWidth, 80, 'F')

  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('Övningsbok', margin, 45)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`${exercises.length} övningar`, margin, 58)

  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(`Genererad: ${new Date().toLocaleDateString('sv-SE')}`, margin, 95)

  // Innehållsförteckning
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Innehåll', margin, 115)

  let tocY = 125
  exercises.forEach((ex, index) => {
    if (tocY > 270) {
      doc.addPage()
      tocY = margin
    }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(`${index + 1}. ${sanitizeText(ex.title)} (${ex.duration || '-'})`, margin, tocY)
    tocY += 7
  })

  // Varje övning
  for (const exercise of exercises) {
    doc.addPage()
    let y = margin

    // Kategori
    if (exercise.category) {
      doc.setFontSize(10)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text(sanitizeText(exercise.category.toUpperCase()), margin, y)
      y += 8
    }

    // Titel
    doc.setFontSize(18)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(sanitizeText(exercise.title), contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 7 + 5

    // Metadata
    const meta = []
    if (exercise.duration) meta.push(exercise.duration)
    if (exercise.difficulty) meta.push(exercise.difficulty)
    if (meta.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text(meta.join(' • '), margin, y)
      y += 8
    }

    // Beskrivning
    if (exercise.description) {
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      const descLines = doc.splitTextToSize(sanitizeText(exercise.description), contentWidth)
      doc.text(descLines, margin, y)
      y += descLines.length * 5 + 8
    }

    // Steg
    for (const step of exercise.steps) {
      if (y > 230) {
        doc.addPage()
        y = margin
      }

      // Steg-rubrik
      doc.setFillColor(239, 246, 255) // blue-50
      doc.roundedRect(margin, y - 5, contentWidth, 12, 2, 2, 'F')
      doc.setFontSize(11)
      doc.setTextColor(59, 130, 246)
      doc.setFont('helvetica', 'bold')
      doc.text(`Steg ${step.id}: ${sanitizeText(step.title)}`, margin + 4, y + 3)
      y += 15

      // Frågor med skrivutrymme
      for (let qIndex = 0; qIndex < step.questions.length; qIndex++) {
        const question = step.questions[qIndex]
        if (y > 245) {
          doc.addPage()
          y = margin
        }

        doc.setFontSize(10)
        doc.setTextColor(30, 41, 59)
        doc.setFont('helvetica', 'bold')
        const qLines = doc.splitTextToSize(`${qIndex + 1}. ${sanitizeText(question.text)}`, contentWidth - 8)
        doc.text(qLines, margin + 4, y)
        y += qLines.length * 5 + 3

        // Skrivlinjer
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        for (let line = 0; line < 3; line++) {
          if (y > 275) {
            doc.addPage()
            y = margin
          }
          doc.setLineDashPattern([2, 2], 0)
          doc.line(margin + 4, y, pageWidth - margin - 4, y)
          y += 7
        }
        doc.setLineDashPattern([], 0)
        y += 5
      }
      y += 5
    }
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Deltagarportalen - www.deltagarportalen.se', margin, 285)

  return doc.output('blob')
}

// ==================== COVER LETTER PDF ====================

export interface CoverLetterForPDF {
  content: string
  company?: string
  jobTitle?: string
  createdAt?: string
  template?: string
  // User info for signature
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
}

// Template configurations for cover letter PDFs
const COVER_LETTER_PDF_TEMPLATES: Record<string, {
  colors: {
    header: [number, number, number]
    text: [number, number, number]
    muted: [number, number, number]
    accent: [number, number, number]
  }
  fonts: {
    heading: 'helvetica' | 'times'
    body: 'helvetica' | 'times'
  }
  layout: 'classic' | 'modern' | 'minimal'
}> = {
  professional: {
    colors: {
      header: [15, 23, 42],      // slate-900
      text: [30, 41, 59],        // slate-800
      muted: [100, 116, 139],    // slate-500
      accent: [20, 184, 166]     // teal-500
    },
    fonts: { heading: 'helvetica', body: 'helvetica' },
    layout: 'classic'
  },
  modern: {
    colors: {
      header: [59, 130, 246],    // blue-500
      text: [30, 41, 59],        // slate-800
      muted: [100, 116, 139],    // slate-500
      accent: [59, 130, 246]     // blue-500
    },
    fonts: { heading: 'helvetica', body: 'helvetica' },
    layout: 'modern'
  },
  minimal: {
    colors: {
      header: [23, 23, 23],      // neutral-900
      text: [23, 23, 23],        // neutral-900
      muted: [115, 115, 115],    // neutral-500
      accent: [23, 23, 23]       // neutral-900
    },
    fonts: { heading: 'helvetica', body: 'helvetica' },
    layout: 'minimal'
  },
  executive: {
    colors: {
      header: [15, 23, 42],      // slate-900
      text: [15, 23, 42],        // slate-900
      muted: [71, 85, 105],      // slate-600
      accent: [212, 175, 55]     // gold
    },
    fonts: { heading: 'times', body: 'helvetica' },
    layout: 'classic'
  }
}

/**
 * Generera professionell PDF för personligt brev
 * Simplified version without broken markdown parsing
 */
export async function generateCoverLetterPDF(letter: CoverLetterForPDF): Promise<Blob> {
  const jsPDFClass = await loadPDFLibraries()
  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  })

  // Get template config (default to professional)
  const template = COVER_LETTER_PDF_TEMPLATES[letter.template || 'professional'] || COVER_LETTER_PDF_TEMPLATES.professional
  const { colors, fonts, layout } = template

  const margin = 25
  const pageWidth = 210
  const contentWidth = pageWidth - (margin * 2)
  let y = margin

  // ==================== HEADER ====================

  const fullName = [letter.firstName, letter.lastName].filter(Boolean).join(' ') || 'Ditt Namn'

  if (layout === 'modern') {
    // Modern layout: accent bar at top
    doc.setFillColor(...colors.accent)
    doc.rect(0, 0, pageWidth, 3, 'F')
    y = margin + 5
  }

  // User's name as header
  doc.setFontSize(layout === 'minimal' ? 18 : 22)
  doc.setTextColor(...colors.header)
  doc.setFont(fonts.heading, 'bold')
  doc.text(sanitizeText(fullName), margin, y)
  y += 8

  // Contact info line
  const contactParts = [letter.email, letter.phone, letter.location].filter(Boolean)
  if (contactParts.length > 0) {
    doc.setFontSize(10)
    doc.setTextColor(...colors.muted)
    doc.setFont(fonts.body, 'normal')
    doc.text(sanitizeText(contactParts.join('  •  ')), margin, y)
    y += 6
  }

  // Accent line under header (skip for minimal)
  if (layout !== 'minimal') {
    y += 3
    doc.setDrawColor(...colors.accent)
    doc.setLineWidth(layout === 'modern' ? 1.5 : 0.8)
    const lineLength = layout === 'modern' ? 60 : 50
    doc.line(margin, y, margin + lineLength, y)
  }
  y += 15

  // ==================== DATE & RECIPIENT ====================

  // Date (right-aligned)
  const dateStr = letter.createdAt
    ? new Date(letter.createdAt).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

  doc.setFontSize(10)
  doc.setTextColor(...colors.muted)
  doc.setFont(fonts.body, 'normal')
  const dateWidth = doc.getTextWidth(dateStr)
  doc.text(dateStr, pageWidth - margin - dateWidth, y)
  y += 12

  // Company/recipient info (if available)
  if (letter.company || letter.jobTitle) {
    doc.setFontSize(11)
    doc.setTextColor(...colors.text)
    doc.setFont(fonts.body, 'normal')

    if (letter.company) {
      doc.setFont(fonts.body, 'bold')
      doc.text(sanitizeText(letter.company), margin, y)
      y += 6
    }

    if (letter.jobTitle) {
      doc.setFont(fonts.body, 'italic')
      doc.setTextColor(...colors.muted)
      doc.text(sanitizeText(`Angående: ${letter.jobTitle}`), margin, y)
      y += 6
    }

    y += 8
  }

  // ==================== LETTER BODY ====================

  // Simple, reliable text rendering without markdown parsing
  const content = (letter.content || '')
    // Remove markdown bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .trim()

  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())

  doc.setFontSize(11)
  doc.setFont(fonts.body, 'normal')
  doc.setTextColor(...colors.text)
  const lineHeight = 5.5

  for (const paragraph of paragraphs) {
    // Check for page break
    if (y > 260) {
      doc.addPage()
      y = margin
    }

    // Clean up paragraph (remove single newlines, trim)
    const cleanParagraph = paragraph.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

    // Split text to fit width
    const lines = doc.splitTextToSize(sanitizeText(cleanParagraph), contentWidth)

    for (const line of lines) {
      if (y > 275) {
        doc.addPage()
        y = margin
        doc.setFont(fonts.body, 'normal')
        doc.setTextColor(...colors.text)
        doc.setFontSize(11)
      }
      doc.text(line, margin, y)
      y += lineHeight
    }

    // Extra space between paragraphs
    y += 4
  }

  // ==================== SIGNATURE ====================

  y += 8
  if (y > 260) {
    doc.addPage()
    y = margin
  }

  doc.setFontSize(11)
  doc.setTextColor(...colors.text)
  doc.setFont(fonts.body, 'normal')
  doc.text('Med vänliga hälsningar,', margin, y)
  y += 12

  doc.setFont(fonts.heading, 'bold')
  doc.text(sanitizeText(fullName), margin, y)
  y += 6

  // Contact under signature
  if (letter.phone || letter.email) {
    doc.setFont(fonts.body, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...colors.muted)

    if (letter.phone) {
      doc.text(sanitizeText(letter.phone), margin, y)
      y += 5
    }
    if (letter.email) {
      doc.text(sanitizeText(letter.email), margin, y)
    }
  }

  return doc.output('blob')
}

export default generateCVPDF
