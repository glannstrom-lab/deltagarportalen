/**
 * AvstamningDialog — företagets avstämning vid vecka 12 eller 24 av en
 * pågående placering (employer_checkins). Tre frågor: vad går bra, vad
 * oroar, vill ni fortsätta. Konsulenten får en notis från databasen.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import type { AvstamningInput, AvstamningVecka, FortsattIntresse, PagaendePlacering } from '@/services/foretagApi'
import { fulltNamn } from '@/services/foretagApi'
import { FelText } from './Tillstand'
import { ETIKETT_KLASS, FALT_KLASS, FORTSATT_INTRESSE_LABEL } from './foretagEtiketter'

interface Props {
  open: boolean
  placering: PagaendePlacering | null
  /** Förvald milstolpe — den som ligger närmast i tid. */
  vecka?: AvstamningVecka
  onSpara: (input: AvstamningInput) => Promise<unknown>
  onClose: () => void
}

const VECKOR: AvstamningVecka[] = [12, 24]
const INTRESSEN: FortsattIntresse[] = ['ja', 'kanske', 'nej']

export function AvstamningDialog({ open, placering, vecka = 12, onSpara, onClose }: Props) {
  const [milstolpe, setMilstolpe] = useState<AvstamningVecka>(vecka)
  const [garBra, setGarBra] = useState('')
  const [oro, setOro] = useState('')
  const [intresse, setIntresse] = useState<FortsattIntresse | ''>('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<unknown>(null)

  useEffect(() => {
    if (!open) return
    setMilstolpe(vecka)
    setGarBra('')
    setOro('')
    setIntresse('')
    setFel(null)
    setSparar(false)
  }, [open, vecka, placering?.id])

  if (!placering) return null
  const namn = fulltNamn(placering.participant_first_name, placering.participant_last_name) || 'personen'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!garBra.trim() && !oro.trim() && !intresse) {
      setFel(new Error('Skriv åtminstone en rad, eller välj om ni vill fortsätta.'))
      return
    }
    setSparar(true)
    setFel(null)
    try {
      await onSpara({
        placement_id: placering.id,
        org_id: placering.org_id,
        milestone_week: milstolpe,
        going_well: garBra,
        concerns: oro,
        continue_interest: intresse || null,
      })
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
      labelledBy="avstamning-dialog-titel"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b border-stone-200 dark:border-stone-700">
        <div>
          <h2 id="avstamning-dialog-titel" className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Avstämning om {namn}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-0.5">
            Går till konsulenten. Korta svar räcker.
          </p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
        <fieldset>
          <legend className={ETIKETT_KLASS}>Vilken avstämning?</legend>
          <div className="flex gap-4 text-sm text-stone-800 dark:text-stone-100">
            {VECKOR.map((v) => (
              <label key={v} className="inline-flex items-center gap-1.5">
                <input type="radio" name="milstolpe" checked={milstolpe === v} onChange={() => setMilstolpe(v)} />
                Vecka {v}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="avstamning-bra" className={ETIKETT_KLASS}>Vad går bra?</label>
          <textarea id="avstamning-bra" rows={3} value={garBra} onChange={(e) => setGarBra(e.target.value)} className={`${FALT_KLASS} resize-none`} />
        </div>
        <div>
          <label htmlFor="avstamning-oro" className={ETIKETT_KLASS}>Finns det något som oroar?</label>
          <textarea id="avstamning-oro" rows={3} value={oro} onChange={(e) => setOro(e.target.value)} className={`${FALT_KLASS} resize-none`} />
        </div>
        <div>
          <label htmlFor="avstamning-intresse" className={ETIKETT_KLASS}>Vill ni fortsätta?</label>
          <select id="avstamning-intresse" value={intresse} onChange={(e) => setIntresse(e.target.value as FortsattIntresse | '')} className={FALT_KLASS}>
            <option value="">Inte bestämt än</option>
            {INTRESSEN.map((i) => <option key={i} value={i}>{FORTSATT_INTRESSE_LABEL[i]}</option>)}
          </select>
        </div>
        <FelText fel={fel} />
        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={sparar}>Avbryt</Button>
          <Button type="submit" isLoading={sparar} loadingText="Skickar…">Skicka avstämningen</Button>
        </div>
      </form>
    </Dialog>
  )
}
