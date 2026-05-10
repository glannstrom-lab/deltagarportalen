/**
 * Word/.docx-export för CV.
 * Tidigare bara tillgänglig från Resources-sidan; flyttad hit för
 * återanvändning från CV-byggarens granska-steg.
 *
 * Lazy-importerar `docx` och `file-saver` så bundle-storlek inte påverkas
 * när användaren bara kör PDF-export.
 */

interface CVData {
  firstName?: string
  lastName?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  workExperience?: Array<{
    title: string
    company: string
    description?: string
    startDate?: string
    endDate?: string
    current?: boolean
  }>
  education?: Array<{
    degree: string
    school: string
    startDate?: string
    endDate?: string
  }>
  skills?: Array<{ id?: string; name: string; level?: number; category?: string }> | string[]
  languages?: Array<{
    language: string
    level: string
  }>
}

export async function generateCVWord(cvData: CVData): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, BorderStyle, AlignmentType } = await import('docx')
  const { saveAs } = await import('file-saver')

  const children: InstanceType<typeof Paragraph>[] = []

  // Header with name
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim(), bold: true, size: 56, color: '1E293B' })
    ],
    spacing: { after: 100 },
    alignment: AlignmentType.CENTER
  }))

  if (cvData.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: cvData.title, size: 28, color: '64748B', italics: true })],
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER
    }))
  }

  const contactParts: string[] = []
  if (cvData.email) contactParts.push(cvData.email)
  if (cvData.phone) contactParts.push(cvData.phone)
  if (cvData.location) contactParts.push(cvData.location)
  if (contactParts.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join('  •  '), size: 22, color: '64748B' })],
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER
    }))
  }

  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4F46E5' } },
    spacing: { after: 300 }
  }))

  if (cvData.summary) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'SAMMANFATTNING', bold: true, size: 24, color: '4F46E5' })],
      spacing: { before: 200, after: 150 }
    }))
    children.push(new Paragraph({
      children: [new TextRun({ text: cvData.summary, size: 22, color: '334155' })],
      spacing: { after: 300 }
    }))
  }

  if (cvData.workExperience && cvData.workExperience.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'ARBETSLIVSERFARENHET', bold: true, size: 24, color: '4F46E5' })],
      spacing: { before: 300, after: 150 }
    }))
    cvData.workExperience.forEach(job => {
      children.push(new Paragraph({
        children: [new TextRun({ text: job.title, bold: true, size: 24, color: '1E293B' })],
        spacing: { before: 150 }
      }))
      children.push(new Paragraph({
        children: [
          new TextRun({ text: job.company, size: 22, color: '475569' }),
          new TextRun({ text: `  •  ${job.startDate || ''} - ${job.current ? 'Nuvarande' : job.endDate || ''}`, size: 20, color: '94A3B8' })
        ]
      }))
      if (job.description) {
        children.push(new Paragraph({
          children: [new TextRun({ text: job.description, size: 22, color: '475569' })],
          spacing: { after: 150 }
        }))
      }
    })
  }

  if (cvData.education && cvData.education.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'UTBILDNING', bold: true, size: 24, color: '4F46E5' })],
      spacing: { before: 300, after: 150 }
    }))
    cvData.education.forEach(edu => {
      children.push(new Paragraph({
        children: [new TextRun({ text: edu.degree, bold: true, size: 24, color: '1E293B' })],
        spacing: { before: 150 }
      }))
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.school, size: 22, color: '475569' }),
          new TextRun({ text: `  •  ${edu.startDate || ''} - ${edu.endDate || ''}`, size: 20, color: '94A3B8' })
        ],
        spacing: { after: 100 }
      }))
    })
  }

  if (cvData.skills && cvData.skills.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'KOMPETENSER', bold: true, size: 24, color: '4F46E5' })],
      spacing: { before: 300, after: 150 }
    }))
    const skillsText = cvData.skills.map(s => typeof s === 'string' ? s : s.name).join('  •  ')
    children.push(new Paragraph({
      children: [new TextRun({ text: skillsText, size: 22, color: '475569' })],
      spacing: { after: 200 }
    }))
  }

  if (cvData.languages && cvData.languages.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'SPRÅK', bold: true, size: 24, color: '4F46E5' })],
      spacing: { before: 300, after: 150 }
    }))
    const langText = cvData.languages.map(l => `${l.language} (${l.level})`).join('  •  ')
    children.push(new Paragraph({
      children: [new TextRun({ text: langText, size: 22, color: '475569' })],
      spacing: { after: 200 }
    }))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
        }
      },
      children
    }]
  })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `CV-${cvData.firstName || 'Mitt'}-${cvData.lastName || ''}.docx`)
}
