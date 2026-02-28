import { memo, useState } from 'react'
import { LayoutGrid, LayoutTemplate, Maximize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WidgetSize = 'small' | 'medium' | 'large'

interface WidgetSizeSelectorProps {
  currentSize: WidgetSize
  onSizeChange: (size: WidgetSize) => void
  onClose?: () => void
}

const sizeOptions: { value: WidgetSize; label: string; icon: typeof LayoutGrid; gridClass: string }[] = [
  { 
    value: 'small', 
    label: 'Liten', 
    icon: LayoutGrid,
    gridClass: 'col-span-1'
  },
  { 
    value: 'medium', 
    label: 'Medel', 
    icon: LayoutTemplate,
    gridClass: 'col-span-1 md:col-span-2'
  },
  { 
    value: 'large', 
    label: 'Stor', 
    icon: Maximize2,
    gridClass: 'col-span-1 md:col-span-2 lg:col-span-4'
  },
]

export const WidgetSizeSelector = memo(function WidgetSizeSelector({
  currentSize,
  onSizeChange,
  onClose,
}: WidgetSizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        title="Ändra storlek"
        aria-label="Ändra widget-storlek"
      >
        <LayoutGrid size={14} />
      </button>
    )
  }

  return (
    <div className="absolute top-2 right-2 z-10 bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[140px]">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
        <span className="text-xs font-medium text-slate-600">Storlek</span>
        <button
          onClick={() => {
            setIsOpen(false)
            onClose?.()
          }}
          className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
        >
          <X size={12} />
        </button>
      </div>
      <div className="space-y-1">
        {sizeOptions.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.value}
              onClick={() => {
                onSizeChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors',
                currentSize === option.value
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon size={14} />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
})
