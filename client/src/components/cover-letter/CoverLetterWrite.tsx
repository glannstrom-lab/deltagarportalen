/**
 * Skriv brev — steg 1–3 i personligt brev-verktyget.
 *
 * Tre regler bär den här filen, och alla tre finns för att något gått fel förut:
 *
 * 1. **Användarens text är helig.** Ingenting i den här filen får radera eller
 *    skriva över `editedLetter` utan att personen bett om det. Ett AI-fel
 *    raderar inte, "Nästa" regenererar inte över en text som finns, och
 *    "Skriv ett nytt utkast" frågar först när texten är personens egen.
 * 2. **Ingenting påstås som inte går att belägga.** Inga påhittade företagsnamn
 *    i prompten, ingen platshållarsignatur i PDF:en, inga nollor där ett värde
 *    saknas — och AI-märkningen följer verkligheten åt båda hållen (se
 *    `arOrordAiText` nedan).
 * 3. **Tre lägen, alltid.** Laddar / fel / klart. `isLoading === false` är inte
 *    "klart", och en tom textarea är inte ett färdigt brev.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Award,
  Heart,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CoverLetterTemplateSelector } from './CoverLetterTemplateSelector'
import { CoverLetterPreview } from './CoverLetterPreview'
import { cn } from '@/lib/utils'
import { savedJobsApi } from '@/services/jobsApi'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { showToast } from '@/components/Toast'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import { coverLetterApi } from '@/services/coverLetterApi'
import { AIGeneratedWatermark, AIBadge } from '@/components/ai/AIBadge'
import { userApi } from '@/services/userApi'
import { generateCoverLetterPDFViaReactPdf, downloadPDF } from '@/services/pdfExportService'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { CVData, ProfilePreferences } from '@/services/supabaseApi'
import { byggBrevmall, raknaLuckor } from '@/data/brevmall'

// Sparat jobb interface
interface SavedJob {
  id: string
  job_id: string
  user_id: string
  job_data: {
    headline?: string
    employer?: {
      name?: string
    }
    description?: {
      text?: string
    }
    workplace_address?: {
      municipality?: string
      region?: string
    }
    publication_date?: string
  }
  created_at: string
}

// Form data interface
interface FormData {
  company: string
  jobTitle: string
  jobAd: string
  motivation: string
  selectedTemplate: string
  tone: 'professional' | 'enthusiastic' | 'formal'
  selectedJobId: string
  useManualInput: boolean
}

/**
 * Vad som gick fel när brevet skulle skrivas.
 *
 * Sorten finns för att "Försök igen" är fel råd i tre fall av fyra. Den som
 * stängt av AI-behandling (GDPR art. 21) får en knapp som **aldrig** kan
 * lyckas, eftersom grinden ligger i `prepareAiRequest` före nätverket — det
 * var precis vad som hände före den här uppdelningen.
 */
type AiFelSort = 'ai-avstangd' | 'inloggning' | 'for-manga' | 'ai'

interface AiFel {
  sort: AiFelSort
  /** Sätts bara för 'ai-avstangd': texten kommer från `aiApi` och är redan
   *  skriven för användaren — den beskriver personens egen inställning. */
  detalj?: string
}

/**
 * Skiljer felen åt så användaren får rätt väg framåt.
 *
 * `callAI` kastar `AiConsentRequiredError` för samtyckesgrinden men platta
 * `Error` med svensk text för 401/429/502/timeout — koderna följer inte med.
 * Därför matchning på meddelandet, samma mönster som `AdaptationTab.tsx`.
 * Servern skickar `retryAfter` vid 429, men `throwAiHttpError` i `aiApi.ts`
 * kastar den, så vi kan inte säga hur länge. Vi låtsas inte veta.
 */
function tolkaAiFel(error: unknown): AiFel {
  if (error instanceof AiConsentRequiredError) {
    return { sort: 'ai-avstangd', detalj: error.message }
  }
  const text = error instanceof Error ? error.message : ''
  if (/inloggad|logga in|session/i.test(text)) return { sort: 'inloggning' }
  if (/många förfrågningar/i.test(text)) return { sort: 'for-manga' }
  return { sort: 'ai' }
}

// AI API-anrop för personligt brev
async function generateCoverLetterWithAI(data: {
  cvData: CVData | null
  profileData: ProfilePreferences | null
  profile: { first_name?: string; last_name?: string; email?: string; phone?: string } | null
  jobData: {
    company: string
    jobTitle: string
    jobAd: string
  }
  tone: 'professional' | 'enthusiastic' | 'formal'
  extraMotivation?: string
}) {
  const profileContext: string[] = []

  if (data.profileData) {
    if (data.profileData.availability) {
      const av = data.profileData.availability
      if (av.availableFrom === 'immediately' || av.status === 'unemployed') {
        profileContext.push('Kan börja omgående')
      } else if (av.availableFrom) {
        profileContext.push(`Kan börja: ${av.availableFrom}`)
      }
      if (av.noticePeriod && av.noticePeriod !== 'none') {
        const periods: Record<string, string> = {
          '1_month': '1 månads uppsägningstid',
          '2_months': '2 månaders uppsägningstid',
          '3_months': '3 månaders uppsägningstid'
        }
        profileContext.push(periods[av.noticePeriod] || '')
      }
      if (av.remoteWork === 'yes') {
        profileContext.push('Öppen för distansarbete')
      } else if (av.remoteWork === 'hybrid') {
        profileContext.push('Öppen för hybridarbete')
      }
    }

    if (data.profileData.mobility) {
      const mob = data.profileData.mobility
      if (mob.driversLicense && mob.driversLicense.length > 0) {
        profileContext.push(`Körkort: ${mob.driversLicense.join(', ')}`)
      }
      if (mob.hasCar) {
        profileContext.push('Har tillgång till bil')
      }
      if (mob.willingToRelocate) {
        profileContext.push('Villig att flytta för rätt jobb')
      }
      if (mob.willingToTravel) {
        profileContext.push('Möjlighet att resa i tjänsten')
      }
    }

    if (data.profileData.work_preferences?.importantValues?.length) {
      const values = data.profileData.work_preferences.importantValues
      const valueLabels: Record<string, string> = {
        'hållbarhet': 'hållbarhet',
        'innovation': 'innovation',
        'work_life_balance': 'balans mellan arbete och fritid',
        'teamwork': 'samarbete',
        'personal_development': 'personlig utveckling'
      }
      const readableValues = values.map(v => valueLabels[v] || v).slice(0, 3)
      profileContext.push(`Värdesätter: ${readableValues.join(', ')}`)
    }
  }

  let fullContext = data.extraMotivation || ''
  if (profileContext.length > 0) {
    const profileInfo = profileContext.filter(p => p).join('. ')
    fullContext = fullContext
      ? `${fullContext}\n\nYtterligare information om kandidaten: ${profileInfo}`
      : `Information om kandidaten: ${profileInfo}`
  }

  // Get user's real name from profile or CV
  const firstName = data.profile?.first_name || data.cvData?.first_name || ''
  const lastName = data.profile?.last_name || data.cvData?.last_name || ''
  const email = data.profile?.email || data.cvData?.email || ''
  const phone = data.profile?.phone || data.cvData?.phone || ''

  return callAI('personligt-brev', {
    cvData: {
      ...data.cvData,
      // Ensure correct property names for backend
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone
    },
    // Send sender info explicitly for the AI to use
    senderName: [firstName, lastName].filter(Boolean).join(' '),
    senderEmail: email,
    senderPhone: phone,
    companyName: data.jobData.company,
    jobTitle: data.jobData.jobTitle,
    jobDescription: data.jobData.jobAd,
    tone: data.tone,
    extraContext: fullContext || undefined,
    // Servern kan härleda det ur kontexten, men klienten VET det säkert —
    // och skillnaden avgör om brevet blir färdig prosa eller ett utkast med
    // luckor att fylla i. Se `personligt-brev` i client/api/ai.js.
    tomtUnderlag: !data.cvData && !fullContext
  })
}

export function CoverLetterWrite() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const { user } = useAuthStore()
  const { profile, loadProfile } = useProfileStore()
  const templateId = searchParams.get('template')
  const initialJobId = searchParams.get('jobId')

  // States
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  // Sätts när AI-genereringen misslyckas, så stegen kan visa ett ärligt felläge
  // i stället för ett tomt fält som ser färdigt ut. Sorten avgör vägen framåt.
  const [generationError, setGenerationError] = useState<AiFel | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Exakt det AI:n skrev. Används till två saker: att kunna gå tillbaka till
  // utkastet, och att avgöra om texten fortfarande ÄR AI:ns (se arOrordAiText).
  const [generatedLetter, setGeneratedLetter] = useState<string>('')
  const [editedLetter, setEditedLetter] = useState<string>('')
  const [showPreview, setShowPreview] = useState(true)
  const [formFel, setFormFel] = useState<string | null>(null)
  // Sant när det brev som ligger i rutan skrevs UTAN att vi visste något om
  // personen. Sätts vid genereringen, inte vid renderingen — annars hade noten
  // försvunnit i samma sekund som personen råkade skriva en rad i motiveringen.
  const [genereratPaTunntUnderlag, setGenereratPaTunntUnderlag] = useState(false)

  // Data states
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [profileData, setProfileData] = useState<ProfilePreferences | null>(null)
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [loadingCV, setLoadingCV] = useState(true)
  const [, setLoadingProfile] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(true)
  // Ett hämtningsfel är inte tomhet. Utan de här tre hade "Inget CV hittades"
  // stått där sanningen var "vi kunde inte fråga".
  const [cvFel, setCvFel] = useState(false)
  const [profilFel, setProfilFel] = useState(false)
  const [jobbFel, setJobbFel] = useState(false)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    company: '',
    jobTitle: '',
    jobAd: '',
    motivation: '',
    selectedTemplate: templateId || 'professional',
    tone: 'professional',
    selectedJobId: initialJobId || '',
    useManualInput: false,
  })

  // Ett återställt utkast som personen inte blivit tillsagd om kan vara skrivet
  // för ett helt annat jobb. Vi säger till, och erbjuder att börja om.
  const [aterstalltUtkast, setAterstalltUtkast] = useState<{ company: string; jobTitle: string } | null>(null)

  // Auto-save. `generatedLetter` ligger med: utan den nollade "Gå tillbaka till
  // utkastet" brevet efter varje sidladdning i stället för att återställa det.
  const autoSaveData = {
    formData,
    editedLetter,
    generatedLetter,
    currentStep
  }

  const { clearSavedData } = useAutoSave({
    key: 'cover-letter-write-draft',
    data: autoSaveData,
    onRestore: (saved) => {
      if (saved.formData) setFormData(saved.formData)
      if (saved.editedLetter) setEditedLetter(saved.editedLetter)
      if (saved.generatedLetter) setGeneratedLetter(saved.generatedLetter)
      if (saved.currentStep) setCurrentStep(saved.currentStep)
      if (saved.editedLetter || saved.formData?.company || saved.formData?.jobTitle) {
        setAterstalltUtkast({
          company: saved.formData?.company || '',
          jobTitle: saved.formData?.jobTitle || '',
        })
      }
    }
  })

  // Load profile if not already loaded
  useEffect(() => {
    if (!profile) {
      loadProfile()
    }
  }, [profile, loadProfile])

  // Hämta CV-data
  const hamtaCv = useCallback(async () => {
    if (!user) {
      setLoadingCV(false)
      return
    }
    setLoadingCV(true)
    setCvFel(false)
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) {
        console.error('Fel vid CV-hämtning:', error)
        setCvFel(true)
      } else {
        setCvData(data)
      }
    } catch (err) {
      console.error('Exception vid CV-hämtning:', err)
      setCvFel(true)
    } finally {
      setLoadingCV(false)
    }
  }, [user])

  useEffect(() => { hamtaCv() }, [hamtaCv])

  // Hämta profildata
  const hamtaProfil = useCallback(async () => {
    if (!user) {
      setLoadingProfile(false)
      return
    }
    setProfilFel(false)
    try {
      const prefs = await userApi.getPreferences()
      setProfileData(prefs)
    } catch (err) {
      console.error('Fel vid hämtning av profildata:', err)
      setProfilFel(true)
    } finally {
      setLoadingProfile(false)
    }
  }, [user])

  useEffect(() => { hamtaProfil() }, [hamtaProfil])

  // Hämta sparade jobb
  const hamtaJobb = useCallback(async () => {
    if (!user) {
      setLoadingJobs(false)
      return
    }
    setLoadingJobs(true)
    setJobbFel(false)
    try {
      // Via savedJobsApi (E12, 2026-07-28) — applicationsApi äger tabellen.
      setSavedJobs(await savedJobsApi.getAll())
    } catch (err) {
      console.error('Exception vid sparade-jobb-hämtning:', err)
      setJobbFel(true)
    } finally {
      setLoadingJobs(false)
    }
  }, [user])

  useEffect(() => { hamtaJobb() }, [hamtaJobb])

  // Ladda jobbdata från query params
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const company = searchParams.get('company')
    const title = searchParams.get('title')
    const desc = searchParams.get('desc')

    if (jobId || company || title) {
      // searchParams.get() avkodar redan — en extra decodeURIComponent
      // kraschar på literala %-tecken i t.ex. verksamhetsbeskrivningar
      setFormData(prev => ({
        ...prev,
        selectedJobId: jobId || '',
        company: company || prev.company,
        jobTitle: title || prev.jobTitle,
        jobAd: desc || prev.jobAd,
      }))
    }
  }, [searchParams])

  // Välj ett sparat jobb.
  //
  // Tomt är tomt: 'Okänt företag' skickades tidigare rakt in i AI-prompten och
  // blev brevets tilltal. Prompten i `client/api/ai.js` hanterar ett tomt fält
  // själv — ett påhittat värde gör den bara sämre.
  const selectSavedJob = (job: SavedJob) => {
    const title = job.job_data?.headline?.trim() || ''
    const company = job.job_data?.employer?.name?.trim() || ''
    const description = job.job_data?.description?.text || ''

    setFormData(prev => ({
      ...prev,
      selectedJobId: job.job_id,
      company,
      jobTitle: title,
      jobAd: description,
      useManualInput: false,
    }))
    setFormFel(null)
    const namn = [title, company].filter(Boolean).join(' — ')
    showToast.success(
      namn
        ? `${t('coverLetter.write.jobPicked', 'Valt:')} ${namn}`
        : t('coverLetter.write.jobPickedBlank', 'Jobbet är valt. Fyll i företag och titel nedan.')
    )
  }

  // Byt till att fylla i själv.
  //
  // Tidigare tömdes alla fält vid varje klick — även när personen redan skrivit
  // i dem. Nu behålls det som står; det enda som släpper är kopplingen till det
  // sparade jobbet.
  const switchToManual = () => {
    setFormData(prev => ({
      ...prev,
      selectedJobId: '',
      useManualInput: true,
    }))
  }

  const handleNext = () => {
    if (currentStep >= 3) return

    if (currentStep === 1) {
      const saknas: string[] = []
      if (!formData.company.trim()) saknas.push(t('coverLetter.write.fieldCompany', 'företag'))
      if (!formData.jobTitle.trim()) saknas.push(t('coverLetter.write.fieldJobTitle', 'jobbtitel'))
      if (saknas.length > 0) {
        setFormFel(
          `${t('coverLetter.write.needBeforeNext', 'För att brevet ska bli rätt behöver vi')} ${saknas.join(' ' + t('common.and', 'och') + ' ')}.`
        )
        setFormData(prev => ({ ...prev, useManualInput: true }))
        return
      }
      setFormFel(null)
    }

    // Steg 2 → 3: generera BARA när det inte finns någon text. Den här raden
    // regenererade tidigare villkorslöst och skrev över allt personen skrivit.
    if (currentStep === 2 && !editedLetter.trim() && !isGenerating) {
      generateLetter()
    }

    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // B21 (2026-08-09): FAIL VISIBLE — inte fail silent-med-mall.
  //
  // Tidigare låg här ett anrop till `mockGenerateLetter` när AI-anropet
  // fallerade. Resultatet blev ett påhittat mallbrev med trasig svenska och
  // kvarvarande platshållare — som renderades i samma textarea med
  // `data-ai-generated="true"` och `<AIGeneratedWatermark>`, alltså uttryckligen
  // märkt som AI-genererat innehåll. Reproducerat på prod. Watermark-komponentens
  // egen docstring åberopar AI Act art. 50.2, så märkningen var inte en slarvig
  // etikett utan ett efterlevnadspåstående om en mall ingen modell hade skrivit.
  //
  // Principen härefter: hellre ingenting än något falskt. Användaren får veta
  // att det inte gick och en väg att försöka igen. Se ROADMAP B31.
  //
  // Tillägg: ett fel får inte heller RADERA. Catchen nollade tidigare både
  // `generatedLetter` och `editedLetter` — så ett nätverksglapp åt upp texten
  // personen just skrivit, och autosaven cementerade förlusten en sekund senare.
  const generateLetter = async () => {
    // Utan CV och utan egna rader anropas ingen AI alls.
    //
    // Mätt mot prod tre gånger: modellen skriver påståenden om personen även
    // när den inte vet något om henne ("Jag har goda kunskaper i svenska och
    // är van vid skiftarbete"), och varken en utvidgad förbudslista eller ett
    // utkastläge med luckor stoppade det. Uppgiften i sig kräver påståenden.
    //
    // Mallen är handskriven, säger vad den är, och märks ALDRIG som
    // AI-genererad — se `data/brevmall.ts` för varför det inte är B21:s
    // förbjudna `mockGenerateLetter` återuppstånden.
    if (tunntUnderlag) {
      const mall = byggBrevmall({ foretag: formData.company, titel: formData.jobTitle })
      setGeneratedLetter('')      // det finns inget AI-original att gå tillbaka till
      setEditedLetter(mall)
      setArMall(true)
      setGenereratPaTunntUnderlag(true)
      setGenerationError(null)
      return
    }

    setArMall(false)
    setIsGenerating(true)
    setGenerationError(null)
    try {
      const result = await generateCoverLetterWithAI({
        cvData,
        profileData,
        profile, // Pass profile data with real name/email/phone
        jobData: {
          company: formData.company,
          jobTitle: formData.jobTitle,
          jobAd: formData.jobAd,
        },
        tone: formData.tone,
        extraMotivation: formData.motivation,
      })

      // `callAI` är löst typad, så svaret smalnas av här i stället för att
      // formen tas för given. Allt som inte är en icke-tom sträng räknas som
      // ett misslyckande och går till felläget nedan — samma princip som B21:
      // hellre ett ärligt tomt läge än något som ser ut som ett brev.
      const payload = result as { brev?: unknown; result?: unknown }
      const raw = payload.brev ?? payload.result
      const brev = typeof raw === 'string' ? raw.trim() : ''
      if (!brev) {
        throw new Error('Tomt eller oväntat svar från AI-tjänsten')
      }
      setGeneratedLetter(brev)
      setEditedLetter(brev)
      setGenereratPaTunntUnderlag(!cvData && !formData.motivation.trim())
    } catch (error) {
      console.error('Fel vid generering:', error)
      // Ingen setEditedLetter('') här. Aldrig.
      setGenerationError(tolkaAiFel(error))
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * "Skriv ett nytt utkast" ersätter texten. Är texten personens egen frågar vi
   * först — annars är knappen en radergummiknapp som ser ut som en hjälpknapp.
   */
  const begarNyttUtkast = async () => {
    const harEgenText =
      editedLetter.trim().length > 0 && editedLetter.trim() !== generatedLetter.trim()

    if (harEgenText) {
      const ok = await confirm({
        title: t('coverLetter.write.replaceTitle', 'Vill du att jag skriver ett nytt utkast?'),
        message: t(
          'coverLetter.write.replaceBody',
          'Texten du har nu ersätts av det nya utkastet, och går inte att få tillbaka. Du kan lika gärna behålla den du har och ändra i den.'
        ),
        confirmText: t('coverLetter.write.replaceConfirm', 'Skriv ett nytt utkast'),
        cancelText: t('coverLetter.write.replaceCancel', 'Behåll det jag har'),
      })
      if (!ok) return
    }
    await generateLetter()
  }

  /**
   * Märkningen ska följa verkligheten åt BÅDA håll: den ska finnas där texten
   * är AI:ns, och försvinna när personen skrivit om den. Vi kan inte mäta
   * "hur mycket" som är omskrivet, så vi märker bara så länge texten är
   * oförändrad sedan genereringen — det påståendet går att belägga.
   */
  const arOrordAiText =
    generatedLetter.trim().length > 0 && editedLetter.trim() === generatedLetter.trim()

  /**
   * Vi vet ingenting om personen: inget CV och inga egna rader. Annonstexten
   * räknas inte — den beskriver arbetsgivaren, inte den som söker.
   *
   * Att be en modell skriva 250–350 ord om någon man inte vet något om är att
   * beställa en lögn. Uppmätt på prod 2026-08-19: ett konto utan CV fick ett
   * brev som påstod skiftvana och "goda kunskaper i svenska, både i tal och
   * skrift". Prompten är åtstramad, men det är HÄR vi vet att underlaget
   * saknas — och då ska det sägas, före och efter.
   */
  const tunntUnderlag = !loadingCV && !cvData && !formData.motivation.trim()
  // Sant när texten i editorn är den handskrivna mallen och inte AI-text.
  // Styr både AI-märkningen och `ai_generated` vid sparning.
  const [arMall, setArMall] = useState(false)

  const handleSave = async () => {
    if (!editedLetter.trim()) {
      showToast.error(t('coverLetter.write.nothingToSave', 'Det finns inget att spara ännu — skriv några rader först.'))
      return
    }

    setIsSaving(true)
    try {
      const delar = [formData.company.trim(), formData.jobTitle.trim()].filter(Boolean)
      const title = delar.length > 0
        ? delar.join(' – ')
        : t('coverLetter.write.untitled', 'Personligt brev')

      await coverLetterApi.create({
        title,
        content: editedLetter,
        company: formData.company.trim() || undefined,
        job_title: formData.jobTitle.trim() || undefined,
        job_ad: formData.jobAd || undefined,
        template: formData.selectedTemplate,
        // Följer texten, inte funktionen. Har personen skrivit om brevet är det
        // hennes — att spara det som AI-genererat vore samma sorts osanning som
        // den gamla mallen, fast spegelvänd.
        ai_generated: arOrordAiText
      })

      clearSavedData()
      showToast.success(t('coverLetter.write.savedShort', 'Sparat'))
      navigate('/cover-letter/my-letters')
    } catch (error) {
      console.error('Failed to save letter:', error)
      showToast.error(t('coverLetter.write.saveFailed', 'Brevet kunde inte sparas just nu. Texten finns kvar — försök igen om en stund.'))
    } finally {
      setIsSaving(false)
    }
  }

  // Sender info for preview.
  //
  // Ingen 'Ditt Namn'-fallback: den platshållaren följde med ut i PDF:en som
  // deltagarens underskrift. Prompten i ai.js förbjuder uttryckligen modellen
  // att signera — signaturen kommer från mallen, alltså härifrån.
  const senderInfo = {
    name: [profile?.first_name || cvData?.first_name, profile?.last_name || cvData?.last_name]
      .filter(Boolean)
      .join(' '),
    email: profile?.email || cvData?.email || undefined,
    phone: profile?.phone || cvData?.phone || undefined,
    location: profile?.location || cvData?.location || undefined,
  }

  const harAvsandarnamn = senderInfo.name.trim().length > 0

  const handleDownloadPDF = async () => {
    if (!harAvsandarnamn) {
      showToast.error(
        t('coverLetter.write.needNameForPdf', 'Vi vet inte vad du heter än, och då blir underskriften tom. Fyll i ditt namn i profilen först.')
      )
      return
    }
    try {
      const pdfBlob = await generateCoverLetterPDFViaReactPdf({
        content: editedLetter || '',
        company: formData.company,
        jobTitle: formData.jobTitle,
        templateId: formData.selectedTemplate,
        sender: senderInfo,
      })

      const fileName = `Personligt_brev_${formData.company || 'ansökan'}_${formData.jobTitle || ''}`
        .replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/_$/, '')
        + '.pdf'

      downloadPDF(pdfBlob, fileName)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      showToast.error(t('coverLetter.write.pdfFailed', 'PDF:en gick inte att göra just nu. Försök igen om en stund.'))
    }
  }

  const borjaOm = () => {
    clearSavedData()
    setAterstalltUtkast(null)
    setEditedLetter('')
    setGeneratedLetter('')
    setGenerationError(null)
    setGenereratPaTunntUnderlag(false)
    setCurrentStep(1)
    setFormData({
      company: '',
      jobTitle: '',
      jobAd: '',
      motivation: '',
      selectedTemplate: templateId || 'professional',
      tone: 'professional',
      selectedJobId: '',
      useManualInput: false,
    })
  }

  const steps = [
    { id: 1, title: t('coverLetter.write.step1', 'Jobb och utseende'), icon: FileText },
    { id: 2, title: t('coverLetter.write.step2', 'Skriv brevet'), icon: Edit3 },
    { id: 3, title: t('coverLetter.write.step3', 'Läs igenom och spara'), icon: Check },
  ]

  return (
    <div>
      {/* Step indicator */}
      <nav aria-label={t('coverLetter.write.stepsNavAria', 'Brevskrivningssteg')} className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-700/50 mb-6">
        <ol className="flex items-center justify-between" role="list">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep

            return (
              <li
                key={step.id}
                className={cn('flex items-start', index < steps.length - 1 && 'flex-1')}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      (isActive || isCompleted) && 'bg-[var(--c-solid)] text-[var(--c-on-solid)]',
                      !isActive && !isCompleted && 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    )}
                    aria-hidden="true"
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  {/* Namnet doldes tidigare helt under 640 px — och cirkeln är
                      aria-hidden, så steget fanns inte för skärmläsare heller.
                      Nu syns alltid det aktiva stegets namn, och alla tre finns
                      i tillgänglighetsträdet. */}
                  <span className={cn(
                    'text-xs mt-2 font-medium whitespace-nowrap',
                    !isActive && 'hidden sm:block',
                    isActive && 'text-[var(--c-text)]',
                    isCompleted && 'text-[var(--c-text)]',
                    !isActive && !isCompleted && 'text-stone-600 dark:text-stone-300'
                  )}>
                    <span className="sr-only">
                      {t('coverLetter.write.stepCounter', 'Steg {{nummer}} av {{totalt}}: ', { nummer: step.id, totalt: steps.length })}
                    </span>
                    {step.title}
                    {isCompleted && (
                      <span className="sr-only"> {t('coverLetter.write.stepDone', '(klart)')}</span>
                    )}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn('flex-1 h-0.5 mx-3 mt-5', isCompleted ? 'bg-[var(--c-solid)]' : 'bg-stone-200 dark:bg-stone-700')}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Main content with optional sidebar preview */}
      <div className={cn('grid gap-6', currentStep >= 2 && showPreview ? 'lg:grid-cols-[1fr,400px]' : '')}>
        {/* Form area */}
        <div className="space-y-6">
          {/* Återställt utkast — sagt rakt ut, inte i tysthet */}
          {aterstalltUtkast && (
            <div
              className="p-4 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-xl"
              role="status"
              aria-live="polite"
            >
              <h4 className="font-medium text-[var(--c-text)]">
                {t('coverLetter.write.draftRestoredTitle', 'Du har ett påbörjat brev här')}
              </h4>
              <p className="text-sm text-[var(--c-text)] mt-1">
                {[aterstalltUtkast.jobTitle, aterstalltUtkast.company].filter(Boolean).join(' — ') ||
                  t('coverLetter.write.draftRestoredNoJob', 'Utan jobb ifyllt ännu')}
                {'. '}
                {t('coverLetter.write.draftRestoredBody', 'Vi tog fram det åt dig. Gäller det ett annat jobb kan du börja om.')}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={() => setAterstalltUtkast(null)}>
                  {t('coverLetter.write.draftKeep', 'Fortsätt på det')}
                </Button>
                <Button variant="outline" size="sm" onClick={borjaOm}>
                  {t('coverLetter.write.draftStartOver', 'Börja om')}
                </Button>
              </div>
            </div>
          )}

          {/* CV-status: tre lägen — hämtat, kunde inte hämtas, finns inte ännu */}
          {cvData && (
            <div className="p-3 sm:p-4 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--c-text)]" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[var(--c-text)] text-sm sm:text-base">
                    {t('coverLetter.write.cvFoundTitle', 'Ditt CV är med')}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--c-text)]">
                    {harAvsandarnamn
                      ? t('coverLetter.write.cvFoundNamed', 'Vi utgår från det när brevet skrivs.')
                      : t('coverLetter.write.cvFoundNoName', 'Vi utgår från det när brevet skrivs. Ditt namn saknas dock — fyll i det i profilen så blir underskriften rätt.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {cvFel && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-xl" role="alert">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-800 dark:text-amber-200 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">
                    {t('coverLetter.write.cvErrorTitle', 'Vi kunde inte hämta ditt CV just nu')}
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t('coverLetter.write.cvErrorBody', 'Det betyder inte att det är borta. Brevet går att skriva ändå, men blir mindre personligt.')}
                  </p>
                </div>
                <Button variant="outline" onClick={hamtaCv}>
                  {t('common.tryAgain', 'Försök igen')}
                </Button>
              </div>
            </div>
          )}

          {!cvData && !loadingCV && !cvFel && (
            <div className="p-4 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[var(--c-text)] shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <h4 className="font-medium text-[var(--c-text)]">
                    {t('coverLetter.write.noCvTitle', 'Du har inget CV här ännu')}
                  </h4>
                  <p className="text-sm text-[var(--c-text)]">
                    {t('coverLetter.write.noCvBody', 'Brevet går att skriva ändå. Med ett CV blir det mer personligt.')}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/cv')}>
                  {t('coverLetter.write.createCv', 'Skapa ditt CV')}
                </Button>
              </div>
            </div>
          )}

          {/* Step content */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50">
            {currentStep === 1 && (
              <Step1JobAndTemplate
                savedJobs={savedJobs}
                loadingJobs={loadingJobs}
                jobbFel={jobbFel}
                onRetryJobs={hamtaJobb}
                formData={formData}
                setFormData={setFormData}
                onSelectJob={selectSavedJob}
                onManual={switchToManual}
                onContinue={handleNext}
                formFel={formFel}
              />
            )}
            {currentStep === 2 && (
              <Step2Write
                formData={formData}
                setFormData={setFormData}
                cvData={cvData}
                avsandarnamn={senderInfo.name}
                profilFel={profilFel}
                isGenerating={isGenerating}
                editedLetter={editedLetter}
                setEditedLetter={setEditedLetter}
                onGenerate={generateLetter}
                onNyttUtkast={begarNyttUtkast}
                generationError={generationError}
                arOrordAiText={arOrordAiText}
                tunntUnderlag={tunntUnderlag}
                genereratPaTunntUnderlag={genereratPaTunntUnderlag}
                arMall={arMall}
              />
            )}
            {currentStep === 3 && (
              <Step3ReviewSave
                editedLetter={editedLetter}
                setEditedLetter={setEditedLetter}
                generatedLetter={generatedLetter}
                formData={formData}
                onDownload={handleDownloadPDF}
                harAvsandarnamn={harAvsandarnamn}
                senderInfo={senderInfo}
                generationError={generationError}
                isGenerating={isGenerating}
                onRetry={generateLetter}
                onBack={handleBack}
                arOrordAiText={arOrordAiText}
                genereratPaTunntUnderlag={genereratPaTunntUnderlag}
                arMall={arMall}
              />
            )}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
              aria-label={t('common.back', 'Tillbaka')}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              <span className="hidden sm:inline">{t('common.back', 'Tillbaka')}</span>
            </Button>

            <div className="flex gap-3">
              {/* Preview toggle for step 2+ */}
              {currentStep >= 2 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  aria-pressed={showPreview}
                  className="gap-2 hidden lg:flex"
                >
                  {showPreview ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  {showPreview
                    ? t('coverLetter.write.hidePreview', 'Dölj förhandsvisning')
                    : t('coverLetter.write.showPreview', 'Visa förhandsvisning')}
                </Button>
              )}

              {currentStep < 3 ? (
                <Button onClick={handleNext} className="gap-2">
                  {t('common.next', 'Nästa')}
                  <ChevronRight size={18} aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                  {t('coverLetter.write.save', 'Spara brevet')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Live preview sidebar (desktop only, step 2+) */}
        {currentStep >= 2 && showPreview && (
          <div className="hidden lg:block sticky top-4">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-medium text-stone-700 dark:text-stone-100 flex items-center gap-2">
                  <Eye size={16} aria-hidden="true" />
                  {t('coverLetter.write.previewHeading', 'Så här ser det ut')}
                </h3>
                {/* Märkningen hör hemma där AI-texten först visas, inte bara i
                    steg 3 — och den försvinner när personen skrivit om texten. */}
                {arOrordAiText && <AIBadge variant="block" label={t('coverLetter.write.aiDraftLabel', 'AI-utkast')} />}
              </div>
              <div className="aspect-[210/297] max-h-[600px]">
                <CoverLetterPreview
                  content={editedLetter || t('coverLetter.write.previewEmpty', 'Här visas brevet när du börjat skriva.')}
                  company={formData.company}
                  jobTitle={formData.jobTitle}
                  templateId={formData.selectedTemplate}
                  sender={senderInfo}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

/**
 * Felpanel för AI-genereringen. En sort = en väg framåt.
 *
 * "Försök igen" visas bara där ett nytt försök faktiskt kan lyckas. Den som
 * stängt av AI-behandlingen får en länk till inställningarna i stället, och
 * alltid vägen att skriva själv — det löftet måste hålla.
 */
function AiFelPanel({
  fel,
  isGenerating,
  onRetry,
  onSkrivSjalv,
  kompakt = false,
}: {
  fel: AiFel
  isGenerating: boolean
  onRetry: () => void
  onSkrivSjalv?: () => void
  kompakt?: boolean
}) {
  const { t } = useTranslation()

  const rubriker: Record<AiFelSort, string> = {
    'ai-avstangd': t('coverLetter.write.errOffTitle', 'AI-hjälpen är avstängd i dina inställningar'),
    'inloggning': t('coverLetter.write.errAuthTitle', 'Du behöver logga in igen'),
    'for-manga': t('coverLetter.write.errRateTitle', 'Vi behöver pausa en liten stund'),
    'ai': t('coverLetter.write.errAiTitle', 'Brevet blev inte skrivet'),
  }

  const texter: Record<AiFelSort, string> = {
    'ai-avstangd': fel.detalj || t('coverLetter.write.errOffBody', 'Du har valt att dina uppgifter inte ska behandlas av AI. Det valet gäller — vill du ändra det görs det i Inställningar.'),
    'inloggning': t('coverLetter.write.errAuthBody', 'Din inloggning har gått ut. Allt du skrivit finns kvar här när du kommer tillbaka.'),
    'for-manga': t('coverLetter.write.errRateBody', 'Det har gjorts många förfrågningar på kort tid. Vänta någon minut och försök igen — vi vet tyvärr inte exakt hur länge.'),
    'ai': t('coverLetter.write.errAiBody', 'Något gick fel på vår sida, inte på din. Det du fyllt i och skrivit finns kvar.'),
  }

  return (
    <div
      role="alert"
      className={cn(
        'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-xl',
        kompakt ? 'p-3' : 'p-4'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-800 dark:text-amber-200 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800 dark:text-amber-200">{rubriker[fel.sort]}</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">{texter[fel.sort]}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {fel.sort === 'ai-avstangd' && (
              <Link
                to="/profile?tab=installningar"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-xl font-medium hover:brightness-95"
              >
                {t('coverLetter.write.openSettings', 'Öppna Inställningar')}
              </Link>
            )}
            {fel.sort === 'inloggning' && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-xl font-medium hover:brightness-95"
              >
                {t('coverLetter.write.goLogin', 'Logga in igen')}
              </Link>
            )}
            {(fel.sort === 'ai' || fel.sort === 'for-manga') && (
              <Button onClick={onRetry} disabled={isGenerating} className="gap-2">
                <RefreshCw size={16} className={isGenerating ? 'animate-spin' : undefined} aria-hidden="true" />
                {isGenerating
                  ? t('coverLetter.write.writing', 'Skriver …')
                  : t('common.tryAgain', 'Försök igen')}
              </Button>
            )}
            {onSkrivSjalv && (
              <Button variant="outline" onClick={onSkrivSjalv}>
                {t('coverLetter.write.writeMyself', 'Jag skriver själv')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Steg 1: Välj jobb & mall
function Step1JobAndTemplate({
  savedJobs,
  loadingJobs,
  jobbFel,
  onRetryJobs,
  formData,
  setFormData,
  onSelectJob,
  onManual,
  onContinue,
  formFel,
}: {
  savedJobs: SavedJob[]
  loadingJobs: boolean
  jobbFel: boolean
  onRetryJobs: () => void
  formData: FormData
  setFormData: (data: FormData) => void
  onSelectJob: (job: SavedJob) => void
  onManual: () => void
  onContinue: () => void
  formFel: string | null
}) {
  const { t } = useTranslation()
  const hasSelectedJob = formData.selectedJobId || (formData.company && formData.jobTitle)
  const saknarForetag = Boolean(formFel) && !formData.company.trim()
  const saknarTitel = Boolean(formFel) && !formData.jobTitle.trim()

  return (
    <div className="space-y-8">
      {/* Template selection */}
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t('coverLetter.write.templateHeading', 'Välj hur brevet ska se ut')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('coverLetter.write.blankTemplateBody', 'Utseendet syns i förhandsvisningen och i PDF:en. Du kan byta när som helst.')}
            </p>
          </div>
        </div>
        <CoverLetterTemplateSelector
          selectedTemplate={formData.selectedTemplate}
          onSelect={(id) => setFormData({ ...formData, selectedTemplate: id })}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-stone-200 dark:border-stone-700" />

      {/* Job selection */}
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {t('coverLetter.write.jobHeading', 'Vilket jobb gäller brevet?')}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('coverLetter.write.jobBody', 'Välj ett du sparat, eller fyll i själv.')}
            </p>
          </div>
        </div>

        {/* Sparade jobb */}
        {savedJobs.length > 0 && (
          <div className="space-y-3 mb-4">
            <h3 className="font-medium text-stone-700 dark:text-stone-200 flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-[var(--c-text)]" aria-hidden="true" />
              {t('coverLetter.write.savedJobsHeading', 'Dina sparade jobb')}
            </h3>
            <div className="grid gap-2">
              {savedJobs.slice(0, 5).map((job) => {
                const title = job.job_data?.headline?.trim() || ''
                const company = job.job_data?.employer?.name?.trim() || ''
                const location = job.job_data?.workplace_address?.municipality
                const vald = formData.selectedJobId === job.job_id

                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onSelectJob(job)}
                    aria-pressed={vald}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      vald
                        ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                        : 'border-stone-200 dark:border-stone-700 hover:border-[var(--c-solid)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase size={16} className="text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
                          {title || t('coverLetter.write.jobNoTitle', 'Titel saknas i annonsen')}
                        </div>
                        <div className="text-xs text-stone-600 dark:text-stone-300 truncate">
                          {company || t('coverLetter.write.jobNoCompany', 'Företag saknas i annonsen')}
                          {location && ` • ${location}`}
                        </div>
                      </div>
                      {vald && (
                        <Check size={16} className="text-[var(--c-text)] shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            {savedJobs.length > 5 && (
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('coverLetter.write.savedJobsMore', 'Här visas de fem senaste. Resten finns under Sparade jobb.')}
              </p>
            )}
          </div>
        )}

        {loadingJobs && (
          <div className="text-center py-4 text-stone-600 dark:text-stone-300 text-sm" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" aria-hidden="true" />
            {t('coverLetter.write.loadingJobs', 'Hämtar dina sparade jobb …')}
          </div>
        )}

        {jobbFel && (
          <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-lg" role="alert">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800 dark:text-amber-200 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
                {t('coverLetter.write.jobsErrorBody', 'Dina sparade jobb gick inte att hämta just nu. De ligger kvar — du kan fylla i jobbet för hand så länge.')}
              </p>
              <Button variant="outline" size="sm" onClick={onRetryJobs}>
                {t('common.tryAgain', 'Försök igen')}
              </Button>
            </div>
          </div>
        )}

        {/* Fyll i själv */}
        <button
          type="button"
          onClick={onManual}
          aria-expanded={formData.useManualInput}
          aria-controls="cl-manual-fields"
          className={cn(
            'w-full p-3 rounded-lg border transition-all text-left',
            formData.useManualInput
              ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
              : 'border-stone-200 dark:border-stone-700 hover:border-[var(--c-solid)]'
          )}
        >
          <div className="flex items-center gap-3">
            <Edit3 size={16} className="text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <div className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                {t('coverLetter.write.manualToggle', 'Jag fyller i själv')}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-300">
                {t('coverLetter.write.manualToggleBody', 'Skriv in företag och jobb för hand')}
              </div>
            </div>
          </div>
        </button>

        {/* Fälten ligger alltid i DOM:en. Annars pekar aria-controls ovan på ett
            id som inte finns i utgångsläget — alltså i det läge en skärmläsare
            möter först.

            Döljningen sker med inline `display`, inte med `hidden`-attributet
            eller klassen `hidden`: `.mobile-device form:not([class*="flex"])` i
            `styles/mobile.css` sätter `display: flex` med högre specificitet än
            båda, så fälten hade legat öppna på mobil hur mycket vi än stängt
            dem. Samma fälla som slog ut Kunskapsbankens sökruta 2026-08-18. */}
        <form
          id="cl-manual-fields"
          style={formData.useManualInput ? undefined : { display: 'none' }}
          onSubmit={(e) => { e.preventDefault(); onContinue() }}
          className="space-y-4 mt-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg"
        >
          <div>
            <label htmlFor="cl-company" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
              {t('coverLetter.write.labelCompany', 'Företag')}
            </label>
            <input
              id="cl-company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder={t('coverLetter.write.placeholderCompany', 't.ex. Acme AB')}
              aria-required="true"
              aria-invalid={saknarForetag || undefined}
              aria-describedby={saknarForetag ? 'cl-form-fel' : undefined}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none"
            />
          </div>
          <div>
            <label htmlFor="cl-jobtitle" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
              {t('coverLetter.write.labelJobTitle', 'Vad heter tjänsten?')}
            </label>
            <input
              id="cl-jobtitle"
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder={t('coverLetter.write.placeholderJobTitle', 't.ex. Projektledare')}
              aria-required="true"
              aria-invalid={saknarTitel || undefined}
              aria-describedby={saknarTitel ? 'cl-form-fel' : undefined}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none"
            />
          </div>
          <div>
            <label htmlFor="cl-jobad" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
              {t('coverLetter.write.labelJobAd', 'Annonstexten (om du har den)')}
            </label>
            <textarea
              id="cl-jobad"
              value={formData.jobAd}
              onChange={(e) => setFormData({ ...formData, jobAd: e.target.value })}
              placeholder={t('coverLetter.write.placeholderJobAd', 'Klistra in texten från annonsen — då blir brevet mer träffsäkert.')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none resize-none"
            />
          </div>
        </form>

        {/* Validering — sagt vänligt, med koppling till fälten */}
        {formFel && (
          <p
            id="cl-form-fel"
            role="alert"
            className="mt-3 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-lg p-3"
          >
            {formFel}
          </p>
        )}

        {/* Selected job summary */}
        {hasSelectedJob && !formData.useManualInput && (
          <div className="mt-4 p-3 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--c-text)]" aria-hidden="true" />
              <span className="font-medium text-[var(--c-text)] text-sm">
                {[formData.jobTitle, formData.company].filter(Boolean).join(' — ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Noten som följer med ett brev skrivet utan underlag.
 *
 * Uppmätt på prod 2026-08-19: ett konto utan CV fick ett brev i första person
 * som påstod skiftvana, dokumentationsvana och "goda kunskaper i svenska, både
 * i tal och skrift". Ingenting av det fanns i underlaget. Prompten i
 * `client/api/ai.js` är åtstramad, men den kan bara begränsa skadan — det är
 * här verktyget vet att det inte vet något, och det ska stå i klartext bredvid
 * resultatet i stället för att läsaren ska gissa varför brevet är kort.
 */
/**
 * Noten för den handskrivna mallen.
 *
 * Skild från `TunntUnderlagNot` med flit: den handlar om ett AI-brev som blev
 * kort, den här om en text ingen modell skrivit. Att blanda ihop dem vore att
 * upprepa B21 — se `data/brevmall.ts`.
 */
function MallNot({ antalLuckor }: { antalLuckor: number }) {
  const { t } = useTranslation()
  return (
    <div className="mt-3 rounded-lg border border-[var(--c-accent)] bg-[var(--c-bg)] p-3">
      <p className="text-sm font-medium text-[var(--c-text)]">
        {t('coverLetter.write.blankTemplateTitle', 'Det här är en mall, inte ett färdigt brev')}
      </p>
      <p className="mt-1 text-sm text-[var(--c-text)]">
        {t(
          'coverLetter.write.blankTemplateBody',
          'Vi vet inget om dig ännu, så vi lät inte AI:n skriva — den hade behövt gissa. I stället får du en stomme med {{count}} luckor att fylla i med dina egna ord. Fyll i ditt CV, så skriver vi ett riktigt utkast åt dig nästa gång.',
          { count: antalLuckor }
        )}
      </p>
    </div>
  )
}

function TunntUnderlagNot() {
  const { t } = useTranslation()
  return (
    <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
      {t(
        'coverLetter.write.thinResultNote',
        'Brevet är kort med flit. Vi hade bara annonsen att gå på, så det säger ingenting om din bakgrund — vi vill hellre skriva lite och sant än mycket och påhittat. Med ett CV eller några egna rader blir nästa utkast både längre och mer ditt.'
      )}
    </p>
  )
}

// Steg 2: Skriv brev
function Step2Write({
  formData,
  setFormData,
  cvData,
  avsandarnamn,
  profilFel,
  isGenerating,
  editedLetter,
  setEditedLetter,
  onGenerate,
  onNyttUtkast,
  generationError,
  arOrordAiText,
  tunntUnderlag,
  genereratPaTunntUnderlag,
  arMall,
}: {
  formData: FormData
  setFormData: (data: FormData) => void
  cvData: CVData | null
  avsandarnamn: string
  profilFel: boolean
  isGenerating: boolean
  editedLetter: string
  setEditedLetter: (text: string) => void
  onGenerate: () => void
  onNyttUtkast: () => void
  generationError: AiFel | null
  arOrordAiText: boolean
  tunntUnderlag: boolean
  genereratPaTunntUnderlag: boolean
  arMall: boolean
}) {
  const { t } = useTranslation()
  const motivationRef = useRef<HTMLTextAreaElement>(null)
  const antalOrd = editedLetter.split(/\s+/).filter(Boolean).length
  const antalKompetenser = cvData?.skills?.length ?? 0

  const toner = [
    { id: 'professional', label: t('coverLetter.write.toneProfessional', 'Professionell'), desc: t('coverLetter.write.toneProfessionalDesc', 'Balanserad') },
    { id: 'enthusiastic', label: t('coverLetter.write.toneEnthusiastic', 'Entusiastisk'), desc: t('coverLetter.write.toneEnthusiasticDesc', 'Energisk') },
    { id: 'formal', label: t('coverLetter.write.toneFormal', 'Formell'), desc: t('coverLetter.write.toneFormalDesc', 'Traditionell') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t('coverLetter.write.writeHeading', 'Nu skriver vi brevet')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('coverLetter.write.writeBody', 'Välj hur det ska låta, lägg till något eget om du vill — och skriv själv eller be om ett utkast.')}
          </p>
        </div>
      </div>

      {/* Vad vi tar med — bara det vi faktiskt har.
          Namnet kommer från `senderInfo`, samma källa som brevet och
          förhandsvisningen. Tidigare läste den här rutan `cvData.first_name`
          medan förhandsvisningen läste profilen, så samma person kunde stå med
          två olika namn på samma skärm. */}
      {cvData && (
        <div className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg p-3">
          <h3 className="font-medium text-[var(--c-text)] mb-1 flex items-center gap-2 text-sm">
            <Award className="w-4 h-4" aria-hidden="true" />
            {t('coverLetter.write.cvUsedHeading', 'Det här tar vi med')}
          </h3>
          <p className="text-xs text-[var(--c-text)]">
            {[
              avsandarnamn,
              cvData.title,
              antalKompetenser > 0
                ? `${antalKompetenser} ${t('coverLetter.write.skillsSuffix', 'kompetenser')}`
                : '',
            ].filter(Boolean).join(' • ')}
          </p>
          {profilFel && (
            <p className="text-xs text-[var(--c-text)] mt-1">
              {t('coverLetter.write.prefsError', 'Dina övriga inställningar gick inte att läsa just nu, så brevet bygger bara på CV:t.')}
            </p>
          )}
        </div>
      )}

      {/* Tonval */}
      <fieldset>
        <legend className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
          {t('coverLetter.write.toneHeading', 'Hur ska brevet låta?')}
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {toner.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => setFormData({ ...formData, tone: tone.id as FormData['tone'] })}
              aria-pressed={formData.tone === tone.id}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                formData.tone === tone.id
                  ? 'border-[var(--c-solid)] bg-[var(--c-bg)]'
                  : 'border-stone-200 dark:border-stone-700 hover:border-[var(--c-solid)]'
              )}
            >
              <div className="font-medium text-stone-900 dark:text-stone-100 text-sm">{tone.label}</div>
              <div className="text-xs text-stone-600 dark:text-stone-300">{tone.desc}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Något eget */}
      <div>
        <label htmlFor="cl-motivation" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-1">
          {t('coverLetter.write.motivationLabel', 'Något du vill ha med? (frivilligt)')}
        </label>
        <textarea
          id="cl-motivation"
          ref={motivationRef}
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder={t('coverLetter.write.motivationPlaceholder', 't.ex. Jag är särskilt intresserad av er satsning på hållbarhet …')}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none resize-none"
        />
      </div>

      {/* Fel — med rätt väg framåt för sin sort */}
      {generationError && (
        <AiFelPanel fel={generationError} isGenerating={isGenerating} onRetry={onGenerate} />
      )}

      {/* Sagt INNAN knappen trycks, inte efteråt.
          Verktyget vet att det inte vet något om personen — då ska det stå,
          med två vägar ur det. Genereringen spärras inte: valet är hennes. */}
      {tunntUnderlag && !editedLetter && (
        <div className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg p-4">
          <h3 className="font-medium text-[var(--c-text)]">
            {t('coverLetter.write.thinTitle', 'Vi vet inte så mycket om dig än')}
          </h3>
          <p className="text-sm text-[var(--c-text)] mt-1">
            {t(
              'coverLetter.write.thinBody',
              'Utan CV och utan några egna rader har vi bara annonsen att gå på. Då håller vi brevet kort och låter det handla om varför tjänsten lockar — vi hittar hellre inte på saker om dig.'
            )}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link
              to="/cv"
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[var(--c-solid)] text-[var(--c-on-solid)] rounded-xl font-medium hover:brightness-95"
            >
              {t('coverLetter.write.thinFillCv', 'Fyll i ditt CV först')}
            </Link>
            <Button variant="outline" onClick={() => motivationRef.current?.focus()}>
              {t('coverLetter.write.thinWriteAbout', 'Skriv några rader om dig själv')}
            </Button>
          </div>
        </div>
      )}

      {/* Be om ett utkast — bara när det inte finns någon text att förlora, och
          bara när ett nytt försök över huvud taget kan lyckas. En knapp som är
          spärrad av personens eget val, eller av en utgången inloggning, är en
          knapp som lovar något den inte kan hålla. */}
      {!editedLetter && generationError?.sort !== 'ai-avstangd' && generationError?.sort !== 'inloggning' && (
        <Button onClick={onGenerate} disabled={isGenerating} className="w-full gap-2">
          {isGenerating ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              {t('coverLetter.write.writingDraft', 'Skriver ett utkast åt dig …')}
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              {t('coverLetter.write.askForDraft', 'Skriv ett utkast åt mig')}
            </>
          )}
        </Button>
      )}

      {isGenerating && (
        <p className="text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t('coverLetter.write.writingWait', 'Det kan ta upp till en minut. Du kan börja skriva själv nedan under tiden — utkastet ersätter inte det du redan skrivit.')}
        </p>
      )}

      {/* Editorn finns ALLTID. Löftet "du kan skriva brevet själv" måste hålla,
          och den här textarean var tidigare villkorad på att AI lyckats. */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <label htmlFor="coverletterwrite-f1" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
            {t('coverLetter.write.yourLetter', 'Ditt brev')}
          </label>
          {antalOrd > 0 && (
            <span className="text-xs text-stone-600 dark:text-stone-300">
              {antalOrd} {t('coverLetter.write.words', 'ord')}
            </span>
          )}
        </div>
        <textarea
          id="coverletterwrite-f1"
          value={editedLetter}
          onChange={(e) => setEditedLetter(e.target.value)}
          placeholder={t('coverLetter.write.editorPlaceholder', 'Skriv ditt brev här — eller be om ett utkast ovan och ändra i det.')}
          className="w-full px-4 py-3 min-h-[300px] rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none resize-y"
          {...(arOrordAiText ? { 'data-ai-generated': 'true' } : {})}
        />
        {/* Märkningen hör hemma där AI-texten först visas — och bara så länge
            den är AI:ns. Har personen skrivit om den är det hennes text. */}
        {arOrordAiText && <AIGeneratedWatermark contentType={t('coverLetter.write.contentTypeLetter', 'brev')} />}
        {arMall && <MallNot antalLuckor={raknaLuckor(editedLetter)} />}
        {genereratPaTunntUnderlag && !arMall && arOrordAiText && <TunntUnderlagNot />}

        {editedLetter && (
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={onNyttUtkast} disabled={isGenerating} className="gap-1">
              <Sparkles size={14} aria-hidden="true" />
              {t('coverLetter.write.newDraft', 'Skriv ett nytt utkast')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Steg 3: Läs igenom och spara
function Step3ReviewSave({
  editedLetter,
  setEditedLetter,
  generatedLetter,
  formData,
  onDownload,
  harAvsandarnamn,
  senderInfo,
  generationError,
  isGenerating,
  onRetry,
  onBack,
  arOrordAiText,
  genereratPaTunntUnderlag,
  arMall,
}: {
  editedLetter: string
  setEditedLetter: (text: string) => void
  generatedLetter: string
  formData: FormData
  onDownload: () => void
  harAvsandarnamn: boolean
  senderInfo: { name: string; email?: string; phone?: string; location?: string }
  generationError: AiFel | null
  isGenerating: boolean
  onRetry: () => void
  onBack: () => void
  arOrordAiText: boolean
  genereratPaTunntUnderlag: boolean
  arMall: boolean
}) {
  const { t } = useTranslation()
  const [isCopied, setIsCopied] = useState(false)
  const antalOrd = editedLetter.split(/\s+/).filter(Boolean).length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedLetter)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Kunde inte kopiera:', err)
      showToast.error(t('coverLetter.write.copyFailed', 'Kopieringen gick inte. Markera texten och kopiera för hand.'))
    }
  }

  // LÄGE 1 — genereringen pågår och det finns ingen text.
  // Utan det här läget renderades en tom textarea, "0 ord" och en AI-märkning
  // som ett färdigt resultat.
  if (isGenerating && !editedLetter.trim()) {
    return (
      <div className="space-y-6 py-6 text-center" role="status" aria-live="polite">
        <Loader2 className="w-10 h-10 mx-auto text-[var(--c-text)] animate-spin" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t('coverLetter.write.busyTitle', 'Skriver ditt utkast')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            {t('coverLetter.write.busyBody', 'Det kan ta upp till en minut. Stanna kvar på sidan så länge.')}
          </p>
        </div>
      </div>
    )
  }

  // LÄGE 2 — det gick inte, och det finns ingen text att granska.
  if (generationError && !editedLetter.trim()) {
    return (
      <div className="space-y-4">
        <AiFelPanel
          fel={generationError}
          isGenerating={isGenerating}
          onRetry={onRetry}
          onSkrivSjalv={onBack}
        />
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t('coverLetter.write.errFooter', 'Allt du fyllt i finns kvar. Går du tillbaka kan du skriva brevet själv i rutan där.')}
        </p>
      </div>
    )
  }

  // LÄGE 3 — klart.
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t('coverLetter.write.reviewHeading', 'Läs igenom och spara')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('coverLetter.write.reviewBody', 'Ändra det du vill. Sedan sparar du brevet eller laddar ner det som PDF.')}
          </p>
        </div>
      </div>

      {/* Ett fel som inträffade medan det fanns text kvar — texten står kvar,
          felet visas bredvid. */}
      {generationError && (
        <AiFelPanel fel={generationError} isGenerating={isGenerating} onRetry={onRetry} kompakt />
      )}

      {isGenerating && (
        <p className="text-sm text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t('coverLetter.write.busyReplacing', 'Skriver ett nytt utkast …')}
        </p>
      )}

      {/* Tips */}
      <div className="bg-[var(--c-bg)] border border-[var(--c-accent)] rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-[var(--c-text)] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-[var(--c-text)]">
            {t('coverLetter.write.tip', 'Ett tips: en mening om varför just det här företaget lockar dig gör mer skillnad än allt annat i brevet.')}
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-stone-700 dark:text-stone-200">
            {t('coverLetter.write.previewHeading', 'Så här ser det ut')}
          </h3>
          {arOrordAiText && <AIBadge variant="block" label={t('coverLetter.write.aiDraftLabel', 'AI-utkast')} />}
        </div>
        <div className="aspect-[210/297] max-h-[400px]">
          <CoverLetterPreview
            content={editedLetter}
            company={formData.company}
            jobTitle={formData.jobTitle}
            templateId={formData.selectedTemplate}
            sender={senderInfo}
            className="h-full"
          />
        </div>
      </div>

      {/* Editor */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <label htmlFor="coverletterwrite-f2" className="block text-sm font-medium text-stone-700 dark:text-stone-200">
            {t('coverLetter.write.editHeading', 'Ändra i brevet')}
          </label>
          {antalOrd > 0 && (
            <span className="text-xs text-stone-600 dark:text-stone-300">
              {antalOrd} {t('coverLetter.write.words', 'ord')}
            </span>
          )}
        </div>
        <textarea
          id="coverletterwrite-f2"
          value={editedLetter}
          onChange={(e) => setEditedLetter(e.target.value)}
          placeholder={t('coverLetter.write.editorPlaceholder', 'Skriv ditt brev här — eller be om ett utkast ovan och ändra i det.')}
          className="w-full px-4 py-3 min-h-[250px] rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none resize-y"
          {...(arOrordAiText ? { 'data-ai-generated': 'true' } : {})}
        />
        {arOrordAiText ? (
          <AIGeneratedWatermark contentType={t('coverLetter.write.contentTypeLetter', 'brev')} />
        ) : (
          editedLetter.trim().length > 0 && (
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
              {generatedLetter
                ? t('coverLetter.write.yoursNow', 'Du har ändrat i utkastet, så det är dina ord nu. Därför står det inte längre att brevet är skrivet med AI.')
                : t('coverLetter.write.yoursAllAlong', 'Det här är dina egna ord.')}
            </p>
          )
        )}
        {arMall && <MallNot antalLuckor={raknaLuckor(editedLetter)} />}
        {genereratPaTunntUnderlag && !arMall && arOrordAiText && <TunntUnderlagNot />}
      </div>

      {/* Saknas namnet blir underskriften tom — sagt innan personen klickar,
          inte efteråt. */}
      {!harAvsandarnamn && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-lg p-3" role="status">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t('coverLetter.write.missingNameNotice', 'Vi vet inte vad du heter än, så underskriften blir tom i PDF:en.')}{' '}
            <Link to="/profile" className="font-medium underline">
              {t('coverLetter.write.missingNameLink', 'Fyll i ditt namn i profilen')}
            </Link>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="gap-2" onClick={handleCopy}>
          {isCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {isCopied ? t('coverLetter.write.copied', 'Kopierat') : t('coverLetter.write.copy', 'Kopiera texten')}
        </Button>
        <Button variant="outline" className="gap-2" onClick={onDownload}>
          <Download size={16} aria-hidden="true" />
          {t('coverLetter.write.downloadAsPdf', 'Ladda ner som PDF')}
        </Button>
        {/* Knappen visas bara när det FINNS ett utkast att gå tillbaka till, och
            texten skiljer sig från det. Tidigare nollade den brevet efter varje
            sidladdning, eftersom originalet inte sparades. */}
        {generatedLetter.trim().length > 0 && !arOrordAiText && (
          <Button variant="outline" onClick={() => setEditedLetter(generatedLetter)} className="gap-2">
            <RefreshCw size={16} aria-hidden="true" />
            {t('coverLetter.write.restoreDraft', 'Gå tillbaka till utkastet')}
          </Button>
        )}
      </div>
      {/* Ingen andra "Spara brevet" här. Sidan hade två identiska primärknappar
          — en i den här raden och en i stegnavigationen — vilket bryter mot
          "ett centrum per skärm" (DESIGN.md §1.5) och gör det oklart vilken som
          är nästa steg. Sparandet hör till wizardens rytm: Nästa → Spara. */}

      <p className="sr-only" role="status" aria-live="polite">
        {isCopied ? t('coverLetter.write.copiedAria', 'Brevet är kopierat.') : ''}
      </p>
    </div>
  )
}

// B21 (2026-08-09): `mockGenerateLetter` är borttagen med flit.
//
// Den producerade ett mallbrev med kvarvarande platshållare (`[ Ditt namn ]`)
// och insplitsad CV-text mitt i meningar, som visades märkt som AI-genererat när
// AI-anropet fallerade. Återinför den inte som "bättre än ingenting" — ett brev
// användaren tror är skrivet åt hen, men som är en mall, är sämre än ett tomt
// läge med en återförsöksknapp. Se `generateLetter` ovan och ROADMAP B21/B31.

export default CoverLetterWrite
