/**
 * DarkModeToggle Component
 * Växla mellan ljust och mörkt läge
 * UPPDATERAD: Använder ThemeContext
 */

import { Moon, Sun, Monitor } from '@/components/ui/icons'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface DarkModeToggleProps {
  variant?: 'button' | 'segmented' | 'simple'
  size?: 'sm' | 'md' | 'lg'
  showSystem?: boolean
  className?: string
}

export function DarkModeToggle({ 
  variant = 'button',
  size = 'md',
  showSystem = true,
  className
}: DarkModeToggleProps) {
  const { theme, setTheme, isDark } = useTheme()

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  }

  // Enkel knapp-variant
  if (variant === 'simple') {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn(
          'flex items-center justify-center rounded-lg transition-all duration-200',
          'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
          sizeClasses[size],
          isDark 
            ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' 
            : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
          className
        )}
        aria-label={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
        title={isDark ? 'Ljust läge' : 'Mörkt läge'}
      >
        {isDark ? (
          <Sun size={iconSizes[size]} aria-hidden="true" />
        ) : (
          <Moon size={iconSizes[size]} aria-hidden="true" />
        )}
      </button>
    )
  }

  // Segmented control-variant
  if (variant === 'segmented') {
    return (
      <div className={cn(
        'inline-flex items-center rounded-lg border border-stone-200 dark:border-stone-700',
        'bg-stone-100 dark:bg-stone-800 p-1',
        className
      )}>
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all',
            theme === 'light'
              ? 'bg-white dark:bg-stone-700 text-violet-600 shadow-sm'
              : 'text-stone-600 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200'
          )}
          aria-pressed={theme === 'light'}
        >
          <Sun size={14} />
          <span className="text-sm font-medium">Ljust</span>
        </button>
        
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all',
            theme === 'dark'
              ? 'bg-white dark:bg-stone-700 text-violet-600 shadow-sm'
              : 'text-stone-600 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200'
          )}
          aria-pressed={theme === 'dark'}
        >
          <Moon size={14} />
          <span className="text-sm font-medium">Mörkt</span>
        </button>
        
        {showSystem && (
          <button
            onClick={() => setTheme('system')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all',
              theme === 'system'
                ? 'bg-white dark:bg-stone-700 text-violet-600 shadow-sm'
                : 'text-stone-600 dark:text-stone-600 hover:text-stone-900 dark:hover:text-stone-200'
            )}
            aria-pressed={theme === 'system'}
          >
            <Monitor size={14} />
            <span className="text-sm font-medium">Auto</span>
          </button>
        )}
      </div>
    )
  }

  // Standard button-variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-violet-500',
          sizeClasses[size],
          isDark 
            ? 'bg-stone-800 text-stone-200' 
            : 'bg-stone-100 text-stone-700'
        )}
        aria-label={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
        aria-pressed={isDark}
      >
        {isDark ? (
          <>
            <Moon size={iconSizes[size]} aria-hidden="true" />
            <span className="font-medium">Mörkt</span>
          </>
        ) : (
          <>
            <Sun size={iconSizes[size]} aria-hidden="true" />
            <span className="font-medium">Ljust</span>
          </>
        )}
      </button>
      
      {showSystem && theme !== 'system' && (
        <button
          onClick={() => setTheme('system')}
          className="text-xs text-stone-600 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 underline"
          aria-label="Återställ till systeminställning"
        >
          System
        </button>
      )}
    </div>
  )
}

// Compact variant för header/navbar
export function DarkModeToggleCompact({ className }: { className?: string }) {
  const { isDark, toggleDarkMode } = useTheme()

  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        'p-2 rounded-lg transition-all duration-200',
        'hover:bg-stone-100 dark:hover:bg-stone-800',
        'focus:outline-none focus:ring-2 focus:ring-violet-500',
        className
      )}
      aria-label={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
      title={isDark ? 'Ljust läge' : 'Mörkt läge'}
    >
      {isDark ? (
        <Sun size={20} className="text-stone-200" />
      ) : (
        <Moon size={20} className="text-stone-600" />
      )}
    </button>
  )
}

export default DarkModeToggle
