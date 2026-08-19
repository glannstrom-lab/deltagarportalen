/**
 * "Ladda upp CV" — sparar ett färdigt CV precis som det är.
 *
 * Ingen AI, ingen tolkning, ingen omvandling till fält. Filen läggs i den
 * privata bucketen `profile-documents` och listas bland Dina sparade CV, där
 * den går att ladda ner igen i original.
 *
 * Skillnaden mot `CVImportModal` (på Skapa CV) är hela poängen: den gör om
 * filen till redigerbara fält, den här behåller den. Den som redan har ett CV
 * hen är nöjd med ska inte behöva göra om jobbet i byggaren för att få in det
 * i portalen — och ska inte heller riskera att en AI-tolkning ändrar något.
 *
 * Att det inte finns något AI-anrop är också varför den här vägen alltid
 * fungerar: importen begränsas av att Vercel-funktionen dör vid 60 s, den här
 * av ingenting mer än filstorleken.
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, Loader2, X, Check, AlertCircle
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cvFilerApi } from '@/services/cvApi'
import { showToast } from '@/components/Toast'
import { ACCEPTERADE_FILTYPER, MAX_FILSTORLEK } from '@/services/cvFileImport'

interface CVFileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  /** Anropas när filen sparats, så listan kan laddas om. */
  onSaved: () => void
}

type Steg = 'val' | 'namnge' | 'sparar' | 'fel'

/** Läsbar filstorlek. `1,4 MB` säger mer än `1468006`. */
function storlek(byte: number): string {
  if (byte < 1024) return `${byte} B`
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} kB`
  return `${(byte / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

export function CVFileUploadModal({ isOpen, onClose, onSaved }: CVFileUploadModalProps) {
  const { t } = useTranslation()
  const [steg, setSteg] = useState<Steg>('val')
  const [fil, setFil] = useState<File | null>(null)
  const [namn, setNamn] = useState('')
  const [felmeddelande, setFelmeddelande] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const stang = useCallback(() => {
    if (steg === 'sparar') return
    setSteg('val'); setFil(null); setNamn(''); setFelmeddelande('')
    onClose()
  }, [onClose, steg])

  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: stang,
    restoreFocus: true,
    autoFocus: true,
  })

  const valjFil = (vald: File) => {
    const andelse = vald.name.slice(vald.name.lastIndexOf('.')).toLowerCase()

    if (vald.size > MAX_FILSTORLEK) {
      setFelmeddelande(t('cv.fileUpload.errors.tooLarge', 'Filen är större än 10 MB. Spara om den i mindre storlek och försök igen.'))
      setSteg('fel')
      return
    }
    if (andelse === '.doc') {
      // Vi TAR emot .doc i lagringen, men säger ifrån ändå: en arbetsgivare
      // som får en .doc kan ha samma problem att öppna den som vi.
      setFelmeddelande(t('cv.fileUpload.errors.oldWord', 'Formatet .doc är gammalt och alla arbetsgivare kan inte öppna det. Öppna filen i Word och välj "Spara som" och sedan PDF, så är du säker.'))
      setSteg('fel')
      return
    }
    if (!['.pdf', '.docx'].includes(andelse)) {
      setFelmeddelande(t('cv.fileUpload.errors.format', 'Vi tar emot PDF och Word (.docx). Spara om filen i något av de formaten.'))
      setSteg('fel')
      return
    }

    setFil(vald)
    // Filnamnet utan ändelse är nästan alltid ett bättre förslag än något vi
    // hittar på — personen har redan döpt sin fil.
    setNamn(vald.name.replace(/\.[^.]+$/, '').slice(0, 60))
    setFelmeddelande('')
    setSteg('namnge')
  }

  const spara = async () => {
    if (!fil || !namn.trim() || steg === 'sparar') return
    setSteg('sparar')
    try {
      await cvFilerApi.upload(fil, namn.trim())
      showToast.success(t('cv.fileUpload.saved', 'CV:t är sparat. Du hittar det bland dina sparade CV.'))
      onSaved()
      setSteg('val'); setFil(null); setNamn('')
      onClose()
    } catch (e) {
      console.error('Kunde inte spara uppladdat CV:', e)
      setFelmeddelande(t('cv.fileUpload.errors.saveFailed', 'Filen gick inte att spara just nu. Kontrollera din uppkoppling och försök igen om en stund.'))
      setSteg('fel')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-filuppladdning-rubrik"
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="cv-filuppladdning-rubrik" className="font-semibold text-stone-900 dark:text-stone-100">
                {t('cv.fileUpload.title', 'Ladda upp ett CV du redan har')}
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 truncate">
                {fil ? `${fil.name} · ${storlek(fil.size)}` : t('cv.fileUpload.subtitle', 'Sparas precis som den är')}
              </p>
            </div>
          </div>
          <button
            onClick={stang}
            disabled={steg === 'sparar'}
            className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg disabled:opacity-50"
            aria-label={t('common.close', 'Stäng')}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {steg === 'val' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) valjFil(f)
                }}
                className={cn(
                  'rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                  dragOver ? 'border-[var(--c-solid)] bg-[var(--c-bg)]' : 'border-stone-300 dark:border-stone-600'
                )}
              >
                <FileText className="w-10 h-10 mx-auto text-stone-400 mb-3" aria-hidden="true" />
                <p className="text-stone-700 dark:text-stone-300 mb-1">
                  {t('cv.fileUpload.dropHere', 'Dra hit ditt CV, eller välj det från datorn.')}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                  {t('cv.upload.formats', 'PDF eller Word (.docx), max 10 MB.')}
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110 transition"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  {t('cv.upload.choose', 'Välj fil')}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTERADE_FILTYPER}
                  className="sr-only"
                  aria-label={t('cv.upload.choose', 'Välj fil')}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) valjFil(f)
                    e.target.value = ''
                  }}
                />
              </div>

              <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-4">
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  {t('cv.fileUpload.aboutTitle', 'Vad som händer med filen')}
                </h3>
                <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1.5">
                  <li>{t('cv.fileUpload.about1', 'Filen sparas oförändrad och bara du kommer åt den.')}</li>
                  <li>{t('cv.fileUpload.about2', 'Ingen AI läser den. Ingenting tolkas eller skrivs om.')}</li>
                  <li>{t('cv.fileUpload.about3', 'Du kan ladda ner den igen i original, eller ta bort den när du vill.')}</li>
                </ul>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-400">
                {t('cv.fileUpload.orImport', 'Vill du i stället att vi fyller i CV-byggarens fält från filen?')}{' '}
                <Link to="/cv" onClick={stang} className="text-[var(--c-text)] font-medium hover:underline">
                  {t('cv.fileUpload.orImportLink', 'Importera den under Skapa CV')}
                </Link>
              </p>
            </div>
          )}

          {steg === 'namnge' && fil && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
                <FileText className="w-8 h-8 text-[var(--c-text)] flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{fil.name}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">{storlek(fil.size)}</p>
                </div>
              </div>

              <div>
                <label htmlFor="cv-fil-namn" className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1.5">
                  {t('cv.fileUpload.nameLabel', 'Vad ska CV:t heta i portalen?')}
                </label>
                <input
                  id="cv-fil-namn"
                  type="text"
                  value={namn}
                  maxLength={60}
                  onChange={(e) => setNamn(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5">
                  {t('cv.fileUpload.nameHint', 'Bara för att du ska känna igen det i listan. Filen döps inte om.')}
                </p>
              </div>
            </div>
          )}

          {steg === 'sparar' && (
            <div className="py-12 text-center" role="status" aria-live="polite">
              <Loader2 className="w-10 h-10 mx-auto text-[var(--c-solid)] animate-spin mb-4" aria-hidden="true" />
              <p className="text-stone-800 dark:text-stone-200 font-medium">
                {t('cv.fileUpload.saving', 'Sparar ditt CV…')}
              </p>
            </div>
          )}

          {steg === 'fel' && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              </div>
              <p className="text-stone-800 dark:text-stone-200 mb-6 max-w-md mx-auto">{felmeddelande}</p>
              <button
                onClick={() => { setSteg('val'); setFil(null); setFelmeddelande('') }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                {t('cv.upload.tryAgain', 'Försök med en annan fil')}
              </button>
            </div>
          )}
        </div>

        {steg === 'namnge' && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
            <button
              onClick={() => { setSteg('val'); setFil(null) }}
              className="px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              {t('cv.upload.chooseOther', 'Välj en annan fil')}
            </button>
            <button
              onClick={spara}
              disabled={!namn.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:brightness-110 disabled:opacity-50"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              {t('cv.fileUpload.save', 'Spara bland mina CV')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CVFileUploadModal
