/**
 * RecentActivity
 * Visar senaste aktivitet för konsulenten.
 *
 * Tidigare innehöll komponenten hardkodade exempel-aktiviteter (Anna/Erik/Maria/Lisa)
 * vilka såg ut som riktig data men inte var det. 2026-04-28: konverterad till
 * "dumb" presenter som tar `activities`-prop. Datahämtning ska göras av parent
 * (typiskt via consultantService med JOIN mot user_activity_log för konsultens
 * deltagare). Om ingen data → tydlig empty state.
 */

import React from 'react';
import {
  UserPlus,
  FileText,
  MessageSquare,
  Briefcase,
  Clock,
  Inbox,
} from '@/components/ui/icons';

export type ActivityType =
  | 'participant_joined'
  | 'cv_updated'
  | 'note_added'
  | 'job_saved'
  | 'cover_letter_created'
  | 'interview_completed';

export interface ActivityItem {
  id: string | number;
  type: ActivityType;
  message: string;
  /** Tidsstämpel som ISO-sträng — formateras lokalt */
  timestamp: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  loading?: boolean;
  onShowAll?: () => void;
}

// Domän-färger används inte här eftersom varje aktivitetstyp har egen semantik.
// Stone-baserade färger respekterar DESIGN.md "neutral first"-principen.
const ACTIVITY_VISUAL: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  participant_joined:    { icon: UserPlus,       color: 'text-stone-700 bg-stone-100' },
  cv_updated:            { icon: FileText,       color: 'text-stone-700 bg-stone-100' },
  note_added:            { icon: MessageSquare,  color: 'text-stone-700 bg-stone-100' },
  job_saved:             { icon: Briefcase,      color: 'text-stone-700 bg-stone-100' },
  cover_letter_created:  { icon: FileText,       color: 'text-stone-700 bg-stone-100' },
  interview_completed:   { icon: MessageSquare,  color: 'text-stone-700 bg-stone-100' },
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Nyss';
  if (minutes < 60) return `${minutes} min sedan`;
  if (hours < 24) return `${hours} h sedan`;
  if (days === 1) return 'Igår';
  if (days < 7) return `${days} dagar sedan`;
  return new Date(iso).toLocaleDateString('sv-SE');
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading,
  onShowAll,
}) => {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-6">
      <h3 className="font-semibold text-stone-900 mb-4">Senaste aktivitet</h3>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-stone-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-stone-100 rounded w-3/4" />
                <div className="h-2 bg-stone-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="text-center py-8 text-stone-600">
          <Inbox className="w-10 h-10 mx-auto mb-3 text-stone-400" />
          <p className="text-sm font-medium text-stone-700">Ingen aktivitet ännu</p>
          <p className="text-xs text-stone-500 mt-1">
            När dina deltagare uppdaterar CV, sparar jobb eller skickar ansökningar
            visas det här.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const { icon: Icon, color } = ACTIVITY_VISUAL[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-900">{activity.message}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onShowAll && activities && activities.length > 0 && (
        <button
          onClick={onShowAll}
          className="w-full mt-4 py-2 text-sm text-[var(--c-text)] hover:text-[var(--c-solid)] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-solid)] focus-visible:ring-offset-2 rounded"
        >
          Visa all aktivitet →
        </button>
      )}
    </div>
  );
};
