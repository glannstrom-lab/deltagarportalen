/**
 * Logo Component
 * Reusable logo component with different variants
 */

import { cn } from '@/lib/utils'
import { OptimizedImage } from './OptimizedImage'

interface LogoProps {
  variant?: 'full' | 'icon' | 'header'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: {
    container: 'w-8 h-8',
    text: 'text-lg'
  },
  md: {
    container: 'w-12 h-12',
    text: 'text-xl'
  },
  lg: {
    container: 'w-16 h-16',
    text: 'text-2xl'
  },
  xl: {
    container: 'w-24 h-24',
    text: 'text-3xl'
  }
}

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className,
  showText = true 
}: LogoProps) {
  const sizes = sizeClasses[size]

  if (variant === 'icon') {
    return (
      <OptimizedImage
        src="/logo-icon.png"
        alt="Jobin"
        loading="eager"
        className={cn(
          'rounded-lg object-contain',
          sizes.container,
          className
        )}
      />
    )
  }

  if (variant === 'header') {
    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        <OptimizedImage
          src="/logo-icon.png"
          alt=""
          loading="eager"
          className="w-8 h-8 rounded-lg object-contain bg-white"
        />
        {showText && (
          <span className="font-bold text-base tracking-tight text-white">
            Jobin
          </span>
        )}
      </div>
    )
  }

  // Full variant (default)
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <OptimizedImage
        src="/logo-jobin.png"
        alt="Jobin"
        loading="eager"
        className={cn(
          'rounded-xl object-contain bg-white',
          sizes.container
        )}
      />
      {showText && (
        <div className="mt-4 text-center">
          <h1 className={cn('font-bold text-white', sizes.text)}>
            Jobin
          </h1>
          <p className="text-brand-200 mt-1 text-sm">
            Vägen till nytt jobb
          </p>
        </div>
      )}
    </div>
  )
}

export default Logo
