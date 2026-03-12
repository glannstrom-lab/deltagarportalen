/**
 * Cover Letter My Letters Tab
 * Lista över alla sparade personliga brev
 */

import { useState } from 'react'
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
  Clock
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

// Mock data - ska ersättas med riktig data från backend
const mockLetters = [
  {
    id: '1',
    title: 'Acme AB - Projektledare',
    company: 'Acme AB',
    jobTitle: 'Projektledare',
    content: 'Hej, jag söker rollen som...',
    createdAt: '2026-03-10',
    updatedAt: '2026-03-11',
    wordCount: 285,
    status: 'draft' as const,
  },
  {
    id: '2',
    title: 'TechCorp - Utvecklare',
    company: 'TechCorp',
    jobTitle: 'Frontend-utvecklare',
    content: 'Hej, jag skriver för att söka...',
    createdAt: '2026-03-08',
    updatedAt: '2026-03-08',
    wordCount: 320,
    status: 'sent' as const,
    sentDate: '2026-03-09',
  },
  {
    id: '3',
    title: 'Stadskommunen - Handläggare',
    company: 'Stadskommunen',
    jobTitle: 'Administrativ handläggare',
    content: 'Jag söker tjänsten som...',
    createdAt: '2026-03-05',
    updatedAt: '2026-03-06',
    wordCount: 410,
    status: 'draft' as const,
  },
]

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

export function CoverLetterMyLetters() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [letters] = useState<Letter[]>(mockLetters)
  const [showActions, setShowActions] = useState<string | null>(null)

  const filteredLetters = letters.filter(letter =>
    letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (id: string) => {
    navigate(`/dashboard/cover-letter?edit=${id}`)
  }

  const handleDuplicate = (letter: Letter) => {
    // TODO: Implementera duplicering
    console.log('Duplicera brev:', letter.id)
  }

  const handleDelete = (id: string) => {
    // TODO: Implementera radering
    console.log('Radera brev:', id)
  }

  const handleDownload = (letter: Letter) => {
    // TODO: Implementera nedladdning
    console.log('Ladda ner brev:', letter.id)
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
    <div className="space-y-6">
      {/* Header med sök */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Sök bland dina brev..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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
            className="p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-4">
              {/* Ikon */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                letter.status === 'sent' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-indigo-100 text-indigo-600'
              )}>
                <FileText size={24} />
              </div>

              {/* Innehåll */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(letter.status, letter.sentDate)}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Skapat {formatDate(letter.createdAt)}
                  </span>
                  {letter.updatedAt !== letter.createdAt && (
                    <span className="flex items-center gap-1">
                      <Edit3 size={12} />
                      Redigerat {formatDate(letter.updatedAt)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(letter.id)}
                    className="gap-1.5"
                  >
                    <Edit3 size={14} />
                    Redigera
                  </Button>
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActions(showActions === letter.id ? null : letter.id)}
                      className="gap-1.5"
                    >
                      <MoreVertical size={14} />
                      Mer
                    </Button>
                    
                    {showActions === letter.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px] z-10">
                        <button
                          onClick={() => handleDuplicate(letter)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Copy size={14} className="text-slate-400" />
                          Duplicera
                        </button>
                        <button
                          onClick={() => handleDownload(letter)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Download size={14} className="text-slate-400" />
                          Ladda ner
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={() => handleDelete(letter.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                        >
                          <Trash2 size={14} />
                          Ta bort
                        </button>
                      </div>
                    )}
                  </div>

                  {letter.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/cover-letter/applications')}
                      className="gap-1.5 ml-auto"
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
