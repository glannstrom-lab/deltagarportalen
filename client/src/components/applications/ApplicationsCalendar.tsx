/**
 * ApplicationsCalendar Component
 * Shows reminders and upcoming interviews
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar, Bell, Plus, CheckCircle, Clock, Trash2,
  Phone, Users, FileCheck, AlertCircle
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplicationReminders } from '@/hooks/useApplications'
import type { ApplicationReminder, ReminderType } from '@/types/application.types'

const REMINDER_TYPE_CONFIG: Record<ReminderType, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
}> = {
  follow_up: { icon: Bell, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Uppföljning' },
  interview: { icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-100', label: 'Intervju' },
  phone_screen: { icon: Phone, color: 'text-teal-600', bgColor: 'bg-teal-100', label: 'Telefonintervju' },
  assessment: { icon: FileCheck, color: 'text-sky-600', bgColor: 'bg-sky-100', label: 'Arbetsprov' },
  deadline: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Deadline' },
  custom: { icon: Bell, color: 'text-slate-600', bgColor: 'bg-slate-100', label: 'Påminnelse' }
}

function ReminderCard({
  reminder,
  onComplete,
  showDate = false
}: {
  reminder: ApplicationReminder
  onComplete: (id: string) => void
  showDate?: boolean
}) {
  const config = REMINDER_TYPE_CONFIG[reminder.reminderType]
  const Icon = config.icon
  const isOverdue = new Date(reminder.reminderDate) < new Date(new Date().toDateString())

  return (
    <Card className={cn(
      "p-4",
      isOverdue && "border-red-200 bg-red-50"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-slate-900">{reminder.title}</h4>
              <p className="text-sm text-slate-700">{config.label}</p>
            </div>
            <button
              onClick={() => onComplete(reminder.id)}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors text-slate-600 hover:text-green-600"
              title="Markera som klar"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>

          {reminder.description && (
            <p className="text-sm text-slate-600 mt-1">{reminder.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-700">
            <Calendar className="w-3 h-3" />
            {showDate && (
              <span>
                {new Date(reminder.reminderDate).toLocaleDateString('sv-SE', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            )}
            {reminder.reminderTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {reminder.reminderTime.slice(0, 5)}
              </span>
            )}
            {isOverdue && (
              <span className="text-red-600 font-medium">Försenad</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function ApplicationsCalendar() {
  const { t } = useTranslation()
  const { todayReminders, upcomingReminders, isLoading, completeReminder } = useApplicationReminders()

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id)
    } catch (error) {
      console.error('Failed to complete reminder:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    )
  }

  const futureReminders = upcomingReminders.filter(r =>
    new Date(r.reminderDate) > new Date(new Date().toDateString())
  )

  return (
    <div className="space-y-6">
      {/* Today's reminders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Idag</h2>
            <p className="text-sm text-slate-700">
              {todayReminders.length === 0
                ? 'Inga påminnelser idag'
                : `${todayReminders.length} påminnelse${todayReminders.length > 1 ? 'r' : ''}`}
            </p>
          </div>
        </div>

        {todayReminders.length === 0 ? (
          <Card className="p-8 text-center bg-green-50 border-green-100">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-700 font-medium">Allt klart för idag!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayReminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming reminders */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Kommande 7 dagar</h2>

        {futureReminders.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700">Inga kommande påminnelser</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {futureReminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={handleComplete}
                showDate
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationsCalendar
