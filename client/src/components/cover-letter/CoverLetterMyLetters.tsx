/**
 * Cover Letter My Letters Tab
 * Lista över alla sparade personliga brev
 *
 * TRE SAKER SOM ÄR MEDVETNA — bygg inte bort dem:
 *
 * 1. **Tre lägen vid inladdning: laddar / fel / tomt.** `coverLetterApi.getAll()`
 *    KASTAR via `handleError` i stället för att returnera `[]`, så ett
 *    hämtningsfel visas som ett fel och inte som "du har inga brev". Sväljer
 *    man felet här blir en trasig uppkoppling till ett påstående om
 *    användaren. Vaktat av testet "ett hämtningsfel visas som fel".
 *
 * 2. **Listfel och åtgärdsfel är INTE samma sak.** Ett fel när man raderar
 *    eller laddar ner ersatte tidigare hela listan med felskärmen — allt
 *    innehåll försvann och fokus föll till `body`. Åtgärdsfel går därför till
 *    en toast (`showToast.error`, egen aria-live-region); bara listfel byter ut
 *    listan.
 *
 * 3. **Ingen påhittad status.** Kolumnen `status` finns inte i
 *    `cover_letters`-tabellen i prod. Fram till 2026-08-19 hårdkodades
 *    `status: 'draft'` i `transformLetter`, vilket gav varje brev en gul
 *    "Utkast"-bricka och en "Skicka"-knapp som pekade på en route som inte
 *    finns (`/cover-letter/applications` → `*`-fallbacken kastar tillbaka till
 *    Skriv-fliken). Fälten `sent`/`template` var dödkod. Inför inte status
 *    igen utan en kolumn bakom.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Search,
  Calendar,
  Building2,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Download,
  ClipboardCheck,
  Loader2
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/Toast'
import { coverLetterApi } from '@/services/coverLetterApi'
import type { CoverLetter } from '@/services/supabaseApi'
import { useProfileStore } from '@/stores/profileStore'
import { generateCoverLetterPDF, downloadPDF } from '@/services/pdfExportService'

interface Letter {
  id: string
  title: string
  company: string
  jobTitle: string
  content: string
  template: string
  createdAt: string
  updatedAt: string
  wordCount: number
}

/**
 * Transform API data to UI format.
 *
 * `namnlost` skickas in eftersom funktionen ligger utanför komponenten och
 * inte har någon `t`. Fallbacken var tidigare `"Företag - Position"` — två
 * påhittade ord som såg ut som brevets riktiga rubrik. Saknas både företag
 * och jobbtitel säger vi i stället att brevet är namnlöst.
 */
function transformLetter(apiLetter: CoverLetter, namnlost: string): Letter {
  const content = apiLetter.content || ''
  const wordCount = content.split(/\s+/).filter(Boolean).length

  return {
    id: apiLetter.id,
    title: apiLetter.title?.trim()
      || [apiLetter.company, apiLetter.job_title].map(v => v?.trim()).filter(Boolean).join(' – ')
      || namnlost,
    company: apiLetter.company || '',
    jobTitle: apiLetter.job_title || '',
    content: content,
    template: apiLetter.template || 'professional',
    createdAt: apiLetter.created_at,
    updatedAt: apiLetter.updated_at,
    wordCount,
  }
}

export function CoverLetterMyLetters() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const { profile, loadProfile } = useProfileStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  /**
   * Timern som nollställer "Kopierat!"-markeringen. Den låg tidigare som en naken
   * `window.setTimeout` utan uppstädning: lämnar man sidan inom två sekunder efter en
   * kopiering anropas `setCopiedId` på en avmonterad komponent. I testsviten syns det som
   * `ReferenceError: window is not defined` EFTER att miljön rivits — ett fel som fäller
   * hela körningen men pekar på en annan fil än den som orsakat det, och som bara dyker
   * upp ibland eftersom det är en kapplöpning mot rivningen.
   */
  const kopieratTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (kopieratTimer.current !== null) window.clearTimeout(kopieratTimer.current)
    }
  }, [])

  // Load profile data if not already loaded
  useEffect(() => {
    if (!profile) {
      loadProfile()
    }
  }, [profile, loadProfile])

  // Close dropdown on Escape key or click outside
  useEffect(() => {
    if (!showActions) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowActions(null)
        // Return focus to the trigger button
        const buttonRef = menuButtonRefs.current.get(showActions)
        buttonRef?.focus()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowActions(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])

  // Load letters from API
  const loadLetters = useCallback(async () => {
    try {
      setLoading(true)
      setListError(null)
      const apiLetters = await coverLetterApi.getAll()
      setLetters(apiLetters.map(l => transformLetter(l, t('coverLetter.write.untitledLetter'))))
    } catch (err) {
      // Fel får INTE bli en tom lista — se filhuvudet, punkt 1.
      console.error('Failed to load cover letters:', err)
      setListError(err instanceof Error ? err.message : t('coverLetter.myLetters.loadFailed', 'Vi kunde inte hämta dina brev just nu.'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadLetters()
  }, [loadLetters])

  const filteredLetters = letters.filter(letter =>
    letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDuplicate = async (letter: Letter) => {
    try {
      setActionLoading(letter.id)
      setShowActions(null)

      // Get original letter data from API
      const original = await coverLetterApi.getById(letter.id)
      if (!original) {
        throw new Error(t('coverLetter.myLetters.originalMissing', 'Vi hittade inte originalbrevet.'))
      }

      // Kopian ska se ut som originalet. `template` glömdes bort här fram till
      // 2026-08-19 — kolumnen är satt på 5 av 5 brev i prod, så varje kopia
      // föll tillbaka på "professional" och fick fel utseende i PDF:en.
      await coverLetterApi.create({
        title: t('coverLetter.myLetters.copySuffix', '{{title}} (kopia)', { title: original.title }),
        content: original.content,
        company: original.company,
        job_title: original.job_title,
        job_ad: original.job_ad,
        template: original.template,
        ai_generated: original.ai_generated
      })

      // Reload letters
      await loadLetters()
      showToast.success(t('coverLetter.myLetters.duplicated', 'Kopian är sparad.'))
    } catch (err) {
      // Åtgärdsfel byter inte ut listan — se filhuvudet, punkt 2.
      console.error('Failed to duplicate letter:', err)
      showToast.error(t('coverLetter.myLetters.duplicateFailed', 'Vi kunde inte kopiera brevet just nu. Försök igen om en stund.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (letter: Letter) => {
    setShowActions(null)

    // Bekräftelsen namnger brevet. `window.confirm` namngav ingenting, gick
    // förbi projektets dialog och lämnade ingen återkoppling efteråt.
    const confirmed = await confirm({
      title: t('coverLetter.myLetters.deleteTitle', 'Ta bort brevet?'),
      message: t('coverLetter.myLetters.deleteMessage', '"{{title}}" tas bort från portalen. Har du laddat ner det som PDF ligger den filen kvar på din dator.', { title: letter.title }),
      confirmText: t('common.delete', 'Ta bort'),
      cancelText: t('common.cancel', 'Avbryt'),
      variant: 'warning',
    })
    if (!confirmed) return

    try {
      setActionLoading(letter.id)
      await coverLetterApi.delete(letter.id)
      setLetters(prev => prev.filter(l => l.id !== letter.id))
      showToast.success(t('coverLetter.myLetters.deleted', 'Brevet är borttaget.'))
    } catch (err) {
      console.error('Failed to delete letter:', err)
      showToast.error(t('coverLetter.couldNotDelete'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = async (letter: Letter) => {
    try {
      setShowActions(null)
      setActionLoading(letter.id)

      // KAPPLÖPNINGEN: `profileStore` persistar inte `profile` (partialize),
      // så den är null vid varje sidladdning medan den här knappen redan går
      // att klicka. Väntar vi inte in profilen får brevet inget avsändarnamn.
      // Går hämtningen fel utelämnas raderna — de gissas aldrig.
      let sender = profile
      if (!sender) {
        await loadProfile()
        sender = useProfileStore.getState().profile
      }

      // Generate professional PDF with user's profile data and template
      const pdfBlob = await generateCoverLetterPDF({
        content: letter.content,
        company: letter.company,
        jobTitle: letter.jobTitle,
        createdAt: letter.createdAt,
        template: letter.template,
        // User info from profile
        firstName: sender?.first_name,
        lastName: sender?.last_name,
        email: sender?.email,
        phone: sender?.phone,
        location: sender?.location,
      })

      // Create filename
      const fileName = `Personligt_brev_${letter.company || 'ansökan'}_${letter.jobTitle || ''}`
        .replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/_$/, '')
        + '.pdf'

      downloadPDF(pdfBlob, fileName)
    } catch (err) {
      console.error('Failed to download letter:', err)
      showToast.error(t('coverLetter.myLetters.downloadFailed', 'Vi kunde inte skapa PDF:en just nu. Försök igen om en stund.'))
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Att kopiera texten är den väg som FAKTISKT fungerar när man vill återanvända
   * ett brev. Knappen "Redigera" fanns här till 2026-08-19 och gjorde inte det
   * den hette: den navigerade till `/cover-letter?edit=<id>`, men skrivvyn läser
   * aldrig `edit` — den öppnade en tom wizard, och sparade man därifrån anropades
   * `create()`, alltså en dubblett. `coverLetterApi.update()` har noll
   * produktionsanropare. Sätt inte tillbaka knappen förrän skrivvyn läser
   * `edit`-parametern OCH anropar `update()`.
   */
  const handleCopyText = async (letter: Letter) => {
    setShowActions(null)
    try {
      await navigator.clipboard.writeText(letter.content)
      setCopiedId(letter.id)
      showToast.success(t('coverLetter.myLetters.copied', 'Texten är kopierad. Klistra in den där du vill fortsätta.'))
      if (kopieratTimer.current !== null) window.clearTimeout(kopieratTimer.current)
      kopieratTimer.current = window.setTimeout(() => {
        kopieratTimer.current = null
        setCopiedId(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy letter text:', err)
      showToast.error(t('coverLetter.myLetters.copyFailed', 'Vi kunde inte kopiera texten. Markera den i brevet och kopiera manuellt.'))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
        <span className="ml-3 text-stone-600 dark:text-stone-400">
          {t('coverLetter.myLetters.loading', 'Hämtar dina brev...')}
        </span>
      </div>
    )
  }

  // Error state — bara LISTfel hamnar här. Åtgärdsfel går till en toast.
  if (listError) {
    return (
      <div className="text-center py-12" role="alert" aria-live="assertive">
        <p className="text-rose-600 dark:text-rose-400 mb-4">{listError}</p>
        <Button onClick={loadLetters} variant="outline">
          {t('common.tryAgain', 'Försök igen')}
        </Button>
      </div>
    )
  }

  // Empty state
  if (letters.length === 0) {
    return (
      <EmptyState
        illustration="jobb"
        title={t('coverLetter.myLetters.emptyTitle', 'Dina personliga brev samlas här')}
        description={t('coverLetter.myLetters.emptyDescription', 'Ett personligt brev är din chans att visa vem du är – bortom vad som står i CV:t. Skriv, spara och återanvänd brev för olika ansökningar.')}
        action={{
          // EN CTA (DESIGN.md §7). Det fanns två här, och båda gick till samma
          // route — det andra valet var alltså inget val.
          label: t('coverLetter.myLetters.emptyAction', 'Skriv ditt första brev'),
          // UX35: var /dashboard/cover-letter → omdirigerades till Översikt.
          onClick: () => navigate('/cover-letter'),
        }}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header med sök */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between sm:items-center">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <label htmlFor="letter-search" className="sr-only">
            {t('coverLetter.myLetters.searchLabel', 'Sök bland dina brev')}
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
          <input
            id="letter-search"
            type="search"
            placeholder={t('coverLetter.myLetters.searchPlaceholder', 'Sök bland dina brev...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-solid)]/20 outline-none transition-all text-base sm:text-sm"
          />
        </div>
        {filteredLetters.length > 0 && (
          <div className="text-sm text-stone-600 dark:text-stone-400" role="status" aria-live="polite">
            {t('coverLetter.myLetters.count', {
              count: filteredLetters.length,
              defaultValue: '{{count}} brev',
            })}
          </div>
        )}
      </div>

      {/* Tomt sökresultat — "0 brev" som rubrik är förbjudet (DESIGN.md §7). */}
      {filteredLetters.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('coverLetter.myLetters.noMatchTitle', 'Inget brev matchade sökningen')}
          description={t('coverLetter.myLetters.noMatchDescription', 'Prova ett annat ord — vi söker på brevets namn och på företaget.')}
          action={{
            label: t('coverLetter.myLetters.clearSearch', 'Visa alla brev igen'),
            onClick: () => setSearchQuery(''),
          }}
        />
      ) : (
      /* Lista över brev */
      <div className="grid gap-4">
        {filteredLetters.map((letter) => (
          <Card
            key={letter.id}
            className="p-4 sm:p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50 hover:shadow-md transition-shadow group"
          >
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              {/* Header row on mobile: Icon + Title */}
              <div className="flex items-start gap-3 sm:contents">
                {/* Ikon — hubbens färg. Sidan låg tidigare i emerald/amber/blue
                    samtidigt, mitt på en persikasida (DESIGN.md §4). */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-solid)]">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Title on mobile */}
                <div className="flex-1 min-w-0 sm:hidden">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm line-clamp-2">
                    {letter.title}
                  </h3>
                </div>
              </div>

              {/* Innehåll */}
              <div className="flex-1 min-w-0">
                {/* Desktop title row */}
                <div className="hidden sm:block">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
                    {letter.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-stone-600 dark:text-stone-400">
                    {letter.company && (
                      <>
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {letter.company}
                        </span>
                        <span aria-hidden="true">•</span>
                      </>
                    )}
                    <span>{letter.wordCount} {t('diary.words', 'ord')}</span>
                  </div>
                </div>

                {/* Mobile company & word count */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400 sm:hidden">
                  {letter.company && (
                    <>
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {letter.company}
                      </span>
                      <span aria-hidden="true">•</span>
                    </>
                  )}
                  <span>{letter.wordCount} {t('diary.words', 'ord')}</span>
                </div>

                {/* Metadata — dark:text-stone-500 gav 3,65:1 mot stone-900.
                    stone-400 mäter 6,93:1 och klarar WCAG 2.1 AA. */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span className="sr-only">{t('coverLetter.myLetters.createdLabel', 'Skapat')}</span>
                    {formatDate(letter.createdAt)}
                  </span>
                  {letter.updatedAt !== letter.createdAt && (
                    <span className="flex items-center gap-1">
                      <Edit3 size={12} />
                      <span className="sr-only">{t('coverLetter.myLetters.updatedLabel', 'Ändrat')}</span>
                      {formatDate(letter.updatedAt)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-100 dark:border-stone-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(letter)}
                    disabled={actionLoading === letter.id}
                    className="gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    {actionLoading === letter.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    <span>{t('coverLetter.write.downloadPDF', 'Ladda ner PDF')}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyText(letter)}
                    className="gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    {copiedId === letter.id ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                    <span>{t('coverLetter.write.copyText', 'Kopiera text')}</span>
                  </Button>

                  <div className="relative sm:ml-auto" ref={showActions === letter.id ? dropdownRef : undefined}>
                    <Button
                      ref={(el) => {
                        if (el) menuButtonRefs.current.set(letter.id, el)
                      }}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActions(showActions === letter.id ? null : letter.id)}
                      aria-expanded={showActions === letter.id}
                      aria-haspopup="menu"
                      aria-controls={`letter-menu-${letter.id}`}
                      className="gap-1.5"
                    >
                      <MoreVertical size={14} />
                      <span className="hidden sm:inline">{t('common.more', 'Mer')}</span>
                      <span className="sr-only">
                        {t('coverLetter.myLetters.moreFor', 'Fler alternativ för {{title}}', { title: letter.title })}
                      </span>
                    </Button>

                    {showActions === letter.id && (
                      <div
                        id={`letter-menu-${letter.id}`}
                        role="menu"
                        aria-label={t('coverLetter.myLetters.menuFor', 'Alternativ för {{title}}', { title: letter.title })}
                        className="absolute right-0 top-full mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 min-w-[180px] z-10"
                      >
                        <button
                          role="menuitem"
                          onClick={() => handleDuplicate(letter)}
                          disabled={actionLoading === letter.id}
                          className="w-full px-3 py-2.5 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 focus:bg-stone-50 dark:focus:bg-stone-700 focus:outline-none flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === letter.id ? (
                            <Loader2 size={14} className="text-stone-600 dark:text-stone-400 animate-spin" />
                          ) : (
                            <Copy size={14} className="text-stone-600 dark:text-stone-400" />
                          )}
                          {t('coverLetter.myLetters.duplicate', 'Gör en kopia')}
                        </button>
                        <hr className="my-1 border-stone-100 dark:border-stone-700" aria-hidden="true" />
                        <button
                          role="menuitem"
                          onClick={() => handleDelete(letter)}
                          disabled={actionLoading === letter.id}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 focus:bg-stone-50 dark:focus:bg-stone-700 focus:outline-none flex items-center gap-2 text-rose-600 dark:text-rose-400 disabled:opacity-50"
                        >
                          {actionLoading === letter.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          {t('common.delete', 'Ta bort')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
