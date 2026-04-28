import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/PageLayout'
import { HubGrid } from '@/components/widgets/HubGrid'
import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
import { getJobbSections } from '@/components/widgets/defaultLayouts'
import type { WidgetSize } from '@/components/widgets/types'
import { useJobsokHubSummary } from '@/hooks/useJobsokHubSummary'
import { JobsokDataProvider } from '@/components/widgets/JobsokDataContext'

/**
 * Söka jobb hub — Phase 2 widget grid.
 * Mock data only; real data wiring lands in Phase 3 (HUB-01).
 * 8 widgets in 3 sections: Skapa & öva | Sök & ansök | Marknad.
 */
export default function JobsokHub() {
  const { t } = useTranslation()
  const sections = useMemo(() => getJobbSections(), [])

  // Initialize sizes from defaults
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() => {
    const initial: Record<string, WidgetSize> = {}
    sections.forEach(section => {
      section.items.forEach(item => {
        initial[item.id] = item.size
      })
    })
    return initial
  })
  const [announcement, setAnnouncement] = useState('')

  const handleSizeChange = useCallback((widgetId: string, newSize: WidgetSize) => {
    setSizes(prev => ({ ...prev, [widgetId]: newSize }))
    setAnnouncement(`Widgeten är nu ${newSize}-storlek.`)
  }, [])

  // PHASE 3: hub-summary loader. Single Supabase entry-point for all 8 widgets.
  // Widgets read data via useJobsokWidgetData(slice) — no direct Supabase imports in widgets.
  const { data: summary } = useJobsokHubSummary()

  return (
    <PageLayout
      title={t('nav.hubs.jobb', 'Söka jobb')}
      subtitle={t('hubs.jobb.subtitle', 'Hitta lediga tjänster, skapa ansökningsmaterial och håll koll på dina ansökningar')}
      domain="activity"
      showTabs={false}
    >
      <JobsokDataProvider value={summary}>
        {/* Live region for screen readers — single source per UI-SPEC accessibility contract */}
        {/* Pitfall D: must NOT be conditionally rendered or remounted on data load */}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>

        {sections.map(section => (
          <HubGrid.Section key={section.title} title={section.title}>
            {section.items.map(item => {
              const entry = WIDGET_REGISTRY[item.id as WidgetId]
              if (!entry) return null
              const Component = entry.component
              const currentSize = sizes[item.id] ?? entry.defaultSize
              return (
                <HubGrid.Slot key={item.id} size={currentSize}>
                  <Component
                    id={item.id}
                    size={currentSize}
                    onSizeChange={(newSize) => handleSizeChange(item.id, newSize)}
                    allowedSizes={entry.allowedSizes}
                    editMode={false}
                  />
                </HubGrid.Slot>
              )
            })}
          </HubGrid.Section>
        ))}
      </JobsokDataProvider>
    </PageLayout>
  )
}
