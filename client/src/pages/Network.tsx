/**
 * Network Page - Professional network management
 * Extracted from Career page for easier access
 */
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import NetworkTab from './career/NetworkTab'

export default function NetworkPage() {
  const { t } = useTranslation()

  return (
    <PageLayout
      title={t('network.title', 'Nätverk')}
      description={t('network.description', 'Bygg och underhåll ditt professionella kontaktnät')}
      className="max-w-6xl mx-auto"
      domain="activity"
    >
      <NetworkTab />
    </PageLayout>
  )
}
