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
import { useNotifications, Notification, NotificationType, notificationConfig } from '@/hooks/useNotifications'
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

function getNotificationIcon(type: NotificationType) {
  const config = notificationConfig[type]
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
  const navigate = useNavigate()
  const config = notificationConfig[notification.type]

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      navigate(notification.action_url)
    }
    onClick?.()
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: locale === 'sv' ? sv : enGB,
  })

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer',
        notification.read
          ? 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
          : 'bg-violet-50/50 dark:bg-violet-900/20 hover:bg-violet-100/50 dark:hover:bg-violet-900/30'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium leading-snug',
              notification.read
                ? 'text-stone-700 dark:text-stone-300'
                : 'text-stone-900 dark:text-stone-100'
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-violet-500 rounded-full" aria-label="Oläst" />
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-600 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-stone-600 dark:text-stone-500 mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Actions (show on hover) */}
      <div
        className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="p-1.5 rounded-lg bg-white dark:bg-stone-700 shadow-sm hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
            title="Markera som läst"
            aria-label="Markera som läst"
          >
            <Check className="w-3 h-3 text-green-600" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1.5 rounded-lg bg-white dark:bg-stone-700 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          title="Ta bort"
          aria-label="Ta bort notifikation"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// CATEGORY TAB
// ============================================

interface CategoryTabProps {
  category: CategoryFilter
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function CategoryTab({ category, label, count, active, onClick }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap',
        active
          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
          : 'text-stone-600 dark:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700'
      )}
      aria-pressed={active}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            'ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full',
            active
              ? 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200'
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

export function NotificationBell({ className, variant = 'default' }: NotificationBellProps) {
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
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

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

  return (
    <div className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center justify-center rounded-lg transition-colors',
          variant === 'compact' ? 'w-8 h-8' : 'w-9 h-9',
          isOpen
            ? 'bg-violet-100 dark:bg-violet-900/30'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800'
        )}
        aria-label={`Notifikationer${unreadCount > 0 ? ` (${unreadCount} olästa)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? labelId : undefined}
      >
        <Bell
          size={variant === 'compact' ? 16 : 18}
          className={cn(
            isOpen
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-stone-500 dark:text-stone-600'
          )}
          aria-hidden="true"
        />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute bg-red-500 text-white font-bold rounded-full flex items-center justify-center',
              variant === 'compact'
                ? 'top-0.5 right-0.5 w-3.5 h-3.5 text-[8px]'
                : 'top-1 right-1 w-4 h-4 text-[10px]'
            )}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

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
            aria-label="Notifikationer"
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-80 sm:w-96 max-h-[80vh]',
              'bg-white dark:bg-stone-800 rounded-2xl',
              'shadow-xl border border-stone-100 dark:border-stone-700',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-700">
              <h2 className="font-semibold text-stone-800 dark:text-stone-100">
                Notifikationer
              </h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                  >
                    Markera alla som lästa
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  aria-label="Stäng"
                >
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-stone-100 dark:border-stone-700 overflow-x-auto scrollbar-hide">
              <CategoryTab
                category="all"
                label="Alla"
                count={unreadByCategory.total}
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
              />
              <CategoryTab
                category="message"
                label="Meddelanden"
                count={unreadByCategory.message}
                active={activeFilter === 'message'}
                onClick={() => setActiveFilter('message')}
              />
              <CategoryTab
                category="job_match"
                label="Jobb"
                count={unreadByCategory.job_match}
                active={activeFilter === 'job_match'}
                onClick={() => setActiveFilter('job_match')}
              />
              <CategoryTab
                category="discussion"
                label="Diskussioner"
                count={unreadByCategory.discussion}
                active={activeFilter === 'discussion'}
                onClick={() => setActiveFilter('discussion')}
              />
              <CategoryTab
                category="friend_request"
                label="Vänner"
                count={unreadByCategory.friend_request}
                active={activeFilter === 'friend_request'}
                onClick={() => setActiveFilter('friend_request')}
              />
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                  <p className="text-stone-500 dark:text-stone-600 text-sm">
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
                  className="block text-center text-xs text-stone-500 dark:text-stone-600 hover:text-violet-600 dark:hover:text-violet-400"
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
