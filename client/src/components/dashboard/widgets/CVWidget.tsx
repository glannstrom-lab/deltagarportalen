import { memo, useState } from 'react'
import { 
  FileText, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Award, 
  Download, Loader2, Check, ArrowRight, BookOpen, Briefcase, 
  Lightbulb, Target, Eye, Share2, ChevronRight, Plus, Zap
} from 'lucide-react'
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

// Helper to get recommended next steps based on CV status
function getRecommendations(progress: number, missingSections: string[] = []) {
  const recs = []
  
  if (progress < 30) {
    recs.push({ 
      type: 'interest', 
      label: 'Utforska karriärmöjligheter',
      description: 'Hitta yrken som passar dig',
      icon: Lightbulb,
      link: '/interest-guide'
    })
  }
  
  if (missingSections.includes('skills')) {
    recs.push({ 
      type: 'knowledge', 
      label: 'Utveckla kompetenser',
      description: 'Kurser för din karriär',
      icon: BookOpen,
      link: '/knowledge-base'
    })
  }
  
  if (progress >= 50 && missingSections.length <= 2) {
    recs.push({ 
      type: 'jobs', 
      label: 'Hitta jobb',
      description: 'Se matchande tjänster',
      icon: Briefcase,
      link: '/job-search'
    })
  }
  
  return recs.slice(0, 2)
}

// SMALL VARIANT - Compact & visually appealing
function CVWidgetSmall({ hasCV, progress, atsScore, loading, error, onRetry }: Omit<CVWidgetProps, 'size' | 'missingSections'>) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()

  // Dynamic content based on progress
  const getProgressVisual = () => {
    if (progress === 0) {
      return (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
          <Plus className="w-8 h-8 text-violet-500" />
        </div>
      )
    }
    if (progress >= 80) {
      return (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
      )
    }
    return (
      <div className="relative w-16 h-16 mb-3">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle 
            cx="32" cy="32" r="28" fill="none" 
            stroke="url(#gradientSmall)" 
            strokeWidth="6" 
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28 * progress / 100} ${2 * Math.PI * 28}`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradientSmall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-violet-700">{progress}%</span>
        </div>
      </div>
    )
  }

  return (
    <DashboardWidget
      title="Ditt CV"
      icon={<FileText size={18} className="text-violet-600" />}
      to="/cv"
      color="violet"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: hasCV ? 'Fortsätt' : 'Skapa CV',
      }}
    >
      <div className="flex flex-col items-center justify-center py-3 group">
        {/* Visual indicator */}
        {getProgressVisual()}
        
        {/* Status text */}
        <p className="text-sm font-medium text-slate-700 text-center">
          {progress === 0 && 'Kom igång idag'}
          {progress > 0 && progress < 50 && 'Bra start!'}
          {progress >= 50 && progress < 80 && 'Nästan klart!'}
          {progress >= 80 && 'Redo att söka jobb!'}
        </p>
        
        {/* ATS Score badge */}
        {atsScore > 0 && (
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-amber-50 rounded-full">
            <Award size={12} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-700">ATS {atsScore}</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM VARIANT - Enhanced layout with better colors
function CVWidgetMedium({ hasCV, progress, atsScore, missingSections = [], loading, error, onRetry }: CVWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()
  const recommendations = getRecommendations(progress, missingSections)

  // Section name mapping
  const sectionNames: Record<string, string> = {
    profile: 'Grundinfo',
    summary: 'Sammanfattning',
    work_experience: 'Erfarenhet',
    education: 'Utbildning',
    skills: 'Kompetenser'
  }

  // Section colors
  const sectionColors: Record<string, { bg: string; text: string; border: string }> = {
    profile: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    summary: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    work_experience: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    education: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    skills: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' }
  }

  return (
    <DashboardWidget
      title="Ditt CV"
      icon={<FileText size={20} className="text-violet-600" />}
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
      <div className="space-y-4">
        {/* Progress Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp size={26} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{progress}%</span>
                {atsScore > 0 && (
                  <span className="text-sm font-medium text-violet-100 flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                    <Award size={12} />
                    ATS {atsScore}
                  </span>
                )}
              </div>
              <p className="text-sm text-violet-100 mt-0.5">
                {progress === 0 && 'Redo att komma igång'}
                {progress > 0 && progress < 25 && 'Bra början! Varje steg räknas'}
                {progress >= 25 && progress < 50 && 'Du gör framsteg! Fortsätt så'}
                {progress >= 50 && progress < 75 && 'Så bra det blir! Du är duktig'}
                {progress >= 75 && progress < 100 && 'Ser jättebra ut! Nästan klart'}
                {progress === 100 && 'Allt klart! Vad duktig du är!'}
              </p>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/5" />
        </div>

        {/* Missing sections */}
        {missingSections.length > 0 && status !== 'empty' && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Saknas:</p>
            <div className="flex flex-wrap gap-2">
              {missingSections.slice(0, 3).map((section) => {
                const colors = sectionColors[section] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
                return (
                  <span 
                    key={section}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${colors.bg} ${colors.text} text-xs font-medium rounded-lg border ${colors.border} hover:shadow-sm transition-shadow cursor-default`}
                  >
                    <AlertCircle size={12} />
                    {sectionNames[section] || section}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Rekommenderat nästa steg:</p>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <a
                  key={rec.type}
                  href={rec.link}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-violet-300 group-hover:bg-violet-100 transition-colors">
                    <rec.icon size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-violet-700 transition-colors">{rec.label}</p>
                    <p className="text-xs text-slate-500">{rec.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {status === 'empty' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-200 p-4">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-violet-500" />
              </div>
              <div>
                <p className="font-semibold text-violet-900">Din profil väntar på dig</p>
                <p className="text-sm text-violet-700/80 mt-1">
                  När du är redo hjälper vi dig att bygga en profil som visar dina styrkor.
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
        )}

        {/* Complete state */}
        {status === 'complete' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Profil redo!</p>
              <p className="text-sm text-emerald-600">Redo att söka drömjobbet</p>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE VARIANT - Functional grid layout with Quick Actions
function CVWidgetLarge({ hasCV, progress, atsScore, missingSections = [], loading, error, onRetry }: CVWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (!hasCV) return 'empty'
    if (progress >= 80) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const recommendations = getRecommendations(progress, missingSections)

  // Section name mapping
  const sectionNames: Record<string, string> = {
    profile: 'Grundinformation',
    summary: 'Sammanfattning',
    work_experience: 'Arbetslivserfarenhet',
    education: 'Utbildning',
    skills: 'Kompetenser'
  }

  // Section colors
  const sectionColors: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    profile: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', border: 'border-blue-200' },
    summary: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500', border: 'border-violet-200' },
    work_experience: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-200' },
    education: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-200' },
    skills: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-200' }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    setExportSuccess(false)
    
    try {
      const cvData = await cvApi.getCV()
      if (!cvData) {
        alert('Inget CV att exportera')
        return
      }

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
      
      const fullName = `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim() || 'Ditt Namn'
      const scheme = { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa' }
      
      tempDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.secondary} 100%); color: white; padding: 30px 40px; margin: -40px -40px 30px -40px;">
          <h1 style="font-size: 36px; margin: 0; font-weight: bold;">${fullName}</h1>
          ${cvData.title ? `<p style="font-size: 18px; margin: 8px 0 0 0; opacity: 0.9;">${cvData.title}</p>` : ''}
          <div style="display: flex; gap: 20px; margin-top: 15px; font-size: 14px; flex-wrap: wrap;">
            ${cvData.email ? `<span>${cvData.email}</span>` : ''}
            ${cvData.phone ? `<span>${cvData.phone}</span>` : ''}
            ${cvData.location ? `<span>${cvData.location}</span>` : ''}
          </div>
        </div>
        ${cvData.summary ? `<div style="margin-bottom: 30px; padding: 20px; background: #f5f3ff; border-radius: 12px; border-left: 4px solid ${scheme.primary};"><p style="margin: 0; color: #4c1d95; font-style: italic;">${cvData.summary}</p></div>` : ''}
        ${cvData.work_experience?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${scheme.primary}; border-bottom: 3px solid ${scheme.accent}; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">Arbetslivserfarenhet</h2>
            ${cvData.work_experience.map((exp: any) => `
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <h3 style="margin: 0; color: #1e1b4b; font-size: 16px; font-weight: 600;">${exp.title}</h3>
                  <span style="color: #6b7280; font-size: 14px; font-weight: 500;">${exp.startDate || ''} - ${exp.current ? 'Pågående' : (exp.endDate || '')}</span>
                </div>
                <p style="margin: 4px 0; color: #4c1d95; font-size: 14px; font-weight: 500;">${exp.company}${exp.location ? `, ${exp.location}` : ''}</p>
                ${exp.description ? `<p style="margin: 8px 0 0 0; color: #374151;">${exp.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${cvData.education?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${scheme.primary}; border-bottom: 3px solid ${scheme.accent}; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">Utbildning</h2>
            ${cvData.education.map((edu: any) => `
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <h3 style="margin: 0; color: #1e1b4b; font-size: 16px; font-weight: 600;">${edu.degree}${edu.field ? ` i ${edu.field}` : ''}</h3>
                  <span style="color: #6b7280; font-size: 14px; font-weight: 500;">${edu.startDate || ''} - ${edu.endDate || ''}</span>
                </div>
                <p style="margin: 4px 0; color: #4c1d95; font-size: 14px; font-weight: 500;">${edu.school}${edu.location ? `, ${edu.location}` : ''}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${cvData.skills?.length ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: ${scheme.primary}; border-bottom: 3px solid ${scheme.accent}; padding-bottom: 8px; font-size: 20px; margin-bottom: 15px;">Kompetenser</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${cvData.skills.map((skill: any) => `
                <span style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); color: ${scheme.primary}; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; border: 1px solid #ddd6fe;">${typeof skill === 'string' ? skill : skill.name}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `
      
      document.body.appendChild(tempDiv)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
      const tempDivs = document.querySelectorAll('[style*="left: -10000px"]')
      tempDivs.forEach(el => el.remove())
    }
  }

  return (
    <DashboardWidget
      title="Ditt CV"
      icon={<FileText size={22} className="text-violet-600" />}
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
    >
      <div className="space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Progress Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp size={32} className="text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold">{progress}%</p>
                <p className="text-sm text-violet-100 font-medium mt-1">
                  {progress < 25 && 'Bra början!'}
                  {progress >= 25 && progress < 50 && 'Du gör framsteg!'}
                  {progress >= 50 && progress < 75 && 'Så bra det blir!'}
                  {progress >= 75 && 'Ser jättebra ut!'}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
              <div 
                className="h-full bg-white/40 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          </div>

          {/* ATS Score Card */}
          <div className={`relative overflow-hidden rounded-2xl p-5 ${atsScore >= 70 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : atsScore >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'} text-white`}>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Award size={32} className="text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold">{atsScore || '--'}</p>
                <p className="text-sm text-white/80 font-medium mt-1">
                  {atsScore >= 70 ? 'Bra ATS-score!' : atsScore >= 50 ? 'Kan förbättras' : 'Lägg till mer info'}
                </p>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting || !hasCV}
            className="group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
              {exportSuccess ? (
                <Check size={24} className="text-emerald-600" />
              ) : isExporting ? (
                <Loader2 size={24} className="text-rose-600 animate-spin" />
              ) : (
                <Download size={24} className="text-rose-600" />
              )}
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700">
              {exportSuccess ? 'PDF Sparad!' : isExporting ? 'Skapar...' : 'Ladda ner PDF'}
            </span>
          </button>

          <a
            href="/cv?tab=preview"
            className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Eye size={24} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700">Förhandsgranska</span>
          </a>

          <button
            className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasCV}
            onClick={() => alert('Dela-funktion kommer snart!')}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <Share2 size={24} className="text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700">Dela</span>
          </button>
        </div>

        {/* Missing Sections & Recommendations Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Missing sections */}
          {missingSections.length > 0 && status !== 'empty' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Komplettera din profil
              </p>
              <div className="space-y-2">
                {missingSections.slice(0, 4).map((section) => {
                  const colors = sectionColors[section] || { bg: 'bg-white', text: 'text-slate-700', icon: 'text-slate-500', border: 'border-slate-200' }
                  return (
                    <div 
                      key={section}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${colors.bg} border ${colors.border} text-sm ${colors.text}`}
                    >
                      <AlertCircle size={14} className={colors.icon} />
                      <span className="font-medium">{sectionNames[section] || section}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className={`p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 ${missingSections.length === 0 ? 'col-span-2' : ''}`}>
            <p className="text-sm font-semibold text-violet-900 mb-3 flex items-center gap-2">
              <Target size={16} className="text-violet-600" />
              Förslag på nästa steg
            </p>
            <div className="space-y-2">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <a
                    key={rec.type}
                    href={rec.link}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                      <rec.icon size={18} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-violet-700 transition-colors">{rec.label}</p>
                      <p className="text-xs text-slate-500">{rec.description}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                  </a>
                ))
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-100/50 border border-emerald-200">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Din profil är redo!</p>
                    <p className="text-xs text-emerald-600">Redo för jobbsökning</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {status === 'empty' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 p-6 text-white">
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold">Din profil väntar på dig</p>
                <p className="text-sm text-violet-100 mt-2 max-w-md">
                  När du är redo hjälper vi dig att bygga en profil som visar dina styrkor. 
                  Ta den tid du behöver - vi finns här för att stötta dig.
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        )}

        {/* Complete state */}
        {status === 'complete' && (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-800">Profilen är redo för jobbsökning!</p>
              <p className="text-sm text-emerald-600">Bra jobbat med att skapa en komplett profil. Du kan nu söka jobb med confidence!</p>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Main component that selects the right variant
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
