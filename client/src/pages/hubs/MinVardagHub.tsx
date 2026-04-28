import { PageLayout } from '@/components/layout/PageLayout'
import { useTranslation } from 'react-i18next'

/**
 * Min vardag hub — placeholder.
 * Phase 1 ships only the navigation shell. Widgets land in Phase 2 (WIDG-01..03).
 * Domain: wellbeing (drives --c-* tokens via PageLayout's data-domain attribute).
 */
export default function MinVardagHub() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title={t('nav.hubs.min-vardag', 'Min vardag')}
      subtitle={t('hubs.min-vardag.subtitle', 'Hälsa, dagbok, kalender och din konsulent')}
      domain="wellbeing"
      showTabs={false}
    >
      <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-8 text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t('hubs.placeholder', 'Här kommer widgets för Min vardag. Den här sidan byggs ut i nästa fas.')}
        </p>
      </div>
    </PageLayout>
  )
}
