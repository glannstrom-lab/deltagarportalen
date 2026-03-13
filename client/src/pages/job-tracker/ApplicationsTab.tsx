/**
 * Applications Tab - Job application tracker
 */
import { useState } from 'react'
import { 
  Briefcase, Building2, MapPin, Calendar, Clock,
  CheckCircle2, XCircle, Clock4, AlertCircle,
  Plus, Search, Filter, ChevronRight
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

interface Application {
  id: string
  company: string
  position: string
  location: string
  appliedDate: string
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  notes?: string
}

const mockApplications: Application[] = [
  {
    id: '1',
    company: 'Tech Solutions AB',
    position: 'Frontend-utvecklare',
    location: 'Stockholm',
    appliedDate: '2026-02-15',
    status: 'interview',
    notes: 'Intervju bokad till 25 februari'
  },
  {
    id: '2',
    company: 'Digital Agency',
    position: 'React-utvecklare',
    location: 'Göteborg',
    appliedDate: '2026-02-10',
    status: 'applied',
  },
  {
    id: '3',
    company: 'Innovation Labs',
    position: 'Fullstack-utvecklare',
    location: 'Remote',
    appliedDate: '2026-02-01',
    status: 'rejected',
    notes: 'Valde en annan kandidat'
  },
]

const statusConfig = {
  applied: { label: 'Ansökt', color: 'bg-blue-100 text-blue-700', icon: Clock4 },
  interview: { label: 'Intervju', color: 'bg-amber-100 text-amber-700', icon: Calendar },
  offer: { label: 'Erbjudande', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Avslag', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'Återtagen', color: 'bg-slate-100 text-slate-700', icon: AlertCircle },
}

export default function ApplicationsTab() {
  const [applications] = useState<Application[]>(mockApplications)
  const [filter, setFilter] = useState<Application['status'] | 'all'>('all')
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
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Totalt', value: stats.total, color: 'bg-slate-100' },
          { label: 'Ansökta', value: stats.applied, color: 'bg-blue-100' },
          { label: 'Intervjuer', value: stats.interview, color: 'bg-amber-100' },
          { label: 'Erbjudanden', value: stats.offer, color: 'bg-green-100' },
          { label: 'Avslag', value: stats.rejected, color: 'bg-red-100' },
        ].map((stat, index) => (
          <Card key={index} className={`p-4 ${stat.color}`}>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-600">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Sök ansökningar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            >
              <option value="all">Alla statusar</option>
              <option value="applied">Ansökt</option>
              <option value="interview">Intervju</option>
              <option value="offer">Erbjudande</option>
              <option value="rejected">Avslag</option>
            </select>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            Lägg till ansökan
          </Button>
        </div>
      </Card>

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApplications.map((app) => {
          const config = statusConfig[app.status]
          const StatusIcon = config.icon
          
          return (
            <Card key={app.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{app.position}</h4>
                    <p className="text-sm text-slate-600">{app.company}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {app.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.appliedDate).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                    {app.notes && (
                      <p className="text-sm text-slate-500 mt-2 italic">"{app.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {config.label}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Inga ansökningar hittades</h3>
          <p className="text-slate-500">Börja med att lägga till din första ansökan</p>
        </div>
      )}
    </div>
  )
}
