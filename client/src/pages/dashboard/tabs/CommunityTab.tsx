/**
 * CommunityTab - Stötta & Fira
 * Community feed with encouragement and celebration
 */

import { motion } from 'framer-motion'
import { Users, RefreshCw, Loader2, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCommunity } from '@/hooks/useCommunity'
import {
  FeedCard,
  CommunityStats,
  SendCheer,
  ReceivedCheers
} from '@/components/community'

export default function CommunityTab() {
  const {
    feed,
    receivedCheers,
    stats,
    isLoading,
    error,
    react,
    cheer,
    refresh
  } = useCommunity()

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Laddar community...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Kunde inte ladda community
        </h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Försök igen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Community</h2>
            <p className="text-sm text-slate-500">Stötta och fira varandra</p>
          </div>
        </div>
        <Button onClick={refresh} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Uppdatera
        </Button>
      </div>

      {/* Stats */}
      <CommunityStats stats={stats} isLoading={isLoading} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed - takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Send cheer */}
          <SendCheer onSend={cheer} />

          {/* Feed header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800">Aktivitetsflöde</h3>
          </div>

          {/* Feed items */}
          {feed.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">
                Inga aktiviteter än
              </h3>
              <p className="text-slate-500 text-sm">
                När du och andra är aktiva kommer ni se varandras framsteg här.
                Skicka in en jobbansökan eller läs en artikel för att komma igång!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FeedCard item={item} onReact={react} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - received cheers */}
        <div className="space-y-4">
          <ReceivedCheers cheers={receivedCheers} isLoading={isLoading} />

          {/* Tips card */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100 p-4">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Tips
            </h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                Reagera på andras aktiviteter för att visa ditt stöd
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                Skicka hejarop till någon som behöver uppmuntran
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                Dina framsteg visas automatiskt i flödet
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
