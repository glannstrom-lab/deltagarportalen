/**
 * Overview Tab - Main dashboard view with widgets
 */
import { useState } from 'react'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { DashboardGridSkeleton } from '@/components/ui/Skeleton'

export default function OverviewTab() {
  const [loading] = useState(false)

  if (loading) {
    return <DashboardGridSkeleton count={4} />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Översikt</h2>
      <DashboardGrid>
        <div className="p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-800">Test Widget</h3>
          <p className="text-sm text-slate-600 mt-2">Detta är en test-widget för att se om sidan laddar.</p>
        </div>
      </DashboardGrid>
    </div>
  )
}
