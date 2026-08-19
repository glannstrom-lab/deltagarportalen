/**
 * DocumentSelector — välj vilket CV och vilket personligt brev som hör till
 * en ansökan.
 *
 * Genomgång 2026-08-19. Filen var oöversatt (tolv hårdkodade svenska strängar
 * och tre `'sv-SE'`), dess två `<label>` pekade på ingenting — och kunde inte
 * peka på något, eftersom kontrollen är en `<button>` och inte ett fält —
 * och `error` från `useDocuments` kastades bort, så ett hämtningsfel såg ut
 * som "Inga CV-versioner sparade". Länken till brevverktyget byggde dessutom
 * `/cover-letter&title=…` när företagsnamn saknades, alltså en trasig URL.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  FileText, Plus, ChevronDown, X, AlertCircle
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useDocuments } from '@/hooks/useDocuments'

interface DocumentSelectorProps {
  selectedCVId?: string | null
  selectedCoverLetterId?: string | null
  onSelectCV: (id: string | null) => void
  onSelectCoverLetter: (id: string | null) => void
  companyName?: string
  jobTitle?: string
}

/**
 * Bygger länken till brevverktyget med korrekt frågesträng. Tidigare
 * konkatenerades `?company=` och `&title=` var för sig, så utan företagsnamn
 * blev det `/cover-letter&title=…` — en väg som inte finns.
 */
function brevlank(companyName?: string, jobTitle?: string): string {
  const params = new URLSearchParams()
  if (companyName) params.set('company', companyName)
  if (jobTitle) params.set('title', jobTitle)
  const fraga = params.toString()
  return fraga ? `/cover-letter?${fraga}` : '/cover-letter'
}

export function DocumentSelector({
  selectedCVId,
  selectedCoverLetterId,
  onSelectCV,
  onSelectCoverLetter,
  companyName,
  jobTitle
}: DocumentSelectorProps) {
  const { t, i18n } = useTranslation()
  const { cvVersions, coverLetters, isLoading, error } = useDocuments()
  const [showCVDropdown, setShowCVDropdown] = useState(false)
  const [showLetterDropdown, setShowLetterDropdown] = useState(false)

  const selectedCV = cvVersions.find(cv => cv.id === selectedCVId)
  const selectedLetter = coverLetters.find(l => l.id === selectedCoverLetterId)

  const sprak = i18n.language === 'en' ? 'en-US' : 'sv-SE'
  const datum = (iso: string) => new Date(iso).toLocaleDateString(sprak)

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <span className="sr-only">
          {t('applications.documents.loading', 'Hämtar dina CV och brev…')}
        </span>
        <div className="h-12 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-lg" />
        <div className="h-12 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-lg" />
      </div>
    )
  }

  // Ett fel är inte samma sak som "du har inga dokument". Sägs det inte högt
  // väljer personen bort en bilaga hen faktiskt har sparad.
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20">
        <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-amber-900 dark:text-amber-200">
          {t('applications.documents.loadError', 'Vi kunde inte hämta dina CV och brev just nu. Du kan spara ansökan ändå och koppla dokumenten senare.')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── CV ──────────────────────────────────────────────────────── */}
      <div>
        <span id="dokument-cv-rubrik" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          {t('applications.documents.cvLabel', 'Vilket CV skickade du?')}
        </span>

        {selectedCV ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-[var(--c-bg)] border border-[var(--c-accent)]/60 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-[var(--c-text)] flex-shrink-0" aria-hidden="true" />
              <span className="font-medium text-[var(--c-text)] truncate">{selectedCV.name}</span>
              <span className="text-xs text-[var(--c-text)] flex-shrink-0">
                {datum(selectedCV.created_at)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectCV(null)}
              aria-label={t('applications.documents.removeCv', 'Ta bort det valda CV:t')}
              className="p-1 hover:bg-[var(--c-accent)]/40 rounded flex-shrink-0"
            >
              <X className="w-4 h-4 text-[var(--c-text)]" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCVDropdown(!showCVDropdown)}
              aria-labelledby="dokument-cv-rubrik"
              aria-expanded={showCVDropdown}
              aria-haspopup="listbox"
              className="w-full flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <span className="text-stone-700 dark:text-stone-300">
                {t('applications.documents.chooseCv', 'Välj ett CV')}
              </span>
              <ChevronDown
                className={cn('w-4 h-4 text-stone-600 dark:text-stone-400 transition-transform', showCVDropdown && 'rotate-180')}
                aria-hidden="true"
              />
            </button>

            {showCVDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCVDropdown(false)} />
                <div
                  role="listbox"
                  aria-labelledby="dokument-cv-rubrik"
                  className="absolute z-20 w-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {cvVersions.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-stone-700 dark:text-stone-300 mb-2">
                        {t('applications.documents.noCvs', 'Du har inget sparat CV än.')}
                      </p>
                      <Link
                        to="/cv"
                        className="text-sm text-[var(--c-text)] font-medium hover:underline"
                      >
                        {t('applications.documents.createCv', 'Skapa ditt första CV')}
                      </Link>
                    </div>
                  ) : (
                    cvVersions.map(cv => (
                      <button
                        key={cv.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          onSelectCV(cv.id)
                          setShowCVDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 p-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-left border-b border-stone-100 dark:border-stone-800 last:border-0"
                      >
                        <FileText className="w-4 h-4 text-stone-600 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{cv.name}</p>
                          <p className="text-xs text-stone-700 dark:text-stone-400">{datum(cv.created_at)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {cvVersions.length > 0 && !selectedCV && (
          <Link
            to="/cv"
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--c-text)] hover:underline"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            {t('applications.documents.newCvVersion', 'Skapa en ny version av ditt CV')}
          </Link>
        )}
      </div>

      {/* ── Personligt brev ─────────────────────────────────────────── */}
      <div>
        <span id="dokument-brev-rubrik" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
          {t('applications.documents.letterLabel', 'Vilket brev skickade du?')}
        </span>

        {selectedLetter ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-[var(--c-bg)] border border-[var(--c-accent)]/60 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-[var(--c-text)] flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span className="font-medium text-[var(--c-text)]">
                  {selectedLetter.title
                    || selectedLetter.company_name
                    || t('applications.documents.untitledLetter', 'Brev utan namn')}
                </span>
                {selectedLetter.job_title && (
                  <span className="text-xs text-[var(--c-text)] ml-2">
                    ({selectedLetter.job_title})
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectCoverLetter(null)}
              aria-label={t('applications.documents.removeLetter', 'Ta bort det valda brevet')}
              className="p-1 hover:bg-[var(--c-accent)]/40 rounded flex-shrink-0"
            >
              <X className="w-4 h-4 text-[var(--c-text)]" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLetterDropdown(!showLetterDropdown)}
              aria-labelledby="dokument-brev-rubrik"
              aria-expanded={showLetterDropdown}
              aria-haspopup="listbox"
              className="w-full flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <span className="text-stone-700 dark:text-stone-300">
                {t('applications.documents.chooseLetter', 'Välj ett personligt brev')}
              </span>
              <ChevronDown
                className={cn('w-4 h-4 text-stone-600 dark:text-stone-400 transition-transform', showLetterDropdown && 'rotate-180')}
                aria-hidden="true"
              />
            </button>

            {showLetterDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLetterDropdown(false)} />
                <div
                  role="listbox"
                  aria-labelledby="dokument-brev-rubrik"
                  className="absolute z-20 w-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {coverLetters.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-stone-700 dark:text-stone-300 mb-2">
                        {t('applications.documents.noLetters', 'Du har inget sparat brev än.')}
                      </p>
                      <Link
                        to={brevlank(companyName, jobTitle)}
                        className="text-sm text-[var(--c-text)] font-medium hover:underline"
                      >
                        {t('applications.documents.createLetter', 'Skriv ditt första brev')}
                      </Link>
                    </div>
                  ) : (
                    coverLetters.map(letter => (
                      <button
                        key={letter.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          onSelectCoverLetter(letter.id)
                          setShowLetterDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 p-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-left border-b border-stone-100 dark:border-stone-800 last:border-0"
                      >
                        <FileText className="w-4 h-4 text-stone-600 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                            {letter.title
                              || letter.company_name
                              || t('applications.documents.untitledLetter', 'Brev utan namn')}
                          </p>
                          <p className="text-xs text-stone-700 dark:text-stone-400">
                            {letter.job_title && `${letter.job_title} • `}
                            {datum(letter.created_at)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {coverLetters.length > 0 && !selectedLetter && (
          <Link
            to={brevlank(companyName, jobTitle)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--c-text)] hover:underline"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            {t('applications.documents.newLetter', 'Skriv ett nytt brev för den här ansökan')}
          </Link>
        )}
      </div>
    </div>
  )
}

export default DocumentSelector
