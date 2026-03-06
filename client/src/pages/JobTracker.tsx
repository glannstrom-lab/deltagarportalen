import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  MoreHorizontal,
  MapPin,
  Building2,
  ExternalLink,
  ChevronDown,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobApplication {
  id: string
  company: string
  position: string
  location: string
  appliedDate: string
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  salary?: string
  contact?: string
  notes?: string
}

const mockApplications: JobApplication[] = [
  {
    id: '1',
    company: 'Tech Solutions AB',
    position: 'Frontend-utvecklare',
    location: 'Stockholm',
    appliedDate: '2026-02-15',
    status: 'interview',
    salary: '45 000 - 55 000 kr/mån',
    contact: 'anna@techsolutions.se',
    notes: 'Intervju bokad till 25 februari'
  },
  {
    id: '2',
    company: 'Digital Agency',
    position: 'React-utvecklare',
    location: 'Göteborg',
    appliedDate: '2026-02-10',
    status: 'applied',
    salary: '40 000 - 50 000 kr/mån',
  },
  {
    id: '3',
    company: 'Innovation Labs',
    position: 'Fullstack-utvecklare',
    location: 'Remote',
    appliedDate: '2026-02-01',
    status: 'rejected',
    notes: 'Valde en annan kandidat med mer erfarenhet'
  },
]

const statusConfig = {
  applied: { label: 'Ansökt', color: 'bg-blue-100 text-blue-700', icon: Clock },
  interview: { label: 'Intervju', color: 'bg-amber-100 text-amber-700', icon: Calendar },
  offer: { label: 'Erbjudande', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Avslag', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'Återtagen', color: 'bg-slate-100 text-slate-700', icon: XCircle },
}

const statusFilters = [
  { id: 'all', label: 'Alla', count: null },
  { id: 'applied', label: 'Ansökta', count: 1 },
  { id: 'interview', label: 'Intervjuer', count: 1 },
  { id: 'offer', label: 'Erbjudanden', count: 0 },
  { id: 'rejected', label: 'Avslag', count: 1 },
] as const

export default function JobTracker() {
  const [applications] = useState<JobApplication[]>(mockApplications)
  const [filter, setFilter] = useState<JobApplication['status'] | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showStatusFilter, setShowStatusFilter] = useState(false)

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  // Beräkna framsteg
  const progressRate = stats.total > 0 
    ? Math.round(((stats.interview + stats.offer) / stats.total) * 100) 
    : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Jobb-tracker</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Håll koll på dina jobbansökningar</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium min-h-[48px]">
          <Plus size={18} />
          <span className="hidden sm:inline">Lägg till ansökan</span>
          <span className="sm:hidden">Ny ansökan</span>
        </button>
      </div>

      {/* Progress Card - Mobiloptimerad */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp size={24} />
          <h2 className="font-semibold">Din framsteg</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progressRate}%` }}
              />
            </div>
          </div>
          <span className="font-bold text-lg">{progressRate}%</span>
        </div>
        <p className="text-teal-100 text-sm mt-2">
          {stats.interview + stats.offer} av {stats.total} ansökningar har lett till intervju eller erbjudande
        </p>
      </div>

      {/* Stats Cards - Scrollbar på mobil */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
        <div className="flex-shrink-0 w-28 sm:w-auto bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">Totalt</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">Ansökta</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.applied}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">Intervjuer</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.interview}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">Erbjudanden</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.offer}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">Avslag</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Sök företag eller position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
          />
        </div>

        {/* Status Filter - Horizontal scroll på mobil */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter size={16} className="text-slate-400 flex-shrink-0" />
          {statusFilters.map((statusFilter) => (
            <button
              key={statusFilter.id}
              onClick={() => setFilter(statusFilter.id as typeof filter)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === statusFilter.id
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {statusFilter.label}
              {statusFilter.count !== null && (
                <span className="ml-1.5 text-xs opacity-80">({statusFilter.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Inga ansökningar hittades</h3>
            <p className="text-slate-500 mb-4 text-sm">Börja lägga till jobbansökningar för att hålla koll på dem</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium min-h-[48px]">
              <Plus size={18} />
              Lägg till ansökan
            </button>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const StatusIcon = statusConfig[app.status].icon
            return (
              <div
                key={app.id}
                className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
              >
                {/* Mobile Layout */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">{app.position}</h3>
                        <p className="text-slate-600 text-sm">{app.company}</p>
                      </div>
                      <span className={cn(
                        "flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                        statusConfig[app.status].color
                      )}>
                        <StatusIcon size={12} />
                        <span className="hidden sm:inline">{statusConfig[app.status].label}</span>
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="sm:w-3.5 sm:h-3.5" />
                        {app.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                        Ansökt {new Date(app.appliedDate).toLocaleDateString('sv-SE')}
                      </span>
                      {app.salary && (
                        <span className="text-teal-600 font-medium hidden sm:inline">{app.salary}</span>
                      )}
                    </div>

                    {/* Notes */}
                    {app.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-sm text-slate-600 line-clamp-2">
                          <span className="font-medium">Anteckningar:</span> {app.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 sm:mt-4">
                      <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm min-h-[44px]">
                        <ExternalLink size={16} />
                        <span className="hidden sm:inline">Öppna</span>
                      </button>
                      <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
