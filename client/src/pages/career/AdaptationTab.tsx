/**
 * Adaptation Tab - Comprehensive workplace adaptation and support
 * Features: 7 categories, status tracking, AI recommendations, templates, export
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Accessibility, FileText, Building2,
  ChevronRight, HelpCircle, X,
  Zap, Users, Clock, Layout, Loader2, Cloud, CloudOff,
  Monitor, MessageSquare, Thermometer, Star, Calendar,
  ExternalLink, Sparkles, Copy, Mail, Stethoscope,
  Scale, ChevronDown, AlertCircle
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { adaptationsApi, type AdaptationItem } from '@/services/careerApi'
import { callAI, AiConsentRequiredError } from '@/services/aiApi'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { AiConsentGate } from '@/components/ai/AiConsentGate'
import { showToast } from '@/components/Toast'

// ===== CATEGORY DEFINITIONS =====

const categoryDefs = [
  {
    id: 'physical',
    titleKey: 'career.adaptation.categories.physical.title',
    descriptionKey: 'career.adaptation.categories.physical.description',
    icon: Zap,
    color: 'amber',
    options: [
      { key: 'chair', labelSv: 'Ergonomisk stol', labelEn: 'Ergonomic chair' },
      { key: 'desk', labelSv: 'Höj- och sänkbart skrivbord', labelEn: 'Height-adjustable desk' },
      { key: 'lighting', labelSv: 'Anpassad belysning', labelEn: 'Adjusted lighting' },
      { key: 'hearing', labelSv: 'Hörselhjälpmedel', labelEn: 'Hearing aids' },
      { key: 'vision', labelSv: 'Synhjälpmedel / större skärm', labelEn: 'Vision aids / larger screen' },
      { key: 'soundproofing', labelSv: 'Ljuddämpande åtgärder', labelEn: 'Soundproofing measures' },
      { key: 'footrest', labelSv: 'Fotstöd', labelEn: 'Footrest' },
      { key: 'keyboard', labelSv: 'Ergonomiskt tangentbord/mus', labelEn: 'Ergonomic keyboard/mouse' },
    ],
  },
  {
    id: 'cognitive',
    titleKey: 'career.adaptation.categories.cognitive.title',
    descriptionKey: 'career.adaptation.categories.cognitive.description',
    icon: Layout,
    color: 'violet',
    options: [
      { key: 'writtenInstructions', labelSv: 'Skriftliga instruktioner', labelEn: 'Written instructions' },
      { key: 'reminders', labelSv: 'Påminnelsesystem', labelEn: 'Reminder systems' },
      { key: 'structuredTasks', labelSv: 'Strukturerade uppgifter', labelEn: 'Structured tasks' },
      { key: 'notes', labelSv: 'Anteckningsstöd', labelEn: 'Note-taking support' },
      { key: 'checklists', labelSv: 'Checklistor', labelEn: 'Checklists' },
      { key: 'quietEnvironment', labelSv: 'Lugn arbetsmiljö', labelEn: 'Quiet work environment' },
      { key: 'extraTime', labelSv: 'Extra tid för uppgifter', labelEn: 'Extra time for tasks' },
      { key: 'breakReminders', labelSv: 'Pausförslag/påminnelser', labelEn: 'Break reminders' },
    ],
  },
  {
    id: 'organizational',
    titleKey: 'career.adaptation.categories.organizational.title',
    descriptionKey: 'career.adaptation.categories.organizational.description',
    icon: Clock,
    color: 'blue',
    options: [
      { key: 'flextime', labelSv: 'Flextid', labelEn: 'Flexible hours' },
      { key: 'partTime', labelSv: 'Deltidsarbete', labelEn: 'Part-time work' },
      { key: 'remote', labelSv: 'Distansarbete', labelEn: 'Remote work' },
      { key: 'shorterDays', labelSv: 'Kortare arbetsdagar', labelEn: 'Shorter work days' },
      { key: 'longerBreaks', labelSv: 'Längre raster', labelEn: 'Longer breaks' },
      { key: 'gradualReturn', labelSv: 'Successiv återgång', labelEn: 'Gradual return to work' },
      { key: 'predictableSchedule', labelSv: 'Förutsägbart schema', labelEn: 'Predictable schedule' },
      { key: 'reducedTravel', labelSv: 'Minskade resor', labelEn: 'Reduced travel' },
    ],
  },
  {
    id: 'social',
    titleKey: 'career.adaptation.categories.social.title',
    descriptionKey: 'career.adaptation.categories.social.description',
    icon: Users,
    color: 'pink',
    options: [
      { key: 'feedback', labelSv: 'Regelbunden feedback', labelEn: 'Regular feedback' },
      { key: 'checkins', labelSv: 'Dagliga avstämningar', labelEn: 'Daily check-ins' },
      { key: 'mentor', labelSv: 'Mentor/handledare', labelEn: 'Mentor/supervisor' },
      { key: 'smallTeam', labelSv: 'Mindre arbetsgrupp', labelEn: 'Smaller work team' },
      { key: 'expectations', labelSv: 'Tydliga förväntningar', labelEn: 'Clear expectations' },
      { key: 'conflict', labelSv: 'Konflikthanteringsstöd', labelEn: 'Conflict resolution support' },
      { key: 'socialSupport', labelSv: 'Socialt stöd/fadder', labelEn: 'Social support/buddy' },
      { key: 'reducedMeetings', labelSv: 'Färre möten', labelEn: 'Fewer meetings' },
    ],
  },
  {
    id: 'technical',
    titleKey: 'career.adaptation.categories.technical.title',
    descriptionKey: 'career.adaptation.categories.technical.description',
    icon: Monitor,
    color: 'emerald',
    options: [
      { key: 'screenReader', labelSv: 'Skärmläsare', labelEn: 'Screen reader' },
      { key: 'voiceControl', labelSv: 'Röststyrning', labelEn: 'Voice control' },
      { key: 'textToSpeech', labelSv: 'Text-till-tal', labelEn: 'Text-to-speech' },
      { key: 'speechToText', labelSv: 'Tal-till-text / diktering', labelEn: 'Speech-to-text / dictation' },
      { key: 'specialSoftware', labelSv: 'Specialanpassad programvara', labelEn: 'Specialized software' },
      { key: 'largeDisplay', labelSv: 'Stor bildskärm', labelEn: 'Large display' },
      { key: 'colorSettings', labelSv: 'Anpassade färginställningar', labelEn: 'Custom color settings' },
      { key: 'alternativeInput', labelSv: 'Alternativa inmatningsenheter', labelEn: 'Alternative input devices' },
    ],
  },
  {
    id: 'communication',
    titleKey: 'career.adaptation.categories.communication.title',
    descriptionKey: 'career.adaptation.categories.communication.description',
    icon: MessageSquare,
    color: 'cyan',
    options: [
      { key: 'emailPreference', labelSv: 'Mejl istället för telefon', labelEn: 'Email instead of phone' },
      { key: 'asyncCommunication', labelSv: 'Asynkron kommunikation', labelEn: 'Asynchronous communication' },
      { key: 'writtenSummaries', labelSv: 'Skriftliga sammanfattningar', labelEn: 'Written summaries' },
      { key: 'advanceNotice', labelSv: 'Förvarning inför möten', labelEn: 'Advance notice for meetings' },
      { key: 'meetingAgenda', labelSv: 'Dagordning i förväg', labelEn: 'Meeting agenda in advance' },
      { key: 'oneOnOne', labelSv: 'Enskilda samtal istället för grupp', labelEn: 'One-on-one instead of group' },
      { key: 'interpreter', labelSv: 'Tolk/översättare', labelEn: 'Interpreter/translator' },
      { key: 'videoOff', labelSv: 'Kamera av vid videomöten', labelEn: 'Camera off in video meetings' },
    ],
  },
  {
    id: 'environmental',
    titleKey: 'career.adaptation.categories.environmental.title',
    descriptionKey: 'career.adaptation.categories.environmental.description',
    icon: Thermometer,
    color: 'orange',
    options: [
      { key: 'temperature', labelSv: 'Anpassad temperatur', labelEn: 'Adjusted temperature' },
      { key: 'airQuality', labelSv: 'Luftkvalitet / ventilation', labelEn: 'Air quality / ventilation' },
      { key: 'scentFree', labelSv: 'Doftfri miljö', labelEn: 'Scent-free environment' },
      { key: 'naturalLight', labelSv: 'Naturligt ljus', labelEn: 'Natural light' },
      { key: 'privateSpace', labelSv: 'Eget rum / avskild plats', labelEn: 'Private room / secluded space' },
      { key: 'accessibleLocation', labelSv: 'Tillgänglig placering', labelEn: 'Accessible location' },
      { key: 'restArea', labelSv: 'Tillgång till viloområde', labelEn: 'Access to rest area' },
      { key: 'animalFree', labelSv: 'Djurfri miljö', labelEn: 'Animal-free environment' },
    ],
  },
]

// ===== STATUS OPTIONS =====

const statusOptions = [
  { value: 'identified', labelSv: 'Identifierad', labelEn: 'Identified', color: 'gray' },
  { value: 'requested', labelSv: 'Begärd', labelEn: 'Requested', color: 'amber' },
  { value: 'granted', labelSv: 'Beviljad', labelEn: 'Granted', color: 'green' },
  { value: 'denied', labelSv: 'Nekad', labelEn: 'Denied', color: 'red' },
  { value: 'active', labelSv: 'Aktiv/Används', labelEn: 'Active/In Use', color: 'blue' },
] as const

// ===== EXTERNAL RESOURCES =====

/**
 * Länkar till myndigheter. **Kontrollerade 2026-08-21 — alla svarar 200.**
 *
 * Tre av de fem som stod här gav 404: Arbetsmiljöverkets föreskriftssida
 * (strukturen ändrades i regelreformen som gäller från 1 januari 2025),
 * Arbetsförmedlingens "stöd vid funktionsnedsättning" och deras
 * "anpassningsstöd" för arbetsgivare. Försäkringskassans blankettlänk gav
 * också 404. En person som klickar vidare för att söka ett bidrag hamnade
 * alltså på myndighetens felsida — sämsta tänkbara utfall för just den här
 * målgruppen.
 *
 * En femte post hette "Hjälpmedelsinstitutet". Den myndigheten lades ned
 * 2014; uppgifterna gick till Myndigheten för delaktighet, vilket URL:en
 * faktiskt pekade på. Rubriken namngav alltså en organisation som varit
 * nedlagd i tolv år.
 *
 * ÄNDRAR DU EN LÄNK: kör den mot `curl -o /dev/null -w "%{http_code}" -L` och
 * flytta fram `LANKARNA_KONTROLLERADES`. `npm run lint:links` ser bara interna
 * mål — externa länkar ruttnar tyst.
 */
export const LANKARNA_KONTROLLERADES = '2026-08-21'

const AF_STOD = 'https://arbetsformedlingen.se/for-arbetssokande/extra-stod/stod-a-o'

const externalResources = [
  {
    titleSv: 'Bidrag till hjälpmedel på arbetsplatsen',
    titleEn: 'Grant for workplace assistive equipment',
    url: `${AF_STOD}/bidrag-till-hjalpmedel-pa-arbetsplatsen`,
    descriptionSv: 'Arbetsförmedlingen — gäller dig som är arbetssökande eller nyanställd. Vad som gäller i ditt fall avgör de.',
    descriptionEn: 'Arbetsförmedlingen — for you who are job-seeking or newly employed. They decide what applies in your case.',
  },
  {
    titleSv: 'Bidrag för personligt biträde',
    titleEn: 'Grant for a personal assistant at work',
    url: `${AF_STOD}/bidrag-for-personligt-bitrade`,
    descriptionSv: 'Arbetsförmedlingen — stöd av en kollega eller extern person för sådant funktionsnedsättningen gör svårt.',
    descriptionEn: 'Arbetsförmedlingen — help from a colleague or an outside person with what the disability makes difficult.',
  },
  {
    titleSv: 'SIUS — stödperson vid introduktion',
    titleEn: 'SIUS — support person during onboarding',
    url: `${AF_STOD}/sarskild-stodperson-for-introduktions--och-uppfoljningsstod---sius`,
    descriptionSv: 'Arbetsförmedlingen — en person som följer med in på jobbet de första tiden och även stöttar arbetsgivaren.',
    descriptionEn: 'Arbetsförmedlingen — someone who follows you into the job at first, and supports the employer too.',
  },
  {
    titleSv: 'Lönebidrag',
    titleEn: 'Wage subsidy',
    url: `${AF_STOD}/lonebidrag`,
    descriptionSv: 'Arbetsförmedlingen — ersättning till arbetsgivaren. Vi anger medvetet inga belopp eller tak här; de ändras varje år.',
    descriptionEn: 'Arbetsförmedlingen — compensation to the employer. We deliberately give no amounts or caps here; they change every year.',
  },
  {
    titleSv: 'Arbetsmiljöverket om arbetsanpassning',
    titleEn: 'The Work Environment Authority on workplace adaptation',
    url: 'https://www.av.se/halsa-och-sakerhet/arbetsanpassning-individuella-atgarder/vagledning-om-arbetsanpassning/',
    descriptionSv: 'Vägledning om vad arbetsgivaren ska göra, och hur det ska gå till.',
    descriptionEn: 'Guidance on what the employer must do, and how it should be done.',
  },
  {
    titleSv: 'Försäkringskassan för dig med funktionsnedsättning',
    titleEn: 'Försäkringskassan for people with a disability',
    url: 'https://www.forsakringskassan.se/privatperson/vuxen-med-funktionsnedsattning',
    descriptionSv: 'Försäkringskassans hjälpmedelsbidrag förutsätter i normalfallet att du är anställd eller egen företagare. Är du arbetssökande går vägen via Arbetsförmedlingen.',
    descriptionEn: 'Försäkringskassan’s equipment grant normally requires that you are employed or self-employed. If you are job-seeking, the route goes via Arbetsförmedlingen.',
  },
  {
    titleSv: 'Diskrimineringsombudsmannen om arbetslivet',
    titleEn: 'The Equality Ombudsman on working life',
    url: 'https://www.do.se/jobbet-skolan-samhallet',
    descriptionSv: 'Vad som räknas som diskriminering på jobbet, och vad du kan göra.',
    descriptionEn: 'What counts as discrimination at work, and what you can do about it.',
  },
  {
    titleSv: 'Myndigheten för delaktighet (MFD)',
    titleEn: 'The Swedish Agency for Participation (MFD)',
    url: 'https://www.mfd.se/',
    descriptionSv: 'Kunskapsstöd om tillgänglighet och delaktighet. De handlägger inga bidrag.',
    descriptionEn: 'Knowledge support on accessibility and participation. They do not process grant applications.',
  },
]

// ===== DIALOG TEMPLATES =====

const dialogTemplates = {
  employer: {
    titleSv: 'Mall: Samtal med arbetsgivare',
    titleEn: 'Template: Conversation with employer',
    sections: [
      {
        headingSv: 'Inledning',
        headingEn: 'Introduction',
        contentSv: `Jag vill boka ett möte för att diskutera några anpassningar som skulle hjälpa mig att prestera bättre på jobbet. Det handlar om [kort beskrivning] och jag har förberett förslag på lösningar.`,
        contentEn: `I would like to schedule a meeting to discuss some accommodations that would help me perform better at work. It concerns [brief description] and I have prepared suggestions for solutions.`,
      },
      {
        headingSv: 'Beskriv behovet',
        headingEn: 'Describe the need',
        contentSv: `"Jag har märkt att [beskriv utmaningen] påverkar min arbetsförmåga. Med rätt anpassning tror jag att jag kan [beskriv förbättringen]."`,
        contentEn: `"I have noticed that [describe challenge] affects my work ability. With the right accommodation, I believe I can [describe improvement]."`,
      },
      {
        headingSv: 'Föreslå lösningar',
        headingEn: 'Suggest solutions',
        contentSv: `"Jag har tänkt på några möjliga lösningar:\n• [Anpassning 1]\n• [Anpassning 2]\n• [Anpassning 3]\n\nVilken av dessa tror du skulle fungera bäst här?"`,
        contentEn: `"I have thought of some possible solutions:\n• [Adaptation 1]\n• [Adaptation 2]\n• [Adaptation 3]\n\nWhich of these do you think would work best here?"`,
      },
      {
        headingSv: 'Referera till stöd',
        headingEn: 'Reference support',
        contentSv: `"Försäkringskassan och Arbetsförmedlingen har stödprogram som kan täcka kostnader för arbetshjälpmedel och anpassningar. Jag kan ta fram mer information om det."`,
        contentEn: `"The Social Insurance Agency and Employment Agency have support programs that can cover costs for work aids and accommodations. I can find more information about this."`,
      },
    ],
  },
  /*
    Mallen hette "Ansökan till Försäkringskassan" och listade fem punkter som
    FK:s faktiska krav — utan källa och utan årtal. Två problem: listan var
    påhittad, och den skickade fel person åt fel håll. FK:s bidrag till
    arbetshjälpmedel förutsätter i normalfallet anställning eller eget
    företag; för den som saknar arbete är det Arbetsförmedlingen som är rätt
    väg, och portalens målgrupp är arbetssökande. Mallen säger nu vart man
    ska vända sig och hjälper till med det den faktiskt kan hjälpa till med —
    att formulera sig. Kravlistan ersatt av en hänvisning. (2026-08-21)
  */
  fk: {
    titleSv: 'Mall: Så beskriver du vad du behöver',
    titleEn: 'Template: How to describe what you need',
    sections: [
      {
        headingSv: 'Först: vem ska du fråga?',
        headingEn: 'First: who should you ask?',
        contentSv: `Är du arbetssökande går vägen via Arbetsförmedlingen — prata med din handläggare.\n\nÄr du anställd eller egen företagare kan Försäkringskassan vara rätt, men arbetsgivaren har eget ansvar den första tiden i en anställning.\n\nVilka underlag som krävs bestäms av myndigheten och ändras över tid. Fråga dem — vi listar medvetet ingen kravlista här, eftersom en sådan blir gammal utan att någon märker det.`,
        contentEn: `If you are job-seeking, the route goes via Arbetsförmedlingen — talk to your case worker.\n\nIf you are employed or self-employed, Försäkringskassan may be right, but the employer has their own responsibility during the first period of an employment.\n\nWhich documents are required is decided by the authority and changes over time. Ask them — we deliberately list no requirements here, because such a list goes stale without anyone noticing.`,
      },
      {
        headingSv: 'Så skriver du ansökan',
        headingEn: 'How to write the application',
        contentSv: `"Jag ansöker om [hjälpmedel] för att kunna utföra mitt arbete som [yrkestitel]. På grund av [funktionsnedsättning/utmaning] har jag svårt att [specifik arbetsuppgift]. Med hjälpmedlet kan jag [förväntad förbättring]. Läkarintyg bifogas."`,
        contentEn: `"I am applying for [aid] to be able to perform my work as [job title]. Due to [disability/challenge], I have difficulty [specific task]. With the aid, I can [expected improvement]. Medical certificate attached."`,
      },
    ],
  },
  union: {
    titleSv: 'Mall: Samtal med facklig representant',
    titleEn: 'Template: Conversation with union representative',
    sections: [
      {
        headingSv: 'Förbered dessa frågor',
        headingEn: 'Prepare these questions',
        contentSv: `• Vilka rättigheter har jag enligt kollektivavtalet?\n• Kan facket vara med på mötet med arbetsgivaren?\n• Finns det tidigare fall att referera till?\n• Vad händer om arbetsgivaren nekar?`,
        contentEn: `• What rights do I have according to the collective agreement?\n• Can the union attend the meeting with the employer?\n• Are there previous cases to reference?\n• What happens if the employer refuses?`,
      },
      {
        headingSv: 'Dokumentation',
        headingEn: 'Documentation',
        contentSv: `Be facket hjälpa dig dokumentera:\n• Datum och innehåll i möten\n• Vad som sagts och avtalats\n• Eventuella tidsgränser för beslut`,
        contentEn: `Ask the union to help you document:\n• Dates and content of meetings\n• What was said and agreed\n• Any deadlines for decisions`,
      },
    ],
  },
  doctor: {
    titleSv: 'Mall: Läkarmöte/vårdbesök',
    titleEn: 'Template: Doctor/healthcare visit',
    sections: [
      {
        headingSv: 'Förbered innan mötet',
        headingEn: 'Prepare before the meeting',
        contentSv: `• Skriv ner dina symtom och hur de påverkar arbetet\n• Lista vilka anpassningar du tror behövs\n• Ta med dokumentation från arbetsgivaren\n• Förbered frågor om intyg`,
        contentEn: `• Write down your symptoms and how they affect work\n• List what accommodations you think are needed\n• Bring documentation from employer\n• Prepare questions about certificates`,
      },
      {
        headingSv: 'Frågor att ställa',
        headingEn: 'Questions to ask',
        contentSv: `• "Kan du skriva ett intyg som beskriver mina behov?"\n• "Vilka anpassningar rekommenderar du?"\n• "Finns det specialistmottagning jag kan kontakta?"\n• "Hur lång tid tar det att få ett intyg?"`,
        contentEn: `• "Can you write a certificate describing my needs?"\n• "What accommodations do you recommend?"\n• "Is there a specialist clinic I can contact?"\n• "How long does it take to get a certificate?"`,
      },
    ],
  },
}

// ===== MAIN COMPONENT =====

export default function AdaptationTab() {
  const { i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  // State
  const [selectedNeeds, setSelectedNeeds] = useState<Record<string, string[]>>({})
  const [adaptationDetails, setAdaptationDetails] = useState<Record<string, AdaptationItem>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiConversation, setAiConversation] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'select' | 'track' | 'templates' | 'resources' | 'export'>('select')

  // Cloud storage state
  const [isLoading, setIsLoading] = useState(true)
  /**
   * Det tredje läget. Utan det renderades ett tomt formulär efter ett läsfel,
   * omöjligt att skilja från "du har inte valt något än". Kryssade användaren
   * i en enda ruta skrev autosparet två sekunder senare ett `upsert` som
   * ersatte HELA den tidigare uppsättningen art. 9-uppgifter med en tom post.
   * Ett nätverksfel kostade alltså allt personen fyllt i om sin
   * funktionsnedsättning. Sparningen är nu blockerad tills en läsning lyckats.
   */
  const [loadError, setLoadError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  /** Sätts när ett spar begärdes medan ett annat pågick, så inget tappas. */
  const pendingSave = useRef(false)

  // Category titles (hardcoded for simplicity since translations may not exist yet)
  const categoryTitles: Record<string, { sv: string; en: string; desc: { sv: string; en: string } }> = {
    physical: { sv: 'Fysiska anpassningar', en: 'Physical Adaptations', desc: { sv: 'Hjälpmedel och ergonomi för kroppen', en: 'Aids and ergonomics for the body' } },
    cognitive: { sv: 'Kognitiva anpassningar', en: 'Cognitive Adaptations', desc: { sv: 'Stöd för koncentration, minne och struktur', en: 'Support for concentration, memory and structure' } },
    organizational: { sv: 'Organisatoriska anpassningar', en: 'Organizational Adaptations', desc: { sv: 'Flexibilitet i arbetstid och upplägg', en: 'Flexibility in work hours and setup' } },
    social: { sv: 'Sociala anpassningar', en: 'Social Adaptations', desc: { sv: 'Stöd i samarbete och kommunikation', en: 'Support in collaboration and communication' } },
    technical: { sv: 'Tekniska anpassningar', en: 'Technical Adaptations', desc: { sv: 'Programvara och digitala hjälpmedel', en: 'Software and digital aids' } },
    communication: { sv: 'Kommunikationsanpassningar', en: 'Communication Adaptations', desc: { sv: 'Hur du föredrar att kommunicera', en: 'How you prefer to communicate' } },
    environmental: { sv: 'Miljöanpassningar', en: 'Environmental Adaptations', desc: { sv: 'Fysisk arbetsmiljö och omgivning', en: 'Physical work environment and surroundings' } },
  }

  // Load adaptations from cloud on mount
  useEffect(() => {
    const loadAdaptations = async () => {
      try {
        const data = await adaptationsApi.get()
        if (data) {
          setSelectedNeeds({
            physical: data.physical_adaptations || [],
            cognitive: data.cognitive_adaptations || [],
            organizational: data.organizational_adaptations || [],
            social: data.social_adaptations || [],
            technical: data.technical_adaptations || [],
            communication: data.communication_adaptations || [],
            environmental: data.environmental_adaptations || [],
          })
          setAdaptationDetails(data.adaptation_details || {})
          setLastSaved(new Date(data.updated_at))
        }
      } catch (err) {
        console.error('Failed to load adaptations:', err)
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }
    loadAdaptations()
  }, [])

  // Auto-save when changes are made (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges || isLoading || loadError) return

    const saveTimeout = setTimeout(async () => {
      await saveToCloud()
    }, 2000)

    return () => clearTimeout(saveTimeout)
  }, [selectedNeeds, adaptationDetails, hasUnsavedChanges, isLoading, loadError])

  const saveToCloud = useCallback(async () => {
    if (loadError) return // skriv aldrig över molnet med ett tillstånd vi inte läst
    // `if (isSaving) return` utan ombokning lät ett köat spar försvinna tyst:
    // hasUnsavedChanges blev kvar true men ingen ny timeout startade förrän
    // användaren råkade ändra något igen.
    if (isSaving) { pendingSave.current = true; return }

    setIsSaving(true)
    try {
      const summary = generateSummaryText()
      await adaptationsApi.save({
        physical_adaptations: selectedNeeds.physical || [],
        cognitive_adaptations: selectedNeeds.cognitive || [],
        organizational_adaptations: selectedNeeds.organizational || [],
        social_adaptations: selectedNeeds.social || [],
        technical_adaptations: selectedNeeds.technical || [],
        communication_adaptations: selectedNeeds.communication || [],
        environmental_adaptations: selectedNeeds.environmental || [],
        adaptation_details: adaptationDetails,
        summary
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error('Failed to save adaptations:', err)
      showToast.error(isEn ? 'Failed to save' : 'Kunde inte spara')
    } finally {
      setIsSaving(false)
      if (pendingSave.current) {
        pendingSave.current = false
        setHasUnsavedChanges(true) // bokar om debouncen ovan
      }
    }
  }, [selectedNeeds, adaptationDetails, isSaving, isEn, loadError])

  const generateSummaryText = useCallback(() => {
    const parts: string[] = []
    Object.entries(selectedNeeds).forEach(([catId, options]) => {
      const catTitle = categoryTitles[catId]
      if (catTitle && options.length > 0) {
        const cat = categoryDefs.find(c => c.id === catId)
        const optionLabels = options.map(o => {
          const opt = cat?.options.find(op => op.key === o)
          return isEn ? opt?.labelEn : opt?.labelSv
        }).filter(Boolean)
        parts.push(`${isEn ? catTitle.en : catTitle.sv}: ${optionLabels.join(', ')}`)
      }
    })
    return parts.join('\n')
  }, [selectedNeeds, isEn])

  const toggleOption = (categoryId: string, optionKey: string) => {
    setSelectedNeeds(prev => {
      const current = prev[categoryId] || []
      const updated = current.includes(optionKey)
        ? current.filter(o => o !== optionKey)
        : [...current, optionKey]
      return { ...prev, [categoryId]: updated }
    })
    // Initialize details for new selection
    if (!adaptationDetails[`${categoryId}-${optionKey}`]) {
      setAdaptationDetails(prev => ({
        ...prev,
        [`${categoryId}-${optionKey}`]: { key: optionKey, status: 'identified' }
      }))
    }
    setHasUnsavedChanges(true)
  }

  const updateAdaptationStatus = (categoryId: string, optionKey: string, status: AdaptationItem['status']) => {
    const detailKey = `${categoryId}-${optionKey}`
    setAdaptationDetails(prev => ({
      ...prev,
      [detailKey]: {
        ...prev[detailKey],
        key: optionKey,
        status,
        requestedDate: status === 'requested' ? new Date().toISOString().split('T')[0] : prev[detailKey]?.requestedDate,
        grantedDate: status === 'granted' || status === 'active' ? new Date().toISOString().split('T')[0] : prev[detailKey]?.grantedDate,
      }
    }))
    setHasUnsavedChanges(true)
  }

  const updateAdaptationRating = (categoryId: string, optionKey: string, rating: number) => {
    const detailKey = `${categoryId}-${optionKey}`
    setAdaptationDetails(prev => ({
      ...prev,
      [detailKey]: { ...prev[detailKey], key: optionKey, status: prev[detailKey]?.status || 'identified', rating }
    }))
    setHasUnsavedChanges(true)
  }

  // AI Recommendations — ärlig felhantering: visar fel i stället för att
  // maskera med statisk text som ser ut som ett AI-svar
  const generateAIRecommendations = async () => {
    setAiLoading(true)
    try {
      const summary = generateSummaryText()
      const data = await callAI<string>('adaptation-recommendations', {
        selectedAdaptations: summary,
        language: i18n.language,
      })
      const recommendations = (data as { recommendations?: string }).recommendations
      if (!recommendations) {
        throw new Error('Tomt AI-svar')
      }
      setAiRecommendations(recommendations)
    } catch (err) {
      console.error('AI error:', err)
      setAiRecommendations(null)
      showToast.error(err instanceof AiConsentRequiredError || (err instanceof Error && err.message.includes('många'))
        ? err.message
        : (isEn ? 'Could not generate recommendations right now. Please try again.' : 'Kunde inte generera rekommendationer just nu. Försök igen.'))
    } finally {
      setAiLoading(false)
    }
  }

  // AI Conversation Script
  const generateAIConversation = async () => {
    setAiLoading(true)
    try {
      const summary = generateSummaryText()
      const data = await callAI<string>('adaptation-conversation', {
        selectedAdaptations: summary,
        language: i18n.language,
      })
      const conversation = (data as { conversation?: string }).conversation
      if (!conversation) {
        throw new Error('Tomt AI-svar')
      }
      setAiConversation(conversation)
    } catch (err) {
      console.error('AI error:', err)
      setAiConversation(null)
      showToast.error(err instanceof AiConsentRequiredError || (err instanceof Error && err.message.includes('många'))
        ? err.message
        : (isEn ? 'Could not generate a script right now. Please try again.' : 'Kunde inte generera samtalsmanus just nu. Försök igen.'))
    } finally {
      setAiLoading(false)
    }
  }

  // Export functions
  const generateDocument = (format: 'text' | 'letter' | 'plan') => {
    const summary = generateSummaryText()
    if (!summary) {
      showToast.error(isEn ? 'Select at least one adaptation first' : 'Välj minst en anpassning först')
      return
    }

    const date = new Date().toLocaleDateString(isEn ? 'en-SE' : 'sv-SE')
    let document = ''

    if (format === 'text') {
      document = `${isEn ? 'WORKPLACE ADAPTATIONS - PERSONAL SUMMARY' : 'ARBETSPLATSANPASSNINGAR - PERSONLIG SAMMANFATTNING'}
================================
${isEn ? 'Date' : 'Datum'}: ${date}

${summary}

================================
${isEn ? 'Generated from Jobin.se' : 'Genererat från Jobin.se'}`
    } else if (format === 'letter') {
      document = `${isEn ? 'FORMAL REQUEST FOR WORKPLACE ACCOMMODATIONS' : 'FORMELL BEGÄRAN OM ARBETSPLATSANPASSNINGAR'}

${isEn ? 'Date' : 'Datum'}: ${date}

${isEn ? 'To' : 'Till'}: [${isEn ? 'Employer/HR Manager' : 'Arbetsgivare/HR-chef'}]
${isEn ? 'From' : 'Från'}: [${isEn ? 'Your name' : 'Ditt namn'}]
${isEn ? 'Subject' : 'Ämne'}: ${isEn ? 'Request for Workplace Accommodations' : 'Begäran om arbetsplatsanpassningar'}

${isEn ? 'Dear' : 'Bästa'} [${isEn ? 'Name' : 'Namn'}],

${isEn
  ? 'I am writing to formally request the following workplace accommodations to help me perform my job duties more effectively:'
  : 'Jag skriver för att formellt begära följande arbetsplatsanpassningar för att hjälpa mig utföra mina arbetsuppgifter mer effektivt:'}

${summary}

${isEn
  ? 'I am happy to discuss these accommodations and explore solutions that work for both parties. Please note that subsidies may be available through the Social Insurance Agency (Försäkringskassan) and the Employment Agency (Arbetsförmedlingen) to cover implementation costs.'
  : 'Jag diskuterar gärna dessa anpassningar och utforskar lösningar som fungerar för båda parter. Observera att bidrag kan finnas tillgängliga via Försäkringskassan och Arbetsförmedlingen för att täcka implementeringskostnader.'}

${isEn ? 'I look forward to your response.' : 'Jag ser fram emot ditt svar.'}

${isEn ? 'Sincerely' : 'Med vänliga hälsningar'},
[${isEn ? 'Your name' : 'Ditt namn'}]`
    } else if (format === 'plan') {
      const statusGroups: Record<string, string[]> = {
        identified: [],
        requested: [],
        granted: [],
        active: [],
      }

      Object.entries(selectedNeeds).forEach(([catId, options]) => {
        options.forEach(opt => {
          const detail = adaptationDetails[`${catId}-${opt}`]
          const status = detail?.status || 'identified'
          const cat = categoryDefs.find(c => c.id === catId)
          const optLabel = cat?.options.find(o => o.key === opt)
          const label = isEn ? optLabel?.labelEn : optLabel?.labelSv
          if (label && statusGroups[status]) {
            statusGroups[status].push(label)
          }
        })
      })

      document = `${isEn ? 'ADAPTATION IMPLEMENTATION PLAN' : 'IMPLEMENTERINGSPLAN FÖR ANPASSNINGAR'}
================================
${isEn ? 'Date' : 'Datum'}: ${date}

${isEn ? '## PHASE 1: Identified (To Be Requested)' : '## FAS 1: Identifierade (Att begära)'}
${statusGroups.identified.length > 0 ? statusGroups.identified.map(a => `• ${a}`).join('\n') : (isEn ? 'None' : 'Inga')}

${isEn ? '## PHASE 2: Requested (Awaiting Response)' : '## FAS 2: Begärda (Väntar på svar)'}
${statusGroups.requested.length > 0 ? statusGroups.requested.map(a => `• ${a}`).join('\n') : (isEn ? 'None' : 'Inga')}

${isEn ? '## PHASE 3: Granted (To Be Implemented)' : '## FAS 3: Beviljade (Att implementera)'}
${statusGroups.granted.length > 0 ? statusGroups.granted.map(a => `• ${a}`).join('\n') : (isEn ? 'None' : 'Inga')}

${isEn ? '## PHASE 4: Active (Currently In Use)' : '## FAS 4: Aktiva (Används nu)'}
${statusGroups.active.length > 0 ? statusGroups.active.map(a => `• ${a}`).join('\n') : (isEn ? 'None' : 'Inga')}

================================
${isEn ? 'Next Steps:' : 'Nästa steg:'}
1. ${isEn ? 'Review identified adaptations with employer' : 'Gå igenom identifierade anpassningar med arbetsgivare'}
2. ${isEn ? 'Submit formal requests for priority items' : 'Skicka in formella begäranden för prioriterade punkter'}
3. ${isEn ? 'Follow up on pending requests' : 'Följ upp väntande begäranden'}
4. ${isEn ? 'Evaluate effectiveness of active adaptations' : 'Utvärdera effektivitet av aktiva anpassningar'}`
    }

    // Download file
    const blob = new Blob([document], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `anpassningar-${format}-${date}.txt`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast.success(isEn ? 'Document downloaded!' : 'Dokument nedladdat!')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast.success(isEn ? 'Copied to clipboard!' : 'Kopierat till urklipp!')
  }

  const clearAll = async () => {
    if (!window.confirm(isEn ? 'Are you sure you want to clear all selections?' : 'Är du säker på att du vill rensa alla val?')) {
      return
    }
    /*
      State nollställdes tidigare FÖRE anropet och felet loggades bara. Efter
      ett misslyckat anrop såg användaren en tom lista och trodde att
      uppgifterna om sin funktionsnedsättning var borta — i databasen låg de
      kvar. Det är ett art. 17-löfte som inte hölls, inte bara en UX-miss.
      Nu raderas först, och state nollställs bara om raderingen lyckades.
    */
    const tidigareVal = selectedNeeds
    const tidigareDetaljer = adaptationDetails
    try {
      await adaptationsApi.delete()
      setSelectedNeeds({})
      setAdaptationDetails({})
      setLastSaved(null)
      setHasUnsavedChanges(false)
      showToast.success(isEn ? 'All cleared' : 'Allt rensat')
    } catch (err) {
      console.error('Failed to clear adaptations:', err)
      setSelectedNeeds(tidigareVal)
      setAdaptationDetails(tidigareDetaljer)
      showToast.error(isEn
        ? 'Could not clear your choices. They are still saved.'
        : 'Kunde inte rensa dina val. De ligger kvar sparade.')
    }
  }

  const totalSelected = Object.values(selectedNeeds).flat().length
  const categoriesWithSelections = Object.keys(selectedNeeds).filter(id => selectedNeeds[id]?.length > 0).length

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)] mr-3" aria-hidden="true" />
        <span className="text-gray-600 dark:text-gray-400">
          {isEn ? 'Loading your adaptations...' : 'Laddar dina anpassningar...'}
        </span>
      </div>
    )
  }

  // Tredje läget. Ett tomt formulär efter ett läsfel ser ut som "du har inte
  // valt något än" — och nästa kryss skriver över allt i molnet.
  if (loadError) {
    return (
      <Card className="p-8 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {isEn ? 'Could not load your adaptations' : 'Kunde inte hämta dina anpassningar'}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mb-4 max-w-md mx-auto">
          {isEn
            ? 'Nothing has been changed — what you saved earlier is still there. Reload the page and try again.'
            : 'Ingenting har ändrats — det du sparat tidigare ligger kvar. Ladda om sidan och försök igen.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          {isEn ? 'Try again' : 'Försök igen'}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['select', 'track', 'templates', 'resources', 'export'].map((view) => (
            <Button
              key={view}
              variant={activeView === view ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView(view as typeof activeView)}
              className={cn(
                'text-sm',
                activeView === view && 'bg-[var(--c-solid)] hover:bg-[var(--c-text)]'
              )}
            >
              {view === 'select' && (isEn ? 'Select' : 'Välj')}
              {view === 'track' && (isEn ? 'Track' : 'Spåra')}
              {view === 'templates' && (isEn ? 'Templates' : 'Mallar')}
              {view === 'resources' && (isEn ? 'Resources' : 'Resurser')}
              {view === 'export' && (isEn ? 'Export' : 'Exportera')}
            </Button>
          ))}
        </div>
        {/* Sparstatusen vaxlade tyst mellan tre lagen i en <div> utan roll. */}
        <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
          {isSaving ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-[var(--c-solid)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEn ? 'Saving...' : 'Sparar...'}
            </span>
          ) : hasUnsavedChanges ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-[var(--c-solid)]">
              <CloudOff className="w-4 h-4" />
              {isEn ? 'Unsaved changes' : 'Osparade ändringar'}
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 text-[var(--c-text)] dark:text-[var(--c-text)]">
              <Cloud className="w-4 h-4" />
              {isEn ? 'Saved' : 'Sparat'}
            </span>
          ) : null}
        </div>
      </div>

      {/* Progress Summary */}
      {totalSelected > 0 && (
        <Card className="p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                {isEn ? 'Your Adaptations' : 'Dina anpassningar'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalSelected} {isEn ? 'selected across' : 'valda i'} {categoriesWithSelections} {isEn ? 'categories' : 'kategorier'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                AI
              </Button>
              {/* Knappen raderar allt användaren fyllt i om sin
                  funktionsnedsättning och hade inget tillgängligt namn alls —
                  en skärmläsare läste bara "knapp". */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="text-red-600 hover:text-red-700"
                aria-label={isEn ? 'Clear all your choices' : 'Rensa alla dina val'}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">{isEn ? 'Clear all your choices' : 'Rensa alla dina val'}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Panel */}
      {showAIPanel && (
        <Card className="p-6 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--c-solid)]" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              {isEn ? 'AI Assistant' : 'AI-assistent'}
            </h3>
          </div>
          {/* UX13: valda anpassningsbehov beskriver funktionsnedsättning —
              art. 9-data. Utan AI-samtycke visas grinden i stället för
              knapparna, och ingenting skickas till AI-leverantören. */}
          <AiConsentGate compact featureName={isEn ? 'Adaptation assistant' : 'AI-assistenten för anpassningar'}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Button
                onClick={generateAIRecommendations}
                disabled={aiLoading || totalSelected === 0}
                className="w-full mb-2"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEn ? 'Get Recommendations' : 'Få rekommendationer'}
              </Button>
              {aiRecommendations && (
                <div className="p-3 bg-white dark:bg-stone-800 rounded-lg text-sm" data-ai-generated="true">
                  <p className="whitespace-pre-wrap">{aiRecommendations}</p>
                  <AIGeneratedWatermark contentType={isEn ? 'recommendation' : 'förslag'} />
                </div>
              )}
            </div>
            <div>
              <Button
                onClick={generateAIConversation}
                disabled={aiLoading || totalSelected === 0}
                className="w-full mb-2"
                variant="outline"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEn ? 'Generate Conversation Script' : 'Generera samtalsmanuskript'}
              </Button>
              {aiConversation && (
                <div className="p-3 bg-white dark:bg-stone-800 rounded-lg text-sm" data-ai-generated="true">
                  <p className="whitespace-pre-wrap text-xs">{aiConversation}</p>
                  <AIGeneratedWatermark contentType={isEn ? 'script' : 'manus'} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(aiConversation)}
                    className="mt-2"
                  >
                    <Copy className="w-3 h-3 mr-1" /> {isEn ? 'Copy' : 'Kopiera'}
                  </Button>
                </div>
              )}
            </div>
          </div>
          </AiConsentGate>
        </Card>
      )}

      {/* VIEW: Select Adaptations */}
      {activeView === 'select' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                <Accessibility className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {isEn ? 'Identify Your Needs' : 'Identifiera dina behov'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {isEn
                    ? 'Select adaptations that would help you work more effectively. You can track their status and export documentation.'
                    : 'Välj anpassningar som skulle hjälpa dig att arbeta mer effektivt. Du kan spåra deras status och exportera dokumentation.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {categoryDefs.map((category) => {
                const Icon = category.icon
                const catInfo = categoryTitles[category.id]
                const selectedCount = selectedNeeds[category.id]?.length || 0

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-all',
                        expandedCategory === category.id
                          ? 'border-[var(--c-solid)] dark:border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30'
                          : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]',
                        selectedCount > 0 && 'border-[var(--c-accent)] dark:border-[var(--c-solid)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          selectedCount > 0
                            ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-text)]'
                            : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400'
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                            {isEn ? catInfo.en : catInfo.sv}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isEn ? catInfo.desc.en : catInfo.desc.sv}
                          </p>
                          {selectedCount > 0 && (
                            <span className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] font-medium">
                              {selectedCount} {isEn ? 'selected' : 'valda'}
                            </span>
                          )}
                        </div>
                        <ChevronRight className={cn(
                          'w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform',
                          expandedCategory === category.id && 'rotate-90'
                        )} />
                      </div>
                    </button>

                    {expandedCategory === category.id && (
                      <div className="mt-2 p-4 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {category.options.map((option) => {
                            const isSelected = selectedNeeds[category.id]?.includes(option.key)
                            return (
                              <label
                                key={option.key}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                                  isSelected
                                    ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50'
                                    : 'hover:bg-stone-50 dark:hover:bg-stone-700'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleOption(category.id, option.key)}
                                  className="w-5 h-5 rounded border-stone-300 dark:border-stone-600 text-[var(--c-text)]"
                                />
                                <span className="text-gray-700 dark:text-gray-300 text-sm">
                                  {isEn ? option.labelEn : option.labelSv}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: Track Status */}
      {activeView === 'track' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {isEn ? 'Track Adaptation Status' : 'Spåra anpassningsstatus'}
            </h3>

            {totalSelected === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {isEn ? 'Select some adaptations first to track their status.' : 'Välj några anpassningar först för att spåra deras status.'}
              </p>
            ) : (
              <div className="space-y-4">
                {categoryDefs.map((category) => {
                  const selectedOptions = selectedNeeds[category.id] || []
                  if (selectedOptions.length === 0) return null

                  const catInfo = categoryTitles[category.id]
                  const Icon = category.icon

                  return (
                    <div key={category.id} className="border border-stone-200 dark:border-stone-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-5 h-5 text-[var(--c-text)]" />
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                          {isEn ? catInfo.en : catInfo.sv}
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {selectedOptions.map((optKey) => {
                          const option = category.options.find(o => o.key === optKey)
                          const detail = adaptationDetails[`${category.id}-${optKey}`] || { status: 'identified' }

                          return (
                            <div key={optKey} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                                  {isEn ? option?.labelEn : option?.labelSv}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Status: ${isEn ? option?.labelEn : option?.labelSv}`}
                                  value={detail.status}
                                  onChange={(e) => updateAdaptationStatus(category.id, optKey, e.target.value as AdaptationItem['status'])}
                                  className="text-xs px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                                >
                                  {statusOptions.map((status) => (
                                    <option key={status.value} value={status.value}>
                                      {isEn ? status.labelEn : status.labelSv}
                                    </option>
                                  ))}
                                </select>
                                {(detail.status === 'active' || detail.status === 'granted') && (
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => updateAdaptationRating(category.id, optKey, star)}
                                        className={cn(
                                          'w-5 h-5',
                                          (detail.rating || 0) >= star ? 'text-[var(--c-solid)]' : 'text-gray-300'
                                        )}
                                      >
                                        <Star className="w-4 h-4 fill-current" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* VIEW: Templates */}
      {activeView === 'templates' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {isEn ? 'Dialog Templates' : 'Dialogmallar'}
            </h3>
            <div className="space-y-3">
              {Object.entries(dialogTemplates).map(([key, template]) => (
                <div key={key} className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === key ? null : key)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    <div className="flex items-center gap-3">
                      {key === 'employer' && <Building2 className="w-5 h-5 text-[var(--c-text)]" />}
                      {key === 'fk' && <FileText className="w-5 h-5 text-[var(--c-text)]" />}
                      {key === 'union' && <Scale className="w-5 h-5 text-[var(--c-solid)]" />}
                      {key === 'doctor' && <Stethoscope className="w-5 h-5 text-[var(--c-solid)]" />}
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {isEn ? template.titleEn : template.titleSv}
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      'w-5 h-5 text-gray-500 transition-transform',
                      expandedTemplate === key && 'rotate-180'
                    )} />
                  </button>
                  {expandedTemplate === key && (
                    <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50">
                      {template.sections.map((section, idx) => (
                        <div key={idx} className="mb-4 last:mb-0">
                          <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-2">
                            {isEn ? section.headingEn : section.headingSv}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                            {isEn ? section.contentEn : section.contentSv}
                          </p>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const text = template.sections.map(s =>
                            `${isEn ? s.headingEn : s.headingSv}\n${isEn ? s.contentEn : s.contentSv}`
                          ).join('\n\n')
                          copyToClipboard(text)
                        }}
                        className="mt-4"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {isEn ? 'Copy Template' : 'Kopiera mall'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: Resources */}
      {activeView === 'resources' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {isEn ? 'External Resources' : 'Externa resurser'}
            </h3>
            <div className="space-y-3">
              {externalResources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                        {isEn ? resource.titleEn : resource.titleSv}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isEn ? resource.descriptionEn : resource.descriptionSv}
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-[var(--c-text)] flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>

            {/* Rights Information */}
            <div className="mt-6 p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-[var(--c-text)] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {isEn ? 'Know Your Rights' : 'Känn till dina rättigheter'}
                  </h4>
                  {/*
                    Påståendet var kategoriskt ("skyldiga att anpassa vid
                    behov") medan skyldigheten i praktiken gäller SKÄLIGA
                    åtgärder — kvalifikationen dök upp först i andra meningen
                    och gällde där något annat. Nu står ordet i båda, med
                    lagrum och kontrolldatum, så nästa läsare kan verifiera.
                  */}
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isEn
                      ? 'Under Swedish law an employer must take reasonable measures to adapt the workplace: the Discrimination Act (2008:567, ch. 1 s. 4 and ch. 2) counts a failure to provide reasonable accessibility measures as discrimination, and the Work Environment Act (1977:1160, ch. 3 s. 3) requires the employer to adapt working conditions to the individual. What counts as reasonable is judged case by case.'
                      : 'Enligt svensk lag ska en arbetsgivare vidta skäliga åtgärder för att anpassa arbetsplatsen: diskrimineringslagen (2008:567, 1 kap. 4 § och 2 kap.) räknar bristande tillgänglighet som diskriminering, och arbetsmiljölagen (1977:1160, 3 kap. 3 §) kräver att arbetsförhållandena anpassas till den enskilda. Vad som är skäligt avgörs från fall till fall.'}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                    {isEn
                      ? `Checked ${LANKARNA_KONTROLLERADES}. Arbetsmiljöverket’s regulations on workplace adaptation were restructured in the rule reform in force since 1 January 2025 — check the current wording.`
                      : `Kontrollerat ${LANKARNA_KONTROLLERADES}. Arbetsmiljöverkets föreskrifter om arbetsanpassning fick ny struktur i regelreformen som gäller från 1 januari 2025 — kontrollera aktuell lydelse.`}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW: Export */}
      {activeView === 'export' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {isEn ? 'Export Documentation' : 'Exportera dokumentation'}
            </h3>

            {totalSelected === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {isEn ? 'Select some adaptations first to export documentation.' : 'Välj några anpassningar först för att exportera dokumentation.'}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  onClick={() => generateDocument('text')}
                  className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left"
                >
                  <FileText className="w-8 h-8 text-[var(--c-text)] mb-3" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {isEn ? 'Simple Summary' : 'Enkel sammanfattning'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isEn ? 'Text file with all selected adaptations' : 'Textfil med alla valda anpassningar'}
                  </p>
                </button>

                <button
                  onClick={() => generateDocument('letter')}
                  className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left"
                >
                  <Mail className="w-8 h-8 text-[var(--c-text)] mb-3" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {isEn ? 'Formal Letter' : 'Formellt brev'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isEn ? 'Professional request to employer' : 'Professionell begäran till arbetsgivare'}
                  </p>
                </button>

                <button
                  onClick={() => generateDocument('plan')}
                  className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-left"
                >
                  <Calendar className="w-8 h-8 text-[var(--c-solid)] mb-3" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {isEn ? 'Implementation Plan' : 'Implementeringsplan'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isEn ? 'Phased plan with status tracking' : 'Fasad plan med statusspårning'}
                  </p>
                </button>
              </div>
            )}

            {totalSelected > 0 && (
              <div className="mt-6 p-4 bg-stone-50 dark:bg-stone-700 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {isEn ? 'Preview' : 'Förhandsgranskning'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {generateSummaryText()}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
