/**
 * Cover Letter My Letters Tab
 * Lista över alla sparade personliga brev
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Send,
  Clock,
  Loader2
} from '@/components/ui/icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { coverLetterApi, type CoverLetter } from '@/services/supabaseApi'
import { useProfileStore } from '@/stores/profileStore'
import { generateCoverLetterPDF, downloadPDF } from '@/services/pdfExportService'

type LetterStatus = 'draft' | 'sent' | 'template'

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
  status: LetterStatus
  sentDate?: string
}

// Transform API data to UI format
function transformLetter(apiLetter: CoverLetter): Letter {
  const content = apiLetter.content || ''
  const wordCount = content.split(/\s+/).filter(Boolean).length

  return {
    id: apiLetter.id,
    title: apiLetter.title || `${apiLetter.company || 'Företag'} - ${apiLetter.job_title || 'Position'}`,
    company: apiLetter.company || '',
    jobTitle: apiLetter.job_title || '',
    content: content,
    template: apiLetter.template || 'professional',
    createdAt: apiLetter.created_at,
    updatedAt: apiLetter.updated_at,
    wordCount,
    status: 'draft', // Could be extended with sent tracking
  }
}

export function CoverLetterMyLetters() {
  const navigate = useNavigate()
  const { profile, loadProfile } = useProfileStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

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
      setError(null)
      const apiLetters = await coverLetterApi.getAll()
      setLetters(apiLetters.map(transformLetter))
    } catch (err) {
      console.error('Failed to load cover letters:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte ladda personliga brev')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLetters()
  }, [loadLetters])

  const filteredLetters = letters.filter(letter =>
    letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (id: string) => {
    navigate(`/dashboard/cover-letter?edit=${id}`)
  }

  const handleDuplicate = async (letter: Letter) => {
    try {
      setActionLoading(letter.id)
      setShowActions(null)

      // Get original letter data from API
      const original = await coverLetterApi.getById(letter.id)
      if (!original) {
        throw new Error('Kunde inte hitta originalbrevet')
      }

      // Create duplicate with modified title
      await coverLetterApi.create({
        title: `${original.title} (kopia)`,
        content: original.content,
        company: original.company,
        job_title: original.job_title,
        job_ad: original.job_ad,
        ai_generated: original.ai_generated
      })

      // Reload letters
      await loadLetters()
    } catch (err) {
      console.error('Failed to duplicate letter:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte duplicera brevet')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta brev?')) {
      return
    }

    try {
      setActionLoading(id)
      setShowActions(null)
      await coverLetterApi.delete(id)
      setLetters(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      console.error('Failed to delete letter:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte ta bort brevet')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = async (letter: Letter) => {
    try {
      setShowActions(null)
      setActionLoading(letter.id)

      // Generate professional PDF with user's profile data and template
      const pdfBlob = await generateCoverLetterPDF({
        content: letter.content,
        company: letter.company,
        jobTitle: letter.jobTitle,
        createdAt: letter.createdAt,
        template: letter.template,
        // User info from profile
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        email: profile?.email,
        phone: profile?.phone,
        location: profile?.location,
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
      setError('Kunde inte ladda ner brevet som PDF')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status: LetterStatus, sentDate?: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <Send size={12} />
            Skickad {sentDate && formatDate(sentDate)}
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock size={12} />
            Utkast
          </span>
        )
      case 'template':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <FileText size={12} />
            Mall
          </span>
        )
    }
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" aria-hidden="true" />
        <span className="ml-3 text-stone-600 dark:text-stone-400">Laddar brev...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12" role="alert" aria-live="assertive">
        <p className="text-rose-600 dark:text-rose-400 mb-4">{error}</p>
        <Button onClick={loadLetters} variant="outline">
          Försök igen
        </Button>
      </div>
    )
  }

  // Empty state
  if (letters.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Dina personliga brev samlas här"
        description="Ett personligt brev är din chans att visa vem du är – bortom vad som står i CV:t. Här kan du skriva, spara och återanvända dina brev för olika ansökningar."
        action={{
          label: 'Skriv mitt första brev',
          onClick: () => navigate('/dashboard/cover-letter'),
        }}
        secondaryAction={{
          label: 'Få hjälp av AI',
          onClick: () => navigate('/dashboard/cover-letter'),
        }}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header med sök */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-between sm:items-center">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <label htmlFor="letter-search" className="sr-only">Sök bland dina brev</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
          <input
            id="letter-search"
            type="search"
            placeholder="Sök bland dina brev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-base sm:text-sm"
          />
        </div>
        <div className="text-sm text-stone-600 dark:text-stone-400">
          {filteredLetters.length} {filteredLetters.length === 1 ? 'brev' : 'brev'}
        </div>
      </div>

      {/* Lista över brev */}
      <div className="grid gap-4">
        {filteredLetters.map((letter) => (
          <Card
            key={letter.id}
            className="p-4 sm:p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/50 hover:shadow-md transition-shadow group"
          >
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              {/* Header row on mobile: Icon + Title + Status */}
              <div className="flex items-start gap-3 sm:contents">
                {/* Ikon */}
                <div className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0',
                  letter.status === 'sent'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                )}>
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Title & status on mobile */}
                <div className="flex-1 min-w-0 sm:hidden">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-sm line-clamp-2">
                    {letter.title}
                  </h3>
                  <div className="mt-1">
                    {getStatusBadge(letter.status, letter.sentDate)}
                  </div>
                </div>
              </div>

              {/* Innehåll */}
              <div className="flex-1 min-w-0">
                {/* Desktop title row */}
                <div className="hidden sm:flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
                      {letter.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-stone-600 dark:text-stone-400">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} />
                        {letter.company}
                      </span>
                      <span>•</span>
                      <span>{letter.wordCount} ord</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(letter.status, letter.sentDate)}
                  </div>
                </div>

                {/* Mobile company & word count */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400 sm:hidden">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {letter.company}
                  </span>
                  <span>•</span>
                  <span>{letter.wordCount} ord</span>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs text-stone-500 dark:text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(letter.createdAt)}
                  </span>
                  {letter.updatedAt !== letter.createdAt && (
                    <span className="flex items-center gap-1">
                      <Edit3 size={12} />
                      {formatDate(letter.updatedAt)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-100 dark:border-stone-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(letter.id)}
                    className="gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    <Edit3 size={14} />
                    <span className="sm:inline">Redigera</span>
                  </Button>

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
                    <span className="sm:inline">PDF</span>
                  </Button>

                  <div className="relative" ref={showActions === letter.id ? dropdownRef : undefined}>
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
                      <MoreVertical size={14} aria-hidden="true" />
                      <span className="hidden sm:inline">Mer</span>
                      <span className="sr-only">Fler alternativ för {letter.title}</span>
                    </Button>

                    {showActions === letter.id && (
                      <div
                        id={`letter-menu-${letter.id}`}
                        role="menu"
                        aria-label={`Alternativ för ${letter.title}`}
                        className="absolute right-0 sm:left-0 top-full mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 min-w-[160px] z-10"
                      >
                        <button
                          role="menuitem"
                          onClick={() => handleDuplicate(letter)}
                          disabled={actionLoading === letter.id}
                          className="w-full px-3 py-2.5 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 focus:bg-stone-50 dark:focus:bg-stone-700 focus:outline-none flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === letter.id ? (
                            <Loader2 size={14} className="text-stone-500 animate-spin" aria-hidden="true" />
                          ) : (
                            <Copy size={14} className="text-stone-500" aria-hidden="true" />
                          )}
                          Duplicera
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => handleDownload(letter)}
                          className="w-full px-3 py-2.5 text-left text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 focus:bg-stone-50 dark:focus:bg-stone-700 focus:outline-none flex items-center gap-2"
                        >
                          <Download size={14} className="text-stone-500" aria-hidden="true" />
                          Ladda ner PDF
                        </button>
                        <hr className="my-1 border-stone-100 dark:border-stone-700" aria-hidden="true" />
                        <button
                          role="menuitem"
                          onClick={() => handleDelete(letter.id)}
                          disabled={actionLoading === letter.id}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 focus:bg-stone-50 dark:focus:bg-stone-700 focus:outline-none flex items-center gap-2 text-rose-600 dark:text-rose-400 disabled:opacity-50"
                        >
                          {actionLoading === letter.id ? (
                            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 size={14} aria-hidden="true" />
                          )}
                          Ta bort
                        </button>
                      </div>
                    )}
                  </div>

                  {letter.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/cover-letter/applications')}
                      className="gap-1.5 flex-1 sm:flex-none sm:ml-auto justify-center"
                    >
                      <Send size={14} />
                      Skicka
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
