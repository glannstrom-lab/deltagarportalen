/**
 * SettingsSection - Sharing, notifications, visibility settings
 * Combines: Dela + Inställningar tabs
 */

import { Share2, Bell, Eye, AlertCircle } from '@/components/ui/icons'
import { SectionCard } from '../forms'
import {
  ProfileSharing,
  NotificationSettingsSection,
  VisibilitySettingsSection
} from '../index'

export function SettingsSection() {
  return (
    <div
      role="tabpanel"
      id="tabpanel-installningar"
      aria-labelledby="tab-installningar"
      className="grid gap-4 md:grid-cols-2"
    >
      {/* Profile Sharing */}
      <SectionCard
        title="Dela din profil"
        icon={<Share2 className="w-4 h-4" />}
        colorScheme="teal"
        className="md:col-span-2"
      >
        <ProfileSharing />
      </SectionCard>

      {/* Sharing tips */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 md:col-span-2">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Tips för delning
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 space-y-1">
              <li>• Skapa olika länkar för olika ändamål (t.ex. per jobbansökan)</li>
              <li>• Sätt en giltighetstid för att kontrollera åtkomst</li>
              <li>• Välj vilka delar av din profil som ska visas</li>
              <li>• Använd QR-koden på visitkort eller CV</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <SectionCard
        title="Notifikationer"
        icon={<Bell className="w-4 h-4" />}
        colorScheme="teal"
      >
        <NotificationSettingsSection />
      </SectionCard>

      {/* Visibility Settings */}
      <SectionCard
        title="Synlighet"
        icon={<Eye className="w-4 h-4" />}
        colorScheme="sky"
      >
        <VisibilitySettingsSection />
      </SectionCard>
    </div>
  )
}
