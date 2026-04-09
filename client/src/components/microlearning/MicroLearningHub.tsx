import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Flame, 
  Trophy, 
  Target, 
  Zap,
  Play,
  CheckCircle,
  Bookmark,
  Filter,
  Loader2,
  Lightbulb,
  TrendingUp,
  Award,
  Heart
} from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { aiService } from '@/services/aiService';
import CourseCard from './CourseCard';
import SkillGapAnalyzer from './SkillGapAnalyzer';
import EnergyLevelSelector from './EnergyLevelSelector';

interface LearningStats {
  total_courses_started: number;
  total_courses_completed: number;
  total_time_spent_minutes: number;
  current_streak_days: number;
  skills_in_progress: number;
  certifications_count: number;
}

interface LearningPath {
  id: string;
  target_skill: string;
  priority: number;
  status: string;
}

interface Achievement {
  icon: string;
  title: string;
}

interface CourseRecommendation {
  id: string;
  relevance_score: number;
  energy_level: 'LOW' | 'MEDIUM' | 'HIGH';
  match_reason: string;
  status: string;
  progress_percent: number;
  course: {
    id: string;
    title: string;
    description: string;
    provider: string;
    thumbnail_url?: string;
    content_url: string;
    duration_minutes: number;
    difficulty: string;
    is_free: boolean;
    skills: string[];
    rating?: number;
    view_count?: number;
  };
}

export default function MicroLearningHub() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [inProgressCourses, setInProgressCourses] = useState<CourseRecommendation[]>([]);
  const [completedCourses, setCompletedCourses] = useState<CourseRecommendation[]>([]);
  const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [showGapAnalyzer, setShowGapAnalyzer] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'short' | 'beginner'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadRecommendations();
    }
  }, [energyLevel]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Hämta statistik (fallback om funktionen inte finns än)
      try {
        const { data: statsData } = await supabase
          .rpc('get_user_learning_stats');
        setStats(statsData);
      } catch {
        // Sätt default-värden om funktionen inte finns
        setStats({
          total_courses_started: 0,
          total_courses_completed: 0,
          total_time_spent_minutes: 0,
          current_streak_days: 0,
          skills_in_progress: 0,
          certifications_count: 0
        });
      }
      
      // Hämta learning paths
      const { data: paths, error: pathsError } = await supabase
        .from('user_learning_paths')
        .select('id, target_skill, priority, status')
        .eq('status', 'ACTIVE')
        .order('priority', { ascending: false });
        
      if (pathsError) throw pathsError;
      setLearningPaths(paths || []);
      
      // Hämta pågående kurser
      await loadInProgressCourses();
      
      // Hämta avslutade kurser
      await loadCompletedCourses();
      
      // Hämta rekommendationer
      await loadRecommendations();
      
    } catch (error) {
      console.error('Error loading learning data:', error);
      showToast.error('Kunde inte ladda ditt lärande');
    } finally {
      setLoading(false);
    }
  };

  const loadInProgressCourses = async () => {
    const { data, error } = await supabase
      .from('user_recommended_courses')
      .select('*')
      .eq('status', 'STARTED')
      .order('progress_percent', { ascending: false })
      .limit(5);
      
    if (!error && data) {
      setInProgressCourses(data as CourseRecommendation[]);
    }
  };

  const loadCompletedCourses = async () => {
    const { data, error } = await supabase
      .from('user_recommended_courses')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(5);
      
    if (!error && data) {
      setCompletedCourses(data as CourseRecommendation[]);
    }
  };

  const loadRecommendations = async () => {
    try {
      // Hämta kurser direkt från databasen istället för via Edge Function
      let query = supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .eq('is_free', true);
      
      // Filtrera på längd baserat på energinivå
      if (energyLevel === 'LOW') {
        query = query.lte('duration_minutes', 15);
      } else if (energyLevel === 'MEDIUM') {
        query = query.lte('duration_minutes', 30);
      }
      
      const { data: courses, error } = await query.limit(6);
      
      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }
      
      // Konvertera till CourseRecommendation format
      const recs = courses?.map(course => ({
        id: `temp-${course.id}`,
        relevance_score: 80,
        energy_level: course.duration_minutes <= 15 ? 'LOW' : course.duration_minutes <= 30 ? 'MEDIUM' : 'HIGH',
        match_reason: 'Rekommenderad för din energinivå',
        status: 'SUGGESTED',
        progress_percent: 0,
        course: {
          id: course.id,
          title: course.title,
          description: course.description || '',
          provider: course.provider,
          thumbnail_url: course.thumbnail_url,
          content_url: course.content_url,
          duration_minutes: course.duration_minutes,
          difficulty: course.difficulty_level || 'BEGINNER',
          is_free: course.is_free,
          skills: course.skills_tags || [],
          rating: course.rating,
          view_count: course.view_count
        }
      })) || [];
      
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleProgressUpdate = async (recommendationId: string, progress: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learning-progress`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recommendationId,
            progressPercent: progress,
            action: 'update'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to update progress');

      const data = await response.json();
      
      if (data.isCompleted) {
        showToast.success(data.message);
        if (data.achievements?.length > 0) {
          data.achievements.forEach((achievement: Achievement) => {
            showToast.success(`${achievement.icon} ${achievement.title}`);
          });
        }
      }
      
      // Uppdatera listorna
      await loadData();
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast.error('Kunde inte uppdatera progress');
    }
  };

  const handleBookmark = async (recommendationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learning-progress`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recommendationId,
            action: 'bookmark'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to bookmark');

      showToast.success('Sparad för senare');
      await loadData();
    } catch (error) {
      console.error('Error bookmarking:', error);
      showToast.error('Kunde inte spara');
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (activeFilter === 'short') return rec.course.duration_minutes <= 15;
    if (activeFilter === 'beginner') return rec.course.difficulty === 'BEGINNER';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header med statistik */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mikro-Lärande Hub</h2>
            <p className="text-white/80">Små steg till nya kompetenser</p>
          </div>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Trophy size={16} />
                Kurser klara
              </div>
              <p className="text-2xl font-bold">{stats.total_courses_completed}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Clock size={16} />
                Tid investerad
              </div>
              <p className="text-2xl font-bold">{Math.round(stats.total_time_spent_minutes / 60)}h</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Flame size={16} />
                Dagars streak
              </div>
              <p className="text-2xl font-bold">{stats.current_streak_days}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Target size={16} />
                Skills på gång
              </div>
              <p className="text-2xl font-bold">{stats.skills_in_progress}</p>
            </div>
          </div>
        )}
      </div>

      {/* Energinivå-selector */}
      <EnergyLevelSelector 
        value={energyLevel} 
        onChange={setEnergyLevel} 
      />

      {/* Kompetensgap-analys CTA */}
      {learningPaths.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Lightbulb className="text-amber-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                Upptäck vad du behöver lära dig
              </h3>
              <p className="text-amber-800 mb-4">
                Låt oss analysera ditt CV och dina karriärmål för att hitta de kompetenser 
                som ger dig störst chans att få jobb.
              </p>
              <button
                onClick={() => setShowGapAnalyzer(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
              >
                Starta kompetensanalys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aktiva lärandemål */}
      {learningPaths.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Target className="text-indigo-500" size={20} />
              Dina lärandemål
            </h3>
            <button
              onClick={() => setShowGapAnalyzer(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Lägg till nytt
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {learningPaths.map(path => (
              <div 
                key={path.id}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl"
              >
                <span className="text-indigo-700 font-medium">{path.target_skill}</span>
                <span className="text-xs text-indigo-500">Prio {path.priority}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pågående kurser */}
      {inProgressCourses.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Play className="text-emerald-500" size={20} />
            Fortsätt där du slutade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.map(rec => (
              <CourseCard
                key={rec.id}
                recommendation={rec}
                variant="progress"
                onProgressUpdate={handleProgressUpdate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Rekommendationer */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} />
              Rekommenderat för dig
              {learningPaths.length > 0 && (
                <span className="text-sm font-normal text-slate-700">
                  (baserat på: {learningPaths[0]?.target_skill})
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-600" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as 'all' | 'short' | 'beginner')}
                className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500"
              >
                <option value="all">Alla</option>
                <option value="short">Korta (&lt;15 min)</option>
                <option value="beginner">Nybörjare</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecommendations.map(rec => (
              <CourseCard
                key={rec.id}
                recommendation={rec}
                onProgressUpdate={handleProgressUpdate}
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        </section>
      )}

      {/* Avslutade kurser */}
      {completedCourses.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={20} />
            Avslutade kurser
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCourses.map(rec => (
              <CourseCard
                key={rec.id}
                recommendation={rec}
                variant="completed"
              />
            ))}
          </div>
        </section>
      )}

      {/* Gap Analyzer Modal */}
      {showGapAnalyzer && (
        <SkillGapAnalyzer
          onClose={() => setShowGapAnalyzer(false)}
          onComplete={() => {
            setShowGapAnalyzer(false);
            loadData();
          }}
        />
      )}

      {/* Tips-sektion */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-900 mb-2">
              Tips för låg energi
            </h4>
            <p className="text-indigo-800 text-sm">
              Du behöver inte göra allt på en gång. Välj kurser som är under 15 minuter 
              när energin är låg. Varje litet steg räknas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
