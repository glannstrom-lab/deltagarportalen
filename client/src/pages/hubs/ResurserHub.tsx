import { PageLayout } from '@/components/layout/PageLayout'
import { useTranslation } from 'react-i18next'

/**
 * Resurser hub — placeholder.
 * Phase 1 ships only the navigation shell. Widgets land in Phase 2 (WIDG-01..03).
 * Domain: info (drives --c-* tokens via PageLayout's data-domain attribute).
 */
export default function ResurserHub() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title={t('nav.hubs.resurser', 'Resurser')}
      subtitle={t('hubs.resurser.subtitle', 'Kunskapsbank, dokument och externa stöd')}
      domain="info"
      showTabs={false}
    >
      <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-8 text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t('hubs.placeholder', 'Här kommer widgets för Resurser. Den här sidan byggs ut i nästa fas.')}
        </p>
      </div>
    </PageLayout>
  )
}
