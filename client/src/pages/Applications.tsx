/**
 * Applications Page
 * Dedicated page for tracking and managing job applications
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
  Kanban, Clock, Calendar, Users, BarChart3, Plus
} from '@/components/ui/icons'
import { PageLayout } from '@/components/layout/index'
import { Button } from '@/components/ui'
import { HelpButton } from '@/components/HelpButton'
import { helpContent } from '@/data/helpContent'

// Import application components
import { ApplicationsPipeline } from '@/components/applications/ApplicationsPipeline'
import { ApplicationsTimeline } from '@/components/applications/ApplicationsTimeline'
import { ApplicationsCalendar } from '@/components/applications/ApplicationsCalendar'
import { ApplicationsContacts } from '@/components/applications/ApplicationsContacts'
import { ApplicationsAnalytics } from '@/components/applications/ApplicationsAnalytics'
import { AddApplicationModal } from '@/components/applications/AddApplicationModal'
import { ApplicationDetailModal } from '@/components/applications/ApplicationDetailModal'
import type { Application } from '@/types/application.types'

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
    <ApplicationsPipeline
      onAddApplication={onAddApplication}
      onViewApplication={onViewApplication}
      onEditApplication={onEditApplication}
    />
  )
}

export default function Applications() {
  const location = useLocation()
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
        className="max-w-7xl mx-auto"
        headerActions={
          <Button onClick={() => setShowAddModal(true)} className="hidden sm:flex">
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

      {/* Add/Edit Application Modal */}
      <AddApplicationModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        editApplication={editApplication}
      />

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onEdit={handleEditApplication}
        />
      )}

      <HelpButton content={helpContent.applications || helpContent.jobSearch} />
    </>
  )
}
