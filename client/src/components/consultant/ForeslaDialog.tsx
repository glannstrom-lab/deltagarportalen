/* eslint-disable react-refresh/only-export-components -- legitim samexistens av komponent + konstant-export (etiketter delas med tester och syskonkomponenter) */
/**
 * ForeslaDialog — konsulenten föreslår deltagaren för företaget (AG5/AG8).
 *
 * Förslagsraden ÄR samtycket: det som skapas här är en FRÅGA till
 * deltagaren, inte en delning. Varje show_*-flagga är opt-in (DEFAULT false
 * i tabellen, avbockad här) — konsulenten kryssar bara i det hon tänker
 * föreslå, deltagaren ser exakt de fälten och texten innan hon svarar, och
 * företaget ser ingenting förrän svaret är ja (vyn employer_proposals
 * filtrerar på status=accepted).
 *
 * Inga dokument i etapp 1: show_documents finns i tabellen men ingen filväg
 * finns i vyn, så kryssrutan finns inte här. Lägg inte till den utan en väg
 * som faktiskt levererar filen.
 *
 * Ingen AI. Presentationstexten skrivs av konsulenten. Det står i dialogen
 * med flit — AG4: inget AI-resultat om en person når ett företag, och ingen
 * rangordning eller kandidatlista finns någonstans i det här flödet.
 */

import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import { AlertCircle, Share2 } from '@/components/ui/icons'
import type { Placering } from '@/services/placeringarApi'
import {
  delningsforslagApi,
  DELNINGSFALT,
  type DelningsFalt,
  type Delningsforslag,
} from '@/services/delningsforslagApi'

interface Props {
  open: boolean
  placering: Placering
  deltagarNamn: string
  onClose: () => void
  /** Anropas när förslaget är skapat (status pending) — anroparen laddar om listan. */
  onSkapad: (forslag: Delningsforslag) => void
}

export const DELNINGSFALT_ETIKETT: Record<keyof DelningsFalt, { rubrik: string; beskrivning: string }> = {
  show_contact: { rubrik: 'Kontaktuppgifter', beskrivning: 'E-post, telefon och ort.' },
  show_summary: { rubrik: 'Egen sammanfattning ur CV', beskrivning: 'Deltagarens egen text — aldrig en AI-sammanfattning.' },
  show_skills: { rubrik: 'Kompetenser', beskrivning: 'Kompetenslistan från profilen.' },
  show_experience: { rubrik: 'Arbetslivserfarenhet', beskrivning: 'Arbetslivserfarenheten ur CV:t.' },
  show_education: { rubrik: 'Utbildning', beskrivning: 'Utbildningarna ur CV:t.' },
}

export const STANDARD_GILTIGHET_DAGAR = 14

/** Supabase kastar ett PostgrestError-objekt (inte Error) — databasens svenska text ska ändå fram. */
function felText(e: unknown, reserv: string): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    const m = (e as { message: string }).message.trim()
    if (m) return m
  }
  return reserv
}

function tommaFalt(): DelningsFalt {
  return { show_contact: false, show_summary: false, show_skills: false, show_experience: false, show_education: false }
}

function datumOmDagar(dagar: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dagar)
  return d.toISOString().slice(0, 10)
}

export function ForeslaDialog({ open, placering, deltagarNamn, onClose, onSkapad }: Props) {
  const [falt, setFalt] = useState<DelningsFalt>(tommaFalt)
  const [text, setText] = useState('')
  const [gallerTill, setGallerTill] = useState(() => datumOmDagar(STANDARD_GILTIGHET_DAGAR))
  const [maxVisningar, setMaxVisningar] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFalt(tommaFalt())
      setText('')
      setGallerTill(datumOmDagar(STANDARD_GILTIGHET_DAGAR))
      setMaxVisningar('')
      setError(null)
      setSaving(false)
    }
  }, [open, placering.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!placering.company_account_id) {
      setError('Platsen saknar företagskonto — bjud in företaget först.')
      return
    }
    const max = maxVisningar.trim() ? Number(maxVisningar) : null
    if (max !== null && (!Number.isInteger(max) || max <= 0)) {
      setError('Max antal visningar ska vara ett heltal större än noll, eller tomt.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const skapad = await delningsforslagApi.skapa({
        placement_id: placering.id,
        participant_id: placering.participant_id,
        ...falt,
        presentation_text: text.trim() || null,
        expires_at: gallerTill ? new Date(`${gallerTill}T23:59:59`).toISOString() : null,
        max_views: max,
      })
      onSkapad(skapad)
      onClose()
    } catch (err) {
      setError(felText(err, 'Kunde inte skapa förslaget'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      labelledBy="foresla-title"
      className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Share2 size={16} className="text-stone-700" />
          <h2 id="foresla-title" className="font-semibold text-stone-900">
            Föreslå {deltagarNamn} för {placering.company_name}
          </h2>
        </div>
        <CloseButton onClick={onClose} aria-label="Stäng" />
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <p className="text-sm text-stone-700 p-3 rounded-lg bg-stone-50 border border-stone-200">
          Deltagaren får frågan och bestämmer. Företaget ser inget förrän hon sagt ja, och bara det hon kryssat
          ja till.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-stone-600 mb-1">Vad ska föreslås att dela?</legend>
          {DELNINGSFALT.map((key) => (
            <label
              key={key}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-stone-200 text-sm cursor-pointer hover:bg-stone-50"
            >
              <input
                type="checkbox"
                checked={falt[key]}
                onChange={(e) => setFalt((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-stone-700"
              />
              <span>
                <strong className="block text-stone-900">{DELNINGSFALT_ETIKETT[key].rubrik}</strong>
                <span className="text-xs text-stone-600">{DELNINGSFALT_ETIKETT[key].beskrivning}</span>
              </span>
            </label>
          ))}
          <p className="text-[11px] text-stone-500">
            Dokument (CV-fil, intyg) kan inte delas den här vägen i den här etappen.
          </p>
        </fieldset>

        <label className="block">
          <span className="block text-xs font-medium text-stone-600 mb-1">Din presentation av {deltagarNamn}</span>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Varför passar den här personen för just den här platsen?"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          />
          <span className="block mt-1 text-[11px] text-stone-500">
            Du skriver texten själv — AI används inte här. Deltagaren läser texten innan hon svarar, och kan tacka nej.
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">Gäller till</span>
            <input
              type="date"
              value={gallerTill}
              onChange={(e) => setGallerTill(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            />
            <span className="block mt-1 text-[11px] text-stone-500">Standard {STANDARD_GILTIGHET_DAGAR} dagar. Därefter kan deltagaren inte längre svara.</span>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-stone-600 mb-1">Max antal visningar (valfritt)</span>
            <input
              type="number"
              min={1}
              step={1}
              value={maxVisningar}
              onChange={(e) => setMaxVisningar(e.target.value)}
              placeholder="Obegränsat"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
          <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Avbryt
          </Button>
          <Button type="submit" size="sm" variant="primary" isLoading={saving}>
            Skicka frågan till {deltagarNamn}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
