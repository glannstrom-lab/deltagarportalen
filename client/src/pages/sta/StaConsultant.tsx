import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConsultantStats, useStaQuickNotes, useStaAbsences } from '@/hooks/useSta'
import { useAuthStore } from '@/stores/authStore'
import { staEnrollmentsApi, type StaPart as ApiStaPart, type AbsenceKind } from '@/services/staApi'
import { DOC_TYPE_META } from '@/services/staAiApi'
import { toParticipantRow, computeKpi, type EnrollmentStats } from './enrollmentDisplay'
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
  CheckCircle2,
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
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  CONSULTANT_PARTICIPANTS,
  CONSULTANT_KPI,
  CONSULTANT_DEADLINES,
  CONSULTANT_DRAFTS,
  CONSULTANT_ASSESSMENTS,
  CONSULTANT_WORKPLACES,
  LINK_SUGGESTIONS_FOR_KERSTIN,
  AI_SUMMARY_ANNA,
  ACTIVITY_LOG_ANNA,
  type StaParticipantRow,
  type StaPart,
  type ParticipantLinkStatus,
} from './mockData'

type TabId = 'oversikt' | 'deltagare' | 'skattningar' | 'arbetsplatser' | 'dokument'

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'oversikt', label: 'Översikt', icon: Activity },
  { id: 'deltagare', label: 'Deltagare', icon: Users },
  { id: 'skattningar', label: 'Skattningar', icon: ClipboardList },
  { id: 'arbetsplatser', label: 'Arbetsplatser', icon: Building2 },
  { id: 'dokument', label: 'Dokument', icon: FileText },
]

export default function StaConsultant() {
  const [tab, setTab] = useState<TabId>('oversikt')
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [addParticipantOpen, setAddParticipantOpen] = useState(false)
  const [linkParticipantId, setLinkParticipantId] = useState<string | null>(null)
  const { stats, isMock, loading, reload } = useConsultantStats()

  // Bygg dynamisk participant-lista från riktig data, falla tillbaka till mock
  const realRows = useMemo(() => stats.map(toParticipantRow), [stats])
  const kpi = useMemo(() => {
    if (stats.length === 0) {
      return { active: 0, perPart: { 1: 0, 2: 0, 3: 0, 4: 0 }, draftsToReview: 0, assessmentsInProgress: 0 }
    }
    return computeKpi(stats)
  }, [stats])

  // Vald deltagare — först letar vi i riktig data
  const selectedStats = selectedParticipantId
    ? stats.find((s) => s.enrollment.id === selectedParticipantId)
    : null
  // Fallback för mock-rader om vi visar dem
  const selectedMock =
    !selectedStats && selectedParticipantId
      ? CONSULTANT_PARTICIPANTS.find((p) => p.id === selectedParticipantId)
      : null

  return (
    <PageLayout title="Steg till arbete — konsulent" showTabs={false} domain="action" showHeader={false}>
      <ConsultantHero onAdd={() => setAddParticipantOpen(true)} />
      <KpiRow kpi={kpi} isMock={isMock} />
      <ConsultantTabs current={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'oversikt' && (
          <OverviewTab
            realRows={realRows}
            isMock={isMock}
            loading={loading}
            onOpenParticipant={setSelectedParticipantId}
            onLink={setLinkParticipantId}
            onAdd={() => setAddParticipantOpen(true)}
          />
        )}
        {tab === 'deltagare' && (
          <ParticipantsTab
            realRows={realRows}
            isMock={isMock}
            loading={loading}
            onOpen={setSelectedParticipantId}
            onLink={setLinkParticipantId}
            onAdd={() => setAddParticipantOpen(true)}
          />
        )}
        {tab === 'skattningar' && <AssessmentsTab stats={stats} isMock={isMock} />}
        {tab === 'arbetsplatser' && <WorkplacesTab />}
        {tab === 'dokument' && <DocumentsTab stats={stats} isMock={isMock} />}
      </div>

      {(selectedStats || selectedMock) && (
        <ParticipantDetailDrawer
          stats={selectedStats}
          mockParticipant={selectedMock ?? undefined}
          onClose={() => setSelectedParticipantId(null)}
          onLink={() => {
            const id = selectedStats?.enrollment.id ?? selectedMock?.id
            if (id) setLinkParticipantId(id)
          }}
          onChange={reload}
        />
      )}

      {addParticipantOpen && (
        <AddParticipantModal onClose={() => setAddParticipantOpen(false)} onCreated={reload} />
      )}

      {linkParticipantId && (
        <LinkParticipantModal
          participantId={linkParticipantId}
          onClose={() => setLinkParticipantId(null)}
        />
      )}
    </PageLayout>
  )
}

// ===========================================================================
// HERO + KPI + TABS
// ===========================================================================

function ConsultantHero({ onAdd }: { onAdd: () => void }) {
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
          <Button variant="secondary">Veckosammanställning</Button>
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
  isMock,
}: {
  kpi: { active: number; perPart: Record<1 | 2 | 3 | 4, number>; draftsToReview: number; assessmentsInProgress: number }
  isMock: boolean
}) {
  // Om vi inte har riktig data, visa mock-värdena så sidan känns levande
  const data = isMock
    ? {
        active: CONSULTANT_KPI.active,
        perPart: CONSULTANT_KPI.perPart,
        draftsToReview: CONSULTANT_KPI.draftsToReview,
        assessmentsInProgress: CONSULTANT_KPI.assessmentsInProgress,
      }
    : kpi
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <KpiCard
        label="Aktiva deltagare"
        value={data.active}
        subtext={`${data.perPart[1]} i Del 1 · ${data.perPart[2]} i Del 2 · ${data.perPart[3]} i Del 3 · ${data.perPart[4]} i Del 4`}
      />
      <KpiCard
        label="Deadlines denna vecka"
        value={isMock ? CONSULTANT_KPI.deadlinesThisWeek : 0}
        subtext={isMock ? `${CONSULTANT_KPI.deadlinesToday} förfaller idag` : 'Inga ännu'}
        subtextClass={isMock ? 'text-red-700' : undefined}
      />
      <KpiCard
        label="Utkast att granska"
        value={data.draftsToReview}
        subtext={data.draftsToReview > 0 ? 'Granska och skicka' : 'Allt klart'}
      />
      <KpiCard
        label="Skattningar pågående"
        value={data.assessmentsInProgress}
        subtext={data.assessmentsInProgress > 0 ? 'Slutför i drawer' : 'Inga pågående'}
      />
    </section>
  )
}

function KpiCard({ label, value, subtext, subtextClass }: { label: string; value: number; subtext: string; subtextClass?: string }) {
  return (
    <Card variant="flat" padding="md">
      <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-stone-900 mt-1">{value}</div>
      <div className={cn('text-xs text-stone-600 mt-1', subtextClass)}>{subtext}</div>
    </Card>
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
  realRows,
  isMock,
  loading,
  onOpenParticipant,
  onLink,
  onAdd,
}: {
  realRows: StaParticipantRow[]
  isMock: boolean
  loading: boolean
  onOpenParticipant: (id: string) => void
  onLink: (id: string) => void
  onAdd: () => void
}) {
  const rows = isMock ? CONSULTANT_PARTICIPANTS : realRows

  return (
    <div className="space-y-5">
      {isMock && !loading && (
        <EmptyDataBanner onAdd={onAdd} />
      )}

      <DeadlinesCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AiSummaryCard />
        <DraftsCard />
      </div>

      <BulkAttendanceCard />

      <Card variant="flat" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Senaste deltagare</h3>
            <p className="text-xs text-stone-500">
              {isMock ? 'Demo-data — riktiga deltagare visas här när du lägger till dem' : 'Aktivitet de senaste 24 timmarna'}
            </p>
          </div>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
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
    </div>
  )
}

function EmptyDataBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <Card variant="flat" padding="lg" style={{ background: 'var(--c-bg)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--c-solid)' }} />
            Inga deltagare än
          </h3>
          <p className="text-sm text-stone-700 mt-1 max-w-xl">
            Sidan visar demo-data så du ser hur den är tänkt att fungera. Lägg till din första deltagare — antingen manuellt eller via en Jobin-inbjudan.
          </p>
        </div>
        <Button variant="primary" leftIcon={<UserPlus size={14} />} onClick={onAdd}>
          Lägg till första deltagaren
        </Button>
      </div>
    </Card>
  )
}

function DeadlinesCard() {
  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            Akuta deadlines
          </h3>
          <p className="text-xs text-stone-500">Sorterat: tid kvar</p>
        </div>
        <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
          Visa alla
        </Button>
      </div>
      <ul>
        {CONSULTANT_DEADLINES.map((d) => (
          <li key={d.id} className="px-5 py-3 flex flex-wrap items-center gap-3 border-b border-stone-100 last:border-0">
            <DueChip level={d.level} label={d.due} />
            <span className="text-sm font-medium text-stone-900">{d.title}</span>
            <span className="text-sm text-stone-600">
              {d.participantName}
              {d.partInfo && ` · ${d.partInfo}`}
            </span>
            <div className="flex-1" />
            <Button variant={d.cta.primary ? 'primary' : 'secondary'} size="sm">
              {d.cta.label}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DueChip({ level, label }: { level: 'red' | 'amber' | 'green'; label: string }) {
  const classes = {
    red: 'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-emerald-100 text-emerald-800',
  }[level]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', classes)}>
      {label}
    </span>
  )
}

function AiSummaryCard() {
  return (
    <Card
      variant="flat"
      padding="lg"
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, var(--c-bg) 100%)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ background: 'var(--c-solid)' }}
          >
            <Bot size={12} />
            AI-utkast
          </span>
          <h3 className="text-base font-semibold text-stone-900">Veckosammanställning — Anna Karlsson</h3>
        </div>
        <span className="text-xs text-stone-500">Genererat just nu · gpt-oss-120b</span>
      </div>
      <div className="bg-white rounded-lg p-4 border border-stone-200 text-sm text-stone-800 leading-relaxed whitespace-pre-line">
        {AI_SUMMARY_ANNA}
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        <Button variant="primary" size="sm">Kopiera till delredovisning</Button>
        <Button variant="secondary" size="sm">Spara som anteckning</Button>
        <Button variant="ghost" size="sm">Generera nytt utkast</Button>
      </div>
    </Card>
  )
}

function DraftsCard() {
  return (
    <Card variant="flat" padding="lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-stone-900">Dokumentutkast att granska</h3>
        <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
          Alla
        </Button>
      </div>
      <ul className="space-y-2">
        {CONSULTANT_DRAFTS.map((d) => (
          <li key={d.id} className="p-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
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
              <DueChip level={d.dueLevel} label={d.due} />
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="primary" size="sm">Öppna</Button>
              <Button variant="ghost" size="sm">Förhandsvisa PDF</Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function BulkAttendanceCard() {
  const [marks, setMarks] = useState<Record<string, boolean>>({
    'anna-karlsson': true,
    'mahmoud-ali': true,
    'lars-persson': false,
    'kerstin-olofsson': true,
  })
  const toggle = (id: string) => setMarks((m) => ({ ...m, [id]: !m[id] }))

  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-stone-900">Närvaro idag — tisdag 13 maj</h3>
          <p className="text-xs text-stone-500">Bocka av i bulk · 30 sekunder</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Markera alla närvarande
          </Button>
          <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />}>
            Spara
          </Button>
        </div>
      </div>
      <div className="px-5 py-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          { id: 'anna-karlsson', name: 'Anna Karlsson', subtext: 'Del 1 · på plats' },
          { id: 'mahmoud-ali', name: 'Mahmoud Ali', subtext: 'Del 2 · station kundmottagning' },
          { id: 'lars-persson', name: 'Lars Persson', subtext: 'Del 1 · ej anmäld' },
          { id: 'kerstin-olofsson', name: 'Kerstin Olofsson', subtext: 'Del 3 · ute på arbetsplats' },
        ].map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={!!marks[p.id]}
              onChange={() => toggle(p.id)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm flex-1">
              <span className="text-stone-900 font-medium">{p.name}</span>
              <span className="text-xs text-stone-500"> · {p.subtext}</span>
            </span>
            <select className="text-xs bg-stone-100 rounded px-2 py-1 border-0">
              <option>Närvarande</option>
              <option>Frånvarande</option>
              <option>Sjuk</option>
              <option>Tillåten frånvaro</option>
            </select>
          </label>
        ))}
      </div>
    </Card>
  )
}

// ===========================================================================
// PARTICIPANTS TAB
// ===========================================================================

function ParticipantsTab({
  realRows,
  isMock,
  loading,
  onOpen,
  onLink,
  onAdd,
}: {
  realRows: StaParticipantRow[]
  isMock: boolean
  loading: boolean
  onOpen: (id: string) => void
  onLink: (id: string) => void
  onAdd: () => void
}) {
  const [filterPart, setFilterPart] = useState<'all' | StaPart>('all')
  const [search, setSearch] = useState('')

  const allRows = isMock ? CONSULTANT_PARTICIPANTS : realRows

  const rows = useMemo(() => {
    return allRows.filter((p) => {
      if (filterPart !== 'all' && p.currentPart !== filterPart) return false
      if (search && !p.fullName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allRows, filterPart, search])

  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      {isMock && !loading && (
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 text-xs text-stone-600 flex items-center gap-2">
          <Sparkles size={12} style={{ color: 'var(--c-solid)' }} />
          Demo-data — riktiga deltagare visas här när du lägger till dem
        </div>
      )}
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-stone-900">Alla deltagare</h3>
          <p className="text-xs text-stone-500">{rows.length} aktiva · sorterade efter deadline</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={filterPart}
            onChange={(e) => setFilterPart(e.target.value === 'all' ? 'all' : (Number(e.target.value) as StaPart))}
            className="px-3 py-1.5 rounded-lg bg-stone-100 border-0 text-sm"
          >
            <option value="all">Alla delar</option>
            <option value="1">Del 1</option>
            <option value="2">Del 2</option>
            <option value="3">Del 3</option>
            <option value="4">Del 4</option>
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
      <ParticipantsTable rows={rows} onOpen={onOpen} onLink={onLink} />
    </Card>
  )
}

function ParticipantsTable({
  rows,
  onOpen,
  onLink,
  showAddButton: _showAddButton = true,
}: {
  rows: StaParticipantRow[]
  onOpen: (id: string) => void
  onLink: (id: string) => void
  showAddButton?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Deltagare</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Del</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Tid kvar</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Aktivitet</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Skattningar</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Anpassning</th>
            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Snabbåtgärder</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <ParticipantRow key={p.id} row={p} onOpen={onOpen} onLink={onLink} />
          ))}
        </tbody>
      </table>
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
  onLink,
}: {
  row: StaParticipantRow
  onOpen: (id: string) => void
  onLink: (id: string) => void
}) {
  return (
    <tr className="hover:bg-stone-50 border-b border-stone-100 last:border-0">
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
            <Button variant="primary" size="sm">
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
  mockParticipant,
  onClose,
  onLink,
  onChange,
}: {
  stats?: EnrollmentStats | null
  mockParticipant?: StaParticipantRow
  onClose: () => void
  onLink: () => void
  onChange?: () => void
}) {
  const [subTab, setSubTab] = useState<'oversikt' | 'aktivitet' | 'skattningar' | 'dokument' | 'anteckningar'>('oversikt')
  // Härled participant från real data om vi har det, annars använd mock
  const participant: StaParticipantRow = stats ? toParticipantRow(stats) : mockParticipant!
  const realEnrollmentId = stats?.enrollment.id ?? null

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
            <DetailOverview participant={participant} enrollmentId={realEnrollmentId} />
          )}
          {subTab === 'aktivitet' && <DetailActivityLog stats={stats ?? undefined} />}
          {subTab === 'skattningar' && (
            <DetailAssessments enrollmentId={realEnrollmentId} stats={stats ?? undefined} />
          )}
          {subTab === 'dokument' && (
            <DetailDocuments
              participantName={participant.fullName}
              enrollmentId={realEnrollmentId}
              stats={stats ?? undefined}
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

function DetailOverview({
  participant,
  enrollmentId,
}: {
  participant: StaParticipantRow
  enrollmentId: string | null
}) {
  const { absences } = useStaAbsences(enrollmentId)
  const recentAbsences = absences.slice(0, 4)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
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
            <span className="text-[11px] text-stone-500">gpt-oss-120b</span>
          </div>
          <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">{AI_SUMMARY_ANNA}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button variant="primary" size="sm">Kopiera till delredovisning</Button>
            <Button variant="ghost" size="sm">Generera nytt</Button>
          </div>
        </Card>

        <div>
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Skattningar i Del {participant.currentPart}</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { instrument: 'DOA', status: 'Pågående', progress: 62 },
              { instrument: 'WRI', status: 'Ej påbörjad', progress: 0 },
              { instrument: 'MOHOST', status: 'Ej påbörjad', progress: 0 },
            ].map((a) => (
              <Card key={a.instrument} variant="flat" padding="sm" className="text-center">
                <div className="text-xs font-medium text-stone-500">{a.instrument}</div>
                <div className="text-sm font-semibold text-stone-900 mt-1">{a.status}</div>
                {a.progress > 0 ? (
                  <div className="h-1.5 rounded-full mt-2 overflow-hidden bg-stone-100">
                    <div className="h-full" style={{ width: `${a.progress}%`, background: 'var(--c-solid)' }} />
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2 !text-xs">Starta</Button>
                )}
              </Card>
            ))}
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
            <QuickAction icon={<AlertTriangle size={14} />} label="Rapportera frånvaro" />
            <QuickAction icon={<MessageSquare size={14} />} label="Skicka meddelande" />
          </div>
        </Card>

        <Card variant="flat" padding="md" className="bg-stone-50">
          <div className="text-xs uppercase tracking-wide text-stone-500 font-medium">Senaste reflektion</div>
          <p className="text-sm text-stone-800 italic mt-2">
            "Stressig kväll. Jag tänker mycket på pengar. Hoppas sömnen blir bättre."
          </p>
          <div className="text-xs text-stone-500 mt-2">Tor 8 maj 19:42</div>
        </Card>
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

function DetailActivityLog({ stats }: { stats?: EnrollmentStats }) {
  // Använd riktig aktivitetslogg om vi har den
  if (stats) {
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

  // Fallback för mock
  return (
    <div>
      <h4 className="text-sm font-semibold text-stone-900 mb-3">Aktivitet den senaste veckan</h4>
      <ol className="border-l-2 border-stone-200 ml-3 space-y-3">
        {ACTIVITY_LOG_ANNA.map((entry) => (
          <li key={entry.id} className="pl-4 relative">
            <span
              className={cn(
                'absolute -left-[7px] top-1.5 w-3 h-3 rounded-full',
                entry.highlight ? '' : 'bg-stone-300',
              )}
              style={entry.highlight ? { background: 'var(--c-solid)' } : undefined}
            />
            <div className="text-sm font-medium text-stone-900">{entry.title}</div>
            <div className="text-xs text-stone-500">
              {entry.date} · {entry.subtext}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DetailAssessments({
  enrollmentId,
  stats,
}: {
  enrollmentId: string | null
  stats?: EnrollmentStats
}) {
  if (!enrollmentId || !stats) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-stone-600">
          Demo-data — riktiga skattningar visas här när du startat en.
        </p>
        {CONSULTANT_ASSESSMENTS.filter((a) => a.participantInitials === 'AK').map((a) => (
          <AssessmentDetailRow key={a.id} row={a} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        Alla instrumentskattningar för Del {stats.enrollment.current_part}. Skattningarna sparas mot enrollment-id <code className="text-[10px]">{enrollmentId.slice(0, 8)}</code>.
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
        stats.assessments.map((a) => (
          <AssessmentDetailRow
            key={a.id}
            row={{
              id: a.id,
              participantName: stats.enrollment.external_name ?? '',
              participantInitials: '',
              instrument: a.instrument,
              part: a.part,
              progress: a.scores ? Math.round((Object.keys(a.scores as object).length / 13) * 100) : 0,
              status: a.status === 'complete' ? 'complete' : a.scores && Object.keys(a.scores).length > 0 ? 'in_progress' : 'pending',
            }}
          />
        ))
      )}
    </div>
  )
}

function AssessmentDetailRow({ row }: { row: typeof CONSULTANT_ASSESSMENTS[number] }) {
  return (
    <div className="p-3 rounded-lg border border-stone-200 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-stone-900 text-sm">
          {row.instrument} · Del {row.part}
        </div>
        <div className="text-xs text-stone-500">
          {row.status === 'pending' && 'Ej påbörjad'}
          {row.status === 'in_progress' && `Pågående · ${row.progress}%`}
          {row.status === 'complete' && 'Klar'}
        </div>
      </div>
      {row.status === 'in_progress' && (
        <div className="h-1.5 rounded-full overflow-hidden bg-stone-100 w-32">
          <div className="h-full" style={{ width: `${row.progress}%`, background: 'var(--c-solid)' }} />
        </div>
      )}
      <Button variant={row.status === 'pending' ? 'primary' : 'secondary'} size="sm">
        {row.status === 'pending' ? 'Starta' : row.status === 'in_progress' ? 'Fortsätt' : 'Visa'}
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
  stats?: EnrollmentStats
}) {
  const navigate = useNavigate()
  const goTo = (docType: keyof typeof DOC_TYPE_META) => {
    if (!enrollmentId) {
      // För demo: navigera till en placeholder
      return
    }
    navigate(`/konsulent/steg-till-arbete/dokument/${enrollmentId}/${docType}`)
  }

  // Tillgängliga dokumenttyper för aktuell del
  const docTypesForPart: Array<{ key: keyof typeof DOC_TYPE_META; label: string }> = stats
    ? (() => {
        const part = stats.enrollment.current_part
        const list: Array<{ key: keyof typeof DOC_TYPE_META; label: string }> = []
        if (part === 1) list.push({ key: 'initial_planering', label: 'Initial planering' })
        list.push({ key: `delredovisning_${part}` as keyof typeof DOC_TYPE_META, label: `Delredovisning Del ${part}` })
        if (part >= 3) list.push({ key: 'anmalan_arbetsprovning', label: 'Anmälan arbetsprövning' })
        if (part >= 3) list.push({ key: 'information_arbetsprovning', label: 'Information från arbetsprövningsplats' })
        return list
      })()
    : [
        { key: 'initial_planering', label: 'Initial planering' },
        { key: 'delredovisning_1', label: 'Delredovisning Del 1' },
      ]

  const existing = stats?.documents ?? []

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

function AssessmentsTab({
  stats,
  isMock,
}: {
  stats: EnrollmentStats[]
  isMock: boolean
}) {
  // Bygg en flat lista av alla skattningar (med deltagaren) — om vi har riktig data
  const realAssessmentRows = useMemo(() => {
    if (isMock) return null
    return stats.flatMap((s) =>
      s.assessments.map((a) => ({
        id: a.id,
        participantName: s.enrollment.external_name ?? 'Jobin-deltagare',
        participantInitials: (s.enrollment.external_name ?? 'JD')
          .split(' ')
          .map((p) => p[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        instrument: a.instrument,
        part: a.part,
        progress:
          a.status === 'complete'
            ? 100
            : a.scores
            ? Math.round((Object.keys(a.scores as object).length / 13) * 100)
            : 0,
        status: a.status === 'complete' ? ('complete' as const) : a.status === 'draft' && a.scores && Object.keys(a.scores).length > 0 ? ('in_progress' as const) : ('pending' as const),
        dueLabel: undefined as string | undefined,
        dueLevel: undefined as 'red' | 'amber' | 'green' | undefined,
      })),
    )
  }, [stats, isMock])

  const rows = realAssessmentRows && realAssessmentRows.length > 0 ? realAssessmentRows : CONSULTANT_ASSESSMENTS
  void rows // existing JSX uses CONSULTANT_ASSESSMENTS still — wire below

  return (
    <Card variant="flat" padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <h3 className="text-base font-semibold text-stone-900">Alla skattningar</h3>
        <p className="text-xs text-stone-500">DOA · WRI · MOHOST · AWP · AWC</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Deltagare</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Instrument</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Del</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100">Deadline</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-stone-500 border-b border-stone-100"></th>
            </tr>
          </thead>
          <tbody>
            {CONSULTANT_ASSESSMENTS.map((a) => (
              <tr key={a.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
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
                  {a.status === 'pending' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-stone-100 text-stone-500">Ej påbörjad</span>}
                  {a.status === 'in_progress' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-700">{a.progress}%</span>
                      <div className="h-1.5 rounded-full overflow-hidden bg-stone-100 w-20">
                        <div className="h-full" style={{ width: `${a.progress}%`, background: 'var(--c-solid)' }} />
                      </div>
                    </div>
                  )}
                  {a.status === 'complete' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700">Klar</span>}
                </td>
                <td className="px-4 py-3 align-middle">
                  {a.dueLabel ? <DueChip level={a.dueLevel ?? 'green'} label={a.dueLabel} /> : <span className="text-xs text-stone-400">—</span>}
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <Button variant={a.status === 'pending' ? 'primary' : 'secondary'} size="sm">
                    {a.status === 'pending' ? 'Starta' : a.status === 'in_progress' ? 'Fortsätt' : 'Visa'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ===========================================================================
// WORKPLACES TAB
// ===========================================================================

function WorkplacesTab() {
  return (
    <div className="space-y-5">
      <Card variant="flat" padding="lg">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Arbetsprövningsplatser</h3>
            <p className="text-xs text-stone-500">Företag där dina deltagare arbetsprövar (Del 3 & 4)</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
            Lägg till företag
          </Button>
        </div>
        <div className="space-y-3">
          {CONSULTANT_WORKPLACES.map((w) => (
            <WorkplaceCard key={w.id} workplace={w} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function WorkplaceCard({ workplace }: { workplace: typeof CONSULTANT_WORKPLACES[number] }) {
  const afStatusLabel = {
    pending: 'Förbereds',
    submitted: 'Inskickad till AF · väntar',
    approved: 'Godkänd av AF',
  }[workplace.afStatus]
  const afStatusClass = {
    pending: 'bg-stone-100 text-stone-600',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
  }[workplace.afStatus]

  return (
    <div className="p-4 rounded-lg border border-stone-200">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
          >
            <Building2 size={18} />
          </div>
          <div>
            <div className="font-semibold text-stone-900">{workplace.companyName}</div>
            <div className="text-xs text-stone-500">
              {workplace.orgNumber && `Org. ${workplace.orgNumber} · `}
              Kontakt: {workplace.contactName}
            </div>
            <div className="text-xs text-stone-600 mt-1">
              Deltagare: <span className="font-medium">{workplace.participantName}</span> · {workplace.weeksInfo} · inriktning {workplace.inriktning}
            </div>
          </div>
        </div>
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', afStatusClass)}>
          {afStatusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-stone-500">{workplace.assessments}</div>
        <div className="flex gap-2">
          {workplace.afStatus !== 'approved' && (
            <Button variant="primary" size="sm" leftIcon={<Send size={12} />}>Skicka till AF</Button>
          )}
          <Button variant="secondary" size="sm">Öppna</Button>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
// DOCUMENTS TAB
// ===========================================================================

function DocumentsTab({
  stats,
  isMock,
}: {
  stats: EnrollmentStats[]
  isMock: boolean
}) {
  const navigate = useNavigate()

  // Riktiga dokument-utkast — flata listan per deltagare
  const realDrafts = useMemo(
    () =>
      stats.flatMap((s) =>
        s.documents
          .filter((d) => d.status === 'draft' || d.status === 'consultant_review')
          .map((d) => ({
            id: d.id,
            doc_type: d.doc_type,
            title: DOC_TYPE_META[d.doc_type].title,
            participantName: s.enrollment.external_name ?? 'Jobin-deltagare',
            enrollmentId: s.enrollment.id,
            aiDrafted: d.ai_drafted,
          })),
      ),
    [stats],
  )

  return (
    <div className="space-y-5">
      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3">Dokumentutkast och inskick</h3>
        <p className="text-xs text-stone-500 mb-4">
          Initial planering, delredovisning, slutredovisning och information från arbetsprövningsplats. AI-utkast genereras från
          deltagarens loggade aktiviteter och skattningar — granska alltid innan inskick.
        </p>

        {!isMock && realDrafts.length === 0 && (
          <Card variant="flat" padding="md" className="bg-stone-50">
            <p className="text-sm text-stone-600">
              Inga utkast än. Öppna en deltagare och klicka på &quot;Skapa Delredovisning Del 1&quot; för att starta.
            </p>
          </Card>
        )}

        {!isMock && realDrafts.length > 0 && (
          <ul className="space-y-2">
            {realDrafts.map((d) => (
              <li key={d.id} className="p-3 rounded-lg border border-stone-200 hover:bg-stone-50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-stone-900 flex items-center gap-2">
                      {d.title} — {d.participantName}
                      {d.aiDrafted && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                          style={{ background: 'var(--c-solid)' }}
                        >
                          <Bot size={10} />
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/konsulent/steg-till-arbete/dokument/${d.enrollmentId}/${d.doc_type}`)}
                  >
                    Öppna
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isMock && (
          <ul className="space-y-2">
            {CONSULTANT_DRAFTS.map((d) => (
              <li key={d.id} className="p-3 rounded-lg border border-stone-200 hover:bg-stone-50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-medium text-stone-900 flex items-center gap-2">
                      {d.title} — {d.participantName}
                      {d.aiDrafted && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                          style={{ background: 'var(--c-solid)' }}
                        >
                          <Bot size={10} />
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500">{d.subtext}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <DueChip level={d.dueLevel} label={d.due} />
                    <Button variant="primary" size="sm">Öppna</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="flat" padding="lg">
        <h3 className="text-base font-semibold text-stone-900 mb-3">Mallar</h3>
        <p className="text-xs text-stone-500 mb-3">
          Tillgängliga dokumenttyper. Öppna en deltagare och klicka &quot;Skapa&quot; för att starta från en av dessa.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'Initial planering', subtitle: 'Genereras från startsamtal + DOA · Del 1' },
            { title: 'Delredovisning Del 1', subtitle: 'Aktiviteter + DOA/WRI/MOHOST → AF Af 00825' },
            { title: 'Delredovisning Del 2', subtitle: 'Arbetsstationer + AWP/MOHOST → AF Af 00826' },
            { title: 'Delredovisning Del 3', subtitle: 'Arbetsprövning + skattningar → AF Af 00827' },
            { title: 'Slutredovisning Del 4', subtitle: 'Slutbedömning → AF Af 00828' },
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
  participantId,
  onClose,
}: {
  participantId: string
  onClose: () => void
}) {
  const participant = CONSULTANT_PARTICIPANTS.find((p) => p.id === participantId)
  if (!participant) return null

  const suggestions = participant.id === 'kerstin-olofsson' ? LINK_SUGGESTIONS_FOR_KERSTIN : []

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
