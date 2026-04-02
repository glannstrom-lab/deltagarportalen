/**
 * Cover Letter My Letters Tab
 * Lista över alla sparade personliga brev
 */

import { useState, useEffect, useCallback } from 'react'
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
// NOTE: jsPDF is dynamically imported in handleDownload to reduce bundle size

type LetterStatus = 'draft' | 'sent' | 'template'

interface Letter {
  id: string
  title: string
  company: string
  jobTitle: string
  content: string
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
    createdAt: apiLetter.created_at,
    updatedAt: apiLetter.updated_at,
    wordCount,
    status: 'draft', // Could be extended with sent tracking
  }
}

export function CoverLetterMyLetters() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

      // Dynamic import jsPDF to reduce initial bundle size
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(letter.title, 20, 20)

      // Company and job title
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      if (letter.company) {
        doc.text(`Företag: ${letter.company}`, 20, 30)
      }
      if (letter.jobTitle) {
        doc.text(`Position: ${letter.jobTitle}`, 20, 38)
      }

      // Date
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Skapad: ${formatDate(letter.createdAt)}`, 20, 48)
      doc.setTextColor(0)

      // Content
      doc.setFontSize(11)
      const splitText = doc.splitTextToSize(letter.content, 170)
      doc.text(splitText, 20, 60)

      // Save
      const fileName = `${letter.company || 'Personligt_brev'}_${letter.jobTitle || 'ansökan'}.pdf`
        .replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_')
      doc.save(fileName)
    } catch (err) {
      console.error('Failed to download letter:', err)
      setError('Kunde inte ladda ner brevet som PDF')
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" aria-hidden="true" />
        <span className="ml-3 text-slate-600">Laddar brev...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12" role="alert" aria-live="assertive">
        <p className="text-rose-600 mb-4">{error}</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Sök bland dina brev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-base sm:text-sm"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredLetters.length} {filteredLetters.length === 1 ? 'brev' : 'brev'}
        </div>
      </div>

      {/* Lista över brev */}
      <div className="grid gap-4">
        {filteredLetters.map((letter) => (
          <Card
            key={letter.id}
            className="p-4 sm:p-5 hover:shadow-md transition-shadow group"
          >
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              {/* Header row on mobile: Icon + Title + Status */}
              <div className="flex items-start gap-3 sm:contents">
                {/* Ikon */}
                <div className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
                  letter.status === 'sent'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-indigo-100 text-indigo-600'
                )}>
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Title & status on mobile */}
                <div className="flex-1 min-w-0 sm:hidden">
                  <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
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
                    <h3 className="font-semibold text-slate-800 truncate">
                      {letter.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
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
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:hidden">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {letter.company}
                  </span>
                  <span>•</span>
                  <span>{letter.wordCount} ord</span>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs text-slate-400">
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
                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(letter.id)}
                    className="gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    <Edit3 size={14} />
                    <span className="sm:inline">Redigera</span>
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActions(showActions === letter.id ? null : letter.id)}
                      className="gap-1.5"
                    >
                      <MoreVertical size={14} />
                      <span className="hidden sm:inline">Mer</span>
                    </Button>

                    {showActions === letter.id && (
                      <div className="absolute right-0 sm:left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px] z-10">
                        <button
                          onClick={() => handleDuplicate(letter)}
                          disabled={actionLoading === letter.id}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === letter.id ? (
                            <Loader2 size={14} className="text-slate-400 animate-spin" />
                          ) : (
                            <Copy size={14} className="text-slate-400" />
                          )}
                          Duplicera
                        </button>
                        <button
                          onClick={() => handleDownload(letter)}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Download size={14} className="text-slate-400" />
                          Ladda ner PDF
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={() => handleDelete(letter.id)}
                          disabled={actionLoading === letter.id}
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-rose-600 disabled:opacity-50"
                        >
                          {actionLoading === letter.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
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
