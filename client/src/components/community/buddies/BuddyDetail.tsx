/**
 * BuddyDetail - View buddy pair details and checkins
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calendar, MessageSquare, Heart, Trophy, Sparkles,
  LogOut, Loader2, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import type { BuddyPair, BuddyCheckin, CheckinType } from '@/types/community.types'
import { CHECKIN_TYPE_LABELS } from '@/types/community.types'

interface BuddyDetailProps {
  pair: BuddyPair | null
  checkins: BuddyCheckin[]
  isLoading: boolean
  onBack: () => void
  onCheckin: (type: CheckinType, notes?: string, rating?: number) => Promise<boolean>
  onEndPair: () => void
}

export function BuddyDetail({
  pair,
  checkins,
  isLoading,
  onBack,
  onCheckin,
  onEndPair
}: BuddyDetailProps) {
  const [showCheckinForm, setShowCheckinForm] = useState(false)
  const [checkinType, setCheckinType] = useState<CheckinType>('weekly')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(5)
  const [isSending, setIsSending] = useState(false)

  if (isLoading || !pair) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  const handleCheckin = async () => {
    if (isSending) return

    setIsSending(true)
    const success = await onCheckin(checkinType, notes.trim() || undefined, rating)
    setIsSending(false)

    if (success) {
      setShowCheckinForm(false)
      setNotes('')
      setRating(5)
    }
  }

  const buddy = pair.buddy
  const name = buddy ? `${buddy.firstName} ${buddy.lastName}`.trim() : 'Buddy'
  const initials = buddy ? `${buddy.firstName?.[0] || ''}${buddy.lastName?.[0] || ''}`.toUpperCase() : '?'

  const matchedAgo = pair.matchedAt
    ? formatDistanceToNow(new Date(pair.matchedAt), { addSuffix: true, locale: sv })
    : ''

  const checkinTypes: CheckinType[] = ['weekly', 'interview_practice', 'cv_review', 'motivation', 'celebration']

  const getCheckinIcon = (type: CheckinType) => {
    switch (type) {
      case 'weekly': return Calendar
      case 'interview_practice': return MessageSquare
      case 'cv_review': return MessageSquare
      case 'motivation': return Heart
      case 'celebration': return Trophy
      default: return Sparkles
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till buddies
      </button>

      {/* Buddy header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-emerald-200 p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {buddy?.avatarUrl ? (
              <img
                src={buddy.avatarUrl}
                alt={name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-800">{name}</h2>
              <p className="text-slate-500 mt-1">
                Matchade {matchedAgo}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {pair.checkInCount} check-ins
                </span>
                {pair.lastCheckIn && (
                  <span className="text-slate-500">
                    Senast: {formatDistanceToNow(new Date(pair.lastCheckIn), { addSuffix: true, locale: sv })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onEndPair}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Avsluta buddy-par"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* New checkin button / form */}
      {!showCheckinForm ? (
        <Button onClick={() => setShowCheckinForm(true)} className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Ny check-in
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl border border-slate-200 p-4 space-y-4"
        >
          <h3 className="font-semibold text-slate-800">Ny check-in</h3>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Typ av check-in
            </label>
            <div className="flex flex-wrap gap-2">
              {checkinTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setCheckinType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    checkinType === type
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {CHECKIN_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Anteckningar (valfritt)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vad pratade ni om? Hur gick det?"
              className="w-full h-20 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hur nöjd är du med check-in?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-lg transition-colors",
                    rating >= n
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowCheckinForm(false)}
            >
              Avbryt
            </Button>
            <Button onClick={handleCheckin} disabled={isSending}>
              {isSending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Spara check-in
            </Button>
          </div>
        </motion.div>
      )}

      {/* Checkin history */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">Check-in historik</h3>
        {checkins.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">
              Inga check-ins ännu. Skapa din första!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {checkins.map((checkin, index) => {
              const Icon = getCheckinIcon(checkin.checkinType)
              const timeAgo = formatDistanceToNow(new Date(checkin.createdAt), {
                addSuffix: true,
                locale: sv
              })

              return (
                <motion.div
                  key={checkin.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">
                          {CHECKIN_TYPE_LABELS[checkin.checkinType]}
                        </span>
                        <span className="text-xs text-slate-500">{timeAgo}</span>
                      </div>
                      {checkin.notes && (
                        <p className="text-sm text-slate-600 mt-1">{checkin.notes}</p>
                      )}
                      {checkin.rating && (
                        <div className="mt-1">
                          {Array.from({ length: checkin.rating }).map((_, i) => (
                            <span key={i} className="text-amber-500">⭐</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default BuddyDetail
