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
      <div className="bg-slate-50 rounded-xl p-5 my-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
        <span className="ml-2 text-sm text-slate-700">Laddar checklista...</span>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 rounded-xl p-5 my-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800">Din checklista</h4>
        <div className="flex items-center gap-2">
          {isSaving && (
            <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
          )}
          <span className="text-sm text-slate-600">{progress}%</span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}
      
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div 
          className="bg-brand-900 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const isChecked = checkedItems.has(item.id)
          return (
            <li 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`
                flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                ${isChecked ? 'bg-white' : 'bg-white/50 hover:bg-white'}
              `}
            >
              <div className={`
                flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                ${isChecked 
                  ? 'bg-brand-900 border-brand-900' 
                  : 'border-slate-300 hover:border-brand-400'
                }
              `}>
                {isChecked && <Check size={14} className="text-white" />}
              </div>
              <span className={`text-sm ${isChecked ? 'text-slate-700 line-through' : 'text-slate-700'}`}>
                {item.text}
              </span>
            </li>
          )
        })}
      </ul>

      {progress === 100 && (
        <div className="mt-4 p-3 bg-brand-100 text-brand-900 rounded-lg text-center text-sm font-medium">
          🎉 Bra jobbat! Du har gått igenom allt!
        </div>
      )}
    </div>
  )
}
