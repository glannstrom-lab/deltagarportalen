/**
 * Network Page - Professional network management
 * Extracted from Career page for easier access
 */
import { useTranslation } from 'react-i18next'
import { PageLayout } from '@/components/layout/index'
import NetworkTab from './career/NetworkTab'
import { HelpButton } from '@/components/HelpButton'

export default function NetworkPage() {
  const { t } = useTranslation()

  const helpContent = {
    title: t('network.help.title', 'Om Nätverk'),
    description: t('network.help.description', 'Bygg och underhåll ditt professionella nätverk för att öka dina chanser att hitta jobb.'),
    sections: [
      {
        title: t('network.help.contacts', 'Kontakter'),
        content: t('network.help.contactsContent', 'Lägg till och hantera dina professionella kontakter. Sätt påminnelser för att följa upp.'),
      },
      {
        title: t('network.help.events', 'Nätverksevent'),
        content: t('network.help.eventsContent', 'Håll koll på kommande nätverksträffar, mässor och andra event.'),
      },
      {
        title: t('network.help.templates', 'Meddelandemallar'),
        content: t('network.help.templatesContent', 'Använd färdiga mallar för att kontakta dina kontakter på ett professionellt sätt.'),
      },
    ],
  }

  return (
    <>
      <PageLayout
        title={t('network.title', 'Nätverk')}
        description={t('network.description', 'Bygg och underhåll ditt professionella kontaktnät')}
        className="max-w-6xl mx-auto"
      >
        <NetworkTab />
      </PageLayout>
      <HelpButton content={helpContent} />
    </>
  )
}
