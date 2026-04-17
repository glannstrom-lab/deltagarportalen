/**
 * SkillsSection - Kompetenser med nivåer
 */

import { useState, useEffect } from 'react'
import { Plus, X, Star, Loader2, Download, Sparkles } from '@/components/ui/icons'
import { profileSkillsApi, type ProfileSkill } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'

const SKILL_CATEGORIES = [
  { value: 'technical', label: 'Teknisk' },
  { value: 'soft', label: 'Mjuk' },
  { value: 'language', label: 'Språk' },
  { value: 'tool', label: 'Verktyg' },
  { value: 'certification', label: 'Certifiering' },
  { value: 'other', label: 'Övrigt' },
]

const SUGGESTED_SKILLS = [
  'Microsoft Office', 'Excel', 'Word', 'PowerPoint', 'Kommunikation',
  'Problemlösning', 'Teamwork', 'Projektledning', 'Kundservice', 'Ledarskap',
  'Engelska', 'Svenska', 'Tyska', 'Planering', 'Organisering'
]

interface Props {
  className?: string
}

export function SkillsSection({ className }: Props) {
  const [skills, setSkills] = useState<ProfileSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)

  // New skill form
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'other' as ProfileSkill['category'],
    level: 3
  })
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const data = await profileSkillsApi.getAll()
      setSkills(data)
    } catch (err) {
      console.error('Error loading skills:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newSkill.name.trim()) return

    setAdding(true)
    try {
      const skill = await profileSkillsApi.add({
        name: newSkill.name.trim(),
        category: newSkill.category,
        level: newSkill.level
      })
      setSkills(prev => [...prev, skill].sort((a, b) => b.level - a.level))
      setNewSkill({ name: '', category: 'other', level: 3 })
    } catch (err) {
      console.error('Error adding skill:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleUpdateLevel = async (id: string, level: number) => {
    try {
      await profileSkillsApi.update(id, { level })
      setSkills(prev => prev.map(s => s.id === id ? { ...s, level } : s))
    } catch (err) {
      console.error('Error updating skill:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await profileSkillsApi.delete(id)
      setSkills(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting skill:', err)
    }
  }

  const handleImportFromCV = async () => {
    setImporting(true)
    try {
      const imported = await profileSkillsApi.importFromCV()
      if (imported.length > 0) {
        setSkills(prev => [...prev, ...imported].sort((a, b) => b.level - a.level))
        alert(`Importerade ${imported.length} kompetenser från ditt CV!`)
      } else {
        alert('Inga nya kompetenser att importera från CV.')
      }
    } catch (err) {
      console.error('Error importing skills:', err)
    } finally {
      setImporting(false)
    }
  }

  const filteredSuggestions = SUGGESTED_SKILLS
    .filter(s => s.toLowerCase().includes(newSkill.name.toLowerCase()))
    .filter(s => !skills.some(sk => sk.name.toLowerCase() === s.toLowerCase()))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with import button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          Kompetenser ({skills.length})
        </h3>
        <button
          onClick={handleImportFromCV}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/40 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors disabled:opacity-50"
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Importera från CV
        </button>
      </div>

      {/* Skills list */}
      {skills.length > 0 ? (
        <div className="grid gap-2">
          {skills.map(skill => (
            <div
              key={skill.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-stone-800 dark:text-stone-200 truncate">
                    {skill.name}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full">
                    {SKILL_CATEGORIES.find(c => c.value === skill.category)?.label || skill.category}
                  </span>
                </div>
              </div>

              {/* Level stars */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => handleUpdateLevel(skill.id, level)}
                    className="p-0.5 hover:scale-110 transition-transform"
                    title={`Nivå ${level}`}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4 transition-colors',
                        level <= skill.level
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      )}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleDelete(skill.id)}
                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
          Inga kompetenser tillagda än. Lägg till dina kompetenser eller importera från ditt CV.
        </p>
      )}

      {/* Add new skill */}
      <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Lägg till kompetens</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Name input with suggestions */}
          <div className="relative">
            <input
              type="text"
              value={newSkill.name}
              onChange={(e) => {
                setNewSkill(prev => ({ ...prev, name: e.target.value }))
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="T.ex. Excel, Projektledning"
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            />
            {showSuggestions && filteredSuggestions.length > 0 && newSkill.name && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg shadow-lg z-10 py-1">
                {filteredSuggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setNewSkill(prev => ({ ...prev, name: s }))
                      setShowSuggestions(false)
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-900/40 text-stone-700 dark:text-stone-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category select */}
          <select
            value={newSkill.category}
            onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value as ProfileSkill['category'] }))}
            className="px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          >
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Level selector + Add button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewSkill(prev => ({ ...prev, level }))}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      'w-5 h-5 transition-colors',
                      level <= newSkill.level
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300 dark:text-stone-600 hover:text-amber-300'
                    )}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={!newSkill.name.trim() || adding}
              className="flex items-center gap-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
