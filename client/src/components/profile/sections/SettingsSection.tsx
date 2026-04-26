/**
 * SettingsSection - Sharing, notifications, visibility settings
 * Clean design with improved visual hierarchy
 */

import { useTranslation } from 'react-i18next'
import { Share2, Bell, Eye, Lightbulb } from '@/components/ui/icons'
import { SectionCard } from '../forms'
import {
  ProfileSharing,
  NotificationSettingsSection,
  VisibilitySettingsSection
} from '../index'

export function SettingsSection() {
  const { t } = useTranslation()

  return (
    <div
      role="tabpanel"
      id="tabpanel-installningar"
      aria-labelledby="tab-installningar"
      className="grid gap-4 lg:grid-cols-2"
    >
      {/* Profile Sharing */}
      <SectionCard
        title={t('profile.settingsSection.shareProfile')}
        icon={<Share2 className="w-4 h-4" />}
        colorScheme="teal"
        className="lg:col-span-2"
      >
        <ProfileSharing />
      </SectionCard>

      {/* Sharing tips */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 lg:col-span-2">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('profile.settingsSection.sharingTips')}
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 mt-2 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {t('profile.settingsSection.tip1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {t('profile.settingsSection.tip2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {t('profile.settingsSection.tip3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                {t('profile.settingsSection.tip4')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <SectionCard
        title={t('profile.settingsSection.notifications')}
        icon={<Bell className="w-4 h-4" />}
        colorScheme="teal"
      >
        <NotificationSettingsSection />
      </SectionCard>

      {/* Visibility Settings */}
      <SectionCard
        title={t('profile.settingsSection.visibility')}
        icon={<Eye className="w-4 h-4" />}
        colorScheme="sky"
      >
        <VisibilitySettingsSection />
      </SectionCard>
    </div>
  )
}
