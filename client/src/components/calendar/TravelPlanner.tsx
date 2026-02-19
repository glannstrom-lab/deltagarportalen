import { useState } from 'react'
import { Navigation, Clock, Train, Car, Bike, Footprints, Wallet, CheckCircle, Circle } from 'lucide-react'
import type { TravelInfo } from '@/services/calendarData'

interface TravelPlannerProps {
  travel?: TravelInfo
  onTravelChange: (travel: TravelInfo) => void
  eventTime: string
}

const transportIcons = {
  public: Train,
  car: Car,
  bike: Bike,
  walk: Footprints,
}

export function TravelPlanner({ travel, onTravelChange, eventTime }: TravelPlannerProps) {
  const [isEditing, setIsEditing] = useState(!travel?.destination)

  const calculateArrivalTime = () => {
    if (!travel?.duration || !eventTime) return eventTime
    
    const [hours, minutes] = eventTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes - travel.duration
    const arrivalHours = Math.floor(totalMinutes / 60)
    const arrivalMinutes = totalMinutes % 60
    
    return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`
  }

  const transportOptions = [
    { mode: 'public' as const, label: 'Kollektivtrafik', icon: Train },
    { mode: 'car' as const, label: 'Bil', icon: Car },
    { mode: 'bike' as const, label: 'Cykel', icon: Bike },
    { mode: 'walk' as const, label: 'Gång', icon: Footprints },
  ]

  if (isEditing) {
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Reseplanering
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Destination</label>
            <input
              type="text"
              value={travel?.destination || ''}
              onChange={(e) => onTravelChange({ ...travel, destination: e.target.value })}
              placeholder="Ange adress..."
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Restid (min)</label>
              <input
                type="number"
                value={travel?.duration || ''}
                onChange={(e) => onTravelChange({ ...travel, duration: parseInt(e.target.value) || 0 })}
                placeholder="30"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Kostnad (kr)</label>
              <input
                type="number"
                value={travel?.cost || ''}
                onChange={(e) => onTravelChange({ ...travel, cost: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Färdsätt</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {transportOptions.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => onTravelChange({ ...travel, transportMode: mode })}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    travel?.transportMode === mode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <Icon size={20} className="mx-auto mb-1" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(false)}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Spara reseplan
          </button>
        </div>
      </div>
    )
  }

  const Icon = travel?.transportMode ? transportIcons[travel.transportMode] : Navigation

  return (
    <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Reseplan</h3>
            <p className="text-sm text-slate-600 mt-1">{travel?.destination}</p>
            
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1 text-slate-600">
                <Clock size={14} />
                {travel?.duration} min
              </span>
              {travel?.cost !== undefined && travel.cost > 0 && (
                <span className="flex items-center gap-1 text-slate-600">
                  <Wallet size={14} />
                  {travel.cost} kr
                </span>
              )}
            </div>

            <div className="mt-3 p-2 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Avresa senast:</span> {calculateArrivalTime()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTravelChange({ ...travel, reimbursed: !travel?.reimbursed })}
            className="flex items-center gap-1 text-sm"
          >
            {travel?.reimbursed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400" />
            )}
            <span className={travel?.reimbursed ? 'text-green-600' : 'text-slate-500'}>
              Ersätts
            </span>
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Ändra
          </button>
        </div>
      </div>
    </div>
  )
}
