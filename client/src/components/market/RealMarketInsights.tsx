import { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Briefcase, DollarSign, Award, Users, BarChart3 } from 'lucide-react';
import { trendsApi } from '@/services/api';
import type { MarketStats, TrendingSkill, PopularSearch } from '@/services/afTrendsApi';

export default function RealMarketInsights() {
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([]);
  const [popularOccupations, setPopularOccupations] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, skills, occupations] = await Promise.all([
        trendsApi.getMarketStats(),
        trendsApi.getTrendingSkills(10),
        trendsApi.getPopularSearches('occupations', 10),
      ]);
      
      setMarketStats(stats);
      setTrendingSkills(skills);
      setPopularOccupations(occupations);
    } catch (error) {
      console.error('Fel vid hämtning av marknadsdata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-[#4f46e5] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Översikt */}
      {marketStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Briefcase}
            label="Lediga jobb"
            value={marketStats.total_jobs.toLocaleString('sv-SE')}
            subtext={`+${marketStats.new_jobs_today} idag`}
            color="blue"
          />
          <StatCard
            icon={Users}
            label="Konkurrens"
            value={`${marketStats.competition_index} sökande/jobb`}
            subtext="Genomsnitt"
            color="purple"
          />
          <StatCard
            icon={BarChart3}
            label="Rekryteringstid"
            value={`${marketStats.avg_time_to_hire_days} dagar`}
            subtext="Genomsnitt"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Nya jobb denna vecka"
            value={`+${marketStats.new_jobs_week}`}
            subtext="Senaste 7 dagarna"
            color="orange"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Populära yrken */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-[#4f46e5]" size={24} />
            <h3 className="font-semibold text-slate-800">Mest efterfrågade yrken</h3>
          </div>
          
          <div className="space-y-3">
            {popularOccupations.map((occupation, index) => (
              <div
                key={occupation.term}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-[#4f46e5] text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-800">{occupation.term}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{occupation.count} jobb</span>
                  {occupation.trend === 'up' && (
                    <span className="text-green-500 text-xs font-medium">↑</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trendande kompetenser */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#4f46e5]" size={24} />
            <h3 className="font-semibold text-slate-800">Trendande kompetenser</h3>
          </div>
          
          <div className="space-y-3">
            {trendingSkills.map((skill) => (
              <div
                key={skill.skill}
                className="p-3 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    {skill.average_salary && (
                      <span className="text-sm text-green-600 font-medium">
                        {Math.round(skill.average_salary / 1000)}k kr
                      </span>
                    )}
                    {skill.trend === 'up' && (
                      <span className="text-green-500 text-xs">↑ Växer</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{skill.job_count} jobb</span>
                  <span>•</span>
                  <span>Efterfrågan: {skill.demand}%</span>
                </div>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-[#4f46e5] h-2 rounded-full transition-all"
                    style={{ width: `${skill.demand}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional statistik */}
      {marketStats?.by_region && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-[#4f46e5]" size={24} />
            <h3 className="font-semibold text-slate-800">Jobb per region</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketStats.by_region.map((region) => (
              <div
                key={region.region}
                className="p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{region.region}</span>
                  <span className="text-sm text-slate-500">{region.job_count} jobb</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-[#4f46e5] h-2 rounded-full"
                      style={{ 
                        width: `${Math.min((region.job_count / 28500) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  {region.growth_percent > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      +{region.growth_percent}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Datakälla */}
      <p className="text-xs text-slate-500 text-center">
        Data från Arbetsförmedlingen • Uppdaterat: {marketStats?.last_updated 
          ? new Date(marketStats.last_updated).toLocaleDateString('sv-SE')
          : 'Nyligen'}
      </p>
    </div>
  );
}

// Hjälpkomponent för statistik-kort
interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  subtext: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
  );
}
