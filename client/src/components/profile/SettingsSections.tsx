/**
 * Notissektionen på profilsidans Inställningar-flik.
 *
 * ## Vad som stod här före 2026-08-26, och varför det är borta
 *
 * Filen innehöll två paneler med tillsammans 28 reglage. Ingen av dem gjorde
 * något, och båda visade råa i18n-nycklar i gränssnittet:
 *
 * - **Notifikationer** — tio reglage (`email_job_matches`, `push_enabled`,
 *   `digest_frequency` m.fl.) som skrevs till `notification_settings`.
 *   Tabellen har **0 rader i prod** och **ingen avsändare läser den**.
 *   Jobbevakningens mejl styrs av `job_alerts.notification_frequency`, inte av
 *   de här värdena. Push fanns inte alls: noll träffar på `pushManager`,
 *   `VAPID` eller `PushSubscription` i hela repot.
 * - **Synlighet** — arton reglage mot `visibility_settings` (1 rad i prod),
 *   som heller ingen läser. Den riktiga delningskontrollen, `ProfileSharing`
 *   med delningskoder och QR, ligger redan högst upp på **samma sida**, och
 *   samtycket till att dela med konsulenten bor i `DataSharingSettings` på
 *   /settings.
 *
 * Etiketterna anropade `t('profile.settings.…')` — en nyckelväg som saknas i
 * både `sv.json` och `en.json`. i18next returnerar då nyckeln, så användaren
 * såg texten `profile.settings.emailNotifications` på skärmen. Verifierat mot
 * den riktiga i18n-instansen, inte gissat.
 *
 * Det som står här nu är det portalen faktiskt gör. Regeln ur granskningen
 * 2026-08-09: hellre en rad om varför något saknas än ett reglage som ljuger.
 */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Bell, Mail, ArrowRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettingsSection({ className }: NotificationSettingsProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-sm text-stone-600 dark:text-stone-300">
        {t('profile.notiser.intro')}
      </p>

      <ul className="space-y-3">
        <li className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          <Mail className="w-4 h-4 mt-0.5 text-[var(--c-solid)] flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {t('profile.notiser.mejlTitel')}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('profile.notiser.mejlText')}
            </p>
          </div>
        </li>

        <li className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
          <Bell className="w-4 h-4 mt-0.5 text-[var(--c-solid)] flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              {t('profile.notiser.klockanTitel')}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('profile.notiser.klockanText')}
            </p>
          </div>
        </li>
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to="/job-search/alerts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-solid)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]/40 rounded"
        >
          {t('profile.notiser.tillBevakningar')}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <span className="hidden sm:inline text-stone-300 dark:text-stone-600" aria-hidden="true">
          ·
        </span>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-solid)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)]/40 rounded"
        >
          {t('profile.notiser.tillHuvudbrytare')}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
