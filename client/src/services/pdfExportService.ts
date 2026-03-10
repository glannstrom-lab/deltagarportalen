/**
 * PDF Export Service - Förbättrade moderna mallar
 * Matchar CVPreview-komponenten med bättre typografi och design
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CVData, JobData } from '@/types/pdf.types'

export type { CVData, JobData } from '@/types/pdf.types'
;(jsPDF as any).autoTable = autoTable

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

const TEMPLATES: Record<string, TemplateConfig> = {
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
  centrerad: {
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
  kreativ: {
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

// Helper för svenska tecken
function utf8ToLatin1(str: string): string {
  if (!str) return ''
  const charMap: Record<string, string> = {
    'Å': 'A', 'Ä': 'A', 'Ö': 'O',
    'å': 'a', 'ä': 'a', 'ö': 'o',
    'É': 'E', 'é': 'e',
    'Ü': 'U', 'ü': 'u',
    '–': '-', '—': '-',
  }
  return str.split('').map(c => charMap[c] || c).join('')
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

// Hämta skill name
function getSkillName(skill: any): string {
  if (typeof skill === 'string') return skill
  if (skill?.name) return skill.name
  return ''
}

export async function generateCVPDF(data: CVData): Promise<Blob> {
  const template = TEMPLATES[data.template] || TEMPLATES.sidokolumn
  const isNordic = data.template === 'nordisk'
  const isExecutive = data.template === 'executive'
  
  const doc = new jsPDF({
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

    // Profilbild
    let yPos = 20
    if (data.profileImage) {
      try {
        const imgData = await getImageAsBase64(data.profileImage)
        if (imgData) {
          const imgX = (sidebarWidth - 40) / 2
          const imgY = 15
          doc.setFillColor(255, 255, 255)
          doc.circle(imgX + 20, imgY + 20, 22, 'F')
          doc.addImage(imgData, 'JPEG', imgX, imgY, 40, 40, undefined, 'FAST')
          doc.setDrawColor(255, 255, 255, 0.5)
          doc.setLineWidth(2)
          doc.circle(imgX + 20, imgY + 20, 21, 'S')
          yPos = 65
        }
      } catch (e) {
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
      doc.text(utf8ToLatin1(info), margin, yPos)
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
        const skillText = utf8ToLatin1(getSkillName(skill))
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
        const langName = utf8ToLatin1((lang as any).language || (lang as any).name || '')
        const langLevel = utf8ToLatin1(lang.level || '')
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
        const certText = utf8ToLatin1(cert.name)
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
    doc.text(utf8ToLatin1(`${data.firstName} ${data.lastName}`), mainX, mainY)
    
    mainY += 10
    if (data.title) {
      doc.setFontSize(14)
      doc.setTextColor(...template.colors.accent as [number, number, number])
      doc.text(utf8ToLatin1(data.title), mainX, mainY)
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
      const summaryLines = doc.splitTextToSize(utf8ToLatin1(data.summary), mainWidth - 25)
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
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(11)
        doc.text(utf8ToLatin1(job.title), mainX, mainY)
        
        const dateText = `${job.startDate} - ${job.current ? 'Nu' : job.endDate}`
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        const dateWidth = doc.getTextWidth(dateText)
        doc.text(dateText, pageWidth - margin - dateWidth, mainY)
        
        mainY += 5
        doc.setFontSize(10)
        const companyText = utf8ToLatin1(`${job.company}${job.location ? `, ${job.location}` : ''}`)
        doc.text(companyText, mainX, mainY)
        mainY += 5
        
        if (job.description) {
          doc.setTextColor(...template.colors.muted as [number, number, number])
          doc.setFontSize(9)
          const descLines = doc.splitTextToSize(utf8ToLatin1(job.description), mainWidth - 25)
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
        doc.text(utf8ToLatin1(edu.degree), mainX, mainY)
        
        const eduDate = `${edu.startDate} - ${edu.endDate}`
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        const dateWidth = doc.getTextWidth(eduDate)
        doc.text(eduDate, pageWidth - margin - dateWidth, mainY)
        
        mainY += 5
        doc.setFontSize(10)
        doc.text(utf8ToLatin1(edu.school), mainX, mainY)
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

    // Profilbild i header
    if (data.profileImage) {
      try {
        const imgData = await getImageAsBase64(data.profileImage)
        if (imgData) {
          const imgSize = isGradient || isExecutive ? 30 : 25
          const imgX = margin
          const imgY = isGradient || isExecutive ? 20 : 15
          
          doc.setFillColor(255, 255, 255)
          doc.circle(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 2, 'F')
          doc.addImage(imgData, 'JPEG', imgX, imgY, imgSize, imgSize, undefined, 'FAST')
        }
      } catch (e) {
        // Ignore
      }
    }

    // Namn och titel
    doc.setTextColor(...(isGradient || isExecutive ? [255, 255, 255] : template.colors.headerText as [number, number, number]))
    
    if (isExecutive) {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(28)
      doc.text(utf8ToLatin1(`${data.firstName} ${data.lastName}`), margin + (data.profileImage ? 45 : 0), headerY)
      
      headerY += 10
      if (data.title) {
        doc.setFont(template.fonts.heading, 'italic')
        doc.setFontSize(16)
        doc.text(utf8ToLatin1(data.title), margin + (data.profileImage ? 45 : 0), headerY)
        headerY += 8
      }
    } else {
      doc.setFont(template.fonts.heading, 'bold')
      doc.setFontSize(24)
      doc.text(utf8ToLatin1(`${data.firstName} ${data.lastName}`), margin + (data.profileImage ? 45 : 0), headerY)
      
      headerY += 10
      if (data.title) {
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(14)
        doc.text(utf8ToLatin1(data.title), margin + (data.profileImage ? 45 : 0), headerY)
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
      doc.text(utf8ToLatin1(contacts.join(' | ')), margin + (data.profileImage ? 45 : 0), headerY)
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
      const summaryLines = doc.splitTextToSize(utf8ToLatin1(data.summary), colWidth + 40)
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
      
      const skillText = data.skills.map(s => utf8ToLatin1(getSkillName(s))).join('  •  ')
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
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(10)
        doc.text(utf8ToLatin1(job.title), margin, expRowY)
        expRowY += 4
        
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        const dateText = `${job.startDate} - ${job.current ? 'Nu' : job.endDate}`
        doc.text(`${utf8ToLatin1(job.company)}  •  ${dateText}`, margin, expRowY)
        expRowY += 4
        
        if (job.description) {
          doc.setTextColor(...template.colors.muted as [number, number, number])
          doc.setFontSize(8)
          const descLines = doc.splitTextToSize(utf8ToLatin1(job.description), colWidth)
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
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(10)
        doc.text(utf8ToLatin1(edu.degree), rightX, eduRowY)
        eduRowY += 4
        
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        doc.text(utf8ToLatin1(edu.school), rightX, eduRowY)
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

    // Profilbild
    if (data.profileImage) {
      try {
        const imgData = await getImageAsBase64(data.profileImage)
        if (imgData) {
          const imgSize = 45
          const imgX = (leftWidth - imgSize) / 2
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(imgX - 2, leftY - 2, imgSize + 4, imgSize + 4, 10, 10, 'F')
          doc.addImage(imgData, 'JPEG', imgX, leftY, imgSize, imgSize, undefined, 'FAST')
          leftY += imgSize + 15
        }
      } catch (e) {
        leftY = 20
      }
    }

    // Namn (vänster)
    doc.setTextColor(255, 255, 255)
    doc.setFont(template.fonts.heading, 'bold')
    doc.setFontSize(18)
    const nameText = utf8ToLatin1(`${data.firstName} ${data.lastName}`)
    const nameWidth = doc.getTextWidth(nameText)
    doc.text(nameText, (leftWidth - nameWidth) / 2, leftY)
    leftY += 8

    if (data.title) {
      doc.setFont(template.fonts.body, 'normal')
      doc.setFontSize(11)
      const titleText = utf8ToLatin1(data.title)
      const titleWidth = doc.getTextWidth(titleText)
      doc.text(titleText, (leftWidth - titleWidth) / 2, leftY)
      leftY += 10
    }

    // Kontakt
    leftY += 5
    doc.setFontSize(9)
    
    if (data.email) {
      doc.text(utf8ToLatin1(data.email), leftWidth / 2, leftY, { align: 'center' })
      leftY += 5
    }
    if (data.phone) {
      doc.text(utf8ToLatin1(data.phone), leftWidth / 2, leftY, { align: 'center' })
      leftY += 5
    }
    if (data.location) {
      doc.text(utf8ToLatin1(data.location), leftWidth / 2, leftY, { align: 'center' })
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
        const langName = utf8ToLatin1((lang as any).language || (lang as any).name || '')
        const langLevel = utf8ToLatin1(lang.level || '')
        
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
      const summaryLines = doc.splitTextToSize(utf8ToLatin1(data.summary), rightWidth)
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
        doc.text(utf8ToLatin1(job.title), rightX, rightY)
        
        const dateText = `${job.startDate} - ${job.current ? 'Nu' : job.endDate}`
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.muted as [number, number, number])
        const dateWidth = doc.getTextWidth(dateText)
        doc.text(dateText, pageWidth - margin - dateWidth, rightY)
        
        rightY += 5
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(10)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        doc.text(utf8ToLatin1(job.company), rightX, rightY)
        rightY += 5
        
        if (job.description) {
          doc.setTextColor(...template.colors.muted as [number, number, number])
          doc.setFontSize(9)
          const descLines = doc.splitTextToSize(utf8ToLatin1(job.description), rightWidth)
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
      
      const skillText = data.skills.map(s => utf8ToLatin1(getSkillName(s))).join('  •  ')
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
        doc.setFont(template.fonts.heading, 'bold')
        doc.setFontSize(10)
        doc.text(utf8ToLatin1(edu.degree), rightX, rightY)
        rightY += 4
        
        doc.setFont(template.fonts.body, 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...template.colors.accent as [number, number, number])
        doc.text(utf8ToLatin1(edu.school), rightX, rightY)
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
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text(utf8ToLatin1(job.title), 20, 30)
  
  doc.setFontSize(12)
  doc.text(utf8ToLatin1(job.company), 20, 45)
  doc.text(utf8ToLatin1(`${job.location || ''} • ${job.type || ''}`), 20, 55)
  
  doc.setFontSize(10)
  const description = job.description || ''
  const splitDescription = doc.splitTextToSize(utf8ToLatin1(description), 170)
  doc.text(splitDescription, 20, 70)
  
  return doc.output('blob')
}

/**
 * Generera PDF för ansökningshistorik
 */
export async function generateApplicationHistoryPDF(applications: any[]): Promise<Blob> {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('Ansokningshistorik', 20, 30)
  
  let y = 50
  applications.forEach((app, index) => {
    if (y > 250) {
      doc.addPage()
      y = 30
    }
    
    doc.setFontSize(12)
    doc.text(utf8ToLatin1(`${index + 1}. ${app.jobTitle || app.job_title || ''}`), 20, y)
    y += 10
    
    doc.setFontSize(10)
    doc.text(utf8ToLatin1(`Företag: ${app.company || ''}`), 20, y)
    y += 7
    doc.text(utf8ToLatin1(`Status: ${app.status || ''}`), 20, y)
    y += 7
    doc.text(utf8ToLatin1(`Datum: ${app.appliedDate || app.applied_at || ''}`), 20, y)
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

export default generateCVPDF
