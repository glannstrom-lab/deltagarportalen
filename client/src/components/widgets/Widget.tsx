import { createContext, useContext, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X as XIcon } from 'lucide-react'
import type { WidgetProps, WidgetSize } from './types'

// ============================================================
// Context — passes size/onSizeChange/allowedSizes/editMode
// from Root to Header without prop drilling
// ============================================================

interface WidgetContextValue {
  size: WidgetSize
  onSizeChange?: (newSize: WidgetSize) => void
  allowedSizes: WidgetSize[]
  editMode: boolean
  /** Phase 4: when provided AND editMode=true, renders the hide-button (×) in Header */
  onHide?: () => void
}

const WidgetContext = createContext<WidgetContextValue | null>(null)

function useWidgetContext(): WidgetContextValue {
  const ctx = useContext(WidgetContext)
  if (!ctx) throw new Error('Widget sub-components must be used inside <Widget>')
  return ctx
}

// ============================================================
// Widget.Root
// ============================================================

interface WidgetRootProps extends WidgetProps {
  children: ReactNode
}

function WidgetRoot({
  id,
  size,
  onSizeChange,
  allowedSizes = ['S', 'M', 'L'],
  editMode = false,
  onHide,
  className,
  children,
}: WidgetRootProps) {
  return (
    <WidgetContext.Provider value={{ size, onSizeChange, allowedSizes, editMode, onHide }}>
      <div
        className={[
          'bg-[var(--surface)] border border-[var(--stone-150)] rounded-[12px]',
          'p-[14px_16px] flex flex-col overflow-hidden',
          'transition-[border-color,box-shadow] duration-[var(--motion-fast)]',
          'hover:border-[var(--c-accent)] hover:shadow-[0_2px_6px_rgb(0_0_0/0.05)]',
          'group relative',
          className ?? '',
        ].join(' ')}
        data-widget-id={id}
        data-widget-size={size}
      >
        {children}
      </div>
    </WidgetContext.Provider>
  )
}

// ============================================================
// Widget.Header
// ============================================================

interface WidgetHeaderProps {
  icon: LucideIcon
  title: string
}

function WidgetHeader({ icon: Icon, title }: WidgetHeaderProps) {
  const { size, onSizeChange, allowedSizes, editMode, onHide } = useWidgetContext()
  const showHide = editMode && !!onHide

  const toggleGroupClass = [
    'flex gap-[1px] bg-[var(--stone-150)] rounded-[6px] p-[1px]',
    'transition-opacity duration-[var(--motion-fast)]',
    editMode
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
  ].join(' ')

  return (
    <div className="flex items-center justify-between mb-[10px]">
      {/* Left side: icon + title */}
      <div className="flex items-center gap-[8px]">
        <div
          className="w-[26px] h-[26px] rounded-[7px] bg-[var(--c-bg)] text-[var(--c-text)] flex items-center justify-center flex-shrink-0"
        >
          <Icon size={14} aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold leading-[1.3] text-[var(--stone-900)] m-0">
          {title}
        </h3>
      </div>

      {/* Right side: size toggle group + optional hide button */}
      <div className="flex items-center gap-[6px]">
        <div
          role="group"
          aria-label="Välj widgetstorlek"
          className={toggleGroupClass}
        >
          {allowedSizes.map((s) => {
            const isActive = s === size
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSizeChange?.(s)}
                aria-pressed={isActive}
                aria-label={`Sätt storlek till ${s}`}
                className={[
                  'w-[18px] h-[18px] text-[9px] font-bold rounded-[5px]',
                  'cursor-pointer border-0',
                  isActive
                    ? 'bg-white text-[var(--c-text)]'
                    : 'bg-transparent text-[var(--stone-700)]',
                ].join(' ')}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Phase 4: hide button — only when editMode && onHide */}
        {showHide && (
          <button
            type="button"
            onClick={() => onHide?.()}
            aria-label={`Dölj widget ${title}`}
            className={[
              'w-[18px] h-[18px] flex items-center justify-center',
              'rounded-[5px] text-[var(--stone-500)]',
              'hover:bg-[var(--stone-150)] hover:text-[var(--stone-800)]',
              'focus:outline-none',
              'focus:shadow-[0_0_0_3px_var(--c-bg),0_0_0_4px_var(--c-solid)]',
              'border-0 bg-transparent cursor-pointer',
            ].join(' ')}
          >
            <XIcon size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Widget.Body
// ============================================================

interface WidgetBodyProps {
  children: ReactNode
  className?: string
}

function WidgetBody({ children, className }: WidgetBodyProps) {
  return (
    <div className={['flex-1 flex flex-col min-h-0', className ?? ''].join(' ')}>
      {children}
    </div>
  )
}

// ============================================================
// Widget.Footer
// ============================================================

interface WidgetFooterProps {
  children: ReactNode
  className?: string
}

function WidgetFooter({ children, className }: WidgetFooterProps) {
  const { size } = useWidgetContext()

  // Footer is hidden at S-size per spec
  if (size === 'S') return null

  return (
    <div className={['flex gap-[6px] mt-[10px]', className ?? ''].join(' ')}>
      {children}
    </div>
  )
}

// ============================================================
// Compound export
// ============================================================

export const Widget = Object.assign(WidgetRoot, {
  Header: WidgetHeader,
  Body: WidgetBody,
  Footer: WidgetFooter,
})
