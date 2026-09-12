/**
 * SvarDialog — företagets svar på ett förslag: "Vi vill gå vidare" eller
 * "Tacka nej", med ett valfritt meddelande. Meddelandet ses bara av
 * konsulenten (employer_message + notis), aldrig av deltagaren — det står i
 * dialogen, inte bara i koden.
 *
 * Skrivningen går genom foretagApi.svara → vyn employer_proposals → triggern,
 * som nekar ett andra svar efter ett nej ("Förslaget är redan besvarat").
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import type { Forslag } from '@/services/foretagApi'
import { fulltNamn } from '@/services/foretagApi'
import { FelText } from './Tillstand'
import { ETIKETT_KLASS, FALT_KLASS } from './foretagEtiketter'

interface Props {
  open: boolean
  forslag: Forslag | null
  svar: 'interested' | 'declined'
  onSvara: (id: string, svar: 'interested' | 'declined', meddelande: string) => Promise<unknown>
  onClose: () => void
}

export function SvarDialog({ open, forslag, svar, onSvara, onClose }: Props) {
  const [meddelande, setMeddelande] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<unknown>(null)

  useEffect(() => {
    if (!open) return
    setMeddelande('')
    setFel(null)
    setSparar(false)
  }, [open, forslag?.id])

  if (!forslag) return null
  const namn = fulltNamn(forslag.participant_first_name, forslag.participant_last_name) || 'personen'
  const konsulent = fulltNamn(forslag.consultant_first_name, forslag.consultant_last_name) || 'konsulenten'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSparar(true)
    setFel(null)
    try {
      await onSvara(forslag.id, svar, meddelande)
      onClose()
    } catch (err) {
      setFel(err)
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      labelledBy="svar-dialog-titel"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b border-stone-200 dark:border-stone-700">
        <div>
          <h2 id="svar-dialog-titel" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {svar === 'interested' ? `Gå vidare med ${namn}` : `Tacka nej till förslaget om ${namn}`}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-0.5">
            {svar === 'interested'
              ? `${konsulent} får besked och hör av sig till er om nästa steg.`
              : `${konsulent} får besked. Personen ser inte ert svar.`}
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label htmlFor="svar-meddelande" className={ETIKETT_KLASS}>
            Meddelande till {konsulent} (valfritt)
          </label>
          <textarea
            id="svar-meddelande"
            rows={4}
            maxLength={2000}
            value={meddelande}
            onChange={(e) => setMeddelande(e.target.value)}
            className={`${FALT_KLASS} resize-none`}
            placeholder={svar === 'interested' ? 'T.ex. när ni kan ta ett första möte.' : 'T.ex. varför det inte passar just nu — det hjälper konsulenten nästa gång.'}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Meddelandet ses bara av konsulenten, inte av {namn}.</p>
        </div>
        <FelText fel={fel} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={sparar}>Avbryt</Button>
          <Button type="submit" variant={svar === 'interested' ? 'primary' : 'secondary'} isLoading={sparar} loadingText="Skickar…">
            {svar === 'interested' ? 'Skicka: vi vill gå vidare' : 'Skicka: vi tackar nej'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
