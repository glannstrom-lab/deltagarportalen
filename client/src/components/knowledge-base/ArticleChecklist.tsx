import { useState, useEffect } from 'react'
import { Check, Loader2 } from '@/components/ui/icons'
import { articleChecklistApi } from '@/services/cloudStorage'

interface ChecklistItem {
  id: string
  text: string
}

interface ArticleChecklistProps {
  articleId: string
  items: ChecklistItem[]
}

export default function ArticleChecklist({ articleId, items }: ArticleChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ladda från molnet vid mount
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const saved = await articleChecklistApi.get(articleId)
        if (saved && Array.isArray(saved)) {
          setCheckedItems(new Set(saved))
        }
      } catch (err) {
        console.error('Failed to load checklist:', err)
        setError('Kunde inte ladda checklistan')
      } finally {
        setIsLoading(false)
      }
    }

    loadChecklist()
  }, [articleId])

  // Spara till molnet när checkedItems ändras
  useEffect(() => {
    // Hoppa över första renderingen när vi laddar
    if (isLoading) return

    const saveChecklist = async () => {
      try {
        setIsSaving(true)
        setError(null)
        await articleChecklistApi.update(articleId, [...checkedItems])
      } catch (err) {
        console.error('Failed to save checklist:', err)
        setError('Kunde inte spara checklistan')
      } finally {
        setIsSaving(false)
      }
    }

    saveChecklist()
  }, [checkedItems, articleId, isLoading])

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
    }
    setCheckedItems(newChecked)
  }

  const progress = Math.round((checkedItems.size / items.length) * 100)

  if (isLoading) {
    return (
      <div className="bg-stone-50 rounded-xl p-5 my-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-stone-600 animate-spin" />
        <span className="ml-2 text-sm text-stone-700">Laddar checklista...</span>
      </div>
    )
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-5 my-6">
      <div className="flex items-center justify-between mb-4">
        {/* h3, inte h4: brödtexten slutar i 60 av 163 artiklar på en h2, så
            h4 gav ett hopp över nivå tre. */}
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">Din checklista</h3>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="w-4 h-4 text-stone-600 dark:text-stone-400 animate-spin" aria-hidden="true" />}
          <span className="text-sm text-stone-600 dark:text-stone-400">{progress}%</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Andel avbockade punkter"
        className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 mb-4"
      >
        <div className="bg-[var(--c-solid)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/*
        Raderna var `<li onClick>` med en `<div>` som kryssruta: inget
        tabbstopp, ingen roll, inget tillstånd. Checklistan — artikelsidans
        mest använda interaktion — gick inte att använda med tangentbord, och
        en skärmläsare fick bara text. Uppmätt 2026-08-22: sex rader, samtliga
        `tabindex: null, role: null, aria-checked: null`.
      */}
      <ul className="space-y-2 list-none p-0 m-0">
        {items.map((item) => {
          const isChecked = checkedItems.has(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggleItem(item.id)}
                className={`w-full text-left flex items-start gap-3 p-3 min-h-[44px] rounded-lg transition-colors ${
                  isChecked
                    ? 'bg-white dark:bg-stone-800'
                    : 'bg-white/50 dark:bg-stone-800/50 hover:bg-white dark:hover:bg-stone-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                    isChecked
                      ? 'bg-[var(--c-solid)] border-[var(--c-solid)]'
                      : 'border-stone-300 dark:border-stone-600'
                  }`}
                >
                  {isChecked && <Check size={14} className="text-white" />}
                </span>
                <span className={`text-sm text-stone-700 dark:text-stone-200 ${isChecked ? 'line-through' : ''}`}>
                  {item.text}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Manifestet §1: inga konfettiexplosioner. Rutan sa
          "🎉 Bra jobbat! Du har gått igenom allt!". */}
      {progress === 100 && (
        <p role="status" className="mt-4 p-3 bg-[var(--c-bg)] text-[var(--c-text)] border border-[var(--c-accent)] rounded-lg text-center text-sm font-medium">
          Allt avbockat.
        </p>
      )}
    </div>
  )
}
