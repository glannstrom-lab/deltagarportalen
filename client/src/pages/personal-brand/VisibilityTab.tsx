/**
 * Visibility Tab - Increase your digital presence
 */
import { useState } from 'react'
import { Eye, Linkedin, Globe, MessageSquare, TrendingUp, CheckCircle, ExternalLink, Lightbulb, Calendar } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface VisibilityTip {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  impact: 'low' | 'medium' | 'high'
  timePerWeek: string
}

const VISIBILITY_TIPS: VisibilityTip[] = [
  {
    id: 'linkedin-engage',
    title: 'Engagera dig på LinkedIn',
    description: 'Kommentera och gilla andras inlägg regelbundet. Det ökar din synlighet i flödet.',
    difficulty: 'easy',
    impact: 'medium',
    timePerWeek: '15 min/dag',
  },
  {
    id: 'share-articles',
    title: 'Dela branschartiklar',
    description: 'Dela intressanta artiklar med en egen reflektion. Visar att du håller dig uppdaterad.',
    difficulty: 'easy',
    impact: 'medium',
    timePerWeek: '30 min/vecka',
  },
  {
    id: 'write-posts',
    title: 'Skriv egna inlägg',
    description: 'Dela dina erfarenheter, insikter eller lärdomar. Positionerar dig som expert.',
    difficulty: 'medium',
    impact: 'high',
    timePerWeek: '1-2 tim/vecka',
  },
  {
    id: 'join-groups',
    title: 'Delta i LinkedIn-grupper',
    description: 'Gå med i relevanta grupper och delta aktivt i diskussioner.',
    difficulty: 'easy',
    impact: 'low',
    timePerWeek: '30 min/vecka',
  },
  {
    id: 'speak-events',
    title: 'Tala på event/meetups',
    description: 'Presentera på branschevent eller meetups. Stor synlighet och nätverkande.',
    difficulty: 'hard',
    impact: 'high',
    timePerWeek: 'Varierar',
  },
  {
    id: 'write-articles',
    title: 'Skriv LinkedIn-artiklar',
    description: 'Längre artiklar indexeras i Google och visar djup expertis.',
    difficulty: 'hard',
    impact: 'high',
    timePerWeek: '2-4 tim/månad',
  },
  {
    id: 'podcast-guest',
    title: 'Gästa poddar',
    description: 'Kontakta relevanta poddar och erbjud dig som gäst i ditt expertområde.',
    difficulty: 'hard',
    impact: 'high',
    timePerWeek: 'Varierar',
  },
  {
    id: 'personal-website',
    title: 'Skapa egen hemsida',
    description: 'En enkel portfoliosida eller blogg som du kontrollerar helt själv.',
    difficulty: 'medium',
    impact: 'medium',
    timePerWeek: 'Engångs + underhåll',
  },
]

const CONTENT_IDEAS = [
  'Dela ett misstag du lärt dig av',
  'Berätta om ett projekt du är stolt över',
  'Förklara något komplext på ett enkelt sätt',
  'Ge tips till din yngre själv',
  'Kommentera en branschtrend',
  'Gratulera en kollega publikt',
  'Dela en bok eller resurs du gillar',
  'Ställ en fråga till ditt nätverk',
  'Berätta om din karriärresa',
  'Ge din syn på en aktuell nyhet',
]

export default function VisibilityTab() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  const filteredTips = selectedDifficulty
    ? VISIBILITY_TIPS.filter(tip => tip.difficulty === selectedDifficulty)
    : VISIBILITY_TIPS

  const randomIdea = CONTENT_IDEAS[Math.floor(Math.random() * CONTENT_IDEAS.length)]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Öka din synlighet</h2>
            <p className="text-slate-600 mt-1">
              Strategier för att bli mer synlig för rekryterare och potentiella arbetsgivare.
              Välj aktiviteter som passar din tid och komfortnivå.
            </p>
          </div>
        </div>
      </Card>

      {/* Content idea generator */}
      <Card className="border-violet-200 bg-violet-50/50">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-violet-900">Idé för nästa inlägg</p>
            <p className="text-violet-700 mt-1">{randomIdea}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-violet-600"
              onClick={() => window.location.reload()}
            >
              Ge mig en ny idé
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDifficulty(null)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !selectedDifficulty ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Alla
        </button>
        <button
          onClick={() => setSelectedDifficulty('easy')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedDifficulty === 'easy' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Lätt att börja
        </button>
        <button
          onClick={() => setSelectedDifficulty('medium')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedDifficulty === 'medium' ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Mellannivå
        </button>
        <button
          onClick={() => setSelectedDifficulty('hard')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            selectedDifficulty === 'hard' ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Avancerat
        </button>
      </div>

      {/* Tips list */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-600" />
          Strategier för synlighet
        </h3>

        <div className="space-y-4">
          {filteredTips.map((tip) => (
            <div
              key={tip.id}
              className="p-4 rounded-xl border border-slate-100 hover:border-cyan-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">{tip.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{tip.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  tip.difficulty === 'easy' && "bg-emerald-100 text-emerald-700",
                  tip.difficulty === 'medium' && "bg-amber-100 text-amber-700",
                  tip.difficulty === 'hard' && "bg-rose-100 text-rose-700"
                )}>
                  {tip.difficulty === 'easy' ? 'Lätt' : tip.difficulty === 'medium' ? 'Medel' : 'Avancerat'}
                </span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  tip.impact === 'low' && "bg-slate-100 text-slate-600",
                  tip.impact === 'medium' && "bg-blue-100 text-blue-700",
                  tip.impact === 'high' && "bg-violet-100 text-violet-700"
                )}>
                  {tip.impact === 'low' ? 'Låg påverkan' : tip.impact === 'medium' ? 'Medel påverkan' : 'Hög påverkan'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {tip.timePerWeek}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* LinkedIn optimization quick tips */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Linkedin className="w-5 h-5 text-blue-600" />
          LinkedIn Quick Wins
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Rubrik med keywords</p>
              <p className="text-xs text-blue-700">Inkludera jobbtitlar du söker</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Aktivera "Open to Work"</p>
              <p className="text-xs text-blue-700">Kan vara synligt endast för rekryterare</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Be om rekommendationer</p>
              <p className="text-xs text-blue-700">Från chefer och kollegor</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Aktivera Creator Mode</p>
              <p className="text-xs text-blue-700">Om du planerar dela innehåll regelbundet</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly plan suggestion */}
      <Card className="bg-emerald-50 border-emerald-100">
        <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Veckoprogramförslag (30 min/dag)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'].map((day, idx) => (
            <div key={day} className="p-3 bg-white rounded-lg border border-emerald-100">
              <p className="font-medium text-emerald-800 text-sm">{day}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {idx === 0 && 'Engagera på 10 inlägg'}
                {idx === 1 && 'Dela en artikel'}
                {idx === 2 && 'Kommentera i grupper'}
                {idx === 3 && 'Skriv eget inlägg'}
                {idx === 4 && 'Nätverka - skicka 3 kontaktförfrågningar'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
