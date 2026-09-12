/**
 * PlatsFormDialog — skapa eller ändra en employer_places-rad.
 *
 * Ledtexten säger det viktigaste: företaget beskriver vad PLATSEN kräver och
 * vad de kan ge — inte vem de söker. Det är konsulenten som matchar, och
 * deltagaren som bestämmer om något delas (AG6, beslut 2026-09-13).
 *
 * Handledningsavsnittet står först bland kraven med flit: hur mycket handledning
 * arbetsplatsen kan ge är det som oftast avgör om en placering fungerar
 * (Mikael, arbetskonsulent, 2026-08-31).
 *
 * Tillgänglighet: Dialog-primitiven (role="dialog", aria-modal, fokusfälla,
 * Esc), varje fält har en <label for>, felet läses upp via role="alert".
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import { Building2 } from '@/components/ui/icons'
import type { PlaceringTyp } from '@/services/placeringarApi'
import type { Plats, PlatsInput, PlatsStatus } from '@/services/foretagApi'
import { FelText } from './Tillstand'
import {
  ETIKETT_KLASS,
  FALT_KLASS,
  HANDLEDNING_LABEL,
  NIVAER,
  NIVA_LABEL,
  PLACERING_TYP_LABEL,
  PLATS_STATUSAR,
  PLATS_STATUS_LABEL,
  TEMPERATURER,
  TEMPERATUR_LABEL,
} from './foretagEtiketter'

interface Props {
  open: boolean
  existing: Plats | null
  onSave: (input: PlatsInput) => Promise<unknown>
  onClose: () => void
}

const TYPER: PlaceringTyp[] = ['praktik', 'arbetstraning', 'arbetsprovning', 'subventionerad_anstallning']

function tomtFormular(): PlatsInput {
  return {
    title: '',
    placement_type: 'praktik',
    description: null,
    status: 'oppen',
    hours_per_week: null,
    schedule_days: null,
    start_from: null,
    address: null,
    lifting_required: null,
    standing_required: null,
    temperature_demands: null,
    noise_level: null,
    pace_level: null,
    shift_work: false,
    physical_notes: null,
    workplace_supervision_capacity: null,
    supervision_notes: null,
    language_requirements: null,
    drivers_license_required: false,
    other_requirements: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    sick_call_phone: null,
    sick_call_instructions: null,
  }
}

function franBefintlig(p: Plats): PlatsInput {
  const { id: _id, org_id: _o, created_by: _c, created_at: _ca, updated_at: _ua, ...rest } = p
  return rest
}

function Rubrik({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300 pt-2">{children}</h3>
}

export function PlatsFormDialog({ open, existing, onSave, onClose }: Props) {
  const [form, setForm] = useState<PlatsInput>(tomtFormular)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<unknown>(null)

  useEffect(() => {
    if (!open) return
    setForm(existing ? franBefintlig(existing) : tomtFormular())
    setFel(null)
    setSparar(false)
  }, [open, existing])

  const satt = <K extends keyof PlatsInput>(falt: K, varde: PlatsInput[K]) =>
    setForm((f) => ({ ...f, [falt]: varde }))
  const text = (falt: keyof PlatsInput) => (e: { target: { value: string } }) =>
    satt(falt, (e.target.value.trim() ? e.target.value : null) as PlatsInput[typeof falt])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setFel(new Error('Ge platsen en rubrik — till exempel "Lagerarbete, förmiddagar".'))
      return
    }
    setSparar(true)
    setFel(null)
    try {
      await onSave({ ...form, title: form.title.trim() })
      onClose()
    } catch (err) {
      setFel(err)
    } finally {
      setSparar(false)
    }
  }

  const treval = (falt: 'lifting_required' | 'standing_required', etikett: string) => (
    <fieldset>
      <legend className={ETIKETT_KLASS}>{etikett}</legend>
      <div className="flex gap-4 text-sm text-stone-800 dark:text-stone-100">
        {([['ja', true], ['nej', false], ['okänt', null]] as const).map(([namn, v]) => (
          <label key={namn} className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              name={falt}
              checked={form[falt] === v}
              onChange={() => satt(falt, v)}
            />
            {namn.charAt(0).toUpperCase() + namn.slice(1)}
          </label>
        ))}
      </div>
    </fieldset>
  )

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      labelledBy="plats-dialog-titel"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-3">
          <Building2 className="h-6 w-6 text-[var(--c-text)] mt-0.5" aria-hidden="true" />
          <div>
            <h2 id="plats-dialog-titel" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {existing ? 'Ändra platsen' : 'Lägg till en plats'}
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-0.5">
              Ni fyller i vad platsen kräver och vad ni kan ge — inte vem ni söker.
            </p>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4" noValidate>
        <div>
          <label htmlFor="plats-title" className={ETIKETT_KLASS}>Rubrik *</label>
          <input
            id="plats-title"
            type="text"
            required
            aria-required="true"
            value={form.title}
            onChange={(e) => satt('title', e.target.value)}
            placeholder="T.ex. Lagerarbete, förmiddagar"
            className={FALT_KLASS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="plats-typ" className={ETIKETT_KLASS}>Insatstyp *</label>
            <select id="plats-typ" value={form.placement_type} onChange={(e) => satt('placement_type', e.target.value as PlaceringTyp)} className={FALT_KLASS}>
              {TYPER.map((t) => <option key={t} value={t}>{PLACERING_TYP_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="plats-status" className={ETIKETT_KLASS}>Status</label>
            <select id="plats-status" value={form.status ?? 'oppen'} onChange={(e) => satt('status', e.target.value as PlatsStatus)} className={FALT_KLASS}>
              {PLATS_STATUSAR.map((s) => <option key={s} value={s}>{PLATS_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="plats-description" className={ETIKETT_KLASS}>Vad gör man på platsen?</label>
          <textarea id="plats-description" rows={3} value={form.description ?? ''} onChange={text('description')} className={`${FALT_KLASS} resize-none`} placeholder="Arbetsuppgifter, en vanlig dag, vilka man jobbar med." />
        </div>

        <Rubrik>Omfattning och tider</Rubrik>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="plats-hours" className={ETIKETT_KLASS}>Timmar per vecka</label>
            <input id="plats-hours" type="number" min={0} max={60} step={0.5} value={form.hours_per_week ?? ''} onChange={(e) => satt('hours_per_week', e.target.value === '' ? null : Number(e.target.value))} className={FALT_KLASS} />
          </div>
          <div>
            <label htmlFor="plats-days" className={ETIKETT_KLASS}>Dagar och tider</label>
            <input id="plats-days" type="text" value={form.schedule_days ?? ''} onChange={text('schedule_days')} placeholder="T.ex. mån–ons 8–12" className={FALT_KLASS} />
          </div>
          <div>
            <label htmlFor="plats-start" className={ETIKETT_KLASS}>Kan börja från</label>
            <input id="plats-start" type="date" value={form.start_from ?? ''} onChange={text('start_from')} className={FALT_KLASS} />
          </div>
        </div>
        <div>
          <label htmlFor="plats-address" className={ETIKETT_KLASS}>Adress</label>
          <input id="plats-address" type="text" value={form.address ?? ''} onChange={text('address')} className={FALT_KLASS} />
        </div>

        <Rubrik>Handledning — det som oftast avgör</Rubrik>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Hur mycket handledning ni kan ge är det som oftast avgör om en placering fungerar. Var ärliga — konsulenten matchar mot det.
        </p>
        <div>
          <label htmlFor="plats-supervision" className={ETIKETT_KLASS}>Handledning ni kan ge</label>
          <select id="plats-supervision" value={form.workplace_supervision_capacity ?? ''} onChange={(e) => satt('workplace_supervision_capacity', (e.target.value || null) as PlatsInput['workplace_supervision_capacity'])} className={FALT_KLASS}>
            <option value="">Inte angivet</option>
            {NIVAER.map((n) => <option key={n} value={n}>{HANDLEDNING_LABEL[n]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="plats-supervision-notes" className={ETIKETT_KLASS}>Mer om handledningen</label>
          <textarea id="plats-supervision-notes" rows={2} value={form.supervision_notes ?? ''} onChange={text('supervision_notes')} className={`${FALT_KLASS} resize-none`} placeholder="Vem handleder, hur ofta, vad händer om hen är borta?" />
        </div>

        <Rubrik>Fysiska krav och tempo</Rubrik>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {treval('lifting_required', 'Tunga lyft')}
          {treval('standing_required', 'Stående arbete')}
          <div>
            <label htmlFor="plats-temp" className={ETIKETT_KLASS}>Temperatur</label>
            <select id="plats-temp" value={form.temperature_demands ?? ''} onChange={(e) => satt('temperature_demands', (e.target.value || null) as PlatsInput['temperature_demands'])} className={FALT_KLASS}>
              <option value="">Inte angivet</option>
              {TEMPERATURER.map((t) => <option key={t} value={t}>{TEMPERATUR_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="plats-noise" className={ETIKETT_KLASS}>Buller</label>
            <select id="plats-noise" value={form.noise_level ?? ''} onChange={(e) => satt('noise_level', (e.target.value || null) as PlatsInput['noise_level'])} className={FALT_KLASS}>
              <option value="">Inte angivet</option>
              {NIVAER.map((n) => <option key={n} value={n}>{NIVA_LABEL[n]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="plats-pace" className={ETIKETT_KLASS}>Tempo</label>
            <select id="plats-pace" value={form.pace_level ?? ''} onChange={(e) => satt('pace_level', (e.target.value || null) as PlatsInput['pace_level'])} className={FALT_KLASS}>
              <option value="">Inte angivet</option>
              {NIVAER.map((n) => <option key={n} value={n}>{NIVA_LABEL[n]}</option>)}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-800 dark:text-stone-100 self-end pb-2.5">
            <input type="checkbox" checked={!!form.shift_work} onChange={(e) => satt('shift_work', e.target.checked)} />
            Skiftarbete
          </label>
        </div>
        <div>
          <label htmlFor="plats-physical" className={ETIKETT_KLASS}>Anteckning om fysiska krav</label>
          <textarea id="plats-physical" rows={2} value={form.physical_notes ?? ''} onChange={text('physical_notes')} className={`${FALT_KLASS} resize-none`} />
        </div>

        <Rubrik>Språk, körkort och övrigt</Rubrik>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="plats-language" className={ETIKETT_KLASS}>Språkkrav</label>
            <input id="plats-language" type="text" value={form.language_requirements ?? ''} onChange={text('language_requirements')} placeholder="T.ex. förstår instruktioner på svenska" className={FALT_KLASS} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-stone-800 dark:text-stone-100 self-end pb-2.5">
            <input type="checkbox" checked={!!form.drivers_license_required} onChange={(e) => satt('drivers_license_required', e.target.checked)} />
            Körkort krävs
          </label>
        </div>
        <div>
          <label htmlFor="plats-other" className={ETIKETT_KLASS}>Övrigt</label>
          <textarea id="plats-other" rows={2} value={form.other_requirements ?? ''} onChange={text('other_requirements')} className={`${FALT_KLASS} resize-none`} placeholder="Arbetskläder, hygienregler, vad ni gärna vill veta i förväg." />
        </div>

        <Rubrik>Kontaktperson på platsen</Rubrik>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="plats-contact-name" className={ETIKETT_KLASS}>Namn</label>
            <input id="plats-contact-name" type="text" value={form.contact_name ?? ''} onChange={text('contact_name')} className={FALT_KLASS} />
          </div>
          <div>
            <label htmlFor="plats-contact-phone" className={ETIKETT_KLASS}>Telefon</label>
            <input id="plats-contact-phone" type="tel" value={form.contact_phone ?? ''} onChange={text('contact_phone')} className={FALT_KLASS} />
          </div>
          <div>
            <label htmlFor="plats-contact-email" className={ETIKETT_KLASS}>E-post</label>
            <input id="plats-contact-email" type="email" value={form.contact_email ?? ''} onChange={text('contact_email')} className={FALT_KLASS} />
          </div>
        </div>

        <Rubrik>Sjukanmälan</Rubrik>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="plats-sick-phone" className={ETIKETT_KLASS}>Telefon för sjukanmälan</label>
            <input id="plats-sick-phone" type="tel" value={form.sick_call_phone ?? ''} onChange={text('sick_call_phone')} className={FALT_KLASS} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="plats-sick-instructions" className={ETIKETT_KLASS}>Hur gör man?</label>
            <input id="plats-sick-instructions" type="text" value={form.sick_call_instructions ?? ''} onChange={text('sick_call_instructions')} placeholder="T.ex. ring före 07.00, sms räcker inte" className={FALT_KLASS} />
          </div>
        </div>

        <FelText fel={fel} />

        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={sparar}>Avbryt</Button>
          <Button type="submit" isLoading={sparar} loadingText="Sparar…">
            {existing ? 'Spara ändringarna' : 'Lägg till platsen'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
