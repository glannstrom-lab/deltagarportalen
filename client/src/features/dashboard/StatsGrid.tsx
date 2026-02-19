import { StatCard } from '@/components/ui'
import { FileText, Briefcase, Mail, Clock } from 'lucide-react'

interface StatsGridProps {
  cvScore: number
  coverLetterCount: number
}

export function StatsGrid({ cvScore, coverLetterCount }: StatsGridProps) {
  const stats = [
    { label: 'CV-poäng', value: `${cvScore}/100`, icon: FileText, color: 'violet' as const },
    { label: 'Ansökningar', value: '12', icon: Briefcase, color: 'emerald' as const },
    { label: 'Sparade brev', value: coverLetterCount.toString(), icon: Mail, color: 'amber' as const },
    { label: 'Dagar i rad', value: '7', icon: Clock, color: 'rose' as const },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
