import { useState, useEffect } from 'react';
import { Target, TrendingUp, Briefcase, AlertCircle, FileText } from '@/components/ui/icons';
import { Link } from 'react-router-dom';
import { trendsApi } from '@/services/api';
import { useDashboardData } from '@/hooks/useDashboardData';

interface TrendingSkill {
  name: string;
  demand: number;
  trend: 'up' | 'down' | 'stable';
}

export default function MatchingScoreWidget() {
  const { data, loading: dashboardLoading } = useDashboardData();
  const [topSkills, setTopSkills] = useState<TrendingSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const trending = await trendsApi.getTrendingSkills(5);
        if (!cancelled) {
          setTopSkills(
            trending.slice(0, 3).map((s) => ({
              name: s.skill,
              demand: s.demand,
              trend: s.trend as 'up' | 'down' | 'stable',
            }))
          );
        }
      } catch (error) {
        console.error('Fel vid hämtning av trending skills:', error);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = dashboardLoading || skillsLoading;

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-2 border-brand-900 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Empty state: ingen CV ännu
  if (!data?.cv?.hasCV) {
    return (
      <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <Target className="text-brand-900 dark:text-brand-300" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">Din matchningsgrad</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Skapa ditt CV för att se hur väl du matchar arbetsmarknaden
            </p>
          </div>
        </div>
        <Link
          to="/cv"
          className="flex items-center justify-center gap-2 py-2.5 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-brand-900/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2"
        >
          <FileText size={16} />
          Börja med CV
        </Link>
      </div>
    );
  }

  const overallScore = data.cv.atsScore || 0;
  const matchingJobs = data.jobs.savedCount;
  const missingSections = data.cv.missingSections || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-brand-900';
    if (score >= 60) return 'text-blue-700';
    if (score >= 40) return 'text-amber-700';
    return 'text-stone-700';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-brand-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-amber-50';
    return 'bg-stone-100';
  };

  const sectionLabels: Record<string, string> = {
    profile: 'Personliga uppgifter',
    summary: 'Sammanfattning',
    work_experience: 'Arbetslivserfarenhet',
    education: 'Utbildning',
    skills: 'Färdigheter',
  };

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreBg(overallScore)}`}>
            <Target className={getScoreColor(overallScore)} size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">Din matchningsgrad</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">CV-styrka enligt ATS-analys</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </span>
        </div>
      </div>

      <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-3 mb-6">
        <div
          className={`h-full rounded-full transition-all ${
            overallScore >= 80 ? 'bg-brand-900' :
            overallScore >= 60 ? 'bg-blue-600' :
            overallScore >= 40 ? 'bg-amber-600' : 'bg-stone-400'
          }`}
          style={{ width: `${overallScore}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className="text-brand-900" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Sparade jobb</span>
          </div>
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">{matchingJobs}</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-brand-900" />
            <span className="text-sm text-stone-600 dark:text-stone-400">Eftertraktade kompetenser</span>
          </div>
          {topSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {topSkills.map((skill) => (
                <span
                  key={skill.name}
                  className="text-xs px-2 py-0.5 bg-white dark:bg-stone-800 rounded-full text-stone-600 dark:text-stone-400"
                >
                  {skill.name}
                  {skill.trend === 'up' && ' ↑'}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 mt-2">Hämtar marknadsdata…</p>
          )}
        </div>
      </div>

      {missingSections.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                Komplettera ditt CV:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingSections.map((section) => (
                  <span
                    key={section}
                    className="text-xs px-2 py-1 bg-white dark:bg-stone-800 text-amber-800 dark:text-amber-300 rounded-full"
                  >
                    {sectionLabels[section] || section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          to="/job-search"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-brand-900/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2"
        >
          <Briefcase size={16} />
          Se matchande jobb
        </Link>
        <Link
          to="/career"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2"
        >
          <TrendingUp size={16} />
          Utveckla kompetenser
        </Link>
      </div>
    </div>
  );
}
