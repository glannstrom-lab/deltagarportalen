/**
 * BjudInKollegaDialog — bjuder in en kollega till företagskontot (e-post +
 * namn). Databasens svenska felmeddelanden (demokonto, redan medlem,
 * personalkonto) visas rakt av; ett mejlfel likaså — inbjudan finns då men
 * personen fick inget.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, CloseButton } from '@/components/ui/Button'
import type { ForetagsInbjudan } from '@/services/foretagApi'
import { FelText } from './Tillstand'
import { ETIKETT_KLASS, FALT_KLASS } from './foretagEtiketter'

interface Props {
  open: boolean
  onBjudIn: (email: string, namn: string) => Promise<ForetagsInbjudan>
  onClose: () => void
}

export function BjudInKollegaDialog({ open, onBjudIn, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [namn, setNamn] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<unknown>(null)
  const [klar, setKlar] = useState<ForetagsInbjudan | null>(null)

  useEffect(() => {
    if (!open) return
    setEmail('')
    setNamn('')
    setFel(null)
    setKlar(null)
    setSparar(false)
  }, [open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSparar(true)
    setFel(null)
    try {
      setKlar(await onBjudIn(email, namn))
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
      labelledBy="bjudin-dialog-titel"
      className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b border-stone-200 dark:border-stone-700">
        <div>
          <h2 id="bjudin-dialog-titel" className="text-xl font-bold text-stone-900 dark:text-stone-100">Bjud in en kollega</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-0.5">Kollegan får ett mejl och ser samma sak som ni.</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      {klar ? (
        <div className="p-5 space-y-4">
          <p role="status" className="text-stone-800 dark:text-stone-100">
            {klar.existing_account
              ? `${klar.email} hade redan ett konto och är nu med i företagskontot. Ett mejl säger till hen att logga in.`
              : `Inbjudan är skickad till ${klar.email}. Länken gäller i 14 dagar.`}
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Stäng</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          <div>
            <label htmlFor="bjudin-email" className={ETIKETT_KLASS}>E-post *</label>
            <input id="bjudin-email" type="email" required aria-required="true" value={email} onChange={(e) => setEmail(e.target.value)} className={FALT_KLASS} placeholder="kollega@foretaget.se" />
          </div>
          <div>
            <label htmlFor="bjudin-namn" className={ETIKETT_KLASS}>Namn</label>
            <input id="bjudin-namn" type="text" value={namn} onChange={(e) => setNamn(e.target.value)} className={FALT_KLASS} placeholder="Förnamn Efternamn" />
          </div>
          <FelText fel={fel} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={sparar}>Avbryt</Button>
            <Button type="submit" isLoading={sparar} loadingText="Skickar…" disabled={!email.trim()}>Skicka inbjudan</Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
