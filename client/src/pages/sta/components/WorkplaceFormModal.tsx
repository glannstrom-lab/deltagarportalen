/**
 * WorkplaceFormModal — skapa eller redigera en sta_workplaces-rad.
 *
 * Används av konsulent från drawerns "Arbetsplatser"-sektion och från
 * den standalone "Arbetsplatser"-tabben.
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, CloseButton } from '@/components/ui/Button'
import { Building2, AlertCircle } from '@/components/ui/icons'
import type { StaWorkplace } from '@/services/staApi'

interface Props {
  open: boolean
  existing: StaWorkplace | null
  onSave: (input: Partial<StaWorkplace> & { company_name: string }) => Promise<unknown>
  onClose: () => void
}

const EMPTY: Partial<StaWorkplace> & { company_name: string } = {
  company_name: '',
  org_number: null,
  contact_name: null,
  contact_phone: null,
  contact_email: null,
  address: null,
  start_date: null,
  end_date: null,
  weeks_planned: null,
  inriktning: null,
  notes: null,
}

export function WorkplaceFormModal({ open, existing, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Partial<StaWorkplace> & { company_name: string }>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setDraft({ ...existing })
    } else {
      setDraft(EMPTY)
    }
  }, [existing, open])

  if (!open) return null

  const update = <K extends keyof StaWorkplace>(key: K, value: StaWorkplace[K] | null) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wp-title"
    >
      <Card
        data-domain="action"
        variant="flat"
        padding="none"
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} style={{ color: 'var(--c-text)' }} />
            <h2 id="wp-title" className="font-semibold text-stone-900">
              {existing ? 'Redigera arbetsplats' : 'Ny arbetsplats'}
            </h2>
          </div>
          <CloseButton onClick={onClose} aria-label="Stäng" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
            <Field label="Organisationsnummer">
              <input
                type="text"
                value={draft.org_number ?? ''}
                onChange={(e) => update('org_number', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                placeholder="556789-1234"
              />
            </Field>
            <Field label="Inriktning">
              <select
                value={draft.inriktning ?? ''}
                onChange={(e) =>
                  update('inriktning', (e.target.value || null) as 'aktiverande' | 'introducerande' | null)
                }
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
              >
                <option value="">Ej satt</option>
                <option value="aktiverande">Aktiverande (Del 3)</option>
                <option value="introducerande">Introducerande (Del 4)</option>
              </select>
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
            <Field label="Veckor planerat">
              <input
                type="number"
                min={1}
                max={26}
                value={draft.weeks_planned ?? ''}
                onChange={(e) => update('weeks_planned', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Field>
          </div>

          <Field label="Anteckningar">
            <textarea
              rows={3}
              value={draft.notes ?? ''}
              onChange={(e) => update('notes', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              placeholder="Mål, anpassningar, kontaktinfo..."
            />
          </Field>
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
            {existing ? 'Spara ändringar' : 'Skapa arbetsplats'}
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
