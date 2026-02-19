import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { cvApi, interestApi, coverLetterApi } from '../services/api'
import LoadingState from '../components/LoadingState'
import {
  FileText,
  Mail,
  Briefcase,
  Clock,
  ArrowRight,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [cvScore, setCvScore] = useState(0)
  const [hasCV, setHasCV] = useState(false)
  const [hasInterestResult, setHasInterestResult] = useState(false)
  const [coverLetterCount, setCoverLetterCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const cv = await cvApi.getCV()
        setHasCV(!!cv.summary || !!(cv.workExperience && cv.workExperience.length))

        const ats = await cvApi.getATSAnalysis()
        setCvScore(ats.score)

        try {
          await interestApi.getResult()
          setHasInterestResult(true)
        } catch {
          setHasInterestResult(false)
        }

        const letters = await coverLetterApi.getAll()
        setCoverLetterCount(letters.length)
      } catch (err) {
        console.error('Fel vid laddning:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <LoadingState message="Laddar..." />
  }

  const stats = [
    { label: 'CV-poäng', value: `${cvScore}/100`, icon: FileText, color: 'violet' },
    { label: 'Ansökningar', value: '12', icon: Briefcase, color: 'emerald' },
    { label: 'Sparade brev', value: coverLetterCount.toString(), icon: Mail, color: 'amber' },
    { label: 'Dagar i rad', value: '7', icon: Clock, color: 'rose' },
  ]

  const quickLinks = [
    { label: 'Fortsätt med CV', path: '/cv', desc: hasCV ? 'Påbörjat' : 'Inte påbörjat', done: hasCV },
    { label: 'Intresseguide', path: '/interest-guide', desc: hasInterestResult ? 'Genomförd' : 'Ej gjord', done: hasInterestResult },
    { label: 'Sök jobb', path: '/job-search', desc: 'Hitta lediga jobb', done: false },
  ]

  return (
    <div className="space-y-12 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Välkommen tillbaka, {user?.firstName}
        </h1>
        <p className="text-slate-500 mt-1">
          Här är din översikt för idag.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClasses = {
            violet: 'bg-violet-50 text-violet-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
            rose: 'bg-rose-50 text-rose-600',
          }[stat.color]

          return (
            <div key={stat.label} className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${colorClasses} flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-100">
          <h3 className="text-base font-semibold text-slate-900 mb-8">Aktivitet senaste veckan</h3>
          
          <div className="flex items-end gap-4 h-48">
            {[
              { day: 'Mån', value: 40 },
              { day: 'Tis', value: 70 },
              { day: 'Ons', value: 55 },
              { day: 'Tors', value: 85 },
              { day: 'Fre', value: 45 },
              { day: 'Lör', value: 25 },
              { day: 'Sön', value: 10 },
            ].map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-violet-100 rounded-t-lg relative overflow-hidden"
                  style={{ height: `${item.value}%` }}
                >
                  <div 
                    className="absolute bottom-0 w-full bg-violet-500 rounded-t-lg transition-all"
                    style={{ height: '100%' }}
                  />
                </div>
                <span className="text-xs text-slate-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress & Links */}
        <div className="space-y-8">
          {/* Progress */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-base font-semibold text-slate-900 mb-6">Din framsteg</h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">CV komplett</span>
                  <span className="font-medium text-slate-900">{hasCV ? '100%' : '0%'}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: hasCV ? '100%' : '0%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Intresseguide</span>
                  <span className="font-medium text-slate-900">{hasInterestResult ? '100%' : '0%'}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: hasInterestResult ? '100%' : '0%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">CV-kvalitet</span>
                  <span className="font-medium text-slate-900">{cvScore}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${cvScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Snabbåtgärder</h3>
            
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{link.label}</div>
                    <div className={`text-xs ${link.done ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {link.desc}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
