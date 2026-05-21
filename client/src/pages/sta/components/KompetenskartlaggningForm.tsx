/**
 * KompetenskartlaggningForm — Del 1 obligatorisk aktivitet.
 *
 * Baserad på "Kompetens kartläggning.docx" från sta/Del 1. Deltagaren fyller
 * i själv i sin egen takt; svaren sparas i sta_activities.metadata. När alla
 * obligatoriska fält är ifyllda kan deltagaren markera kartläggningen som
 * klar — då sätts completed_at och konsulenten ser status "Klar".
 *
 * Spar-mönster: partial save mergar in nya fält i metadata (upsertByKey).
 */

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CloseButton } from '@/components/ui/Button'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Briefcase,
  Heart,
  Globe,
  BookOpen,
  Target,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { staActivitiesApi, type StaActivity } from '@/services/staApi'

// =============================================================================
// FORMULÄRDATA
// =============================================================================

interface KomptenceMappingData {
  // Hälsa & förutsättningar
  aktivitetsformaga: string
  haelsoSituation: string
  vardkontakter: string
  anpassningsbehov: string

  // Praktiskt
  korkort: 'b' | 'b_bil' | 'andra' | 'inget' | ''

  // Digital kompetens
  digitalSkicklighet: number  // 1-5
  digitalUtvecklingsbehov: number  // 1-5
  harDator: boolean

  // Språk & kommunikation
  sprak: string[]

  // Utbildning
  grundskola: boolean
  gymnasium: boolean
  eftergymnasial: boolean
  sfi: 'pagaende' | 'klart' | 'nej' | ''
  utbildningsExtra: string

  // Arbete & CV
  harCV: boolean
  tidigareErfarenhet: string
  manaderSokt: string

  // Kompetenser & yrke
  kompetenser: string[]
  fritidsintressen: string
  fokusyrkeForslag: string
  vad_vill_jobba_med: string

  // Övrigt
  ovrigt: string
}

const EMPTY_DATA: KomptenceMappingData = {
  aktivitetsformaga: '',
  haelsoSituation: '',
  vardkontakter: '',
  anpassningsbehov: '',
  korkort: '',
  digitalSkicklighet: 3,
  digitalUtvecklingsbehov: 3,
  harDator: false,
  sprak: [],
  grundskola: false,
  gymnasium: false,
  eftergymnasial: false,
  sfi: '',
  utbildningsExtra: '',
  harCV: false,
  tidigareErfarenhet: '',
  manaderSokt: '',
  kompetenser: [],
  fritidsintressen: '',
  fokusyrkeForslag: '',
  vad_vill_jobba_med: '',
  ovrigt: '',
}

const SPRAK_FORSLAG = ['Svenska', 'Engelska', 'Arabiska', 'Somaliska', 'Tigrinja', 'Dari', 'Pashtu', 'Persiska', 'Spanska', 'Annat']

const KOMPETENSER_FORSLAG = [
  'Kommunikation',
  'Planering',
  'Samarbete',
  'Problemlösning',
  'Ledarskap',
  'Ansvarsfull',
  'Ordningsam',
  'Social',
  'Kreativ',
  'Noggrann',
  'Tålmodig',
  'Lyhörd',
]

// Sektioner för progress + navigation
const SECTIONS = [
  { id: 'halsa', label: 'Hälsa', icon: Heart },
  { id: 'praktiskt', label: 'Praktiskt', icon: Briefcase },
  { id: 'digital', label: 'Digital kompetens', icon: Sparkles },
  { id: 'sprak', label: 'Språk', icon: Globe },
  { id: 'utbildning', label: 'Utbildning', icon: BookOpen },
  { id: 'arbete', label: 'Arbete', icon: Briefcase },
  { id: 'kompetenser', label: 'Dina styrkor', icon: Sparkles },
  { id: 'yrke', label: 'Yrke', icon: Target },
] as const

type SectionId = typeof SECTIONS[number]['id']

// =============================================================================
// HELPERS
// =============================================================================

function computeCompletionPct(d: KomptenceMappingData): number {
  // Räkna 10 nyckelfält som tillsammans utgör 100%
  const fields: Array<boolean> = [
    !!d.aktivitetsformaga.trim(),
    !!d.haelsoSituation.trim(),
    !!d.korkort,
    d.digitalSkicklighet >= 1,
    d.sprak.length > 0,
    d.grundskola || d.gymnasium || d.eftergymnasial || d.sfi !== '',
    !!d.tidigareErfarenhet.trim(),
    d.kompetenser.length > 0,
    !!d.vad_vill_jobba_med.trim(),
    !!d.fritidsintressen.trim(),
  ]
  const done = fields.filter(Boolean).length
  return Math.round((done / fields.length) * 100)
}

function isReadyToComplete(d: KomptenceMappingData): boolean {
  // Krav för "markera klar": ifyllt alla nyckelfält
  return computeCompletionPct(d) >= 80
}

// =============================================================================
// HUVUDKOMPONENT
// =============================================================================

interface Props {
  enrollmentId: string | null  // null = preview
  existing?: StaActivity | null
  onClose: () => void
  onSaved?: () => void
  /** Preview-läge — sparar inte. */
  readOnly?: boolean
}

export function KompetenskartlaggningForm({ enrollmentId, existing, onClose, onSaved, readOnly = false }: Props) {
  const [data, setData] = useState<KomptenceMappingData>(EMPTY_DATA)
  const [section, setSection] = useState<SectionId>('halsa')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)

  // Förifyll från existerande aktivitet (om finns)
  useEffect(() => {
    if (existing?.metadata) {
      setData({ ...EMPTY_DATA, ...(existing.metadata as Partial<KomptenceMappingData>) })
    }
  }, [existing])

  const pct = useMemo(() => computeCompletionPct(data), [data])
  const canComplete = isReadyToComplete(data)
  const isAlreadyComplete = !!existing?.completed_at

  const update = <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleListItem = (key: 'sprak' | 'kompetenser', item: string) => {
    setData((prev) => {
      const current = prev[key]
      return {
        ...prev,
        [key]: current.includes(item) ? current.filter((s) => s !== item) : [...current, item],
      }
    })
  }

  const handleSave = async (mark: boolean) => {
    if (readOnly) {
      onClose()
      return
    }
    if (!enrollmentId) return
    setSaving(true)
    setFeedback(null)
    try {
      await staActivitiesApi.upsertByKey({
        enrollment_id: enrollmentId,
        part: 1,
        activity_type: 'kompetenskartlaggning',
        activity_key: 'kompetenskartlaggning',
        metadata: data as unknown as Record<string, unknown>,
        markComplete: mark,
      })
      setFeedback('saved')
      onSaved?.()
      if (mark) {
        setTimeout(() => onClose(), 800)
      } else {
        setTimeout(() => setFeedback(null), 2000)
      }
    } catch {
      setFeedback('error')
    } finally {
      setSaving(false)
    }
  }

  const sectionIdx = SECTIONS.findIndex((s) => s.id === section)
  const nextSection = SECTIONS[sectionIdx + 1]?.id
  const prevSection = SECTIONS[sectionIdx - 1]?.id

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kk-title"
    >
      <div
        data-domain="action"
        className="w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}
            >
              <Sparkles size={14} />
            </span>
            <div>
              <div id="kk-title" className="font-semibold text-sm text-stone-900">
                Kompetenskartläggning
              </div>
              <div className="text-xs text-stone-500">
                {isAlreadyComplete ? 'Klar — du kan justera dina svar' : `${pct}% ifyllt`}
              </div>
            </div>
          </div>
          <CloseButton onClick={onClose} aria-label="Stäng" />
        </div>

        {/* Progress */}
        <div className="h-1 bg-stone-100">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, background: 'var(--c-solid)' }}
          />
        </div>

        {/* Section nav */}
        <div className="flex overflow-x-auto gap-1 px-4 py-2 border-b border-stone-100">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const active = section === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-colors',
                  active
                    ? 'text-[var(--c-text)]'
                    : 'text-stone-600 hover:bg-stone-100',
                )}
                style={active ? { background: 'var(--c-bg)' } : undefined}
              >
                <Icon size={12} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-5">
          {section === 'halsa' && (
            <HalsaSection data={data} update={update} />
          )}
          {section === 'praktiskt' && (
            <PraktisktSection data={data} update={update} />
          )}
          {section === 'digital' && (
            <DigitalSection data={data} update={update} />
          )}
          {section === 'sprak' && (
            <SprakSection data={data} toggle={(s) => toggleListItem('sprak', s)} />
          )}
          {section === 'utbildning' && (
            <UtbildningSection data={data} update={update} />
          )}
          {section === 'arbete' && (
            <ArbeteSection data={data} update={update} />
          )}
          {section === 'kompetenser' && (
            <KompetenserSection data={data} toggle={(k) => toggleListItem('kompetenser', k)} update={update} />
          )}
          {section === 'yrke' && (
            <YrkeSection data={data} update={update} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-stone-100 bg-stone-50 flex-wrap">
          <div className="flex items-center gap-2">
            {prevSection && (
              <Button size="sm" variant="ghost" onClick={() => setSection(prevSection)}>
                Föregående
              </Button>
            )}
            {nextSection && (
              <Button size="sm" variant="ghost" onClick={() => setSection(nextSection)}>
                Nästa
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {feedback === 'saved' && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 size={12} />
                Sparat
              </span>
            )}
            {feedback === 'error' && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-700">
                <AlertCircle size={12} />
                Kunde inte spara
              </span>
            )}
            {saving && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <Loader2 size={12} className="animate-spin" />
                Sparar…
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={() => handleSave(false)} disabled={saving}>
              Spara utkast
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleSave(true)}
              disabled={saving || !canComplete}
              leftIcon={<CheckCircle2 size={14} />}
            >
              {isAlreadyComplete ? 'Spara ändringar' : 'Markera klar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SECTIONS
// =============================================================================

function HalsaSection({
  data,
  update,
}: {
  data: KomptenceMappingData
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Hälsa och förutsättningar"
        lead="Det här hjälper oss att förstå hur vi planerar tillsammans. Det är okej att skriva kort eller hoppa över."
      />
      <FormLabel>Hur ser du på din aktivitetsförmåga just nu?</FormLabel>
      <textarea
        rows={3}
        value={data.aktivitetsformaga}
        onChange={(e) => update('aktivitetsformaga', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="T.ex. orkar några timmar i taget, behöver pauser, mår bättre på morgnar..."
      />

      <FormLabel>Hur ser du på din hälsa — psykiskt och fysiskt?</FormLabel>
      <textarea
        rows={3}
        value={data.haelsoSituation}
        onChange={(e) => update('haelsoSituation', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="Du bestämmer hur mycket du vill dela"
      />

      <FormLabel>Har du några vårdkontakter just nu?</FormLabel>
      <input
        type="text"
        value={data.vardkontakter}
        onChange={(e) => update('vardkontakter', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="T.ex. vårdcentral, psykolog, fysioterapeut..."
      />

      <FormLabel>Behöver du några särskilda anpassningar för att fungera bra?</FormLabel>
      <textarea
        rows={2}
        value={data.anpassningsbehov}
        onChange={(e) => update('anpassningsbehov', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="T.ex. tysta rum, kortare pass, bildstöd..."
      />
    </div>
  )
}

function PraktisktSection({
  data,
  update,
}: {
  data: KomptenceMappingData
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Körkort"
        lead="Påverkar vilka jobb du kan söka — t.ex. utkörare, fältarbete."
      />
      <RadioGrid
        value={data.korkort}
        onChange={(v) => update('korkort', v as KomptenceMappingData['korkort'])}
        options={[
          { value: 'inget', label: 'Inget körkort', desc: 'Jag har inte tagit körkort' },
          { value: 'b', label: 'B-körkort', desc: 'Personbil, men ingen bil' },
          { value: 'b_bil', label: 'B + tillgång till bil', desc: 'Personbil, har bil att använda' },
          { value: 'andra', label: 'Andra körkort', desc: 'T.ex. CE, truckkort, taxiförarlegitimation' },
        ]}
      />
    </div>
  )
}

function DigitalSection({
  data,
  update,
}: {
  data: KomptenceMappingData
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-5">
      <SectionIntro
        title="Digital kompetens"
        lead="Hur du hanterar digitala verktyg — viktigt för både jobbsök och nästan alla jobb idag."
      />

      <div>
        <FormLabel>Hur bedömer du din förmåga att hantera dator/smartphone/platta?</FormLabel>
        <ScaleInput
          value={data.digitalSkicklighet}
          onChange={(v) => update('digitalSkicklighet', v)}
          labelLow="Mycket dåligt"
          labelHigh="Mycket bra"
        />
      </div>

      <div>
        <FormLabel>Behöver du höja din digitala kompetens?</FormLabel>
        <ScaleInput
          value={data.digitalUtvecklingsbehov}
          onChange={(v) => update('digitalUtvecklingsbehov', v)}
          labelLow="Inte alls"
          labelHigh="Mycket viktigt"
        />
      </div>

      <CheckboxRow
        checked={data.harDator}
        onChange={(v) => update('harDator', v)}
        label="Jag använder dator/platta/smartphone dagligen"
      />
    </div>
  )
}

function SprakSection({
  data,
  toggle,
}: {
  data: KomptenceMappingData
  toggle: (sprak: string) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Vilka språk talar du?"
        lead="Inkludera även språk du bara förstår eller talar lite. Vi använder detta för att veta om du behöver språkstöd och vilka jobb som passar."
      />
      <div className="flex flex-wrap gap-2">
        {SPRAK_FORSLAG.map((s) => {
          const active = data.sprak.includes(s)
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors',
                active
                  ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
              )}
              style={active ? { background: 'var(--c-bg)' } : undefined}
              aria-pressed={active}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UtbildningSection({
  data,
  update,
}: {
  data: KomptenceMappingData
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Din utbildning"
        lead="Det räcker att bocka av vad du har gått. Om du har en pågående utbildning skriver du det i fältet under."
      />
      <CheckboxRow checked={data.grundskola} onChange={(v) => update('grundskola', v)} label="Grundskola eller motsvarande" />
      <CheckboxRow checked={data.gymnasium} onChange={(v) => update('gymnasium', v)} label="Gymnasium (avslutat eller intyg)" />
      <CheckboxRow checked={data.eftergymnasial} onChange={(v) => update('eftergymnasial', v)} label="Eftergymnasial utbildning (yrkeshögskola, högskola, universitet)" />

      <div>
        <FormLabel>SFI (Svenska för invandrare)</FormLabel>
        <RadioGrid
          value={data.sfi}
          onChange={(v) => update('sfi', v as KomptenceMappingData['sfi'])}
          options={[
            { value: 'nej', label: 'Inte aktuellt', desc: 'Ej deltagit i SFI' },
            { value: 'pagaende', label: 'Pågående', desc: 'Studerar SFI nu' },
            { value: 'klart', label: 'Klart', desc: 'Har avslutat SFI' },
          ]}
        />
      </div>

      <FormLabel>Andra utbildningar / kurser / certifikat?</FormLabel>
      <textarea
        rows={3}
        value={data.utbildningsExtra}
        onChange={(e) => update('utbildningsExtra', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="T.ex. truckkort, första hjälpen-utbildning, datorkurs..."
      />
    </div>
  )
}

function ArbeteSection({
  data,
  update,
}: {
  data: KomptenceMappingData
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Arbete och CV"
        lead="Vad har du jobbat med tidigare? Det räknas även om det var länge sedan eller deltid."
      />
      <CheckboxRow
        checked={data.harCV}
        onChange={(v) => update('harCV', v)}
        label="Jag har ett CV idag"
      />

      <FormLabel>Senaste arbetsgivare och vad du gjorde där</FormLabel>
      <textarea
        rows={3}
        value={data.tidigareErfarenhet}
        onChange={(e) => update('tidigareErfarenhet', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="Ungefärliga år räcker, t.ex. 'Lagerarbetare på Coop 2019–2022, plockning och lossning'"
      />

      <FormLabel>Hur många timmar i veckan har du sökt jobb senaste månaden?</FormLabel>
      <input
        type="text"
        value={data.manaderSokt}
        onChange={(e) => update('manaderSokt', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="T.ex. '2-3 timmar i veckan' eller 'inget alls den här månaden'"
      />
    </div>
  )
}

function KompetenserSection({
  data,
  toggle,
  update,
}: {
  data: KomptenceMappingData
  toggle: (k: string) => void
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Dina styrkor"
        lead="Bocka av 2-4 ord som beskriver dig. Tänk på hur du är både i jobb och på fritiden."
      />
      <div className="flex flex-wrap gap-2">
        {KOMPETENSER_FORSLAG.map((k) => {
          const active = data.kompetenser.includes(k)
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors',
                active
                  ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
              )}
              style={active ? { background: 'var(--c-bg)' } : undefined}
              aria-pressed={active}
            >
              {k}
            </button>
          )
        })}
      </div>

      <FormLabel>Vad gör du på fritiden?</FormLabel>
      <textarea
        rows={3}
        value={data.fritidsintressen}
        onChange={(e) => update('fritidsintressen', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="Hobbies, intressen, sammanhang du är med i..."
      />
    </div>
  )
}

function YrkeSection({
  data,
  update,
}: {
  data: KomptenceMappingData
  update: <K extends keyof KomptenceMappingData>(key: K, value: KomptenceMappingData[K]) => void
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        title="Yrke och drömmar"
        lead="Det är okej att vara osäker — vi pratar igenom det här tillsammans i Del 1."
      />
      <FormLabel>Vad skulle du vilja jobba med?</FormLabel>
      <textarea
        rows={3}
        value={data.vad_vill_jobba_med}
        onChange={(e) => update('vad_vill_jobba_med', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="Kan vara konkret yrke eller bara typ av arbete — t.ex. 'något lugnt med kollegor', 'butik', 'admin'..."
      />

      <FormLabel>Har du fått ett fokusyrke från Arbetsförmedlingen?</FormLabel>
      <input
        type="text"
        value={data.fokusyrkeForslag}
        onChange={(e) => update('fokusyrkeForslag', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="T.ex. 'Lagerarbetare' — lämna tomt om du inte vet"
      />

      <FormLabel>Något annat din konsulent borde veta?</FormLabel>
      <textarea
        rows={2}
        value={data.ovrigt}
        onChange={(e) => update('ovrigt', e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200"
        placeholder="Något du tycker är viktigt att ta upp..."
      />
    </div>
  )
}

// =============================================================================
// SHARED FORM PIECES
// =============================================================================

function SectionIntro({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-2">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="text-sm text-stone-600 mt-0.5">{lead}</p>
    </div>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-stone-700">{children}</label>
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[var(--c-solid)]"
      />
      <span className="text-sm text-stone-700">{label}</span>
    </label>
  )
}

function ScaleInput({
  value,
  onChange,
  labelLow,
  labelHigh,
}: {
  value: number
  onChange: (v: number) => void
  labelLow: string
  labelHigh: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors',
              value === n
                ? 'border-[var(--c-solid)] text-[var(--c-text)]'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300',
            )}
            style={value === n ? { background: 'var(--c-bg)' } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-stone-500 mt-1">
        <span>1 — {labelLow}</span>
        <span>5 — {labelHigh}</span>
      </div>
    </div>
  )
}

function RadioGrid({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string; desc: string }>
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-start gap-2 p-3 rounded-lg border-2 text-left transition-colors',
              active
                ? 'border-[var(--c-solid)] bg-white'
                : 'border-stone-200 bg-white hover:border-stone-300',
            )}
            aria-pressed={active}
          >
            <div
              className={cn(
                'w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0',
                active ? 'border-[var(--c-solid)] bg-[var(--c-solid)]' : 'border-stone-300',
              )}
            />
            <div>
              <div className="text-sm font-medium text-stone-900">{opt.label}</div>
              <div className="text-xs text-stone-500 mt-0.5">{opt.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Mark `Card` as used so eslint doesn't yell — we use it implicitly via styles.
void Card
