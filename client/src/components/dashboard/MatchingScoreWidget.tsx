import { useState, useEffect } from 'react';
import { Target, TrendingUp, Briefcase, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trendsApi } from '@/services/api';

interface MatchingData {
  overallScore: number;
  matchingJobs: number;
  newJobsToday: number;
  topSkills: Array<{
    name: string;
    demand: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  missingSkills: string[];
}

export default function MatchingScoreWidget() {
  const [data, setData] = useState<MatchingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatchingData();
  }, []);

  const loadMatchingData = async () => {
    try {
      setLoading(true);
      
      const trendingSkills = await trendsApi.getTrendingSkills(5);
      
      const mockData: MatchingData = {
        overallScore: 68,
        matchingJobs: 245,
        newJobsToday: 12,
        topSkills: trendingSkills.slice(0, 3).map(s => ({
          name: s.skill,
          demand: s.demand,
          trend: s.trend as 'up' | 'down' | 'stable'
        })),
        missingSkills: ['Azure', 'Python', 'Agil utveckling']
      };
      
      setData(mockData);
    } catch (error) {
      console.error('Fel vid hamtning av matchningsdata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-amber-50';
    return 'bg-red-50';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreBg(data.overallScore)}`}>
            <Target className={getScoreColor(data.overallScore)} size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Din matchningsgrad</h3>
            <p className="text-sm text-slate-500">Hur val ditt CV matchar arbetsmarknaden</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
            {data.overallScore}%
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
        <div
          className={`h-full rounded-full transition-all ${
            data.overallScore >= 80 ? 'bg-green-500' :
            data.overallScore >= 60 ? 'bg-blue-500' :
            data.overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${data.overallScore}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className="text-[#4f46e5]" />
            <span className="text-sm text-slate-600">Matchande jobb</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{data.matchingJobs}</p>
          {data.newJobsToday > 0 && (
            <p className="text-xs text-green-600 mt-1">+{data.newJobsToday} nya idag</p>
          )}
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-[#4f46e5]" />
            <span className="text-sm text-slate-600">Toppkompetenser</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {data.topSkills.map((skill) => (
              <span
                key={skill.name}
                className="text-xs px-2 py-0.5 bg-white rounded-full text-slate-600"
              >
                {skill.name}
                {skill.trend === 'up' && ' ↑'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {data.missingSkills.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">
                Kompetenser som efterfragas:
              </p>
              <div className="flex flex-wrap gap-2">
                {data.missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2 py-1 bg-white text-amber-700 rounded-full"
                  >
                    {skill}
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
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] transition-colors"
        >
          <Briefcase size={16} />
          Se matchande jobb
        </Link>
        <Link
          to="/career"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <TrendingUp size={16} />
          Utveckla kompetenser
        </Link>
      </div>
    </div>
  );
}
