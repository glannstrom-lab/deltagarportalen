import { useState, useEffect } from 'react';
import { Target, TrendingUp, GraduationCap, Briefcase, Award, ArrowRight, MapPin, Calendar, DollarSign, Loader2, Save, History, Trash2, Star } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { careerPathApi, type SavedCareerPath } from '@/services/careerApi';
import { showToast } from '@/components/Toast';
import type { AutocompleteOption } from '@/components/common/Autocomplete';
import { COMMON_OCCUPATIONS } from './occupations';

// AI API call
async function generateCareerPlanWithAI(data: {
  currentOccupation: string;
  targetOccupation: string;
  experienceYears: number;
}) {
  const response = await fetch('/api/ai/career', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      function: 'karriarplan',
      data
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('Kunde inte generera karriärplan');
  }
  
  return response.json();
}

interface CareerStep {
  order: number;
  title: string;
  description: string;
  timeframe: string;
  actions: string[];
  education?: string[];
}

interface CareerPath {
  current: {
    occupation: string;
    experience: string;
    salary: number;
  };
  target: {
    occupation: string;
    salary: number;
    demand: 'high' | 'medium' | 'low';
    jobCount: number;
  };
  steps: CareerStep[];
  timeline: string;
  salaryIncrease: number;
  analysis?: string;
  marketAnalysis?: {
    salaryAnalysis?: string;
    salaryIncrease?: string;
    jobMarket: string;
    competition: string;
    timelineEstimate: string;
  };
  keySkills?: string[];
  challenges?: string[];
  salaryProgression?: Array<{
    stage: string;
    estimatedSalary: number;
    notes: string;
  }>;
  aiEstimated?: boolean;
}

export default function CareerCoach() {
  const [currentOccupation, setCurrentOccupation] = useState<AutocompleteOption | null>(null);
  const [targetOccupation, setTargetOccupation] = useState<AutocompleteOption | null>(null);
  const [currentExperience, setCurrentExperience] = useState('3');
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [savedPaths, setSavedPaths] = useState<SavedCareerPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchOccupations = async (query: string): Promise<AutocompleteOption[]> => {
    if (!query || query.length < 2) return [];
    
    // Filter local occupations list
    const filtered = COMMON_OCCUPATIONS.filter(o => 
      o.label.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, 10);
  };

  // Load saved career paths on mount
  useEffect(() => {
    loadSavedPaths();
  }, []);

  const loadSavedPaths = async () => {
    try {
      const paths = await careerPathApi.getAll();
      setSavedPaths(paths);
    } catch (error) {
      console.error('Failed to load saved paths:', error);
    }
  };

  const saveCareerPath = async () => {
    if (!careerPath) return;
    
    setSaving(true);
    try {
      await careerPathApi.save({
        current_occupation: careerPath.current.occupation,
        target_occupation: careerPath.target.occupation,
        experience_years: parseInt(currentExperience),
        current_salary: careerPath.current.salary,
        target_salary: careerPath.target.salary,
        salary_increase: careerPath.salaryIncrease,
        timeline_months: parseInt(careerPath.timeline.split('-')[0]) * 12,
        demand_level: careerPath.target.demand,
        job_count: careerPath.target.jobCount,
        steps: careerPath.steps
      });
      showToast.success('Karriärvägen sparad!');
      await loadSavedPaths();
    } catch (error) {
      showToast.error('Kunde inte spara karriärvägen');
    } finally {
      setSaving(false);
    }
  };

  const deleteSavedPath = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await careerPathApi.delete(id);
      showToast.success('Karriärvägen borttagen');
      await loadSavedPaths();
    } catch (error) {
      showToast.error('Kunde inte ta bort karriärvägen');
    }
  };

  const loadSavedPath = (path: SavedCareerPath) => {
    setCurrentOccupation({ id: path.current_occupation, label: path.current_occupation });
    setTargetOccupation({ id: path.target_occupation, label: path.target_occupation });
    setCurrentExperience(path.experience_years.toString());
    setCareerPath({
      current: {
        occupation: path.current_occupation,
        experience: `${path.experience_years} år`,
        salary: path.current_salary
      },
      target: {
        occupation: path.target_occupation,
        salary: path.target_salary,
        demand: path.demand_level,
        jobCount: path.job_count
      },
      salaryIncrease: path.salary_increase,
      timeline: `${Math.ceil(path.timeline_months / 12)}-${Math.ceil(path.timeline_months / 12) + 1} år`,
      steps: path.steps as CareerStep[]
    });
    setShowHistory(false);
    showToast.success('Karriärvägen laddad');
  };

  const generateCareerPath = async () => {
    if (!currentOccupation || !targetOccupation) return;
    
    setLoading(true);
    
    try {
      const expYears = parseInt(currentExperience);
      
      // Generera AI-baserad karriärplan med AI:s egna löneuppskattningar
      let aiSteps: CareerStep[] = [];
      let aiAnalysis: string | undefined;
      let aiMarketAnalysis: CareerPath['marketAnalysis'] | undefined;
      let aiKeySkills: string[] | undefined;
      let aiChallenges: string[] | undefined;
      let aiSalaryProgression: CareerPath['salaryProgression'] | undefined;
      let aiCurrentSalary = 35000;
      let aiTargetSalary = 45000;
      let aiJobCount = 0;
      let aiDemand: 'high' | 'medium' | 'low' = 'medium';
      let aiTimeline = `${Math.max(1, Math.min(3, expYears > 5 ? 1 : 2))}-${Math.max(2, Math.min(4, expYears > 5 ? 2 : 3))} år`;
      
      try {
        const aiResult = await generateCareerPlanWithAI({
          currentOccupation: currentOccupation.label,
          targetOccupation: targetOccupation.label,
          experienceYears: expYears
        });
        
        // API:et returnerar data direkt (inte inuti en "plan" property)
        const planData = aiResult.plan || aiResult;
        
        if (planData?.steps && planData.steps.length > 0) {
          aiSteps = planData.steps;
          aiAnalysis = planData.analysis;
          aiMarketAnalysis = planData.marketAnalysis;
          aiKeySkills = planData.keySkills;
          aiChallenges = planData.challenges;
          aiSalaryProgression = planData.salaryProgression;
          
          // Använd AI:s uppskattade löner och marknadsdata
          aiCurrentSalary = planData.estimatedCurrentSalary || 35000;
          aiTargetSalary = planData.estimatedTargetSalary || 45000;
          aiJobCount = planData.estimatedJobCount || 500;
          aiDemand = planData.demandLevel || 'medium';
          aiTimeline = planData.marketAnalysis?.timelineEstimate || aiTimeline;
        } else {
          // AI returned but no steps - use fallback
          console.warn('AI returned no steps, using fallback');
          aiSteps = generateSteps(currentOccupation.label, targetOccupation.label, expYears, 2);
          aiAnalysis = 'Kunde inte generera AI-analys. Visar generiska steg.';
        }
      } catch (aiError: any) {
        console.error('AI generation failed, using fallback:', aiError);
        // Use fallback steps instead of showing error
        aiSteps = generateSteps(currentOccupation.label, targetOccupation.label, expYears, 2);
        aiAnalysis = `Kunde inte generera AI-analys: ${aiError.message || 'Okänt fel'}. Visar generiska steg.`;
      }
      
      const path: CareerPath = {
        current: {
          occupation: currentOccupation.label,
          experience: `${currentExperience} år`,
          salary: aiCurrentSalary,
        },
        target: {
          occupation: targetOccupation.label,
          salary: aiTargetSalary,
          demand: aiDemand,
          jobCount: aiJobCount,
        },
        timeline: aiTimeline,
        salaryIncrease: aiTargetSalary - aiCurrentSalary,
        steps: aiSteps,
        analysis: aiAnalysis,
        marketAnalysis: aiMarketAnalysis,
        keySkills: aiKeySkills,
        challenges: aiChallenges,
        salaryProgression: aiSalaryProgression,
        aiEstimated: true,
      };
      
      setCareerPath(path);
    } catch (error) {
      console.error('Fel vid generering av karriärväg:', error);
      showToast.error('Kunde inte generera karriärväg');
    } finally {
      setLoading(false);
    }
  };

  // Generera karriärsteg baserat på yrken och erfarenhet
  function generateSteps(current: string, target: string, expYears: number, timelineYears: number): CareerStep[] {
    const steps: CareerStep[] = [
      {
        order: 1,
        title: 'Stärk din bas',
        description: `Utveckla djup kompetens inom ${current} för att bli en erkänd expert innan du byter fokus.`,
        timeframe: `${Math.ceil(timelineYears * 0.3)}-6 månader`,
        actions: [
          'Ta lead på ett komplext projekt inom ditt nuvarande område',
          'Dokumentera dina resultat med konkreta siffror',
          'Bygg en portfolio som visar din expertis',
          'Nätverka inom branschen på LinkedIn'
        ],
        education: [
          'Avancerad certifiering inom din specialisering',
          'Workshop i personligt varumärke'
        ],
      },
      {
        order: 2,
        title: 'Brobyggande kompetens',
        description: `Börja utveckla färdigheter som är relevanta för ${target} samtidigt som du utnyttjar din ${current}-bakgrund.`,
        timeframe: `${Math.ceil(timelineYears * 0.3)}-6 månader`,
        actions: [
          'Identifiera överförbara färdigheter mellan yrkena',
          'Ta ett sidoprojekt eller konsultuppdrag inom målområdet',
          'Hitta en mentor som jobbar med ${target}',
          'Delta i branschträffar och webinarier'
        ],
        education: [
          'Online-kurs inom målområdet',
          'Kurs i projektledning eller ledarskap'
        ],
      },
      {
        order: 3,
        title: 'Praktisk erfarenhet',
        description: 'Skaffa konkret erfarenhet av målyrket genom praktiska projekt.',
        timeframe: `${Math.ceil(timelineYears * 0.2)}-4 månader`,
        actions: [
          'Sök volontäruppdrag eller praktik inom målområdet',
          'Erbjud hjälp med ett projekt för att bygga portfolio',
          'Dokumentera allt du lär dig',
          'Be om referenser och rekommendationer'
        ],
        education: [
          'Yrkeshögskoleutbildning eller motsvarande',
          'Branschspecifik certifiering'
        ],
      },
      {
        order: 4,
        title: 'Positionering för bytet',
        description: `Gör dig redo att söka ${target}-roller med en stark pitch som kopplar din bakgrund till det nya.`,
        timeframe: '2-4 månader',
        actions: [
          'Uppdatera CV och LinkedIn med ny kompetens',
          'Skriv ett personligt brev som berättar din övergångsberättelse',
          'Aktivt nätverka med rekryterare i målbranschen',
          'Sök roller internt eller externt'
        ],
      },
    ];

    return steps;
  }

  const formatSalary = (amount: number) => {
    return `${amount.toLocaleString()} kr`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4f46e5] to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Karriärcoachen</h2>
            <p className="text-white/80">Planera din väg framåt med data från Arbetsförmedlingen</p>
          </div>
        </div>
        
        <p className="text-white/90 max-w-2xl">
          Berätta var du är idag och vart du vill komma. Vår AI analyserar din bakgrund 
          och skapar en skräddarsydd karriärplan med konkreta steg för att nå ditt mål.
        </p>
      </div>

      {/* Historik-knapp */}
      {savedPaths.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-[#4f46e5] hover:bg-white rounded-xl transition-colors"
          >
            <History size={18} />
            {showHistory ? 'Dölj historik' : `Visa sparade vägar (${savedPaths.length})`}
          </button>
        </div>
      )}

      {/* Sparade vägar */}
      {showHistory && savedPaths.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="text-amber-500" size={20} />
            Dina sparade karriärvägar
          </h3>
          <div className="space-y-3">
            {savedPaths.map((path) => (
              <div
                key={path.id}
                onClick={() => loadSavedPath(path)}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-slate-800">{path.current_occupation}</span>
                    <ArrowRight className="inline mx-2 text-slate-400" size={16} />
                    <span className="font-medium text-[#4f46e5]">{path.target_occupation}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      +{(path.salary_increase / 1000).toFixed(0)}k kr
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {Math.ceil(path.timeline_months / 12)} år
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {new Date(path.created_at).toLocaleDateString('sv-SE')}
                  </span>
                  <button
                    onClick={(e) => deleteSavedPath(path.id, e)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input-formulär */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-4">Din karriärsituation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nuvarande yrke
            </label>
            <Autocomplete
              placeholder="T.ex. Systemutvecklare"
              value={currentOccupation?.label || ''}
              onChange={() => {}}
              onSelect={setCurrentOccupation}
              fetchSuggestions={fetchOccupations}
              showCategories={false}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nuvarande erfarenhet
            </label>
            <select
              value={currentExperience}
              onChange={(e) => setCurrentExperience(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
            >
              <option value="0">Ingen erfarenhet (nyexaminerad)</option>
              <option value="1">1 år</option>
              <option value="2">2 år</option>
              <option value="3">3 år</option>
              <option value="5">5 år</option>
              <option value="7">7 år</option>
              <option value="10">10+ år</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Målyrke (dit du vill komma)
            </label>
            <Autocomplete
              placeholder="T.ex. Tech Lead"
              value={targetOccupation?.label || ''}
              onChange={() => {}}
              onSelect={setTargetOccupation}
              fetchSuggestions={fetchOccupations}
              showCategories={false}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateCareerPath}
              disabled={!currentOccupation || !targetOccupation || loading}
              className="w-full py-2.5 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  AI skapar din plan...
                </span>
              ) : 'Generera karriärväg med AI'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultat */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <div className="animate-spin w-10 h-10 border-3 border-[#4f46e5] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">AI:n skapar din personliga karriärplan...</p>
          <p className="text-sm text-slate-400 mt-2">Analyserar kompetensöverföring och skapar skräddarsydda steg</p>
        </div>
      )}

      {!loading && careerPath && (
        <>
          {/* Översikt */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Nu</p>
                  <p className="font-semibold text-slate-800">{careerPath.current.occupation}</p>
                  <p className="text-sm text-slate-600">{formatSalary(careerPath.current.salary)}/mån</p>
                </div>
                
                <ArrowRight className="text-slate-400" size={24} />
                
                <div className="text-center">
                  <p className="text-sm text-slate-500">Mål</p>
                  <p className="font-semibold text-slate-800">{careerPath.target.occupation}</p>
                  <p className="text-sm text-slate-600">{formatSalary(careerPath.target.salary)}/mån</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center px-4 py-2 bg-green-50 rounded-xl">
                  <p className="text-xs text-slate-500">Löneökning</p>
                  <p className="text-lg font-bold text-green-600">+{formatSalary(careerPath.salaryIncrease)}</p>
                </div>
                <div className="text-center px-4 py-2 bg-blue-50 rounded-xl">
                  <p className="text-xs text-slate-500">Tidslinje</p>
                  <p className="text-lg font-bold text-blue-600">{careerPath.timeline}</p>
                </div>
                <div className="text-center px-4 py-2 bg-purple-50 rounded-xl">
                  <p className="text-xs text-slate-500">Efterfrågan</p>
                  <p className="text-lg font-bold text-purple-600">
                    {careerPath.target.demand === 'high' ? 'Hög' : careerPath.target.demand === 'medium' ? 'Medel' : 'Låg'}
                  </p>
                  <p className="text-xs text-slate-400">{careerPath.target.jobCount} lediga jobb</p>
                </div>
              </div>
            </div>
          </div>

          {/* Steg-för-steg */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800">Din väg framåt</h3>
            
            {careerPath.steps && careerPath.steps.length > 0 ? careerPath.steps.map((step) => (
              <div
                key={step.order}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#4f46e5] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {step.order}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-800">{step.title}</h4>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        <Calendar size={12} className="inline mr-1" />
                        {step.timeframe}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{step.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Konkreta åtgärder:</p>
                        <ul className="space-y-1">
                          {step.actions && step.actions.map((action, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                              <ArrowRight size={14} className="text-[#4f46e5]" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {step.education && step.education.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Rekommenderad utbildning:</p>
                          <ul className="space-y-1">
                            {step.education.map((edu, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                <GraduationCap size={14} className="text-[#4f46e5]" />
                                {edu}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Inga steg kunde genereras. Försök igen.</p>
              </div>
            )}
          </div>

          {/* AI Analys */}
          {careerPath.analysis && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Briefcase className="text-blue-600" size={20} />
                AI:s analys av din karriärövergång
              </h3>
              <p className="text-slate-700 leading-relaxed">{careerPath.analysis}</p>
            </div>
          )}

          {/* Marknadsanalys */}
          {careerPath.marketAnalysis && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                Marknadsanalys
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-700 font-medium mb-1">Löneutveckling</p>
                  <p className="text-slate-700 text-sm">{careerPath.marketAnalysis.salaryIncrease}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium mb-1">Jobbmarknad</p>
                  <p className="text-slate-700 text-sm">{careerPath.marketAnalysis.jobMarket}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-700 font-medium mb-1">Konkurrens</p>
                  <p className="text-slate-700 text-sm">{careerPath.marketAnalysis.competition}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-700 font-medium mb-1">Uppskattad tidslinje</p>
                  <p className="text-slate-700 text-sm">{careerPath.marketAnalysis.timelineEstimate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nyckelkompetenser */}
          {careerPath.keySkills && careerPath.keySkills.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                Viktiga kompetenser för {careerPath.target.occupation}
              </h3>
              <div className="flex flex-wrap gap-2">
                {careerPath.keySkills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Utmaningar */}
          {careerPath.challenges && careerPath.challenges.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="text-red-500" size={20} />
                Möjliga utmaningar att förbereda sig för
              </h3>
              <ul className="space-y-2">
                {careerPath.challenges.map((challenge, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Löneutveckling */}
          {careerPath.salaryProgression && careerPath.salaryProgression.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="text-green-600" size={20} />
                Uppskattad löneutveckling
              </h3>
              <div className="space-y-3">
                {careerPath.salaryProgression.map((stage, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-20 font-medium text-slate-700">{stage.stage}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.min(100, (stage.estimatedSalary / 80000) * 100)}%` }} />
                        <span className="font-semibold text-green-700">
                          {stage.estimatedSalary.toLocaleString()} kr
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{stage.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 py-3 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] transition-colors"
            >
              Justera min plan
            </button>
            <button
              onClick={saveCareerPath}
              disabled={saving}
              className="flex-1 py-3 bg-white border-2 border-[#4f46e5] text-[#4f46e5] rounded-xl font-medium hover:bg-[#4f46e5]/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Spara karriärväg
                </>
              )}
            </button>
            <a
              href="/job-search"
              className="flex-1 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-center"
            >
              Sök jobb
            </a>
          </div>
        </>
      )}

      {!loading && !careerPath && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <Target size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Planera din karriär med AI</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Fyll i ditt nuvarande yrke och vart du vill komma. Vår AI analyserar 
            kompetensöverföringen och skapar en skräddarsydd väg framåt.
          </p>
        </div>
      )}
    </div>
  );
}
