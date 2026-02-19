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
  ExternalLink
} from 'lucide-react'

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

export default function JobTracker() {
  const [applications] = useState<JobApplication[]>(mockApplications)
  const [filter, setFilter] = useState<JobApplication['status'] | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobb-tracker</h1>
          <p className="text-slate-500 mt-1">Håll koll på dina jobbansökningar</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
          <Plus size={18} />
          Lägg till ansökan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Totalt</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Ansökta</p>
          <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Intervjuer</p>
          <p className="text-2xl font-bold text-amber-600">{stats.interview}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Erbjudanden</p>
          <p className="text-2xl font-bold text-green-600">{stats.offer}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Avslag</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Sök företag eller position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Alla statusar</option>
            <option value="applied">Ansökta</option>
            <option value="interview">Intervjuer</option>
            <option value="offer">Erbjudanden</option>
            <option value="rejected">Avslag</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Inga ansökningar hittades</h3>
            <p className="text-slate-500 mb-4">Börja lägga till jobbansökningar för att hålla koll på dem</p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
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
                className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{app.position}</h3>
                        <p className="text-slate-600">{app.company}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {app.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Ansökt {new Date(app.appliedDate).toLocaleDateString('sv-SE')}
                          </span>
                          {app.salary && (
                            <span className="text-teal-600 font-medium">{app.salary}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[app.status].color}`}>
                      <StatusIcon size={14} />
                      {statusConfig[app.status].label}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <ExternalLink size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                {app.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Anteckningar:</span> {app.notes}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
