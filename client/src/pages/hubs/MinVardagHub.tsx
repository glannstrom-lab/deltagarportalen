import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { HubGrid } from '@/components/widgets/HubGrid'
import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
import { getMinVardagSections, getDefaultLayout } from '@/components/widgets/defaultLayouts'
import type { WidgetSize, WidgetLayoutItem } from '@/components/widgets/types'
import { useMinVardagHubSummary } from '@/hooks/useMinVardagHubSummary'
import { MinVardagDataProvider } from '@/components/widgets/MinVardagDataContext'
import {
  MinVardagLayoutProvider,
  type MinVardagLayoutValue,
} from '@/components/widgets/MinVardagLayoutContext'
import { HiddenWidgetsPanel } from '@/components/widgets/HiddenWidgetsPanel'
import { WIDGET_LABELS } from '@/components/widgets/widgetLabels'
import { useWidgetLayout } from '@/hooks/useWidgetLayout'
import { useBreakpoint } from '@/hooks/useBreakpoint'

/**
 * Min Vardag hub — Phase 5 / HUB-04: full wiring with provider stack.
 *
 * Replaces the Phase 2 stub (single-widget grid). Wellbeing-domain hub for
 * utsatta målgrupper — empathy is paramount in widget copy.
 *
 * Provider order (locked from 04-CONTEXT.md):
 *   <MinVardagLayoutProvider>  ← outer (resolves layout first)
 *     <MinVardagDataProvider>  ← inner (data fetch can read visible-widget set)
 */

const HUB_ID = 'min-vardag' as const

export default function MinVardagHub() {
  const { t } = useTranslation()
  const sections = useMemo(() => getMinVardagSections(), [])
  const breakpoint = useBreakpoint()

  // Phase 4 pattern: persisted layout from Supabase
  const { layout, isLoading, saveDebounced, save } = useWidgetLayout(HUB_ID)

  // Edit-mode is hub-local (locked decision: useState, not Zustand)
  const [editMode, setEditMode] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // Effective layout: falls back to defaults when query hasn't resolved yet (loading).
  const effectiveLayout = useMemo(
    () => (layout.length > 0 ? layout : getDefaultLayout(HUB_ID, breakpoint)),
    [layout, breakpoint]
  )

  // Build a Map<id, WidgetLayoutItem> for quick lookups in render
  const layoutById = useMemo(() => {
    const m = new Map<string, WidgetLayoutItem>()
    for (const item of effectiveLayout) m.set(item.id, item)
    return m
  }, [effectiveLayout])

  // Mutators — produce a new layout array and call saveDebounced
  const hideWidget = useCallback((id: string) => {
    const next = effectiveLayout.map(w => w.id === id ? { ...w, visible: false } : w)
    saveDebounced(next)
    const label = WIDGET_LABELS[id as WidgetId] ?? id
    setAnnouncement(`Widget ${label} dold`)
  }, [effectiveLayout, saveDebounced])

  const showWidget = useCallback((id: string) => {
    const next = effectiveLayout.map(w => w.id === id ? { ...w, visible: true } : w)
    saveDebounced(next)
    const label = WIDGET_LABELS[id as WidgetId] ?? id
    setAnnouncement(`Widget ${label} återvisad`)
  }, [effectiveLayout, saveDebounced])

  const updateSize = useCallback((id: string, size: WidgetSize) => {
    const next = effectiveLayout.map(w => w.id === id ? { ...w, size } : w)
    saveDebounced(next)
    setAnnouncement(`Widgeten är nu ${size}-storlek.`)
  }, [effectiveLayout, saveDebounced])

  const resetLayout = useCallback(() => {
    const fresh = getDefaultLayout(HUB_ID, breakpoint)
    save(fresh)
    setAnnouncement('Layout återställd')
  }, [breakpoint, save])

  const layoutValue: MinVardagLayoutValue = useMemo(() => ({
    layout: effectiveLayout,
    editMode,
    setEditMode,
    hideWidget,
    showWidget,
    updateSize,
    resetLayout,
    isLoading,
  }), [effectiveLayout, editMode, hideWidget, showWidget, updateSize, resetLayout, isLoading])

  // Hub-summary loader
  const { data: summary } = useMinVardagHubSummary()

  // "Anpassa vy" button — placed in PageLayout actions slot
  const customizeButton = (
    <button
      type="button"
      onClick={() => {
        setEditMode(prev => !prev)
        setPanelOpen(prev => !prev)
      }}
      aria-pressed={editMode}
      aria-expanded={panelOpen}
      aria-controls="hidden-widgets-panel"
      className={[
        'inline-flex items-center gap-2 px-3 py-1.5',
        'text-[13px] font-bold rounded-[8px] border',
        editMode
          ? 'bg-[var(--c-bg)] text-[var(--c-text)] border-[var(--c-solid)]'
          : 'bg-transparent text-[var(--header-text)] border-[var(--header-border)]',
        'hover:bg-[var(--c-bg)] hover:text-[var(--c-text)]',
        'focus:outline-none focus:shadow-[0_0_0_3px_var(--header-bg),0_0_0_4px_var(--c-solid)]',
        'cursor-pointer',
      ].join(' ')}
    >
      <SlidersHorizontal size={14} aria-hidden="true" />
      Anpassa vy
    </button>
  )

  return (
    <PageLayout
      title={t('nav.hubs.min-vardag', 'Min Vardag')}
      subtitle={t(
        'hubs.min-vardag.subtitle',
        'Vardagsstöd och balans — hälsa, dagbok, kalender, nätverk och din konsulent'
      )}
      domain="wellbeing"
      showTabs={false}
      actions={customizeButton}
    >
      <MinVardagLayoutProvider value={layoutValue}>
        <MinVardagDataProvider value={summary}>
          {/* Live region for screen readers */}
          <div role="status" aria-live="polite" className="sr-only">
            {announcement}
          </div>

          {/* Hidden widgets panel — props-based (hub-agnostic after Plan 01 refactor). */}
          <div className="relative" id="hidden-widgets-panel">
            <HiddenWidgetsPanel
              isOpen={panelOpen}
              onClose={() => setPanelOpen(false)}
              layout={effectiveLayout}
              onShowWidget={showWidget}
              onResetLayout={resetLayout}
            />
          </div>

          {sections.map(section => (
            <HubGrid.Section key={section.title} title={section.title}>
              {section.items.map(item => {
                const entry = WIDGET_REGISTRY[item.id as WidgetId]
                if (!entry) return null
                const Component = entry.component
                const persisted = layoutById.get(item.id)
                const currentSize: WidgetSize = persisted?.size ?? entry.defaultSize
                const isVisible = persisted?.visible !== false

                return (
                  <HubGrid.Slot
                    key={item.id}
                    size={currentSize}
                    visible={isVisible}
                  >
                    <Component
                      id={item.id}
                      size={currentSize}
                      onSizeChange={(newSize) => updateSize(item.id, newSize)}
                      allowedSizes={entry.allowedSizes}
                      editMode={editMode}
                      onHide={() => hideWidget(item.id)}
                    />
                  </HubGrid.Slot>
                )
              })}
            </HubGrid.Section>
          ))}
        </MinVardagDataProvider>
      </MinVardagLayoutProvider>
    </PageLayout>
  )
}
