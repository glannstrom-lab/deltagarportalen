import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { staEnrollmentsApi, type StaPart as ApiStaPart } from '@/services/staApi'
import { derivePartTimeline } from '../enrollmentDisplay'
import { type StaParticipantRow, type JobinLinkSuggestion } from '../mockData'
import { Sparkles, Search, Send, Link as LinkIcon, Unlink, AlertTriangle, Mail, X, UserPlus } from '@/components/ui/icons'

// ===========================================================================
// ADD PARTICIPANT MODAL
// ===========================================================================

export function AddParticipantModal({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const { profile } = useAuthStore()
  const [mode, setMode] = useState<'manual' | 'invite'>('manual')
  const [fullName, setFullName] = useState('')
  const [personalId, setPersonalId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [includesPart2, setIncludesPart2] = useState<boolean>(true)
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
      // Härled aktuell del från startdatum + Del 2-toggle. Konsulent som behöver
      // starta direkt i Del 3/4 går via EditEnrollmentModal efter skapande.
      const timeline = derivePartTimeline(startedAt, includesPart2)
      await staEnrollmentsApi.create({
        consultant_id: profile.id,
        started_at: startedAt,
        part_started_at: timeline.partStartedAt.toISOString().slice(0, 10),
        current_part: timeline.currentPart as ApiStaPart,
        includes_part_2: includesPart2,
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
            <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-stone-200 hover:bg-stone-50">
              <input
                type="checkbox"
                checked={includesPart2}
                onChange={(e) => setIncludesPart2(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-stone-700"
              />
              <span className="text-sm text-stone-800">
                <strong className="block">Inkluderar Del 2 — Prova på</strong>
                <span className="text-xs text-stone-600">
                  Kartläggning i konstruerad miljö (5 v). Avmarkera om deltagaren går direkt från
                  Del 1 till arbetsprövning. Del räknas ut automatiskt från startdatumet.
                </span>
              </span>
            </label>
            <p className="text-[11px] text-stone-500 mt-2">
              Behöver du börja direkt i Del 3 eller 4 — skapa först och flytta sedan via "Ändra deltagare".
            </p>
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

export function LinkParticipantModal({
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

