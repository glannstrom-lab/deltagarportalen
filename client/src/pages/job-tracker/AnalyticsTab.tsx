/**
 * Analytics Tab - Job search analytics and insights
 */
import { useState } from 'react'
import { 
  LineChart, BarChart3, TrendingUp, TrendingDown, Target,
  Clock, Calendar, AlertCircle, CheckCircle2, Lightbulb
} from 'lucide-react'
import { Card } from '@/components/ui'

interface AnalyticsData {
  conversionRate: number
  averageResponseTime: number
  applicationsPerWeek: number
  interviewSuccessRate: number
}

const mockData: AnalyticsData = {
  conversionRate: 25,
  averageResponseTime: 14,
  applicationsPerWeek: 3.5,
  interviewSuccessRate: 40,
}

const weeklyData = [
  { week: 'v1', applications: 2, responses: 0, interviews: 0 },
  { week: 'v2', applications: 3, responses: 1, interviews: 0 },
  { week: 'v3', applications: 5, responses: 2, interviews: 1 },
  { week: 'v4', applications: 4, responses: 2, interviews: 1 },
  { week: 'v5', applications: 6, responses: 3, interviews: 2 },
  { week: 'v6', applications: 4, responses: 2, interviews: 1 },
]

const insights = [
  {
    type: 'positive',
    title: 'Dina intervjuer går bra!',
    description: '40% av dina ansökningar leder till intervju, vilket är över genomsnittet (25%).',
    icon: CheckCircle2,
  },
  {
    type: 'improvement',
    title: 'Förbättra ditt CV',
    description: 'Ansökningar med nyckelord som matchar jobbannonsen får 50% snabbare svar.',
    icon: Lightbulb,
  },
  {
    type: 'trend',
    title: 'Du är mest aktiv på onsdagar',
    description: 'Dina ansökningar på onsdagar får 30% fler svar än andra dagar.',
    icon: TrendingUp,
  },
]

export default function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  return (
    <div className="space-y-6">
      {/* Header with time range */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Jobbsökar-statistik</h3>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {range === 'week' ? 'Vecka' : range === 'month' ? 'Månad' : 'År'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{mockData.conversionRate}%</p>
              <p className="text-sm text-slate-500">Konvertering till intervju</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{mockData.averageResponseTime}</p>
              <p className="text-sm text-slate-500">Dagar till svar</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{mockData.applicationsPerWeek}</p>
              <p className="text-sm text-slate-500">Ansökningar/vecka</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{mockData.interviewSuccessRate}%</p>
              <p className="text-sm text-slate-500">Intervju → Erbjudande</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="p-6">
        <h4 className="font-semibold text-slate-800 mb-4">Konverteringstratt</h4>
        <div className="space-y-4">
          {[
            { stage: 'Sparade jobb', count: 24, percentage: 100, color: 'bg-slate-500' },
            { stage: 'Ansökningar skickade', count: 18, percentage: 75, color: 'bg-blue-500' },
            { stage: 'Svar från arbetsgivare', count: 8, percentage: 33, color: 'bg-amber-500' },
            { stage: 'Intervjuer', count: 6, percentage: 25, color: 'bg-indigo-500' },
            { stage: 'Erbjudanden', count: 1, percentage: 4, color: 'bg-green-500' },
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-slate-600">{step.stage}</div>
              <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${step.color} rounded-full flex items-center justify-end px-3 transition-all duration-500`}
                  style={{ width: `${step.percentage}%` }}
                >
                  <span className="text-white text-sm font-bold">{step.count}</span>
                </div>
              </div>
              <div className="w-16 text-sm text-slate-500 text-right">{step.percentage}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Activity Chart */}
      <Card className="p-6">
        <h4 className="font-semibold text-slate-800 mb-4">Aktivitet över tid</h4>
        <div className="flex items-end gap-2 h-48">
          {weeklyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end h-32">
                <div 
                  className="flex-1 bg-blue-400 rounded-t transition-all hover:bg-blue-500"
                  style={{ height: `${(data.applications / 6) * 100}%` }}
                  title={`${data.applications} ansökningar`}
                />
                <div 
                  className="flex-1 bg-green-400 rounded-t transition-all hover:bg-green-500"
                  style={{ height: `${(data.responses / 6) * 100}%` }}
                  title={`${data.responses} svar`}
                />
                <div 
                  className="flex-1 bg-amber-400 rounded-t transition-all hover:bg-amber-500"
                  style={{ height: `${(data.interviews / 6) * 100}%` }}
                  title={`${data.interviews} intervjuer`}
                />
              </div>
              <span className="text-xs text-slate-500">{data.week}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded" />
            Ansökningar
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            Svar
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded" />
            Intervjuer
          </span>
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h4 className="font-semibold text-slate-800 mb-4">Insikter & Rekommendationer</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-xl ${
                  insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                  insight.type === 'improvement' ? 'bg-amber-50 border border-amber-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  insight.type === 'positive' ? 'bg-green-100' :
                  insight.type === 'improvement' ? 'bg-amber-100' :
                  'bg-blue-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    insight.type === 'positive' ? 'text-green-600' :
                    insight.type === 'improvement' ? 'text-amber-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h5 className="font-semibold text-slate-800">{insight.title}</h5>
                  <p className="text-sm text-slate-600 mt-1">{insight.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Comparison with Average */}
      <Card className="p-6">
        <h4 className="font-semibold text-slate-800 mb-4">Jämförelse med genomsnitt</h4>
        <div className="space-y-4">
          {[
            { label: 'Konvertering till intervju', you: 25, average: 15 },
            { label: 'Svarstid (dagar)', you: 14, average: 21, lowerIsBetter: true },
            { label: 'Intervju till erbjudande', you: 40, average: 30 },
          ].map((metric, index) => {
            const better = metric.lowerIsBetter 
              ? metric.you < metric.average 
              : metric.you > metric.average
            
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-48 text-sm text-slate-600">{metric.label}</div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-indigo-600">Du: {metric.you}%</span>
                      <span className="text-slate-500">Genomsnitt: {metric.average}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div 
                          className="bg-indigo-500"
                          style={{ width: `${(metric.you / Math.max(metric.you, metric.average)) * 50}%` }}
                        />
                        <div 
                          className="bg-slate-300"
                          style={{ width: `${(metric.average / Math.max(metric.you, metric.average)) * 50}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {better ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
