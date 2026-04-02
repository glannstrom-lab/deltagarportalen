import { useState } from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  Bookmark, 
  ExternalLink,
  Star,
  Zap,
  Award,
  Heart,
  MoreVertical,
  Check
} from '@/components/ui/icons';
import { showToast } from '@/components/Toast';

interface Course {
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
}

interface CourseRecommendation {
  id: string;
  relevance_score: number;
  energy_level: 'LOW' | 'MEDIUM' | 'HIGH';
  match_reason: string;
  status: string;
  progress_percent: number;
  course: Course;
}

interface CourseCardProps {
  recommendation: CourseRecommendation;
  variant?: 'default' | 'progress' | 'completed' | 'compact';
  onProgressUpdate?: (recommendationId: string, progress: number) => void;
  onBookmark?: (recommendationId: string) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  'YOUTUBE': 'bg-red-100 text-red-700',
  'KHAN_ACADEMY': 'bg-green-100 text-green-700',
  'LINKEDIN_LEARNING': 'bg-blue-100 text-blue-700',
  'FUTURELEARN': 'bg-pink-100 text-pink-700',
  'COURSERA': 'bg-indigo-100 text-indigo-700',
  'UDEMY': 'bg-purple-100 text-purple-700',
  'OTHER': 'bg-slate-100 text-slate-700',
  'INTERNAL': 'bg-teal-100 text-teal-700'
};

const PROVIDER_NAMES: Record<string, string> = {
  'YOUTUBE': 'YouTube',
  'KHAN_ACADEMY': 'Khan Academy',
  'LINKEDIN_LEARNING': 'LinkedIn Learning',
  'FUTURELEARN': 'FutureLearn',
  'COURSERA': 'Coursera',
  'UDEMY': 'Udemy',
  'OTHER': 'Annan källa',
  'INTERNAL': 'Deltagarportalen'
};

const DIFFICULTY_LABELS: Record<string, string> = {
  'BEGINNER': 'Nybörjare',
  'INTERMEDIATE': 'Medel',
  'ADVANCED': 'Avancerad',
  'ALL_LEVELS': 'Alla nivåer'
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainingMinutes} min`;
}

function getEnergyColor(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'LOW':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'HIGH':
      return 'bg-red-100 text-red-700 border-red-200';
  }
}

function getEnergyLabel(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'LOW':
      return 'Låg energi';
    case 'MEDIUM':
      return 'Medel';
    case 'HIGH':
      return 'Hög energi';
  }
}

export default function CourseCard({ 
  recommendation, 
  variant = 'default',
  onProgressUpdate,
  onBookmark
}: CourseCardProps) {
  const { course, relevance_score, energy_level, match_reason, status, progress_percent, id } = recommendation;
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    // Öppna kursen i ny flik
    window.open(course.content_url, '_blank');
    
    // Uppdatera progress till "STARTED" (10%)
    if (status === 'SUGGESTED' && onProgressUpdate) {
      onProgressUpdate(id, 10);
    }
    
    setTimeout(() => setIsStarting(false), 1000);
  };

  const handleComplete = () => {
    if (onProgressUpdate) {
      onProgressUpdate(id, 100);
      showToast.success('Grattis! Kurs markerad som avslutad');
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(id);
    }
  };

  // Compact variant för listor
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
          <Play size={16} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 truncate">{course.title}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} />
            {formatDuration(course.duration_minutes)}
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            {PROVIDER_NAMES[course.provider] || course.provider}
          </div>
        </div>
        {progress_percent > 0 && (
          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${progress_percent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-2xl border transition-all ${
        isHovered ? 'border-indigo-300 shadow-md' : 'border-slate-200'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      {/* Thumbnail eller placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-2xl overflow-hidden">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={48} className="text-indigo-300" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getEnergyColor(energy_level)}`}>
            <Zap size={12} className="inline mr-1" />
            {getEnergyLabel(energy_level)}
          </span>
          {course.is_free && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
              Gratis
            </span>
          )}
        </div>
        
        {/* Progress overlay för pågående kurser */}
        {variant === 'progress' && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress_percent}%` }}
            />
          </div>
        )}
        
        {/* Completed badge */}
        {variant === 'completed' && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-white" />
            </div>
          </div>
        )}
        
        {/* Menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
        >
          <MoreVertical size={16} className="text-slate-600" />
        </button>
        
        {showMenu && (
          <div className="absolute top-12 right-3 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[150px] z-10">
            {status !== 'COMPLETED' && (
              <button
                onClick={handleBookmark}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <Bookmark size={14} />
                Spara för senare
              </button>
            )}
            {status === 'STARTED' && (
              <button
                onClick={handleComplete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
              >
                <Check size={14} />
                Markera som klar
              </button>
            )}
            <a
              href={course.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
            >
              <ExternalLink size={14} />
              Öppna i ny flik
            </a>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Provider badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PROVIDER_COLORS[course.provider] || PROVIDER_COLORS.OTHER}`}>
            {PROVIDER_NAMES[course.provider] || course.provider}
          </span>
          {course.difficulty && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
              {DIFFICULTY_LABELS[course.difficulty]}
            </span>
          )}
        </div>
        
        {/* Title */}
        <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">
          {course.title}
        </h4>
        
        {/* Description */}
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {course.description || match_reason}
        </p>
        
        {/* Match reason */}
        {variant !== 'completed' && (
          <div className="flex items-start gap-2 mb-3 p-2 bg-indigo-50 rounded-lg">
            <Heart size={14} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700">
              {match_reason}
            </p>
          </div>
        )}
        
        {/* Meta info */}
        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatDuration(course.duration_minutes)}
          </span>
          {course.rating && (
            <span className="flex items-center gap-1">
              <Star size={14} className="text-amber-500" />
              {course.rating.toFixed(1)}
            </span>
          )}
          {relevance_score >= 70 && (
            <span className="flex items-center gap-1 text-emerald-600">
              <Award size={14} />
              {relevance_score}% match
            </span>
          )}
        </div>
        
        {/* Skills tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {course.skills?.slice(0, 3).map((skill, idx) => (
            <span 
              key={idx}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
            >
              {skill}
            </span>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {variant === 'completed' ? (
            <button
              onClick={() => window.open(course.content_url, '_blank')}
              className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={16} />
              Se igen
            </button>
          ) : (
            <>
              <button
                onClick={handleStart}
                disabled={isStarting}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Startar...
                  </>
                ) : status === 'STARTED' ? (
                  <>
                    <Play size={16} />
                    Fortsätt ({progress_percent}%)
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Börja
                  </>
                )}
              </button>
              
              {status === 'SUGGESTED' && (
                <button
                  onClick={handleBookmark}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Spara för senare"
                >
                  <Bookmark size={18} className="text-slate-400" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
