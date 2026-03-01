import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  FileText, 
  Sparkles, 
  Save, 
  Copy, 
  RefreshCw, 
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Briefcase,
  History,
  Trash2,
  Download,
  CheckCircle,
  Loader2,
  Heart,
  Pause,
  AlertCircle,
  Check,
  ArrowRight,
  Lightbulb,
  User,
  Building2,
  Target,
  Award,
  Send,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { aiService } from '@/services/aiService'
import { cvApi, coverLetterApi, jobsApi } from '@/services/api'
import { searchPlatsbanken, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { useAutoSave } from '@/hooks/useAutoSave'
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator'
import { SupportiveLanguage } from '@/components/SupportiveLanguage'

interface SavedCoverLetter {
  id: string
  title: string
  jobbAnnons: string
  brev: string
  createdAt: string
  updatedAt: string
  company?: string
  jobTitle?: string
}

interface CVData {
  firstName?: string
  lastName?: string
  title?: string
  summary?: string
  workExperience?: Array<{
    title: string
    company: string
    description: string
  }>
  skills?: Array<{
    name: string
  }>
}

interface Template {
  id: string
  label: string
  description: string
  promptAddition: string
  icon: React.ReactNode
}

const templates: Template[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Bra för de flesta situationer',
    promptAddition: '',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'tillbaka',
    label: 'Tillbaka efter paus',
    description: 'Efter sjukskrivning, föräldraledighet eller annan paus',
    promptAddition: 'Användaren har varit borta från arbetsmarknaden och är nu redo att komma tillbaka. Fokusera på motivation och framåtblick, inte ursäkter.',
    icon: <Heart className="w-4 h-4" />,
  },
  {
    id: 'karriarbyte',
    label: 'Byter karriärväg',
    description: 'När du söker jobb i en ny bransch',
    promptAddition: 'Användaren byter karriärväg. Fokusera på överförbara färdigheter och motivation för den nya branschen.',
    icon: <ArrowRight className="w-4 h-4" />,
  },
  {
    id: 'nyexaminerad',
    label: 'Nyexaminerad',
    description: 'När du saknar arbetslivserfarenhet',
    promptAddition: 'Användaren är nyexaminerad. Fokusera på utbildning, praktik, och potential snarare än erfarenhet.',
    icon: <Award className="w-4 h-4" />,
  },
  {
    id: 'kort',
    label: 'Kort & konkret',
    description: 'När du har ont om tid eller energi',
    promptAddition: 'Håll brevet kort och konkret. Max 2-3 korta stycken. Fokusera på det viktigaste.',
    icon: <Sparkles className="w-4 h-4" />,
  }
]

export default function CoverLetterGenerator() {
  // === FORM STATE ===
  const [jobbAnnons, setJobbAnnons] = useState('')
  const [tidigareBrev, setTidigareBrev] = useState('')
  const [motivering, setMotivering] = useState('')
  const [ton, setTon] = useState<'professionell' | 'entusiastisk' | 'formell'>('professionell')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard')
  
  // === CV DATA ===
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [cvMatchScore, setCvMatchScore] = useState<number | null>(null)
  
  // === GENERATED LETTER ===
  const [generatedBrev, setGeneratedBrev] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setGenerationProgress] = useState(0)
  
  // === SAVED LETTERS ===
  const [savedLetters, setSavedLetters] = useState<SavedCoverLetter[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // === SAVED JOBS ===
  const [savedJobs, setSavedJobs] = useState<PlatsbankenJob[]>([])
  const [showSavedJobs, setShowSavedJobs] = useState(false)
  
  // === APPLICATIONS ===
  const [applications, setApplications] = useState<Array<{
    id: string
    company: string
    jobTitle: string
    status: 'applied' | 'interview' | 'rejected' | 'offer'
    appliedDate: string
  }>>([])
  const [showApplications, setShowApplications] = useState(false)
  
  // === SECTIONS EXPANSION ===
  const [expandedSections, setExpandedSections] = useState({
    template: false,
    input: true,
    cv: true,
    result: false
  })

  // === AUTO-SAVE ===
  const autoSaveData = {
    jobbAnnons,
    tidigareBrev,
    motivering,
    company,
    jobTitle,
    selectedTemplate,
    generatedBrev,
    saveTitle
  }

  const {
    lastSaved,
    isSaving: isAutoSaving,
    hasRestoredData: _hasRestoredData,
    clearSavedData
  } = useAutoSave({
    key: 'cover-letter-draft',
    data: autoSaveData,
    onRestore: (saved) => {
      setJobbAnnons(saved.jobbAnnons || '')
      setTidigareBrev(saved.tidigareBrev || '')
      setMotivering(saved.motivering || '')
      setCompany(saved.company || '')
      setJobTitle(saved.jobTitle || '')
      setSelectedTemplate(saved.selectedTemplate || 'standard')
      setGeneratedBrev(saved.generatedBrev || '')
      setSaveTitle(saved.saveTitle || '')
    }
  })

  // === LOAD DATA ===
  useEffect(() => {
    loadCVData()
    loadSavedLetters()
    loadSavedJobs()
  }, [])

  const loadCVData = async () => {
    setCvLoading(true)
    try {
      const cv = await cvApi.getCV()
      console.log('📄 Laddade CV:', cv)
      
      if (!cv) {
        console.warn('⚠️ Inget CV hittades')
        setCvData(null)
        return
      }
      
      setCvData({
        firstName: cv.firstName || cv.user?.firstName || '',
        lastName: cv.lastName || cv.user?.lastName || '',
        title: cv.title || '',
        summary: cv.summary || '',
        workExperience: cv.workExperience || [],
        skills: cv.skills || []
      })
    } catch (err) {
      console.error('❌ Kunde inte ladda CV:', err)
      setCvData(null)
    } finally {
      setCvLoading(false)
    }
  }

  const loadSavedLetters = async () => {
    try {
      const letters = await coverLetterApi.getAll()
      setSavedLetters(letters.map((l: any) => ({
        id: l.id,
        title: l.title,
        jobbAnnons: l.jobAd,
        brev: l.content,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        company: l.company,
        jobTitle: l.jobTitle
      })))
    } catch (e) {
      console.error('Kunde inte ladda sparade brev:', e)
    }
  }

  const loadSavedJobs = async () => {
    try {
      const jobs = await jobsApi.getSavedJobs()
      setSavedJobs(jobs.map((j: any) => j.job_data))
    } catch (e) {
      console.error('Kunde inte ladda sparade jobb:', e)
      // Fallback till localStorage om API inte fungerar
      const saved = localStorage.getItem('savedJobs')
      if (saved) {
        try {
          setSavedJobs(JSON.parse(saved))
        } catch (e) {
          console.error('Kunde inte ladda sparade jobb från localStorage:', e)
        }
      }
    }
  }

  // === CV MATCH ANALYSIS ===
  const analyzeCVMatch = useCallback(() => {
    if (!jobbAnnons.trim() || !cvData) {
      setCvMatchScore(null)
      return
    }

    // Enkel analys baserad på nyckelord
    const annonsWords = jobbAnnons.toLowerCase().split(/\s+/)
    const cvWords = [
      ...(cvData.skills?.map(s => s.name.toLowerCase()) || []),
      ...(cvData.workExperience?.map(w => w.title.toLowerCase()) || []),
      ...(cvData.summary?.toLowerCase().split(/\s+/) || [])
    ]

    const matchingWords = annonsWords.filter(word => 
      cvWords.some(cvWord => cvWord.includes(word) || word.includes(cvWord))
    )

    const score = Math.min(100, Math.round((matchingWords.length / Math.min(annonsWords.length, 20)) * 100))
    setCvMatchScore(score)
  }, [jobbAnnons, cvData])

  useEffect(() => {
    analyzeCVMatch()
  }, [analyzeCVMatch])

  // === OFFLINE TEMPLATE GENERATOR ===
  const generateOfflineTemplate = (): string => {
    const template = templates.find(t => t.id === selectedTemplate)
    const erfarenheter = cvData?.workExperience?.slice(0, 2) || []
    const kompetenser = cvData?.skills?.slice(0, 5).map(s => s.name).join(', ') || ''
    
    let brev = ''
    
    // Datum och adressering
    brev += `${new Date().toLocaleDateString('sv-SE')}\n\n`
    brev += company ? `${company}\n` : '[Företag]\n'
    brev += 'Att: Rekryteringsansvarig\n\n'
    
    // Hälsning
    brev += 'Hej,\n\n'
    
    // Inledning baserad på mall
    if (template?.id === 'tillbaka') {
      brev += `Jag skriver för att uttrycka mitt intresse för tjänsten som ${jobTitle || 'den aktuella rollen'}. Efter en period borta från arbetsmarknaden är jag nu redo att återvända och bidra med mina erfarenheter.`
    } else if (template?.id === 'karriarbyte') {
      brev += `Jag skriver för att söka tjänsten som ${jobTitle || 'den aktuella rollen'}. Jag ser detta som en spännande möjlighet att ta med mig mina erfarenheter in i en ny bransch.`
    } else if (template?.id === 'nyexaminerad') {
      brev += `Som nyexaminerad inom ${cvData?.title || 'mitt område'} skriver jag för att söka tjänsten som ${jobTitle || 'den aktuella rollen'}. Jag är entusiastisk över möjligheten att få bidra och utvecklas.`
    } else {
      brev += `Jag skriver med stort intresse för tjänsten som ${jobTitle || 'den aktuella rollen'}${company ? ` på ${company}` : ''}.`
    }
    
    // Motivering om angiven
    if (motivering) {
      brev += ` ${motivering}`
    }
    brev += '\n\n'
    
    // Kropp - erfarenheter
    if (erfarenheter.length > 0) {
      brev += 'Med min bakgrund '
      erfarenheter.forEach((exp, idx) => {
        if (idx === 0) {
          brev += `som ${exp.title} på ${exp.company}`
        } else {
          brev += ` och ${exp.title} på ${exp.company}`
        }
      })
      brev += ' har jag utvecklat värdefulla kompetenser.'
      
      if (kompetenser) {
        brev += ` Bland annat inom ${kompetenser}.`
      }
      brev += '\n\n'
    } else if (cvData?.summary) {
      brev += `${cvData.summary}\n\n`
    }
    
    // Koppling till jobbannons
    if (jobbAnnons.length > 50) {
      brev += 'När jag läste om tjänsten kände jag att mina erfarenheter skulle kunna komma till nytta, särskilt med tanke på de krav och kvalifikationer ni efterfrågar. '
    }
    
    // Avslutning baserad på ton
    if (ton === 'entusiastisk') {
      brev += 'Jag ser verkligen fram emot möjligheten att få diskutera hur jag kan bidra till ert team!\n\n'
    } else if (ton === 'formell') {
      brev += 'Jag ser fram emot att få diskutera mina kvalifikationer vidare vid ett eventuellt intervjutillfälle.\n\n'
    } else {
      brev += 'Jag ser fram emot att höra från er och få möjlighet att berätta mer om hur jag kan bidra.\n\n'
    }
    
    // Signatur
    brev += 'Med vänliga hälsningar,\n\n'
    brev += cvData?.firstName && cvData?.lastName 
      ? `${cvData.firstName} ${cvData.lastName}`
      : '[Ditt namn]'
    
    if (cvData?.phone) brev += `\n${cvData.phone}`
    if (cvData?.email) brev += `\n${cvData.email}`
    
    return brev
  }

  // === GENERATE ===
  const handleGenerate = async () => {
    if (!jobbAnnons.trim() && !company && !jobTitle) {
      setError('Fyll i åtminstone företag, jobbtitel eller jobbannons för att komma igång.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationProgress(0)

    // Simulera progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(p => Math.min(90, p + 10))
    }, 300)

    try {
      const template = templates.find(t => t.id === selectedTemplate)
      const erfarenhet = cvData?.workExperience
        ?.map(w => `${w.title} på ${w.company}`)
        .join(', ')

      // Bygg cvData för AI-tjänsten
      const aiCvData = cvData ? {
        firstName: cvData.firstName || '',
        lastName: cvData.lastName || '',
        title: cvData.title || '',
        summary: cvData.summary || '',
        workExperience: cvData.workExperience || [],
        skills: cvData.skills || []
      } : undefined

      const response = await aiService.generateCoverLetter({
        jobbAnnons,
        companyName: company,
        jobTitle: jobTitle,
        erfarenhet: erfarenhet || cvData?.summary || tidigareBrev,
        motivering: motivering || undefined,
        namn: cvData?.firstName && cvData?.lastName 
          ? `${cvData.firstName} ${cvData.lastName}` 
          : undefined,
        ton,
        extraContext: template?.promptAddition,
        cvData: aiCvData
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (!response || !response.brev) {
        throw new Error('Inget brev genererades')
      }

      setGeneratedBrev(response.brev)
      setExpandedSections(prev => ({ ...prev, result: true }))
      
      if (!saveTitle && company && jobTitle) {
        setSaveTitle(`${company} - ${jobTitle}`)
      }

      // Scroll to result
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 100)
    } catch (err) {
      clearInterval(progressInterval)
      
      // OFFLINE FALLBACK: Generera mall lokalt
      console.log('AI-tjänsten ej tillgänglig, använder offline-mall')
      const offlineBrev = generateOfflineTemplate()
      setGeneratedBrev(offlineBrev)
      setExpandedSections(prev => ({ ...prev, result: true }))
      
      if (!saveTitle && company && jobTitle) {
        setSaveTitle(`${company} - ${jobTitle}`)
      }
      
      // Visa info om att det är en mall
      setError('Vi kunde inte ansluta till vår smarta hjälp just nu, så vi har skapat ett förslag baserat på din information istället. Du kan redigera det hur du vill!')
      
      // Scroll to result
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 100)
    } finally {
      setIsGenerating(false)
    }
  }

  // === SAVE ===
  const handleSave = async () => {
    if (!generatedBrev.trim()) return

    const title = saveTitle.trim() || `Personligt brev - ${new Date().toLocaleDateString('sv-SE')}`
    
    try {
      await coverLetterApi.create({
        title,
        jobAd: jobbAnnons,
        content: generatedBrev,
        company: company || undefined,
        jobTitle: jobTitle || undefined
      })
      
      await loadSavedLetters()
      setIsSaving(true)
      setTimeout(() => setIsSaving(false), 1000)
      clearSavedData() // Rensa auto-save när explicit sparat
    } catch (e) {
      console.error('Kunde inte spara brev:', e)
      setError('Kunde inte spara just nu. Ditt brev är fortfarande sparat lokalt i din webbläsare.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta brev?')) return
    
    try {
      await coverLetterApi.delete(id)
      await loadSavedLetters()
    } catch (e) {
      console.error('Kunde inte ta bort brev:', e)
      setError('Kunde inte ta bort brevet. Försök igen.')
    }
  }

  const handleLoad = (letter: SavedCoverLetter) => {
    setJobbAnnons(letter.jobbAnnons)
    setGeneratedBrev(letter.brev)
    setCompany(letter.company || '')
    setJobTitle(letter.jobTitle || '')
    setSaveTitle(letter.title)
    setExpandedSections({ template: false, input: true, cv: false, result: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLoadJob = (job: PlatsbankenJob) => {
    setJobTitle(job.headline)
    setCompany(job.employer?.name || '')
    setJobbAnnons(job.description?.text || '')
    setShowSavedJobs(false)
    setExpandedSections(prev => ({ ...prev, input: true }))
  }

  // === ACTIONS ===
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBrev)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTXT = () => {
    const blob = new Blob([generatedBrev], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${saveTitle || 'Personligt-brev'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadWord = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${saveTitle || 'Personligt brev'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 40px; }
          .header { margin-bottom: 40px; }
          .date { color: #666; margin-bottom: 20px; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="header">
          ${cvData?.firstName && cvData?.lastName ? `<p><strong>${cvData.firstName} ${cvData.lastName}</strong></p>` : ''}
          ${cvData?.email ? `<p>${cvData.email}</p>` : ''}
          ${cvData?.phone ? `<p>${cvData.phone}</p>` : ''}
        </div>
        <div class="date">${new Date().toLocaleDateString('sv-SE')}</div>
        <div class="content">${generatedBrev.replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `
    
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${saveTitle || 'Personligt-brev'}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = async () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Kunde inte öppna utskriftsfönster. Kontrollera att popup-fönster är tillåtna.')
      return
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${saveTitle || 'Personligt brev'}</title>
        <style>
          @page { margin: 2cm; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
          .header { margin-bottom: 40px; }
          .date { color: #666; margin-bottom: 20px; }
          .content { white-space: pre-wrap; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${cvData?.firstName && cvData?.lastName ? `<p><strong>${cvData.firstName} ${cvData.lastName}</strong></p>` : ''}
          ${cvData?.email ? `<p>${cvData.email}</p>` : ''}
          ${cvData?.phone ? `<p>${cvData.phone}</p>` : ''}
        </div>
        <div class="date">${new Date().toLocaleDateString('sv-SE')}</div>
        <div class="content">${generatedBrev.replace(/\n/g, '<br>')}</div>
        <script>
          setTimeout(() => {
            window.print()
            window.close()
          }, 500)
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleReset = () => {
    if (confirm('Detta rensar alla fält. Ditt nuvarande arbete är sparat om du vill återvända till det senare. Vill du fortsätta?')) {
      setJobbAnnons('')
      setTidigareBrev('')
      setMotivering('')
      setGeneratedBrev('')
      setSaveTitle('')
      setCompany('')
      setJobTitle('')
      setCvMatchScore(null)
      setError(null)
      clearSavedData()
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // === RENDER ===
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 mb-2">
          <FileText className="w-7 h-7 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Hjälp att formulera ditt personliga brev</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Dina erfarenheter + vår hjälp med formuleringar = ett brev som känns som dig. 
          Det är okej att inte vara 100% entusiastisk - ärlighet är bäst.
        </p>
        
        {/* Auto-save indicator */}
        <div className="flex justify-center pt-2">
          <AutoSaveIndicator 
            status={isAutoSaving ? 'saving' : lastSaved ? 'saved' : 'unsaved'}
            lastSaved={lastSaved}
            compact
          />
        </div>
      </div>

      {/* Supportive message */}
      <SupportiveLanguage 
        type="encouragement" 
        emotionalState="tired"
        className="max-w-2xl mx-auto"
      />

      {/* Template Selection */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('template')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Välj utgångspunkt</h2>
              <p className="text-sm text-slate-500">
                {templates.find(t => t.id === selectedTemplate)?.label}
              </p>
            </div>
          </div>
          {expandedSections.template ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections.template && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-200 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedTemplate === template.id ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">{template.label}</span>
                    <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Saved Letters & Jobs Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="font-medium text-slate-800">Dina sparade brev</h3>
                <p className="text-sm text-slate-500">{savedLetters.length} sparade</p>
              </div>
            </div>
            {showSaved ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showSaved && (
            <div className="mt-4 space-y-3 border-t pt-4 max-h-64 overflow-y-auto">
              {savedLetters.length === 0 ? (
                <p className="text-slate-500 text-center py-4 text-sm">Inga sparade brev ännu</p>
              ) : (
                savedLetters.map((letter) => (
                  <div
                    key={letter.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{letter.title}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(letter.createdAt).toLocaleDateString('sv-SE')}
                        {letter.company && ` • ${letter.company}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleLoad(letter)}
                        className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        Öppna
                      </button>
                      <button
                        onClick={() => handleDelete(letter.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <button
            onClick={() => setShowSavedJobs(!showSavedJobs)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="font-medium text-slate-800">Sparade jobb</h3>
                <p className="text-sm text-slate-500">{savedJobs.length} jobb</p>
              </div>
            </div>
            {showSavedJobs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showSavedJobs && (
            <div className="mt-4 space-y-3 border-t pt-4 max-h-64 overflow-y-auto">
              {savedJobs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm mb-2">Inga sparade jobb</p>
                  <a href="/jobs" className="text-sm text-teal-600 hover:underline">
                    Sök jobb att spara →
                  </a>
                </div>
              ) : (
                savedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{job.headline}</p>
                      <p className="text-sm text-slate-500">
                        {job.employer?.name}
                        {job.workplace_address?.municipality && ` • ${job.workplace_address.municipality}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLoadJob(job)}
                      className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors ml-2"
                    >
                      Använd
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        {/* Applications Section */}
        <Card className="p-4">
          <button
            onClick={() => setShowApplications(!showApplications)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5 text-orange-500" />
              <div>
                <h3 className="font-medium text-slate-800">Dina ansökningar</h3>
                <p className="text-sm text-slate-500">{applications.length} registrerade</p>
              </div>
            </div>
            {showApplications ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showApplications && (
            <div className="mt-4 space-y-3 border-t pt-4 max-h-64 overflow-y-auto">
              {applications.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm mb-3">Inga ansökningar registrerade än</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Håll koll på dina ansökningar för att följa upp och se vilka som ger svar
                  </p>
                  <button
                    onClick={() => {
                      const newApplication = {
                        id: Date.now().toString(),
                        company: company || 'Nytt företag',
                        jobTitle: jobTitle || 'Nytt jobb',
                        status: 'applied' as const,
                        appliedDate: new Date().toISOString()
                      }
                      setApplications([newApplication, ...applications])
                    }}
                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    + Registrera ansökan
                  </button>
                </div>
              ) : (
                <>
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{app.jobTitle}</p>
                        <p className="text-sm text-slate-500">
                          {app.company} • {new Date(app.appliedDate).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          app.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                          app.status === 'interview' ? 'bg-amber-100 text-amber-700' :
                          app.status === 'offer' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {app.status === 'applied' ? 'Skickad' :
                           app.status === 'interview' ? 'Intervju' :
                           app.status === 'offer' ? 'Erbjudande' : 'Avslag'}
                        </span>
                        <button
                          onClick={() => setApplications(applications.filter(a => a.id !== app.id))}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newApplication = {
                        id: Date.now().toString(),
                        company: company || 'Nytt företag',
                        jobTitle: jobTitle || 'Nytt jobb',
                        status: 'applied' as const,
                        appliedDate: new Date().toISOString()
                      }
                      setApplications([newApplication, ...applications])
                    }}
                    className="w-full py-2 border-2 border-dashed border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm"
                  >
                    + Registrera ny ansökan
                  </button>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Input Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('input')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-slate-800">Jobbinformation</h2>
          </div>
          {expandedSections.input ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections.input && (
          <div className="p-4 pt-0 space-y-4">
            {/* Company & Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Företag
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="t.ex. Acme AB"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jobbtitel
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="t.ex. Projektledare"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Job Ad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jobbannons <span className="text-slate-400 font-normal">(valfritt men hjälper oss)</span>
              </label>
              <textarea
                value={jobbAnnons}
                onChange={(e) => setJobbAnnons(e.target.value)}
                placeholder="Klistra in jobbannonsen här, eller beskriv jobbet med egna ord..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all resize-y"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-slate-500">
                  {jobbAnnons.length} tecken
                </p>
                {cvMatchScore !== null && jobbAnnons.length > 50 && (
                  <p className={`text-xs font-medium ${
                    cvMatchScore >= 70 ? 'text-green-600' : 
                    cvMatchScore >= 40 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    Matchar ditt CV: {cvMatchScore}%
                  </p>
                )}
              </div>
            </div>

            {/* Why this job */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vad lockar dig med detta jobb? <span className="text-slate-400 font-normal">(valfritt)</span>
              </label>
              <textarea
                value={motivering}
                onChange={(e) => setMotivering(e.target.value)}
                placeholder="Beskriv kort vad som fick dig att vilja söka - det behöver inte vara stort, ärlighet är bäst..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all resize-y"
              />
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ton i brevet
              </label>
              <div className="flex flex-wrap gap-3">
                {(['professionell', 'entusiastisk', 'formell'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTon(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ton === t
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'professionell' && 'Professionell'}
                    {t === 'entusiastisk' && 'Entusiastisk'}
                    {t === 'formell' && 'Formell'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* CV Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection('cv')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-slate-800">Din information från CV</h2>
          </div>
          <div className="flex items-center gap-2">
            {cvLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {expandedSections.cv ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
        
        {expandedSections.cv && (
          <div className="p-4 pt-0">
            {!cvData ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">Ingen information hittades från ditt CV</p>
                <Button onClick={loadCVData} variant="outline">
                  Ladda CV-information
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Personal Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personlig information
                  </h3>
                  <p className="text-slate-700">
                    {cvData.firstName} {cvData.lastName}
                    {cvData.title && ` • ${cvData.title}`}
                  </p>
                </div>

                {/* CV Match visualization */}
                {cvMatchScore !== null && jobbAnnons.length > 50 && (
                  <div className={`rounded-lg p-4 ${
                    cvMatchScore >= 70 ? 'bg-green-50 border border-green-200' : 
                    cvMatchScore >= 40 ? 'bg-amber-50 border border-amber-200' : 
                    'bg-slate-50 border border-slate-200'
                  }`}>
                    <h3 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Hur väl matchar ditt CV?
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            cvMatchScore >= 70 ? 'bg-green-500' : 
                            cvMatchScore >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${cvMatchScore}%` }}
                        />
                      </div>
                      <span className={`font-bold ${
                        cvMatchScore >= 70 ? 'text-green-600' : 
                        cvMatchScore >= 40 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {cvMatchScore}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      {cvMatchScore >= 70 
                        ? 'Bra matchning! Dina erfarenheter passar väl för detta jobb.'
                        : cvMatchScore >= 40
                        ? 'Det finns viss matchning. Vi hjälper dig lyfta dina styrkor.'
                        : 'Fokusera på dina överförbara färdigheter. All erfarenhet räknas!'}
                    </p>
                  </div>
                )}

                {/* Summary */}
                {cvData.summary && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-2">Sammanfattning</h3>
                    <p className="text-slate-700 text-sm line-clamp-4">{cvData.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {cvData.workExperience && cvData.workExperience.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-2">Erfarenhet vi kan lyfta</h3>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {cvData.workExperience.slice(0, 3).map((exp, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-teal-500" />
                          {exp.title} på {exp.company}
                        </li>
                      ))}
                      {cvData.workExperience.length > 3 && (
                        <li className="text-slate-500 text-sm">
                          +{cvData.workExperience.length - 3} fler erfarenheter...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Skills */}
                {cvData.skills && cvData.skills.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-800 mb-2">Kompetenser</h3>
                    <div className="flex flex-wrap gap-2">
                      {cvData.skills.slice(0, 8).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {cvData.skills.length > 8 && (
                        <span className="text-slate-500 text-xs">
                          +{cvData.skills.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-8 py-3 text-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Skapar ditt brev...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Få hjälp att formulera brevet
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-center">
          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
          <p>{error}</p>
          <p className="text-sm mt-2 text-amber-600">
            Det är också bra att skriva själv - dina ord är värdefulla.
          </p>
        </div>
      )}

      {/* Result Section */}
      {generatedBrev && (
        <Card className="overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50/30 to-emerald-50/30">
          <button
            onClick={() => toggleSection('result')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-teal-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <h2 className="font-semibold text-slate-800">Ditt personliga brev</h2>
            </div>
            {expandedSections.result ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSections.result && (
            <div className="p-4 pt-0 space-y-4">
              {/* Tips */}
              <div className="bg-white/70 rounded-lg p-3 text-sm text-slate-600 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>
                  Detta är ett förslag baserat på din information. 
                  Det är okej att ändra, lägga till eller ta bort - 
                  det viktigaste är att det känns som du!
                </p>
              </div>

              {/* Generated Letter */}
              <div className="bg-white rounded-lg p-6 whitespace-pre-wrap text-slate-800 leading-relaxed shadow-sm font-serif">
                {generatedBrev}
              </div>

              {/* Save Title Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vad ska vi kalla detta brev?
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="t.ex. Acme AB - Projektledare"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Sparat!' : 'Spara brevet'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopierat!' : 'Kopiera'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownloadTXT}
                  className="flex items-center gap-2"
                  title="Ladda ner som textfil"
                >
                  <Download className="w-4 h-4" />
                  TXT
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownloadWord}
                  className="flex items-center gap-2"
                  title="Ladda ner som Word-dokument"
                >
                  <FileText className="w-4 h-4" />
                  Word
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2"
                  title="Öppna för utskrift/PDF"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nytt förslag
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleReset}
          className="text-slate-500 hover:text-slate-700 text-sm transition-colors flex items-center gap-2"
        >
          Rensa och börja om
        </button>
      </div>
    </div>
  )
}
