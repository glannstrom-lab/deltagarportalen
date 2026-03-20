/**
 * GroupList - Display accountability groups
 */

import { motion } from 'framer-motion'
import { Users, Target, Sparkles, Bell, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CommunityGroup, GroupInvite } from '@/types/community.types'
import { GROUP_GOAL_LABELS } from '@/types/community.types'

interface GroupListProps {
  myGroups: CommunityGroup[]
  publicGroups: CommunityGroup[]
  invites: GroupInvite[]
  isLoading: boolean
  onSelectGroup: (groupId: string) => void
  onJoinGroup: (groupId: string) => void
  onRespondInvite: (inviteId: string, accept: boolean) => void
}

export function GroupList({
  myGroups,
  publicGroups,
  invites,
  isLoading,
  onSelectGroup,
  onJoinGroup,
  onRespondInvite
}: GroupListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Inbjudningar ({invites.length})
          </h3>
          {invites.map((invite, index) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <InviteCard
                invite={invite}
                onRespond={(accept) => onRespondInvite(invite.id, accept)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* My groups */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          Mina grupper ({myGroups.length})
        </h3>
        {myGroups.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <p className="text-slate-500 text-sm">
              Du är inte med i några grupper ännu.
              Skapa en egen eller gå med i en befintlig!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GroupCard
                  group={group}
                  isMember
                  onSelect={() => onSelectGroup(group.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Public groups to join */}
      {publicGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Öppna grupper ({publicGroups.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {publicGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GroupCard
                  group={group}
                  isMember={false}
                  onSelect={() => onJoinGroup(group.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface GroupCardProps {
  group: CommunityGroup
  isMember: boolean
  onSelect: () => void
}

function GroupCard({ group, isMember, onSelect }: GroupCardProps) {
  const progressPercent = group.weeklyGoalTarget > 0
    ? Math.min(100, Math.round((group.weeklyProgress / (group.weeklyGoalTarget * group.memberCount)) * 100))
    : 0

  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer",
        isMember ? "border-emerald-200" : "border-slate-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800">{group.name}</h4>
          {group.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">
              {group.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          {group.memberCount}/{group.maxMembers}
        </div>
      </div>

      {/* Weekly goal */}
      {group.weeklyGoalType && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              {GROUP_GOAL_LABELS[group.weeklyGoalType]}
            </span>
            <span className="font-medium text-slate-700">
              {group.weeklyProgress}/{group.weeklyGoalTarget * group.memberCount}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressPercent >= 100 ? "bg-emerald-500" : "bg-emerald-400"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex justify-end">
        <span className={cn(
          "text-sm font-medium",
          isMember ? "text-emerald-600" : "text-blue-600"
        )}>
          {isMember ? 'Öppna →' : 'Gå med →'}
        </span>
      </div>
    </div>
  )
}

interface InviteCardProps {
  invite: GroupInvite
  onRespond: (accept: boolean) => void
}

function InviteCard({ invite, onRespond }: InviteCardProps) {
  const inviterName = invite.inviter
    ? `${invite.inviter.firstName} ${invite.inviter.lastName}`.trim()
    : 'Någon'

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-slate-700">
            <span className="font-semibold">{inviterName}</span> bjuder in dig till{' '}
            <span className="font-semibold">{invite.group?.name || 'en grupp'}</span>
          </p>
          {invite.group?.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">
              {invite.group.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onRespond(false)}
            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Avböj
          </button>
          <button
            onClick={() => onRespond(true)}
            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Acceptera
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupList
