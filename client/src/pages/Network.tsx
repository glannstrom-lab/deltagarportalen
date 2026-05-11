/**
 * Network Page - Professional network management
 * Extracted from Career page for easier access
 */
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import { Users } from '@/components/ui/icons'
import NetworkTab from './career/NetworkTab'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusNetworkWizard } from '@/components/focus/pages/FocusNetworkWizard'

export default function NetworkPage() {
  const { t } = useTranslation()
  const { isFocusMode, toggleFocusMode } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('network.title', 'Nätverk')}
        icon={Users}
        domain="action"
      >
        <FocusNetworkWizard onExit={toggleFocusMode} />
      </PageFocusShell>
    )
  }

  return (
    <PageLayout
      title={t('network.title', 'Nätverk')}
      description={t('network.description', 'Bygg och underhåll ditt professionella kontaktnät')}
      className="max-w-7xl mx-auto"
      domain="info"
    >
      <NetworkTab />
    </PageLayout>
  )
}
