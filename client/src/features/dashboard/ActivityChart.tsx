import { Card } from '@/components/ui'

const activityData = [
  { day: 'Mån', value: 40 },
  { day: 'Tis', value: 70 },
  { day: 'Ons', value: 55 },
  { day: 'Tors', value: 85 },
  { day: 'Fre', value: 45 },
  { day: 'Lör', value: 25 },
  { day: 'Sön', value: 10 },
]

export function ActivityChart() {
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-8">
        Aktivitet senaste veckan
      </h3>
      
      <div className="flex items-end gap-4 h-48">
        {activityData.map((item) => (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-violet-100 rounded-t-lg relative overflow-hidden"
              style={{ height: `${item.value}%` }}
            >
              <div className="absolute bottom-0 w-full bg-violet-500 rounded-t-lg h-full" />
            </div>
            <span className="text-xs text-slate-500">{item.day}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
