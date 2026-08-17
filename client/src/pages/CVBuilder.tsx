import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cvApi } from '@/services/supabaseApi'
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Eye, X, Check,
  Sparkles, Briefcase, GraduationCap, Award,
  Lightbulb, Loader2, AlertCircle, Folder, FileText
} from '@/components/ui/icons'
import { CVPreview } from '@/components/cv/CVPreview'
import { AIWritingAssistant } from '@/components/cv/AIWritingAssistant'
import { showToast } from '@/components/Toast'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { generateCVWord } from '@/services/cvWordExport'
// CVShare borttagen 2026-05-11 — route saknas i App.tsx + cv_shares-tabellen
// saknar cv_id-kolumn. Återställs när hela delningsflödet är komplett.
// import { CVShare } from '@/components/cv/CVShare'
import { CompactImageUpload } from '@/components/ImageUpload'
import { useVercelImageUpload } from '@/hooks/useVercelImageUpload'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
// Steg 4 (2026-08-17): rådgivaren bredvid förhandsvisningen, och ett
// kontextuellt råd inne i formuläret — inte en ring i hörnet.
import RadgivarPanel, { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { cvLogger } from '@/lib/logger'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { CVData, CVVersion } from '@/services/supabaseApi'

// NYA IMPORTS för förbättringar
import { useCVAutoSave } from '@/hooks/useCVAutoSave'
// SaveIndicator is now rendered in CVPage header
import { AIHelpButton } from '@/components/cv/AIHelpButton'
import { RichTextEditor } from '@/components/cv/RichTextEditor'
import { ExperienceEditor } from '@/components/cv/ExperienceEditor'
import { EducationEditor } from '@/components/cv/EducationEditor'
import { SkillsEditor } from '@/components/cv/SkillsEditor'
import { ContextualHelp } from '@/components/cv/ContextualHelp'
import { CVOnboarding, shouldShowOnboarding } from '@/components/cv/CVOnboarding'
import { ContextualKnowledgeWidget } from '@/components/workflow'
import { QuickCVMode } from '@/components/cv/QuickCVMode'
import { JobAdaptPanel } from '@/components/cv/JobAdaptPanel'

// ============================================
// STEG - med tidsuppskattningar för bättre UX
// ============================================
const STEPS = [
  { id: 1, title: 'Design', description: 'Mall och färger', minutes: 2 },
  { id: 2, title: 'Om dig', description: 'Kontaktuppgifter', minutes: 3 },
  { id: 3, title: 'Profil', description: 'Sammanfattning', minutes: 5 },
  { id: 4, title: 'Erfarenhet', description: 'Jobb & utbildning', minutes: 10 },
  { id: 5, title: 'Kompetenser', description: 'Skills & övrigt', minutes: 5 },
  { id: 6, title: 'Granska', description: 'Granska och spara', minutes: 2 },
] as const

// Language level constants (stored in DB, display via translation)
const LANGUAGE_LEVELS = [
  { value: 'basic', labelKey: 'cvBuilder.languageLevels.basic' },
  { value: 'good', labelKey: 'cvBuilder.languageLevels.good' },
  { value: 'fluent', labelKey: 'cvBuilder.languageLevels.fluent' },
  { value: 'native', labelKey: 'cvBuilder.languageLevels.native' },
] as const

// ============================================
// EXEMPELDATA (B24) — "Fyll i exempeldata"-knappen skrev tidigare över
// deltagarens RIKTIGA CV utan varning eller ångra, autosparat mot molnet
// på 800ms. Den texten hamnade sedan i ett skarpt AI-brev (B21).
//
// Nu: loadDemoData() fyller ENDAST fält som är helt tomma — redan ifyllt
// innehåll i `data` rörs aldrig. DEMO_CV_DATA/DEMO_FIELD_RESET/
// DEMO_FIELD_LABELS ligger på modulnivå så både loadDemoData, clearDemoData
// och useEffect:en som spårar bortredigerade demo-fält kan dela samma källa.
const DEMO_CV_DATA: Partial<CVData> = {
  firstName: 'Anna', lastName: 'Andersson', title: 'Projektledare',
  email: 'anna@example.com', phone: '070-123 45 67', location: 'Stockholm',
  summary: 'Erfaren projektledare med passion för att skapa effektiva team.',
  skills: [
    { id: 'demo-1', name: 'Projektledning', level: 5, category: 'technical' },
    { id: 'demo-2', name: 'Agila metoder', level: 4, category: 'technical' },
    { id: 'demo-3', name: 'Kommunikation', level: 5, category: 'soft' },
  ],
  workExperience: [
    { id: 'demo-1', company: 'Tech AB', title: 'Projektledare', location: 'Stockholm', startDate: '2021-01', endDate: '', current: true, description: 'Leder utvecklingsteam' },
  ],
  education: [
    { id: 'demo-1', school: 'Stockholms Universitet', degree: 'Kandidatexamen', field: 'Informatik', location: 'Stockholm', startDate: '2015-08', endDate: '2018-05', description: '' },
  ],
}

// Vad ett demo-fyllt fält återgår till om deltagaren klickar
// "Ta bort exempeldata" i varningsbanderollen.
const DEMO_FIELD_RESET: Partial<CVData> = {
  firstName: '', lastName: '', title: '', email: '', phone: '', location: '',
  summary: '', skills: [], workExperience: [], education: [],
}

// Svenska etiketter för banderollen som listar vilka fält som fortfarande
// är exempeldata (inte deltagarens egna uppgifter).
const DEMO_FIELD_LABELS: Record<string, string> = {
  firstName: 'Förnamn', lastName: 'Efternamn', title: 'Titel/yrkesroll',
  email: 'E-post', phone: 'Telefon', location: 'Ort', summary: 'Sammanfattning',
  skills: 'Kompetenser', workExperience: 'Arbetslivserfarenhet', education: 'Utbildning',
}

// Moderna CV-mallar 2025 — thumbnail-bilder genereras via
// `node e2e/cv-template-snapshots.cjs` och bor i client/public/templates/.
const TEMPLATES = [
  {
    id: 'sidebar',
    name: 'Sidokolumn',
    desc: 'Modern layout med mörk sidopanel för kontakt och kompetenser',
    image: '/templates/sidebar.png',
    features: ['Sidokolumn', 'Rundat foto', 'Kompetenser i sidopanel'],
  },
  {
    id: 'centered',
    name: 'Centrerad',
    desc: 'Klassisk navy-header med guld-accent och centrerad layout',
    image: '/templates/centered.png',
    features: ['Navy & guld', 'Centrerat namn', 'Tidlös'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Swiss-inspirerad design med stor typografi och mycket luft',
    image: '/templates/minimal.png',
    features: ['Stor typografi', 'Luftig', 'Fokus på innehåll'],
  },
  {
    id: 'creative',
    name: 'Kreativ',
    desc: 'Magenta-accent med kort-baserad två-kolumns layout',
    image: '/templates/creative.png',
    features: ['Magenta-accent', 'Kort-layout', 'Bold typografi'],
  },
  {
    id: 'executive',
    name: 'Executive',
    desc: 'Elegant serif med guld-accenter och drop cap',
    image: '/templates/executive.png',
    features: ['Serif typografi', 'Guld-accenter', 'Klassisk'],
  },
  {
    id: 'nordic',
    name: 'Nordisk',
    desc: 'Skandinavisk minimalism med ljus sidopanel',
    image: '/templates/nordic.png',
    features: ['Ljus sidopanel', 'Sky-accent', 'Clean'],
  },
  {
    id: 'budapest',
    name: 'Budapest',
    desc: 'Mörk sidopanel med cirkulärt foto och timeline-prickar',
    image: '/templates/budapest.png',
    features: ['Mörk sidopanel', 'Timeline', 'Cirkulärt foto'],
  },
  {
    id: 'rotterdam',
    name: 'Rotterdam',
    desc: 'Spacious design med stort efternamn och 2-kolumns body',
    image: '/templates/rotterdam.png',
    features: ['Stort efternamn', 'Spacious', '2-kolumns'],
  },
  {
    id: 'chicago',
    name: 'Chicago',
    desc: 'Klassisk centrerad header med tunn vertikal divider',
    image: '/templates/chicago.png',
    features: ['Centrerad header', 'Klassisk', 'Monogram'],
  },
  {
    id: 'atelier',
    name: 'Atelier',
    desc: 'Editorial premium på cream-bakgrund med Crimson Pro serif och teal-accent',
    image: '/templates/atelier.png',
    features: ['Cream bakgrund', 'Serif headline', 'Editorial'],
  },
  {
    id: 'manhattan',
    name: 'Manhattan',
    desc: 'Executive med mörk navy-sidebar, copper-accent och Playfair Display',
    image: '/templates/manhattan.png',
    features: ['Navy sidebar', 'Copper-accent', 'Executive'],
  },
  {
    id: 'berlin',
    name: 'Berlin',
    desc: 'Bauhaus-inspirerad editorial — cream/svart med rödorange accent och romersk numrering',
    image: '/templates/berlin.svg',
    features: ['Bauhaus', 'Editorial', 'Brutalist typografi'],
  },
]

// ============================================
// KOMPONENTER
// ============================================

function StepIndicator({ currentStep, totalSteps, onStepClick, completedSteps }: {
  currentStep: number
  totalSteps: number
  onStepClick: (step: number) => void
  completedSteps: number[]
}) {
  // Calculate time remaining
  const remainingMinutes = STEPS
    .filter((_, i) => !completedSteps.includes(i + 1) && i + 1 >= currentStep)
    .reduce((sum, step) => sum + step.minutes, 0)

  const progress = (completedSteps.length / totalSteps) * 100

  return (
    <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4 mb-6">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Steg {currentStep} av {totalSteps}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">•</span>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            ~{remainingMinutes} min kvar
          </span>
        </div>
        <span className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
          {Math.round(progress)}% klart
        </span>
      </div>

      {/* Visual progress bar */}
      <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[var(--c-solid)] transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step buttons */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isCompleted = completedSteps.includes(stepNum)
          const isPast = stepNum < currentStep

          return (
            <div key={stepNum} className="flex items-center flex-1">
              <button
                onClick={() => onStepClick(stepNum)}
                className={cn(
                  "flex flex-col items-center gap-1 group min-w-[44px] min-h-[44px] py-1",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] focus:ring-offset-2 rounded-lg"
                )}
                aria-label={`Gå till steg ${stepNum}: ${step.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  isActive
                    ? "bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white shadow-lg ring-4 ring-[var(--c-accent)]/40 dark:ring-[var(--c-bg)]/50"
                    : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 group-hover:bg-stone-200 dark:group-hover:bg-stone-600"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive ? "text-[var(--c-text)] dark:text-[var(--c-text)]" : isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-stone-600 dark:text-stone-400"
                )}>
                  {step.title}
                </span>
              </button>

              {/* Connector line */}
              {i < totalSteps - 1 && (
                <div className="flex-1 h-0.5 mx-1 bg-stone-200 dark:bg-stone-700 relative hidden sm:block">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isPast || isCompleted ? "bg-emerald-500 w-full" : "bg-stone-200 dark:bg-stone-700 w-0"
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Current step description - more prominent on mobile */}
      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700/50">
        <div className="sm:text-center">
          <p className="text-sm sm:text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              Steg {currentStep}: {STEPS[currentStep - 1]?.title}
            </span>
            <span className="hidden sm:inline"> – </span>
            <span className="block sm:inline text-stone-600 dark:text-stone-400 mt-0.5 sm:mt-0">
              {STEPS[currentStep - 1]?.description}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-4 sm:p-6", className)}>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label htmlFor="cvbuilder-f1" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{label}</label>
      <input
        id="cvbuilder-f1"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/20 dark:focus:ring-[var(--c-solid)]/30 focus:border-[var(--c-solid)]/60 dark:focus:border-[var(--c-solid)] text-base bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
      />
    </div>
  )
}

// ============================================
// HUVUDKOMPONENT
// ============================================
export default function CVBuilder() {
  const { t, i18n } = useTranslation()
  const [step, setStep] = useState(1)
  // Steg 4 (2026-08-17): förhandsvisning och rådgivare delar högerkolumn som
  // flikar — inte staplade. En tredje kolumn för rådgivaren hade gjort raden
  // obrukbar, och att stapla dem hade tryckt ner förhandsvisningen ur bild.
  const [hogerFlik, setHogerFlik] = useState<'forhandsvisning' | 'rad'>('forhandsvisning')
  const [showPreview, setShowPreview] = useState(false)
  const [versions, setVersions] = useState<CVVersion[]>([])
  const [showSaveVersion, setShowSaveVersion] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showQuickMode, setShowQuickMode] = useState(false)
  const [hasLoadedCV, setHasLoadedCV] = useState(false)
  // B24: vilka toppnivåfält som just nu innehåller oredigerad exempeldata
  // (fylldes av loadDemoData eftersom de var tomma). Styr varningsbanderollen.
  const [demoFields, setDemoFields] = useState<Set<string>>(new Set())

  const [data, setData] = useState<CVData>({
    firstName: '', lastName: '', title: '', email: '', phone: '', location: '',
    summary: '', skills: [], workExperience: [], education: [],
    languages: [], certificates: [], links: [], references: [],
    template: 'modern', colorScheme: 'indigo', font: 'inter', profileImage: null,
  })
  
  const { upload: uploadImage, isUploading: isImageUploading } = useVercelImageUpload()
  const { user } = useAuthStore()
  const { confirm } = useConfirmDialog()

  // NYA FEATURES: Auto-save (täcker ALLA fält, inte bara workExperience)
  // saveStatus/lastSavedAt visas via SaveIndicator i CVPage-headern (läser från cvStore).
  const { hasUnsavedChanges, triggerSave, hasRemoteChanges } = useCVAutoSave(data)
  const prevDataRef = useRef<string>('')
  const triggerSaveRef = useRef(triggerSave)
  triggerSaveRef.current = triggerSave

  // Auto-save vid varje data-ändring (alla fält). JSON-snapshot förhindrar
  // dubbla anrop när effekten kör utan att innehållet faktiskt ändrats
  // (t.ex. setData med samma värden från en input-blur). Första snapshoten
  // efter laddning sparas utan att trigga save så vi inte sparar direkt
  // efter att server-data populerats.
  useEffect(() => {
    if (!hasLoadedCV) return
    let snapshot: string
    try {
      snapshot = JSON.stringify(data)
    } catch {
      return
    }
    if (prevDataRef.current === snapshot) return
    const isFirstSnapshot = prevDataRef.current === ''
    prevDataRef.current = snapshot
    if (isFirstSnapshot) return
    cvLogger.debug('CVBuilder: data changed, triggering auto-save')
    triggerSaveRef.current(data)
  }, [data, hasLoadedCV])

  // B24: håller varningsbanderollen ärlig. Så fort ett fält som fylldes med
  // exempeldata redigeras bort från sitt exempelvärde plockas det bort ur
  // demoFields — annars skulle banderollen fortsätta hävda att t.ex.
  // förnamnet är "exempeldata" efter att deltagaren skrivit sitt eget namn.
  // demoFields är avsiktligt inte med i deps (bara `data` triggar) för att
  // undvika en loop: setDemoFields nedan returnerar samma referens (`prev`)
  // när inget ändrats, så effekten är trygg utan den.
  useEffect(() => {
    if (demoFields.size === 0) return
    setDemoFields(prev => {
      if (prev.size === 0) return prev
      let changed = false
      const next = new Set(prev)
      prev.forEach(key => {
        const demoVal = DEMO_CV_DATA[key as keyof CVData]
        const curVal = data[key as keyof CVData]
        if (JSON.stringify(curVal) !== JSON.stringify(demoVal)) {
          next.delete(key)
          changed = true
        }
      })
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- demoFields avsiktligt utelämnad, se kommentar ovan
  }, [data])

  // Fråga om att återställa draft vid mount - efter att server data laddats
  useEffect(() => {
    // Visa onboarding om användaren inte sett den tidigare
    if (!shouldShowOnboarding()) return

    // Timern MÅSTE rensas vid unmount (2026-07-27): utan cleanup levde den
    // vidare efter att komponenten lämnats och anropade setState på en
    // avmonterad komponent. I testsviten gav det en ohanterad
    // "ReferenceError: window is not defined" efter teardown, vilket ibland —
    // men inte alltid — fällde hela körningen. En grind som failar slumpvis
    // är värre än ingen grind, och i webbläsaren var det en läckt timer.
    const timer = setTimeout(() => setShowOnboarding(true), 500)
    return () => clearTimeout(timer)
  }, [])
  
  // Rensa gammal draft vid mount för att undvika konflikter. Säkerställ
  // också att eventuell PII-läcka från äldre versioner (full CV i localStorage)
  // rensas — sedan 2026-05-09 lagras drafts i sessionStorage istället.
  useEffect(() => {
    try { sessionStorage.removeItem('cv-draft') } catch { /* ignore */ }
    try { localStorage.removeItem('cv-draft') } catch { /* ignore */ }
    try { localStorage.removeItem('cv-last-saved') } catch { /* ignore */ }
  }, []) // Kör bara en gång vid mount

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Räkna bara entries som ifyllda om de har minst titel/företag (jobb)
  // eller examen/skola (utbildning) — annars markerar vi steg 4 som klart
  // även för halvtomma kort som ger "• -" i PDF.
  const hasValidExperience = data.workExperience.some(
    e => (e?.title?.trim() || e?.company?.trim()),
  )
  const hasValidEducation = data.education.some(
    e => (e?.degree?.trim() || e?.school?.trim()),
  )
  const hasValidSkills = data.skills.some(s => {
    const name = typeof s === 'string' ? s : s?.name
    return !!name?.trim()
  })

  const completedSteps = [
    1,
    !!(data.firstName && data.lastName) && 2,
    !!data.summary && 3,
    (hasValidExperience || hasValidEducation) && 4,
    hasValidSkills && 5,
  ].filter(Boolean) as number[]

  // eslint-disable-next-line react-hooks/immutability, react-hooks/exhaustive-deps -- mount-bara, loadCV/loadVersions deklareras direkt under
  useEffect(() => { loadCV(); loadVersions() }, [])

  const loadCV = async () => {
    try {
      // Kolla först om vi ska redigera en specifik version (från Mina CV)
      const editVersion = localStorage.getItem('cv-edit-version')
      if (editVersion) {
        try {
          const { data: versionData } = JSON.parse(editVersion)
          setData(prev => ({ ...prev, ...versionData }))
          localStorage.removeItem('cv-edit-version')
          setHasLoadedCV(true)
          showToast.success(t('cvBuilder.messages.loadedCVVersion'))
          return
        } catch (e) {
          console.error('Fel vid laddning av version:', e)
        }
      }

      const cv = await cvApi.getCV()

      if (cv) {
        setData(prev => {
          const newData = { ...prev, ...cv }
          cvLogger.debug('CVBuilder: Setting data with workExperience:', newData.workExperience)
          return newData
        })
        // Viktigt: Markera att server-data är laddad så draft inte triggar.
        // cv-last-saved är bara ett timestamp (ingen PII).
        try { localStorage.setItem('cv-last-saved', Date.now().toString()) } catch { /* ignore */ }
        // Rensa eventuellt gammalt draft i sessionStorage. Nuvarande draft-
        // strategi är sessionStorage (per-flik, ingen cross-user-läcka).
        const draft = sessionStorage.getItem('cv-draft')
        if (draft) {
          try {
            const parsed = JSON.parse(draft)
            // Om draft är äldre än 5 minuter, rensa det
            if (Date.now() - (parsed._timestamp || 0) > 5 * 5 * 1000) {
              sessionStorage.removeItem('cv-draft')
            }
          } catch {
            // sessionStorage parse failure — ignore
          }
        }
        // Kolla om vi ska visa quick mode (ingen befintlig CV-data)
        const hasExistingData = !!(cv.firstName || cv.lastName || cv.title || cv.summary)
        setShowQuickMode(!hasExistingData)
      } else {
        // Ingen CV finns - visa quick mode
        setShowQuickMode(true)
      }
      setHasLoadedCV(true)
    } catch (e) {
      console.error(e)
      setHasLoadedCV(true)
      setShowQuickMode(true)
    }
  }

  const loadVersions = async () => {
    try {
      const v = await cvApi.getVersions()
      setVersions(v || [])
    } catch (e) { console.error(e) }
  }

  const saveVersion = async () => {
    if (!versionName.trim()) return
    try {
      await cvApi.saveVersion(versionName.trim(), data)
      await loadVersions()
      setVersionName('')
      setShowSaveVersion(false)
      showToast.success(t('cvBuilder.messages.versionSaved'))
    } catch { showToast.error(t('cvBuilder.messages.couldNotSaveVersion')) }
  }

  const restoreVersion = async (versionId: string) => {
    const confirmed = await confirm({
      title: t('cvBuilder.messages.restoreTitle', 'Återställ version'),
      message: t('cvBuilder.messages.replaceConfirm'),
      confirmText: t('cvBuilder.actions.restore'),
      cancelText: t('cvBuilder.actions.cancel'),
      variant: 'warning'
    })
    if (!confirmed) return
    try {
      const restored = await cvApi.restoreVersion(versionId)
      setData(prev => ({ ...prev, ...restored }))
      showToast.success(t('cvBuilder.messages.versionRestored'))
    } catch { showToast.error(t('cvBuilder.messages.couldNotRestore')) }
  }

  // Handler för QuickCVMode - fyll i data OCH spara som en riktig CV-version
  // (2026-07: Snabb-CV visade tidigare "Ditt CV är skapat!" utan att spara
  // något — "Dina CV" fortsatte visa 0 CV. Nu skapas en faktisk cv_versions-rad
  // direkt så toasten stämmer och CV:t syns i listan. Autosaven (useCVAutoSave)
  // fortsätter separat spara arbetskopian i `cvs`-tabellen som vanligt.)
  const handleQuickComplete = async (quickData: Partial<CVData>) => {
    const merged = { ...data, ...quickData }
    setData(merged)
    setShowQuickMode(false)
    setStep(2) // Gå till "Om dig" för att kunna redigera vidare

    try {
      const versionName = `${t('cv.quickMode.versionLabel', 'Snabb-CV')} – ${new Date().toLocaleDateString('sv-SE')}`
      await cvApi.saveVersion(versionName, merged)
      await loadVersions()
      showToast.success(t('cv.quickMode.success', 'Ditt CV är skapat! Du kan nu redigera och lägga till mer information.'))
    } catch (e) {
      console.error('Kunde inte spara snabb-CV som version:', e)
      // Ärlig ton: vi vet att sparningen misslyckades, så vi lovar inte att
      // CV:t redan finns sparat — bara att uppgifterna är ifyllda.
      showToast.error(t('cv.quickMode.saveFailedHint', 'Vi har fyllt i dina uppgifter men kunde inte spara ditt CV just nu. Fortsätt nedan och spara igen i Granska-steget.'))
    }
  }

  // Handler för JobAdaptPanel - lägg till skill
  const handleAddSkillFromJob = (skillName: string) => {
    const newSkill = {
      id: Date.now().toString(),
      name: skillName,
      level: 3,
      category: 'technical' as const
    }
    setData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), newSkill]
    }))
    showToast.success(t('cv.jobAdapt.skillAdded', 'Kompetens tillagd: {{skill}}', { skill: skillName }))
  }

  // Handler för JobAdaptPanel - uppdatera sammanfattning
  const handleUpdateSummaryFromJob = (summary: string) => {
    setData(prev => ({ ...prev, summary }))
    showToast.success(t('cv.jobAdapt.summaryUpdated', 'Sammanfattning uppdaterad'))
  }

  // B24 — se kommentaren vid DEMO_CV_DATA. Fyller ENDAST tomma fält och
  // sparar en säkerhetskopia av det befintliga CV:t innan något ändras.
  const loadDemoData = async () => {
    const confirmed = await confirm({
      title: t('cvBuilder.messages.demoDataTitle', 'Fyll i exempeldata'),
      message: t('cvBuilder.messages.fillDemoData'),
      confirmText: t('cvBuilder.actions.fill', 'Fyll i'),
      cancelText: t('cvBuilder.actions.cancel', 'Avbryt'),
      variant: 'info'
    })
    if (!confirmed) return

    const isEmptyValue = (v: unknown) =>
      v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

    // Bara fält som är helt tomma tas med i patchen — redan ifyllt innehåll
    // (t.ex. ett förnamn deltagaren redan skrivit) rörs aldrig.
    const filledKeys: (keyof CVData)[] = []
    const patch: Partial<CVData> = {}
    ;(Object.keys(DEMO_CV_DATA) as (keyof CVData)[]).forEach((key) => {
      if (isEmptyValue(data[key])) {
        patch[key] = DEMO_CV_DATA[key] as never
        filledKeys.push(key)
      }
    })

    if (filledKeys.length === 0) {
      // Alla fält som exempeldata skulle fyllt i är redan ifyllda — inget att göra.
      showToast.info(t('cvBuilder.messages.demoDataAlreadyFilled', 'Ditt CV är redan ifyllt — det finns inga tomma fält att fylla i med exempeldata.'))
      return
    }

    // Om deltagaren redan hade fyllt i NÅGOT (dvs. inte alla demo-fält var
    // tomma) sparar vi en säkerhetskopia av hela CV:t innan patchen läggs
    // på — det är den enda ångra-vägen för `cvs`-raden (autosaven skriver
    // över samma rad, ingen historik där). Rent tomma CV:n ger ingen
    // meningsfull säkerhetskopia, så vi hoppar över det fallet.
    const hadExistingContent = filledKeys.length < Object.keys(DEMO_CV_DATA).length
    if (hadExistingContent) {
      try {
        const backupName = `${t('cvBuilder.versions.beforeDemoData', 'Säkerhetskopia innan exempeldata')} – ${new Date().toLocaleString('sv-SE')}`
        await cvApi.saveVersion(backupName, data)
        await loadVersions()
      } catch (e) {
        console.error('Kunde inte spara säkerhetskopia innan exempeldata:', e)
        // Fortsätt ändå — deltagarens befintliga fält skrivs inte över av
        // patchen oavsett, så det värsta som händer är att det saknas en
        // extra återställningspunkt för just den här körningen.
      }
    }

    setData(prev => ({ ...prev, ...patch }))
    setDemoFields(prev => {
      const next = new Set(prev)
      filledKeys.forEach(k => next.add(k as string))
      return next
    })
    showToast.success(t('cvBuilder.messages.demoDataFilled', 'Exempeldata ifylld i de tomma fälten. Ersätt gärna med dina egna uppgifter innan du sparar eller skickar CV:t vidare.'))
  }

  // Tar bort exempeldata igen — bara de fält som listas i demoFields (dvs.
  // fortfarande har sitt oredigerade exempelvärde) återställs till tomt.
  const clearDemoData = () => {
    if (demoFields.size === 0) return
    setData(prev => {
      const next = { ...prev }
      // Nycklarna kommer ur demoFields (strängar) och värdena ur
      // DEMO_FIELD_RESET. TypeScript kan inte knyta ihop dem per nyckel i en
      // loop — `next[k] = RESET[k]` kollapsar till en omöjlig typ. Vi går
      // därför via Record här. Säkerheten ligger i `key in DEMO_FIELD_RESET`:
      // bara fält som finns i resetlistan skrivs, och de har rätt tomvärde
      // per konstruktion (samma objektlitteral som typas mot Partial<CVData>).
      const resetValues = DEMO_FIELD_RESET as Record<string, unknown>
      const target = next as unknown as Record<string, unknown>
      demoFields.forEach((key) => {
        if (key in resetValues) {
          target[key] = resetValues[key]
        }
      })
      return next
    })
    setDemoFields(new Set())
    showToast.success(t('cvBuilder.messages.demoDataCleared', 'Exempeldata borttagen.'))
  }

  // Funktionella set-anrop — undviker stale-closure när användaren skriver
  // snabbt eller flera onChange triggas samma render.
  const add = <T extends { id: string }>(_arr: T[], item: T, key: keyof CVData) => {
    setData(prev => ({ ...prev, [key]: [ ...((prev[key] as T[]) || []), item ] } as CVData))
  }
  const remove = <T extends { id: string }>(_arr: T[], id: string, key: keyof CVData) => {
    setData(prev => ({ ...prev, [key]: ((prev[key] as T[]) || []).filter(x => x.id !== id) } as CVData))
  }
  const update = <T extends { id: string }>(_arr: T[], id: string, key: keyof CVData, field: keyof T, val: T[keyof T]) => {
    setData(prev => ({ ...prev, [key]: ((prev[key] as T[]) || []).map(x => x.id === id ? { ...x, [field]: val } : x) } as CVData))
  }

  // STEG 1: DESIGN - Moderna mallar 2025
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-2">{t('cvBuilder.templates.chooseTemplate')}</h3>
        <p className="text-stone-700 dark:text-stone-300">{t('cvBuilder.templates.templateDescription')}</p>
      </div>

      {/* DESIGN.md §9 — på mobil horisontell snap-scroll-galleri istället
          för vertikal stack (löser 6356 px sidlängd från audit-rapporten).
          På sm+ är det vanlig grid. */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:mx-0 sm:gap-6 sm:pb-0 lg:grid-cols-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TEMPLATES.map((tpl) => {
          const selected = data.template === tpl.id
          return (
            <button
              key={tpl.id}
              onClick={() => {
                // Explicit save direkt vid mall-byte. Useeffect-baserad
                // auto-save har visat sig opålitlig för enstaka fältändringar
                // — så vi triggar save direkt här utan att vänta på debounce.
                setData(prev => {
                  const next = { ...prev, template: tpl.id }
                  triggerSaveRef.current?.(next)
                  return next
                })
              }}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 text-left transition-all",
                "flex-shrink-0 w-[82%] snap-center sm:w-auto sm:flex-shrink", // mobil: 82% bredd, snap; desktop: full
                selected
                  ? "border-[var(--c-solid)] ring-2 ring-[var(--c-solid)] ring-offset-2 dark:ring-offset-stone-900 shadow-lg"
                  : "border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-md"
              )}
            >
              {/* Riktig screenshot av mallen — toppen visas, hela CV-arket
                  scrollar inte i kortet. Genereras via cv-template-snapshots.cjs. */}
              <div className="relative bg-stone-50 dark:bg-stone-900 overflow-hidden border-b border-stone-200 dark:border-stone-700">
                {selected && (
                  <div className="absolute top-3 right-3 z-10 bg-[var(--c-solid)] text-white rounded-full p-1.5 shadow-lg">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <img
                  src={tpl.image}
                  alt={`Förhandsvisning av mallen ${tpl.name}`}
                  loading="lazy"
                  className="block w-full h-64 object-cover object-top"
                />
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-lg text-stone-800 dark:text-stone-200">{tpl.name}</h4>
                  {selected && <span className="text-xs bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-text)] px-2 py-0.5 rounded-full font-medium">{t('cvBuilder.templates.selected')}</span>}
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">{tpl.desc}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5">
                  {tpl.features.map((feature, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-md"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {data.template && (
        <div className="p-5 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
          <div className="flex items-start gap-3">
            <div className="bg-[var(--c-solid)] text-white rounded-full p-1 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-[var(--c-text)] dark:text-[var(--c-text)]">
                {TEMPLATES.find(tpl => tpl.id === data.template)?.name} {t('cvBuilder.templates.isSelected')}
              </p>
              <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)] mt-1">
                {t('cvBuilder.templates.selectedInfo')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // STEG 2: OM DIG
  const renderStep2 = () => (
    <div className="space-y-4">
      <Card className="relative">
        {/* Loading overlay for image upload */}
        {isImageUploading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 rounded-2xl flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--c-solid)]" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('cvBuilder.profileImage.uploading')}</span>
            </div>
          </div>
        )}
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4">{t('cvBuilder.profileImage.title')}</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
          {t('cvBuilder.profileImage.description')}
        </p>
        <CompactImageUpload
          value={data.profileImage}
          onChange={(url) => setData(prev => ({ ...prev, profileImage: url }))}
          onUpload={async (file) => {
            if (!user?.id) {
              showToast.error(t('cvBuilder.profileImage.mustBeLoggedIn'))
              return null
            }
            const result = await uploadImage(file)
            if (result.error) {
              showToast.error(t('cvBuilder.profileImage.uploadFailed') + result.error)
              return null
            }
            return result.url
          }}
        />
      </Card>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('cvBuilder.fields.firstName')} value={data.firstName} onChange={(v) => setData(prev => ({ ...prev, firstName: v }))} placeholder={t('cvBuilder.placeholders.firstName')} />
          <Input label={t('cvBuilder.fields.lastName')} value={data.lastName} onChange={(v) => setData(prev => ({ ...prev, lastName: v }))} placeholder={t('cvBuilder.placeholders.lastName')} />
        </div>
      </Card>
      <Card>
        <Input label={t('cvBuilder.fields.jobTitle')} value={data.title} onChange={(v) => setData(prev => ({ ...prev, title: v }))} placeholder={t('cvBuilder.placeholders.jobTitle')} />
      </Card>
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('cvBuilder.fields.email')} type="email" value={data.email} onChange={(v) => setData(prev => ({ ...prev, email: v }))} placeholder={t('cvBuilder.placeholders.email')} />
          <Input label={t('cvBuilder.fields.phone')} type="tel" value={data.phone} onChange={(v) => setData(prev => ({ ...prev, phone: v }))} placeholder={t('cvBuilder.placeholders.phone')} />
        </div>
      </Card>
      <Card>
        <Input label={t('cvBuilder.fields.location')} value={data.location} onChange={(v) => setData(prev => ({ ...prev, location: v }))} placeholder={t('cvBuilder.placeholders.location')} />
      </Card>
    </div>
  )

  // STEG 3: PROFIL
  const renderStep3 = () => (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">{t('cvBuilder.summary.title')}</h3>
        <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">{t('cvBuilder.summary.description')}</p>
        <RichTextEditor
          value={data.summary || ''}
          onChange={(v) => setData(prev => ({ ...prev, summary: v }))}
          placeholder={t('cvBuilder.summary.placeholder')}
          maxLength={1000}
          minHeight="150px"
          helpText={t('cvBuilder.summary.helpText')}
        />
        <div className="mt-4">
          <AIWritingAssistant content={data.summary} onChange={(v) => setData(prev => ({ ...prev, summary: v }))} type="summary" cvData={data} />
        </div>
      </Card>

      <ContextualHelp context="summary" data={data.summary} />

      <AIHelpButton field="summary" onFill={() => setData(prev => ({ ...prev, summary: t('cvBuilder.summary.aiTemplate') }))} />
    </div>
  )

  // STEG 4: ERFARENHET
  const renderStep4 = () => (
    <div className="space-y-6">
      <ContextualHelp context="experience" />

      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[var(--c-solid)]" />
          {t('cvBuilder.sections.workExperience')}
        </h3>
        <ExperienceEditor
          experiences={data.workExperience || []}
          onChange={(experiences) => setData(prev => ({ ...prev, workExperience: experiences }))}
        />
      </div>

      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[var(--c-solid)]" />
          {t('cvBuilder.sections.education')}
        </h3>
        <EducationEditor
          education={data.education || []}
          onChange={(education) => setData(prev => ({ ...prev, education }))}
        />
      </div>
    </div>
  )

  // STEG 5: KOMPETENSER
  const renderStep5 = () => (
    <div className="space-y-6">
      <ContextualHelp context="skills" />

      <div>
        <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--c-solid)]" />
          {t('cvBuilder.sections.skills')}
        </h3>
        <SkillsEditor
          skills={data.skills || []}
          onChange={(skills) => setData(prev => ({ ...prev, skills }))}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.sections.languages')}</h3>
          <button onClick={() => add(data.languages, { id: Date.now().toString(), language: '', level: 'good' }, 'languages')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] bg-[var(--c-solid)]/10 rounded-lg hover:bg-[var(--c-solid)]/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.languages.length > 0 && (
          <div className="space-y-2">
            {data.languages.map((lang) => {
              const langInputId = `lang-name-${lang.id}`
              const langName = lang.language || t('cvBuilder.sections.languages')
              return (
                <div key={lang.id} className="flex items-center gap-3">
                  <input
                    id={langInputId}
                    type="text"
                    value={lang.language}
                    onChange={(e) => update(data.languages, lang.id, 'languages', 'language', e.target.value)}
                    placeholder={t('cvBuilder.placeholders.language')}
                    className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    aria-label={t('cvBuilder.sections.languages')}
                  />
                  <select
                    value={lang.level}
                    onChange={(e) => update(data.languages, lang.id, 'languages', 'level', e.target.value)}
                    className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm w-32 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    aria-label={`${t('cvBuilder.fields.languageLevel')}: ${langName}`}
                    aria-labelledby={langInputId}
                  >
                    {LANGUAGE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {t(level.labelKey)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(data.languages, lang.id, 'languages')}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    aria-label={`${t('cvBuilder.actions.remove')}: ${langName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.sections.certificates')}</h3>
          <button onClick={() => add(data.certificates, { id: Date.now().toString(), name: '', issuer: '', date: '' }, 'certificates')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] bg-[var(--c-solid)]/10 rounded-lg hover:bg-[var(--c-solid)]/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.certificates.length > 0 && (
          <div className="space-y-2">
            {data.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3">
                <input type="text" id={`cv-cert-${cert.id}`} aria-label={t('cvBuilder.sections.certificates')} value={cert.name} onChange={(e) => update(data.certificates, cert.id, 'certificates', 'name', e.target.value)} placeholder={t('cvBuilder.sections.certificates')} className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                <button onClick={() => remove(data.certificates, cert.id, 'certificates')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.sections.links')}</h3>
          <button onClick={() => add(data.links, { id: Date.now().toString(), type: 'website', url: '', label: '' }, 'links')} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] bg-[var(--c-solid)]/10 rounded-lg hover:bg-[var(--c-solid)]/20"><Plus className="w-4 h-4" /> {t('cvBuilder.actions.add')}</button>
        </div>
        {data.links.length > 0 && (
          <div className="space-y-2">
            {data.links.map((link) => (
              <div key={link.id} className="flex items-center gap-3">
                <input type="text" id={`cv-link-label-${link.id}`} aria-label={t('cvBuilder.sections.links')} value={link.label} onChange={(e) => update(data.links, link.id, 'links', 'label', e.target.value)} placeholder={t('cvBuilder.sections.links')} className="w-1/3 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                <input type="url" id={`cv-link-url-${link.id}`} aria-label="Webbadress" value={link.url} onChange={(e) => update(data.links, link.id, 'links', 'url', e.target.value)} placeholder="https://..." className="flex-1 px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100" />
                <button onClick={() => remove(data.links, link.id, 'links')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  // STEG 6: GRANSKA OCH SPARA
  const renderStep6 = () => {
    const filledSections = [
      { label: 'Kontaktuppgifter', filled: !!(data.firstName && data.lastName) },
      { label: 'Profil-sammanfattning', filled: !!data.summary },
      { label: 'Arbetslivserfarenhet', filled: hasValidExperience },
      { label: 'Utbildning', filled: hasValidEducation },
      { label: 'Kompetenser', filled: hasValidSkills },
    ]
    const missingSections = filledSections.filter(s => !s.filled)

    return (
      <div className="space-y-6">
        <div className="text-center">
          <img
            src="/illustrations/success-cv.webp"
            alt=""
            aria-hidden="true"
            className="w-24 h-24 mx-auto mb-3 select-none"
          />
          <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            {t('cvBuilder.review.title', 'Granska och spara ditt CV')}
          </h3>
          <p className="text-stone-600 dark:text-stone-400">
            {t('cvBuilder.review.subtitle', 'Här är ditt CV. Allt sparas automatiskt — ladda ner när du är nöjd.')}
          </p>
        </div>

        {/* Checklista — vad är ifyllt */}
        <Card className="p-5 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]">
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
            {t('cvBuilder.review.checklistTitle', 'Innehåll i ditt CV')}
          </h4>
          <ul className="space-y-2">
            {filledSections.map(s => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                {s.filled ? (
                  <Check className="w-4 h-4 text-[var(--c-solid)] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <span className={s.filled ? 'text-stone-700 dark:text-stone-300' : 'text-amber-700 dark:text-amber-400'}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
          {missingSections.length > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/50">
              {t('cvBuilder.review.missingHint', 'Ofyllda sektioner är inte krav — du kan ladda ner ändå.')}
            </p>
          )}
        </Card>

        {/* A4 papperskänsla — exakt så som det blir i PDF */}
        <div className="bg-stone-100 dark:bg-stone-950/50 p-4 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('cvBuilder.review.a4Note', 'Förhandsgranskning i A4-format')}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              210 × 297 mm
            </span>
          </div>

          {/* A4-pappers-yta. max-width = 210mm (=794px @ 96dpi) men skalbart
              ned på mindre skärmar via max-w-full. Sidobrytning markerad med
              en streckad linje var 297mm för att visa var ny sida börjar. */}
          <div
            className="bg-white shadow-2xl mx-auto relative"
            style={{ maxWidth: '210mm', width: '100%' }}
          >
            {/* Sidbrytningsmarkör — visuell hint var nya sidan börjar.
                Användaren kan flytta innehåll om sektion bryts olämpligt. */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
              style={{ top: '297mm' }}
            >
              <div className="flex-1 border-t-2 border-dashed border-amber-400 opacity-60" />
              <span className="px-3 py-1 mx-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-bold rounded-full whitespace-nowrap">
                {t('cvBuilder.review.pageBreak', 'Sida 2 börjar här')}
              </span>
              <div className="flex-1 border-t-2 border-dashed border-amber-400 opacity-60" />
            </div>

            <CVPreview data={data} />
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 px-2 text-center">
            {t('cvBuilder.review.editHint', 'Om en sektion bryts olämpligt — gå tillbaka och redigera. Den streckade linjen visar exakt var sida 2 börjar.')}
          </p>
        </div>

        {/* Spara/exportera-actions */}
        <Card className="p-5">
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
            {t('cvBuilder.review.actionsTitle', 'Klar?')}
          </h4>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
            {t('cvBuilder.review.actionsDesc', 'Ditt CV är sparat i molnet. Ladda ner som PDF eller skapa en versionssäkring att gå tillbaka till.')}
          </p>
          <div className="flex flex-wrap gap-3">
            <PDFExportButton
              type="cv"
              data={data}
              variant="primary"
              size="md"
            />
            <button
              onClick={async () => {
                try {
                  await generateCVWord(data)
                  showToast.success(t('cvBuilder.review.wordSuccess', 'Word-fil nedladdad'))
                } catch (e) {
                  console.error(e)
                  showToast.error(t('cvBuilder.review.wordError', 'Kunde inte skapa Word-fil'))
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t('cvBuilder.review.exportWord', 'Ladda ner Word')}
            </button>
            <button
              onClick={() => setShowSaveVersion(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--c-solid)] text-[var(--c-text)] rounded-xl text-sm font-medium hover:bg-[var(--c-bg)] transition-colors"
            >
              <Folder className="w-4 h-4" />
              {t('cvBuilder.versions.saveCurrentVersion', 'Spara version')}
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    switch (step) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      default: return null
    }
  }


  // Visa laddningsindikator medan CV laddas
  if (!hasLoadedCV) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--c-text)]" />
          <span className="text-stone-600 dark:text-stone-400">{t('cvBuilder.loading', 'Laddar...')}</span>
        </div>
      </div>
    )
  }

  // Visa QuickCVMode om användaren inte har befintlig CV-data
  if (showQuickMode) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-200 mb-2">
            {t('cv.welcome.title', 'Välkommen till CV-byggaren')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            {t('cv.welcome.subtitle', 'Välj hur du vill börja')}
          </p>
        </div>

        <QuickCVMode
          onComplete={handleQuickComplete}
          onSwitchToFull={() => setShowQuickMode(false)}
          className="mb-6"
        />

        <div className="text-center">
          <button
            onClick={() => setShowQuickMode(false)}
            className="px-6 py-3 text-[var(--c-text)] dark:text-[var(--c-text)] font-medium hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30 rounded-xl transition-colors"
          >
            {t('cv.welcome.fullBuilder', 'Eller använd den fullständiga CV-byggaren')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="max-w-7xl mx-auto"
      /* UX16: plats för den fixerade knappraden PLUS mobilnavet under den.
         På desktop (lg) finns ingen rad och --bottom-nav-h är 0. */
      style={{ paddingBottom: 'calc(var(--bottom-nav-h, 0px) + 5rem)' }}
    >
      {/* Action buttons bar — auto-save sköter molnet, ingen manuell spara-knapp.
          CVShare borttaget 2026-05-11: route /cv/shared/:code saknas i App.tsx
          så delningslänkar gick ingenstans. Returneras när delningsflödet är
          komplett (cv_shares-tabellen behöver också cv_id-kolumn). */}
      <div className="flex items-center justify-end gap-2 flex-wrap mb-4">
        {/* F31 (2026-08-17): knappens enda text låg i `hidden sm:inline`, så
            under `sm` — mobil, alltså målgruppens vanligaste läge — hade den
            noll tillgängligt namn och lästes upp som "knapp". `aria-label`
            gäller på alla brytpunkter; ikonen döljs för uppläsning eftersom
            etiketten nu bär betydelsen. WCAG 4.1.2. */}
        <button
          onClick={loadDemoData}
          aria-label={t('cvBuilder.actions.exampleData')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('cvBuilder.actions.exampleData')}</span>
        </button>
        <PDFExportButton
          type="cv"
          data={data}
          variant="outline"
          size="sm"
          showPreview={false}
        />
      </div>

      {/* Cross-tab konflikt-varning. Visas när en annan flik sparat efter
          oss — då skulle våra ändringar skriva över deras vid nästa save.
          Klick på "Ladda om" hämtar in den nya versionen. */}
      {hasRemoteChanges && (
        <div
          role="alert"
          className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              CV:t uppdaterades i en annan flik
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
              Dina senaste ändringar här riskerar att skriva över den andra flikens ändringar.
              Ladda om för att se den senaste versionen.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg font-medium"
          >
            Ladda om
          </button>
        </div>
      )}

      {/* B24: exempeldata-banderoll. Håller det synligt tydligt att ett
          fält inte är deltagarens eget innehåll ännu — annars kan tomma
          fält som fylldes med exempeldata av misstag matas vidare till en
          AI-funktion (t.ex. personligt brev) som om de vore riktiga meriter,
          precis vad som hände i B21. Försvinner fält för fält när
          deltagaren redigerar bort exempelvärdet (se useEffect ovan), eller
          allt på en gång via "Ta bort exempeldata". */}
      {demoFields.size > 0 && (
        <div
          role="status"
          className="mb-4 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-3"
        >
          <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
              {t('cvBuilder.messages.demoDataBannerTitle', 'Exempeldata ifylld')}
            </p>
            <p className="text-sm text-sky-700 dark:text-sky-200 mt-1">
              {t(
                'cvBuilder.messages.demoDataBannerBody',
                'Det här är fortfarande exempeltext, inte dina egna uppgifter: {{fields}}. Ersätt det innan du sparar eller skickar CV:t vidare.',
                { fields: Array.from(demoFields).map(k => DEMO_FIELD_LABELS[k] || k).join(', ') }
              )}
            </p>
          </div>
          <button
            onClick={clearDemoData}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg font-medium flex-shrink-0"
          >
            {t('cvBuilder.actions.clearDemoData', 'Ta bort exempeldata')}
          </button>
        </div>
      )}

      {/* Steg-indikator */}
      {/* Stegindikatorn visar samma sak som innehållsskenan till vänster.
          Två navigationer för samma sex steg är en för mycket — skenan vinner
          på desktop eftersom den är kompakt och alltid synlig medan man
          skriver. På mobil finns ingen skena, så indikatorn är kvar där. */}
      <div className="lg:hidden">
        <StepIndicator currentStep={step} totalSteps={STEPS.length} onStepClick={setStep} completedSteps={completedSteps} />
      </div>

      {/* Mobile Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 dark:bg-stone-950/70 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 top-16 bg-stone-100 dark:bg-stone-900 rounded-t-3xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">{t('cvBuilder.actions.preview')}</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full"><X className="w-6 h-6 text-stone-700 dark:text-stone-300" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
              <CVPreview data={data} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content — single-column på alla steg.
          Steg 1-5: editor full-bredd + tools-sidebar till höger på desktop.
          Steg 6 (granska): single-column max-w-4xl, A4-preview inuti
          renderStep6 är den enda granskningsvyn. Tidigare hade vi
          DUBBLA CVPreview här (en i renderStep6:s A4-wrapper, en i höger-
          kolumn) — det såg dåligt ut och förvirrade användaren. */}
      <div className={cn(
        'grid grid-cols-1 gap-6',
        /* Steg 4: innehållsöversikt till vänster (CV B). Skenan visar HELA
           CV:t och vad som är klart — tidigare såg man en sjättedel åt
           gången och kunde aldrig överblicka vad som saknades. */
        step < STEPS.length && 'lg:grid-cols-[190px_1fr_320px]',
        step === STEPS.length && 'max-w-4xl mx-auto'
      )}>
        {/* Innehållsöversikt */}
        {step < STEPS.length && (
          <nav
            aria-label={t('cvBuilder.contentOverview', 'Innehåll i ditt CV')}
            className="hidden lg:block"
          >
            <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {t('cvBuilder.contentOverview', 'Innehåll i ditt CV')}
            </p>
            <ul className="m-0 p-0 list-none space-y-0.5">
              {STEPS.map((st) => {
                const klar = completedSteps.includes(st.id)
                const aktiv = step === st.id
                return (
                  <li key={st.id}>
                    <button
                      type="button"
                      onClick={() => setStep(st.id)}
                      aria-current={aktiv ? 'step' : undefined}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[13px]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]',
                        aktiv
                          ? 'bg-white dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100 shadow-sm'
                          : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          klar ? 'bg-[var(--c-solid)]' : 'bg-stone-300 dark:bg-stone-600'
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{st.title}</span>
                      <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 shrink-0">
                        {klar ? '✓' : `${st.minutes}m`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {/* Left: Editor */}
        <div className="min-w-0">
          <div className="min-h-[400px]">
            {renderContent()}
            {/* Ett råd, där arbetet sker */}
            <RadgivarTips pathname="/cv" index={step - 1} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between mt-6 gap-3 flex-wrap">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 font-medium">
              <ChevronLeft className="w-5 h-5" />
              {t('cvBuilder.actions.previous')}
            </button>
            <div className="flex items-center gap-3">
              {/* Förhandsgranska-knapp på steg 1-4 (på sista steget visas
                  preview redan i högerkolumnen) */}
              {step < STEPS.length && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  {t('cvBuilder.actions.preview', 'Förhandsgranska')}
                </button>
              )}
              <button onClick={() => setStep(Math.min(STEPS.length, step + 1))} disabled={step === STEPS.length} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--c-solid)] text-white rounded-xl hover:brightness-110 disabled:opacity-50 font-medium">
                {t('cvBuilder.actions.next')}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Spacer for fixed mobile navigation */}
          <div className="h-24 lg:hidden" />
        </div>

        {/* Tools-kolumn för steg 1-5 — utan preview men behåll knowledge-widget
            som contextuell hjälp utan att ta upp skärm.
            På steg 6 (granska) finns ingen sidokolumn — A4-previewen är
            hela vyn. */}
        {step < STEPS.length && (
          <div className="hidden lg:block">
            {/* Flikarna. `role=tablist` med piltangenter vore rätt för en
                riktig flikuppsättning, men här byter de innehållet i en
                sidopanel — två knappar med aria-pressed beskriver det
                ärligare än ett tablist som inte beter sig som ett. */}
            <div className="flex gap-1 mb-3 border-b border-stone-200 dark:border-stone-700">
              {([
                ['forhandsvisning', t('cvBuilder.tabs.preview', 'Förhandsvisning')],
                ['rad', t('cvBuilder.tabs.advice', 'Råd')],
              ] as const).map(([id, etikett]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setHogerFlik(id)}
                  aria-pressed={hogerFlik === id}
                  className={cn(
                    'px-3 py-2 text-[13px] -mb-px border-b-2',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] rounded-t',
                    hogerFlik === id
                      ? 'border-[var(--c-solid)] font-semibold text-stone-900 dark:text-stone-100'
                      : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  )}
                >
                  {etikett}
                </button>
              ))}
            </div>

            {hogerFlik === 'rad' ? (
              <RadgivarPanel pathname="/cv" />
            ) : (
            <>
            <ContextualKnowledgeWidget context="cv-building" variant="full" />

          {/* Help - Show onboarding again */}
          <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">{t('cvBuilder.help.title')}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
              {t('cvBuilder.help.description')}
            </p>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full px-4 py-2 text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-text)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 rounded-lg hover:bg-[var(--c-accent)]/40 dark:hover:bg-[var(--c-bg)]/50 transition-colors"
            >
              {t('cvBuilder.help.showGuide')}
            </button>
          </div>

          {/* Job Adapt Panel - Anpassa för jobb */}
          {step >= 3 && (
            <JobAdaptPanel
              cvData={data}
              onAddSkill={handleAddSkillFromJob}
              onUpdateSummary={handleUpdateSummaryFromJob}
            />
          )}

          {/* AI Tools */}
          {step === 3 && (
            <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                </div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-200">{t('cvBuilder.help.aiWriting')}</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                {t('cvBuilder.help.aiWritingDesc')}
              </p>
              <AIWritingAssistant content={data.summary} onChange={(v) => setData(prev => ({ ...prev, summary: v }))} type="summary" cvData={data} />
            </div>
          )}

          {/* Versions */}
          <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-3">{t('cvBuilder.versions.title')}</h3>
            {showSaveVersion ? (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  aria-label={t('cvBuilder.versions.versionNamePlaceholder')}
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder={t('cvBuilder.versions.versionNamePlaceholder')}
                  className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <div className="flex gap-2">
                  <button onClick={saveVersion} className="flex-1 px-3 py-2 bg-[var(--c-solid)] text-white text-sm rounded-lg">{t('cvBuilder.versions.save')}</button>
                  <button onClick={() => setShowSaveVersion(false)} className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 text-sm rounded-lg text-stone-700 dark:text-stone-300">{t('cvBuilder.versions.cancel')}</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveVersion(true)}
                className="w-full mb-3 px-4 py-2 border border-[var(--c-solid)] dark:border-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-text)] rounded-lg text-sm hover:bg-[var(--c-solid)]/5 dark:hover:bg-[var(--c-solid)]/10"
              >
                {t('cvBuilder.versions.saveCurrentVersion')}
              </button>
            )}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 text-center py-2">{t('cvBuilder.versions.noVersions')}</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{v.name}</p>
                      <p className="text-xs text-stone-700 dark:text-stone-300">{new Date(v.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}</p>
                    </div>
                    <button
                      onClick={() => restoreVersion(v.id)}
                      className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] hover:bg-[var(--c-solid)]/10 px-2 py-1 rounded"
                    >
                      {t('cvBuilder.actions.restore')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
            </>
            )}
          </div>
        )}
      </div>


      {/* Onboarding */}
      {showOnboarding && (
        <CVOnboarding 
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
      {/* Mobile Fixed Navigation Bar */}
      {/* UX16 (2026-08-04): raden låg på `bottom-0` med `z-40` medan
          HubBottomNav ligger på `z-30` — den täckte alltså hela mobilnavet, och
          man satt fast i CV-byggaren (enda vägen ut var hamburgermenyn). Den
          ligger nu OVANFÖR navet via `--bottom-nav-h`, samma variabel som
          cookiebannern fick i UX10. Variabeln sätts bara när navet är monterat,
          så på sidor utan nav hamnar raden längst ned precis som förut. */}
      <div
        style={{ bottom: 'var(--bottom-nav-h, 0px)' }}
        className="lg:hidden fixed left-0 right-0 z-40 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 px-4 py-3 flex items-center justify-between gap-3 safe-area-pb"
      >
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('cvBuilder.actions.previous')}
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center justify-center w-12 h-12 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)] rounded-xl"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={() => setStep(Math.min(STEPS.length, step + 1))}
          disabled={step === STEPS.length}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--c-solid)] text-white rounded-xl hover:bg-[var(--c-solid)]/90 disabled:opacity-50 font-medium"
        >
          {t('cvBuilder.actions.next')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
