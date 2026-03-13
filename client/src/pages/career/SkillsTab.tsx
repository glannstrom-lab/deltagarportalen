/**
 * Skills Tab - Skills gap analysis (redirects to SkillsGapAnalysis)
 */
import { useState } from 'react'
import { 
  Target, Search, CheckCircle, AlertCircle, BookOpen,
  Sparkles, TrendingUp, Award
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface Skill {
  name: string
  current: number
  target: number
  gap: 'none' | 'small' | 'medium' | 'large'
}

interface Course {
  title: string
  provider: string
  duration: string
  type: 'online' | 'classroom' | 'hybrid'
  cost: string
}

export default function SkillsTab() {
  const [cvText, setCvText] = useState('')
  const [dreamJob, setDreamJob] = useState('')
  const [showResults, setShowResults] = useState(false)

  const analyze = () => {
    if (!cvText.trim() || !dreamJob.trim()) return
    setShowResults(true)
  }

  const skills: Skill[] = [
    { name: 'Projektledning', current: 3, target: 5, gap: 'medium' },
    { name: 'Agila metoder', current: 2, target: 4, gap: 'medium' },
    { name: 'Kommunikation', current: 4, target: 5, gap: 'small' },
    { name: 'Dataanalys', current: 1, target: 3, gap: 'large' },
  ]

  const courses: Course[] = [
    { title: 'Certifierad Projektledare', provider: 'Komvux', duration: '6 månader', type: 'classroom', cost: 'Gratis' },
    { title: 'Agil Projektledning', provider: 'LinkedIn Learning', duration: '20 timmar', type: 'online', cost: ' ingår i Premium' },
    { title: 'Dataanalys för nybörjare', provider: 'Coursera', duration: '8 veckor', type: 'online', cost: 'Gratis att granska' },
  ]

  const getGapColor = (gap: string) => {
    switch (gap) {
      case 'none': return 'text-green-600 bg-green-100'
      case 'small': return 'text-yellow-600 bg-yellow-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'large': return 'text-red-600 bg-red-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  if (!showResults) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Kompetensgap-analys</h3>
            <p className="text-slate-600 mt-2">
              Jämför dina nuvarande kompetenser med vad ditt drömjobb kräver.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                Din nuvarande profil
              </label>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Klistra in ditt CV här (eller skriv en kort sammanfattning av din bakgrund...)"
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-y"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Search className="w-4 h-4 text-purple-500" />
                Ditt drömjobb
              </label>
              <textarea
                value={dreamJob}
                onChange={(e) => setDreamJob(e.target.value)}
                placeholder="Klistra in en jobbannons för ditt drömjobb, eller beskriv rollen..."
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-y"
              />
            </div>
          </div>

          <Button 
            onClick={analyze}
            disabled={!cvText.trim() || !dreamJob.trim()}
            className="w-full mt-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analysera kompetensgap
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Analysresultat</h3>
            <p className="text-slate-600">Matchning: 65%</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">65%</span>
          </div>
        </div>

        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '65%' }} />
        </div>

        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Du har en god grund! Fokusera på att utveckla de markerade kompetenserna för att öka dina chanser.
          </p>
        </div>
      </Card>

      {/* Skills Gap */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Kompetensjämförelse</h3>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name} className="p-4 rounded-xl bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">{skill.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getGapColor(skill.gap)}`}>
                  Gap: {skill.target - skill.current} nivåer
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
                    <span>Nuvarande: {skill.current}/5</span>
                    <span>Mål: {skill.target}/5</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(skill.current / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Course Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          Rekommenderade utbildningar
        </h3>
        <div className="space-y-3">
          {courses.map((course, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
              <div>
                <h4 className="font-semibold text-slate-800">{course.title}</h4>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  <span>{course.provider}</span>
                  <span>•</span>
                  <span>{course.duration}</span>
                  <span>•</span>
                  <span className="capitalize">{course.type}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">{course.cost}</span>
                <Button size="sm" variant="outline" className="mt-1 block">
                  Läs mer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Plan */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Din handlingsplan
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-600">1</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Prioritera projektledning</p>
              <p className="text-sm text-slate-600">Påbörja certifiering inom 2 veckor</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-600">2</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Lär dig agila metoder</p>
              <p className="text-sm text-slate-600">Online-kurs, 20 timmar</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-purple-600">3</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">Bygg portfolio</p>
              <p className="text-sm text-slate-600">Visa upp dina nya kompetenser</p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => setShowResults(false)}
        >
          Gör ny analys
        </Button>
      </Card>
    </div>
  )
}
