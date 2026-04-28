import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/PageLayout'
import { HubGrid } from '@/components/widgets/HubGrid'
import { WIDGET_REGISTRY, type WidgetId } from '@/components/widgets/registry'
import { getDefaultLayout } from '@/components/widgets/defaultLayouts'
import type { WidgetSize } from '@/components/widgets/types'

const HUB_ID = 'karriar' as const

/**
 * Karriär hub — Phase 2 stub (1 placeholder widget via HubGrid).
 * Full widget set lands in Phase 5 (HUB-03).
 */
export default function KarriarHub() {
  const { t } = useTranslation()
  const layout = getDefaultLayout(HUB_ID)
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() =>
    Object.fromEntries(layout.map(item => [item.id, item.size]))
  )

  const handleSizeChange = useCallback((widgetId: string, newSize: WidgetSize) => {
    setSizes(prev => ({ ...prev, [widgetId]: newSize }))
  }, [])

  return (
    <PageLayout
      title={t('nav.hubs.karriar', 'Karriär')}
      subtitle={t('hubs.karriar.subtitle', 'Utveckla din karriär — utforska intressen, sätt mål och bygg ditt varumärke')}
      domain="coaching"
      showTabs={false}
    >
      <HubGrid>
        {layout.map(item => {
          const entry = WIDGET_REGISTRY[item.id as WidgetId]
          if (!entry) return null
          const Component = entry.component
          const currentSize = sizes[item.id] ?? entry.defaultSize
          return (
            <HubGrid.Slot key={item.id} size={currentSize}>
              <Component
                id={item.id}
                size={currentSize}
                onSizeChange={(s) => handleSizeChange(item.id, s)}
                allowedSizes={entry.allowedSizes}
                editMode={false}
              />
            </HubGrid.Slot>
          )
        })}
      </HubGrid>
    </PageLayout>
  )
}
