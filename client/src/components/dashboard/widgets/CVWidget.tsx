import { memo, useState } from 'react'
import { FileText, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Award, Download, Loader2, Check } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'
import { cvApi, type CVData } from '@/services/supabaseApi'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface CVWidgetProps {
  hasCV: boolean
  progress: number
  atsScore: number
  missingSections?: string[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL VARIANT - Minimal info
function CVWidgetSmall({ hasCV, progress, atsScore, loading, error, onRetry }: Omit<CVWidgetProps, 'size' | 'missingSections'>) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Ditt CV"
      icon={<FileText size={20} />}
      to="/cv"
      color="violet"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasCV ? 'Fortsätt' : 'Börja',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2">
        {/* Stort nummer - enda fokus */}
        <div className="text-4xl font-bold text-violet-700 mb-1">
          {progress}%
        </div>
        <p className="text-sm text-slate-500 text-center">
          {progress === 0 ? 'Kom igång' : progress >= 80 ? 'Bra jobbat!' : 'Du är på väg'}
        </p>
        {atsScore > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <Award size={12} />
            <span>ATS: {atsScore}</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM VARIANT - Mer detaljer
function CVWidgetMedium({ hasCV, progress, atsScore, missingSections = [], loading, error, onRetry }: CVWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Ditt CV"
      icon={<FileText size={22} />}
      to="/cv"
      color="violet"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasCV ? 'Fortsätt bygga' : 'Skapa profil',
      }}
    >
      <div className="space-y-3">
        {/* Progress med ATS */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-violet-700">{progress}%</span>
              {atsScore > 0 && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Award size={12} className="text-amber-500" />
                  ATS {atsScore}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {progress < 25 && 'Bra början!'}
              {progress >= 25 && progress < 50 && 'Du gör framsteg!'}
              {progress >= 50 && progress < 75 && 'Så bra det blir!'}
              {progress >= 75 && 'Ser jättebra ut!'}
            </p>
          </div>
        </div>

        {/* Missing sections som tags */}
        {missingSections.length > 0 && status !== 'empty' && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Vad som saknas:</p>
            <div className="flex flex-wrap gap-1.5">
              {missingSections.slice(0, 3).map((section) => (
                <span 
                  key={section}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                >
                  <AlertCircle size={10} />
                  {section === 'profile' && 'Grundinfo'}
                  {section === 'summary' && 'Sammanfattning'}
                  {section === 'work_experience' && 'Erfarenhet'}
                  {section === 'education' && 'Utbildning'}
                  {section === 'skills' && 'Kompetenser'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {status === 'empty' && (
          <div className="p-3 bg-violet-50 rounded-lg">
            <p className="text-sm text-violet-700">
              Din profil väntar på dig - när du är redo
            </p>
          </div>
        )}

        {/* Complete state */}
        {status === 'complete' && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 size={16} />
            <span>Profil redo!</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE VARIANT - Fullständig översikt
function CVWidgetLarge({ hasCV, progress, atsScore, missingSections = [], loading, error, onRetry }: CVWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExportPDF = async () => {
    setIsExporting(true)
    setExportSuccess(false)
    
    try {
      // Hämta CV-data
      const cvData = await cvApi.getCV()
      if (!cvData) {
        alert('Inget CV att exportera')
        return
      }

      // Skapa ett temporärt element för rendering
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = `
        position: fixed;
        left: -10000px;
        top: 0;
        width: 794px;
        background: white;
        padding: 40px;
        font-family: Arial, sans-serif;
        color: #333;
        line-height: 1.6;
        z-index: -9999;
      `
      
      // Bygg CV HTML
      const fullName = `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim() || 'Ditt Namn'
      const scheme = { primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8' }
      
      tempDiv.innerHTML = `
        <div style="background: ${scheme.primary}; color: white; padding: 30px 40px; margin: -40px -40px 30px -40px;">
          <h1 style="font-size: 36px; margin: 0; font-weight: bold;">${fullName}</h1>
          ${cvData.title ? `<p style="font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">${cvData.title}</p>` : ''}
          <div style="display: flex; gap: 20px; margin-top: 15px; font-size: 14px; flex-wrap: wrap;">
            ${cvData.email ? `<span>${cvData.email}</span>` : ''}
            ${cvData.phone ? `<span>${cvData.phone}</span>` : ''}
            ${cvData.location ? `<span>${cvData.location}</span>` : ''}
          </div>
        </div>
        ${cvData.summary ? `<div style="margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;"><p style="margin: 0; font-style: italic;">${cvData.summary}</p></div>` : ''}
        ${cvData.work_experience?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${scheme.primary}; border-bottom: 2px solid ${scheme.primary}; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">Arbetslivserfarenhet</h2>
            ${cvData.work_experience.map((exp: any) => `
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <h3 style="margin: 0; color: #334155; font-size: 16px;">${exp.title}</h3>
                  <span style="color: #64748b; font-size: 14px;">${exp.startDate || ''} - ${exp.current ? 'Pågående' : (exp.endDate || '')}</span>
                </div>
                <p style="margin: 4px 0; color: #64748b; font-size: 14px;">${exp.company}${exp.location ? `, ${exp.location}` : ''}</p>
                ${exp.description ? `<p style="margin: 8px 0 0 0;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${cvData.education?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${scheme.primary}; border-bottom: 2px solid ${scheme.primary}; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">Utbildning</h2>
            ${cvData.education.map((edu: any) => `
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <h3 style="margin: 0; color: #334155; font-size: 16px;">${edu.degree}${edu.field ? ` i ${edu.field}` : ''}</h3>
                  <span style="color: #64748b; font-size: 14px;">${edu.startDate || ''} - ${edu.endDate || ''}</span>
                </div>
                <p style="margin: 4px 0; color: #64748b; font-size: 14px;">${edu.school}${edu.location ? `, ${edu.location}` : ''}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${cvData.skills?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${scheme.primary}; border-bottom: 2px solid ${scheme.primary}; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">Kompetenser</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cvData.skills.map((skill: any) => `
                <span style="background: #e0e7ff; color: ${scheme.primary}; padding: 6px 14px; border-radius: 16px; font-size: 14px;">${typeof skill === 'string' ? skill : skill.name}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `
      
      document.body.appendChild(tempDiv)
      
      // Vänta på rendering
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Skapa PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        width: 794
      })
      
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
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio)
      
      const fileName = `${cvData.firstName || 'cv'}-${cvData.lastName || 'export'}.pdf`.toLowerCase().replace(/\s+/g, '-')
      pdf.save(fileName)
      
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('PDF-exportfel:', error)
      alert('Kunde inte exportera PDF. Försök igen.')
    } finally {
      setIsExporting(false)
      // Städa upp
      const tempDivs = document.querySelectorAll('[style*="left: -10000px"]')
      tempDivs.forEach(el => el.remove())
    }
  }

  return (
    <DashboardWidget
      title="Ditt CV"
      icon={<FileText size={24} />}
      to="/cv"
      color="violet"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasCV ? 'Redigera CV' : 'Skapa profil',
      }}
      secondaryAction={hasCV ? {
        label: exportSuccess ? 'PDF Sparad!' : (isExporting ? 'Skapar PDF...' : 'Ladda ner PDF'),
        onClick: handleExportPDF,
        disabled: isExporting,
        icon: exportSuccess ? <Check size={16} /> : (isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />)
      } : undefined}
    >
      <div className="space-y-4">
        {/* Två kolumner: Progress + ATS */}
        <div className="grid grid-cols-2 gap-4">
          {/* Progress-kolumn */}
          <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp size={28} className="text-violet-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-violet-700">{progress}%</p>
              <p className="text-sm text-violet-600">
                {progress < 25 && 'Bra början!'}
                {progress >= 25 && progress < 50 && 'Du gör framsteg!'}
                {progress >= 50 && progress < 75 && 'Så bra det blir!'}
                {progress >= 75 && 'Ser jättebra ut!'}
              </p>
            </div>
          </div>

          {/* ATS-kolumn */}
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Award size={28} className="text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-700">{atsScore || '--'}</p>
              <p className="text-sm text-amber-600">
                {atsScore >= 70 ? 'Bra ATS-score!' : atsScore >= 50 ? 'Kan förbättras' : 'Lägg till mer info'}
              </p>
            </div>
          </div>
        </div>

        {/* Missing sections lista */}
        {missingSections.length > 0 && status !== 'empty' && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Komplettera din profil för att nå 100%:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {missingSections.map((section) => (
                <div 
                  key={section}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-sm text-slate-600"
                >
                  <AlertCircle size={14} className="text-amber-500" />
                  {section === 'profile' && 'Grundinformation'}
                  {section === 'summary' && 'Sammanfattning'}
                  {section === 'work_experience' && 'Arbetslivserfarenhet'}
                  {section === 'education' && 'Utbildning'}
                  {section === 'skills' && 'Kompetenser'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {status === 'empty' && (
          <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-start gap-4">
              <Sparkles size={24} className="text-violet-500 mt-1" />
              <div>
                <p className="text-lg font-medium text-violet-900 mb-1">Din profil väntar på dig</p>
                <p className="text-sm text-violet-700">
                  När du är redo hjälper vi dig att bygga en profil som visar dina styrkor. 
                  Ta den tid du behöver - vi finns här för att stötta dig.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Complete state */}
        {status === 'complete' && (
          <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <div>
              <p className="font-medium text-emerald-800">Profilen är redo för jobbsökning!</p>
              <p className="text-sm text-emerald-600">Bra jobbat med att skapa en komplett profil.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent som väljer rätt variant
export const CVWidget = memo(function CVWidget(props: CVWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <CVWidgetLarge {...rest} />
    case 'medium':
      return <CVWidgetMedium {...rest} />
    case 'small':
    default:
      return <CVWidgetSmall {...rest} />
  }
})
