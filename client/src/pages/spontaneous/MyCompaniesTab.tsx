/**
 * My Companies Tab - View and manage saved companies
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Building2,
  Filter,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import type { SpontaneousCompany, SpontaneousStatus, UpdateSpontaneousCompany } from '@/services/supabaseApi'
import { CompanyCard } from './CompanyCard'

// Filter options (labels are translation keys)
const filterOptions: Array<{ value: SpontaneousStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'saved', labelKey: 'spontaneous.status.saved' },
  { value: 'to_contact', labelKey: 'spontaneous.status.to_contact' },
  { value: 'contacted', labelKey: 'spontaneous.status.contacted' },
  { value: 'waiting', labelKey: 'spontaneous.status.waiting' },
  { value: 'response_positive', labelKey: 'spontaneous.status.response_positive' },
  { value: 'response_negative', labelKey: 'spontaneous.status.response_negative' },
  { value: 'no_response', labelKey: 'spontaneous.status.no_response' },
  { value: 'archived', labelKey: 'spontaneous.status.archived' },
]

// Export companies to CSV
function exportToCSV(companies: SpontaneousCompany[]) {
  const headers = [
    'Företagsnamn',
    'Org.nr',
    'Status',
    'Prioritet',
    'Ort',
    'Bransch',
    'Kontaktad',
    'Uppföljning',
    'Anteckningar',
  ]

  const statusLabels: Record<SpontaneousStatus, string> = {
    saved: 'Sparad',
    to_contact: 'Att kontakta',
    contacted: 'Kontaktad',
    waiting: 'Väntar svar',
    response_positive: 'Positivt svar',
    response_negative: 'Avslag',
    no_response: 'Inget svar',
    archived: 'Arkiverad',
  }

  const rows = companies.map(c => [
    c.company_name,
    c.org_number,
    statusLabels[c.status],
    c.priority || 'normal',
    c.company_data?.address?.city || '',
    c.company_data?.sniCodes?.[0]?.description || '',
    c.outreach_date ? new Date(c.outreach_date).toLocaleDateString('sv-SE') : '',
    c.followup_date ? new Date(c.followup_date).toLocaleDateString('sv-SE') : '',
    (c.notes || '').replace(/"/g, '""'),
  ])

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n')

  // Add BOM for Excel compatibility with Swedish characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spontanansokningar_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export default function MyCompaniesTab() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<SpontaneousStatus | 'all'>('all')
  const { companies, isLoading, updateStatus, removeCompany, updateCompany } = useSpontaneousCompanies()

  const filteredCompanies = useMemo(() => {
    if (filter === 'all') return companies
    return companies.filter(c => c.status === filter)
  }, [companies, filter])

  const handleUpdateStatus = async (id: string, status: SpontaneousStatus) => {
    await updateStatus(id, status)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('spontaneous.confirmDelete'))) {
      await removeCompany(id)
    }
  }

  const handleUpdate = async (id: string, updates: UpdateSpontaneousCompany) => {
    await updateCompany(id, updates)
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
          <Filter className="w-4 h-4 text-stone-600 dark:text-stone-400 flex-shrink-0" />
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(option.value)}
              className={`flex-shrink-0 ${filter === option.value ? 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]' : 'border-stone-200 dark:border-stone-700'}`}
            >
              {t(option.labelKey)}
              {option.value !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({companies.filter(c => c.status === option.value).length})
                </span>
              )}
            </Button>
          ))}
        </div>
        {/* Export Button */}
        {companies.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(filteredCompanies)}
            className="flex-shrink-0 border-stone-200 dark:border-stone-700"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {t('common.export')}
          </Button>
        )}
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <EmptyState
          illustration={filter === 'all' ? 'jobb' : undefined}
          icon={filter === 'all' ? undefined : Building2}
          title={filter === 'all' ? t('spontaneous.noSavedCompanies') : t('spontaneous.noCompaniesWithStatus', { status: t(filterOptions.find(o => o.value === filter)?.labelKey || '') })}
          description={filter === 'all' ? t('spontaneous.searchAndSaveCompanies') : t('spontaneous.changeFilter')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onUpdateStatus={(status) => handleUpdateStatus(company.id, status)}
              onDelete={() => handleDelete(company.id)}
              onUpdate={(updates) => handleUpdate(company.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
