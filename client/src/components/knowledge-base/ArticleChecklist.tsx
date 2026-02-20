import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
}

interface ArticleChecklistProps {
  articleId: string
  items: ChecklistItem[]
}

export default function ArticleChecklist({ articleId, items }: ArticleChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`checklist-${articleId}`)
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  useEffect(() => {
    localStorage.setItem(`checklist-${articleId}`, JSON.stringify([...checkedItems]))
  }, [checkedItems, articleId])

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

  return (
    <div className="bg-slate-50 rounded-xl p-5 my-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800">Din checklista</h4>
        <span className="text-sm text-slate-600">{progress}%</span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div 
          className="bg-teal-600 h-2 rounded-full transition-all"
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
                  ? 'bg-teal-600 border-teal-600' 
                  : 'border-slate-300 hover:border-teal-400'
                }
              `}>
                {isChecked && <Check size={14} className="text-white" />}
              </div>
              <span className={`text-sm ${isChecked ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                {item.text}
              </span>
            </li>
          )
        })}
      </ul>

      {progress === 100 && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm font-medium">
          🎉 Bra jobbat! Du har gått igenom allt!
        </div>
      )}
    </div>
  )
}
