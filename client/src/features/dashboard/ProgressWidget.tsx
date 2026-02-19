import { Card } from '@/components/ui'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

interface ProgressWidgetProps {
  hasCV: boolean
  hasInterestResult: boolean
  cvScore: number
}

export function ProgressWidget({ hasCV, hasInterestResult, cvScore }: ProgressWidgetProps) {
  const items = [
    { label: 'CV komplett', value: hasCV ? 100 : 0, color: 'bg-violet-500' },
    { label: 'Intresseguide', value: hasInterestResult ? 100 : 0, color: 'bg-emerald-500' },
    { label: 'CV-kvalitet', value: cvScore, color: 'bg-amber-500' },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-6">Din framsteg</h3>
      
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-900">{item.value}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <Link 
        to="/cv" 
        className="flex items-center justify-center gap-2 w-full mt-6 py-3 bg-violet-50 text-violet-700 rounded-xl font-medium hover:bg-violet-100 transition-colors text-sm"
      >
        Förbättra CV
        <ArrowUpRight size={16} />
      </Link>
    </Card>
  )
}
