/**
 * ConsultantStats
 * Statistik-kort för konsulent-dashboard
 */

import React from 'react';
import { Users, UserCheck, AlertTriangle, Award } from '@/components/ui/icons';

interface Stats {
  total: number;
  active: number;
  needsAttention: number;
  completedCV: number;
}

interface ConsultantStatsProps {
  stats: Stats;
}

export const ConsultantStats: React.FC<ConsultantStatsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Totalt antal deltagare',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Aktiva deltagare',
      value: stats.active,
      icon: UserCheck,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Kräver uppmärksamhet',
      value: stats.needsAttention,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Kompletta CV (>70%)',
      value: stats.completedCV,
      icon: Award,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-stone-900 rounded-lg shadow-sm border border-gray-200 dark:border-stone-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-stone-400">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-stone-100 mt-1">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
