/**
 * ConsultantStats
 * Statistik-kort för konsulent-dashboard
 */

import React from 'react';
import { Users, UserCheck, AlertTriangle, Award } from 'lucide-react';

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
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Aktiva deltagare',
      value: stats.active,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Kräver uppmärksamhet',
      value: stats.needsAttention,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Kompletta CV (>70%)',
      value: stats.completedCV,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
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
