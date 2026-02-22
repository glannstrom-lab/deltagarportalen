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
  Zap,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Heart,
  Pause,
  AlertCircle,
  Check,
  ArrowRight,
  Lightbulb,
  User,
  Building2,
  Target,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { aiService } from '@/services/aiService'
import { cvApi, coverLetterApi } from '@/services/api'
import { searchPlatsbanken, type PlatsbankenJob } from '@/services/arbetsformedlingenApi'
import { useAutoSave } from '@/hooks/useAutoSave'
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator'
import { EnergyBadge, type EnergyClassification } from '@/components/gamification/EnergyFilter'
import { SupportiveLanguage } from '@/components/SupportiveLanguage'

// Energinivå-typ
export type EnergyLevel = 1 | 2 | 3 | 4 | 5

interface SavedCoverLetter {
  id: string
  title: string
  jobbAnnons: string
  brev: string
  createdAt: string
  updatedAt: string
  company?: string
  jobTitle?: string
  energyLevel?: EnergyLevel
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
  energyLevel: EnergyClassification
}

const templates: Template[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Bra för de flesta situationer',
    promptAddition: '',
    icon: <FileText className="w-4 h-4" />,
    energyLevel: 'medium'
  },
  {
    id: 'tillbaka',
    label: 'Tillbaka efter paus',
    description: 'Efter sjukskrivning, föräldraledighet eller annan paus',
    promptAddition: 'Användaren har varit borta från arbetsmarknaden och är nu redo att komma tillbaka. Fokusera på motivation och framåtblick, inte ursäkter.',
    icon: <Heart className="w-4 h-4" />,
    energyLevel: 'low'
  },
  {
    id: 'karriarbyte',
    label: 'Byter karriärväg',
    description: 'När du söker jobb i en ny bransch',
    promptAddition: 'Användaren byter karriärväg. Fokusera på överförbara färdigheter och motivation för den nya branschen.',
    icon: <ArrowRight className="w-4 h-4" />,
    energyLevel: 'medium'
  },
  {
    id: 'nyexaminerad',
    label: 'Nyexaminerad',
    description: 'När du saknar arbetslivserfarenhet',
    promptAddition: 'Användaren är nyexaminerad. Fokusera på utbildning, praktik, och potential snarare än erfarenhet.',
    icon: <Award className="w-4 h-4" />,
    energyLevel: 'medium'
  },
  {
    id: 'kort',
    label: 'Kort & konkret',
    description: 'När du har ont om tid eller energi',
    promptAddition: 'Håll brevet kort och konkret. Max 2-3 korta stycken. Fokusera på det viktigaste.',
    icon: <Zap className="w-4 h-4" />,
    energyLevel: 'low'
  }
]

const energyOptions = [
  {
    level: 1 as EnergyLevel,
    emoji: '😴',
    label: 'Väldigt låg',
    description: 'Jag behöver hålla det enkelt idag',
    icon: BatteryLow,
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    message: 'Vi föreslår mallen "Kort & konkret" för att spara energi.'
  },
  {
    level: 2 as EnergyLevel,
    emoji: '😌',
    label: 'Låg',
    description: 'Jag kan göra det viktigaste',
    icon: Battery,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    message: 'Ta det i din takt. Ett steg i taget.'
  },
  {
    level: 3 as EnergyLevel,
    emoji: '😐',
    label: 'Medel',
    description: 'Jag har normal energi',
    icon: BatteryMedium,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    message: 'Bra! Du kan välja vilken mall som passar bäst.'
  },
  {
    level: 4 as EnergyLevel,
    emoji: '🙂',
    label: 'God',
    description: 'Jag känner mig redo',
    icon: BatteryFull,
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    message: 'Perfekt! Du har energi att skräddarsy ditt brev.'
  },
  {
    level: 5 as EnergyLevel,
    emoji: '💪',
    label: 'Hög',
    description: 'Jag är full av energi!',
    icon: BatteryFull,
    color: 'bg-green-50 border-green-200 text-green-700',
    message: 'Underbart! Passa på att skapa något riktigt bra.'
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
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null)
  
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
  
  // === SECTIONS EXPANSION ===
  const [expandedSections, setExpandedSections] = useState({
    energy: true,
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
    saveTitle,
    energyLevel
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
      setEnergyLevel(saved.energyLevel || null)
    }
  })

  // === LOAD DATA ===
  useEffect(() => {
    loadCVData()
    loadSavedLetters()
    loadSavedJobs()
    
    // Check for saved energy level from dashboard
    const savedEnergy = localStorage.getItem('lastEnergyLevel')
    if (savedEnergy) {
      setEnergyLevel(parseInt(savedEnergy) as EnergyLevel)
    }
  }, [])

  const loadCVData = async () => {
    setCvLoading(true)
    try {
      const cv = await cvApi.getCV()
      setCvData({
        firstName: cv.firstName || cv.user?.firstName,
        lastName: cv.lastName || cv.user?.lastName,
        title: cv.title,
        summary: cv.summary,
        workExperience: cv.workExperience || [],
        skills: cv.skills || []
      })
    } catch (err) {
      console.error('Kunde inte ladda CV:', err)
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
        jobTitle: l.jobTitle,
        energyLevel: l.energyLevel
      })))
    } catch (e) {
      console.error('Kunde inte ladda sparade brev:', e)
    }
  }

  const loadSavedJobs = async () => {
    // Hämta från localStorage först
    const saved = localStorage.getItem('savedJobs')
    if (saved) {
      try {
        setSavedJobs(JSON.parse(saved))
      } catch (e) {
        console.error('Kunde inte ladda sparade jobb:', e)
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

  // === GENERATE ===
  const handleGenerate = async () => {
    if (!jobbAnnons.trim()) {
      setError('Du kan välja att ange en jobbannons för att få ett mer anpassat brev')
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

      const response = await aiService.generateCoverLetter({
        jobbAnnons,
        erfarenhet: erfarenhet || cvData?.summary || tidigareBrev,
        motivering: motivering || undefined,
        namn: cvData ? `${cvData.firstName} ${cvData.lastName}` : undefined,
        ton,
        extraContext: template?.promptAddition
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
      setError('Det gick inte att skapa brevet just nu. Vi försökte, men något gick fel. Du kan prova igen eller skriva själv - det är också bra!')
      console.error('AI error:', err)
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
        jobTitle: jobTitle || undefined,
        energyLevel: energyLevel || undefined
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
    setEnergyLevel(letter.energyLevel || null)
    setExpandedSections({ energy: false, template: false, input: true, cv: false, result: true })
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

  const handleDownload = () => {
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
          Dina erfarenheter + vår hjälp med formuleringar = ett brev som känns som du. 
          Det är okej att inte vara 100% entusiastisk - ärlighet är bäst.
        </p>
        
        {/* Auto-save indicator */}
        <div className="flex justify-center pt-2">
          <AutoSaveIndicator 
            status={isAutoSaving ? 'saving' : lastSaved ? 'saved' : 'unsaved'}
            lastSaved={lastSaved}
            energyLevel={energyLevel || undefined}
            compact
          />
        </div>
      </div>

      {/* Supportive message */}
      {energyLevel && energyLevel <= 2 && (
        <SupportiveLanguage 
          type="encouragement" 
          emotionalState="tired"
          className="max-w-2xl mx-auto"
        />
      )}

      {/* Energy Level Selection */}
      <Card className="overflow-hidden border-teal-100">
        <button
          onClick={() => toggleSection('energy')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-teal-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Battery className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Hur är din energi idag?</h2>
              <p className="text-sm text-slate-500">
                {energyLevel 
                  ? `${energyOptions.find(e => e.level === energyLevel)?.label} - vi anpassar efter det`
                  : 'Välj så anpassar vi hjälpen efter dig'
                }
              </p>
            </div>
          </div>
          {expandedSections.energy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {expandedSections.energy && (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {energyOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.level}
                    onClick={() => {
                      setEnergyLevel(option.level)
                      // Auto-välj lämplig mall vid låg energi
                      if (option.level <= 2 && selectedTemplate === 'standard') {
                        setSelectedTemplate('kort')
                      }
                    }}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      energyLevel === option.level
                        ? option.color + ' ring-2 ring-offset-2 ring-teal-500'
                        : 'bg-white border-slate-200 hover:border-teal-200'
                    }`}
                  >
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <Icon className={`w-5 h-5 mb-2 ${energyLevel === option.level ? 'text-current' : 'text-slate-400'}`} />
                    <span className="font-medium text-sm text-center">{option.label}</span>
                    <span className="text-xs text-center mt-1 opacity-75">{option.description}</span>
                  </button>
                )
              })}
            </div>
            
            {energyLevel && (
              <div className="mt-4 p-3 bg-teal-50 rounded-lg text-sm text-teal-800">
                <span className="font-medium">💡 Tips:</span>{' '}
                {energyOptions.find(e => e.level === energyLevel)?.message}
              </div>
            )}
          </div>
        )}
      </Card>

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
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{template.label}</span>
                      <EnergyBadge classification={template.energyLevel} size="sm" />
                    </div>
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
                  <a href="#/jobs" className="text-sm text-teal-600 hover:underline">
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
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Ladda ner
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
