import { useState, useRef } from 'react'
import { Download, FileText, Check, FileType, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { CVData } from '@/services/mockApi'

interface CVExportProps {
  cvData?: CVData
}

// Color schemes för PDF-export
const colorSchemes: Record<string, { primary: string; secondary: string; accent: string }> = {
  indigo: { primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8' },
  ocean: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#7dd3fc' },
  forest: { primary: '#059669', secondary: '#10b981', accent: '#34d399' },
  berry: { primary: '#db2777', secondary: '#ec4899', accent: '#f472b6' },
  sunset: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c' },
  ruby: { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171' },
  slate: { primary: '#1e293b', secondary: '#475569', accent: '#64748b' },
  violet: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa' },
  cyan: { primary: '#0891b2', secondary: '#06b6d4', accent: '#22d3ee' },
  rose: { primary: '#e11d48', secondary: '#fb7185', accent: '#fda4af' },
}

export function CVExport({ cvData }: CVExportProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<'pdf' | 'word' | null>(null)
  const pdfRef = useRef<HTMLDivElement>(null)

  // Guard för undefined data
  if (!cvData) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Exportera CV</h3>
            <p className="text-sm text-slate-500">Ladda ner som PDF eller Word</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">Skapa ett CV först för att exportera</p>
      </div>
    )
  }

  const handleExportPDF = async () => {
    if (!pdfRef.current) {
      alert('Kunde inte hitta CV-elementet')
      return
    }

    setIsExportingPDF(true)
    
    try {
      const element = pdfRef.current
      
      // Gör elementet tillfälligt synligt för rendering
      const originalStyles = {
        position: element.style.position,
        left: element.style.left,
        opacity: element.style.opacity,
        zIndex: element.style.zIndex
      }
      
      element.style.position = 'fixed'
      element.style.left = '0'
      element.style.top = '0'
      element.style.opacity = '0'
      element.style.zIndex = '-9999'
      element.style.width = '794px' // A4 width i pixels (96 DPI)
      
      // Vänta på att DOM ska uppdateras
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        width: 794
      })

      // Återställ elementet
      element.style.position = originalStyles.position
      element.style.left = originalStyles.left
      element.style.opacity = originalStyles.opacity
      element.style.zIndex = originalStyles.zIndex
      element.style.width = ''

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      let imgY = 0

      // Om bilden är för lång, skala om för att passa på en sida
      const scaledHeight = imgHeight * ratio
      if (scaledHeight > pdfHeight) {
        // Flera sidor - justera ratio
        const pageRatio = pdfHeight / imgHeight
        const newWidth = imgWidth * pageRatio
        const newX = (pdfWidth - newWidth) / 2
        pdf.addImage(imgData, 'PNG', newX, 0, newWidth, pdfHeight)
      } else {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      }
      
      const fileName = `${cvData.firstName || 'ditt'}-${cvData.lastName || 'namn'}-cv.pdf`.toLowerCase()
      pdf.save(fileName)
      
      setExportSuccess('pdf')
      setTimeout(() => setExportSuccess(null), 3000)
    } catch (error) {
      console.error('PDF-exportfel:', error)
      alert('Kunde inte exportera PDF. Försök igen.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportWord = () => {
    setIsExportingWord(true)
    
    try {
      // Skapa HTML-innehåll för Word
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${cvData.firstName} ${cvData.lastName} - CV</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
            h1 { color: #1e293b; font-size: 32px; margin-bottom: 8px; }
            h2 { color: #4f46e5; font-size: 20px; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            h3 { color: #334155; font-size: 16px; margin-bottom: 4px; }
            .header { margin-bottom: 24px; }
            .contact { color: #64748b; font-size: 14px; margin-bottom: 16px; }
            .summary { font-style: italic; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; }
            .section { margin-bottom: 24px; }
            .item { margin-bottom: 16px; }
            .item-header { display: flex; justify-content: space-between; align-items: baseline; }
            .date { color: #64748b; font-size: 14px; }
            .company { color: #64748b; font-size: 14px; }
            .skills { display: flex; flex-wrap: wrap; gap: 8px; }
            .skill { background: #e0e7ff; color: #4f46e5; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
            ul { margin: 8px 0; padding-left: 20px; }
            li { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${cvData.firstName} ${cvData.lastName}</h1>
            <div class="contact">
              ${cvData.title ? `<div>${cvData.title}</div>` : ''}
              ${cvData.email ? `<div>${cvData.email}</div>` : ''}
              ${cvData.phone ? `<div>${cvData.phone}</div>` : ''}
              ${cvData.location ? `<div>${cvData.location}</div>` : ''}
            </div>
          </div>

          ${cvData.summary ? `
            <div class="summary">
              ${cvData.summary}
            </div>
          ` : ''}

          ${cvData.workExperience?.length ? `
            <div class="section">
              <h2>Arbetslivserfarenhet</h2>
              ${cvData.workExperience.map(exp => `
                <div class="item">
                  <div class="item-header">
                    <h3>${exp.title}</h3>
                    <span class="date">${exp.startDate || ''} - ${exp.current ? 'Pågående' : (exp.endDate || '')}</span>
                  </div>
                  <div class="company">${exp.company}${exp.location ? `, ${exp.location}` : ''}</div>
                  ${exp.description ? `<p>${exp.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${cvData.education?.length ? `
            <div class="section">
              <h2>Utbildning</h2>
              ${cvData.education.map(edu => `
                <div class="item">
                  <div class="item-header">
                    <h3>${edu.degree}${edu.field ? ` i ${edu.field}` : ''}</h3>
                    <span class="date">${edu.startDate || ''} - ${edu.endDate || ''}</span>
                  </div>
                  <div class="company">${edu.school}${edu.location ? `, ${edu.location}` : ''}</div>
                  ${edu.description ? `<p>${edu.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${cvData.skills?.length ? `
            <div class="section">
              <h2>Kompetenser</h2>
              <div class="skills">
                ${cvData.skills.map(skill => `
                  <span class="skill">${skill.name}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${cvData.languages?.length ? `
            <div class="section">
              <h2>Språk</h2>
              <ul>
                ${cvData.languages.map(lang => `
                  <li>${lang.name} - ${getLanguageLevelText(lang.level)}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${cvData.certificates?.length ? `
            <div class="section">
              <h2>Certifikat</h2>
              <ul>
                ${cvData.certificates.map(cert => `
                  <li>${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}${cert.date ? ` - ${cert.date}` : ''}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${cvData.references?.length ? `
            <div class="section">
              <h2>Referenser</h2>
              ${cvData.references.map(ref => `
                <div class="item">
                  <h3>${ref.name}</h3>
                  <div class="company">${ref.title}${ref.company ? `, ${ref.company}` : ''}</div>
                  ${ref.email ? `<div>${ref.email}</div>` : ''}
                  ${ref.phone ? `<div>${ref.phone}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
        </html>
      `

      // Skapa och ladda ner Word-fil
      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${cvData.firstName || 'ditt'}-${cvData.lastName || 'namn'}-cv.doc`.toLowerCase()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      
      setExportSuccess('word')
      setTimeout(() => setExportSuccess(null), 3000)
    } catch (error) {
      console.error('Word-exportfel:', error)
      alert('Kunde inte exportera Word. Försök igen.')
    } finally {
      setIsExportingWord(false)
    }
  }

  const getLanguageLevelText = (level: string) => {
    const levels: Record<string, string> = {
      'native': 'Modersmål',
      'fluent': 'Flytande',
      'advanced': 'Avancerad',
      'intermediate': 'Medel',
      'basic': 'Grundläggande'
    }
    return levels[level] || level
  }

  const scheme = colorSchemes[cvData.colorScheme || 'indigo']
  const fullName = `${cvData.firstName} ${cvData.lastName}`.trim() || 'Ditt Namn'

  return (
    <>
      {/* Hidden CV for PDF export */}
      <div 
        ref={pdfRef}
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 0,
          width: '794px',
          background: 'white',
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
          color: '#333',
          lineHeight: 1.6
        }}
      >
        {/* Header */}
        <div style={{ 
          background: scheme.primary, 
          color: 'white', 
          padding: '30px 40px',
          margin: '-40px -40px 30px -40px'
        }}>
          <h1 style={{ fontSize: '36px', margin: 0, fontWeight: 'bold' }}>{fullName}</h1>
          {cvData.title && <p style={{ fontSize: '18px', margin: '8px 0 0 0', opacity: 0.9 }}>{cvData.title}</p>}
          
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', fontSize: '14px', flexWrap: 'wrap' }}>
            {cvData.email && <span>{cvData.email}</span>}
            {cvData.phone && <span>{cvData.phone}</span>}
            {cvData.location && <span>{cvData.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {cvData.summary && (
          <div style={{ marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontStyle: 'italic' }}>{cvData.summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {cvData.workExperience?.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: scheme.primary, 
              borderBottom: `2px solid ${scheme.primary}`,
              paddingBottom: '8px',
              fontSize: '20px',
              marginBottom: '15px'
            }}>Arbetslivserfarenhet</h2>
            {cvData.workExperience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>{exp.title}</h3>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>
                    {exp.startDate} - {exp.current ? 'Pågående' : exp.endDate}
                  </span>
                </div>
                <p style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>
                  {exp.company}{exp.location && `, ${exp.location}`}
                </p>
                {exp.description && <p style={{ margin: '8px 0 0 0' }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {cvData.education?.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: scheme.primary, 
              borderBottom: `2px solid ${scheme.primary}`,
              paddingBottom: '8px',
              fontSize: '20px',
              marginBottom: '15px'
            }}>Utbildning</h2>
            {cvData.education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>
                    {edu.degree}{edu.field && ` i ${edu.field}`}
                  </h3>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <p style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>
                  {edu.school}{edu.location && `, ${edu.location}`}
                </p>
                {edu.description && <p style={{ margin: '8px 0 0 0' }}>{edu.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {cvData.skills?.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: scheme.primary, 
              borderBottom: `2px solid ${scheme.primary}`,
              paddingBottom: '8px',
              fontSize: '20px',
              marginBottom: '15px'
            }}>Kompetenser</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {cvData.skills.map((skill, idx) => (
                <span key={idx} style={{
                  background: '#e0e7ff',
                  color: scheme.primary,
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '14px'
                }}>{skill.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {cvData.languages?.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: scheme.primary, 
              borderBottom: `2px solid ${scheme.primary}`,
              paddingBottom: '8px',
              fontSize: '20px',
              marginBottom: '15px'
            }}>Språk</h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {cvData.languages.map((lang, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {lang.name} - {getLanguageLevelText(lang.level)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Certificates */}
        {cvData.certificates?.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              color: scheme.primary, 
              borderBottom: `2px solid ${scheme.primary}`,
              paddingBottom: '8px',
              fontSize: '20px',
              marginBottom: '15px'
            }}>Certifikat</h2>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {cvData.certificates.map((cert, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {cert.name}{cert.issuer && ` (${cert.issuer})`}{cert.date && ` - ${cert.date}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* References */}
        {cvData.references?.length > 0 && (
          <div>
            <h2 style={{ 
              color: scheme.primary, 
              borderBottom: `2px solid ${scheme.primary}`,
              paddingBottom: '8px',
              fontSize: '20px',
              marginBottom: '15px'
            }}>Referenser</h2>
            {cvData.references.map((ref, idx) => (
              <div key={idx} style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>{ref.name}</h3>
                <p style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>
                  {ref.title}{ref.company && `, ${ref.company}`}
                </p>
                {ref.email && <p style={{ margin: '2px 0', fontSize: '14px' }}>{ref.email}</p>}
                {ref.phone && <p style={{ margin: '2px 0', fontSize: '14px' }}>{ref.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UI */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Exportera CV</h3>
            <p className="text-sm text-slate-500">Ladda ner som PDF eller Word</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF || isExportingWord}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors"
          >
            {exportSuccess === 'pdf' ? (
              <>
                <Check className="w-5 h-5" />
                PDF Sparad!
              </>
            ) : isExportingPDF ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Skapar PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Ladda ner PDF
              </>
            )}
          </button>

          {/* Word Export */}
          <button
            onClick={handleExportWord}
            disabled={isExportingPDF || isExportingWord}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {exportSuccess === 'word' ? (
              <>
                <Check className="w-5 h-5" />
                Word Sparad!
              </>
            ) : isExportingWord ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Skapar Word...
              </>
            ) : (
              <>
                <FileType className="w-5 h-5" />
                Ladda ner Word (.doc)
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Filnamn: {cvData.firstName?.toLowerCase() || 'ditt'}-{cvData.lastName?.toLowerCase() || 'namn'}-cv.pdf / .doc
        </p>

        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">
            <strong>Tips:</strong> PDF är bäst för att skicka till arbetsgivare. 
            Word kan du redigera vidare om du behöver anpassa CV:t för specifika ansökningar.
          </p>
        </div>
      </div>
    </>
  )
}

export default CVExport
