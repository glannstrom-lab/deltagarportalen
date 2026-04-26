/**
 * MeetingSchedulerDialog
 * Dialog för att boka möten med deltagare
 */

import { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Link as LinkIcon,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Participant {
  participant_id: string
  first_name: string
  last_name: string
  email: string
}

interface MeetingSchedulerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedParticipant?: Participant
}

type MeetingType = 'video' | 'phone' | 'physical'

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
]

const durations = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
]

export function MeetingSchedulerDialog({
  isOpen,
  onClose,
  onSuccess,
  preselectedParticipant,
}: MeetingSchedulerDialogProps) {
  const [step, setStep] = useState<'participant' | 'datetime' | 'details'>('participant')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(
    preselectedParticipant || null
  )
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState(30)
  const [meetingType, setMeetingType] = useState<MeetingType>('video')
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (isOpen && !preselectedParticipant) {
      fetchParticipants()
    }
    if (preselectedParticipant) {
      setStep('datetime')
    }
  }, [isOpen, preselectedParticipant])

  const fetchParticipants = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('consultant_dashboard_participants')
        .select('participant_id, first_name, last_name, email')
        .eq('consultant_id', user.id)

      if (data) {
        setParticipants(data)
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  const handleSubmit = async () => {
    if (!selectedParticipant || !selectedTime) return

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledAt = new Date(selectedDate)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const { error } = await supabase
        .from('consultant_meetings')
        .insert({
          consultant_id: user.id,
          participant_id: selectedParticipant.participant_id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          meeting_type: meetingType,
          location: location || null,
          meeting_link: meetingLink || null,
          notes: notes || null,
          status: 'scheduled',
        })

      if (error) throw error

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating meeting:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('participant')
    setSelectedParticipant(null)
    setSelectedDate(new Date())
    setSelectedTime('')
    setDuration(30)
    setMeetingType('video')
    setLocation('')
    setMeetingLink('')
    setNotes('')
    setSearchQuery('')
  }

  const filteredParticipants = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday start

    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Boka möte
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-600 mt-0.5">
              {step === 'participant' && 'Välj deltagare'}
              {step === 'datetime' && 'Välj datum och tid'}
              {step === 'details' && 'Mötesdetaljer'}
            </p>
          </div>
          <button
            onClick={() => {
              onClose()
              resetForm()
            }}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: Select Participant */}
          {step === 'participant' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                <input
                  type="text"
                  placeholder="Sök deltagare..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-teal-500',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredParticipants.map(p => (
                  <button
                    key={p.participant_id}
                    onClick={() => {
                      setSelectedParticipant(p)
                      setStep('datetime')
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl transition-colors',
                      'hover:bg-teal-50 dark:hover:bg-teal-900/20',
                      selectedParticipant?.participant_id === p.participant_id &&
                        'bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-500'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 font-medium">
                      {p.first_name?.[0]}{p.last_name?.[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-600">
                        {p.email}
                      </p>
                    </div>
                  </button>
                ))}
                {filteredParticipants.length === 0 && (
                  <p className="text-center text-stone-500 py-8">
                    Inga deltagare hittades
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 'datetime' && (
            <div className="space-y-6">
              {/* Selected participant */}
              {selectedParticipant && (
                <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                  <User className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {selectedParticipant.first_name} {selectedParticipant.last_name}
                  </span>
                  {!preselectedParticipant && (
                    <button
                      onClick={() => setStep('participant')}
                      className="ml-auto text-sm text-teal-600 hover:underline"
                    >
                      Ändra
                    </button>
                  )}
                </div>
              )}

              {/* Calendar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                    {currentMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-stone-500 py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, i) => (
                    <button
                      key={i}
                      disabled={!date || isPast(date)}
                      onClick={() => date && setSelectedDate(date)}
                      className={cn(
                        'aspect-square rounded-lg text-sm font-medium transition-colors',
                        !date && 'invisible',
                        date && isPast(date) && 'text-stone-300 dark:text-stone-600 cursor-not-allowed',
                        date && !isPast(date) && 'hover:bg-stone-100 dark:hover:bg-stone-800',
                        date && isToday(date) && 'ring-2 ring-teal-500',
                        date && isSelected(date) && 'bg-teal-600 text-white hover:bg-teal-700'
                      )}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                  Välj tid
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                        selectedTime === time
                          ? 'bg-teal-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                  Längd
                </h3>
                <div className="flex flex-wrap gap-2">
                  {durations.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={cn(
                        'py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                        duration === d.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Meeting Details */}
          {step === 'details' && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <User className="w-4 h-4" />
                  <span>{selectedParticipant?.first_name} {selectedParticipant?.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {selectedDate.toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <Clock className="w-4 h-4" />
                  <span>{selectedTime} ({duration} min)</span>
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                  Mötestyp
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'video' as MeetingType, icon: Video, label: 'Video' },
                    { type: 'phone' as MeetingType, icon: Phone, label: 'Telefon' },
                    { type: 'physical' as MeetingType, icon: MapPin, label: 'Fysiskt' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setMeetingType(type)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl transition-colors',
                        meetingType === type
                          ? 'bg-teal-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Link (for video) */}
              {meetingType === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Möteslänk
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={e => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl',
                        'bg-stone-100 dark:bg-stone-800',
                        'border-2 border-transparent focus:border-teal-500',
                        'text-stone-900 dark:text-stone-100'
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Location (for physical) */}
              {meetingType === 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Plats
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Kontoret, rum 302"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl',
                        'bg-stone-100 dark:bg-stone-800',
                        'border-2 border-transparent focus:border-teal-500',
                        'text-stone-900 dark:text-stone-100'
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Anteckningar (valfritt)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Agenda, förberedelser..."
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl resize-none',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-teal-500',
                    'text-stone-900 dark:text-stone-100'
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-stone-200 dark:border-stone-700">
          <div>
            {step !== 'participant' && (
              <Button
                variant="ghost"
                onClick={() => setStep(step === 'details' ? 'datetime' : 'participant')}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Tillbaka
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { onClose(); resetForm(); }}>
              Avbryt
            </Button>
            {step === 'datetime' && selectedTime && (
              <Button onClick={() => setStep('details')}>
                Fortsätt
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 'details' && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bokar...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Boka möte
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
