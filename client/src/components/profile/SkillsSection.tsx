/**
 * SkillsSection - Kompetenser med nivåer
 * Updated with ARIA attributes and toast notifications
 */

import { useState, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, Star, Loader2, Download, Sparkles } from '@/components/ui/icons'
import { profileSkillsApi, type ProfileSkill } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'
import { notifications } from '@/lib/toast'

const SKILL_CATEGORIES = [
  { value: 'technical', labelKey: 'profile.skills.categories.technical' },
  { value: 'soft', labelKey: 'profile.skills.categories.soft' },
  { value: 'language', labelKey: 'profile.skills.categories.language' },
  { value: 'tool', labelKey: 'profile.skills.categories.tool' },
  { value: 'certification', labelKey: 'profile.skills.categories.certification' },
  { value: 'other', labelKey: 'profile.skills.categories.other' },
] as const

const SUGGESTED_SKILLS = [
  { value: 'microsoft_office', labelKey: 'profile.suggestions.skills.microsoftOffice' },
  { value: 'excel', labelKey: 'profile.suggestions.skills.excel' },
  { value: 'word', labelKey: 'profile.suggestions.skills.word' },
  { value: 'powerpoint', labelKey: 'profile.suggestions.skills.powerpoint' },
  { value: 'communication', labelKey: 'profile.suggestions.skills.communication' },
  { value: 'problem_solving', labelKey: 'profile.suggestions.skills.problemSolving' },
  { value: 'teamwork', labelKey: 'profile.suggestions.skills.teamwork' },
  { value: 'project_management', labelKey: 'profile.suggestions.skills.projectManagement' },
  { value: 'customer_service', labelKey: 'profile.suggestions.skills.customerService' },
  { value: 'leadership', labelKey: 'profile.suggestions.skills.leadership' },
  { value: 'english', labelKey: 'profile.suggestions.skills.english' },
  { value: 'swedish', labelKey: 'profile.suggestions.skills.swedish' },
  { value: 'time_management', labelKey: 'profile.suggestions.skills.timeManagement' },
  { value: 'organization', labelKey: 'profile.suggestions.skills.organization' }
] as const

interface Props {
  className?: string
}

export function SkillsSection({ className }: Props) {
  const { t } = useTranslation()
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

  // ARIA IDs
  const suggestionsId = useId()
  const newSkillInputId = useId()

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
        notifications.success(t('profile.skills.importedCount', { count: imported.length }))
      } else {
        notifications.info(t('profile.skills.noSkillsToImport'))
      }
    } catch (err) {
      console.error('Error importing skills:', err)
      notifications.error(t('profile.skills.importError'))
    } finally {
      setImporting(false)
    }
  }

  const filteredSuggestions = SUGGESTED_SKILLS
    .map(s => ({ ...s, label: t(s.labelKey) }))
    .filter(s => s.label.toLowerCase().includes(newSkill.name.toLowerCase()))
    .filter(s => !skills.some(sk => sk.name.toLowerCase() === s.label.toLowerCase()))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-brand-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with import button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          {t('profile.skills.title')} ({skills.length})
        </h3>
        <button
          onClick={handleImportFromCV}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-900 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors disabled:opacity-50"
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {t('profile.skills.importFromCV')}
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
                    {t(SKILL_CATEGORIES.find(c => c.value === skill.category)?.labelKey || 'profile.skills.categories.other')}
                  </span>
                </div>
              </div>

              {/* Level stars */}
              <div
                className="flex items-center gap-0.5"
                role="group"
                aria-label={t('profile.skills.skillLevelFor', { name: skill.name })}
              >
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => handleUpdateLevel(skill.id, level)}
                    className="p-0.5 hover:scale-110 transition-transform"
                    aria-label={t('profile.skills.setLevel', { level, max: 5 })}
                    aria-pressed={level === skill.level}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4 transition-colors',
                        level <= skill.level
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleDelete(skill.id)}
                className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label={t('profile.skills.removeSkill', { name: skill.name })}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
          {t('profile.skills.noSkillsYet')}
        </p>
      )}

      {/* Add new skill */}
      <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-900" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('profile.skills.addSkill')}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Name input with suggestions */}
          <div className="relative">
            <label htmlFor={newSkillInputId} className="sr-only">{t('profile.skills.skillName')}</label>
            <input
              id={newSkillInputId}
              type="text"
              value={newSkill.name}
              onChange={(e) => {
                setNewSkill(prev => ({ ...prev, name: e.target.value }))
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={t('profile.skills.skillPlaceholder')}
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
              role="combobox"
              aria-expanded={showSuggestions && filteredSuggestions.length > 0}
              aria-controls={suggestionsId}
              aria-autocomplete="list"
            />
            {showSuggestions && filteredSuggestions.length > 0 && newSkill.name && (
              <ul
                id={suggestionsId}
                role="listbox"
                aria-label={t('profile.skills.suggestions')}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg z-10 py-1"
              >
                {filteredSuggestions.map(s => (
                  <li key={s.value} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => {
                        setNewSkill(prev => ({ ...prev, name: s.label }))
                        setShowSuggestions(false)
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/40 text-stone-700 dark:text-stone-300"
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Category select */}
          <div>
            <label htmlFor="skill-category" className="sr-only">{t('profile.skills.category')}</label>
            <select
              id="skill-category"
              value={newSkill.category}
              onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value as ProfileSkill['category'] }))}
              className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-300"
            >
              {SKILL_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Level selector + Add button */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-0.5"
              role="group"
              aria-label={t('profile.skills.chooseLevel')}
            >
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewSkill(prev => ({ ...prev, level }))}
                  className="p-0.5"
                  aria-label={t('profile.skills.setLevel', { level, max: 5 })}
                  aria-pressed={level === newSkill.level}
                >
                  <Star
                    className={cn(
                      'w-5 h-5 transition-colors',
                      level <= newSkill.level
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300 dark:text-stone-600 hover:text-amber-300'
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={!newSkill.name.trim() || adding}
              className="flex items-center gap-1 px-3 py-2 bg-brand-900 hover:bg-brand-900/90 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('profile.skills.addSkill')}
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
