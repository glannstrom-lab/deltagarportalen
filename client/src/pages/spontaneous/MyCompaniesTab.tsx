/**
 * My Companies Tab - View and manage saved companies
 * Textsökning, sortering, statusfilter (knappar på desktop, select på mobil),
 * batchåtgärder och CSV-export.
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Building2,
  Filter,
  Download,
  Search,
  CheckSquare,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useSpontaneousCompanies } from '@/hooks/useSpontaneousCompanies'
import { getSniDescription } from '@/services/bolagsverketApi'
import type { SpontaneousCompany, SpontaneousStatus, UpdateSpontaneousCompany } from '@/services/supabaseApi'
import { CompanyCard } from './CompanyCard'
import { SPONTANEOUS_STATUSES, statusConfig } from './spontaneousStatus'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu'

type SortKey = 'newest' | 'name' | 'followup'

const filterOptions: Array<SpontaneousStatus | 'all'> = ['all', ...SPONTANEOUS_STATUSES]

type Translate = (key: string, options?: Record<string, unknown>) => string

/** Escapa CSV-cell: citattecken dubblas, formelinjektion (=+-@) neutraliseras */
function escapeCsvCell(value: string): string {
  let v = value.replace(/"/g, '""')
  if (/^[=+\-@]/.test(v)) {
    v = `'${v}`
  }
  return `"${v}"`
}

// Export companies to CSV
function exportToCSV(companies: SpontaneousCompany[], t: Translate) {
  const headers = [
    t('spontaneous.csv.companyName'),
    t('spontaneous.csv.orgNumber'),
    t('spontaneous.csv.status'),
    t('spontaneous.csv.priority'),
    t('spontaneous.csv.city'),
    t('spontaneous.csv.industry'),
    t('spontaneous.csv.contacted'),
    t('spontaneous.csv.followup'),
    t('spontaneous.csv.notes'),
  ]

  const rows = companies.map(c => [
    c.company_name,
    c.org_number,
    t(`spontaneous.status.${c.status}`),
    t(`spontaneous.priority.${c.priority || 'medium'}`),
    c.company_data?.address?.city || '',
    c.company_data?.sniCodes?.[0]?.description || '',
    c.outreach_date ? new Date(c.outreach_date).toLocaleDateString('sv-SE') : '',
    c.followup_date ? new Date(c.followup_date).toLocaleDateString('sv-SE') : '',
    c.notes || '',
  ])

  const csvContent = [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map(row => row.map(escapeCsvCell).join(';')),
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
  const { confirm } = useConfirmDialog()
  const [filter, setFilter] = useState<SpontaneousStatus | 'all'>('all')
  const [searchText, setSearchText] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { companies, isLoading, updateStatus, updateStatusBulk, removeCompany, updateCompany } = useSpontaneousCompanies()

  const filteredCompanies = useMemo(() => {
    let list = filter === 'all' ? companies : companies.filter(c => c.status === filter)

    const q = searchText.trim().toLowerCase()
    if (q) {
      list = list.filter(c =>
        c.company_name.toLowerCase().includes(q)
        || (c.company_data?.address?.city || '').toLowerCase().includes(q)
        || (c.company_data?.sniCodes || []).some(s =>
          (s.description || getSniDescription(s.code) || '').toLowerCase().includes(q)
        )
      )
    }

    if (sortKey === 'name') {
      return [...list].sort((a, b) => a.company_name.localeCompare(b.company_name, 'sv'))
    }
    if (sortKey === 'followup') {
      return [...list].sort((a, b) => {
        if (!a.followup_date) return 1
        if (!b.followup_date) return -1
        return a.followup_date < b.followup_date ? -1 : 1
      })
    }
    // 'newest' — API:t levererar redan created_at desc
    return list
  }, [companies, filter, searchText, sortKey])

  const handleUpdateStatus = async (id: string, status: SpontaneousStatus) => {
    await updateStatus(id, status)
  }

  const handleDelete = async (company: SpontaneousCompany) => {
    const ok = await confirm({
      title: t('common.delete'),
      message: t('spontaneous.confirmDelete'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (ok) {
      await removeCompany(company.id)
      setSelectedIds(prev => {
        if (!prev.has(company.id)) return prev
        const next = new Set(prev)
        next.delete(company.id)
        return next
      })
    }
  }

  const handleUpdate = async (id: string, updates: UpdateSpontaneousCompany) => {
    await updateCompany(id, updates)
  }

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkStatus = async (status: SpontaneousStatus) => {
    await updateStatusBulk([...selectedIds], status)
    exitSelectMode()
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
      {/* Sök + sortering + åtgärder */}
      {companies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 dark:text-stone-400" aria-hidden="true" />
            <Input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t('spontaneous.listSearchPlaceholder')}
              aria-label={t('spontaneous.listSearchPlaceholder')}
              className="pl-9 bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
            />
          </div>
          <label htmlFor="spontaneous-sort" className="sr-only">{t('spontaneous.sort.label')}</label>
          <select
            id="spontaneous-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-sm px-2 py-2 rounded-lg border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
          >
            <option value="newest">{t('spontaneous.sort.newest')}</option>
            <option value="name">{t('spontaneous.sort.name')}</option>
            <option value="followup">{t('spontaneous.sort.followup')}</option>
          </select>
          <Button
            variant={selectMode ? 'default' : 'outline'}
            size="sm"
            onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
            aria-pressed={selectMode}
            className={selectMode ? 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)]' : 'border-stone-200 dark:border-stone-700'}
          >
            {selectMode ? <X className="w-4 h-4 mr-1.5" aria-hidden="true" /> : <CheckSquare className="w-4 h-4 mr-1.5" aria-hidden="true" />}
            {selectMode ? t('spontaneous.batch.cancel') : t('spontaneous.batch.selectMode')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(filteredCompanies, t)}
            className="border-stone-200 dark:border-stone-700"
          >
            <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
            {t('common.export')}
          </Button>
        </div>
      )}

      {/* Batchåtgärdsrad */}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)] dark:border-[var(--c-accent)]/50">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
            {t('spontaneous.batch.selected', { count: selectedIds.size })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={selectedIds.size === 0} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]">
                {t('spontaneous.batch.changeStatusTo')}...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {SPONTANEOUS_STATUSES.map((status) => {
                const Icon = statusConfig[status].icon
                return (
                  <DropdownMenuItem key={status} onClick={() => handleBulkStatus(status)}>
                    <Icon className="w-4 h-4 mr-2" />
                    {t(`spontaneous.status.${status}`)}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Statusfilter — knappar på desktop, select på mobil */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-stone-600 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
        {filterOptions.map((option) => (
          <Button
            key={option}
            variant={filter === option ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={`flex-shrink-0 ${filter === option ? 'bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]' : 'border-stone-200 dark:border-stone-700'}`}
          >
            {option === 'all' ? t('common.all') : t(`spontaneous.status.${option}`)}
            {option !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({companies.filter(c => c.status === option).length})
              </span>
            )}
          </Button>
        ))}
      </div>
      <div className="md:hidden flex items-center gap-2">
        <Filter className="w-4 h-4 text-stone-600 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
        <label htmlFor="spontaneous-filter" className="sr-only">{t('spontaneous.filterLabel')}</label>
        <select
          id="spontaneous-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as SpontaneousStatus | 'all')}
          className="flex-1 text-sm px-2 py-2 rounded-lg border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
        >
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'all'
                ? t('common.all')
                : `${t(`spontaneous.status.${option}`)} (${companies.filter(c => c.status === option).length})`}
            </option>
          ))}
        </select>
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <EmptyState
          illustration={filter === 'all' && !searchText ? 'jobb' : undefined}
          icon={filter === 'all' && !searchText ? undefined : Building2}
          title={filter === 'all' && !searchText
            ? t('spontaneous.noSavedCompanies')
            : t('spontaneous.noCompaniesWithStatus', { status: searchText ? `"${searchText}"` : t(`spontaneous.status.${filter}`) })}
          description={filter === 'all' && !searchText ? t('spontaneous.searchAndSaveCompanies') : t('spontaneous.changeFilter')}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onUpdateStatus={(status) => handleUpdateStatus(company.id, status)}
              onDelete={() => handleDelete(company)}
              onUpdate={(updates) => handleUpdate(company.id, updates)}
              selectable={selectMode}
              selected={selectedIds.has(company.id)}
              onToggleSelect={() => toggleSelected(company.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
