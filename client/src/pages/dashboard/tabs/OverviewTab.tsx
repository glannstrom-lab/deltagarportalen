/**
 * OverviewTab - Huvudöversikt (förenklad)
 */
import { useAuthStore } from '@/stores/authStore'

export default function OverviewTab() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-800">Hej, {user?.firstName || 'där'}! 👋</h1>
      <p className="text-slate-600">Välkommen till din översikt.</p>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h2 className="font-semibold text-slate-800 mb-2">Din progress</h2>
        <p className="text-slate-600">Här kommer widgets visas snart.</p>
      </div>
    </div>
  )
}
