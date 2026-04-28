import { useEffect, useRef } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import { useJobsokLayout, selectHiddenWidgets } from './JobsokLayoutContext'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { WIDGET_LABELS } from './widgetLabels'
import type { WidgetId } from './registry'

interface HiddenWidgetsPanelProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Dropdown panel listing hidden widgets.
 * Triggered by the "Anpassa vy" button (Plan 04 wires the trigger).
 * Auto-closes on outside click + Escape key.
 * Reset button at bottom uses ConfirmDialog (warning variant) before calling resetLayout().
 *
 * ConfirmDialogProvider is already mounted at root (main.tsx line 104) — no need to add it here.
 */
export function HiddenWidgetsPanel({ isOpen, onClose }: HiddenWidgetsPanelProps) {
  const { layout, showWidget, resetLayout } = useJobsokLayout()
  const { confirm } = useConfirmDialog()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hidden = selectHiddenWidgets(layout)

  // Outside click + Escape key handlers
  useEffect(() => {
    if (!isOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isOpen, onClose])

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Återställ layout?',
      message: 'Är du säker? Detta tar bort alla anpassningar för denna hub.',
      confirmText: 'Återställ',
      cancelText: 'Avbryt',
      variant: 'warning',
    })
    if (ok) {
      resetLayout()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Dolda widgets"
      className={[
        'absolute right-0 top-full mt-2 z-30',
        'w-[280px] bg-[var(--surface)]',
        'border border-[var(--stone-150)] rounded-[12px]',
        'shadow-[0_4px_16px_rgb(0_0_0/0.08)] p-3',
      ].join(' ')}
    >
      {hidden.length === 0 ? (
        <p className="text-[12px] text-[var(--stone-600)] m-0 px-2 py-3">
          Inga dolda widgets
        </p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-1">
          {hidden.map((item) => {
            const label = WIDGET_LABELS[item.id as WidgetId] ?? item.id
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[7px] hover:bg-[var(--stone-100)]"
              >
                <span className="text-[13px] text-[var(--stone-800)]">{label}</span>
                <button
                  type="button"
                  onClick={() => showWidget(item.id)}
                  aria-label={`Återvisa widget ${label}`}
                  className={[
                    'flex items-center gap-1 px-2 py-1',
                    'text-[12px] font-bold text-[var(--c-text)]',
                    'bg-[var(--c-bg)] rounded-[6px]',
                    'hover:bg-[var(--c-accent)]',
                    'focus:outline-none focus:shadow-[0_0_0_3px_var(--surface),0_0_0_4px_var(--c-solid)]',
                    'border-0 cursor-pointer',
                  ].join(' ')}
                >
                  <Plus size={12} aria-hidden="true" />
                  Återvisa
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Divider */}
      <div className="h-px bg-[var(--stone-150)] my-3" />

      {/* Reset button — always visible, even with no hidden widgets */}
      <button
        type="button"
        onClick={handleReset}
        className={[
          'w-full flex items-center justify-center gap-2 px-3 py-2',
          'text-[12px] font-bold text-[var(--stone-700)]',
          'bg-transparent border border-[var(--stone-150)] rounded-[7px]',
          'hover:bg-[var(--stone-100)] hover:text-[var(--stone-900)]',
          'focus:outline-none focus:shadow-[0_0_0_3px_var(--surface),0_0_0_4px_var(--c-solid)]',
          'cursor-pointer',
        ].join(' ')}
      >
        <RotateCcw size={12} aria-hidden="true" />
        Återställ standardlayout
      </button>
    </div>
  )
}
