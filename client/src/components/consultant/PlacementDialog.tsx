/**
 * PlacementDialog
 *
 * Registrerar en riktig placering (deltagare fått jobb) i
 * `consultant_placements` via `consultantService.recordPlacement()`.
 *
 * AG3/KS1 (2026-08-31): den här dialogen är den FÖRSTA anroparen av
 * `recordPlacement()` — funktionen fanns och var testad, men prod hade 0
 * rader i `consultant_placements`. Analysvyns KPI "placeringsgrad" räknade
 * i stället andelen deltagare med status COMPLETED, som konsulenten sätter
 * manuellt för flytt, byte av konsulent OCH avhopp — inte bara riktiga
 * placeringar. Se AnalyticsTab.tsx för rättelsen av det kortet.
 *
 * WCAG 2.1.2 (ingen tangentbordsfälla): role="dialog", aria-modal, Esc och
 * fokusfälla via den etablerade `useFocusTrap`-hooken (13 andra modaler i
 * kodbasen använder redan den). De två grannmodalerna i den här mappen,
 * GoalCreationDialog och MeetingSchedulerDialog, saknar allt detta helt
 * (post KT1) — den här dialogen ska vara förebilden, inte upprepa felet.
 */

import { useState, useEffect } from 'react'
import {
  X,
  Search,
  User,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Loader2,
  Check,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils'
import { consultantService } from '@/services/consultantService'

interface Participant {
  participant_id: string
  first_name: string
  last_name: string
  email: string
}

interface PlacementDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Hoppar över deltagarsökningen — dialogen öppnas direkt på formuläret. */
  preselectedParticipant?: Participant
}

const PLACEMENT_TYPES: { value: 'permanent' | 'temp' | 'trial'; label: string }[] = [
  { value: 'permanent', label: 'Tillsvidareanställning' },
  { value: 'temp', label: 'Tidsbegränsad anställning' },
  { value: 'trial', label: 'Provanställning' },
]

const today = () => new Date().toISOString().slice(0, 10)

export function PlacementDialog({
  isOpen,
  onClose,
  onSuccess,
  preselectedParticipant,
}: PlacementDialogProps) {
  const [step, setStep] = useState<'participant' | 'form'>('participant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(
    preselectedParticipant || null
  )

  const [employerName, setEmployerName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [placementType, setPlacementType] = useState<'permanent' | 'temp' | 'trial'>('permanent')
  const [salaryRange, setSalaryRange] = useState('')
  const [notes, setNotes] = useState('')

  // Fokusfälla + Escape/utanförklick stänger (WCAG 2.1.2)
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, { onEscape: onClose })

  useEffect(() => {
    if (!isOpen) return
    if (preselectedParticipant) {
      setSelectedParticipant(preselectedParticipant)
      setStep('form')
    } else {
      setStep('participant')
      fetchParticipants()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preselectedParticipant])

  const fetchParticipants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('consultant_dashboard_participants')
        .select('participant_id, first_name, last_name, email')
        .eq('consultant_id', user.id)

      if (data) setParticipants(data)
    } catch (err) {
      console.error('[PlacementDialog] kunde inte hämta deltagare:', err)
    }
  }

  const resetForm = () => {
    setStep(preselectedParticipant ? 'form' : 'participant')
    setSelectedParticipant(preselectedParticipant || null)
    setEmployerName('')
    setJobTitle('')
    setStartDate(today())
    setPlacementType('permanent')
    setSalaryRange('')
    setNotes('')
    setSearchQuery('')
    setError(null)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const handleSubmit = async () => {
    if (!selectedParticipant) return
    if (!employerName.trim()) {
      setError('Ange arbetsgivarens namn.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await consultantService.recordPlacement({
        participant_id: selectedParticipant.participant_id,
        employer_name: employerName.trim(),
        job_title: jobTitle.trim() || undefined,
        start_date: startDate || undefined,
        salary_range: salaryRange.trim() || undefined,
        notes: notes.trim() || undefined,
        placement_type: placementType,
        followup_3m: false,
        followup_6m: false,
      })
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[PlacementDialog] kunde inte spara placeringen:', err)
      setError('Placeringen kunde inte sparas just nu. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const filteredParticipants = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="placement-dialog-title"
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 id="placement-dialog-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Registrera placering
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-600 mt-0.5">
              {step === 'participant' ? 'Välj deltagare' : 'Vem, var och när'}
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Stäng"
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 'participant' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" aria-hidden="true" />
                <label htmlFor="placement-search" className="sr-only">Sök deltagare</label>
                <input
                  id="placement-search"
                  type="text"
                  placeholder="Sök deltagare..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-[var(--c-solid)]',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredParticipants.length === 0 && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 px-1 py-4 text-center">
                    Inga deltagare hittades.
                  </p>
                )}
                {filteredParticipants.map(p => (
                  <button
                    key={p.participant_id}
                    onClick={() => {
                      setSelectedParticipant(p)
                      setStep('form')
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left',
                      'hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center text-[var(--c-text)] font-medium">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-600 truncate">
                        {p.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'form' && selectedParticipant && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 rounded-xl">
                <User className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
                <span className="font-medium text-stone-900 dark:text-stone-100">
                  {selectedParticipant.first_name} {selectedParticipant.last_name}
                </span>
                {!preselectedParticipant && (
                  <button
                    onClick={() => setStep('participant')}
                    className="ml-auto text-sm text-[var(--c-text)] hover:underline"
                  >
                    Ändra
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="placement-employer" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Arbetsgivare *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" aria-hidden="true" />
                  <input
                    id="placement-employer"
                    type="text"
                    required
                    aria-required="true"
                    value={employerName}
                    onChange={e => setEmployerName(e.target.value)}
                    placeholder="T.ex. Volvo Group"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl',
                      'bg-stone-100 dark:bg-stone-800',
                      'border-2 border-transparent focus:border-[var(--c-solid)]',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="placement-title" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Titel
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" aria-hidden="true" />
                  <input
                    id="placement-title"
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="T.ex. Lagerarbetare"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-xl',
                      'bg-stone-100 dark:bg-stone-800',
                      'border-2 border-transparent focus:border-[var(--c-solid)]',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="placement-start" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Startdatum
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
                    <input
                      id="placement-start"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className={cn(
                        'w-full pl-9 pr-3 py-2.5 rounded-xl',
                        'bg-stone-100 dark:bg-stone-800',
                        'border-2 border-transparent focus:border-[var(--c-solid)]',
                        'text-stone-900 dark:text-stone-100'
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="placement-type" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Anställningstyp
                  </label>
                  <select
                    id="placement-type"
                    value={placementType}
                    onChange={e => setPlacementType(e.target.value as typeof placementType)}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl',
                      'bg-stone-100 dark:bg-stone-800',
                      'border-2 border-transparent focus:border-[var(--c-solid)]',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  >
                    {PLACEMENT_TYPES.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="placement-salary" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Lönespann (valfritt)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" aria-hidden="true" />
                  <input
                    id="placement-salary"
                    type="text"
                    value={salaryRange}
                    onChange={e => setSalaryRange(e.target.value)}
                    placeholder="T.ex. 28 000–32 000 kr/mån"
                    className={cn(
                      'w-full pl-9 pr-3 py-2.5 rounded-xl',
                      'bg-stone-100 dark:bg-stone-800',
                      'border-2 border-transparent focus:border-[var(--c-solid)]',
                      'text-stone-900 dark:text-stone-100'
                    )}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="placement-notes" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Anteckning (valfritt)
                </label>
                <textarea
                  id="placement-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Hur gick det till? Något att komma ihåg inför uppföljningen?"
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl resize-none',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-[var(--c-solid)]',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'form' && selectedParticipant && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
            <Button variant="outline" onClick={handleClose}>Avbryt</Button>
            <Button onClick={handleSubmit} disabled={loading || !employerName.trim()}>
              {loading
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                : <Check className="w-4 h-4 mr-2" aria-hidden="true" />}
              Spara placering
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlacementDialog
