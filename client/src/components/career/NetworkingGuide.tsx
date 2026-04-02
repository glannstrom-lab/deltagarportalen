import { useState, useEffect } from 'react'
import {
  Users,
  MessageCircle,
  Mail,
  Linkedin,
  Coffee,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
  Lightbulb,
  Target,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Tag,
  Search,
  Filter,
  Check,
  X,
  Send,
  Wand2,
  Briefcase,
  RefreshCw
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { networkApi, type NetworkContact } from '@/services/careerApi'
import { showToast } from '@/components/Toast'
import { COMMON_OCCUPATIONS } from './occupations'
import { callAI } from '@/services/aiApi'

interface NetworkTemplate {
  id: string
  title: string
  description: string
  template: string
  tips: string[]
}

const networkTemplates: NetworkTemplate[] = [
  {
    id: 'reconnect',
    title: 'Återkontakt med gammal kollega',
    description: 'Perfekt för att värma upp en gammal kontakt',
    template: `Hej [Namn]!

Det var länge sedan vi hördes! Jag hoppas allt är bra med dig.

Jag skriver för att jag just nu är på jakt efter nya möjligheter inom [område/bransch] och tänkte att jag skulle höra om du har några tips eller känner någon som skulle kunna vara intressant att prata med?

Det vore jättekul att få höra hur du har det också! Har du tid för en kaffe eller ett samtal någon dag?

Ha det bra!
[Ditt namn]`,
    tips: [
      'Nämns något specifikt ni gjort tillsammans för att väcka minnen',
      'Var tydlig med vad du söker men inte för krävande',
      'Föreslå ett konkret sätt att mötas'
    ]
  },
  {
    id: 'linkedin',
    title: 'LinkedIn-kontakt (kall)',
    description: 'För att kontakta någon du beundrar men inte känner',
    template: `Hej [Namn],

Jag heter [Ditt namn] och arbetar/intresserar mig för [kort beskrivning]. Jag har följt ditt arbete inom [specifikt område] och blev särskilt inspirerad av [specifik sak de gjort].

Just nu utforskar jag möjligheter inom [bransch/område] och skulle vara otroligt tacksam för 15 minuter av din tid för att höra om din resa och eventuellt få några råd.

Om du har möjlighet, skulle du kunna tänka dig ett kort samtal eller besvara några frågor via mejl?

Med vänliga hälsningar,
[Ditt namn]`,
    tips: [
      'Nämn något specifikt de gjort - visar att du gjort research',
      'Var respektfull för deras tid',
      'Gör det enkelt att säga ja (låg tröskel)'
    ]
  },
  {
    id: 'after-meeting',
    title: 'Uppföljning efter nätverksträff',
    description: 'För att befästa ett nytt kontakt efter event/möte',
    template: `Hej [Namn]!

Det var jättetrevligt att träffas på [event/möte] igår! Jag uppskattade särskilt vår diskussion om [specifikt ämne ni pratade om].

Som jag nämnde söker jag just nu [vad du söker] och skulle gärna vilja fortsätta vårt samtal. Du nämnde att du kände [namn/kontakt] - skulle du kunna tänka dig att förmedla en kontakt?

Oavsett önskar jag dig en fortsatt fin vecka!

Vänliga hälsningar,
[Ditt namn]

[LinkedIn-profil eller kontaktuppgifter]`,
    tips: [
      'Referera till något specifikt ni pratade om',
      'Påminn om eventuella löften eller leads',
      'Håll dörren öppen för framtida kontakt'
    ]
  },
  {
    id: 'thank-you',
    title: 'Tack efter tips/hjälp',
    description: 'För att visa uppskattning och hålla relationen varm',
    template: `Hej [Namn]!

Jag ville bara säga ett stort tack för att du tog dig tid att [vad de hjälpte med] förra veckan. Det betydde verkligen mycket för mig!

Jag har nu [vad du gjort med deras tips, t.ex. "kontaktat Maria som du rekommenderade" / "uppdaterat mitt CV enligt dina råd"] och känner mig mycket mer redo.

Jag återkommer gärna med en uppdatering om hur det går. Ha det så bra tills dess!

Varmt tack igen,
[Ditt namn]`,
    tips: [
      'Var specifik med vad du tackar för',
      'Berätta vad du gjort med deras råd',
      'Lämna en öppning för framtida kontakt'
    ]
  }
]

const networkingTips = [
  {
    title: 'Kvalitet över kvantitet',
    description: 'Det är bättre med 5 djupa relationer än 50 ytliga kontakter.',
    icon: Target
  },
  {
    title: 'Ge innan du ber',
    description: 'Erbjud hjälp eller värde innan du ber om något.',
    icon: Sparkles
  },
  {
    title: 'Följ upp regelbundet',
    description: 'En kort hälsning var 3:e månad håller relationen vid liv.',
    icon: Coffee
  },
  {
    title: 'Var genuin',
    description: 'Människor känner av äkta intresse. Var dig själv.',
    icon: Lightbulb
  }
]

// AI API call - uses authenticated client
async function generateNetworkingStrategyWithAI(data: {
  occupation: string;
  experienceLevel: 'entry' | 'mid' | 'senior';
  goals: string[];
}) {
  return callAI('networking', data);
}

// Generate custom message with AI - uses authenticated client
async function generateCustomMessageWithAI(data: {
  contactName: string;
  contactRole?: string;
  contactCompany?: string;
  messageType: 'initial' | 'followup' | 'thankyou';
  userOccupation: string;
  purpose: string;
  relationship: string;
}) {
  return callAI('networking', { ...data, generateMessage: true });
}

interface NetworkingStrategy {
  strategies: Array<{
    title: string;
    description: string;
    actions: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  targetContacts: Array<{
    type: string;
    description: string;
    whereToFind: string[];
  }>;
  linkedinTips: string[];
  conversationStarters: string[];
  followUpSchedule: Array<{
    timing: string;
    action: string;
  }>;
}

export default function NetworkingGuide() {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<NetworkContact['status'] | 'all'>('all')
  
  // AI States
  const [occupation, setOccupation] = useState('')
  const [occupationSuggestions, setOccupationSuggestions] = useState<string[]>([])
  const [showOccupationSuggestions, setShowOccupationSuggestions] = useState(false)
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior'>('mid')
  const [networkingGoals, setNetworkingGoals] = useState<string[]>(['job'])
  const [aiStrategy, setAiStrategy] = useState<NetworkingStrategy | null>(null)
  const [generatingStrategy, setGeneratingStrategy] = useState(false)
  const [showAIStrategy, setShowAIStrategy] = useState(false)
  
  // AI Message Generator States
  const [selectedContactForMessage, setSelectedContactForMessage] = useState<NetworkContact | null>(null)
  const [messageType, setMessageType] = useState<'initial' | 'followup' | 'thankyou'>('initial')
  const [messagePurpose, setMessagePurpose] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [generatingMessage, setGeneratingMessage] = useState(false)
  const [showMessageGenerator, setShowMessageGenerator] = useState(false)
  
  // Form state
  const [newContact, setNewContact] = useState<Partial<NetworkContact>>({
    name: '',
    company: '',
    role: '',
    email: '',
    linkedin_url: '',
    relationship: 'colleague',
    notes: '',
    status: 'active',
    tags: []
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await networkApi.getAll()
      setContacts(data)
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContact.name) return

    try {
      await networkApi.save({
        name: newContact.name,
        company: newContact.company || '',
        role: newContact.role || '',
        email: newContact.email || '',
        linkedin_url: newContact.linkedin_url || '',
        relationship: newContact.relationship || 'other',
        notes: newContact.notes || '',
        status: newContact.status || 'active',
        tags: newContact.tags || []
      })
      showToast.success('Kontakten tillagd!')
      setNewContact({
        name: '',
        company: '',
        role: '',
        email: '',
        linkedin_url: '',
        relationship: 'colleague',
        notes: '',
        status: 'active',
        tags: []
      })
      setShowAddForm(false)
      await loadContacts()
    } catch (error) {
      showToast.error('Kunde inte lägga till kontakten')
    }
  }

  const deleteContact = async (id: string) => {
    try {
      await networkApi.delete(id)
      showToast.success('Kontakten borttagen')
      await loadContacts()
    } catch (error) {
      showToast.error('Kunde inte ta bort kontakten')
    }
  }

  const markAsContacted = async (id: string) => {
    try {
      await networkApi.markContacted(id)
      showToast.success('Kontakten markerad som kontaktad')
      await loadContacts()
    } catch (error) {
      showToast.error('Kunde inte uppdatera kontakten')
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !newContact.tags?.includes(tagInput.trim())) {
      setNewContact({
        ...newContact,
        tags: [...(newContact.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewContact({
      ...newContact,
      tags: newContact.tags?.filter(tag => tag !== tagToRemove) || []
    })
  }

  const handleOccupationInput = (value: string) => {
    setOccupation(value)
    if (value.length >= 2) {
      const filtered = COMMON_OCCUPATIONS
        .filter(occ => occ.label.toLowerCase().includes(value.toLowerCase()))
        .map(occ => occ.label)
        .slice(0, 5)
      setOccupationSuggestions(filtered)
      setShowOccupationSuggestions(filtered.length > 0)
    } else {
      setShowOccupationSuggestions(false)
    }
  }

  const generateNetworkingStrategy = async () => {
    if (!occupation) {
      showToast.error('Välj ett yrke först')
      return
    }

    setGeneratingStrategy(true)
    try {
      const result = await generateNetworkingStrategyWithAI({
        occupation,
        experienceLevel,
        goals: networkingGoals
      })
      setAiStrategy(result)
      setShowAIStrategy(true)
      showToast.success('Nätverksstrategi genererad!')
    } catch (error) {
      showToast.error('Kunde inte generera strategi')
      // Fallback strategy
      setAiStrategy(getFallbackStrategy())
      setShowAIStrategy(true)
    } finally {
      setGeneratingStrategy(false)
    }
  }

  const generateCustomMessage = async () => {
    if (!selectedContactForMessage || !messagePurpose) {
      showToast.error('Fyll i alla fält')
      return
    }

    setGeneratingMessage(true)
    try {
      const result = await generateCustomMessageWithAI({
        contactName: selectedContactForMessage.name,
        contactRole: selectedContactForMessage.role,
        contactCompany: selectedContactForMessage.company,
        messageType,
        userOccupation: occupation || 'jobbsökande',
        purpose: messagePurpose,
        relationship: selectedContactForMessage.relationship || 'colleague'
      })
      setGeneratedMessage(result.message || result.customMessage || '')
    } catch (error) {
      showToast.error('Kunde inte generera meddelande')
      setGeneratedMessage(getFallbackMessage(selectedContactForMessage, messageType))
    } finally {
      setGeneratingMessage(false)
    }
  }

  const getFallbackStrategy = (): NetworkingStrategy => ({
    strategies: [
      {
        title: 'Börja med ditt befintliga nätverk',
        description: 'Kontakta gamla kollegor, klasskamrater och vänner. De känner dig redan och vill hjälpa.',
        actions: ['Gör en lista på 10 personer du känner', 'Skicka ett personligt meddelande', 'Be om 15 minuters rådgivningssamtal'],
        difficulty: 'easy'
      },
      {
        title: 'Optimera din LinkedIn-profil',
        description: 'Se till att din profil är professionell och synlig för rekryterare.',
        actions: ['Uppdatera rubriken med ditt mål', 'Skriv en sammanfattning som visar passion', 'Aktivera "Open to Work" om lämpligt'],
        difficulty: 'easy'
      },
      {
        title: 'Delta i branschevenemang',
        description: 'Nätverka på konferenser, meetups och seminarier i din bransch.',
        actions: ['Sök efter kommande evenemang', 'Förbered en 30-sekunders pitch', 'Följ upp med nya kontakter inom 24 timmar'],
        difficulty: 'medium'
      }
    ],
    targetContacts: [
      {
        type: 'Rekryterare',
        description: 'Specialister som hjälper företag att hitta rätt talanger',
        whereToFind: ['LinkedIn', 'Rekryteringsbyråer', 'Branschevenemang']
      },
      {
        type: 'Branschkollegor',
        description: 'Personer som arbetar i samma bransch och kan dela insikter',
        whereToFind: ['LinkedIn-grupper', 'Branschföreningar', 'Meetups']
      }
    ],
    linkedinTips: [
      'Skicka alltid ett personligt meddelande med connection requests',
      'Engagera dig i andras inlägg innan du ber om hjälp',
      'Dela med dig av din kunskap genom egna inlägg'
    ],
    conversationStarters: [
      'Vad är det mest spännande du arbetar med just nu?',
      'Hur kom du in i den här branschen?',
      'Vilka trender ser du inom vårt område just nu?'
    ],
    followUpSchedule: [
      { timing: 'Direkt efter mötet', action: 'Skicka ett tack-meddelande' },
      { timing: '1 vecka senare', action: 'Dela en intressant artikel relaterat till ert samtal' },
      { timing: '1 månad senare', action: 'Ge en kort uppdatering om dina framsteg' }
    ]
  })

  const getFallbackMessage = (contact: NetworkContact, type: string): string => {
    if (type === 'initial') {
      return `Hej ${contact.name}!

Jag hoppas allt är bra med dig. Jag söker just nu nya möjligheter och skulle väldigt gärna vilja höra om du har några tips eller råd att dela med dig av.

Det vore jättetrevligt att få prata en stund när du har möjlighet!

Vänliga hälsningar`
    } else if (type === 'followup') {
      return `Hej ${contact.name}!

Jag ville bara följa upp mitt tidigare meddelande. Jag skulle fortfarande jättegärna vilja prata med dig om möjligheterna inom branschen.

Hoppas vi kan höras snart!

Vänliga hälsningar`
    } else {
      return `Hej ${contact.name}!

Jag ville bara säga tack för att du tog dig tid att prata med mig. Dina råd betydde verkligen mycket!

Jag återkommer gärna med en uppdatering om hur det går.

Varmt tack igen!`
    }
  }

  const filteredContacts = filterStatus === 'all' 
    ? contacts 
    : contacts.filter(c => c.status === filterStatus)

  const getRelationshipLabel = (rel: string) => {
    const labels: Record<string, string> = {
      colleague: 'Kollega',
      friend: 'Vän',
      mentor: 'Mentor',
      recruiter: 'Rekryterare',
      other: 'Annat'
    }
    return labels[rel] || rel
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      dormant: 'bg-slate-100 text-slate-600',
      reconnect: 'bg-amber-100 text-amber-700'
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  }

  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text)
    if (id) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      showToast.success('Kopierat!')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <h2 className="text-2xl font-bold">Nätverkande</h2>
        </div>
        <p className="text-amber-100 max-w-2xl">
          70% av alla jobb tillsätts via nätverk. Här hittar du verktyg och mallar 
          för att bygga och underhålla professionella relationer.
        </p>
      </div>

      {/* AI Strategy Generator */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
            <Wand2 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Nätverksstrategi</h3>
            <p className="text-sm text-slate-600">Få en personlig nätverksplan med AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ditt yrke/mål *</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => handleOccupationInput(e.target.value)}
              placeholder="T.ex. Systemutvecklare"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {showOccupationSuggestions && (
              <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1">
                {occupationSuggestions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => {
                      setOccupation(occ)
                      setShowOccupationSuggestions(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-violet-50 text-sm"
                  >
                    {occ}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Erfarenhetsnivå</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="entry">Junior (0-2 år)</option>
              <option value="mid">Medel (3-7 år)</option>
              <option value="senior">Senior (8+ år)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mål med nätverkande</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'job', label: 'Hitta jobb' },
                { id: 'learn', label: 'Lära mig' },
                { id: 'collaborate', label: 'Samarbeta' }
              ].map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => {
                    if (networkingGoals.includes(goal.id)) {
                      setNetworkingGoals(networkingGoals.filter(g => g !== goal.id))
                    } else {
                      setNetworkingGoals([...networkingGoals, goal.id])
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    networkingGoals.includes(goal.id)
                      ? 'bg-violet-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateNetworkingStrategy}
          disabled={generatingStrategy || !occupation}
          className="w-full md:w-auto px-6 py-2.5 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generatingStrategy ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Skapar strategi...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generera nätverksstrategi
            </>
          )}
        </button>

        {/* AI Strategy Results */}
        {showAIStrategy && aiStrategy && (
          <div className="mt-6 space-y-6">
            {/* Strategies */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Target size={18} className="text-violet-500" />
                Strategier för dig
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiStrategy.strategies.map((strategy, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        strategy.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        strategy.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {strategy.difficulty === 'easy' ? 'Lätt' :
                         strategy.difficulty === 'medium' ? 'Medel' : 'Avancerad'}
                      </span>
                    </div>
                    <h5 className="font-medium text-slate-800 mb-1">{strategy.title}</h5>
                    <p className="text-sm text-slate-600 mb-3">{strategy.description}</p>
                    <ul className="space-y-1">
                      {strategy.actions.map((action, i) => (
                        <li key={i} className="text-sm text-slate-500 flex items-start gap-2">
                          <Check size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Contacts */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Users size={18} className="text-violet-500" />
                Vilka du bör kontakta
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiStrategy.targetContacts.map((contact, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200">
                    <h5 className="font-medium text-slate-800 mb-1">{contact.type}</h5>
                    <p className="text-sm text-slate-600 mb-2">{contact.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {contact.whereToFind.map((place, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Starters */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <MessageCircle size={18} className="text-violet-500" />
                Konversationsöppnare
              </h4>
              <div className="space-y-2">
                {aiStrategy.conversationStarters.map((starter, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">"{starter}"</span>
                    <button
                      onClick={() => handleCopy(starter)}
                      className="p-1.5 text-slate-400 hover:text-violet-500"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Linkedin className="text-blue-600" size={20} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Optimera LinkedIn</h3>
          <p className="text-sm text-slate-600">
            Se till att din profil är uppdaterad och professionell.
          </p>
          <a 
            href="#/cv" 
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3"
          >
            Gå till CV-byggaren <ChevronDown size={14} className="-rotate-90" />
          </a>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
            <Coffee className="text-emerald-600" size={20} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Informationsmöte</h3>
          <p className="text-sm text-slate-600">
            Be om 15 minuter för att lära dig mer om ett företag eller roll.
          </p>
          <span className="inline-block text-xs text-slate-500 mt-3 bg-slate-100 px-2 py-1 rounded">
            Mallar nedan
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-3">
            <MessageCircle className="text-violet-600" size={20} />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Följ upp</h3>
          <p className="text-sm text-slate-600">
            Skicka alltid ett tack efter möten. Det gör skillnad!
          </p>
          <span className="inline-block text-xs text-slate-500 mt-3 bg-slate-100 px-2 py-1 rounded">
            Mallar nedan
          </span>
        </div>
      </div>

      {/* Kontakter */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users size={20} className="text-teal-500" />
            Dina kontakter ({contacts.length})
          </h3>
          <div className="flex gap-2">
            {contacts.length > 0 && (
              <button
                onClick={() => setShowMessageGenerator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-xl font-medium hover:bg-violet-200 transition-colors"
              >
                <Wand2 size={18} />
                AI-meddelande
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
            >
              <Plus size={18} />
              Lägg till kontakt
            </button>
          </div>
        </div>

        {/* AI Message Generator Modal */}
        {showMessageGenerator && (
          <div className="mb-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <Wand2 size={18} className="text-violet-500" />
                Skapa personligt meddelande med AI
              </h4>
              <button
                onClick={() => {
                  setShowMessageGenerator(false)
                  setGeneratedMessage('')
                  setSelectedContactForMessage(null)
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Välj kontakt</label>
                <select
                  value={selectedContactForMessage?.id || ''}
                  onChange={(e) => {
                    const contact = contacts.find(c => c.id === e.target.value)
                    setSelectedContactForMessage(contact || null)
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Välj kontakt...</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `(${contact.company})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ av meddelande</label>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="initial">Första kontakten</option>
                  <option value="followup">Uppföljning</option>
                  <option value="thankyou">Tack-meddelande</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Syfte med kontakten</label>
              <input
                type="text"
                value={messagePurpose}
                onChange={(e) => setMessagePurpose(e.target.value)}
                placeholder="T.ex. Be om råd om karriärbyte, be om referens, etc."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <button
              onClick={generateCustomMessage}
              disabled={generatingMessage || !selectedContactForMessage || !messagePurpose}
              className="w-full md:w-auto px-6 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
            >
              {generatingMessage ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Skapar meddelande...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Generera meddelande
                </>
              )}
            </button>

            {generatedMessage && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Ditt AI-genererade meddelande:</span>
                  <button
                    onClick={() => handleCopy(generatedMessage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200"
                  >
                    <Copy size={14} />
                    Kopiera
                  </button>
                </div>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedMessage}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Filter */}
        {contacts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alla
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Aktiva
            </button>
            <button
              onClick={() => setFilterStatus('reconnect')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'reconnect'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Återkontakt
            </button>
            <button
              onClick={() => setFilterStatus('dormant')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'dormant'
                  ? 'bg-slate-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Vilande
            </button>
          </div>
        )}

        {/* Lägg till formulär */}
        {showAddForm && (
          <form onSubmit={addContact} className="mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Namn *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="T.ex. Anna Andersson"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Företag</label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="T.ex. Spotify"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roll</label>
                <input
                  type="text"
                  value={newContact.role}
                  onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="T.ex. HR-chef"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relation</label>
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({...newContact, relationship: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="colleague">Kollega</option>
                  <option value="friend">Vän</option>
                  <option value="mentor">Mentor</option>
                  <option value="recruiter">Rekryterare</option>
                  <option value="other">Annat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="anna@exempel.se"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={newContact.linkedin_url}
                  onChange={(e) => setNewContact({...newContact, linkedin_url: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
            
            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Taggar</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newContact.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-teal-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Lägg till tagg (t.ex. 'IT', 'Rekrytering')"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Lägg till
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Anteckningar</label>
              <textarea
                value={newContact.notes}
                onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={3}
                placeholder="T.ex. 'Träffades på konferens i maj, skickade CV'"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
              >
                Spara kontakt
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        )}

        {/* Kontaktlista */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Laddar kontakter...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users size={48} className="mx-auto mb-4 text-slate-300" />
            <p>Inga kontakter ännu.</p>
            <p className="text-sm">Lägg till dina första nätverkskontakter ovan!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-start justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{contact.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(contact.status)}`}>
                      {contact.status === 'active' ? 'Aktiv' : 
                       contact.status === 'reconnect' ? 'Återkontakt' : 'Vilande'}
                    </span>
                  </div>
                  {(contact.company || contact.role) && (
                    <p className="text-sm text-slate-600 mb-1">
                      {contact.role} {contact.company && `på ${contact.company}`}
                    </p>
                  )}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {contact.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-white text-slate-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {contact.last_contact_date && (
                    <p className="text-xs text-slate-500">
                      Senast kontakt: {new Date(contact.last_contact_date).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedContactForMessage(contact)
                      setShowMessageGenerator(true)
                    }}
                    className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg"
                    title="Skapa AI-meddelande"
                  >
                    <Wand2 size={18} />
                  </button>
                  {contact.linkedin_url && (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Linkedin size={18} />
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      <Mail size={18} />
                    </a>
                  )}
                  <button
                    onClick={() => markAsContacted(contact.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Markera som kontaktad idag"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-amber-500" />
          Grundprinciper för nätverkande
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networkingTips.map((tip) => (
            <div 
              key={tip.title}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <tip.icon size={20} className="text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-600">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail size={20} className="text-blue-500" />
          Färdiga mallar för nätverkande
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Klicka på en mall för att se hela texten. Kopiera och anpassa efter din situation.
        </p>

        <div className="space-y-3">
          {networkTemplates.map((template) => (
            <div 
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setExpandedTemplate(
                  expandedTemplate === template.id ? null : template.id
                )}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="text-left">
                  <h4 className="font-medium text-slate-800">{template.title}</h4>
                  <p className="text-sm text-slate-500">{template.description}</p>
                </div>
                {expandedTemplate === template.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedTemplate === template.id && (
                <div className="px-5 pb-5">
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Mall
                      </span>
                      <button
                        onClick={() => handleCopy(template.template, template.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          copiedId === template.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        )}
                      >
                        {copiedId === template.id ? (
                          <>
                            <CheckCircle2 size={14} />
                            Kopierad!
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            Kopiera
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {template.template}
                    </pre>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      Tips för denna mall
                    </h5>
                    <ul className="space-y-1.5">
                      {template.tips.map((tip, index) => (
                        <li 
                          key={index}
                          className="text-sm text-slate-600 flex items-start gap-2"
                        >
                          <span className="text-teal-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Redo att nätverka?</h3>
            <p className="text-teal-100 text-sm">
              Börja med någon du redan känner - det är lättare än du tror!
            </p>
          </div>
          <a
            href="#/exercises"
            className="px-5 py-2.5 bg-white text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors flex items-center gap-2"
          >
            <Sparkles size={18} />
            Öva på pitch
          </a>
        </div>
      </div>
    </div>
  )
}
