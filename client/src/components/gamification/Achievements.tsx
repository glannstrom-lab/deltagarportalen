/**
 * Achievements
 * Visar användarens badges och achievements
 */

import React, { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import * as LucideIcons from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earned_at?: string;
}

export const Achievements: React.FC = () => {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      // Hämta alla achievements
      const { data: allAchievements, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false });

      if (achError) throw achError;

      // Hämta användarens earned achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id);

      if (userError) throw userError;

      // Kombinera
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id));
      
      const combined = allAchievements?.map(ach => ({
        ...ach,
        earned: earnedIds.has(ach.id),
        earned_at: userAchievements?.find(ua => ua.achievement_id === ach.id)?.earned_at,
      })) || [];

      setAchievements(combined);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Award;
    return Icon;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      CV: 'bg-blue-100 text-blue-700 border-blue-200',
      JOBS: 'bg-green-100 text-green-700 border-green-200',
      LOGIN: 'bg-orange-100 text-orange-700 border-orange-200',
      NETWORK: 'bg-purple-100 text-purple-700 border-purple-200',
      SKILL: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />;
  }

  const earnedCount = achievements.filter(a => a.earned).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Achievements</h3>
        <span className="text-sm text-gray-500">
          {earnedCount}/{achievements.length} upplåsta
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.slice(0, 6).map((achievement) => {
          const IconComponent = getIconComponent(achievement.icon);
          
          return (
            <div
              key={achievement.id}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                achievement.earned
                  ? getCategoryColor(achievement.category)
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  achievement.earned ? 'bg-white/50' : 'bg-gray-200'
                }`}>
                  {achievement.earned ? (
                    <IconComponent className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{achievement.name}</p>
                  <p className="text-xs opacity-75 line-clamp-2">{achievement.description}</p>
                  {achievement.earned && (
                    <p className="text-xs font-medium mt-1">+{achievement.points} XP</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {achievements.length > 6 && (
        <button className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
          Visa alla achievements →
        </button>
      )}
    </div>
  );
};
