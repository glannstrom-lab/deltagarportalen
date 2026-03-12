/**
 * ParticipantList
 * Visar lista över konsulentens deltagare
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  FileText, 
  Briefcase, 
  MessageSquare,
  Calendar,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

interface Participant {
  participant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  priority: number;
  has_cv: boolean;
  ats_score: number | null;
  completed_interest_test: boolean;
  holland_code: string | null;
  saved_jobs_count: number;
  notes_count: number;
  last_contact_at: string | null;
  next_meeting_scheduled: string | null;
  last_login: string | null;
}

interface ParticipantListProps {
  participants: Participant[];
  view: 'grid' | 'list';
  onRefresh: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  view,
  onRefresh,
}) => {
  const getInitials = (p: Participant) => {
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || p.email[0].toUpperCase();
  };

  const getLastContactText = (date: string | null) => {
    if (!date) return 'Aldrig kontaktad';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Idag';
    if (days === 1) return 'Igår';
    if (days < 7) return `${days} dagar sedan`;
    return `${Math.floor(days / 7)} veckor sedan`;
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2: return 'bg-red-100 text-red-800 border-red-200';
      case 1: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Inga deltagare ännu</h3>
        <p className="text-gray-500 mb-6">
          Du har inte tilldelat några deltagare ännu.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Bjud in deltagare
        </button>
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants.map((p) => (
          <div
            key={p.participant_id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                  {getInitials(p)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {p.first_name} {p.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{p.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.priority > 0 && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(p.priority)}`}>
                    {p.priority === 2 ? 'Kritisk' : 'Hög'}
                  </span>
                )}
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">
                  {p.has_cv ? (p.ats_score ? `${p.ats_score}%` : 'Finns') : 'Saknas'}
                </p>
                <p className="text-xs text-gray-500">CV</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Briefcase className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">{p.saved_jobs_count}</p>
                <p className="text-xs text-gray-500">Jobb</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900">{p.notes_count}</p>
                <p className="text-xs text-gray-500">Anteckningar</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-1 ${
                !p.last_contact_at || new Date(p.last_contact_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ? 'text-amber-600'
                  : 'text-gray-500'
              }`}>
                <Calendar className="w-4 h-4" />
                {getLastContactText(p.last_contact_at)}
              </span>
              <Link
                to={`/profile/${p.participant_id}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Visa profil →
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Namn</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CV</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sparade jobb</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Senast kontakt</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Åtgärder</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {participants.map((p) => (
            <tr key={p.participant_id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {getInitials(p)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{p.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {p.priority > 0 && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(p.priority)}`}>
                    {p.priority === 2 ? 'Kritisk' : 'Hög'}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {p.has_cv ? (p.ats_score ? `${p.ats_score}/100` : '✓') : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {p.saved_jobs_count}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={
                  !p.last_contact_at || new Date(p.last_contact_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ? 'text-amber-600'
                    : 'text-gray-500'
                }>
                  {getLastContactText(p.last_contact_at)}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  to={`/profile/${p.participant_id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Visa →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
