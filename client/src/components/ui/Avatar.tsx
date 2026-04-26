/**
 * Avatar Component
 * User avatar with fallback initials
 * Follows DESIGN.md: rounded-full, brand colors, no shadows
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { User } from '@/components/ui/icons'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: AvatarSize
  className?: string
  fallbackClassName?: string
  showOnlineStatus?: boolean
  isOnline?: boolean
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: number; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 12, status: 'w-1.5 h-1.5 border' },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 14, status: 'w-2 h-2 border' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 18, status: 'w-2.5 h-2.5 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', icon: 22, status: 'w-3 h-3 border-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', icon: 28, status: 'w-3.5 h-3.5 border-2' },
  '2xl': { container: 'w-24 h-24', text: 'text-2xl', icon: 40, status: 'w-4 h-4 border-2' },
}

// Generate consistent color from name
function getColorFromName(name: string): string {
  const colors = [
    'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  ]

  // Simple hash function
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
function getInitials(name?: string): string {
  if (!name) return ''

  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  fallbackClassName,
  showOnlineStatus = false,
  isOnline = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const styles = sizeStyles[size]
  const initials = getInitials(name)
  const colorClass = name ? getColorFromName(name) : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'

  const showImage = src && !imageError

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-medium',
          styles.container,
          !showImage && colorClass,
          fallbackClassName
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <span className={styles.text}>{initials}</span>
        ) : (
          <User size={styles.icon} className="opacity-60" />
        )}
      </div>

      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white dark:border-stone-900',
            styles.status,
            isOnline ? 'bg-brand-500' : 'bg-stone-400'
          )}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
}

// Avatar Group - For showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null
    name?: string
    alt?: string
  }>
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max
  const styles = sizeStyles[size]

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white dark:ring-stone-900"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium',
            'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300',
            'ring-2 ring-white dark:ring-stone-900',
            styles.container,
            styles.text
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Avatar with Name - Common pattern for user displays
interface AvatarWithNameProps extends AvatarProps {
  subtitle?: string
  action?: React.ReactNode
}

export function AvatarWithName({
  name,
  subtitle,
  action,
  size = 'md',
  ...avatarProps
}: AvatarWithNameProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size={size} {...avatarProps} />
      <div className="min-w-0 flex-1">
        {name && (
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
            {name}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export default Avatar
