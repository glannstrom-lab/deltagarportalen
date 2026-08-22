/**
 * Applications Page
 * Dedicated page for tracking and managing job applications
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
  Kanban, Clock, Calendar, Users, BarChart3, Plus, ClipboardList
} from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { Button } from '@/components/ui'
import { useFocusMode } from '@/components/FocusModeProvider'
import { FocusApplicationsWizard } from '@/components/focus/pages/FocusApplicationsWizard'

// Import application components
import { ApplicationsPipeline } from '@/components/applications/ApplicationsPipeline'
import { ApplicationsTimeline } from '@/components/applications/ApplicationsTimeline'
import { ApplicationsCalendar } from '@/components/applications/ApplicationsCalendar'
import { ApplicationsContacts } from '@/components/applications/ApplicationsContacts'
import { ApplicationsAnalytics } from '@/components/applications/ApplicationsAnalytics'
import { AddApplicationModal } from '@/components/applications/AddApplicationModal'
import { ApplicationDetailModal } from '@/components/applications/ApplicationDetailModal'
import type { Application } from '@/types/application.types'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

// Tab definitions with i18n keys
const applicationTabDefs = [
  { id: 'pipeline', labelKey: 'applications.tabs.pipeline', path: '/applications', icon: Kanban },
  { id: 'timeline', labelKey: 'applications.tabs.timeline', path: '/applications/timeline', icon: Clock },
  { id: 'calendar', labelKey: 'applications.tabs.calendar', path: '/applications/calendar', icon: Calendar },
  { id: 'contacts', labelKey: 'applications.tabs.contacts', path: '/applications/contacts', icon: Users },
  { id: 'analytics', labelKey: 'applications.tabs.analytics', path: '/applications/analytics', icon: BarChart3 },
]

// Pipeline tab wrapper with actions
function PipelineWrapper({
  onAddApplication,
  onViewApplication,
  onEditApplication
}: {
  onAddApplication: () => void
  onViewApplication: (app: Application) => void
  onEditApplication: (app: Application) => void
}) {
  return (
    <>
      <ApplicationsPipeline
        onAddApplication={onAddApplication}
        onViewApplication={onViewApplication}
        onEditApplication={onEditApplication}
      />
      <RadgivarTips pathname="/applications" index={0} />
    </>
  )
}

export default function Applications() {
  const { t } = useTranslation()
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('applications.title', 'Ansökningar')}
      icon={ClipboardList}
      domain="activity"
      guide={<FocusApplicationsWizard onExit={leaveWizard} />}
    >
      <ApplicationsInner />
    </FokusVaxel>
  )
}

function ApplicationsInner() {
  useLocation()
  const { t } = useTranslation()

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [editApplication, setEditApplication] = useState<Application | null>(null)

  // Build tabs with translated labels
  const applicationTabs = applicationTabDefs.map((tab) => ({
    ...tab,
    label: t(tab.labelKey, tab.id.charAt(0).toUpperCase() + tab.id.slice(1)),
  }))

  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app)
  }

  const handleEditApplication = (app: Application) => {
    setEditApplication(app)
    setShowAddModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setEditApplication(null)
  }

  return (
    <>
      <PageLayout
        title={t('applications.title', 'Mina Ansökningar')}
        subtitle={t('applications.subtitle', 'Följ dina jobbansökningar genom hela processen')}
        tabs={applicationTabs}
        tabVariant="glass"
        domain="activity"
        className="sidbredd"
        actions={
          // `hidden sm:flex` låg här till 2026-08-19 och var kvar sedan
          // hjälte-tiden, då `actions` bara ritades på breda skärmar. Efter
          // omläggningen renderar PageLayout `actions` på ALLA bredder — så
          // klassen gjorde numera bara att den som är under 640 px inte kunde
          // skapa en ansökan från fyra av fem flikar. Pipeline-fliken hade en
          // egen knapp; de andra hade ingenting.
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('applications.addApplication', 'Ny ansökan')}
          </Button>
        }
      >
        <Routes>
          <Route
            index
            element={
              <PipelineWrapper
                onAddApplication={() => setShowAddModal(true)}
                onViewApplication={handleViewApplication}
                onEditApplication={handleEditApplication}
              />
            }
          />
          <Route path="timeline" element={<ApplicationsTimeline />} />
          <Route path="calendar" element={<ApplicationsCalendar />} />
          <Route path="contacts" element={<ApplicationsContacts />} />
          <Route path="analytics" element={<ApplicationsAnalytics />} />
          <Route path="*" element={<Navigate to="/applications" replace />} />
        </Routes>
      </PageLayout>

      {/* `data-domain` sätts av PageLayout på sitt EGET yttre element, och
          modalerna nedan är syskon till det — inte barn. Utan den här
          wrappern faller alltså `--c-solid` tillbaka på rotens standardvärde
          (mint, Översiktens färg), och mätning i drift 2026-08-19 visade
          precis det: sidans knapp rgb(168,93,36) mot modalens rgb(26,119,87).
          En sida = en hub-färg gäller även det som ritas ovanpå sidan. */}
      <div data-domain="activity" className="contents">

      {/* Detaljmodalen renderas FÖRE redigeringsmodalen.
          Båda är `fixed z-50` i samma stackningskontext, så den som ritas sist
          hamnar överst. I omvänd ordning (till 2026-08-19) öppnade "Redigera"
          en dialog BAKOM detaljvyn: fokus hoppade in i något osynligt, och
          fokusfällan stängde den vid första klick. `suspended` gjorde rätt sak
          hela tiden — den byggde bara på fel antagande om målningsordningen. */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onEdit={handleEditApplication}
          suspended={showAddModal}
        />
      )}

      {/* Skapa/redigera ansökan */}
      <AddApplicationModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        editApplication={editApplication}
      />

      </div>
    </>
  )
}
