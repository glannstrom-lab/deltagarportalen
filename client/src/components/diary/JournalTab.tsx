/**
 * JournalTab - Main diary writing and viewing tab
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookHeart, Plus, Search, X, Heart, Tag, Trash2, Edit2,
  Sparkles, RefreshCw, Calendar, ChevronDown, Filter, Star
} from 'lucide-react'
import { useDiaryEntries, useWritingPrompts, useDiaryStreaks } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

const getMoodEmoji = (mood: number) => {
  switch (mood) {
    case 5: return '😄'
    case 4: return '🙂'
    case 3: return '😐'
    case 2: return '😔'
    case 1: return '😢'
    default: return '😐'
  }
}

const getMoodColor = (mood: number) => {
  switch (mood) {
    case 5: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 4: return 'bg-green-100 text-green-700 border-green-200'
    case 3: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 2: return 'bg-orange-100 text-orange-700 border-orange-200'
    case 1: return 'bg-rose-100 text-rose-700 border-rose-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

interface WriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: {
    title: string
    content: string
    mood: number
    tags: string[]
    entry_type: 'diary' | 'reflection'
  }) => void
  initialPrompt?: string
}

function WriteModal({ isOpen, onClose, onSave, initialPrompt }: WriteModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(initialPrompt ? `${initialPrompt}\n\n` : '')
  const [mood, setMood] = useState(3)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSave = async () => {
    if (!content.trim()) return
    setIsSaving(true)
    try {
      await onSave({
        title: title.trim() || new Date().toLocaleDateString('sv-SE'),
        content: content.trim(),
        mood,
        tags,
        entry_type: 'diary'
      })
      // Reset form
      setTitle('')
      setContent('')
      setMood(3)
      setTags([])
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(w => w).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <BookHeart className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ny dagboksanteckning</h2>
              <p className="text-sm text-slate-500">{wordCount} ord</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel (valfritt)"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-lg font-medium"
          />

          {/* Mood selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hur mår du?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                    mood === m
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-violet-300"
                  )}
                >
                  <span className="text-2xl">{getMoodEmoji(m)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv dina tankar..."
              rows={10}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Taggar
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                >
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-violet-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Lägg till tagg..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
          >
            {isSaving ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function JournalTab() {
  const { t } = useTranslation()
  const { entries, isLoading, createEntry, deleteEntry, toggleFavorite } = useDiaryEntries()
  const { prompt, getNewPrompt, isLoading: promptLoading } = useWritingPrompts()
  const { currentStreak, totalEntries, totalWords } = useDiaryStreaks()
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!entry.title?.toLowerCase().includes(query) &&
          !entry.content.toLowerCase().includes(query)) {
        return false
      }
    }
    if (filterTag && !entry.tags.includes(filterTag)) {
      return false
    }
    return true
  })

  // Get all unique tags
  const allTags = [...new Set(entries.flatMap(e => e.tags))]

  const handleSaveEntry = async (entryData: any) => {
    await createEntry({
      ...entryData,
      entry_date: new Date().toISOString().split('T')[0]
    })
  }

  const handleUsePrompt = () => {
    setIsWriteModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <div className="flex items-center gap-1 sm:gap-2 text-violet-600 mb-1">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Streak</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-violet-700">{currentStreak} 🔥</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 mb-1">
            <BookHeart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Inlägg</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{totalEntries}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 mb-1">
            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Ord</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{totalWords.toLocaleString()}</p>
        </Card>
      </div>

      {/* Writing Prompt */}
      {prompt && (
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">Dagens skrivtips</h3>
              </div>
              <p className="text-amber-800 leading-relaxed">{prompt.prompt_text}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => getNewPrompt()}
                disabled={promptLoading}
                className="p-2 hover:bg-amber-100 rounded-lg text-amber-600 transition-colors"
              >
                <RefreshCw className={cn("w-5 h-5", promptLoading && "animate-spin")} />
              </button>
              <Button size="sm" onClick={handleUsePrompt}>
                Använd
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök i dagboken..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              showFilters || filterTag
                ? "border-violet-300 bg-violet-50 text-violet-600"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <Button onClick={() => setIsWriteModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ny anteckning
        </Button>
      </div>

      {/* Tag filters */}
      {showFilters && allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              !filterTag
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Alla
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filterTag === tag
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <Card className="p-12 text-center">
            <BookHeart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {searchQuery || filterTag ? 'Inga träffar' : 'Din dagbok är tom'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || filterTag
                ? 'Prova att ändra din sökning'
                : 'Börja skriva och samla dina tankar på ett ställe'}
            </p>
            {!searchQuery && !filterTag && (
              <Button onClick={() => setIsWriteModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Skriv ditt första inlägg
              </Button>
            )}
          </Card>
        ) : (
          filteredEntries.map(entry => (
            <Card
              key={entry.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {entry.title || 'Utan titel'}
                    </h3>
                    {entry.mood && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs border",
                        getMoodColor(entry.mood)
                      )}>
                        {getMoodEmoji(entry.mood)}
                      </span>
                    )}
                    {entry.is_favorite && (
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.entry_date).toLocaleDateString('sv-SE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>{entry.word_count} ord</span>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-violet-500">#{tag}</span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span>+{entry.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(entry.id) }}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      entry.is_favorite
                        ? "text-amber-500 hover:bg-amber-50"
                        : "text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <Star className={cn("w-4 h-4", entry.is_favorite && "fill-current")} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Ta bort detta inlägg?')) {
                        deleteEntry(entry.id)
                      }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Write Modal */}
      <WriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSave={handleSaveEntry}
        initialPrompt={prompt?.prompt_text}
      />

      {/* View Entry Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedEntry.title}</h2>
                <p className="text-sm text-slate-500">
                  {new Date(selectedEntry.entry_date).toLocaleDateString('sv-SE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} · {selectedEntry.word_count} ord
                </p>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              {selectedEntry.mood && (
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border mb-4",
                  getMoodColor(selectedEntry.mood)
                )}>
                  <span className="text-lg">{getMoodEmoji(selectedEntry.mood)}</span>
                  <span>Humör: {selectedEntry.mood}/5</span>
                </div>
              )}

              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedEntry.content}
              </p>

              {selectedEntry.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JournalTab
