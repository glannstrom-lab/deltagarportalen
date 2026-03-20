/**
 * ReceivedCheers - Shows cheers/encouragement received by the user
 */

import { motion } from 'framer-motion'
import { Heart, Gift, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Cheer } from '@/types/community.types'

interface ReceivedCheersProps {
  cheers: Cheer[]
  isLoading?: boolean
}

export function ReceivedCheers({ cheers, isLoading }: ReceivedCheersProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-slate-800">Mottagna hejarop</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-1" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (cheers.length === 0) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-100 p-6 text-center">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart className="w-6 h-6 text-rose-500" />
        </div>
        <h3 className="font-semibold text-slate-800 mb-1">Inga hejarop än</h3>
        <p className="text-sm text-slate-500">
          Var aktiv i communityn så kommer du snart få uppmuntran!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold text-slate-800">Mottagna hejarop</h3>
        <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
          {cheers.length} nya
        </span>
      </div>

      <div className="space-y-3">
        {cheers.map((cheer, index) => (
          <motion.div
            key={cheer.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg"
          >
            {/* Avatar/Emoji */}
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-lg flex-shrink-0">
              {cheer.emoji || '💜'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-slate-700 text-sm">{cheer.message}</p>
              <p className="text-xs text-slate-400 mt-1">
                {cheer.isAnonymous ? 'Anonym' : (
                  cheer.fromUser
                    ? `${cheer.fromUser.firstName} ${cheer.fromUser.lastName}`.trim()
                    : 'Någon'
                )}
                {' · '}
                {formatDistanceToNow(new Date(cheer.createdAt), {
                  addSuffix: true,
                  locale: sv
                })}
              </p>
            </div>

            {/* Sparkle */}
            <Sparkles className="w-4 h-4 text-rose-400 flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ReceivedCheers
