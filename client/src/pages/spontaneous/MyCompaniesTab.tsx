/**
 * My Companies Tab - View and manage saved companies
 */
import { useState, useMemo } from 'react'
import {
  Building2,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive,
  Filter,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import { formatOrgNumber, getSniDescription } from '@/services/bolagsverketApi'
import type { SpontaneousCompany, SpontaneousStatus } from '@/services/supabaseApi'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

// Status configuration
const statusConfig: Record<SpontaneousStatus, {
  label: string
  icon: typeof Building2
  color: string
  bgColor: string
}> = {
  saved: {
    label: 'Sparad',
    icon: Building2,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  to_contact: {
    label: 'Att kontakta',
    icon: Send,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  contacted: {
    label: 'Kontaktad',
    icon: Send,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  waiting: {
    label: 'Väntar svar',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  response_positive: {
    label: 'Positivt svar',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  response_negative: {
    label: 'Avslag',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  no_response: {
    label: 'Inget svar',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  archived: {
    label: 'Arkiverad',
    icon: Archive,
    color: 'text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
}

// Filter options
const filterOptions: Array<{ value: SpontaneousStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Alla' },
  { value: 'saved', label: 'Sparade' },
  { value: 'to_contact', label: 'Att kontakta' },
  { value: 'contacted', label: 'Kontaktade' },
  { value: 'waiting', label: 'Väntar svar' },
  { value: 'response_positive', label: 'Positivt svar' },
  { value: 'response_negative', label: 'Avslag' },
  { value: 'archived', label: 'Arkiverade' },
]

function StatusBadge({ status }: { status: SpontaneousStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  )
}

function CompanyCard({
  company,
  onUpdateStatus,
  onDelete,
}: {
  company: SpontaneousCompany
  onUpdateStatus: (status: SpontaneousStatus) => void
  onDelete: () => void
}) {
  const address = company.company_data?.address
  const sniCodes = company.company_data?.sniCodes || []

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <h3 className="font-semibold truncate">{company.company_name}</h3>
          </div>

          <p className="text-sm text-slate-500 mb-2">
            {formatOrgNumber(company.org_number)}
            {company.company_data?.legalForm && ` • ${company.company_data.legalForm}`}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={company.status} />
            {company.priority === 'high' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30">
                Hög prioritet
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            {address?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {address.city}
              </span>
            )}
            {sniCodes.length > 0 && (
              <span className="truncate max-w-[200px]">
                {sniCodes[0].description || getSniDescription(sniCodes[0].code)}
              </span>
            )}
          </div>

          {company.outreach_date && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Kontaktad: {new Date(company.outreach_date).toLocaleDateString('sv-SE')}
            </p>
          )}

          {company.followup_date && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Uppföljning: {new Date(company.followup_date).toLocaleDateString('sv-SE')}
            </p>
          )}

          {company.notes && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
              {company.notes}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onUpdateStatus('to_contact')}>
              <Send className="w-4 h-4 mr-2" />
              Markera: Att kontakta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('contacted')}>
              <Send className="w-4 h-4 mr-2" />
              Markera: Kontaktad
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('waiting')}>
              <Clock className="w-4 h-4 mr-2" />
              Markera: Väntar svar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus('response_positive')}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Positivt svar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('response_negative')}>
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              Avslag
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('no_response')}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Inget svar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus('archived')}>
              <Archive className="w-4 h-4 mr-2" />
              Arkivera
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Ta bort
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

export default function MyCompaniesTab() {
  const [filter, setFilter] = useState<SpontaneousStatus | 'all'>('all')
  const { companies, isLoading, updateStatus, removeCompany } = useSpontaneousCompanies()

  const filteredCompanies = useMemo(() => {
    if (filter === 'all') return companies
    return companies.filter(c => c.status === filter)
  }, [companies, filter])

  const handleUpdateStatus = async (id: string, status: SpontaneousStatus) => {
    await updateStatus(id, status)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta företag?')) {
      await removeCompany(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option.value)}
            className="flex-shrink-0"
          >
            {option.label}
            {option.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({companies.filter(c => c.status === option.value).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {filter === 'all' ? 'Inga sparade företag' : `Inga företag med status "${filterOptions.find(o => o.value === filter)?.label}"`}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {filter === 'all'
              ? 'Sök efter företag och spara de du är intresserad av.'
              : 'Ändra filter för att se andra företag.'
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onUpdateStatus={(status) => handleUpdateStatus(company.id, status)}
              onDelete={() => handleDelete(company.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
