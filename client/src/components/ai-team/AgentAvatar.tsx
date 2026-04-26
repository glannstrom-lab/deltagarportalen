/**
 * Agent Avatar Component
 * Renders agent icons with their associated colors
 */

import { cn } from '@/lib/utils'
import type { AgentColor, AgentId } from './types'
import { agentColorClasses } from './types'
import { Briefcase, Heart, GraduationCap, Sparkles, Monitor } from '@/components/ui/icons'

interface AgentAvatarProps {
  agentId: AgentId
  color: AgentColor
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const agentIcons: Record<AgentId, React.ComponentType<{ className?: string }>> = {
  arbetskonsulent: Briefcase,
  arbetsterapeut: Heart,
  studievagledare: GraduationCap,
  motivationscoach: Sparkles,
  digitalcoach: Monitor,
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

export function AgentAvatar({ agentId, color, size = 'md', className }: AgentAvatarProps) {
  const Icon = agentIcons[agentId]
  const colors = agentColorClasses[color]

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0',
        '',
        colors.bgLight,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], colors.text)} aria-hidden="true" />
    </div>
  )
}

export function AgentAvatarSolid({ agentId, color, size = 'md', className }: AgentAvatarProps) {
  const Icon = agentIcons[agentId]
  const colors = agentColorClasses[color]

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0',
        '',
        colors.bg,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], 'text-white')} aria-hidden="true" />
    </div>
  )
}

export default AgentAvatar
