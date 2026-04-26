/**
 * Advanced Analytics Dashboard
 * Visar detaljerad statistik, prediktioner och insikter om jobbsökningen
 */

import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  Brain,
  Calendar,
  Filter,
  Download,
  Zap,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface AnalyticsDashboardProps {
  className?: string
}

// Mock-data för dashboard
const activityData = [
  { date: 'v1', applications: 2, interviews: 0, diary: 1, cvUpdates: 1 },
  { date: 'v2', applications: 3, interviews: 1, diary: 2, cvUpdates: 0 },
  { date: 'v3', applications: 1, interviews: 0, diary: 1, cvUpdates: 2 },
  { date: 'v4', applications: 4, interviews: 1, diary: 3, cvUpdates: 1 },
  { date: 'v5', applications: 2, interviews: 2, diary: 2, cvUpdates: 0 },
  { date: 'v6', applications: 3, interviews: 0, diary: 1, cvUpdates: 1 },
  { date: 'v7', applications: 5, interviews: 1, diary: 2, cvUpdates: 1 },
  { date: 'v8', applications: 3, interviews: 2, diary: 3, cvUpdates: 0 },
]

const skillsData = [
  { skill: 'Kommunikation', current: 75, target: 90 },
  { skill: 'Teknisk', current: 60, target: 80 },
  { skill: 'Ledarskap', current: 45, target: 70 },
  { skill: 'Problemlösning', current: 80, target: 85 },
  { skill: 'Kundservice', current: 90, target: 95 },
  { skill: 'Projektledning', current: 50, target: 75 },
]

const timeDistribution = [
  { name: 'CV & Ansökningar', value: 35, color: '#14b8a6' },
  { name: 'Jobbsökning', value: 25, color: '#06b6d4' },
  { name: 'Lärande', value: 20, color: '#10b981' },
  { name: 'Nätverkande', value: 10, color: '#f59e0b' },
  { name: 'Annat', value: 10, color: '#6b7280' },
]

const energyCorrelation = [
  { energy: 'Låg', applications: 1, success: 0 },
  { energy: 'Medel-låg', applications: 2, success: 0 },
  { energy: 'Medel', applications: 3, success: 1 },
  { energy: 'Medel-hög', applications: 4, success: 2 },
  { energy: 'Hög', applications: 5, success: 3 },
]

const predictions = {
  jobProbability: 68,
  estimatedWeeks: 4,
  confidence: 'medium',
  factors: [
    { factor: 'Aktivitetsnivå', impact: 'positive', strength: 0.8 },
    { factor: 'CV-kvalitet', impact: 'positive', strength: 0.7 },
    { factor: 'Marknadsförutsättningar', impact: 'neutral', strength: 0.5 },
    { factor: 'Erfarenhetsnivå', impact: 'positive', strength: 0.6 },
  ]
}

const insights = [
  {
    id: '1',
    type: 'positive',
    title: 'Dina ansökningar ökar!',
    description: 'Du har ökat antalet ansökningar med 50% jämfört med förra månaden.',
    icon: TrendingUp,
    action: 'Fortsätt så!'
  },
  {
    id: '2',
    type: 'insight',
    title: 'Bäst resultat på onsdagar',
    description: 'Din statistik visar att du är mest produktiv mitt i veckan.',
    icon: Brain,
    action: 'Planera viktiga aktiviteter på onsdagar'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Följ upp fler ansökningar',
    description: 'Endast 20% av dina ansökningar har fått uppföljning.',
    icon: AlertCircle,
    action: 'Sätt påminnelser för uppföljning'
  },
]

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'predictions'>('overview')

  const tabs = [
    { id: 'overview', label: 'Översikt', icon: Target },
    { id: 'skills', label: 'Kompetenser', icon: Award },
    { id: 'predictions', label: 'Prediktioner', icon: Brain },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analys & Insikter</h1>
          <p className="text-slate-600">Avancerade analyser av din jobbsökarresa</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            <option value="week">Senaste veckan</option>
            <option value="month">Senaste månaden</option>
            <option value="quarter">Senaste kvartalet</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Exportera
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-brand-900 text-brand-900'
                : 'border-transparent text-slate-700 hover:text-slate-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ansökningar', value: '23', change: '+15%', positive: true, icon: Target },
              { label: 'Intervjuer', value: '7', change: '+40%', positive: true, icon: Calendar },
              { label: 'Aktivitetstimmar', value: '42h', change: '+8%', positive: true, icon: Clock },
              { label: 'Svarsfrekvens', value: '35%', change: '+5%', positive: true, icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-slate-600" />
                  <span className={cn(
                    'text-xs font-medium',
                    stat.positive ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-700">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Activity Chart */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Aktivitet över tid</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="applications" stroke="#14b8a6" fillOpacity={1} fill="url(#colorApps)" name="Ansökningar" />
                  <Area type="monotone" dataKey="interviews" stroke="#06b6d4" fillOpacity={1} fill="url(#colorInt)" name="Intervjuer" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tidsfördelning</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={timeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {timeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {timeDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-brand-50 to-sky-50 p-6 rounded-xl border border-brand-100">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-brand-900" />
              <h3 className="text-lg font-semibold text-slate-900">AI-genererade insikter</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-white p-4 rounded-lg border border-brand-100">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                      insight.type === 'positive' && 'bg-emerald-100',
                      insight.type === 'warning' && 'bg-amber-100',
                      insight.type === 'insight' && 'bg-brand-100'
                    )}>
                      <insight.icon className={cn(
                        'w-5 h-5',
                        insight.type === 'positive' && 'text-emerald-600',
                        insight.type === 'warning' && 'text-amber-600',
                        insight.type === 'insight' && 'text-brand-900'
                      )} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm">{insight.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                      <p className="text-xs font-medium text-brand-900 mt-2">{insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Kompetensutveckling</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Nuvarande" dataKey="current" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                  <Radar name="Mål" dataKey="target" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Energi vs Resultat</h3>
              <p className="text-sm text-slate-600 mb-4">
                Analys visar att du har bäst resultat vid högre energinivåer
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={energyCorrelation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="energy" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#14b8a6" name="Ansökningar" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="success" fill="#10b981" name="Positiva resultat" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Rekommenderade kompetenser att utveckla</h3>
            <div className="space-y-3">
              {skillsData
                .filter(s => s.target - s.current > 15)
                .sort((a, b) => (b.target - b.current) - (a.target - a.current))
                .map((skill) => (
                  <div key={skill.skill} className="flex items-center gap-4">
                    <span className="w-32 text-sm font-medium text-slate-700">{skill.skill}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-700 rounded-full"
                        style={{ width: `${skill.current}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-700 w-16">{skill.current}%</span>
                    <span className="text-xs text-slate-600">Mål: {skill.target}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* Main Prediction */}
          <div className="bg-gradient-to-br from-brand-900 to-sky-700 p-8 rounded-xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8" />
              <h3 className="text-2xl font-bold">AI Jobbprediktion</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{predictions.jobProbability}%</div>
                <p className="text-white/90">Sannolikhet för jobb inom 30 dagar</p>
              </div>
              
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">~{predictions.estimatedWeeks}</div>
                <p className="text-white/90">Beräknade veckor kvar</p>
              </div>
              
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">
                  {predictions.confidence === 'high' ? 'Hög' : predictions.confidence === 'medium' ? 'Medel' : 'Låg'}
                </div>
                <p className="text-white/90">Konfidens i prediktion</p>
              </div>
            </div>
            
            <p className="text-center text-white/90 mt-6 text-sm">
              Prediktionen baseras på din aktivitet, marknadsdata och liknande användares resultat
            </p>
          </div>

          {/* Factors */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Påverkande faktorer</h3>
              <div className="space-y-4">
                {predictions.factors.map((factor) => (
                  <div key={factor.factor} className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      factor.impact === 'positive' && 'bg-emerald-100',
                      factor.impact === 'negative' && 'bg-rose-100',
                      factor.impact === 'neutral' && 'bg-slate-100'
                    )}>
                      {factor.impact === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                      {factor.impact === 'negative' && <TrendingUp className="w-4 h-4 text-rose-600 rotate-180" />}
                      {factor.impact === 'neutral' && <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{factor.factor}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              factor.impact === 'positive' && 'bg-emerald-500',
                              factor.impact === 'negative' && 'bg-rose-500',
                              factor.impact === 'neutral' && 'bg-slate-400'
                            )}
                            style={{ width: `${factor.strength * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-700">{Math.round(factor.strength * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Rekommendationer för att snabba upp processen</h3>
              <div className="space-y-3">
                {[
                  { priority: 'high', text: 'Öka antalet ansökningar till 5 per vecka (+15% sannolikhet)' },
                  { priority: 'medium', text: 'Förbättra CV-sammanfattningen med fler siffror (+8% sannolikhet)' },
                  { priority: 'medium', text: 'Gå på fler nätverksevent (+10% sannolikhet)' },
                  { priority: 'low', text: 'Uppdatera LinkedIn-profilen (+5% sannolikhet)' },
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded',
                      rec.priority === 'high' && 'bg-rose-100 text-rose-700',
                      rec.priority === 'medium' && 'bg-amber-100 text-amber-700',
                      rec.priority === 'low' && 'bg-slate-100 text-slate-700'
                    )}>
                      {rec.priority === 'high' ? 'Hög' : rec.priority === 'medium' ? 'Medel' : 'Låg'}
                    </span>
                    <p className="text-sm text-slate-700">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard
