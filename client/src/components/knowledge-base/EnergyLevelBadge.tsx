import { Battery, BatteryMedium, BatteryLow } from 'lucide-react'

interface EnergyLevelBadgeProps {
  level: 'low' | 'medium' | 'high'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const config = {
  low: {
    label: 'Låg energi',
    description: 'Lätt att läsa',
    color: 'bg-green-100 text-green-700 border-green-200',
    iconColor: 'text-green-600',
    icon: BatteryLow,
  },
  medium: {
    label: 'Medel energi',
    description: 'Kräver fokus',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    iconColor: 'text-yellow-600',
    icon: BatteryMedium,
  },
  high: {
    label: 'Kräver energi',
    description: 'Djup läsning',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600',
    icon: Battery,
  },
}

export default function EnergyLevelBadge({ 
  level, 
  showLabel = true, 
  size = 'md' 
}: EnergyLevelBadgeProps) {
  const { label, color, icon: Icon, iconColor } = config[level]
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  }
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${color} ${sizeClasses[size]}`}
      title={`Energianvändning: ${label}`}
    >
      <Icon size={iconSizes[size]} className={iconColor} />
      {showLabel && <span>{label}</span>}
    </span>
  )
}
