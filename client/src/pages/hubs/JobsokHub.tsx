import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { HubGrid } from '@/components/widgets/HubGrid'
import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
import { getJobbSections, getDefaultLayout } from '@/components/widgets/defaultLayouts'
import type { WidgetSize, WidgetLayoutItem } from '@/components/widgets/types'
import { useJobsokHubSummary } from '@/hooks/useJobsokHubSummary'
import { JobsokDataProvider } from '@/components/widgets/JobsokDataContext'
import { JobsokLayoutProvider, type JobsokLayoutValue } from '@/components/widgets/JobsokLayoutContext'
import { HiddenWidgetsPanel } from '@/components/widgets/HiddenWidgetsPanel'
import { WIDGET_LABELS } from '@/components/widgets/widgetLabels'
import { useWidgetLayout } from '@/hooks/useWidgetLayout'
import { useBreakpoint } from '@/hooks/useBreakpoint'

/**
 * Söka jobb hub — Phase 4: layout persistence + hide/show.
 * Provider order (locked from 04-CONTEXT.md):
 *   <JobsokLayoutProvider>  ← outer (resolves layout first)
 *     <JobsokDataProvider>  ← inner (data fetch can read visible-widget set)
 */
export default function JobsokHub() {
  const { t } = useTranslation()
  const sections = useMemo(() => getJobbSections(), [])
  const breakpoint = useBreakpoint()

  // Phase 4: persisted layout from Supabase
  const { layout, isLoading, saveDebounced, save } = useWidgetLayout('jobb')

  // Edit-mode is hub-local (locked decision: useState, not Zustand)
  const [editMode, setEditMode] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  // Build a Map<id, WidgetLayoutItem> for quick lookups in render
  const layoutById = useMemo(() => {
    const m = new Map<string, WidgetLayoutItem>()
    for (const item of layout) m.set(item.id, item)
    return m
  }, [layout])

  // Mutators — produce a new layout array and call saveDebounced
  const hideWidget = useCallback((id: string) => {
    const next = layout.map(w => w.id === id ? { ...w, visible: false } : w)
    saveDebounced(next)
    const label = WIDGET_LABELS[id as WidgetId] ?? id
    setAnnouncement(`Widget ${label} dold`)
  }, [layout, saveDebounced])

  const showWidget = useCallback((id: string) => {
    const next = layout.map(w => w.id === id ? { ...w, visible: true } : w)
    saveDebounced(next)
    const label = WIDGET_LABELS[id as WidgetId] ?? id
    setAnnouncement(`Widget ${label} återvisad`)
  }, [layout, saveDebounced])

  const updateSize = useCallback((id: string, size: WidgetSize) => {
    const next = layout.map(w => w.id === id ? { ...w, size } : w)
    saveDebounced(next)
    setAnnouncement(`Widgeten är nu ${size}-storlek.`)
  }, [layout, saveDebounced])

  const resetLayout = useCallback(() => {
    const fresh = getDefaultLayout('jobb', breakpoint)
    // Use save (non-debounced) for reset — user-initiated, immediate persist
    save(fresh)
    setAnnouncement('Layout återställd')
  }, [breakpoint, save])

  const layoutValue: JobsokLayoutValue = useMemo(() => ({
    layout,
    editMode,
    setEditMode,
    hideWidget,
    showWidget,
    updateSize,
    resetLayout,
    isLoading,
  }), [layout, editMode, hideWidget, showWidget, updateSize, resetLayout, isLoading])

  // PHASE 3 carry-over: hub-summary loader unchanged
  const { data: summary } = useJobsokHubSummary()

  // "Anpassa vy" button — actions slot (PageLayout already supports this)
  const customizeButton = (
    <div className="relative">
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
      <div id="hidden-widgets-panel">
        <HiddenWidgetsPanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
        />
      </div>
    </div>
  )

  return (
    <PageLayout
      title={t('nav.hubs.jobb', 'Söka jobb')}
      subtitle={t('hubs.jobb.subtitle', 'Hitta lediga tjänster, skapa ansökningsmaterial och håll koll på dina ansökningar')}
      domain="activity"
      showTabs={false}
      actions={customizeButton}
    >
      <JobsokLayoutProvider value={layoutValue}>
        <JobsokDataProvider value={summary}>
          {/* Live region for screen readers — single source per UI-SPEC accessibility contract */}
          {/* Pitfall F: must NOT be conditionally rendered or remounted on data load */}
          <div role="status" aria-live="polite" className="sr-only">
            {announcement}
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
        </JobsokDataProvider>
      </JobsokLayoutProvider>
    </PageLayout>
  )
}
