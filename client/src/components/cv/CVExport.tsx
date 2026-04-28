import { useState, useRef, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, FileText, Check, FileType, Loader2, Zap } from '@/components/ui/icons'
import { loadPDFLibraries, preloadPDFLibraries } from '@/services/pdfLazyLoad'
import type { CVData } from '@/services/supabaseApi'

// Lazy load react-pdf for vector PDF export
const BlobProvider = lazy(() =>
  import('@react-pdf/renderer').then(mod => ({ default: mod.BlobProvider }))
)
const CVPDFDocument = lazy(() => import('./CVPDF'))

interface CVExportProps {
  cvData?: CVData
}

// Helper functions
const getLanguageLevelDisplay = (level: string): string => {
  const levelMap: Record<string, string> = {
    'basic': 'Grundläggande',
    'good': 'God',
    'fluent': 'Flytande',
    'native': 'Modersmål',
    'Grundläggande': 'Grundläggande',
    'God': 'God',
    'Flytande': 'Flytande',
    'Modersmål': 'Modersmål',
  }
  return levelMap[level] || level
}

const getSkillName = (skill: { name: string } | string): string => {
  return typeof skill === 'string' ? skill : skill?.name || ''
}

const getLanguageLevelPercent = (level: string): number => {
  const map: Record<string, number> = {
    'native': 100, 'fluent': 85, 'good': 70, 'basic': 50,
    'Modersmål': 100, 'Flytande': 85, 'God': 70, 'Grundläggande': 50,
  }
  return map[level] || 50
}

export function CVExport({ cvData }: CVExportProps) {
  const { t } = useTranslation()
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [isExportingVectorPDF, setIsExportingVectorPDF] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<'pdf' | 'word' | 'vector' | null>(null)
  const [showVectorExport, setShowVectorExport] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  if (!cvData) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.export.title')}</h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">{t('cv.export.subtitle')}</p>
          </div>
        </div>
        <p className="text-sm text-stone-700 dark:text-stone-300">{t('cv.export.createFirst')}</p>
      </div>
    )
  }

  const handleExportPDF = async () => {
    if (!pdfRef.current) {
      alert(t('cv.export.errors.elementNotFound'))
      return
    }

    setIsExportingPDF(true)

    try {
      const { jsPDF, html2canvas } = await loadPDFLibraries()

      const element = pdfRef.current

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
      element.style.width = '794px'

      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        width: 794
      })

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

      const scaledHeight = imgHeight * ratio
      if (scaledHeight > pdfHeight) {
        const pageRatio = pdfHeight / imgHeight
        const newWidth = imgWidth * pageRatio
        const newX = (pdfWidth - newWidth) / 2
        pdf.addImage(imgData, 'PNG', newX, 0, newWidth, pdfHeight)
      } else {
        pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio)
      }

      const fileName = `${cvData.firstName || 'ditt'}-${cvData.lastName || 'namn'}-cv.pdf`.toLowerCase()
      pdf.save(fileName)

      setExportSuccess('pdf')
      setTimeout(() => setExportSuccess(null), 3000)
    } catch (error) {
      console.error('PDF-exportfel:', error)
      alert(t('cv.export.errors.pdfFailed'))
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportWord = () => {
    setIsExportingWord(true)

    try {
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
          ${cvData.summary ? `<div class="summary">${cvData.summary}</div>` : ''}
          ${cvData.workExperience?.length ? `
            <div class="section">
              <h2>Arbetslivserfarenhet</h2>
              ${cvData.workExperience.map(exp => `
                <div class="item">
                  <h3>${exp.title}</h3>
                  <div class="company">${exp.company} | ${exp.startDate} - ${exp.current ? 'Pågående' : exp.endDate}</div>
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
                  <h3>${edu.degree}</h3>
                  <div class="company">${edu.school} | ${edu.startDate} - ${edu.endDate}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${cvData.skills?.length ? `
            <div class="section">
              <h2>Kompetenser</h2>
              <div class="skills">
                ${cvData.skills.map(skill => `<span class="skill">${getSkillName(skill)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          ${cvData.languages?.length ? `
            <div class="section">
              <h2>Språk</h2>
              <ul>
                ${cvData.languages.map(lang => `<li>${lang.language || lang.name} - ${getLanguageLevelDisplay(lang.level)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
        </html>
      `

      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
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
      alert(t('cv.export.errors.wordFailed'))
    } finally {
      setIsExportingWord(false)
    }
  }

  const fullName = `${cvData.firstName} ${cvData.lastName}`.trim() || t('cv.export.yourName')
  const template = cvData.template || 'sidebar'

  // Template-specific render functions
  const renderMinimalTemplate = () => (
    <div style={{ minHeight: '1122px', background: '#FFFFFF', padding: '80px', fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ marginBottom: '64px' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1', color: '#000000', marginBottom: '16px' }}>
          {fullName}
        </h1>
        {cvData.title && (
          <p style={{ fontSize: '20px', fontWeight: '400', color: '#666666', letterSpacing: '0.02em' }}>{cvData.title}</p>
        )}
        <div style={{ display: 'flex', gap: '32px', marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #E5E5E5' }}>
          {cvData.email && <span style={{ fontSize: '14px', color: '#666666' }}>{cvData.email}</span>}
          {cvData.phone && <span style={{ fontSize: '14px', color: '#666666' }}>{cvData.phone}</span>}
          {cvData.location && <span style={{ fontSize: '14px', color: '#666666' }}>{cvData.location}</span>}
        </div>
      </header>

      {cvData.summary && (
        <section style={{ marginBottom: '64px', maxWidth: '640px' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#333333' }}>{cvData.summary}</p>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '80px' }}>
        <div>
          {cvData.workExperience?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999', marginBottom: '32px' }}>Erfarenhet</h2>
              {cvData.workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: '32px' }}>
                  <span style={{ fontSize: '12px', color: '#999999', display: 'block', marginBottom: '8px' }}>
                    {job.startDate} — {job.current ? 'Nu' : job.endDate}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000000', marginBottom: '4px' }}>{job.title}</h3>
                  <div style={{ fontSize: '14px', color: '#666666', marginBottom: '12px' }}>{job.company}</div>
                  {job.description && <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#666666' }}>{job.description}</p>}
                </div>
              ))}
            </section>
          )}
          {cvData.education?.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999', marginBottom: '32px' }}>Utbildning</h2>
              {cvData.education.map(edu => (
                <div key={edu.id} style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '12px', color: '#999999', display: 'block', marginBottom: '4px' }}>{edu.startDate} — {edu.endDate}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{edu.degree}</h3>
                  <div style={{ fontSize: '14px', color: '#666666' }}>{edu.school}</div>
                </div>
              ))}
            </section>
          )}
        </div>
        <div>
          {cvData.skills?.length > 0 && (
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999', marginBottom: '24px' }}>Kompetenser</h2>
              {cvData.skills.map((skill, i) => (
                <div key={i} style={{ fontSize: '14px', color: '#333333', marginBottom: '8px' }}>{getSkillName(skill)}</div>
              ))}
            </section>
          )}
          {cvData.languages?.length > 0 && (
            <section>
              <h2 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999', marginBottom: '24px' }}>Språk</h2>
              {cvData.languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#333333' }}>{lang.language || lang.name}</span>
                  <span style={{ fontSize: '14px', color: '#999999' }}>{getLanguageLevelDisplay(lang.level)}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )

  const renderExecutiveTemplate = () => (
    <div style={{ minHeight: '1122px', background: '#FDFCFA', fontFamily: 'Georgia, serif' }}>
      <header style={{ padding: '64px 80px', borderBottom: '3px solid #B8860B', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          {cvData.profileImage && (
            <img src={cvData.profileImage} alt="" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #B8860B' }} />
          )}
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: '400', letterSpacing: '0.02em', color: '#1a1a1a', marginBottom: '8px' }}>{fullName}</h1>
            {cvData.title && <p style={{ fontSize: '20px', fontStyle: 'italic', color: '#B8860B', marginBottom: '20px' }}>{cvData.title}</p>}
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666666' }}>
              {cvData.email && <span>{cvData.email}</span>}
              {cvData.phone && <span>{cvData.phone}</span>}
              {cvData.location && <span>{cvData.location}</span>}
            </div>
          </div>
        </div>
      </header>
      <main style={{ padding: '64px 80px' }}>
        {cvData.summary && (
          <section style={{ marginBottom: '56px' }}>
            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#333333', maxWidth: '720px' }}>
              <span style={{ float: 'left', fontSize: '64px', lineHeight: '1', marginRight: '12px', marginTop: '4px', color: '#B8860B' }}>{cvData.summary.charAt(0)}</span>
              {cvData.summary.slice(1)}
            </p>
          </section>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
          {cvData.workExperience?.length > 0 && (
            <section>
              <h2 style={{ fontSize: '14px', fontWeight: '400', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid #F5E6C8' }}>Karriär</h2>
              {cvData.workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '400', color: '#1a1a1a', marginBottom: '4px' }}>{job.title}</h3>
                  <div style={{ fontSize: '15px', color: '#B8860B', marginBottom: '4px' }}>{job.company}</div>
                  <div style={{ fontSize: '13px', color: '#888888', marginBottom: '12px' }}>{job.startDate} — {job.current ? 'Nuvarande' : job.endDate}</div>
                  {job.description && <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#555555' }}>{job.description}</p>}
                </div>
              ))}
            </section>
          )}
          <div>
            {cvData.education?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '400', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '32px', paddingBottom: '12px', borderBottom: '1px solid #F5E6C8' }}>Utbildning</h2>
                {cvData.education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '400', color: '#1a1a1a' }}>{edu.degree}</h3>
                    <div style={{ fontSize: '14px', color: '#B8860B' }}>{edu.school}</div>
                    <div style={{ fontSize: '13px', color: '#888888' }}>{edu.startDate} — {edu.endDate}</div>
                  </div>
                ))}
              </section>
            )}
            {cvData.skills?.length > 0 && (
              <section>
                <h2 style={{ fontSize: '14px', fontWeight: '400', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8860B', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #F5E6C8' }}>Expertis</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cvData.skills.map((skill, i) => (
                    <span key={i} style={{ fontSize: '13px', padding: '6px 16px', border: '1px solid #F5E6C8', color: '#555555' }}>{getSkillName(skill)}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  const renderModernTemplate = () => (
    <div style={{ display: 'flex', minHeight: '1122px', fontFamily: 'Inter, Arial, sans-serif' }}>
      <aside style={{ width: '280px', background: 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)', color: '#FFFFFF', padding: '48px 32px' }}>
        {cvData.profileImage ? (
          <img src={cvData.profileImage} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '16px', marginBottom: '32px' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '72px', opacity: 0.3 }}>👤</span>
          </div>
        )}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '20px' }}>Kontakt</h3>
          {cvData.email && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>{cvData.email}</div>}
          {cvData.phone && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>{cvData.phone}</div>}
          {cvData.location && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>{cvData.location}</div>}
        </div>
        {cvData.skills?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '20px' }}>Tech Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {cvData.skills.slice(0, 12).map((skill, i) => (
                <span key={i} style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '6px', color: '#FFFFFF', border: '1px solid rgba(99, 102, 241, 0.3)' }}>{getSkillName(skill)}</span>
              ))}
            </div>
          </div>
        )}
        {cvData.languages?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '20px' }}>Språk</h3>
            {cvData.languages.map(lang => (
              <div key={lang.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>{lang.language || lang.name}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{getLanguageLevelDisplay(lang.level)}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${getLanguageLevelPercent(lang.level)}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
      <main style={{ flex: 1, padding: '48px 56px', background: '#FFFFFF' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '56px', fontWeight: '700', letterSpacing: '-0.03em', color: '#0F0F0F', lineHeight: '1.1', marginBottom: '12px' }}>{fullName}</h1>
          {cvData.title && <p style={{ fontSize: '20px', color: '#6366F1', fontWeight: '500' }}>{cvData.title}</p>}
        </header>
        {cvData.summary && (
          <section style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#444444', maxWidth: '600px' }}>{cvData.summary}</p>
          </section>
        )}
        {cvData.workExperience?.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999', marginBottom: '28px' }}>Erfarenhet</h2>
            {cvData.workExperience.map(job => (
              <div key={job.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '32px', marginBottom: '32px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#888888' }}>{job.startDate}<br />— {job.current ? 'Nu' : job.endDate}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0F0F0F', marginBottom: '4px' }}>{job.title}</h3>
                  <div style={{ fontSize: '14px', color: '#6366F1', marginBottom: '12px' }}>{job.company}</div>
                  {job.description && <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#666666' }}>{job.description}</p>}
                </div>
              </div>
            ))}
          </section>
        )}
        {cvData.education?.length > 0 && (
          <section>
            <h2 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999999', marginBottom: '28px' }}>Utbildning</h2>
            {cvData.education.map(edu => (
              <div key={edu.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '32px', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#888888' }}>{edu.startDate} — {edu.endDate}</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F0F0F' }}>{edu.degree}</h3>
                  <div style={{ fontSize: '14px', color: '#666666' }}>{edu.school}</div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )

  const renderCreativeTemplate = () => (
    <div style={{ minHeight: '1122px', background: '#FAFAFA', fontFamily: 'Inter, Arial, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(236,72,153,0.1) 100%)', borderRadius: '50%' }} />
      <header style={{ padding: '64px', paddingBottom: '48px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-end' }}>
          {cvData.profileImage && (
            <img src={cvData.profileImage} alt="" style={{ width: '180px', height: '220px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 60px rgba(124, 58, 237, 0.2)' }} />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '64px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '0.95', background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>{fullName}</h1>
            {cvData.title && <p style={{ fontSize: '24px', fontWeight: '500', color: '#333333' }}>{cvData.title}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
          {cvData.email && <span style={{ padding: '10px 20px', background: '#FFFFFF', borderRadius: '100px', fontSize: '14px', color: '#333333', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{cvData.email}</span>}
          {cvData.phone && <span style={{ padding: '10px 20px', background: '#FFFFFF', borderRadius: '100px', fontSize: '14px', color: '#333333', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{cvData.phone}</span>}
          {cvData.location && <span style={{ padding: '10px 20px', background: '#FFFFFF', borderRadius: '100px', fontSize: '14px', color: '#333333', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{cvData.location}</span>}
        </div>
      </header>
      <main style={{ padding: '0 64px 64px' }}>
        {cvData.summary && (
          <section style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#444444' }}>{cvData.summary}</p>
          </section>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {cvData.workExperience?.length > 0 && (
            <section style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: '28px' }}>Erfarenhet</h2>
              {cvData.workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: '28px' }}>
                  <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '4px 12px', background: 'rgba(124,58,237,0.1)', color: '#7C3AED', borderRadius: '100px', marginBottom: '12px' }}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>{job.title}</h3>
                  <div style={{ fontSize: '14px', color: '#EC4899', marginBottom: '8px' }}>{job.company}</div>
                  {job.description && <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#666666' }}>{job.description}</p>}
                </div>
              ))}
            </section>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {cvData.skills?.length > 0 && (
              <section style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', padding: '32px', borderRadius: '24px', color: '#FFFFFF' }}>
                <h2 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, marginBottom: '20px' }}>Kompetenser</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {cvData.skills.map((skill, i) => (
                    <span key={i} style={{ fontSize: '13px', fontWeight: '500', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px' }}>{getSkillName(skill)}</span>
                  ))}
                </div>
              </section>
            )}
            {cvData.education?.length > 0 && (
              <section style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: '24px' }}>Utbildning</h2>
                {cvData.education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>{edu.degree}</h3>
                    <div style={{ fontSize: '14px', color: '#EC4899' }}>{edu.school}</div>
                    <div style={{ fontSize: '12px', color: '#888888' }}>{edu.startDate} — {edu.endDate}</div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  const renderNordicTemplate = () => (
    <div style={{ display: 'flex', minHeight: '1122px', fontFamily: 'Inter, Arial, sans-serif', background: '#FFFFFF' }}>
      <aside style={{ width: '280px', background: '#F8FAFC', padding: '56px 32px', borderRight: '1px solid #E2E8F0' }}>
        {cvData.profileImage ? (
          <img src={cvData.profileImage} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '20px', marginBottom: '32px' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '1', background: '#E2E8F0', borderRadius: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '64px', opacity: 0.3 }}>👤</span>
          </div>
        )}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '20px' }}>Kontakt</h3>
          {cvData.email && <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>{cvData.email}</div>}
          {cvData.phone && <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>{cvData.phone}</div>}
          {cvData.location && <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>{cvData.location}</div>}
        </div>
        {cvData.skills?.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '16px' }}>Kompetenser</h3>
            {cvData.skills.map((skill, i) => (
              <div key={i} style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>{getSkillName(skill)}</div>
            ))}
          </div>
        )}
        {cvData.languages?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '16px' }}>Språk</h3>
            {cvData.languages.map(lang => (
              <div key={lang.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#334155' }}>{lang.language || lang.name}</span>
                </div>
                <div style={{ height: '3px', background: '#E2E8F0', borderRadius: '2px' }}>
                  <div style={{ width: `${getLanguageLevelPercent(lang.level)}%`, height: '100%', background: '#0EA5E9', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
      <main style={{ flex: 1, padding: '56px 48px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '600', letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '8px' }}>{fullName}</h1>
          {cvData.title && <p style={{ fontSize: '20px', color: '#0EA5E9' }}>{cvData.title}</p>}
        </header>
        {cvData.summary && (
          <section style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#475569', maxWidth: '560px' }}>{cvData.summary}</p>
          </section>
        )}
        {cvData.workExperience?.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '28px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>Erfarenhet</h2>
            {cvData.workExperience.map(job => (
              <div key={job.id} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0F172A' }}>{job.title}</h3>
                    <div style={{ fontSize: '14px', color: '#0EA5E9' }}>{job.company}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</span>
                </div>
                {job.description && <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#64748B', marginTop: '12px' }}>{job.description}</p>}
              </div>
            ))}
          </section>
        )}
        {cvData.education?.length > 0 && (
          <section>
            <h2 style={{ fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '28px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>Utbildning</h2>
            {cvData.education.map(edu => (
              <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>{edu.degree}</h3>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>{edu.school}</div>
                </div>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{edu.startDate} — {edu.endDate}</span>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )

  const renderCenteredTemplate = () => (
    <div style={{ minHeight: '1122px', background: '#FFFFFF', fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)', padding: '64px', textAlign: 'center', color: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        {cvData.profileImage && (
          <img src={cvData.profileImage} alt="" style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', marginBottom: '24px' }} />
        )}
        <h1 style={{ fontSize: '48px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '8px' }}>{fullName}</h1>
        {cvData.title && <p style={{ fontSize: '20px', opacity: 0.9, marginBottom: '28px' }}>{cvData.title}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {cvData.email && <span style={{ fontSize: '14px', opacity: 0.9 }}>{cvData.email}</span>}
          {cvData.phone && <span style={{ fontSize: '14px', opacity: 0.9 }}>{cvData.phone}</span>}
          {cvData.location && <span style={{ fontSize: '14px', opacity: 0.9 }}>{cvData.location}</span>}
        </div>
      </header>
      <main style={{ padding: '56px 64px' }}>
        {cvData.summary && (
          <section style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#4B5563', maxWidth: '680px', margin: '0 auto' }}>{cvData.summary}</p>
          </section>
        )}
        {cvData.skills?.length > 0 && (
          <section style={{ marginBottom: '56px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {cvData.skills.map((skill, i) => (
                <span key={i} style={{ fontSize: '13px', fontWeight: '500', padding: '8px 20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)', color: '#6366F1', borderRadius: '100px' }}>{getSkillName(skill)}</span>
              ))}
            </div>
          </section>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
          {cvData.workExperience?.length > 0 && (
            <section>
              <h2 style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '32px' }}>Erfarenhet</h2>
              {cvData.workExperience.map(job => (
                <div key={job.id} style={{ paddingLeft: '20px', borderLeft: '2px solid rgba(99,102,241,0.3)', marginBottom: '32px' }}>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: '8px' }}>{job.startDate} — {job.current ? 'Nu' : job.endDate}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{job.title}</h3>
                  <div style={{ fontSize: '14px', color: '#6366F1', marginBottom: '12px' }}>{job.company}</div>
                  {job.description && <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#6B7280' }}>{job.description}</p>}
                </div>
              ))}
            </section>
          )}
          <div>
            {cvData.education?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '32px' }}>Utbildning</h2>
                {cvData.education.map(edu => (
                  <div key={edu.id} style={{ padding: '20px', background: '#F9FAFB', borderRadius: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{edu.degree}</h3>
                    <div style={{ fontSize: '14px', color: '#6366F1' }}>{edu.school}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{edu.startDate} — {edu.endDate}</div>
                  </div>
                ))}
              </section>
            )}
            {cvData.languages?.length > 0 && (
              <section>
                <h2 style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6366F1', marginBottom: '24px' }}>Språk</h2>
                {cvData.languages.map(lang => (
                  <div key={lang.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#374151' }}>{lang.language || lang.name}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{getLanguageLevelDisplay(lang.level)}</span>
                    </div>
                    <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px' }}>
                      <div style={{ width: `${getLanguageLevelPercent(lang.level)}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )

  const renderTemplate = () => {
    switch (template) {
      case 'minimal': return renderMinimalTemplate()
      case 'executive': return renderExecutiveTemplate()
      case 'creative': return renderCreativeTemplate()
      case 'nordic': return renderNordicTemplate()
      case 'centered': return renderCenteredTemplate()
      case 'sidebar':
      default: return renderModernTemplate()
    }
  }

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
        }}
      >
        {renderTemplate()}
      </div>

      {/* UI */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.export.title')}</h3>
            <p className="text-sm text-stone-700 dark:text-stone-300">{t('cv.export.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Vector PDF - Best quality with selectable text */}
          <Suspense fallback={
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium opacity-50"
            >
              <Loader2 className="w-5 h-5 animate-spin" /> {t('common.loading')}
            </button>
          }>
            <BlobProvider document={<CVPDFDocument data={cvData} />}>
              {({ blob, loading, error }) => (
                <button
                  onClick={() => {
                    if (blob) {
                      setIsExportingVectorPDF(true)
                      const link = document.createElement('a')
                      link.href = URL.createObjectURL(blob)
                      link.download = `${cvData.firstName || 'ditt'}-${cvData.lastName || 'namn'}-cv.pdf`.toLowerCase()
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(link.href)
                      setExportSuccess('vector')
                      setTimeout(() => setExportSuccess(null), 3000)
                      setIsExportingVectorPDF(false)
                    }
                  }}
                  disabled={loading || !!error || isExportingVectorPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:bg-stone-200 disabled:cursor-not-allowed transition-colors"
                >
                  {exportSuccess === 'vector' ? (
                    <><Check className="w-5 h-5" /> {t('cv.export.pdfSaved')}</>
                  ) : loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t('cv.export.preparingPdf')}</>
                  ) : error ? (
                    <><span className="text-red-200">{t('cv.export.exportError')}</span></>
                  ) : (
                    <><Zap className="w-5 h-5" /> {t('cv.export.downloadPdfRecommended')}</>
                  )}
                </button>
              )}
            </BlobProvider>
          </Suspense>

          {/* Alternative: Screenshot-based PDF */}
          <button
            onClick={handleExportPDF}
            onMouseEnter={preloadPDFLibraries}
            onFocus={preloadPDFLibraries}
            disabled={isExportingPDF || isExportingWord}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-200 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 disabled:bg-stone-100 disabled:border-stone-300 disabled:text-stone-600 disabled:cursor-not-allowed transition-colors"
          >
            {exportSuccess === 'pdf' ? (
              <><Check className="w-5 h-5" /> {t('cv.export.pdfSaved')}</>
            ) : isExportingPDF ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('cv.export.creatingPdf')}</>
            ) : (
              <><Download className="w-5 h-5" /> {t('cv.export.pdfExact')}</>
            )}
          </button>

          {/* Word export */}
          <button
            onClick={handleExportWord}
            disabled={isExportingPDF || isExportingWord}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 disabled:bg-stone-100 disabled:border-stone-300 disabled:text-stone-600 disabled:cursor-not-allowed transition-colors"
          >
            {exportSuccess === 'word' ? (
              <><Check className="w-5 h-5" /> {t('cv.export.wordSaved')}</>
            ) : isExportingWord ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('cv.export.creatingWord')}</>
            ) : (
              <><FileType className="w-5 h-5" /> {t('cv.export.downloadWord')}</>
            )}
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 mt-4 text-center">
          {t('cv.export.filename')}: {cvData.firstName?.toLowerCase() || 'ditt'}-{cvData.lastName?.toLowerCase() || 'namn'}-cv.pdf / .doc
        </p>

        <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg space-y-2">
          <p className="text-xs text-stone-700 dark:text-stone-300">
            <strong>{t('cv.export.info.recommended')}:</strong> {t('cv.export.info.recommendedDesc')}
          </p>
          <p className="text-xs text-stone-700 dark:text-stone-300">
            <strong>{t('cv.export.info.exact')}:</strong> {t('cv.export.info.exactDesc')}
          </p>
          <p className="text-xs text-stone-700 dark:text-stone-300">
            <strong>Word:</strong> {t('cv.export.info.wordDesc')}
          </p>
        </div>
      </div>
    </>
  )
}

export default CVExport
