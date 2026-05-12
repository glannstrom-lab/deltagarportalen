/**
 * QuickNoteForm — konsulentens snabbanteckning om en deltagare
 *
 * Princip: skriva en observation ska ta < 30 sekunder. Hellre ett par taggar
 * + en mening än ingenting alls. Sparas till sta_quick_notes och blir
 * underlag för delredovisning + tidiga varningssignaler.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Save, MessageSquare, Send } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'
import type { StaQuickNote, NoteVisibility } from '@/services/staApi'

// Fördefinierade taggar — gruppvis för pedagogik
export const TAG_GROUPS = [
  {
    category: 'Mående',
    tags: [
      { id: 'positiv-energi', label: 'Positiv energi', emoji: '🌟' },
      { id: 'pigg', label: 'Pigg', emoji: '☀️' },
      { id: 'nedstamd', label: 'Nedstämd', emoji: '🌧️' },
      { id: 'stresssignal', label: 'Stresssignal', emoji: '🌪️' },
      { id: 'trott', label: 'Trött', emoji: '😴' },
    ],
  },
  {
    category: 'Engagemang',
    tags: [
      { id: 'engagerad', label: 'Engagerad', emoji: '⚡' },
      { id: 'fragande', label: 'Frågande', emoji: '💭' },
      { id: 'tystlaten', label: 'Tystlåten', emoji: '🚪' },
      { id: 'initiativ', label: 'Initiativtagande', emoji: '🚀' },
    ],
  },
  {
    category: 'Prestation',
    tags: [
      { id: 'fokuserad', label: 'Fokuserad', emoji: '🎯' },
      { id: 'distraherad', label: 'Distraherad', emoji: '🌀' },
      { id: 'snabb', label: 'Snabb', emoji: '⚡' },
      { id: 'noggrann', label: 'Noggrann', emoji: '🔍' },
    ],
  },
  {
    category: 'Socialt',
    tags: [
      { id: 'samverkan', label: 'Vänlig med andra', emoji: '🤝' },
      { id: 'undandragen', label: 'Drar sig undan', emoji: '🫥' },
      { id: 'hjalpsam', label: 'Hjälpsam', emoji: '🤲' },
    ],
  },
  {
    category: 'Signaler',
    tags: [
      { id: 'fra-aviserad', label: 'Frånvaroaviserad', emoji: '📅' },
      { id: 'sjuk', label: 'Sjuk', emoji: '🤒' },
      { id: 'kris', label: 'Kris-signal', emoji: '🚨' },
      { id: 'genombrott', label: 'Genombrott', emoji: '🔥' },
      { id: 'aha-moment', label: 'Aha-moment', emoji: '💡' },
    ],
  },
] as const

interface QuickNoteFormProps {
  onSubmit: (input: {
    body?: string
    tags?: string[]
    voice_transcript?: string
    visibility?: NoteVisibility
  }) => Promise<StaQuickNote | null>
  compact?: boolean
}

export function QuickNoteForm({ onSubmit, compact = false }: QuickNoteFormProps) {
  const [body, setBody] = useState('')
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<NoteVisibility>('shared_in_report')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const canSubmit = body.trim().length > 0 || voiceTranscript.length > 0 || selectedTags.length > 0

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    try {
      await onSubmit({
        body: body.trim() || undefined,
        voice_transcript: voiceTranscript.trim() || undefined,
        tags: selectedTags,
        visibility,
      })
      setBody('')
      setVoiceTranscript('')
      setSelectedTags([])
      setSavedMsg('Sparat')
      setTimeout(() => setSavedMsg(null), 2500)
    } catch (err) {
      setSavedMsg('Kunde inte spara')
      setTimeout(() => setSavedMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-2">
          <MessageSquare size={18} style={{ color: 'var(--c-solid)' }} />
          <h3 className="text-base font-semibold text-stone-900">Snabbanteckning</h3>
        </div>
      )}

      <VoiceInput
        value={body}
        onChange={setBody}
        onVoiceTranscript={setVoiceTranscript}
        placeholder="Skriv eller tala in en observation (Cmd+Enter sparar)..."
        rows={compact ? 2 : 3}
      />

      <div className="space-y-2">
        {TAG_GROUPS.map((group) => (
          <div key={group.category}>
            <div className="text-[11px] uppercase tracking-wide text-stone-500 font-medium mb-1">
              {group.category}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      isSelected
                        ? 'text-white border-transparent'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300',
                    )}
                    style={isSelected ? { background: 'var(--c-solid)' } : undefined}
                  >
                    <span>{tag.emoji}</span>
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
          className="text-xs px-2 py-1 rounded bg-stone-100 border-0 text-stone-700"
        >
          <option value="consultant_only">Bara jag ser detta</option>
          <option value="shared_in_report">Använd i delredovisning</option>
          <option value="shared_with_participant">Delas med deltagaren</option>
        </select>
        <div className="flex items-center gap-2">
          {savedMsg && (
            <span className="text-xs text-emerald-700">{savedMsg}</span>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit || saving}
            leftIcon={saving ? undefined : <Save size={14} />}
            isLoading={saving}
          >
            Spara
          </Button>
        </div>
      </div>
    </form>
  )
}

/**
 * Visa tagg-namn med emoji baserat på id (för listvisning).
 */
export function formatTag(tagId: string): string {
  for (const group of TAG_GROUPS) {
    const found = group.tags.find((t) => t.id === tagId)
    if (found) return `${found.emoji} ${found.label}`
  }
  return tagId
}
