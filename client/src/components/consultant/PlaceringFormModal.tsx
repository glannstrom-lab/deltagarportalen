/**
 * PlaceringFormModal — skapa eller redigera en consultant_work_placements-rad.
 *
 * Portat från den avaktiverade STA-modulens WorkplaceFormModal
 * (client/src/pages/sta/components/WorkplaceFormModal.tsx) men:
 *  - fyra insatstyper i stället för AF-inriktning
 *  - deltagarval i formuläret (STA-varianten fick enrollment_id utifrån)
 *  - fyra egna sektioner för matchningsdimensionerna (fysiska krav/tempo,
 *    omfattning/tider, handledningsbehov, yrke/språk/behörigheter) i stället
 *    för AF-byråkratins fält
 *  - riktig tillgänglighet: role="dialog" + aria-modal + useFocusTrap med
 *    Escape-stängning. STA-originalet och de flesta dialoger i
 *    components/consultant/ saknar detta helt (KT1) — gör rätt här.
 */

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, CloseButton } from '@/components/ui/Button'
import { Building2, AlertCircle } from '@/components/ui/icons'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import {
  placeringarApi,
  type EmployerHiringInterest,
  type KopplaBarDeltagare,
  type Placering,
  type PlaceringInput,
  type PlaceringTyp,
} from '@/services/placeringarApi'
import {
  EMPLOYER_HIRING_INTEREST_LABEL,
  PLACERING_TYP_BESKRIVNING,
  PLACERING_TYP_LABEL,
} from './placeringLabels'

interface Props {
  open: boolean
  existing: Placering | null
  deltagare: KopplaBarDeltagare[]
  /** Förvald deltagare (t.ex. när modalen öppnas från en deltagares egen kortvy). */
  forcedParticipantId?: string
  onSave: (input: PlaceringInput) => Promise<unknown>
  onClose: () => void
}

const TYPER: PlaceringTyp[] = ['praktik', 'arbetstraning', 'arbetsprovning', 'subventionerad_anstallning']

function tomtFormular(participantId: string): PlaceringInput {
  return {
    participant_id: participantId,
    company_name: '',
    placement_type: 'praktik',
    org_number: null,
    occupation: null,
    industry: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    address: null,
    start_date: null,
    end_date: null,
    hours_per_week: null,
    schedule_days: null,
    can_ramp_up: false,
    ramp_up_plan: null,
    lifting_required: null,
    standing_required: null,
    temperature_demands: null,
    noise_level: null,
    pace_level: null,
    shift_work: false,
    physical_notes: null,
    participant_supervision_need: null,
    workplace_supervision_capacity: null,
    supervision_notes: null,
    language_requirements: null,
    drivers_license_required: false,
    other_requirements: null,
    sick_call_phone: null,
    sick_call_instructions: null,
    employer_instructions: null,
    internal_adaptation_notes: null,
    work_environment_responsibility: null,
    employer_future_needs: null,
    employer_hiring_interest: 'okant',
    notes: null,
  }
}

export function PlaceringFormModal({ open, existing, deltagare, forcedParticipantId, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<PlaceringInput>(tomtFormular(forcedParticipantId ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dialogRef = useFocusTrap<HTMLDivElement>(open, { onEscape: onClose })

  useEffect(() => {
    if (existing) {
      setDraft({ ...existing })
    } else {
      setDraft(tomtFormular(forcedParticipantId ?? ''))
    }
    setError(null)
  }, [existing, open, forcedParticipantId])

  // Förslag på slutdatum + diskret avvikelsenotering (blockerar aldrig, se
  // placeringarApi.berakPeriodForslag). Måste ligga före den tidiga
  // returnen nedan — Rules of Hooks.
  const periodForslag = useMemo(
    () => placeringarApi.berakPeriodForslag(draft.placement_type, draft.start_date ?? null, draft.end_date ?? null),
    [draft.placement_type, draft.start_date, draft.end_date]
  )

  if (!open) return null

  const update = <K extends keyof PlaceringInput>(key: K, value: PlaceringInput[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!draft.participant_id) {
      setError('Välj en deltagare')
      return
    }
    if (!draft.company_name.trim()) {
      setError('Företagsnamn krävs')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plc-title"
    >
      <Card
        variant="flat"
        padding="none"
        className="w-full max-w-3xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-stone-700" />
            <h2 id="plc-title" className="font-semibold text-stone-900">
              {existing ? 'Redigera plats' : 'Ny plats'}
            </h2>
          </div>
          <CloseButton onClick={onClose} aria-label="Stäng" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ---- Deltagare + insatstyp ---- */}
          <section className="space-y-3">
            <Field label="Deltagare *">
              <select
                value={draft.participant_id}
                onChange={(e) => update('participant_id', e.target.value)}
                disabled={!!existing || !!forcedParticipantId}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white disabled:bg-stone-50 disabled:text-stone-500"
              >
                <option value="">Välj deltagare…</option>
                {deltagare.map((d) => (
                  <option key={d.participant_id} value={d.participant_id}>
                    {[d.first_name, d.last_name].filter(Boolean).join(' ') || d.email}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Insatstyp *">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TYPER.map((typ) => (
                  <label
                    key={typ}
                    className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer text-sm ${
                      draft.placement_type === typ
                        ? 'border-stone-700 bg-stone-50'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="placement_type"
                      checked={draft.placement_type === typ}
                      onChange={() => update('placement_type', typ)}
                      className="mt-0.5 accent-stone-700"
                    />
                    <span>
                      <strong className="block text-stone-900">{PLACERING_TYP_LABEL[typ]}</strong>
                      <span className="text-xs text-stone-600">{PLACERING_TYP_BESKRIVNING[typ]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </section>

          {/* ---- Grunddata om platsen ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Arbetsplatsen</h3>
            <Field label="Företagsnamn *">
              <input
                type="text"
                value={draft.company_name}
                onChange={(e) => update('company_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                placeholder="T.ex. Lidl Sundsvall"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Yrke">
                <input
                  type="text"
                  value={draft.occupation ?? ''}
                  onChange={(e) => update('occupation', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
              <Field label="Bransch">
                <input
                  type="text"
                  value={draft.industry ?? ''}
                  onChange={(e) => update('industry', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Kontaktperson">
                <input
                  type="text"
                  value={draft.contact_name ?? ''}
                  onChange={(e) => update('contact_name', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
              <Field label="Telefon">
                <input
                  type="tel"
                  value={draft.contact_phone ?? ''}
                  onChange={(e) => update('contact_phone', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
              <Field label="E-post">
                <input
                  type="email"
                  value={draft.contact_email ?? ''}
                  onChange={(e) => update('contact_email', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
            </div>
            <Field label="Adress">
              <input
                type="text"
                value={draft.address ?? ''}
                onChange={(e) => update('address', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </section>

          {/* ---- Dimension 2: omfattning och tider ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Omfattning och tider</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Startdatum">
                <input
                  type="date"
                  value={draft.start_date ?? ''}
                  onChange={(e) => update('start_date', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
              <Field label="Slutdatum">
                <input
                  type="date"
                  value={draft.end_date ?? ''}
                  onChange={(e) => update('end_date', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
              <Field label="Timmar/vecka">
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={0.5}
                  value={draft.hours_per_week ?? ''}
                  onChange={(e) => update('hours_per_week', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
            </div>

            {/* Periodriktvärde — förslag, aldrig en spärr (Mikael vet när ett undantag är rätt). */}
            <p className="text-xs text-stone-500 flex items-center gap-2 flex-wrap">
              <span>{periodForslag.meddelande}</span>
              {periodForslag.foreslagetSlutdatum && !draft.end_date && (
                <button
                  type="button"
                  onClick={() => update('end_date', periodForslag.foreslagetSlutdatum)}
                  className="underline text-stone-700 hover:text-stone-900"
                >
                  Använd förslag: {periodForslag.foreslagetSlutdatum}
                </button>
              )}
            </p>
            {periodForslag.avvikerTydligt && (
              <p className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertCircle size={12} />
                Perioden är tydligt längre än riktvärdet för {PLACERING_TYP_LABEL[draft.placement_type].toLowerCase()}.
                Ingen spärr — bara en påminnelse om att kontrollera att det är avsiktligt.
              </p>
            )}

            <Field label="Vilka dagar">
              <input
                type="text"
                value={draft.schedule_days ?? ''}
                onChange={(e) => update('schedule_days', e.target.value || null)}
                placeholder="T.ex. Mån, tis, tors 09–14"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-stone-200 hover:bg-stone-50">
              <input
                type="checkbox"
                checked={draft.can_ramp_up ?? false}
                onChange={(e) => update('can_ramp_up', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-stone-700"
              />
              <span className="text-sm text-stone-800">
                <strong className="block">Möjlighet att trappa upp</strong>
                <span className="text-xs text-stone-600">
                  Avgörande för den som börjar på låg omfattning, t.ex. 25 %.
                </span>
              </span>
            </label>
            {draft.can_ramp_up && (
              <Field label="Hur ska upptrappningen gå till?">
                <textarea
                  rows={2}
                  value={draft.ramp_up_plan ?? ''}
                  onChange={(e) => update('ramp_up_plan', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                  placeholder="T.ex. 25 % vecka 1–2, 50 % vecka 3–4, 75 % därefter"
                />
              </Field>
            )}
          </section>

          {/* ---- Dimension 1: fysiska krav och tempo ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Fysiska krav och tempo</h3>
            <p className="text-xs text-stone-500">
              Det som oftast fäller en placering för den här målgruppen, och det som sällan står
              nedskrivet någonstans. Fyll i det du vet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.lifting_required ?? false}
                  onChange={(e) => update('lifting_required', e.target.checked)}
                  className="w-4 h-4 accent-stone-700"
                />
                Kräver tunga lyft
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.standing_required ?? false}
                  onChange={(e) => update('standing_required', e.target.checked)}
                  className="w-4 h-4 accent-stone-700"
                />
                Kräver att stå upp
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.shift_work ?? false}
                  onChange={(e) => update('shift_work', e.target.checked)}
                  className="w-4 h-4 accent-stone-700"
                />
                Skiftarbete
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Temperatur">
                <select
                  value={draft.temperature_demands ?? ''}
                  onChange={(e) => update('temperature_demands', (e.target.value || null) as PlaceringInput['temperature_demands'])}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
                >
                  <option value="">Ej satt</option>
                  <option value="normal">Normal</option>
                  <option value="kyla">Kyla</option>
                  <option value="varme">Värme</option>
                </select>
              </Field>
              <Field label="Buller">
                <select
                  value={draft.noise_level ?? ''}
                  onChange={(e) => update('noise_level', (e.target.value || null) as PlaceringInput['noise_level'])}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
                >
                  <option value="">Ej satt</option>
                  <option value="lag">Låg</option>
                  <option value="mellan">Mellan</option>
                  <option value="hog">Hög</option>
                </select>
              </Field>
              <Field label="Tempo">
                <select
                  value={draft.pace_level ?? ''}
                  onChange={(e) => update('pace_level', (e.target.value || null) as PlaceringInput['pace_level'])}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
                >
                  <option value="">Ej satt</option>
                  <option value="lag">Lågt</option>
                  <option value="mellan">Mellan</option>
                  <option value="hog">Högt</option>
                </select>
              </Field>
            </div>
            <Field label="Övrigt om fysiska krav">
              <textarea
                rows={2}
                value={draft.physical_notes ?? ''}
                onChange={(e) => update('physical_notes', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </section>

          {/* ---- Dimension 3: handledningsbehov ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Handledningsbehov</h3>
            <p className="text-xs text-stone-500">
              En matchning mellan vad deltagaren behöver och vad arbetsplatsen kan ge.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Deltagarens behov av stöd">
                <select
                  value={draft.participant_supervision_need ?? ''}
                  onChange={(e) =>
                    update('participant_supervision_need', (e.target.value || null) as PlaceringInput['participant_supervision_need'])
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
                >
                  <option value="">Ej satt</option>
                  <option value="lag">Lågt</option>
                  <option value="mellan">Mellan</option>
                  <option value="hog">Högt</option>
                </select>
              </Field>
              <Field label="Arbetsplatsens kapacitet att handleda">
                <select
                  value={draft.workplace_supervision_capacity ?? ''}
                  onChange={(e) =>
                    update('workplace_supervision_capacity', (e.target.value || null) as PlaceringInput['workplace_supervision_capacity'])
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
                >
                  <option value="">Ej satt</option>
                  <option value="lag">Låg</option>
                  <option value="mellan">Mellan</option>
                  <option value="hog">Hög</option>
                </select>
              </Field>
            </div>
            <Field label="Anteckningar om handledning">
              <textarea
                rows={2}
                value={draft.supervision_notes ?? ''}
                onChange={(e) => update('supervision_notes', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </section>

          {/* ---- Dimension 4: yrke/bransch/språk/behörigheter ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Språkkrav och behörigheter</h3>
            <Field label="Språkkrav">
              <input
                type="text"
                value={draft.language_requirements ?? ''}
                onChange={(e) => update('language_requirements', e.target.value || null)}
                placeholder="T.ex. Svenska B1, engelska inte nödvändigt"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 text-sm cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={draft.drivers_license_required ?? false}
                onChange={(e) => update('drivers_license_required', e.target.checked)}
                className="w-4 h-4 accent-stone-700"
              />
              Körkort krävs
            </label>
            <Field label="Övriga behörigheter">
              <input
                type="text"
                value={draft.other_requirements ?? ''}
                onChange={(e) => update('other_requirements', e.target.value || null)}
                placeholder="T.ex. truckkort, hygienutbildning"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </section>

          {/* ---- Praktiskt ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Praktiskt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Ring sjuk — telefon">
                <input
                  type="tel"
                  value={draft.sick_call_phone ?? ''}
                  onChange={(e) => update('sick_call_phone', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
              <Field label="Ring sjuk — vad ska sägas/till vem">
                <input
                  type="text"
                  value={draft.sick_call_instructions ?? ''}
                  onChange={(e) => update('sick_call_instructions', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </Field>
            </div>
            {/* VAD skiljs från VARFÖR (Mikael, uppdragssvar 2026-08-31). Slå aldrig ihop
                de här två fälten igen — se byggArbetsgivarUnderlag() i placeringarApi.ts. */}
            <Field label="Instruktioner till arbetsplatsen (VAD) — får delas med arbetsgivaren">
              <textarea
                rows={2}
                value={draft.employer_instructions ?? ''}
                onChange={(e) => update('employer_instructions', e.target.value || null)}
                placeholder="T.ex. skriftliga instruktioner, paus var 90:e minut, en arbetsuppgift i taget"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Skriv vad arbetsplatsen ska göra — utan orsak. Det här är det enda av de här två
                fälten som får skickas till arbetsgivaren.
              </p>
            </Field>
            <Field label="Bakgrund till anpassningen (VARFÖR) — internt, delas ALDRIG med arbetsgivaren">
              <textarea
                rows={2}
                value={draft.internal_adaptation_notes ?? ''}
                onChange={(e) => update('internal_adaptation_notes', e.target.value || null)}
                placeholder="Konsulentens interna anteckning om bakgrunden"
                className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/40 text-sm"
              />
              <p className="mt-1 text-[11px] text-amber-700 flex items-center gap-1">
                <AlertCircle size={11} />
                Internt underlag. Når aldrig en arbetsgivare.
              </p>
            </Field>
            <Field label="Vem har arbetsmiljöansvaret">
              <input
                type="text"
                value={draft.work_environment_responsibility ?? ''}
                onChange={(e) => update('work_environment_responsibility', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
            <Field label="Övriga anteckningar">
              <textarea
                rows={3}
                value={draft.notes ?? ''}
                onChange={(e) => update('notes', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </section>

          {/* ---- Arbetsgivarens motivation — internt underlag, delas ALDRIG (Mikael, uppdragssvar 2026-08-31) ---- */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900">Arbetsgivarens motivation</h3>
            <p className="text-xs text-stone-500">
              Säljargumentet, och det som avgör om placeringen leder någonstans. Konsulentens
              interna underlag — inget av det här skickas till arbetsgivaren.
            </p>
            <Field label="Arbetsgivarens framtida behov">
              <textarea
                rows={2}
                value={draft.employer_future_needs ?? ''}
                onChange={(e) => update('employer_future_needs', e.target.value || null)}
                placeholder="Vad gör praktikanten till en tillgång på sikt?"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
            <Field label="Intresse för anställning efteråt">
              <select
                value={draft.employer_hiring_interest ?? 'okant'}
                onChange={(e) => update('employer_hiring_interest', e.target.value as EmployerHiringInterest)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
              >
                {(Object.keys(EMPLOYER_HIRING_INTEREST_LABEL) as EmployerHiringInterest[]).map((val) => (
                  <option key={val} value={val}>
                    {EMPLOYER_HIRING_INTEREST_LABEL[val]}
                  </option>
                ))}
              </select>
            </Field>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-stone-100 bg-stone-50 flex-wrap">
          {error && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-700">
              <AlertCircle size={12} />
              {error}
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Avbryt
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} isLoading={saving}>
            {existing ? 'Spara ändringar' : 'Skapa plats'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
