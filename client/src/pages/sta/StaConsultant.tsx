import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConsultantStats, useStaQuickNotes, useStaAbsences } from '@/hooks/useSta'
import { KompetenskartlaggningSummary } from './components/KompetenskartlaggningSummary'
import { AssessmentSignature } from './components/AssessmentSignature'
import { WorkplaceCard } from './components/WorkplaceCard'
import { WorkplaceFormModal } from './components/WorkplaceFormModal'
import { SelfTestEnrollmentButton } from './components/SelfTestEnrollmentButton'
import { BulkInviteParticipantsModal } from './components/BulkInviteParticipantsModal'
import { BulkImportParticipantsModal } from './components/BulkImportParticipantsModal'
import { AssessmentEditor } from './components/AssessmentEditor'
import { staWorkplacesApi, type StaWorkplace } from '@/services/staApi'
import { useAuthStore } from '@/stores/authStore'
import { staEnrollmentsApi, type StaPart as ApiStaPart, type AbsenceKind } from '@/services/staApi'
import { DOC_TYPE_META } from '@/services/staAiApi'
import { toParticipantRow, computeKpi, formatShortDate, resolveParticipantName, type EnrollmentStats } from './enrollmentDisplay'
import {
  collectActiveDeadlines,
  countDeadlinesWithinDays,
  deadlineSeverity,
  formatDocType,
  formatDaysLeft,
  nextDeadlineFor,
} from './staDeadlines'
import { QuickNoteForm, formatTag } from './components/QuickNoteForm'
import {
  Briefcase,
  Users,
  FileText,
  Sparkles,
  Plus,
  Search,
  Send,
  Link as LinkIcon,
  Unlink,
  AlertTriangle,
  Bot,
  Calendar,
  Building2,
  Mail,
  X,
  ChevronRight,
  MessageSquare,
  Activity,
  ClipboardList,
  UserPlus,
  Pause,
  Play,
  FileSpreadsheet,
  CheckCircle,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  type StaParticipantRow,
  type StaPart,
  type ParticipantLinkStatus,
  type JobinLinkSuggestion,
} from './mockData'

type TabId = 'oversikt' | 'deltagare' | 'skattningar' | 'arbetsplatser' | 'dokument'

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'oversikt', label: 'Översikt', icon: Activity },
  { id: 'deltagare', label: 'Deltagare', icon: Users },
  { id: 'skattningar', label: 'Skattningar', icon: ClipboardList },
  { id: 'arbetsplatser', label: 'Arbetsplatser', icon: Building2 },
  { id: 'dokument', label: 'Dokument', icon: FileText },
]

type DrawerSubTab = 'oversikt' | 'aktivitet' | 'skattningar' | 'dokument' | 'anteckningar'

export default function StaConsultant() {
  const [tab, setTab] = useState<TabId>('oversikt')
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [drawerInitialSubTab, setDrawerInitialSubTab] = useState<DrawerSubTab>('oversikt')
  const [addParticipantOpen, setAddParticipantOpen] = useState(false)
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  const openParticipant = (id: string, subTab: DrawerSubTab = 'oversikt') => {
    setDrawerInitialSubTab(subTab)
    setSelectedParticipantId(id)
  }
  const [linkParticipantId, setLinkParticipantId] = useState<string | null>(null)
  const { stats, loading, reload } = useConsultantStats()

  // Bygg deltagar-lista från riktig DB-data
  const rows = useMemo(() => stats.map(toParticipantRow), [stats])
  const kpi = useMemo(() => {
    if (stats.length === 0) {
      return { active: 0, perPart: { 1: 0, 2: 0, 3: 0, 4: 0 }, draftsToReview: 0, assessmentsInProgress: 0 }
    }
    return computeKpi(stats)
  }, [stats])

  // Vald deltagare — endast från riktig data
  const selectedStats = selectedParticipantId
    ? stats.find((s) => s.enrollment.id === selectedParticipantId) ?? null
    : null

  return (
    <PageLayout title="Steg till arbete — konsulent" showTabs={false} domain="action" showHeader={false}>
      <ConsultantHero
        onAdd={() => setAddParticipantOpen(true)}
        onBulkInvite={() => setBulkInviteOpen(true)}
        onBulkImport={() => setBulkImportOpen(true)}
      />
      <KpiRow kpi={kpi} stats={stats} onChangeTab={setTab} />
      <ConsultantTabs current={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'oversikt' && (
          <OverviewTab
            rows={rows}
            stats={stats}
            loading={loading}
            onOpenParticipant={(id) => openParticipant(id)}
            onOpenParticipantDocuments={(id) => openParticipant(id, 'dokument')}
            onLink={setLinkParticipantId}
            onAdd={() => setAddParticipantOpen(true)}
            onChangeTab={setTab}
            onReload={reload}
          />
        )}
        {tab === 'deltagare' && (
          <ParticipantsTab
            rows={rows}
            loading={loading}
            onOpen={(id) => openParticipant(id)}
            onOpenDocuments={(id) => openParticipant(id, 'dokument')}
            onLink={setLinkParticipantId}
            onAdd={() => setAddParticipantOpen(true)}
            onBulkInvite={() => setBulkInviteOpen(true)}
            onBulkImport={() => setBulkImportOpen(true)}
            onReload={reload}
          />
        )}
        {tab === 'skattningar' && (
          <AssessmentsTab
            stats={stats}
            onOpenParticipantAssessments={(id) => openParticipant(id, 'skattningar')}
            onChangeTab={setTab}
          />
        )}
        {tab === 'arbetsplatser' && <WorkplacesTab stats={stats} onReload={reload} onChangeTab={setTab} />}
        {tab === 'dokument' && <DocumentsTab stats={stats} onChangeTab={setTab} />}
      </div>

      {selectedStats && (
        <ParticipantDetailDrawer
          stats={selectedStats}
          initialSubTab={drawerInitialSubTab}
          onClose={() => setSelectedParticipantId(null)}
          onLink={() => {
            const id = selectedStats?.enrollment.id
            if (id) setLinkParticipantId(id)
          }}
          onChange={reload}
        />
      )}

      {addParticipantOpen && (
        <AddParticipantModal onClose={() => setAddParticipantOpen(false)} onCreated={reload} />
      )}

      {bulkInviteOpen && (
        <BulkInviteParticipantsModal
          onClose={() => setBulkInviteOpen(false)}
          onCreated={() => reload()}
        />
      )}

      {bulkImportOpen && (
        <BulkImportParticipantsModal
          onClose={() => setBulkImportOpen(false)}
          onCreated={() => reload()}
        />
      )}

      {linkParticipantId && (() => {
        const participant = rows.find((r) => r.id === linkParticipantId)
        if (!participant) return null
        return (
          <LinkParticipantModal
            participant={participant}
            onClose={() => setLinkParticipantId(null)}
          />
        )
      })()}
    </PageLayout>
  )
}

// ===========================================================================
// HERO + KPI + TABS
// ===========================================================================

function ConsultantHero({
  onAdd,
  onBulkInvite,
  onBulkImport,
}: {
  onAdd: () => void
  onBulkInvite: () => void
  onBulkImport: () => void
}) {
  return (
    <Card
      variant="flat"
      padding="lg"
      className="border-l-4"
      style={{
        background: 'var(--header-bg)',
        borderLeftColor: 'var(--c-solid)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">Konsulent · Projekt</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700">
              <Briefcase size={12} />
              Steg till arbete
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-stone-900">Dina deltagare</h1>
          <p className="text-stone-700 mt-1 max-w-2xl">
            Status, deadlines och utkast som väntar på din granskning. Snabbåtgärder ligger på varje rad.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={onBulkImport}>
            Importera CSV/Excel
          </Button>
          <Button variant="secondary" leftIcon={<Users size={16} />} onClick={onBulkInvite}>
            Bjud in flera
          </Button>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onAdd}>
            Lägg till deltagare
          </Button>
        </div>
      </div>
    </Card>
  )
}

function KpiRow({
  kpi,
  stats,
  onChangeTab,
}: {
  kpi: { active: number; perPart: Record<1 | 2 | 3 | 4, number>; draftsToReview: number; assessmentsInProgress: number }
  stats: EnrollmentStats[]
  onChangeTab: (tab: TabId) => void
}) {
  const deadlinesThisWeek = useMemo(() => countDeadlinesWithinDays(stats, 7), [stats])

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <KpiCard
        label="Aktiva deltagare"
        value={kpi.active}
        subtext={`${kpi.perPart[1]} i Del 1 · ${kpi.perPart[2]} i Del 2 · ${kpi.perPart[3]} i Del 3 · ${kpi.perPart[4]} i Del 4`}
        onClick={kpi.active > 0 ? () => onChangeTab('deltagare') : undefined}
      />
      <KpiCard
        label="Deadlines denna vecka"
        value={deadlinesThisWeek}
        subtext={deadlinesThisWeek > 0 ? 'AF-tidsfrister inom 7 dagar' : 'Inga inom 7 dagar'}
        subtextClass={deadlinesThisWeek > 0 ? 'text-rose-700 font-medium' : undefined}
      />
      <KpiCard
        label="Utkast att granska"
        value={kpi.draftsToReview}
        subtext={kpi.draftsToReview > 0 ? 'Granska och skicka' : 'Allt klart'}
        onClick={kpi.draftsToReview > 0 ? () => onChangeTab('dokument') : undefined}
      />
      <KpiCard
        label="Skattningar pågående"
        value={kpi.assessmentsInProgress}
        subtext={kpi.assessmentsInProgress > 0 ? 'Slutför i drawer' : 'Inga pågående'}
        onClick={kpi.assessmentsInProgress > 0 ? () => onChangeTab('skattningar') : undefined}
      />
    </section>
  )
}

function KpiCard({
  label,
  value,
  subtext,
  subtextClass,
  onClick,
}: {
  label: string
  value: number
  subtext: string
  subtextClass?: string
  onClick?: () => void
}) {
  const interactive = !!onClick
  const Wrapper: 'button' | 'div' = interactive ? 'button' : 'div'
  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'block text-left w-full',
        interactive && 'cursor-pointer hover:scale-[1.01] transition-transform',
        interactive && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)] rounded-xl',
      )}
    >
      <Card variant="flat" padding="md" className={interactive ? 'hover:shadow-md transition-shadow' : undefined}>
        <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">{label}</div>
        <div className="text-2xl font-semibold text-stone-900 mt-1">{value}</div>
        <div className={cn('text-xs text-stone-600 mt-1', subtextClass)}>{subtext}</div>
      </Card>
    </Wrapper>
  )
}

function ConsultantTabs({ current, onChange }: { current: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="mt-6 flex flex-wrap gap-2" role="tablist">
      {TABS.map((t) => {
        const Icon = t.icon
        const isActive = t.id === current
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors',
              isActive
                ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
            )}
            style={isActive ? { background: 'var(--c-bg)' } : undefined}
          >
            <Icon size={14} />
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

// ===========================================================================
// OVERVIEW TAB
// ===========================================================================

function OverviewTab({
  rows,
  stats,
  loading,
  onOpenParticipant,
  onOpenParticipantDocuments,
  onLink,
  onAdd,
  onChangeTab,
  onReload,
}: {
  rows: StaParticipantRow[]
  stats: EnrollmentStats[]
  loading: boolean
  onOpenParticipant: (id: string) => void
  onOpenParticipantDocuments: (id: string) => void
  onLink: (id: string) => void
  onAdd: () => void
  onChangeTab: (tab: TabId) => void
  onReload: () => void
}) {
  const draftDocuments = useMemo(() => {
    const result: Array<{
      id: string
      enrollmentId: string
      title: string
      participantName: string
      subtext: string
      docType: string
      aiDrafted: boolean
    }> = []
    for (const s of stats) {
      for (const d of s.documents) {
        if (d.status === 'draft' || d.status === 'consultant_review') {
          result.push({
            id: d.id,
            enrollmentId: s.enrollment.id,
            title: documentTypeLabel(d.doc_type),
            participantName: resolveParticipantName(s.enrollment),
            subtext: d.ai_drafted ? 'AI-utkast' : 'Utkast',
            docType: d.doc_type,
            aiDrafted: d.ai_drafted,
          })
        }
      }
    }
    return result.slice(0, 5)
  }, [stats])

  return (
    <div className="space-y-5">
      {rows.length === 0 && !loading && (
        <EmptyDataBanner onAdd={onAdd} onSelfTestCreated={onReload} />
      )}

      <DeadlinesCard stats={stats} onOpenParticipantDocuments={onOpenParticipantDocuments} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AiSummaryCard stats={stats} onChange={onReload} />
        <DraftsCard
          drafts={draftDocuments}
          onSelect={onOpenParticipantDocuments}
          onSeeAll={() => onChangeTab('dokument')}
        />
      </div>

      {rows.length > 0 && (
        <Card variant="flat" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Senaste deltagare</h3>
              <p className="text-xs text-stone-500">Aktivitet de senaste 24 timmarna</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ChevronRight size={14} />}
              onClick={() => onChangeTab('deltagare')}
            >
              Se alla
            </Button>
          </div>
          <ParticipantsTable
            rows={rows.slice(0, 3)}
            onOpen={onOpenParticipant}
            onLink={onLink}
            showAddButton={false}
          />
        </Card>
      )}
    </div>
  )
}

function EmptyDataBanner({ onAdd, onSelfTestCreated }: { onAdd: () => void; onSelfTestCreated: () => void }) {
  return (
    <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--c-solid)' }} />
            Inga deltagare än
          </h3>
          <p className="text-sm text-stone-700 mt-1 max-w-xl">
            Lägg till din första deltagare — antingen manuellt eller via en Jobin-inbjudan.
          </p>
        </div>
        <Button variant="primary" leftIcon={<UserPlus size={14} />} onClick={onAdd}>
          Lägg till första deltagaren
        </Button>
      </div>
      {/* Admin-genväg: lägg till mig själv som testdeltagare */}
      <div className="mt-4">
        <SelfTestEnrollmentButton onCreated={onSelfTestCreated} variant="compact" />
      </div>
    </Card>
  )
}

function DeadlinesCard({
  stats,
  onOpenParticipantDocuments,
}: {
  stats: EnrollmentStats[]
  onOpenParticipantDocuments: (enrollmentId: string) => void
}) {
  const deadlines = useMemo(() => collectActiveDeadlines(stats).slice(0, 5), [stats])
  const within7 = deadlines.filter((d) => d.daysLeft <= 7).length

  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
            <AlertTriangle
              size={16}
              className={within7 > 0 ? 'text-rose-500' : 'text-stone-400'}
            />
            Akuta deadlines
          </h3>
          <p className="text-xs text-stone-500">AF-tidsfrister inom 7 dagar</p>
        </div>
      </div>
      {deadlines.length === 0 ? (
        <p className="text-sm text-stone-600 mt-3">
          Inga aktiva deadlines just nu. När en deltagares delredovisning närmar sig sin frist
          dyker den upp här.
        </p>
      ) : (
        <ul className="space-y-1.5 mt-3">
          {deadlines.map((d) => {
            const severity = deadlineSeverity(d.daysLeft)
            return (
              <li key={d.enrollmentId}>
                <button
                  type="button"
                  onClick={() => onOpenParticipantDocuments(d.enrollmentId)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm text-left',
                    'border transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)]',
                    severity === 'critical' && 'bg-rose-50 border-rose-200 hover:bg-rose-100',
                    severity === 'warning' && 'bg-amber-50 border-amber-200 hover:bg-amber-100',
                    severity === 'normal' && 'bg-stone-50 border-stone-200 hover:bg-stone-100',
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900 truncate">
                      {d.participantName}
                    </div>
                    <div className="text-xs text-stone-600">{formatDocType(d.docType)}</div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        severity === 'critical' && 'text-rose-700',
                        severity === 'warning' && 'text-amber-800',
                        severity === 'normal' && 'text-stone-700',
                      )}
                    >
                      {formatDaysLeft(d.daysLeft)}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {formatShortDate(d.dueAt)}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function AiSummaryCard({
  stats,
  onChange,
}: {
  stats: EnrollmentStats[]
  onChange: () => void
}) {
  const activeEnrollments = useMemo(
    () => stats.filter((s) => s.enrollment.status === 'active').slice(0, 5),
    [stats],
  )
  const hasAnyParticipant = stats.length > 0

  if (!hasAnyParticipant || activeEnrollments.length === 0) {
    return (
      <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ background: 'var(--c-solid)' }}
          >
            <Bot size={12} />
            AI-veckosumma
          </span>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed">
          När du har aktiva deltagare visas en AI-genererad veckosumma per deltagare här,
          baserad på aktiviteter, pulse-checks och anteckningar från senaste 7 dagarna.
        </p>
      </Card>
    )
  }

  return (
    <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ background: 'var(--c-solid)' }}
        >
          <Bot size={12} />
          AI-veckosumma
        </span>
        <span className="text-[11px] text-stone-500">
          {activeEnrollments.length === 1
            ? '1 aktiv deltagare'
            : `${activeEnrollments.length} aktiva deltagare`}
        </span>
      </div>
      <ul className="space-y-2">
        {activeEnrollments.map((s) => (
          <AiSummaryItem key={s.enrollment.id} stats={s} onChange={onChange} />
        ))}
      </ul>
      {stats.filter((s) => s.enrollment.status === 'active').length > 5 && (
        <p className="text-[11px] text-stone-500 mt-3">
          Visar 5 mest aktuella. Öppna en deltagare för fullständig summa.
        </p>
      )}
    </Card>
  )
}

function AiSummaryItem({
  stats,
  onChange,
}: {
  stats: EnrollmentStats
  onChange: () => void
}) {
  const { enrollment } = stats
  const [summary, setSummary] = useState<string | null>(enrollment.ai_week_summary)
  const [summaryAt, setSummaryAt] = useState<string | null>(enrollment.ai_week_summary_generated_at)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const participantName = resolveParticipantName(enrollment)
  const ageMs = summaryAt ? Date.now() - new Date(summaryAt).getTime() : Infinity
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
  const isStale = summary && ageDays >= 7
  const ageLabel = !summaryAt
    ? null
    : ageDays === 0
      ? 'idag'
      : ageDays === 1
        ? 'igår'
        : `${ageDays} dagar sedan`

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const { generateWeekSummary } = await import('@/services/staAiApi')
      const text = await generateWeekSummary(enrollment.id)
      if (text) {
        await staEnrollmentsApi.setAiWeekSummary(enrollment.id, text)
        setSummary(text)
        setSummaryAt(new Date().toISOString())
        setExpanded(true)
        onChange()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte generera summa')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard kan misslyckas i vissa miljöer — tyst miss
    }
  }

  return (
    <li className="bg-white rounded-lg border border-stone-200 p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-stone-900 truncate">{participantName}</span>
          <span className="text-[11px] text-stone-500 flex-shrink-0">
            Del {enrollment.current_part}
          </span>
          {ageLabel && (
            <span
              className={cn(
                'text-[11px] flex-shrink-0',
                isStale ? 'text-amber-700' : 'text-stone-500',
              )}
            >
              · {ageLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {summary && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-1 rounded text-[11px] text-stone-600 hover:bg-stone-100 transition-colors"
              title="Kopiera till urklipp"
            >
              {copied ? 'Kopierad ✓' : 'Kopiera'}
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-medium transition-colors',
              'text-white disabled:opacity-50',
            )}
            style={{ background: 'var(--c-solid)' }}
          >
            {generating ? 'Genererar…' : summary ? 'Uppdatera' : 'Generera'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-700 mt-2">{error}</p>
      )}

      {summary && (
        <>
          <p
            className={cn(
              'text-sm text-stone-700 leading-relaxed mt-2',
              !expanded && 'line-clamp-3',
            )}
          >
            {summary}
          </p>
          {summary.length > 200 && (
            <button
              type="button"
              onClick={() => setExpanded((x) => !x)}
              className="text-[11px] text-stone-500 underline hover:text-stone-700 mt-1"
            >
              {expanded ? 'Visa mindre' : 'Visa mer'}
            </button>
          )}
        </>
      )}

      {!summary && !generating && !error && (
        <p className="text-xs text-stone-500 mt-2">
          Ingen summa genererad än — bygger på senaste 7 dagars aktiviteter, pulse-checks och anteckningar.
        </p>
      )}
    </li>
  )
}

function DraftsCard({
  drafts,
  onSelect,
  onSeeAll,
}: {
  drafts: Array<{
    id: string
    enrollmentId: string
    title: string
    participantName: string
    subtext: string
    docType: string
    aiDrafted: boolean
  }>
  onSelect: (enrollmentId: string) => void
  onSeeAll: () => void
}) {
  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-stone-900">Dokumentutkast att granska</h3>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ChevronRight size={14} />}
          onClick={onSeeAll}
        >
          Alla
        </Button>
      </div>
      {drafts.length === 0 ? (
        <p className="text-sm text-stone-600">
          Inga utkast att granska just nu. Utkast skapas i drawerns "Dokument"-flik.
        </p>
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onSelect(d.enrollmentId)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border border-stone-200',
                  'hover:bg-stone-50 transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)]',
                )}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-stone-900 flex items-center gap-2">
                      {d.title} — {d.participantName}
                      {d.aiDrafted && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                          style={{ background: 'var(--c-solid)' }}
                        >
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500">{d.subtext}</div>
                  </div>
                  <ChevronRight size={14} className="text-stone-400 flex-shrink-0" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function documentTypeLabel(docType: string): string {
  switch (docType) {
    case 'initial_planering': return 'Initial planering'
    case 'delredovisning_1': return 'Delredovisning Del 1'
    case 'delredovisning_2': return 'Delredovisning Del 2'
    case 'delredovisning_3': return 'Delredovisning Del 3'
    case 'delredovisning_4': return 'Delredovisning Del 4'
    case 'anmalan_arbetsprovning': return 'Anmälan arbetsprövning'
    case 'information_arbetsprovning': return 'Information från arbetsprövning'
    case 'atgardsplan_utebliven_ap': return 'Åtgärdsplan'
    case 'informativ_rapport_hjalpmedel': return 'Informativ rapport (hjälpmedel)'
    default: return docType
  }
}

// ===========================================================================
// PARTICIPANTS TAB
// ===========================================================================

type SortKey = 'name' | 'part' | 'daysLeft' | 'activity'
type SortDir = 'asc' | 'desc'
type EnrollmentStatusFilter = 'all' | 'active' | 'paused' | 'cancelled' | 'completed'
type LinkStatusFilter = 'all' | 'linked' | 'invited' | 'not_on_jobin'
type BulkAction = 'pause' | 'resume' | 'complete'

function ParticipantsTab({
  rows: allRows,
  loading,
  onOpen,
  onOpenDocuments,
  onLink,
  onAdd,
  onBulkInvite,
  onBulkImport,
  onReload,
}: {
  rows: StaParticipantRow[]
  loading: boolean
  onOpen: (id: string) => void
  onOpenDocuments: (id: string) => void
  onLink: (id: string) => void
  onAdd: () => void
  onBulkInvite: () => void
  onBulkImport: () => void
  onReload?: () => void
}) {
  const [filterPart, setFilterPart] = useState<'all' | StaPart>('all')
  const [filterStatus, setFilterStatus] = useState<EnrollmentStatusFilter>('active')
  const [filterLink, setFilterLink] = useState<LinkStatusFilter>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('daysLeft')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPending, setBulkPending] = useState<BulkAction | null>(null)
  const [bulkResult, setBulkResult] = useState<{
    action: BulkAction
    success: number
    failed: number
    errors: Array<{ id: string; name: string; error: string }>
  } | null>(null)
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null)

  // Reset page when filters/search change
  useEffect(() => {
    setPage(0)
  }, [filterPart, filterStatus, filterLink, search])

  const rows = useMemo(() => {
    const filtered = allRows.filter((p) => {
      if (filterPart !== 'all' && p.currentPart !== filterPart) return false
      if (filterStatus !== 'all' && p.enrollmentStatus !== filterStatus) return false
      if (filterLink !== 'all') {
        if (filterLink === 'not_on_jobin' && p.linkStatus === 'linked') return false
        if (filterLink === 'linked' && p.linkStatus !== 'linked') return false
        if (filterLink === 'invited' && p.linkStatus !== 'invited') return false
      }
      if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return dir * a.fullName.localeCompare(b.fullName, 'sv-SE')
        case 'part':
          return dir * (a.currentPart - b.currentPart)
        case 'daysLeft':
          return dir * (a.daysLeftInPart - b.daysLeftInPart)
        case 'activity':
          return dir * a.currentActivity.localeCompare(b.currentActivity, 'sv-SE')
        default:
          return 0
      }
    })
    return filtered
  }, [allRows, filterPart, filterStatus, filterLink, search, sortBy, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir(key === 'daysLeft' || key === 'part' ? 'asc' : 'asc')
    }
  }

  const totalCount = allRows.length
  const visibleCount = rows.length
  const totalPages = Math.max(1, Math.ceil(visibleCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageStart = safePage * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, visibleCount)
  const pageRows = useMemo(() => rows.slice(pageStart, pageEnd), [rows, pageStart, pageEnd])

  // selection-räckvidden = synlig sida; "Välj alla" markerar sidans rader.
  const visibleIds = useMemo(() => pageRows.map((r) => r.id), [pageRows])
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id))

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const runBulkAction = async (action: BulkAction) => {
    setConfirmAction(null)
    setBulkPending(action)
    setBulkResult(null)

    const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'completed'
    const targets = rows.filter((r) => selectedIds.has(r.id))

    const errors: Array<{ id: string; name: string; error: string }> = []
    let success = 0
    await Promise.all(
      targets.map(async (target) => {
        try {
          await staEnrollmentsApi.update(target.id, { status: newStatus })
          success += 1
        } catch (err) {
          errors.push({
            id: target.id,
            name: target.fullName,
            error: err instanceof Error ? err.message : 'Okänt fel',
          })
        }
      }),
    )

    setBulkResult({ action, success, failed: errors.length, errors })
    setBulkPending(null)
    if (success > 0) {
      clearSelection()
      onReload?.()
    }
  }

  const sortLabel: Record<SortKey, string> = {
    name: 'namn',
    part: 'del',
    daysLeft: 'tid kvar',
    activity: 'aktivitet',
  }

  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      {totalCount === 0 && !loading && (
        <div className="px-5 py-10 text-center">
          <h3 className="text-base font-semibold text-stone-900 mb-1">Inga deltagare än</h3>
          <p className="text-sm text-stone-600 mb-4 max-w-md mx-auto">
            Lägg till en deltagare manuellt, bjud in flera samtidigt, eller importera
            en CSV/Excel-fil med dina deltagare.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={onAdd}>
              Lägg till deltagare
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Users size={14} />} onClick={onBulkInvite}>
              Bjud in flera
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<FileSpreadsheet size={14} />} onClick={onBulkImport}>
              Importera CSV/Excel
            </Button>
          </div>
        </div>
      )}

      {totalCount > 0 && (
        <>
          {selectedIds.size > 0 && (
            <div
              className="px-5 py-3 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3 bg-stone-50"
              role="region"
              aria-label="Massåtgärder"
            >
              <div className="text-sm text-stone-800">
                <strong>{selectedIds.size}</strong>{' '}
                {selectedIds.size === 1 ? 'deltagare vald' : 'deltagare valda'}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Pause size={14} />}
                  onClick={() => setConfirmAction('pause')}
                  disabled={!!bulkPending}
                >
                  Pausa
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  onClick={() => setConfirmAction('resume')}
                  disabled={!!bulkPending}
                >
                  Återuppta
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<CheckCircle size={14} />}
                  onClick={() => setConfirmAction('complete')}
                  disabled={!!bulkPending}
                >
                  Markera avslutade
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection} disabled={!!bulkPending}>
                  Avbryt urval
                </Button>
              </div>
            </div>
          )}

          {bulkResult && (
            <div
              className={cn(
                'px-5 py-3 border-b text-sm flex items-start gap-2',
                bulkResult.failed === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900',
              )}
            >
              <div className="flex-1">
                {bulkResult.failed === 0 ? (
                  <span>
                    {bulkResult.success}{' '}
                    {bulkResult.success === 1 ? 'deltagare uppdaterad' : 'deltagare uppdaterade'} —{' '}
                    {bulkResult.action === 'pause' && 'pausade'}
                    {bulkResult.action === 'resume' && 'återupptagna'}
                    {bulkResult.action === 'complete' && 'markerade som avslutade'}
                    .
                  </span>
                ) : (
                  <>
                    <span>
                      {bulkResult.success} uppdaterad, {bulkResult.failed} misslyckades:
                    </span>
                    <ul className="mt-1 text-xs list-disc list-inside">
                      {bulkResult.errors.slice(0, 5).map((e) => (
                        <li key={e.id}>
                          {e.name}: {e.error}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBulkResult(null)}
                className="text-stone-500 hover:text-stone-700 flex-shrink-0"
                aria-label="Stäng meddelande"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Alla deltagare</h3>
              <p className="text-xs text-stone-500">
                Visar {visibleCount} av {totalCount} · sorterat på {sortLabel[sortBy]} ({sortDir === 'asc' ? 'stigande' : 'fallande'})
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={filterPart}
                onChange={(e) => setFilterPart(e.target.value === 'all' ? 'all' : (Number(e.target.value) as StaPart))}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på del"
              >
                <option value="all">Alla delar</option>
                <option value="1">Del 1</option>
                <option value="2">Del 2</option>
                <option value="3">Del 3</option>
                <option value="4">Del 4</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as EnrollmentStatusFilter)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på status"
              >
                <option value="active">Aktiva</option>
                <option value="paused">Pausade</option>
                <option value="completed">Avslutade</option>
                <option value="cancelled">Avbrutna</option>
                <option value="all">Alla statusar</option>
              </select>
              <select
                value={filterLink}
                onChange={(e) => setFilterLink(e.target.value as LinkStatusFilter)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på koppling"
              >
                <option value="all">Alla kopplingar</option>
                <option value="linked">På Jobin</option>
                <option value="invited">Inbjudna</option>
                <option value="not_on_jobin">Inte på Jobin</option>
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök deltagare…"
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>
              <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={onAdd}>
                Lägg till
              </Button>
            </div>
          </div>

          {visibleCount === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-600">
              Inga deltagare matchar dina filter. Justera filter eller{' '}
              <button
                type="button"
                onClick={() => {
                  setFilterPart('all')
                  setFilterStatus('all')
                  setFilterLink('all')
                  setSearch('')
                }}
                className="underline text-stone-700 hover:text-stone-900"
              >
                rensa alla filter
              </button>
              .
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ParticipantsTable
                  rows={pageRows}
                  onOpen={onOpen}
                  onOpenDocuments={onOpenDocuments}
                  onLink={onLink}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  selectedIds={selectedIds}
                  onToggle={toggleOne}
                  allVisibleSelected={allVisibleSelected}
                  someVisibleSelected={someVisibleSelected}
                  onToggleAll={toggleAllVisible}
                />
              </div>
              <div className="md:hidden">
                <ParticipantsCardList
                  rows={pageRows}
                  onOpen={onOpen}
                  onOpenDocuments={onOpenDocuments}
                  onLink={onLink}
                  selectedIds={selectedIds}
                  onToggle={toggleOne}
                />
              </div>
              {visibleCount > PAGE_SIZE && (
                <PaginationBar
                  page={safePage}
                  totalPages={totalPages}
                  pageStart={pageStart}
                  pageEnd={pageEnd}
                  total={visibleCount}
                  onPage={setPage}
                />
              )}
            </>
          )}

          {confirmAction && (
            <BulkActionConfirm
              action={confirmAction}
              count={selectedIds.size}
              onConfirm={() => runBulkAction(confirmAction)}
              onCancel={() => setConfirmAction(null)}
            />
          )}

          {bulkPending && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30">
              <div className="bg-white rounded-xl shadow-xl px-6 py-5 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
                <span className="text-sm text-stone-800">
                  Uppdaterar {selectedIds.size} {selectedIds.size === 1 ? 'deltagare' : 'deltagare'}…
                </span>
              </div>
            </div>
          )}

        </>
      )}
    </Card>
  )
}

function PaginationBar({
  page,
  totalPages,
  pageStart,
  pageEnd,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  pageStart: number
  pageEnd: number
  total: number
  onPage: (p: number) => void
}) {
  // Visa max 5 sidnummer kring nuvarande
  const windowStart = Math.max(0, Math.min(page - 2, totalPages - 5))
  const windowEnd = Math.min(totalPages, windowStart + 5)
  const pages: number[] = []
  for (let i = windowStart; i < windowEnd; i++) pages.push(i)

  return (
    <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-3 text-sm">
      <div className="text-stone-600">
        Visar {pageStart + 1}–{pageEnd} av {total}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className={cn(
            'px-2 py-1 rounded text-xs',
            page === 0
              ? 'text-stone-400 cursor-not-allowed'
              : 'text-stone-700 hover:bg-stone-100',
          )}
        >
          ← Föregående
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={cn(
              'w-8 h-8 rounded text-xs font-medium',
              p === page
                ? 'text-white'
                : 'text-stone-700 hover:bg-stone-100',
            )}
            style={p === page ? { background: 'var(--c-solid)' } : undefined}
            aria-current={p === page ? 'page' : undefined}
          >
            {p + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className={cn(
            'px-2 py-1 rounded text-xs',
            page >= totalPages - 1
              ? 'text-stone-400 cursor-not-allowed'
              : 'text-stone-700 hover:bg-stone-100',
          )}
        >
          Nästa →
        </button>
      </div>
    </div>
  )
}

function BulkActionConfirm({
  action,
  count,
  onConfirm,
  onCancel,
}: {
  action: BulkAction
  count: number
  onConfirm: () => void
  onCancel: () => void
}) {
  const labels: Record<BulkAction, { title: string; body: string; confirmLabel: string }> = {
    pause: {
      title: 'Pausa deltagare',
      body: `Pausa ${count} ${count === 1 ? 'deltagare' : 'deltagare'}? Deltagaren stannar i listan men markeras som pausad. Du kan återuppta när som helst.`,
      confirmLabel: 'Pausa',
    },
    resume: {
      title: 'Återuppta deltagare',
      body: `Återuppta ${count} ${count === 1 ? 'deltagare' : 'deltagare'}? Status sätts tillbaka till aktiv.`,
      confirmLabel: 'Återuppta',
    },
    complete: {
      title: 'Markera som avslutade',
      body: `Markera ${count} ${count === 1 ? 'deltagare' : 'deltagare'} som avslutade? Inskickade dokument bevaras men programmet räknas som klart.`,
      confirmLabel: 'Markera avslutade',
    },
  }
  const { title, body, confirmLabel } = labels[action]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onCancel}
        aria-label="Stäng"
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-stone-900 mb-2">{title}</h3>
          <p className="text-sm text-stone-700">{body}</p>
        </div>
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
          <Button variant="ghost" onClick={onCancel}>
            Avbryt
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ParticipantsTable({
  rows,
  onOpen,
  onOpenDocuments,
  onLink,
  sortBy,
  sortDir,
  onSort,
  selectedIds,
  onToggle,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAll,
  showAddButton: _showAddButton = true,
}: {
  rows: StaParticipantRow[]
  onOpen: (id: string) => void
  onOpenDocuments?: (id: string) => void
  onLink: (id: string) => void
  sortBy?: SortKey
  sortDir?: SortDir
  onSort?: (key: SortKey) => void
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
  allVisibleSelected?: boolean
  someVisibleSelected?: boolean
  onToggleAll?: () => void
  showAddButton?: boolean
}) {
  const selectable = !!onToggle && !!selectedIds
  const renderSortableTh = (key: SortKey, label: string) => {
    if (!onSort) {
      return (
        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">
          {label}
        </th>
      )
    }
    const isActive = sortBy === key
    return (
      <th className="border-b border-stone-100 p-0">
        <button
          type="button"
          onClick={() => onSort(key)}
          className={cn(
            'w-full px-4 py-3 text-xs font-medium uppercase tracking-wide text-left',
            'flex items-center gap-1 transition-colors',
            isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700',
          )}
        >
          {label}
          <span aria-hidden="true" className={cn('text-[10px]', !isActive && 'opacity-30')}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {selectable && (
              <th className="px-3 py-3 border-b border-stone-100 w-10">
                <input
                  type="checkbox"
                  aria-label="Välj alla synliga deltagare"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !!someVisibleSelected && !allVisibleSelected
                  }}
                  onChange={onToggleAll}
                  className="w-4 h-4 rounded border-stone-300 text-[var(--c-solid)] focus:ring-[var(--c-solid)]"
                />
              </th>
            )}
            {renderSortableTh('name', 'Deltagare')}
            {renderSortableTh('part', 'Del')}
            {renderSortableTh('daysLeft', 'Tid kvar')}
            {renderSortableTh('activity', 'Aktivitet')}
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Skattningar</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Anpassning</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Snabbåtgärder</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <ParticipantRow
              key={p.id}
              row={p}
              onOpen={onOpen}
              onOpenDocuments={onOpenDocuments}
              onLink={onLink}
              selected={selectedIds?.has(p.id)}
              onToggle={onToggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ParticipantsCardList({
  rows,
  onOpen,
  onOpenDocuments,
  onLink,
  selectedIds,
  onToggle,
}: {
  rows: StaParticipantRow[]
  onOpen: (id: string) => void
  onOpenDocuments?: (id: string) => void
  onLink: (id: string) => void
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
}) {
  return (
    <ul className="divide-y divide-stone-100">
      {rows.map((p) => (
        <li key={p.id}>
          <ParticipantCard
            row={p}
            onOpen={onOpen}
            onOpenDocuments={onOpenDocuments}
            onLink={onLink}
            selected={selectedIds?.has(p.id)}
            onToggle={onToggle}
          />
        </li>
      ))}
    </ul>
  )
}

function ParticipantCard({
  row,
  onOpen,
  onOpenDocuments,
  onLink,
  selected,
  onToggle,
}: {
  row: StaParticipantRow
  onOpen: (id: string) => void
  onOpenDocuments?: (id: string) => void
  onLink: (id: string) => void
  selected?: boolean
  onToggle?: (id: string) => void
}) {
  return (
    <div className={cn(
      'px-4 py-4 hover:bg-stone-50 transition-colors',
      selected && 'bg-stone-50',
    )}>
      {/* Identifierare + link-status */}
      <div className="flex items-start gap-3 mb-3">
        {onToggle && (
          <input
            type="checkbox"
            aria-label={`Välj ${row.fullName}`}
            checked={!!selected}
            onChange={() => onToggle(row.id)}
            className="mt-1 w-4 h-4 rounded border-stone-300 text-[var(--c-solid)] focus:ring-[var(--c-solid)] flex-shrink-0"
          />
        )}
        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-700 flex-shrink-0">
          {row.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-stone-900 flex items-center gap-2 flex-wrap">
            {row.fullName}
            <LinkStatusBadge status={row.linkStatus} />
          </div>
          <div className="text-xs text-stone-500">
            {row.focusOccupation ? `Fokusyrke: ${row.focusOccupation}` : 'Fokusyrke: ej fastställt'}
          </div>
        </div>
      </div>

      {/* Tre-radig metadata-rad */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <div className="text-stone-500 uppercase tracking-wide text-[10px] mb-0.5">Del</div>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
          >
            Del {row.currentPart}
          </span>
        </div>
        <div>
          <div className="text-stone-500 uppercase tracking-wide text-[10px] mb-0.5">Tid kvar</div>
          <div className="text-stone-900 font-medium text-sm">
            {row.daysLeftInPart > 30 ? `${Math.round(row.daysLeftInPart / 30)} mån` : `${row.daysLeftInPart} dagar`}
          </div>
          <div className="text-[11px] text-stone-500">Slut {row.partEndsAt}</div>
        </div>
      </div>

      {/* Aktivitet */}
      <div className="mb-3">
        <div className="text-stone-500 uppercase tracking-wide text-[10px] mb-0.5">Aktivitet</div>
        <div className="text-sm text-stone-700">{row.currentActivity}</div>
        <div className="text-[11px] text-stone-500">{row.activitySubtext}</div>
        {row.activityProgress !== undefined && (
          <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-stone-100 w-full max-w-[200px]">
            <div className="h-full" style={{ width: `${row.activityProgress}%`, background: 'var(--c-solid)' }} />
          </div>
        )}
      </div>

      {/* Skattningar */}
      {row.assessments.length > 0 && (
        <div className="mb-3">
          <div className="text-stone-500 uppercase tracking-wide text-[10px] mb-1">Skattningar</div>
          <div className="flex flex-wrap gap-1">
            {row.assessments.map((a, i) => (
              <AssessmentChip key={i} label={a.label} status={a.status} />
            ))}
          </div>
        </div>
      )}

      {/* Anpassning — visa bara om något särskilt */}
      {row.adaptations && row.adaptations !== 'Inga särskilda' && (
        <div className="mb-3">
          <div className="text-stone-500 uppercase tracking-wide text-[10px] mb-0.5">Anpassning</div>
          <div className="text-xs text-stone-700">{row.adaptations}</div>
        </div>
      )}

      {/* Snabbåtgärder */}
      <div className="flex gap-1.5 flex-wrap pt-2 border-t border-stone-100">
        <Button variant="ghost" size="sm" onClick={() => onOpen(row.id)}>
          Öppna
        </Button>
        {row.hasDraft > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => (onOpenDocuments ?? onOpen)(row.id)}
          >
            Granska ({row.hasDraft})
          </Button>
        )}
        {row.linkStatus !== 'linked' && (
          <Button variant="secondary" size="sm" leftIcon={<LinkIcon size={12} />} onClick={() => onLink(row.id)}>
            Koppla
          </Button>
        )}
      </div>
    </div>
  )
}

function LinkStatusBadge({ status }: { status: ParticipantLinkStatus }) {
  if (status === 'linked') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700" title="Kopplad till Jobin-konto">
        <LinkIcon size={10} />
        På Jobin
      </span>
    )
  }
  if (status === 'invited') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700" title="Inbjudan skickad">
        <Send size={10} />
        Inbjuden
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-600" title="Endast i konsulent-vyn">
      <Unlink size={10} />
      Inte på Jobin
    </span>
  )
}

function ParticipantRow({
  row,
  onOpen,
  onOpenDocuments,
  onLink,
  selected,
  onToggle,
}: {
  row: StaParticipantRow
  onOpen: (id: string) => void
  onOpenDocuments?: (id: string) => void
  onLink: (id: string) => void
  selected?: boolean
  onToggle?: (id: string) => void
}) {
  return (
    <tr className={cn(
      'hover:bg-stone-50 border-b border-stone-100 last:border-0',
      selected && 'bg-stone-50',
    )}>
      {onToggle && (
        <td className="px-3 py-3 align-middle">
          <input
            type="checkbox"
            aria-label={`Välj ${row.fullName}`}
            checked={!!selected}
            onChange={() => onToggle(row.id)}
            className="w-4 h-4 rounded border-stone-300 text-[var(--c-solid)] focus:ring-[var(--c-solid)]"
          />
        </td>
      )}
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-700">
            {row.initials}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-stone-900 flex items-center gap-2 flex-wrap">
              {row.fullName}
              <LinkStatusBadge status={row.linkStatus} />
            </div>
            <div className="text-xs text-stone-500">
              {row.focusOccupation ? `Fokusyrke: ${row.focusOccupation}` : 'Fokusyrke: ej fastställt'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
        >
          Del {row.currentPart}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="text-stone-900 font-medium text-sm">
          {row.daysLeftInPart > 30 ? `${Math.round(row.daysLeftInPart / 30)} mån kvar` : `${row.daysLeftInPart} dagar`}
        </div>
        <div className="text-xs text-stone-500">Slut {row.partEndsAt}</div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="text-stone-700 text-sm">{row.currentActivity}</div>
        <div className="text-xs text-stone-500">{row.activitySubtext}</div>
        {row.activityProgress !== undefined && (
          <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-stone-100 w-24">
            <div className="h-full" style={{ width: `${row.activityProgress}%`, background: 'var(--c-solid)' }} />
          </div>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-wrap gap-1">
          {row.assessments.map((a, i) => (
            <AssessmentChip key={i} label={a.label} status={a.status} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-xs text-stone-600">{row.adaptations}</td>
      <td className="px-4 py-3 align-middle">
        <div className="flex gap-1 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => onOpen(row.id)}>
            Öppna
          </Button>
          {row.hasDraft > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => (onOpenDocuments ?? onOpen)(row.id)}
            >
              Granska utkast ({row.hasDraft})
            </Button>
          )}
          {row.linkStatus !== 'linked' && (
            <Button variant="secondary" size="sm" leftIcon={<LinkIcon size={12} />} onClick={() => onLink(row.id)}>
              Koppla
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

function AssessmentChip({
  label,
  status,
}: {
  label: string
  status: 'pending' | 'done' | 'due_today' | 'in_progress'
}) {
  const classes = {
    pending: 'bg-stone-100 text-stone-500',
    done: 'bg-emerald-50 text-emerald-700',
    due_today: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-stone-100 text-stone-600',
  }[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', classes)}>
      {label}
    </span>
  )
}

// ===========================================================================
// PARTICIPANT DETAIL DRAWER (slides over)
// ===========================================================================

function PauseResumeButton({
  enrollmentId,
  status,
  onChange,
}: {
  enrollmentId: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  onChange?: () => void
}) {
  const [saving, setSaving] = useState(false)
  if (status === 'completed' || status === 'cancelled') return null
  const isPaused = status === 'paused'
  const handle = async () => {
    setSaving(true)
    try {
      await staEnrollmentsApi.update(enrollmentId, { status: isPaused ? 'active' : 'paused' })
      onChange?.()
    } finally {
      setSaving(false)
    }
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handle}
      isLoading={saving}
      leftIcon={isPaused ? <Play size={14} /> : <Pause size={14} />}
      aria-label={isPaused ? 'Återuppta insatsen' : 'Pausa insatsen (max 14 dagar)'}
    >
      {isPaused ? 'Återuppta' : 'Pausa'}
    </Button>
  )
}

function ParticipantDetailDrawer({
  stats,
  initialSubTab = 'oversikt',
  onClose,
  onLink,
  onChange,
}: {
  stats: EnrollmentStats
  initialSubTab?: DrawerSubTab
  onClose: () => void
  onLink: () => void
  onChange?: () => void
}) {
  const [subTab, setSubTab] = useState<DrawerSubTab>(initialSubTab)
  const participant: StaParticipantRow = toParticipantRow(stats)
  const realEnrollmentId = stats.enrollment.id

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Stäng"
        className="flex-1 bg-stone-900/30"
        onClick={onClose}
      />
      <aside className="w-full max-w-3xl bg-white shadow-2xl overflow-y-auto" data-domain="action">
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-stone-200 flex items-center justify-center text-stone-700 font-semibold">
              {participant.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-stone-900">{participant.fullName}</h2>
                <LinkStatusBadge status={participant.linkStatus} />
              </div>
              <div className="text-sm text-stone-600">
                Del {participant.currentPart} · {participant.daysLeftInPart > 30 ? `${Math.round(participant.daysLeftInPart / 30)} mån kvar` : `${participant.daysLeftInPart} dagar kvar`} · slut {participant.partEndsAt}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-stone-100 text-stone-700">
                  Fokusyrke: {participant.focusOccupation || 'ej fastställt'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-stone-100 text-stone-700">
                  Anpassning: {participant.adaptations}
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
                >
                  {participant.weeklyHours} h/vecka
                </span>
                {participant.enrollmentStatus === 'paused' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-medium">
                    Pausad
                  </span>
                )}
                {participant.enrollmentStatus === 'completed' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-medium">
                    Avslutad
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {realEnrollmentId && (
              <PauseResumeButton
                enrollmentId={realEnrollmentId}
                status={participant.enrollmentStatus}
                onChange={onChange}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-100"
              aria-label="Stäng"
            >
              <X size={18} className="text-stone-500" />
            </button>
          </div>
        </div>

        {participant.enrollmentStatus === 'paused' && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
            <AlertTriangle size={16} className="text-amber-700 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <strong>Insatsen är pausad.</strong> Tidsräknaren står still — deltagaren ser en
              pause-banner på sin sida. Max 14 dagars uppehåll enligt AF.
            </div>
          </div>
        )}

        {/* Unlinked banner */}
        {participant.linkStatus !== 'linked' && (
          <div
            className={cn(
              'px-6 py-3 flex items-center gap-3 border-b border-stone-100',
              participant.linkStatus === 'invited' ? 'bg-amber-50' : 'bg-stone-50',
            )}
          >
            <div className={cn('p-1.5 rounded-full', participant.linkStatus === 'invited' ? 'bg-amber-100' : 'bg-stone-200')}>
              {participant.linkStatus === 'invited' ? (
                <Send size={14} className="text-amber-700" />
              ) : (
                <Unlink size={14} className="text-stone-600" />
              )}
            </div>
            <div className="flex-1 text-sm">
              {participant.linkStatus === 'invited' ? (
                <>
                  <span className="font-medium text-stone-900">Inbjudan skickad till {participant.manualContact?.email}.</span>{' '}
                  <span className="text-stone-600">Du ser bara dina egna anteckningar tills hen registrerar sig.</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-stone-900">{participant.fullName} har inget Jobin-konto.</span>{' '}
                  <span className="text-stone-600">All data ligger lokalt hos dig. Koppla när hen registrerar sig.</span>
                </>
              )}
            </div>
            <Button variant="secondary" size="sm" leftIcon={<LinkIcon size={12} />} onClick={onLink}>
              {participant.linkStatus === 'invited' ? 'Hantera inbjudan' : 'Koppla till Jobin-konto'}
            </Button>
          </div>
        )}

        <DrawerDeadlineBanner stats={stats} onOpenDocuments={() => setSubTab('dokument')} />

        <div className="px-6 pt-4 flex flex-wrap gap-1 border-b border-stone-100">
          {([
            ['oversikt', 'Översikt'],
            ['aktivitet', 'Aktivitetslogg'],
            ['skattningar', 'Skattningar'],
            ['dokument', 'Dokument'],
            ['anteckningar', 'Anteckningar'],
          ] as const).map(([id, label]) => {
            const isActive = subTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSubTab(id)}
                className={cn(
                  'px-3 py-2 text-sm border-b-2 -mb-px font-medium',
                  isActive
                    ? 'text-[var(--c-text)]'
                    : 'border-transparent text-stone-600 hover:text-stone-900',
                )}
                style={isActive ? { borderColor: 'var(--c-solid)' } : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="px-6 py-5">
          {subTab === 'oversikt' && (
            <DetailOverview
              participant={participant}
              enrollmentId={realEnrollmentId}
              enrollment={stats.enrollment}
              assessments={stats.assessments}
              activities={stats.activities}
              recentReflection={
                stats.quickNotes
                  .filter((n) => n.body && n.visibility !== 'consultant_only')
                  .slice(0, 1)
                  .map((n) => ({ text: n.body!, at: new Date(n.created_at).toLocaleDateString('sv-SE') }))[0] ?? null
              }
              onChange={onChange}
            />
          )}
          {subTab === 'aktivitet' && <DetailActivityLog stats={stats} />}
          {subTab === 'skattningar' && (
            <DetailAssessments
              enrollmentId={realEnrollmentId}
              stats={stats}
              onChange={onChange}
            />
          )}
          {subTab === 'dokument' && (
            <DetailDocuments
              participantName={participant.fullName}
              enrollmentId={realEnrollmentId}
              stats={stats}
            />
          )}
          {subTab === 'anteckningar' && (
            <DetailNotes
              enrollmentId={realEnrollmentId}
              consultantName={participant.fullName}
              onChange={onChange}
            />
          )}
        </div>
      </aside>
    </div>
  )
}

function DrawerDeadlineBanner({
  stats,
  onOpenDocuments,
}: {
  stats: EnrollmentStats
  onOpenDocuments: () => void
}) {
  const deadline = useMemo(() => nextDeadlineFor(stats), [stats])
  if (!deadline || deadline.alreadySubmitted) return null

  const severity = deadlineSeverity(deadline.daysLeft)
  if (severity === 'normal' && deadline.daysLeft > 14) return null // bara visa när det är inom 14 dagar

  const toneClass: Record<typeof severity, string> = {
    critical: 'bg-rose-50 border-rose-200 text-rose-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    normal: 'bg-stone-50 border-stone-200 text-stone-800',
  }
  const iconColor: Record<typeof severity, string> = {
    critical: 'text-rose-600',
    warning: 'text-amber-600',
    normal: 'text-stone-500',
  }

  return (
    <div className={cn('mx-6 mt-4 p-3 rounded-lg border flex items-start gap-3 flex-wrap', toneClass[severity])}>
      <AlertTriangle size={18} className={cn('flex-shrink-0 mt-0.5', iconColor[severity])} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">
          {formatDocType(deadline.docType)} — {formatDaysLeft(deadline.daysLeft)}
        </div>
        <div className="text-xs">
          AF-tidsfrist {formatShortDate(deadline.dueAt)}.{' '}
          {severity === 'critical' && 'Kritiskt — granska och skicka in idag.'}
          {severity === 'warning' && 'Snart deadline — påbörja granskning.'}
          {severity === 'normal' && 'Inom 2 veckor.'}
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onOpenDocuments}>
        Öppna dokument
      </Button>
    </div>
  )
}

function DetailOverview({
  participant,
  enrollmentId,
  enrollment,
  assessments,
  activities,
  recentReflection,
  onChange,
}: {
  participant: StaParticipantRow
  enrollmentId: string | null
  enrollment: import('@/services/staApi').StaEnrollment
  assessments: import('@/services/staApi').StaAssessment[]
  activities: import('@/services/staApi').StaActivity[]
  recentReflection: { text: string; at: string } | null
  onChange?: () => void
}) {
  const { absences } = useStaAbsences(enrollmentId)
  const recentAbsences = absences.slice(0, 4)
  const kompAct = activities.find((a) => a.activity_key === 'kompetenskartlaggning') ?? null

  const [summary, setSummary] = useState<string | null>(enrollment.ai_week_summary)
  const [summaryAt, setSummaryAt] = useState<string | null>(enrollment.ai_week_summary_generated_at)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleGenerateSummary = async () => {
    if (!enrollmentId) return
    setGenerating(true)
    setGenerationError(null)
    try {
      const { generateWeekSummary } = await import('@/services/staAiApi')
      const text = await generateWeekSummary(enrollmentId)
      if (text) {
        await staEnrollmentsApi.setAiWeekSummary(enrollmentId, text)
        setSummary(text)
        setSummaryAt(new Date().toISOString())
        onChange?.()
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Kunde inte generera summa')
    } finally {
      setGenerating(false)
    }
  }

  // Hitta del-specifika skattningar för aktuell del — fall tillbaka på alla
  const partAssessments = assessments.filter((a) => a.part === participant.currentPart)
  const visibleInstruments = ((): Array<'DOA' | 'WRI' | 'MOHOST' | 'AWP' | 'AWC'> => {
    if (participant.currentPart === 1) return ['DOA', 'WRI', 'MOHOST']
    if (participant.currentPart === 2) return ['AWP', 'AWC', 'MOHOST']
    return ['AWP', 'AWC', 'DOA']
  })()
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <KompetenskartlaggningSummary activity={kompAct} />

        {recentAbsences.length > 0 && (
          <Card variant="flat" padding="md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-stone-900">Senaste frånvaroanmälningar</h4>
              <span className="text-[11px] text-stone-500">{absences.length} totalt senaste 60 dgr</span>
            </div>
            <ul className="space-y-1.5">
              {recentAbsences.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg bg-stone-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-900">{formatAbsenceDate(a.absence_date)}</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-stone-700">{labelForAbsenceKind(a.kind)}</span>
                  </div>
                  {a.reason && <span className="text-xs text-stone-500 truncate max-w-[180px]">{a.reason}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card variant="flat" padding="md" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, var(--c-bg) 100%)' }}>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
              style={{ background: 'var(--c-solid)' }}
            >
              <Bot size={10} />
              AI · veckosumma
            </span>
            {summaryAt && (
              <span className="text-[11px] text-stone-500">
                Senast genererad {new Date(summaryAt).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </div>
          {summary ? (
            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">{summary}</p>
          ) : (
            <p className="text-sm text-stone-600">
              Generera en sammanfattning av deltagarens senaste vecka — aktiviteter, reflektioner
              och pulse-checks. Drivs av openai/gpt-oss-120b.
            </p>
          )}
          {generationError && (
            <p className="text-sm text-rose-700 mt-2">{generationError}</p>
          )}
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              variant={summary ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleGenerateSummary}
              isLoading={generating}
              leftIcon={<Bot size={12} />}
            >
              {summary ? 'Generera nytt' : 'Generera veckosumma'}
            </Button>
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (summary) {
                    navigator.clipboard?.writeText(summary).catch(() => {})
                  }
                }}
              >
                Kopiera
              </Button>
            )}
          </div>
        </Card>

        <div>
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Skattningar i Del {participant.currentPart}</h4>
          <div className="grid grid-cols-3 gap-3">
            {visibleInstruments.map((instrument) => {
              const a = partAssessments.find((x) => x.instrument === instrument)
              const status = !a
                ? 'Ej påbörjad'
                : a.status === 'complete' || a.status === 'submitted_to_af'
                  ? 'Klar'
                  : 'Pågående'
              const progress = a && a.scores && Object.keys(a.scores).length > 0
                ? Math.min(100, Object.keys(a.scores).length * 10)
                : 0
              return (
                <Card key={instrument} variant="flat" padding="sm" className="text-center">
                  <div className="text-xs font-medium text-stone-500">{instrument}</div>
                  <div className="text-sm font-semibold text-stone-900 mt-1">{status}</div>
                  {progress > 0 ? (
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden bg-stone-100">
                      <div className="h-full" style={{ width: `${progress}%`, background: 'var(--c-solid)' }} />
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="mt-2 !text-xs">Starta</Button>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <Card variant="flat" padding="md">
          <div className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-2">Snabbåtgärder</div>
          <div className="space-y-1">
            <QuickAction icon={<FileText size={14} />} label="Skapa anteckning" />
            <QuickAction icon={<Calendar size={14} />} label="Boka möte" />
            <QuickAction icon={<ClipboardList size={14} />} label="Tilldela dagsuppgift" />
            <QuickAction icon={<MessageSquare size={14} />} label="Skicka meddelande" />
          </div>
        </Card>

        {recentReflection ? (
          <Card variant="flat" padding="md" className="bg-stone-50">
            <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">Senaste reflektion</div>
            <p className="text-sm text-stone-800 italic mt-2">"{recentReflection.text}"</p>
            <div className="text-xs text-stone-500 mt-2">{recentReflection.at}</div>
          </Card>
        ) : (
          <Card variant="flat" padding="md" className="bg-stone-50">
            <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">Senaste reflektion</div>
            <p className="text-sm text-stone-600 mt-2">Inga reflektioner sparade än.</p>
          </Card>
        )}
      </aside>
    </div>
  )
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900 hover:bg-stone-50 px-2 py-1.5 rounded transition-colors text-left"
    >
      <span className="text-stone-500">{icon}</span>
      {label}
    </button>
  )
}

function DetailActivityLog({ stats }: { stats: EnrollmentStats }) {
  const recent = [...stats.activities]
    .filter((a) => a.completed_at || a.scheduled_for)
    .sort((a, b) => {
      const aT = a.completed_at ?? a.scheduled_for ?? ''
      const bT = b.completed_at ?? b.scheduled_for ?? ''
      return bT.localeCompare(aT)
    })
    .slice(0, 20)

  return (
    <div>
      <h4 className="text-sm font-semibold text-stone-900 mb-3">Aktivitetslogg</h4>
      {recent.length === 0 ? (
        <p className="text-sm text-stone-500">Ingen aktivitet ännu — väntar på första genomförda dag eller samtal.</p>
      ) : (
        <ol className="border-l-2 border-stone-200 ml-3 space-y-3">
          {recent.map((entry) => {
            const dateStr = entry.completed_at ?? entry.scheduled_for ?? ''
            const displayDate = dateStr ? new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) : ''
            const highlight = !!entry.completed_at
            return (
              <li key={entry.id} className="pl-4 relative">
                <span
                  className={cn(
                    'absolute -left-[7px] top-1.5 w-3 h-3 rounded-full',
                    highlight ? '' : 'bg-stone-300',
                  )}
                  style={highlight ? { background: 'var(--c-solid)' } : undefined}
                />
                <div className="text-sm font-medium text-stone-900">
                  {entry.activity_key ?? entry.activity_type}
                </div>
                <div className="text-xs text-stone-500">
                  {displayDate} · {entry.activity_type}{entry.attendance ? ` · ${entry.attendance}` : ''}
                </div>
                {entry.participant_reflection && (
                  <p className="text-xs text-stone-600 italic mt-1">"{entry.participant_reflection.slice(0, 150)}"</p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function DetailAssessments({
  enrollmentId,
  stats,
  onChange,
}: {
  enrollmentId: string | null
  stats: EnrollmentStats
  onChange?: () => void
}) {
  const { profile } = useAuthStore()
  const consultantName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || (profile.email ?? '')
    : ''
  const [editingAssessment, setEditingAssessment] = useState<import('@/services/staApi').StaAssessment | null>(null)
  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        Alla instrumentskattningar för Del {stats.enrollment.current_part}.
        {enrollmentId && (
          <> Skattningarna sparas mot enrollment-id <code className="text-[10px]">{enrollmentId.slice(0, 8)}</code>.</>
        )}
      </p>
      {stats.assessments.length === 0 ? (
        <Card variant="flat" padding="md" className="bg-stone-50">
          <p className="text-sm text-stone-600 mb-2">
            Inga skattningar startade än. Per del rekommenderas:
          </p>
          <ul className="text-xs text-stone-600 list-disc list-inside">
            <li>Del 1: DOA, WRI, MOHOST</li>
            <li>Del 2: AWP × 3, MOHOST</li>
            <li>Del 3-4: AWC, AWP, DOA, MOHOST</li>
          </ul>
        </Card>
      ) : (
        stats.assessments.map((a) => {
          const itemCount = ASSESSMENT_ITEM_COUNT[a.instrument as Instrument] ?? 13
          const progress = a.scores
            ? Math.min(100, Math.round((Object.keys(a.scores as object).length / itemCount) * 100))
            : 0
          const status: 'pending' | 'in_progress' | 'complete' =
            a.status === 'complete' || a.status === 'submitted_to_af'
              ? 'complete'
              : progress > 0
                ? 'in_progress'
                : 'pending'
          return (
            <AssessmentDetailRow
              key={a.id}
              assessment={a}
              progress={progress}
              status={status}
              onOpen={() => setEditingAssessment(a)}
            />
          )
        })
      )}

      {editingAssessment && (
        <AssessmentEditor
          assessment={editingAssessment}
          enrollment={stats.enrollment}
          consultantName={consultantName}
          onClose={() => setEditingAssessment(null)}
          onSaved={() => {
            setEditingAssessment(null)
            onChange?.()
          }}
        />
      )}
    </div>
  )
}

function AssessmentDetailRow({
  assessment,
  progress,
  status,
  onOpen,
}: {
  assessment: import('@/services/staApi').StaAssessment
  progress: number
  status: 'pending' | 'in_progress' | 'complete'
  onOpen: () => void
}) {
  return (
    <div className="p-3 rounded-lg border border-stone-200 flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-stone-900 text-sm">
          {assessment.instrument} · Del {assessment.part}
        </div>
        <div className="text-xs text-stone-500">
          {status === 'pending' && 'Ej påbörjad'}
          {status === 'in_progress' && `Pågående · ${progress}%`}
          {status === 'complete' && 'Klar'}
        </div>
      </div>
      {status === 'in_progress' && (
        <div className="h-1.5 rounded-full overflow-hidden bg-stone-100 w-32">
          <div className="h-full" style={{ width: `${progress}%`, background: 'var(--c-solid)' }} />
        </div>
      )}
      {status === 'complete' && <AssessmentSignature assessment={assessment} compact />}
      <Button
        variant={status === 'pending' ? 'primary' : 'secondary'}
        size="sm"
        onClick={onOpen}
      >
        {status === 'pending' ? 'Starta' : status === 'in_progress' ? 'Fortsätt' : 'Visa'}
      </Button>
    </div>
  )
}

function DetailDocuments({
  participantName,
  enrollmentId,
  stats,
}: {
  participantName: string
  enrollmentId: string | null
  stats: EnrollmentStats
}) {
  const navigate = useNavigate()
  const goTo = (docType: keyof typeof DOC_TYPE_META) => {
    if (!enrollmentId) return
    navigate(`/konsulent/steg-till-arbete/dokument/${enrollmentId}/${docType}`)
  }

  // Tillgängliga dokumenttyper för aktuell del
  const docTypesForPart: Array<{ key: keyof typeof DOC_TYPE_META; label: string }> = (() => {
    const part = stats.enrollment.current_part
    const list: Array<{ key: keyof typeof DOC_TYPE_META; label: string }> = []
    if (part === 1) list.push({ key: 'initial_planering', label: 'Initial planering' })
    list.push({ key: `delredovisning_${part}` as keyof typeof DOC_TYPE_META, label: `Delredovisning Del ${part}` })
    if (part >= 3) list.push({ key: 'anmalan_arbetsprovning', label: 'Anmälan arbetsprövning' })
    if (part >= 3) list.push({ key: 'information_arbetsprovning', label: 'Information från arbetsprövningsplats' })
    return list
  })()

  const existing = stats.documents

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        Dokument för {participantName}. Klicka för att öppna AI-utkast-arbetsytan och ladda ner PDF.
      </p>

      {existing.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide font-medium text-stone-500">Påbörjade</div>
          {existing.map((d) => {
            const meta = DOC_TYPE_META[d.doc_type]
            const status =
              d.status === 'submitted'
                ? 'Inskickad'
                : d.status === 'approved'
                ? 'Godkänd'
                : d.ai_drafted
                ? 'AI-utkast pågående'
                : 'Utkast'
            return (
              <div
                key={d.id}
                className="p-3 rounded-lg border border-stone-200 flex items-center justify-between gap-3 flex-wrap"
              >
                <div>
                  <div className="font-medium text-stone-900 text-sm flex items-center gap-2">
                    {meta.title}
                    {d.ai_drafted && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                        style={{ background: 'var(--c-solid)' }}
                      >
                        <Bot size={10} />
                        AI
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500">{status}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => goTo(d.doc_type)}>
                  Öppna
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide font-medium text-stone-500">Skapa nytt</div>
        {docTypesForPart.map((d) => (
          <div
            key={d.key}
            className="p-3 rounded-lg border border-stone-200 flex items-center justify-between gap-3 flex-wrap"
          >
            <div>
              <div className="font-medium text-stone-900 text-sm">{d.label}</div>
              <div className="text-xs text-stone-500">
                Generera AI-utkast → ladda ner PDF
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={!enrollmentId}
              leftIcon={<Bot size={14} />}
              onClick={() => goTo(d.key)}
            >
              Öppna arbetsyta
            </Button>
          </div>
        ))}
      </div>

      {!enrollmentId && (
        <p className="text-xs text-stone-500">
          Demo-data — dokument-arbetsytan öppnas för riktiga deltagare.
        </p>
      )}
    </div>
  )
}

function DetailNotes({
  enrollmentId,
  consultantName,
  onChange,
}: {
  enrollmentId: string | null
  consultantName?: string
  onChange?: () => void
}) {
  const { notes, createNote, deleteNote, loading } = useStaQuickNotes(enrollmentId)

  // Mock-fallback om vi inte har riktig enrollment
  if (!enrollmentId) {
    return (
      <div className="space-y-4">
        <QuickNoteForm
          onSubmit={async () => {
            // Demo: bara visa feedback
            return null
          }}
        />
        <div className="border-t border-stone-100 pt-4 space-y-3">
          <NoteEntry author="Erik Lindgren" date="12 maj 14:20" text="Demo: riktiga anteckningar sparas till deltagarens enrollment när du lagt till hen." />
          <NoteEntry author="Erik Lindgren" date="8 maj 09:30" text="Stress över ekonomi noterad i reflektion. Föreslå hälsoskola-modul nästa vecka." shared />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <QuickNoteForm
        onSubmit={async (input) => {
          const created = await createNote(input)
          onChange?.()
          return created
        }}
      />

      <div className="border-t border-stone-100 pt-4 space-y-3">
        <div className="text-xs uppercase tracking-wide font-medium text-stone-500 mb-1">
          Senaste anteckningar ({notes.length})
        </div>
        {loading && <p className="text-xs text-stone-500">Laddar...</p>}
        {!loading && notes.length === 0 && (
          <p className="text-sm text-stone-600">Inga anteckningar än. Skriv en ovan eller spela in med röst.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="p-3 rounded-lg bg-stone-50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-xs font-medium text-stone-700">{consultantName ?? 'Konsulent'}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">
                  {new Date(n.created_at).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {n.visibility === 'shared_with_participant' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700">
                    Delad
                  </span>
                )}
                {n.visibility === 'shared_in_report' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-stone-200 text-stone-700">
                    I rapport
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Radera anteckningen?')) {
                      void deleteNote(n.id)
                    }
                  }}
                  className="text-xs text-stone-400 hover:text-rose-700"
                  aria-label="Radera"
                >
                  ✕
                </button>
              </div>
            </div>
            {n.body && <p className="text-sm text-stone-800">{n.body}</p>}
            {n.voice_transcript && (
              <p className="text-sm text-stone-700 italic mt-1">🎙 {n.voice_transcript}</p>
            )}
            {n.tags && n.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {n.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white border border-stone-200 text-stone-700"
                  >
                    {formatTag(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NoteEntry({ author, date, text, shared }: { author: string; date: string; text: string; shared?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-stone-50">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-xs font-medium text-stone-700">{author}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">{date}</span>
          {shared && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700">
              Delad
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-stone-800">{text}</p>
    </div>
  )
}

// ===========================================================================
// ASSESSMENTS TAB
// ===========================================================================

type Instrument = 'DOA' | 'WRI' | 'MOHOST' | 'AWP' | 'AWC'
type AssessmentStatus = 'pending' | 'in_progress' | 'complete'
type AssessmentSortKey = 'name' | 'instrument' | 'part' | 'status'

// Antal items per instrument — verifierat mot AF:s officiella blanketter
// (sta/SKATTNINGAR-OCH-DEADLINES.md för detaljer)
const ASSESSMENT_ITEM_COUNT: Record<Instrument, number> = {
  DOA: 34,
  WRI: 17,
  MOHOST: 24,
  AWP: 14,
  AWC: 14,
}

interface AssessmentRow {
  id: string
  enrollmentId: string
  assessment: import('@/services/staApi').StaAssessment
  participantName: string
  participantInitials: string
  instrument: Instrument
  part: 1 | 2 | 3 | 4
  progress: number
  status: AssessmentStatus
}

function buildAssessmentRows(stats: EnrollmentStats[]): AssessmentRow[] {
  return stats.flatMap((s) =>
    s.assessments.map((a) => {
      const fullName = resolveParticipantName(s.enrollment)
      const initials = fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
      const itemCount = ASSESSMENT_ITEM_COUNT[a.instrument as Instrument] ?? 13
      const progress =
        a.status === 'complete' || a.status === 'submitted_to_af'
          ? 100
          : a.scores
            ? Math.min(100, Math.round((Object.keys(a.scores as object).length / itemCount) * 100))
            : 0
      const status: AssessmentStatus =
        a.status === 'complete' || a.status === 'submitted_to_af'
          ? 'complete'
          : progress > 0
            ? 'in_progress'
            : 'pending'
      return {
        id: a.id,
        enrollmentId: s.enrollment.id,
        assessment: a,
        participantName: fullName,
        participantInitials: initials,
        instrument: a.instrument as Instrument,
        part: a.part as 1 | 2 | 3 | 4,
        progress,
        status,
      }
    }),
  )
}

function AssessmentsTab({
  stats,
  onOpenParticipantAssessments,
  onChangeTab,
}: {
  stats: EnrollmentStats[]
  onOpenParticipantAssessments: (enrollmentId: string) => void
  onChangeTab: (tab: TabId) => void
}) {
  const allRows = useMemo(() => buildAssessmentRows(stats), [stats])

  const [filterInstrument, setFilterInstrument] = useState<'all' | Instrument>('all')
  const [filterPart, setFilterPart] = useState<'all' | StaPart>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | AssessmentStatus>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<AssessmentSortKey>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => {
      if (filterInstrument !== 'all' && r.instrument !== filterInstrument) return false
      if (filterPart !== 'all' && r.part !== filterPart) return false
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (search && !r.participantName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    const statusOrder: Record<AssessmentStatus, number> = { in_progress: 0, pending: 1, complete: 2 }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return dir * a.participantName.localeCompare(b.participantName, 'sv-SE')
        case 'instrument':
          return dir * a.instrument.localeCompare(b.instrument)
        case 'part':
          return dir * (a.part - b.part)
        case 'status':
          return dir * (statusOrder[a.status] - statusOrder[b.status])
        default:
          return 0
      }
    })
    return filtered
  }, [allRows, filterInstrument, filterPart, filterStatus, search, sortBy, sortDir])

  const handleSort = (key: AssessmentSortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const totalCount = allRows.length
  const visibleCount = rows.length
  const completedCount = allRows.filter((r) => r.status === 'complete').length
  const inProgressCount = allRows.filter((r) => r.status === 'in_progress').length

  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      {totalCount === 0 ? (
        <div className="px-5 py-10 text-center">
          <h3 className="text-base font-semibold text-stone-900 mb-1">Inga skattningar än</h3>
          <p className="text-sm text-stone-600 mb-4 max-w-md mx-auto">
            Skattningar startas från deltagarens drawer. DOA, WRI och MOHOST gör du
            i Del 1; AWP och AWC i Del 2 och Del 3.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Users size={14} />}
            onClick={() => onChangeTab('deltagare')}
          >
            Gå till Deltagare
          </Button>
        </div>
      ) : (
        <>
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Alla skattningar</h3>
              <p className="text-xs text-stone-500">
                <strong>{completedCount}</strong> klara · <strong>{inProgressCount}</strong> pågående · <strong>{totalCount - completedCount - inProgressCount}</strong> ej startade
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value as 'all' | Instrument)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på instrument"
              >
                <option value="all">Alla instrument</option>
                <option value="DOA">DOA</option>
                <option value="WRI">WRI</option>
                <option value="MOHOST">MOHOST</option>
                <option value="AWP">AWP</option>
                <option value="AWC">AWC</option>
              </select>
              <select
                value={filterPart}
                onChange={(e) => setFilterPart(e.target.value === 'all' ? 'all' : (Number(e.target.value) as StaPart))}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på del"
              >
                <option value="all">Alla delar</option>
                <option value="1">Del 1</option>
                <option value="2">Del 2</option>
                <option value="3">Del 3</option>
                <option value="4">Del 4</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | AssessmentStatus)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                aria-label="Filtrera på status"
              >
                <option value="all">Alla statusar</option>
                <option value="pending">Ej påbörjade</option>
                <option value="in_progress">Pågående</option>
                <option value="complete">Klara</option>
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök deltagare…"
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>
          </div>

          {visibleCount === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-stone-600">
              Inga skattningar matchar dina filter.{' '}
              <button
                type="button"
                onClick={() => {
                  setFilterInstrument('all')
                  setFilterPart('all')
                  setFilterStatus('all')
                  setSearch('')
                }}
                className="underline text-stone-700 hover:text-stone-900"
              >
                Rensa filter
              </button>
              .
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <AssessmentsTable
                  rows={rows}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onOpen={onOpenParticipantAssessments}
                />
              </div>
              <div className="md:hidden">
                <AssessmentsCardList
                  rows={rows}
                  onOpen={onOpenParticipantAssessments}
                />
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}

function AssessmentsTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onOpen,
}: {
  rows: AssessmentRow[]
  sortBy: AssessmentSortKey
  sortDir: SortDir
  onSort: (key: AssessmentSortKey) => void
  onOpen: (enrollmentId: string) => void
}) {
  const renderSortableTh = (key: AssessmentSortKey, label: string) => {
    const isActive = sortBy === key
    return (
      <th className="border-b border-stone-100 p-0">
        <button
          type="button"
          onClick={() => onSort(key)}
          className={cn(
            'w-full px-4 py-3 text-xs font-medium uppercase tracking-wide text-left',
            'flex items-center gap-1 transition-colors',
            isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700',
          )}
        >
          {label}
          <span aria-hidden="true" className={cn('text-[10px]', !isActive && 'opacity-30')}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          {renderSortableTh('name', 'Deltagare')}
          {renderSortableTh('instrument', 'Instrument')}
          {renderSortableTh('part', 'Del')}
          {renderSortableTh('status', 'Status')}
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">AT-signatur</th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => (
          <AssessmentTableRow key={a.id} row={a} onOpen={onOpen} />
        ))}
      </tbody>
    </table>
  )
}

function AssessmentTableRow({
  row: a,
  onOpen,
}: {
  row: AssessmentRow
  onOpen: (enrollmentId: string) => void
}) {
  return (
    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-medium text-stone-700">
            {a.participantInitials}
          </div>
          <span className="text-sm text-stone-900">{a.participantName}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="text-sm font-medium text-stone-900">{a.instrument}</span>
      </td>
      <td className="px-4 py-3 align-middle text-sm text-stone-700">Del {a.part}</td>
      <td className="px-4 py-3 align-middle">
        <AssessmentStatusCell row={a} />
      </td>
      <td className="px-4 py-3 align-middle">
        {a.status === 'complete' && <AssessmentSignature assessment={a.assessment} compact />}
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <Button
          variant={a.status === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onOpen(a.enrollmentId)}
        >
          {a.status === 'pending' ? 'Starta' : a.status === 'in_progress' ? 'Fortsätt' : 'Visa'}
        </Button>
      </td>
    </tr>
  )
}

function AssessmentStatusCell({ row: a }: { row: AssessmentRow }) {
  if (a.status === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-stone-100 text-stone-500">
        Ej påbörjad
      </span>
    )
  }
  if (a.status === 'in_progress') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-700">{a.progress}%</span>
        <div className="h-1.5 rounded-full overflow-hidden bg-stone-100 w-20">
          <div className="h-full" style={{ width: `${a.progress}%`, background: 'var(--c-solid)' }} />
        </div>
      </div>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700">
      Klar
    </span>
  )
}

function AssessmentsCardList({
  rows,
  onOpen,
}: {
  rows: AssessmentRow[]
  onOpen: (enrollmentId: string) => void
}) {
  return (
    <ul className="divide-y divide-stone-100">
      {rows.map((a) => (
        <li key={a.id} className="px-4 py-3 hover:bg-stone-50 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-medium text-stone-700 flex-shrink-0">
              {a.participantInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-900 truncate">{a.participantName}</div>
              <div className="text-[11px] text-stone-500">
                {a.instrument} · Del {a.part}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-2">
            <AssessmentStatusCell row={a} />
            {a.status === 'complete' && <AssessmentSignature assessment={a.assessment} compact />}
          </div>

          <Button
            variant={a.status === 'pending' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onOpen(a.enrollmentId)}
          >
            {a.status === 'pending' ? 'Starta' : a.status === 'in_progress' ? 'Fortsätt' : 'Visa'}
          </Button>
        </li>
      ))}
    </ul>
  )
}

// ===========================================================================
// WORKPLACES TAB
// ===========================================================================

type AfFilter = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected'

function WorkplacesTab({
  stats,
  onReload,
  onChangeTab,
}: {
  stats: EnrollmentStats[]
  onReload: () => void
  onChangeTab: (tab: TabId) => void
}) {
  const [editing, setEditing] = useState<{ workplace: StaWorkplace | null; enrollmentId: string } | null>(null)
  const [filterPart, setFilterPart] = useState<'all' | 'del-3-4' | StaPart>('del-3-4')
  const [filterAf, setFilterAf] = useState<AfFilter>('all')
  const [search, setSearch] = useState('')

  // Räkna stats över ALLA deltagare och arbetsplatser
  const overview = useMemo(() => {
    let totalWorkplaces = 0
    const afStatusCount: Record<AfFilter, number> = { all: 0, pending: 0, submitted: 0, approved: 0, rejected: 0 }
    for (const s of stats) {
      totalWorkplaces += s.workplaces.length
      for (const w of s.workplaces) {
        const key = (w.af_submission_status ?? 'pending') as AfFilter
        afStatusCount[key] = (afStatusCount[key] ?? 0) + 1
      }
    }
    return { totalWorkplaces, afStatusCount }
  }, [stats])

  // Filtrera per kriterier
  const filteredStats = useMemo(() => {
    const out: EnrollmentStats[] = []
    for (const s of stats) {
      // Del-filter
      if (filterPart === 'del-3-4') {
        if (s.enrollment.current_part < 3) continue
      } else if (filterPart !== 'all') {
        if (s.enrollment.current_part !== filterPart) continue
      }

      // Sök på deltagar-namn ELLER företagsnamn
      if (search) {
        const q = search.toLowerCase()
        const matchesName = resolveParticipantName(s.enrollment, '').toLowerCase().includes(q)
        const matchesCompany = s.workplaces.some((w) => (w.company_name ?? '').toLowerCase().includes(q))
        if (!matchesName && !matchesCompany) continue
      }

      // AF-filter — när filtret är satt, filtrera arbetsplatser per deltagare
      let workplaces = s.workplaces
      if (filterAf !== 'all') {
        workplaces = workplaces.filter((w) => (w.af_submission_status ?? 'pending') === filterAf)
        if (workplaces.length === 0) continue
      }

      out.push({ ...s, workplaces })
    }
    return out
  }, [stats, filterPart, filterAf, search])

  const handleSave = async (input: Partial<StaWorkplace> & { company_name: string }) => {
    if (!editing) return
    if (editing.workplace) {
      await staWorkplacesApi.update(editing.workplace.id, input)
    } else {
      await staWorkplacesApi.create({
        ...input,
        enrollment_id: editing.enrollmentId,
      })
    }
    onReload()
  }

  const handleSubmitToAf = async (workplaceId: string) => {
    await staWorkplacesApi.update(workplaceId, {
      af_submission_status: 'submitted',
      af_submitted_at: new Date().toISOString(),
    })
    onReload()
  }

  const handleDelete = async (workplaceId: string) => {
    if (!confirm('Ta bort arbetsplatsen? Alla uppföljningar raderas också.')) return
    await staWorkplacesApi.delete(workplaceId)
    onReload()
  }

  // Tom-state: inga deltagare överhuvudtaget
  if (stats.length === 0) {
    return (
      <Card variant="flat" padding="lg">
        <div className="text-center py-6">
          <h3 className="text-base font-semibold text-stone-900 mb-1">Inga deltagare än</h3>
          <p className="text-sm text-stone-600 mb-4 max-w-md mx-auto">
            Arbetsprövningsplatser registreras per deltagare. Lägg först till deltagare.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Users size={14} />}
            onClick={() => onChangeTab('deltagare')}
          >
            Gå till Deltagare
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Översikts-card med räknare */}
      <Card variant="flat" padding="lg">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Arbetsprövningsplatser</h3>
            <p className="text-xs text-stone-500">
              <strong>{overview.totalWorkplaces}</strong> totalt ·{' '}
              <strong>{overview.afStatusCount.submitted ?? 0}</strong> inskickade till AF ·{' '}
              <strong>{overview.afStatusCount.approved ?? 0}</strong> godkända
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={filterPart === 'del-3-4' ? 'del-3-4' : String(filterPart)}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'all' || v === 'del-3-4') setFilterPart(v)
                else setFilterPart(Number(v) as StaPart)
              }}
              className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
              aria-label="Filtrera på del"
            >
              <option value="del-3-4">Del 3 & 4 (default)</option>
              <option value="all">Alla delar</option>
              <option value="1">Del 1</option>
              <option value="2">Del 2</option>
              <option value="3">Del 3</option>
              <option value="4">Del 4</option>
            </select>
            <select
              value={filterAf}
              onChange={(e) => setFilterAf(e.target.value as AfFilter)}
              className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
              aria-label="Filtrera på AF-status"
            >
              <option value="all">Alla AF-statusar</option>
              <option value="pending">Ej inskickade</option>
              <option value="submitted">Inskickade</option>
              <option value="approved">Godkända</option>
              <option value="rejected">Avslagna</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök deltagare/företag…"
                className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
          </div>
        </div>
      </Card>

      {filteredStats.length === 0 ? (
        <Card variant="flat" padding="lg">
          <div className="text-sm text-stone-600">
            {filterPart === 'del-3-4' && overview.totalWorkplaces === 0
              ? <>Inga arbetsprövningsplatser i Del 3 eller Del 4 än. Lägg till en arbetsplats för en deltagare som är i Del 3 eller 4.</>
              : <>
                  Inga arbetsplatser matchar dina filter.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPart('del-3-4')
                      setFilterAf('all')
                      setSearch('')
                    }}
                    className="underline text-stone-700 hover:text-stone-900"
                  >
                    Rensa filter
                  </button>
                  .
                </>
            }
          </div>
        </Card>
      ) : (
        filteredStats.map((s) => (
          <Card key={s.enrollment.id} variant="flat" padding="lg">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  {resolveParticipantName(s.enrollment)}
                </h3>
                <p className="text-xs text-stone-500">
                  Del {s.enrollment.current_part} · {s.workplaces.length} arbetsplats
                  {s.workplaces.length === 1 ? '' : 'er'}
                  {s.enrollment.current_part < 3 && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800">
                      För tidigt (Del {s.enrollment.current_part})
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setEditing({ workplace: null, enrollmentId: s.enrollment.id })}
              >
                Lägg till arbetsplats
              </Button>
            </div>

            {s.workplaces.length === 0 ? (
              <p className="text-sm text-stone-500">
                Inga arbetsplatser registrerade än.
                {s.enrollment.current_part >= 3 && (
                  <> Klicka på &quot;Lägg till arbetsplats&quot; för att börja.</>
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {s.workplaces.map((w) => (
                  <WorkplaceCard
                    key={w.id}
                    workplace={w}
                    consultantView
                    onEdit={() => setEditing({ workplace: w, enrollmentId: s.enrollment.id })}
                    onDelete={() => handleDelete(w.id)}
                    onSubmitToAf={() => handleSubmitToAf(w.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        ))
      )}

      <WorkplaceFormModal
        open={!!editing}
        existing={editing?.workplace ?? null}
        onSave={handleSave}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

// ===========================================================================
// DOCUMENTS TAB
// ===========================================================================

type DocumentSortKey = 'date' | 'participant' | 'type' | 'status'
type DocumentStatusFilter =
  | 'all'
  | 'active'  // draft + consultant_review
  | 'draft'
  | 'consultant_review'
  | 'approved'
  | 'submitted'

interface DocumentRow {
  id: string
  doc_type: import('@/services/staApi').DocumentType
  title: string
  participantName: string
  participantInitials: string
  enrollmentId: string
  status: import('@/services/staApi').DocumentStatus
  aiDrafted: boolean
  updatedAt: string
}

function buildDocumentRows(stats: EnrollmentStats[]): DocumentRow[] {
  return stats.flatMap((s) =>
    s.documents.map((d) => {
      const name = resolveParticipantName(s.enrollment)
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
      return {
        id: d.id,
        doc_type: d.doc_type,
        title: DOC_TYPE_META[d.doc_type]?.title ?? d.doc_type,
        participantName: name,
        participantInitials: initials,
        enrollmentId: s.enrollment.id,
        status: d.status,
        aiDrafted: d.ai_drafted,
        updatedAt: d.updated_at ?? d.created_at ?? new Date(0).toISOString(),
      }
    }),
  )
}

function documentStatusLabel(status: import('@/services/staApi').DocumentStatus): { label: string; tone: 'stone' | 'amber' | 'emerald' | 'sky' } {
  switch (status) {
    case 'draft': return { label: 'Utkast', tone: 'stone' }
    case 'consultant_review': return { label: 'Pågående granskning', tone: 'amber' }
    case 'approved': return { label: 'Godkänd', tone: 'emerald' }
    case 'submitted': return { label: 'Inskickad till AF', tone: 'sky' }
    default: return { label: status, tone: 'stone' }
  }
}

function DocumentsTab({
  stats,
  onChangeTab,
}: {
  stats: EnrollmentStats[]
  onChangeTab: (tab: TabId) => void
}) {
  const navigate = useNavigate()
  const allRows = useMemo(() => buildDocumentRows(stats), [stats])

  const [filterType, setFilterType] = useState<'all' | import('@/services/staApi').DocumentType>('all')
  const [filterStatus, setFilterStatus] = useState<DocumentStatusFilter>('active')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<DocumentSortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const filtered = allRows.filter((r) => {
      if (filterType !== 'all' && r.doc_type !== filterType) return false
      if (filterStatus === 'active') {
        if (r.status !== 'draft' && r.status !== 'consultant_review') return false
      } else if (filterStatus !== 'all' && r.status !== filterStatus) {
        return false
      }
      if (search && !r.participantName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    const statusOrder: Record<string, number> = {
      consultant_review: 0,
      draft: 1,
      approved: 2,
      submitted: 3,
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        case 'participant':
          return dir * a.participantName.localeCompare(b.participantName, 'sv-SE')
        case 'type':
          return dir * a.title.localeCompare(b.title, 'sv-SE')
        case 'status':
          return dir * ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99))
        default:
          return 0
      }
    })
    return filtered
  }, [allRows, filterType, filterStatus, search, sortBy, sortDir])

  const handleSort = (key: DocumentSortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const totalCount = allRows.length
  const visibleCount = rows.length
  const draftsCount = allRows.filter((r) => r.status === 'draft' || r.status === 'consultant_review').length
  const submittedCount = allRows.filter((r) => r.status === 'submitted' || r.status === 'approved').length

  const openDocument = (row: DocumentRow) => {
    navigate(`/konsulent/steg-till-arbete/dokument/${row.enrollmentId}/${row.doc_type}`)
  }

  return (
    <div className="space-y-5">
      <Card variant="flat" padding="none" className="overflow-hidden">
        {totalCount === 0 ? (
          <div className="px-5 py-10 text-center">
            <h3 className="text-base font-semibold text-stone-900 mb-1">Inga dokument än</h3>
            <p className="text-sm text-stone-600 mb-4 max-w-md mx-auto">
              Dokument skapas från deltagarens drawer — öppna en deltagare och välj
              vilken redovisning eller bilaga som ska skapas.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Users size={14} />}
              onClick={() => onChangeTab('deltagare')}
            >
              Gå till Deltagare
            </Button>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-stone-900">Dokumentutkast och inskick</h3>
                <p className="text-xs text-stone-500">
                  <strong>{draftsCount}</strong> utkast · <strong>{submittedCount}</strong> inskickade/godkända
                </p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | import('@/services/staApi').DocumentType)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                  aria-label="Filtrera på typ"
                >
                  <option value="all">Alla typer</option>
                  <option value="initial_planering">Initial planering</option>
                  <option value="delredovisning_1">Delredovisning Del 1</option>
                  <option value="delredovisning_2">Delredovisning Del 2</option>
                  <option value="delredovisning_3">Delredovisning Del 3</option>
                  <option value="delredovisning_4">Delredovisning Del 4</option>
                  <option value="anmalan_arbetsprovning">Anmälan arbetsprövning</option>
                  <option value="information_arbetsprovning">Information från arbetsprövning</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as DocumentStatusFilter)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
                  aria-label="Filtrera på status"
                >
                  <option value="active">Pågående</option>
                  <option value="draft">Utkast</option>
                  <option value="consultant_review">På granskning</option>
                  <option value="approved">Godkända</option>
                  <option value="submitted">Inskickade</option>
                  <option value="all">Alla statusar</option>
                </select>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Sök deltagare…"
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  />
                </div>
              </div>
            </div>

            {visibleCount === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-stone-600">
                Inga dokument matchar dina filter.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all')
                    setFilterStatus('all')
                    setSearch('')
                  }}
                  className="underline text-stone-700 hover:text-stone-900"
                >
                  Rensa filter
                </button>
                .
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <DocumentsTable
                    rows={rows}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                    onOpen={openDocument}
                  />
                </div>
                <div className="md:hidden">
                  <DocumentsCardList rows={rows} onOpen={openDocument} />
                </div>
              </>
            )}
          </>
        )}
      </Card>

      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-1">Mallar</h3>
        <p className="text-xs text-stone-500 mb-3">
          Tillgängliga dokumenttyper. Skapas från deltagar-drawern under fliken
          Dokument.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'Initial planering', subtitle: 'Genereras från startsamtal + DOA · Del 1' },
            { title: 'Delredovisning Del 1', subtitle: 'Aktiviteter + DOA/WRI/MOHOST · AF Af 00825' },
            { title: 'Delredovisning Del 2', subtitle: 'Arbetsstationer + AWP/MOHOST · AF Af 00826' },
            { title: 'Delredovisning Del 3', subtitle: 'Arbetsprövning + skattningar · AF Af 00827' },
            { title: 'Slutredovisning Del 4', subtitle: 'Slutbedömning · AF Af 00828' },
            { title: 'Information från arbetsprövningsplats', subtitle: 'Bilaga med AWC/AWP' },
          ].map((t) => (
            <div
              key={t.title}
              className="p-3 rounded-lg border border-stone-200"
            >
              <div className="font-medium text-stone-900 text-sm">{t.title}</div>
              <div className="text-xs text-stone-500">{t.subtitle}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DocumentsTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onOpen,
}: {
  rows: DocumentRow[]
  sortBy: DocumentSortKey
  sortDir: SortDir
  onSort: (key: DocumentSortKey) => void
  onOpen: (row: DocumentRow) => void
}) {
  const renderTh = (key: DocumentSortKey, label: string) => {
    const isActive = sortBy === key
    return (
      <th className="border-b border-stone-100 p-0">
        <button
          type="button"
          onClick={() => onSort(key)}
          className={cn(
            'w-full px-4 py-3 text-xs font-medium uppercase tracking-wide text-left',
            'flex items-center gap-1 transition-colors',
            isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700',
          )}
        >
          {label}
          <span aria-hidden="true" className={cn('text-[10px]', !isActive && 'opacity-30')}>
            {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          {renderTh('participant', 'Deltagare')}
          {renderTh('type', 'Dokumenttyp')}
          {renderTh('status', 'Status')}
          {renderTh('date', 'Uppdaterat')}
          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <DocumentTableRow key={d.id} row={d} onOpen={() => onOpen(d)} />
        ))}
      </tbody>
    </table>
  )
}

function DocumentTableRow({ row, onOpen }: { row: DocumentRow; onOpen: () => void }) {
  const statusInfo = documentStatusLabel(row.status)
  return (
    <tr className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-medium text-stone-700">
            {row.participantInitials}
          </div>
          <span className="text-sm text-stone-900">{row.participantName}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="text-sm text-stone-900 flex items-center gap-2 flex-wrap">
          {row.title}
          {row.aiDrafted && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ background: 'var(--c-solid)' }}
            >
              <Bot size={10} />
              AI
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <DocumentStatusBadge tone={statusInfo.tone} label={statusInfo.label} />
      </td>
      <td className="px-4 py-3 align-middle text-xs text-stone-600">
        {new Date(row.updatedAt).toLocaleDateString('sv-SE')}
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <Button variant="secondary" size="sm" onClick={onOpen}>
          Öppna
        </Button>
      </td>
    </tr>
  )
}

function DocumentStatusBadge({ tone, label }: { tone: 'stone' | 'amber' | 'emerald' | 'sky'; label: string }) {
  const toneClass: Record<typeof tone, string> = {
    stone: 'bg-stone-100 text-stone-700',
    amber: 'bg-amber-50 text-amber-800',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-800',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', toneClass[tone])}>
      {label}
    </span>
  )
}

function DocumentsCardList({ rows, onOpen }: { rows: DocumentRow[]; onOpen: (row: DocumentRow) => void }) {
  return (
    <ul className="divide-y divide-stone-100">
      {rows.map((d) => {
        const statusInfo = documentStatusLabel(d.status)
        return (
          <li key={d.id} className="px-4 py-3 hover:bg-stone-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-medium text-stone-700 flex-shrink-0">
                {d.participantInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-900 truncate">{d.participantName}</div>
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                  {d.title}
                  {d.aiDrafted && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium text-white"
                      style={{ background: 'var(--c-solid)' }}
                    >
                      AI
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <DocumentStatusBadge tone={statusInfo.tone} label={statusInfo.label} />
              <span className="text-[11px] text-stone-500">{new Date(d.updatedAt).toLocaleDateString('sv-SE')}</span>
            </div>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => onOpen(d)}>
              Öppna
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

// ===========================================================================
// ADD PARTICIPANT MODAL
// ===========================================================================

function AddParticipantModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const { profile } = useAuthStore()
  const [mode, setMode] = useState<'manual' | 'invite'>('manual')
  const [fullName, setFullName] = useState('')
  const [personalId, setPersonalId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [startPart, setStartPart] = useState<StaPart>(1)
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!profile?.id) {
      setError('Du måste vara inloggad.')
      return
    }
    if (!fullName.trim()) {
      setError('Namn krävs.')
      return
    }
    if (!startedAt) {
      setError('Startdatum krävs.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await staEnrollmentsApi.create({
        consultant_id: profile.id,
        started_at: startedAt,
        part_started_at: startedAt,
        current_part: startPart as ApiStaPart,
        external_name: fullName.trim(),
        external_email: email.trim() || undefined,
        external_phone: phone.trim() || undefined,
        external_personal_id: mode === 'manual' ? personalId.trim() || undefined : undefined,
        link_status: mode === 'invite' ? 'invited' : 'unlinked',
        status: 'active',
        language_support: [],
        communication_support: [],
      })
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara deltagare')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/40" onClick={onClose} aria-label="Stäng" />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" data-domain="action">
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Lägg till deltagare</h2>
            <p className="text-sm text-stone-600 mt-1">
              Du kan lägga till deltagaren manuellt (det är frivilligt för deltagaren att registrera sig på Jobin)
              eller skicka en inbjudan så hen kan registrera sig direkt.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100" aria-label="Stäng">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-1 border-b border-stone-100">
          {([
            ['manual', 'Manuellt (utan Jobin)'],
            ['invite', 'Bjud in till Jobin'],
          ] as const).map(([id, label]) => {
            const isActive = mode === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={cn(
                  'px-3 py-2 text-sm border-b-2 -mb-px font-medium',
                  isActive ? 'text-[var(--c-text)]' : 'border-transparent text-stone-600 hover:text-stone-900',
                )}
                style={isActive ? { borderColor: 'var(--c-solid)' } : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="px-6 py-5 space-y-4">
          {mode === 'manual' && (
            <div className="text-sm text-stone-700 p-3 rounded-lg bg-stone-50 flex items-start gap-2">
              <Unlink size={16} className="mt-0.5 text-stone-500 flex-shrink-0" />
              <div>
                Deltagaren får inget Jobin-konto. Du kan ändå följa aktiviteter, fylla i skattningar, och skapa
                dokument. Koppla senare när hen vill registrera sig.
              </div>
            </div>
          )}
          {mode === 'invite' && (
            <div className="text-sm text-stone-700 p-3 rounded-lg flex items-start gap-2" style={{ background: 'var(--c-bg)' }}>
              <Mail size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--c-text)' }} />
              <div>
                Vi skickar en länk till deltagaren. När hen registrerar sig kopplas kontot automatiskt till dig och
                tjänsten. Hen kan logga in från valfri enhet.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="För- och efternamn" placeholder="Anna Karlsson" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {mode === 'manual' && (
              <Input
                label="Personnummer"
                placeholder="ÅÅÅÅMMDD-XXXX"
                hint="Krävs av Arbetsförmedlingen"
                value={personalId}
                onChange={(e) => setPersonalId(e.target.value)}
              />
            )}
            <Input
              label="E-post"
              type="email"
              placeholder="namn@exempel.se"
              hint={mode === 'invite' ? 'Inbjudan skickas hit' : 'Frivilligt — för kontakt'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input label="Telefon" type="tel" placeholder="070-123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label htmlFor="sta-start-date" className="block text-sm font-medium text-stone-700 mb-1">
              Startdatum
            </label>
            <input
              id="sta-start-date"
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
            />
            <p className="text-xs text-stone-500 mt-1">
              När insatsen faktiskt börjar. Deltagaren kan justera datumet om hen startar senare.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Startar i del</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([1, 2, 3, 4] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setStartPart(p)}
                  className={cn(
                    'p-2 rounded-lg border-2 text-sm transition-colors',
                    startPart === p
                      ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
                  )}
                  style={startPart === p ? { background: 'var(--c-bg)' } : undefined}
                >
                  Del {p}
                </button>
              ))}
            </div>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-stone-700 font-medium">Anpassningar och språkstöd (frivilligt)</summary>
            <div className="mt-3 space-y-2">
              <textarea
                rows={2}
                placeholder="T.ex. kortare pass, tysta rum, bildstöd"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {['Arabiska', 'Somaliska', 'Tigrinja', 'Dari', 'Pashtu'].map((l) => (
                  <label key={l} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-xs cursor-pointer hover:bg-stone-200">
                    <input type="checkbox" className="w-3 h-3" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </details>
        </div>

        {error && (
          <div className="px-6 py-2 bg-rose-50 text-sm text-rose-800 flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Avbryt</Button>
          <Button
            variant="primary"
            leftIcon={mode === 'invite' ? <Send size={14} /> : <UserPlus size={14} />}
            onClick={handleSave}
            isLoading={saving}
            disabled={!fullName.trim()}
          >
            {mode === 'invite' ? 'Skicka inbjudan' : 'Lägg till manuellt'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// LINK PARTICIPANT MODAL
// ===========================================================================

function LinkParticipantModal({
  participant,
  onClose,
}: {
  participant: StaParticipantRow
  onClose: () => void
}) {
  // Förslag på Jobin-konton att koppla till — i nästa version ska detta läsas
  // från en match-RPC som söker på namn + e-post + program.
  const suggestions: JobinLinkSuggestion[] = []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/40" onClick={onClose} aria-label="Stäng" />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" data-domain="action">
        <div className="px-6 py-5 border-b border-stone-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
              <LinkIcon size={20} />
              Koppla till Jobin-konto
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {participant.fullName} är just nu manuellt tillagd. Om hen har registrerat sig på Jobin kan du koppla
              kontona så får hen åtkomst till sina aktiviteter och dagsuppgifter.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100" aria-label="Stäng">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} style={{ color: 'var(--c-solid)' }} />
                <h3 className="text-sm font-medium text-stone-900">Förslag — möjliga matchningar</h3>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Baserat på namn, e-post och konsulent. Granska alltid innan du kopplar.
              </p>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <div key={s.userId} className="p-3 rounded-lg border border-stone-200 hover:bg-stone-50">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-700">
                          {s.initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-stone-900">{s.fullName}</div>
                          <div className="text-xs text-stone-500">{s.email} · registrerad {s.registeredAt}</div>
                          <div className="text-[11px] text-stone-600 mt-0.5">Matchar på: {s.matchReason}</div>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" leftIcon={<LinkIcon size={12} />}>
                        Koppla
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-stone-900 mb-2">Sök manuellt</h3>
            <p className="text-xs text-stone-500 mb-3">
              Hittar du inte deltagaren i förslagen? Sök i hela Jobin på e-post eller personnummer.
            </p>
            <Input placeholder="namn@exempel.se eller personnummer" leftIcon={<Search size={14} />} />
          </div>

          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
            <h3 className="text-sm font-medium text-stone-900 mb-1">Skicka ny inbjudan</h3>
            <p className="text-xs text-stone-600 mb-3">
              Om deltagaren inte hittar tillbaka till en gammal inbjudan kan du skicka en ny länk.
            </p>
            <div className="flex gap-2 flex-wrap items-end">
              <Input
                fullWidth={false}
                label="E-post"
                type="email"
                placeholder="namn@exempel.se"
                className="!w-72"
                defaultValue={participant.manualContact?.email ?? ''}
              />
              <Button variant="secondary" leftIcon={<Send size={14} />}>Skicka inbjudan</Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <div>
              När du kopplar ett konto överförs befintlig aktivitetshistorik, skattningar och dokument till
              deltagarens Jobin-vy. Operationen kan inte ångras automatiskt — verifiera att rätt konto är valt.
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50">
          <Button variant="ghost" onClick={onClose}>Stäng</Button>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// HELPERS — frånvaro-formatering
// ===========================================================================

function formatAbsenceDate(iso: string): string {
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function labelForAbsenceKind(kind: AbsenceKind): string {
  switch (kind) {
    case 'sick': return 'Sjuk'
    case 'vab': return 'VAB'
    case 'allowed': return 'Beviljad frånvaro'
    case 'other': return 'Annan orsak'
  }
}
