import { useMobileOptimization } from '@/components/MobileOptimizer'
import { MobileDashboard } from '@/components/dashboard/MobileDashboard'
import { CompactDashboard } from '@/components/dashboard/CompactDashboard'

export default function Dashboard() {
  const { isMobile } = useMobileOptimization()
  
  // Mobile gets the list view, Desktop gets the new compact row view
  if (isMobile) {
    return <MobileDashboard />
  }

  return <CompactDashboard />
}
