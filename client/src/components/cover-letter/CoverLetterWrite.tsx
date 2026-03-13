/**
 * Cover Letter Write Tab
 * 5-stegs wizard för att skriva personligt brev med AI-hjälp
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Building2, 
  Briefcase, 
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  Save,
  Loader2,
  Edit3,
  Lightbulb,
  Target,
  Award
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { coverLetterTemplates, getTemplateById } from '@/data/coverLetterTemplates'
import { cn } from '@/lib/utils'

// Mock AI-tjänst - ska ersättas med riktig implementation
const mockGenerateLetter = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  return {
    content: `Hej,

Jag söker med stort intresse rollen som ${data.jobTitle} hos ${data.company}. Med min bakgrund inom ${data.background || 'relevanta områden'} och passion för ${data.motivation || 'att utvecklas'}, tror jag att jag skulle passa väl in i ert team.

Under min tidigare erfarenhet har jag utvecklat starka färdigheter inom ${data.skills || 'relevanta kompetenser'}. Jag är särskilt stolt över ${data.achievement || 'mitt arbete med att leverera resultat'}, vilket visar min förmåga att ${data.capability || 'ta ansvar och driva projekt framåt'}.

Det som lockar mig särskilt med ${data.company} är ${data.companyAppeal || 'era värderingar och vision'}. Jag ser fram emot möjligheten att bidra med min erfarenhet och samtidigt växa tillsammans med er organisation.

Jag ser fram emot att få diskutera hur jag kan bidra till ert team. Jag nås på ${data.contact || '[din kontaktinfo]'} och finns tillgänglig för intervju med kort varsel.

Med vänliga hälsningar,
[Ditt namn]`,
    suggestions: [
      'Nämn ett specifikt projekt du beundrar hos företaget',
      'Lägg till ett konkret resultat från din erfarenhet',
      'Förklara varför just denna roll passar dig perfekt just nu'
    ],
    keywords: ['kundservice', 'teamwork', 'resultatorienterad', 'kommunikation']
  }
}

export function CoverLetterWrite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editId = searchParams.get('edit')
  const templateId = searchParams.get('template')

  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLetter, setGeneratedLetter] = useState<string>('')
  const [editedLetter, setEditedLetter] = useState<string>('')

  // Form data
  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    jobAd: '',
    motivation: '',
    selectedTemplate: templateId || 'standard',
    tone: 'professional' as 'professional' | 'enthusiastic' | 'formal',
    background: '',
    skills: '',
    achievement: '',
  })

  // Ladda jobbdata från query params (när man kommer från jobbsidan)
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const company = searchParams.get('company')
    const title = searchParams.get('title')
    const desc = searchParams.get('desc')

    if (jobId || company || title) {
      setFormData(prev => ({
        ...prev,
        company: company ? decodeURIComponent(company) : prev.company,
        jobTitle: title ? decodeURIComponent(title) : prev.jobTitle,
        jobAd: desc ? decodeURIComponent(desc) : prev.jobAd,
      }))
    }
  }, [searchParams])

  useEffect(() => {
    if (editId) {
      // TODO: Ladda befintligt brev
      console.log('Laddar brev:', editId)
    }
  }, [editId])

  const steps = [
    { id: 1, title: 'Jobbinformation', icon: Building2 },
    { id: 2, title: 'Välj mall', icon: FileText },
    { id: 3, title: 'Din information', icon: Target },
    { id: 4, title: 'Skriv & Redigera', icon: Edit3 },
    { id: 5, title: 'Klart!', icon: Check },
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      if (currentStep === 3) {
        generateLetter()
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateLetter = async () => {
    setIsGenerating(true)
    try {
      const result = await mockGenerateLetter(formData)
      setGeneratedLetter(result.content)
      setEditedLetter(result.content)
    } catch (error) {
      console.error('Fel vid generering:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    // TODO: Spara brev
    console.log('Sparar brev:', editedLetter)
    navigate('/cover-letter/my-letters')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.company && formData.jobTitle
      case 2:
        return formData.selectedTemplate
      case 3:
        return true
      case 4:
        return editedLetter.length > 50
      default:
        return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep

            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'flex flex-col items-center',
                  index < steps.length - 1 && 'flex-1'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-indigo-600 text-white',
                    isCompleted && 'bg-emerald-500 text-white',
                    !isActive && !isCompleted && 'bg-slate-100 text-slate-400'
                  )}>
                    {isCompleted ? (
                      <Check size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span className={cn(
                    'text-xs mt-2 font-medium',
                    isActive && 'text-indigo-600',
                    isCompleted && 'text-emerald-600',
                    !isActive && !isCompleted && 'text-slate-400'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-full h-0.5 mx-2',
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <Step1JobInfo 
            formData={formData} 
            setFormData={setFormData} 
          />
        )}
        {currentStep === 2 && (
          <Step2Template 
            formData={formData} 
            setFormData={setFormData} 
          />
        )}
        {currentStep === 3 && (
          <Step3YourInfo 
            formData={formData} 
            setFormData={setFormData} 
          />
        )}
        {currentStep === 4 && (
          <Step4Write 
            formData={formData}
            generatedLetter={generatedLetter}
            editedLetter={editedLetter}
            setEditedLetter={setEditedLetter}
            isGenerating={isGenerating}
          />
        )}
        {currentStep === 5 && (
          <Step5Done 
            editedLetter={editedLetter}
            onSave={handleSave}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft size={18} />
          Tillbaka
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Skapar brev...
              </>
            ) : (
              <>
                Nästa steg
                <ChevronRight size={18} />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Save size={18} />
            Spara brev
          </Button>
        )}
      </div>
    </div>
  )
}

// Steg 1: Jobbinformation
function Step1JobInfo({ 
  formData, 
  setFormData 
}: { 
  formData: any
  setFormData: (data: any) => void 
}) {
  const [searchParams] = useSearchParams()
  const hasJobData = searchParams.get('jobId') || searchParams.get('company') || searchParams.get('title')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Berätta om jobbet du söker
        </h2>
        <p className="text-slate-600">
          Ju mer information du ger, desto bättre kan vi hjälpa dig att skräddarsy brevet.
        </p>
      </div>

      {/* Visa info om jobbdata har hämtats automatiskt */}
      {hasJobData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-800">Jobbdata hämtad automatiskt</h4>
              <p className="text-sm text-emerald-700 mt-1">
                Vi har fyllt i information från jobbannonsen. Kontrollera och justera vid behov.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Företag *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="t.ex. Acme AB"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Jobbtitel *
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="t.ex. Projektledare"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Jobbannons (valfritt men rekommenderat)
          </label>
          <textarea
            value={formData.jobAd}
            onChange={(e) => setFormData({ ...formData, jobAd: e.target.value })}
            placeholder="Klistra in texten från jobbannonsen här så analyserar vi den åt dig..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            💡 Ju mer av annonsen du klistrar in, desto bättre förslag kan vi ge.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Vad lockar dig med detta jobbet? (valfritt)
          </label>
          <textarea
            value={formData.motivation}
            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
            placeholder="t.ex. Jag vill jobba med hållbarhet..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}

// Steg 2: Välj mall
function Step2Template({ 
  formData, 
  setFormData 
}: { 
  formData: any
  setFormData: (data: any) => void 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Välj en mall som passar
        </h2>
        <p className="text-slate-600">
          Mallen hjälper dig att strukturera brevet på ett sätt som passar din situation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {coverLetterTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setFormData({ ...formData, selectedTemplate: template.id })}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              formData.selectedTemplate === template.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                formData.selectedTemplate === template.id
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-100 text-slate-500'
              )}>
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-800">{template.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                {formData.selectedTemplate === template.id && (
                  <div className="flex items-center gap-1 mt-2 text-indigo-600 text-sm">
                    <Check size={14} />
                    <span>Vald</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Steg 3: Din information
function Step3YourInfo({ 
  formData, 
  setFormData 
}: { 
  formData: any
  setFormData: (data: any) => void 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Berätta om dig själv
        </h2>
        <p className="text-slate-600">
          Detta hjälper oss att lyfta rätt erfarenheter i ditt brev.
        </p>
      </div>

      {/* Auto-hämtat från CV */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-800">Information hämtad från ditt CV</h4>
            <p className="text-sm text-emerald-700 mt-1">
              Vi har automatiskt hämtat dina nyckelkompetenser och erfarenheter. 
              Du kan lägga till mer information nedan för att göra brevet ännu mer personligt.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Din bakgrund (valfritt)
          </label>
          <input
            type="text"
            value={formData.background}
            onChange={(e) => setFormData({ ...formData, background: e.target.value })}
            placeholder="t.ex. 5 års erfarenhet inom kundservice"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nyckelkompetenser (valfritt)
          </label>
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            placeholder="t.ex. projektledning, kommunikation, problemlösning"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            En prestation du är stolt över (valfritt)
          </label>
          <textarea
            value={formData.achievement}
            onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
            placeholder="t.ex. Jag ökade kundnöjdheten med 25% genom att..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Välj tonläge
          </label>
          <div className="flex gap-3">
            {[
              { id: 'professional', label: 'Professionell', desc: 'Balanserad och trygg' },
              { id: 'enthusiastic', label: 'Entusiastisk', desc: 'Energisk och passionerad' },
              { id: 'formal', label: 'Formell', desc: 'Traditionell och respektfull' },
            ].map((tone) => (
              <button
                key={tone.id}
                onClick={() => setFormData({ ...formData, tone: tone.id })}
                className={cn(
                  'flex-1 p-3 rounded-lg border-2 text-left transition-all',
                  formData.tone === tone.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-200'
                )}
              >
                <div className="font-medium text-slate-800">{tone.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{tone.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Steg 4: Skriv & Redigera
function Step4Write({
  formData,
  generatedLetter,
  editedLetter,
  setEditedLetter,
  isGenerating,
}: {
  formData: any
  generatedLetter: string
  editedLetter: string
  setEditedLetter: (text: string) => void
  isGenerating: boolean
}) {
  const [showTips, setShowTips] = useState(true)

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Vi skapar ditt personliga brev...
        </h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Vi analyserar jobbannonsen och formulerar förslag som lyfter dina styrkor.
          Detta tar bara några sekunder.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Gör det till ditt eget
        </h2>
        <p className="text-slate-600">
          Här är ett förslag baserat på informationen du gett. Läs igenom och justera 
          så det känns personligt och äkta.
        </p>
      </div>

      {showTips && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">Tips för att göra det personligt</h4>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Lägg till ett specifikt skäl till varför just detta företag lockar dig</li>
                <li>• Nämn något unikt från din erfarenhet som matchar jobbet</li>
                <li>• Anpassa tonen så det låter som dig</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowTips(false)}
              className="text-amber-400 hover:text-amber-600"
            >
              Dölj
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Ditt personliga brev</span>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{editedLetter.length} tecken</span>
            <span>•</span>
            <span>{editedLetter.split(/\s+/).length} ord</span>
          </div>
        </div>
        <textarea
          value={editedLetter}
          onChange={(e) => setEditedLetter(e.target.value)}
          className="w-full px-4 py-4 min-h-[300px] outline-none resize-none text-slate-700 leading-relaxed"
          placeholder="Ditt personliga brev visas här..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Copy size={16} />
          Kopiera
        </Button>
        <Button variant="outline" className="gap-2">
          <Download size={16} />
          Ladda ner
        </Button>
        <Button 
          variant="outline" 
          className="gap-2 ml-auto"
          onClick={() => setEditedLetter(generatedLetter)}
        >
          Återställ original
        </Button>
      </div>
    </div>
  )
}

// Steg 5: Klart!
function Step5Done({ 
  editedLetter, 
  onSave 
}: { 
  editedLetter: string
  onSave: () => void 
}) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-emerald-600" />
      </div>
      
      <h2 className="text-2xl font-semibold text-slate-800 mb-3">
        Bra jobbat! 🎉
      </h2>
      
      <p className="text-slate-600 max-w-md mx-auto mb-6">
        Du har skapat ett personligt brev som visar ditt värde. 
        Kom ihåg: Det är okej att gå tillbaka och justera om du vill.
      </p>

      {/* Preview */}
      <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 max-h-48 overflow-y-auto">
        <p className="text-sm text-slate-600 font-mono whitespace-pre-wrap">
          {editedLetter.slice(0, 300)}...
        </p>
      </div>

      {/* Nästa steg */}
      <div className="bg-indigo-50 rounded-xl p-4 max-w-md mx-auto mb-6">
        <h4 className="font-medium text-indigo-800 mb-2">Vad vill du göra nu?</h4>
        <ul className="text-sm text-indigo-700 space-y-2">
          <li className="flex items-center gap-2">
            <input type="checkbox" className="rounded text-indigo-600" />
            <span>Spara brevet för framtida ansökningar</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="rounded text-indigo-600" />
            <span>Registrera att du skickat en ansökan</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="rounded text-indigo-600" />
            <span>Sätt påminnelse för uppföljning</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" className="gap-2">
          <Copy size={16} />
          Kopiera text
        </Button>
        <Button onClick={onSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Save size={16} />
          Spara brev
        </Button>
      </div>

      <p className="text-sm text-slate-500 mt-6">
        💡 Tips: Spara brevet även om du inte skickar det direkt. 
        Du kan återanvända det för liknande jobb!
      </p>
    </div>
  )
}
