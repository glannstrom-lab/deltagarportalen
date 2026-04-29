import { type ReactNode, Suspense } from 'react'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import type { WidgetSize } from './types'

// ============================================================
// HubGrid.Root — 4-col CSS grid (2-col under 900px)
// ============================================================

interface HubGridProps {
  children: ReactNode
  className?: string
}

/** 4-col grid (2-col under 900px), grid-auto-rows: 150px, gap: 14px */
function HubGridRoot({ children, className }: HubGridProps) {
  return (
    <div
      className={[
        'grid grid-cols-2 min-[900px]:grid-cols-4',
        'auto-rows-[150px] gap-[14px]',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

// ============================================================
// HubGrid.Section — labeled widget group
// ============================================================

interface SectionProps {
  /** Visible Swedish section heading */
  title: string
  children: ReactNode
}

/** Section heading + grid wrapper for grouped widgets. Renders as <section aria-label={title}> */
function Section({ title, children }: SectionProps) {
  return (
    <section aria-label={title} className="mb-[28px] last:mb-0">
      <div className="flex items-center gap-[10px] mb-[12px]">
        {/* Colored dot signals domain — matches legacy nav-group pattern */}
        <span
          className="w-[6px] h-[6px] rounded-full bg-[var(--c-solid)] flex-shrink-0"
          aria-hidden="true"
        />
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--c-text)] m-0">
          {title}
        </h2>
        <div className="flex-1 h-px bg-[var(--c-accent)] opacity-60" />
      </div>
      <div className="grid grid-cols-2 min-[900px]:grid-cols-4 auto-rows-[150px] gap-[14px]">
        {children}
      </div>
    </section>
  )
}

// ============================================================
// HubGrid.Slot — grid span + error boundary + suspense
// ============================================================

interface SlotProps {
  size: WidgetSize
  children: ReactNode
  /** Suspense fallback for lazy widgets. Default: a spec skeleton card */
  fallback?: ReactNode
  /** Phase 4: when false, slot renders nothing (widget is hidden by user). Default: true */
  visible?: boolean
}

const SIZE_CLASSES: Record<WidgetSize, string> = {
  S: 'col-span-1 row-span-1',
  M: 'col-span-2 row-span-1',
  L: 'col-span-2 row-span-2',
  XL: 'col-span-2 min-[900px]:col-span-4 row-span-1',
}

/** Wraps a single widget: applies grid span + per-widget ErrorBoundary + Suspense */
function Slot({ size, children, fallback, visible = true }: SlotProps) {
  if (!visible) return null

  const skeleton = (
    <div className="bg-[var(--surface)] border border-[var(--stone-150)] rounded-[12px] p-[14px_16px] animate-pulse">
      <div className="h-4 bg-stone-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-stone-200 rounded w-1/2" />
    </div>
  )
  return (
    <div className={SIZE_CLASSES[size]}>
      <WidgetErrorBoundary>
        <Suspense fallback={fallback ?? skeleton}>{children}</Suspense>
      </WidgetErrorBoundary>
    </div>
  )
}

// ============================================================
// Compound export
// ============================================================

export const HubGrid = Object.assign(HubGridRoot, {
  Section,
  Slot,
})
