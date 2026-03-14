import { QuestsWidget } from '@/components/dashboard/widgets/QuestsWidget'

export default function OverviewTab() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Översikt</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuestsWidget completedQuests={2} totalQuests={5} streakDays={3} size="small" />
      </div>
    </div>
  )
}
