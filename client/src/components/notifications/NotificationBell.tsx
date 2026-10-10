/**
 * NotificationBell Component
 * Real-time notification bell with dropdown and category filtering
 */

import { useState, useRef, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  MessageCircle,
  Briefcase,
  MessageSquare,
  UserPlus,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  Check,
  Trash2,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useNotifications, notificationConfig } from '@/hooks/useNotifications'
import type { Notification, NotificationType } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { sv, enGB } from 'date-fns/locale'

// ============================================
// TYPES
// ============================================

interface NotificationBellProps {
  className?: string
  variant?: 'default' | 'compact'
}

type CategoryFilter = 'all' | NotificationType

export const NOTIS_INTERVALL_MS = 60_000

// ============================================
// ICON MAP
// ============================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Briefcase,
  MessageSquare,
  UserPlus,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
}

/**
 * AG6 (2026-09-13): `type` kommer ur databasen, och en trigger kan skriva en
 * typ klienten inte känner ännu (deployordning: migration före frontend).
 * Utan fallback kastade `config.icon` på undefined och hela klockan föll.
 */
function konfigFor(type: NotificationType) {
  return notificationConfig[type] ?? notificationConfig.info
}

function getNotificationIcon(type: NotificationType) {
  const config = konfigFor(type)
  const IconComponent = iconMap[config.icon] || Info
  return <IconComponent className={cn('w-4 h-4', config.color)} />
}

// ============================================
// NOTIFICATION ITEM
// ============================================

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: () => void
  locale: string
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  locale,
}: NotificationItemProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const config = konfigFor(notification.type)

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      // action_url lagras UTAN brädgård ('/foretag/forslag'); react-routers
      // navigate lägger själv på '#' under HashRouter. Skulle en rad ändå bära
      // '#/…' hade navigate tolkat det som ett fragment på nuvarande sida.
      navigate(notification.action_url.replace(/^#/, ''))
    }
    onClick?.()
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: locale === 'sv' ? sv : enGB,
  })

  return (
    // Rubriken är knappen, och dess ::after täcker kortet så hela ytan går att
    // trycka på. Fram till 2026-10-10 var kortet en <div role="button"> med en
    // länk och två knappar inuti — nästlade kontroller som en skärmläsare inte
    // kan skilja åt — och åtgärderna syntes bara vid muspekare, aldrig på mobil.
    <div
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl transition-colors',
        notification.read
          ? 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
          : 'bg-[var(--c-bg)]/50 dark:bg-[var(--c-bg)]/20 hover:bg-[var(--c-accent)]/40/50 dark:hover:bg-[var(--c-bg)]/40'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={handleClick}
            // Inline: mobile.css ger varje knapp 48 px och ligger utanför
            // Tailwinds lager — en rubrikrad ska inte bli en knapphöjd hög.
            style={{ minHeight: 0, minWidth: 0 }}
            className={cn(
              'text-left text-sm font-medium leading-snug',
              "after:absolute after:inset-0 after:rounded-xl after:content-['']",
              'focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--c-solid)]',
              notification.read
                ? 'text-stone-700 dark:text-stone-300'
                : 'text-stone-900 dark:text-stone-100'
            )}
          >
            {notification.title}
          </button>
          {!notification.read && (
            <>
              {/* aria-label på en span utan roll läses inte upp (aria-prohibited-attr) */}
              <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-[var(--c-solid)] rounded-full" aria-hidden="true" />
              <span className="sr-only">{t('notificationBell.aria.unread', 'Oläst')}</span>
            </>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        {/* F3 (2026-09-13): påminnelsen bär platsen i data.location — en kartlänk är
            det som skiljer "Hjernet, Malmgatan 4" som text från något man kan gå till.
            stopPropagation så klicket inte också navigerar till Min vecka. */}
        {notification.type === 'aktivitet_paminnelse' && typeof notification.data?.location === 'string' && notification.data.location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(notification.data.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-block mt-1 text-xs underline underline-offset-2 text-[var(--c-text)]"
          >
            {t('notificationBell.paminnelse.karta', 'Visa {{plats}} på karta', { plats: notification.data.location })}
          </a>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {timeAgo}
          </p>

          {/* Åtgärderna: alltid synliga på mobil (ingen muspekare att hålla över),
              på större skärm vid hovring eller tangentbordsfokus. */}
          <div
            className="relative z-10 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          >
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="p-1.5 rounded-lg bg-white dark:bg-stone-700 shadow-sm hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                title={t('notificationBell.aria.markAsRead', 'Markera som läst')}
                aria-label={t('notificationBell.aria.markAsRead', 'Markera som läst')}
              >
                <Check className="w-4 h-4 text-green-700 dark:text-green-400" aria-hidden="true" />
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="p-1.5 rounded-lg bg-white dark:bg-stone-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              title={t('common.remove', 'Ta bort')}
              aria-label={t('notificationBell.aria.deleteNotification', 'Ta bort notifikation')}
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CATEGORY TAB
// ============================================

interface CategoryTabProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function CategoryTab({ label, count, active, onClick }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // RD10: shrink-0 — i den scrollande raden krympte flikarna annars under
        // sin text och flöt ihop ("MeddelandenJobb") på mobil.
        'shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap',
        active
          ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)]'
          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
      )}
      aria-pressed={active}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            'ml-1.5 px-1.5 py-0.5 text-[0.625rem] font-bold rounded-full',
            active
              ? 'bg-[var(--c-accent)]/60 dark:bg-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-text)]'
              : 'bg-stone-200 dark:bg-stone-600 text-stone-600 dark:text-stone-300'
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NotificationBell({ className }: NotificationBellProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const labelId = useId()

  const {
    notifications,
    unreadCount,
    unreadByCategory,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications()

  // FT3: Realtime-kanalen i useNotifications levererar inget i drift —
  // `notifications` ligger inte i publikationen supabase_realtime (mätt 2026-09-29,
  // pg_publication_tables är tom), så klockan visste aldrig om en ny notis förrän
  // sidan laddades om. Tills tabellen läggs i publikationen hämtar klockan själv:
  // när fliken blir synlig/fokuserad igen, och var 60:e sekund medan den syns.
  useEffect(() => {
    const uppdatera = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const intervall = window.setInterval(uppdatera, NOTIS_INTERVALL_MS)
    document.addEventListener('visibilitychange', uppdatera)
    window.addEventListener('focus', uppdatera)
    return () => {
      window.clearInterval(intervall)
      document.removeEventListener('visibilitychange', uppdatera)
      window.removeEventListener('focus', uppdatera)
    }
  }, [refresh])

  // Filter notifications by category
  const filteredNotifications =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeFilter)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleClose = () => setIsOpen(false)

  // RD10: var klockan faktiskt står (demobannern flyttar ner toppraden).
  const [panelTopp, setPanelTopp] = useState<number | null>(null)
  const oppnaEllerStang = () => {
    if (!isOpen && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setPanelTopp(r.bottom > 0 ? Math.round(r.bottom + 8) : null)
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={oppnaEllerStang}
        className={cn(
          'relative flex items-center justify-center transition-colors focus:outline-none',
          'w-9 h-9 rounded-full',
          'hover:bg-stone-100 dark:hover:bg-stone-800',
          isOpen && 'bg-stone-100 dark:bg-stone-800'
        )}
        aria-label={unreadCount > 0 ? t('notificationBell.aria.unreadCount', { count: unreadCount }) : t('notificationBell.aria.notifications')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? labelId : undefined}
      >
        <Bell
          size={20}
          className="text-stone-500 dark:text-stone-400"
          aria-hidden="true"
        />
      </button>
      {/* Unread indicator - outside button for better positioning */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          {/* emerald-700, inte -500: vit 10 px text på emerald-500 = 2,47:1 (axe, 2026-09-24).
              Syntes först när testkontot hade olästa notiser. */}
          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-700 items-center justify-center text-[0.625rem] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={handleClose} aria-hidden="true" />

          {/* Panel */}
          <div
            ref={dropdownRef}
            id={labelId}
            role="dialog"
            aria-label={t('notificationBell.aria.notifications', 'Notifikationer')}
            style={panelTopp !== null ? ({ '--notispanel-topp': `${panelTopp}px` } as React.CSSProperties) : undefined}
            className={cn(
              // RD10: på mobil stack panelen (absolute right-0, w-80 från klockan
              // mitt i toppraden) ut till vänster om skärmen. Under sm ligger den
              // fast mellan skärmens kanter, strax under klockan.
              'fixed inset-x-2 top-[var(--notispanel-topp,4.5rem)] z-50',
              'sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2',
              'sm:w-96 max-h-[80vh]',
              'bg-white dark:bg-stone-800 rounded-2xl',
              'shadow-xl border border-stone-100 dark:border-stone-700',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-100 dark:border-stone-700">
              {/* Rubriken står hel; det är knapptexten som får bryta rad. Med
                  truncate på rubriken stod det "Notifikati…" på 390 px. */}
              <h2 className="shrink-0 font-semibold text-stone-800 dark:text-stone-100">
                {t('notificationBell.aria.notifications', 'Notifikationer')}
              </h2>
              <div className="flex min-w-0 items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-right leading-tight text-xs text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-text)] font-medium"
                  >
                    {t('notificationBell.markAllRead', 'Markera alla som lästa')}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  aria-label={t('notificationBell.aria.close', 'Stäng')}
                >
                  <X className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-stone-100 dark:border-stone-700 overflow-x-auto scrollbar-hide">
              <CategoryTab
                label="Alla"
                count={unreadByCategory.total}
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
              />
              <CategoryTab
                label="Meddelanden"
                count={unreadByCategory.message}
                active={activeFilter === 'message'}
                onClick={() => setActiveFilter('message')}
              />
              <CategoryTab
                label="Jobb"
                count={unreadByCategory.job_match}
                active={activeFilter === 'job_match'}
                onClick={() => setActiveFilter('job_match')}
              />
              {/* RD10: "Diskussioner" och "Vänner" togs bort — portalen har ingen
                  sådan funktion för deltagaren. Notiser av de typerna syns ändå under "Alla". */}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--c-solid)] border-t-transparent" />
                </div>
              ) : error && notifications.length === 0 ? (
                // Ett hämtfel är inte "inga notiser". Utan den här grenen sa
                // listan "Inga notifikationer" när frågan föll — samma fel som
                // Översikt hade med "du har inte börjat söka jobb än".
                <p role="alert" className="text-center py-8 px-4 text-sm text-red-700 dark:text-red-300">
                  {t('errors.loadFailed')}
                </p>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                  <p className="text-stone-500 dark:text-stone-400 text-sm">
                    {activeFilter === 'all'
                      ? 'Inga notifikationer'
                      : `Inga ${notificationConfig[activeFilter as NotificationType]?.label?.toLowerCase() || 'notifikationer'}`}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleClose}
                    locale={i18n.language}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-700">
                <Link
                  to="/settings"
                  className="block text-center text-xs text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)]"
                  onClick={handleClose}
                >
                  Hantera notifikationsinställningar
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
