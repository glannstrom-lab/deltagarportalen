import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigation, Clock, Train, Car, Bike, Footprints, Wallet, CheckCircle, Circle } from '@/components/ui/icons'
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
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(!travel?.destination)

  const calculateArrivalTime = () => {
    if (!travel?.duration || !eventTime) return eventTime

    const [hours, minutes] = eventTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes - travel.duration

    // Handle negative times (should leave day before)
    if (totalMinutes < 0) {
      return '00:00'
    }

    const arrivalHours = Math.floor(totalMinutes / 60)
    const arrivalMinutes = totalMinutes % 60

    return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`
  }

  const transportOptions = useMemo(() => [
    { mode: 'public' as const, labelKey: 'calendar.travel.modes.public', icon: Train },
    { mode: 'car' as const, labelKey: 'calendar.travel.modes.car', icon: Car },
    { mode: 'bike' as const, labelKey: 'calendar.travel.modes.bike', icon: Bike },
    { mode: 'walk' as const, labelKey: 'calendar.travel.modes.walk', icon: Footprints },
  ], [])

  if (isEditing) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-4">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          {t('calendar.travel.title')}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {t('calendar.travel.destination')}
            </label>
            <input
              type="text"
              value={travel?.destination || ''}
              onChange={(e) => onTravelChange({ ...travel, destination: e.target.value })}
              placeholder={t('calendar.travel.destinationPlaceholder')}
              className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('calendar.travel.duration')}
              </label>
              <input
                type="number"
                value={travel?.duration || ''}
                onChange={(e) => onTravelChange({ ...travel, duration: parseInt(e.target.value) || 0 })}
                placeholder="30"
                className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('calendar.travel.cost')}
              </label>
              <input
                type="number"
                value={travel?.cost || ''}
                onChange={(e) => onTravelChange({ ...travel, cost: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1 w-full px-3 py-2 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {t('calendar.travel.transportMode')}
            </label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {transportOptions.map(({ mode, labelKey, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => onTravelChange({ ...travel, transportMode: mode })}
                  aria-pressed={travel?.transportMode === mode}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    travel?.transportMode === mode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <Icon size={20} className="mx-auto mb-1" aria-hidden="true" />
                  <span className="text-xs">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(false)}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {t('calendar.travel.savePlan')}
          </button>
        </div>
      </div>
    )
  }

  const Icon = travel?.transportMode ? transportIcons[travel.transportMode] : Navigation

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('calendar.travel.travelPlan')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{travel?.destination}</p>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                <Clock size={14} aria-hidden="true" />
                {travel?.duration} min
              </span>
              {travel?.cost !== undefined && travel.cost > 0 && (
                <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400">
                  <Wallet size={14} aria-hidden="true" />
                  {travel.cost} kr
                </span>
              )}
            </div>

            <div className="mt-3 p-2 bg-white dark:bg-stone-800 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                <span className="font-medium">{t('calendar.travel.departureTime')}:</span> {calculateArrivalTime()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTravelChange({ ...travel, reimbursed: !travel?.reimbursed })}
            className="flex items-center gap-1 text-sm"
            aria-pressed={travel?.reimbursed}
            aria-label={t('calendar.travel.reimbursed')}
          >
            {travel?.reimbursed ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            ) : (
              <Circle className="w-5 h-5 text-stone-600 dark:text-stone-400" aria-hidden="true" />
            )}
            <span className={travel?.reimbursed ? 'text-green-600 dark:text-green-400' : 'text-stone-700 dark:text-stone-300'}>
              {t('calendar.travel.reimbursed')}
            </span>
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {t('calendar.travel.edit')}
          </button>
        </div>
      </div>
    </div>
  )
}
