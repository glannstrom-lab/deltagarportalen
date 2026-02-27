/**
 * RecentActivity
 * Visar senaste aktivitet för konsulenten
 */

import React from 'react';
import { 
  UserPlus, 
  FileText, 
  MessageSquare, 
  Briefcase,
  Clock 
} from 'lucide-react';

// Placeholder data - ska hämtas från databas senare
const recentActivities = [
  {
    id: 1,
    type: 'participant_joined',
    message: 'Anna Andersson accepterade inbjudan',
    time: '2 timmar sedan',
    icon: UserPlus,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 2,
    type: 'cv_updated',
    message: 'Erik Svensson uppdaterade sitt CV',
    time: '5 timmar sedan',
    icon: FileText,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 3,
    type: 'note_added',
    message: 'Du lade till en anteckning på Maria Nilsson',
    time: 'Igår',
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 4,
    type: 'job_saved',
    message: 'Lisa Johansson sparade 3 nya jobb',
    time: 'Igår',
    icon: Briefcase,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
];

export const RecentActivity: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Senaste aktivitet</h3>
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center`}>
              <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
        Visa all aktivitet →
      </button>
    </div>
  );
};
