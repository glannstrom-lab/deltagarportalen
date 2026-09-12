/**
 * BjudInForetagDialog — konsulenten bjuder in företagets kontaktperson till
 * ett företagskonto (AG6, migration 20260913100000 §9).
 *
 * Vad som händer vid "Skicka": INSERT i vyn `employer_invitations`. Triggern
 * hittar eller skapar företagskontot på org.nr, sätter placeringens
 * company_account_id (om konsulenten äger placeringen) och skapar inbjudan.
 * Därefter mejlet via send-invite-email. Allt via
 * `placeringarApi.bjudInForetag` — se kommentaren där om varför ett
 * misslyckat mejl KASTAS i stället för att tystas.
 *
 * Databasens fel visas rakt av: demokontot får "Demokontot kan inte bjuda
 * in. Personerna i demot är påhittade." (42501), och det ska stå så i rutan.
 *
 * Fälten förifylls från platsen (org_number, company_name, contact_email,
 * contact_name) — konsulenten kan ändra dem innan hon skickar.
 */

import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import { AlertCircle, CheckCircle, Mail } from '@/components/ui/icons'
import { placeringarApi, type ForetagsInbjudan, type Placering } from '@/services/placeringarApi'

interface Props {
  open: boolean
  placering: Placering
  onClose: () => void
  /** Anropas efter lyckad inbjudan — anroparen laddar om platserna (company_account_id är satt). */
  onSuccess: (inbjudan: ForetagsInbjudan) => void
}

interface Formular {
  org_number: string
  company_name: string
  email: string
  contact_name: string
}

function forifyllt(p: Placering): Formular {
  return {
    org_number: p.org_number ?? '',
    company_name: p.company_name,
    email: p.contact_email ?? '',
    contact_name: p.contact_name ?? '',
  }
}

export function BjudInForetagDialog({ open, placering, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Formular>(() => forifyllt(placering))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultat, setResultat] = useState<ForetagsInbjudan | null>(null)

  useEffect(() => {
    if (open) {
      setForm(forifyllt(placering))
      setError(null)
      setResultat(null)
      setSaving(false)
    }
  }, [open, placering])

  const update = (key: keyof Formular, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.org_number.trim() || !form.company_name.trim() || !form.email.trim()) {
      setError('Organisationsnummer, företagsnamn och e-post krävs')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const inbjudan = await placeringarApi.bjudInForetag({
        org_number: form.org_number,
        company_name: form.company_name,
        email: form.email,
        contact_name: form.contact_name,
        placement_id: placering.id,
      })
      setResultat(inbjudan)
      onSuccess(inbjudan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skicka inbjudan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      labelledBy="bjud-in-foretag-title"
      className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-stone-700" />
          <h2 id="bjud-in-foretag-title" className="font-semibold text-stone-900">
            Bjud in företaget
          </h2>
        </div>
        <CloseButton onClick={onClose} aria-label="Stäng" />
      </div>

      {resultat ? (
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2 text-emerald-800">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              {resultat.existing_account ? (
                <>
                  <strong className="block">{resultat.email} hade redan ett konto</strong>
                  Personen är nu kopplad till företagskontot för {resultat.company_name ?? form.company_name} och har fått ett
                  mejl om att logga in.
                </>
              ) : (
                <>
                  <strong className="block">Inbjudan skickad till {resultat.email}</strong>
                  När personen skapar sitt konto blir hon kontaktperson för {resultat.company_name ?? form.company_name}.
                  Inbjudan gäller i 14 dagar.
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Platsen är nu kopplad till företagskontot. Företaget ser ingenting om deltagaren förrän hon själv
            sagt ja till ett förslag.
          </p>
          <div className="flex justify-end">
            <Button size="sm" variant="primary" onClick={onClose}>
              Stäng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-stone-600">
            Kontaktpersonen får ett mejl med en länk för att skapa ett företagskonto. Kontot kopplas till platsen
            hos {placering.company_name}. Företaget ser aldrig deltagaren förrän hon själv sagt ja till ett förslag.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Falt label="Organisationsnummer *">
              <input
                type="text"
                value={form.org_number}
                onChange={(e) => update('org_number', e.target.value)}
                placeholder="556677-8899"
                inputMode="numeric"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Falt>
            <Falt label="Företagsnamn *">
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => update('company_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Falt>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Falt label="Kontaktpersonens namn">
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => update('contact_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Falt>
            <Falt label="Kontaktpersonens e-post *">
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </Falt>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={saving}>
              Avbryt
            </Button>
            <Button type="submit" size="sm" variant="primary" isLoading={saving}>
              Skicka inbjudan
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

function Falt({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
