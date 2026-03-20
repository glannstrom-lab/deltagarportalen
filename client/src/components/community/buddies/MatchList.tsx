/**
 * MatchList - Display buddy matches and current buddies
 */

import { motion } from 'framer-motion'
import {
  UserPlus, Users, Clock, MessageCircle, CheckCircle, X, Loader2, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import type { BuddyMatch, BuddyPair } from '@/types/community.types'

interface MatchListProps {
  matches: BuddyMatch[]
  pendingRequests: BuddyPair[]
  activeBuddies: BuddyPair[]
  isLoading: boolean
  onRequestBuddy: (userId: string) => void
  onRespondRequest: (pairId: string, accept: boolean) => void
  onSelectBuddy: (pairId: string) => void
}

export function MatchList({
  matches,
  pendingRequests,
  activeBuddies,
  isLoading,
  onRequestBuddy,
  onRespondRequest,
  onSelectBuddy
}: MatchListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Väntande förfrågningar ({pendingRequests.length})
          </h3>
          {pendingRequests.map((pair, index) => (
            <motion.div
              key={pair.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PendingRequestCard
                pair={pair}
                onRespond={(accept) => onRespondRequest(pair.id, accept)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Active buddies */}
      {activeBuddies.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Dina buddies ({activeBuddies.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeBuddies.map((pair, index) => (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActiveBuddyCard
                  pair={pair}
                  onSelect={() => onSelectBuddy(pair.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested matches */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          Föreslagna matchningar ({matches.length})
        </h3>
        {matches.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">
              Inga matchningar just nu. Se till att din profil är ifylld och att du har aktiverat buddy-sökning.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.map((match, index) => (
              <motion.div
                key={match.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchCard
                  match={match}
                  onRequest={() => onRequestBuddy(match.userId)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MatchCardProps {
  match: BuddyMatch
  onRequest: () => void
}

function MatchCard({ match, onRequest }: MatchCardProps) {
  const name = `${match.firstName} ${match.lastName}`.trim()
  const initials = `${match.firstName?.[0] || ''}${match.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex gap-3">
        {match.avatarUrl ? (
          <img
            src={match.avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800">{name}</h4>
            <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded-full">
              {match.matchScore}% match
            </span>
          </div>
          {match.bio && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{match.bio}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={onRequest}>
          <UserPlus className="w-4 h-4 mr-1" />
          Skicka förfrågan
        </Button>
      </div>
    </div>
  )
}

interface PendingRequestCardProps {
  pair: BuddyPair
  onRespond: (accept: boolean) => void
}

function PendingRequestCard({ pair, onRespond }: PendingRequestCardProps) {
  const buddy = pair.buddy
  const name = buddy ? `${buddy.firstName} ${buddy.lastName}`.trim() : 'Någon'
  const initials = buddy ? `${buddy.firstName?.[0] || ''}${buddy.lastName?.[0] || ''}`.toUpperCase() : '?'

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {buddy?.avatarUrl ? (
            <img
              src={buddy.avatarUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-800">{name}</p>
            <p className="text-sm text-slate-500">vill bli din buddy</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onRespond(false)}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRespond(true)}
            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface ActiveBuddyCardProps {
  pair: BuddyPair
  onSelect: () => void
}

function ActiveBuddyCard({ pair, onSelect }: ActiveBuddyCardProps) {
  const buddy = pair.buddy
  const name = buddy ? `${buddy.firstName} ${buddy.lastName}`.trim() : 'Buddy'
  const initials = buddy ? `${buddy.firstName?.[0] || ''}${buddy.lastName?.[0] || ''}`.toUpperCase() : '?'

  const matchedAgo = pair.matchedAt
    ? formatDistanceToNow(new Date(pair.matchedAt), { addSuffix: true, locale: sv })
    : ''

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-xl border border-emerald-200 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex gap-3">
        {buddy?.avatarUrl ? (
          <img
            src={buddy.avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800">{name}</h4>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <span>Matchade {matchedAgo}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {pair.checkInCount} check-ins
            </span>
          </div>
        </div>
        <MessageCircle className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  )
}

export default MatchList
