/**
 * CommunityTab - Complete community hub
 * Includes: Feed, Discussions, Groups, and Buddy matching
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, RefreshCw, Loader2, Heart, Sparkles, MessageSquare,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// Hooks
import { useCommunity } from '@/hooks/useCommunity'
import { useDiscussions, useTopic } from '@/hooks/useDiscussions'
import { useGroups, useGroupChat } from '@/hooks/useGroups'
import { useBuddy, useBuddyCheckins } from '@/hooks/useBuddy'

// Feed components
import {
  FeedCard,
  CommunityStats,
  SendCheer,
  ReceivedCheers
} from '@/components/community'

// Discussion components
import {
  TopicList,
  TopicDetail,
  CreateTopicForm
} from '@/components/community'

// Group components
import {
  GroupList,
  GroupChat,
  CreateGroupForm
} from '@/components/community'

// Buddy components
import {
  BuddyPreferencesForm,
  MatchList,
  BuddyDetail
} from '@/components/community'

type CommunitySection = 'feed' | 'discussions' | 'groups' | 'buddies'

export default function CommunityTab() {
  const [activeSection, setActiveSection] = useState<CommunitySection>('feed')

  const sections = [
    { id: 'feed' as const, label: 'Flöde', icon: Sparkles },
    { id: 'discussions' as const, label: 'Diskussioner', icon: MessageSquare },
    { id: 'groups' as const, label: 'Grupper', icon: Users },
    { id: 'buddies' as const, label: 'Buddies', icon: UserPlus }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Community</h2>
          <p className="text-sm text-slate-500">Stötta, lär och väx tillsammans</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeSection === section.id
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            <section.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeSection === 'feed' && <FeedSection />}
          {activeSection === 'discussions' && <DiscussionsSection />}
          {activeSection === 'groups' && <GroupsSection />}
          {activeSection === 'buddies' && <BuddiesSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ============================================
// FEED SECTION
// ============================================

function FeedSection() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Laddar flöde...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Kunde inte ladda flödet
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
      {/* Stats */}
      <CommunityStats stats={stats} isLoading={isLoading} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed - takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Send cheer */}
          <SendCheer onSend={cheer} />

          {/* Feed header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-800">Aktivitetsflöde</h3>
            </div>
            <Button onClick={refresh} variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
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

        {/* Sidebar */}
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

// ============================================
// DISCUSSIONS SECTION
// ============================================

function DiscussionsSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  const {
    categories,
    topics,
    isLoading,
    error,
    refresh,
    addTopic,
    toggleLike
  } = useDiscussions(selectedCategory)

  const {
    topic,
    replies,
    isLoading: isLoadingTopic,
    addReply,
    acceptReply
  } = useTopic(selectedTopicId || '')

  // Show topic detail
  if (selectedTopicId) {
    return (
      <TopicDetail
        topic={topic}
        replies={replies}
        isLoading={isLoadingTopic}
        onBack={() => setSelectedTopicId(null)}
        onReply={addReply}
        onAcceptReply={acceptReply}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
      {/* Create topic */}
      <CreateTopicForm
        categories={categories}
        onSubmit={addTopic}
      />

      {/* Topic list */}
      <TopicList
        topics={topics}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onSelectTopic={setSelectedTopicId}
        onLike={toggleLike}
      />
    </div>
  )
}

// ============================================
// GROUPS SECTION
// ============================================

function GroupsSection() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const {
    myGroups,
    publicGroups,
    invites,
    isLoading,
    error,
    refresh,
    create,
    join,
    leave,
    respondInvite
  } = useGroups()

  const {
    group,
    messages,
    isLoading: isLoadingChat,
    send,
    updateContribution
  } = useGroupChat(selectedGroupId || '')

  // Show group chat
  if (selectedGroupId) {
    return (
      <GroupChat
        group={group}
        messages={messages}
        isLoading={isLoadingChat}
        onBack={() => setSelectedGroupId(null)}
        onSend={send}
        onLeave={async () => {
          await leave(selectedGroupId)
          setSelectedGroupId(null)
        }}
        onUpdateContribution={updateContribution}
      />
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
      {/* Create group */}
      <CreateGroupForm onSubmit={create} />

      {/* Group list */}
      <GroupList
        myGroups={myGroups}
        publicGroups={publicGroups}
        invites={invites}
        isLoading={isLoading}
        onSelectGroup={setSelectedGroupId}
        onJoinGroup={async (groupId) => {
          await join(groupId)
          setSelectedGroupId(groupId)
        }}
        onRespondInvite={respondInvite}
      />
    </div>
  )
}

// ============================================
// BUDDIES SECTION
// ============================================

function BuddiesSection() {
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)

  const {
    preferences,
    matches,
    pendingRequests,
    activeBuddies,
    isLoading,
    error,
    refresh,
    savePreferences,
    requestBuddy,
    respondToRequest,
    endPair
  } = useBuddy()

  const {
    checkins,
    isLoading: isLoadingCheckins,
    addCheckin
  } = useBuddyCheckins(selectedPairId || '')

  // Find selected pair
  const selectedPair = activeBuddies.find(b => b.id === selectedPairId) || null

  // Show buddy detail
  if (selectedPairId && selectedPair) {
    return (
      <BuddyDetail
        pair={selectedPair}
        checkins={checkins}
        isLoading={isLoadingCheckins}
        onBack={() => setSelectedPairId(null)}
        onCheckin={addCheckin}
        onEndPair={async () => {
          await endPair(selectedPairId)
          setSelectedPairId(null)
        }}
      />
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
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
      {/* Toggle preferences */}
      <div className="flex justify-end">
        <Button
          variant={showPreferences ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowPreferences(!showPreferences)}
        >
          {showPreferences ? 'Dölj inställningar' : 'Mina inställningar'}
        </Button>
      </div>

      {/* Preferences form */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <BuddyPreferencesForm
              preferences={preferences}
              onSave={savePreferences}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match list */}
      <MatchList
        matches={matches}
        pendingRequests={pendingRequests}
        activeBuddies={activeBuddies}
        isLoading={isLoading}
        onRequestBuddy={requestBuddy}
        onRespondRequest={respondToRequest}
        onSelectBuddy={setSelectedPairId}
      />
    </div>
  )
}
