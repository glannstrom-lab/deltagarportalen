/**
 * SettingsSection - Sharing, notifications, visibility settings
 * Combines: Dela + Inställningar tabs
 */

import { useTranslation } from 'react-i18next'
import { Share2, Bell, Eye, AlertCircle } from '@/components/ui/icons'
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
      className="grid gap-4 md:grid-cols-2"
    >
      {/* Profile Sharing */}
      <SectionCard
        title={t('profile.settingsSection.shareProfile')}
        icon={<Share2 className="w-4 h-4" />}
        colorScheme="brand"
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
              {t('profile.settingsSection.sharingTips')}
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 space-y-1">
              <li>• {t('profile.settingsSection.tip1')}</li>
              <li>• {t('profile.settingsSection.tip2')}</li>
              <li>• {t('profile.settingsSection.tip3')}</li>
              <li>• {t('profile.settingsSection.tip4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <SectionCard
        title={t('profile.settingsSection.notifications')}
        icon={<Bell className="w-4 h-4" />}
        colorScheme="brand"
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
