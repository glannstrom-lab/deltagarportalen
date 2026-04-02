import { useState } from 'react'
import { 
  calculateJobMatches, 
  type UserProfile,
  riasecNames,
  bigFiveNames,
  type RiasecScores,
  type BigFiveScores
} from '@/services/interestGuideData'
import { RiasecChart } from './RiasecChart'
import { BigFiveChart } from './BigFiveChart'
import { ICFSection } from './ICFSection'
import { HealthConsentGate } from '@/components/consent/HealthConsentGate'
import { JobCard } from './JobCard'
import { Button } from '@/components/ui/Button'
import { 
  Download, 
  Share2, 
  RotateCcw, 
  GraduationCap,
  Briefcase,
  CheckSquare,
  X,
  BarChart3,
  Lightbulb,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  Brain,
  Heart,
  Sparkles
} from '@/components/ui/icons'

interface ResultsViewProps {
  profile: UserProfile
  onRestart: () => void
}

// Pedagogisk information om RIASEC
const riasecInfo = {
  title: 'Vad är RIASEC?',
  description: 'RIASEC (även kallad Holland Codes) är en modell som beskriver sex olika personlighetstyper och arbetsmiljöer. Den hjälper dig förstå vilka typer av yrken som kan passa dig baserat på dina intressen och arbetsstil.',
  types: [
    { key: 'R', name: 'Realistisk', desc: 'Praktiskt arbete med händerna, maskiner, teknik eller utomhus', examples: 'Mekaniker, elektriker, trädgårdsmästare, kock' },
    { key: 'I', name: 'Investigativ', desc: 'Analysera, forska, lösa problem och förstå komplexa samband', examples: 'Forskare, programmerare, läkare, civilingenjör' },
    { key: 'A', name: 'Konstnärlig', desc: 'Kreativt skapande, estetiskt arbete, uttrycka sig', examples: 'Grafisk designer, musiker, journalist, arkitekt' },
    { key: 'S', name: 'Social', desc: 'Hjälpa, undervisa, vårda och samarbeta med människor', examples: 'Lärare, sjuksköterska, socionom, psykolog' },
    { key: 'E', name: 'Entreprenöriell', desc: 'Leda, påverka, sälja och driva projekt', examples: 'Försäljare, marknadsförare, chef, mäklare' },
    { key: 'C', name: 'Konventionell', desc: 'Organisera, strukturera, arbeta med data och detaljer', examples: 'Ekonom, administratör, controller, revisor' },
  ]
}

// Pedagogisk information om Big Five
const bigFiveInfo = {
  title: 'Vad är Big Five?',
  description: 'Big Five är den mest vedertagna modellen inom personlighetspsykologi. Den beskriver fem grundläggande personlighetsdrag som påverkar hur vi beter oss i olika situationer, inklusive på jobbet.',
  traits: [
    { 
      key: 'openness', 
      name: 'Öppenhet', 
      desc: 'Nyfikenhet, fantasi och vilja att prova nya saker',
      workImpact: 'Hög öppenhet passar bra för kreativa och varierande yrken. Låg öppenhet passar för strukturerade och förutsägbara arbetsuppgifter.'
    },
    { 
      key: 'conscientiousness', 
      name: 'Samvetsgrannhet', 
      desc: 'Noggrannhet, organisation och självdisciplin',
      workImpact: 'Hög samvetsgrannhet är viktigt för yrken som kräver precision och pålitlighet. De flesta arbetsgivare värdesätter detta drag högt.'
    },
    { 
      key: 'extraversion', 
      name: 'Extraversion', 
      desc: 'Socialt engagemang, energi och utåtriktning',
      workImpact: 'Hög extraversion passar för yrken med mycket social kontakt. Låg extraversion (introversion) kan passa bra för självständigt arbete.'
    },
    { 
      key: 'agreeableness', 
      name: 'Vänlighet', 
      desc: 'Empati, samarbetsvilja och omtanke om andra',
      workImpact: 'Hög vänlighet är viktigt i vårdyrken och service. Mycket låg vänlighet kan passa för konkurrensutsatta yrken som kräver hårdhet.'
    },
    { 
      key: 'stability', 
      name: 'Emotionell stabilitet', 
      desc: 'Förmåga att hantera stress och behålla lugnet',
      workImpact: 'Hög stabilitet hjälper i pressade situationer. Lägre stabilitet kan innebära större känslighet, men också större empati.'
    },
  ]
}

// Tolkning av resultat
function interpretRiasec(scores: RiasecScores): string {
  const entries = Object.entries(scores).sort(([, a], [, b]) => b - a)
  const [top1] = entries[0]
  const [top2] = entries[1]
  
  const combinations: Record<string, string> = {
    'RI': 'Du trivs med att lösa praktiska problem på ett analytiskt sätt. Tekniska yrken kan passa dig.',
    'RA': 'Du gillar att skapa saker med händerna. Yrken inom design, hantverk eller konstnärligt teknik kan passa.',
    'RS': 'Du vill hjälpa andra på ett praktiskt sätt. Vårdyrken med praktiska uppgifter kan passa.',
    'IA': 'Du kombinerar analytisk förmåga med kreativitet. Forskar- eller utvecklingsyrken kan passa.',
    'IS': 'Du vill förstå och hjälpa människor. Psykologi, medicin eller pedagogik kan passa.',
    'AS': 'Du vill uttrycka dig och kommunicera med andra. Yrken inom media, konst eller undervisning kan passa.',
    'SE': 'Du vill leda och hjälpa människor samtidigt. Chefsroller inom vård eller utbildning kan passa.',
    'EC': 'Du vill organisera och driva verksamheter framåt. Administrativa ledarroller kan passa.',
  }
  
  const key = `${top1}${top2}`
  const key2 = `${top2}${top1}`
  return combinations[key] || combinations[key2] || 'Du har en unik kombination av intressen som ger dig många möjligheter!'
}

function interpretBigFive(scores: BigFiveScores): string {
  const traits = []
  if (scores.openness >= 60) traits.push('nyfiken och öppen för nya idéer')
  if (scores.conscientiousness >= 60) traits.push('noggrann och pålitlig')
  if (scores.extraversion >= 60) traits.push('social och utåtriktad')
  if (scores.agreeableness >= 60) traits.push('hjälpsam och empatisk')
  if (scores.stability >= 60) traits.push('stabil under press')
  
  if (traits.length === 0) {
    return 'Din personlighet är mer återhållsam, vilket kan passa bra för yrken som kräver eftertanke och noggrannhet.'
  }
  
  return `Dina främsta personlighetsdrag är att du är ${traits.join(', ')}. Detta ger dig goda förutsättningar för yrken som värdesätter dessa egenskaper.`
}

export function ResultsView({ profile, onRestart }: ResultsViewProps) {
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs'>('profile')
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})

  const matches = calculateJobMatches(profile, filterUni)
  const topMatches = matches.slice(0, 10)

  const toggleInfo = (key: string) => {
    setExpandedInfo(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleShare = () => {
    const shareData = { profile, timestamp: new Date().toISOString() }
    localStorage.setItem('interest-guide-share', JSON.stringify(shareData))
    const shareUrl = `${window.location.origin}/interest-guide/shared`
    navigator.clipboard.writeText(shareUrl)
    alert('Länk kopierad till urklipp!')
  }

  const handleDownload = () => {
    const data = {
      profil: profile,
      matchningar: topMatches.map(m => ({ yrke: m.occupation.name, matchning: m.matchPercentage })),
      exporterad: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'intresseguide-resultat.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedMatches = matches.filter(m => selectedJobs.has(m.occupation.id))

  // Hitta topp 3 RIASEC
  const topRiasec = Object.entries(profile.riasec)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto transition-all duration-500 pb-20">
      {/* Header - mer luftig och inspirerande */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Dina resultat är klara!
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Din unika profil
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Baserat på dina svar har vi skapat en analys av dina intressen, personlighet och förutsättningar. 
          Använd denna information för att utforska yrkesvägar som passar just dig.
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Dina topp 3 intressen</h3>
          </div>
          <div className="space-y-2">
            {topRiasec.map(([key, value], i) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 w-5">{i + 1}.</span>
                <span className="text-sm text-gray-700">{riasecNames[key]} ({value}/5)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Din personlighet</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {interpretBigFive(profile.bigFive)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-5 border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Dina styrkor</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {interpretRiasec(profile.riasec)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Dela resultat
        </Button>
        <Button variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Spara som fil
        </Button>
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Gör om guiden
        </Button>
      </div>

      {/* Tabs - förbättrad design */}
      <div className="flex justify-center gap-3 mb-10">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Utforska din profil
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Se yrkesförslag
          <span className="ml-1 px-2 py-0.5 bg-current rounded-full text-xs opacity-20">
            {topMatches.length}
          </span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* RIASEC Section */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    RIASEC - Dina arbetsintressen
                  </h2>
                  <p className="text-gray-600">
                    Sex typer av arbetsmiljöer som matchar olika personligheter
                  </p>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <RiasecChart scores={profile.riasec} size={300} />
              </div>

              {/* Pedagogisk info om RIASEC */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <button
                  onClick={() => toggleInfo('riasec')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-gray-900">Så här läser du din RIASEC-profil</span>
                  </div>
                  {expandedInfo['riasec'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedInfo['riasec'] && (
                  <div className="mt-4 space-y-4">
                    <p className="text-gray-700">{riasecInfo.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {riasecInfo.types.map(type => (
                        <div key={type.key} className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center text-white ${
                              type.key === 'R' ? 'bg-red-500' :
                              type.key === 'I' ? 'bg-blue-500' :
                              type.key === 'A' ? 'bg-purple-500' :
                              type.key === 'S' ? 'bg-green-500' :
                              type.key === 'E' ? 'bg-amber-500' :
                              'bg-teal-500'
                            }`}>{type.key}</span>
                            <span className="font-semibold text-gray-900">{type.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{type.desc}</p>
                          <p className="text-xs text-gray-500">Exempel: {type.examples}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Din tolkning */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-1">Vad betyder ditt resultat?</h4>
                    <p className="text-indigo-800 text-sm leading-relaxed">
                      {interpretRiasec(profile.riasec)} De områden där du har högst poäng 
                      ({topRiasec.map(([k]) => riasecNames[k]).join(', ')}) är de miljöer där du troligen trivs bäst. 
                      Ju högre poäng, desto starkare matchning.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Big Five Section */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Big Five - Din personlighetsprofil
                  </h2>
                  <p className="text-gray-600">
                    Fem grundläggande drag som beskriver hur du är som person
                  </p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto mb-8">
                <BigFiveChart scores={profile.bigFive} />
              </div>

              {/* Pedagogisk info om Big Five */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <button
                  onClick={() => toggleInfo('bigfive')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-gray-900">Förstå dina personlighetsdrag</span>
                  </div>
                  {expandedInfo['bigfive'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedInfo['bigfive'] && (
                  <div className="mt-4 space-y-4">
                    <p className="text-gray-700">{bigFiveInfo.description}</p>
                    <div className="space-y-3">
                      {bigFiveInfo.traits.map(trait => (
                        <div key={trait.key} className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{trait.name}</span>
                            <span className="text-sm text-gray-500">{profile.bigFive[trait.key as keyof BigFiveScores]}/100</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{trait.desc}</p>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                              style={{ width: `${profile.bigFive[trait.key as keyof BigFiveScores]}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{trait.workImpact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Din tolkning */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Vad säger resultatet om dig?</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {interpretBigFive(profile.bigFive)} Ingen profil är "bättre" än en annan - 
                      olika yrken kräver olika egenskaper. Det viktiga är att hitta en matchning som passar just dig.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ICF Section - Wrapped with GDPR Art. 9 health data consent gate */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    ICF - Dina funktionsförutsättningar
                  </h2>
                  <p className="text-gray-600">
                    Förstå dina förutsättningar för arbete och vilka anpassningar som kan hjälpa
                  </p>
                </div>
              </div>

              <HealthConsentGate>
                <div className="max-w-2xl mx-auto mb-8">
                  <ICFSection scores={profile.icf} />
                </div>
              </HealthConsentGate>

              {/* Pedagogisk info om ICF */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <button
                  onClick={() => toggleInfo('icf')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-gray-900">Om ICF och arbetsanpassningar</span>
                  </div>
                  {expandedInfo['icf'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedInfo['icf'] && (
                  <div className="mt-4 space-y-4 text-gray-700">
                    <p>
                      <strong>ICF (International Classification of Functioning)</strong> är WHO:s ramverk för att 
                      beskriva hälsa och funktionsförmåga. Det fokuserar på vad du <em>kan</em> göra, inte på eventuella begränsningar.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-2">🟢 Gröna områden (4-5)</h5>
                        <p className="text-sm text-green-700">Dina styrkor! Dessa områden ger dig fördelar på arbetsmarknaden.</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <h5 className="font-semibold text-amber-800 mb-2">🟡 Gul/Röda områden (1-3)</h5>
                        <p className="text-sm text-amber-700">Där anpassningar kan hjälpa. Enligt Arbetsmiljölagen har du rätt till rimliga arbetsanpassningar.</p>
                      </div>
                    </div>
                    <p className="text-sm">
                      <strong>Tips:</strong> Prata med en arbetskonsulent om vilka stöd och anpassningar som finns tillgängliga 
                      för det yrke du är intresserad av. Många arbetsgivare är positiva till anpassningar som gör att du kan prestera ditt bästa.
                    </p>
                  </div>
                )}
              </div>

              {/* Viktigt meddelande */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Kom ihåg</h4>
                    <p className="text-green-800 text-sm leading-relaxed">
                      Dina förutsättningar är inte statiska - de kan förändras över tid och variera beroende på situation. 
                      Det viktiga är att hitta ett yrke där du kan använda dina styrkor och få stöd där det behövs. 
                      Med rätt anpassningar kan de flesta yrken fungera för de flesta människor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Intro text */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Dina yrkesmatchningar
            </h3>
            <p className="text-indigo-800 text-sm">
              Här är yrken som matchar din profil. Ju högre procent, desto bättre matchning. 
              Kom ihåg att detta är förslag - utforska de yrken som känns intressanta för dig!
            </p>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={filterUni === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterUni(null)}
              className={filterUni === null ? 'bg-indigo-600' : ''}
            >
              Alla yrken
            </Button>
            <Button
              variant={filterUni === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterUni(true)}
              className={filterUni === true ? 'bg-indigo-600' : ''}
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Kräver högskola
            </Button>
            <Button
              variant={filterUni === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterUni(false)}
              className={filterUni === false ? 'bg-indigo-600' : ''}
            >
              <Briefcase className="w-4 h-4 mr-1" />
              Gymnasium/YH
            </Button>
          </div>

          {/* Compare bar */}
          {selectedJobs.size > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 flex items-center gap-4 z-50 max-w-md w-full mx-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">{selectedJobs.size} valda</span>
              </div>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setSelectedJobs(new Set())}>
                <X className="w-4 h-4 mr-1" />
                Rensa
              </Button>
              <Button
                size="sm"
                onClick={() => setShowComparison(true)}
                disabled={selectedJobs.size < 2}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Jämför
              </Button>
            </div>
          )}

          {/* Job list */}
          <div className="space-y-4">
            {topMatches.map((match) => (
              <JobCard
                key={match.occupation.id}
                match={match}
                isSelected={selectedJobs.has(match.occupation.id)}
                onSelect={() => toggleJobSelection(match.occupation.id)}
                showCompare={true}
              />
            ))}
          </div>

          {/* Show more button - placeholder */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Visar de {topMatches.length} bästa matchningarna av {matches.length} möjliga yrken
            </p>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && selectedMatches.length >= 2 && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowComparison(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Jämför yrken</h2>
              <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 rounded-tl-lg">Egenskap</th>
                    {selectedMatches.map(m => (
                      <th key={m.occupation.id} className="p-3 bg-gray-50 text-center min-w-[150px]">
                        {m.occupation.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b font-medium">Matchning</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center">
                        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                          m.matchPercentage >= 80 ? 'bg-green-100 text-green-700' :
                          m.matchPercentage >= 60 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {m.matchPercentage}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-medium">Lön</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center text-sm">
                        {m.occupation.salary}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-medium">Utbildning</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center text-sm">
                        {m.occupation.education.length}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 border-b font-medium">Prognos</td>
                    {selectedMatches.map(m => (
                      <td key={m.occupation.id} className="p-3 border-b text-center text-sm">
                        {m.occupation.prognosis === 'growing' ? 'Växande' :
                         m.occupation.prognosis === 'declining' ? 'Krympande' : 'Stabil'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
