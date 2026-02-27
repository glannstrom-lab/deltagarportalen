/**
 * UserLevel
 * Visar användarens level, poäng och streak
 */

import React, { useEffect, useState } from 'react';
import { Flame, Star, Trophy, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface GamificationData {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  weekly_progress: number;
  weekly_goal: number;
}

export const UserLevel: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching gamification:', error);
      }

      // Om ingen data finns, skapa default
      if (!data) {
        const defaultData = {
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          level: 1,
          weekly_progress: 0,
          weekly_goal: 5,
        };
        
        // Spara till databasen
        await supabase.from('user_gamification').insert({
          user_id: user?.id,
          ...defaultData,
        });
        
        setData(defaultData);
      } else {
        setData(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (!data) return null;

  // Beräkna XP till nästa level
  const pointsForNextLevel = data.level * 100;
  const currentLevelPoints = data.total_points % 100;
  const progressPercent = (currentLevelPoints / pointsForNextLevel) * 100;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/70">Level {data.level}</p>
            <p className="text-xl font-bold">{data.total_points} XP</p>
          </div>
        </div>
        
        {data.current_streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-500/30 px-3 py-1 rounded-full">
            <Flame className="w-4 h-4 text-orange-300" />
            <span className="text-sm font-medium">{data.current_streak} dagar</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Nästa level</span>
          <span>{currentLevelPoints}/{pointsForNextLevel} XP</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Weekly goal */}
      <div className="flex items-center gap-2 text-sm">
        <Target className="w-4 h-4 text-white/70" />
        <span className="text-white/70">
          Veckans mål: {data.weekly_progress}/{data.weekly_goal}
        </span>
      </div>
    </div>
  );
};
