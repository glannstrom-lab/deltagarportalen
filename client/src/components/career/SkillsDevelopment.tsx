import { useState, useEffect } from 'react';
import { Wrench, TrendingUp, BookOpen, Award, Search, Loader2, ArrowRight, Star, Zap, Heart, CheckCircle, Bookmark, Trash2, Brain } from 'lucide-react';
import { Autocomplete } from '@/components/common/Autocomplete';
import { skillsApi, type UserSkill } from '@/services/careerApi';
import { showToast } from '@/components/Toast';
import type { AutocompleteOption } from '@/components/common/Autocomplete';
import { COMMON_OCCUPATIONS } from './occupations';

// AI API call for skills data
async function getSkillsFromAI(occupation: string, currentOccupation?: string) {
  const response = await fetch('/api/ai/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      function: 'skills',
      data: { occupation, currentOccupation }
    })
  });
  
  if (!response.ok) {
    throw new Error('Kunde inte hämta kompetenser');
  }
  
  return response.json();
}

interface AISkill {
  name: string;
  importance: string;
  howToLearn: string;
  timeToAcquire?: string;
}

interface AICertification {
  name: string;
  value: string;
  provider: string;
}

export default function SkillsDevelopment() {
  const [occupation, setOccupation] = useState<AutocompleteOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [technicalSkills, setTechnicalSkills] = useState<AISkill[]>([]);
  const [softSkills, setSoftSkills] = useState<AISkill[]>([]);
  const [certifications, setCertifications] = useState<AICertification[]>([]);
  const [priority, setPriority] = useState<Array<{rank: number; skill: string; reason: string}>>([]);
  const [gapAnalysis, setGapAnalysis] = useState<string>('');
  const [learningPath, setLearningPath] = useState<Array<{step: number; action: string; timeframe: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedSkills, setSavedSkills] = useState<UserSkill[]>([]);

  // Load saved skills on mount
  useEffect(() => {
    loadSavedSkills();
  }, []);

  const loadSavedSkills = async () => {
    try {
      const skills = await skillsApi.getAll();
      setSavedSkills(skills);
    } catch (error) {
      console.error('Failed to load saved skills:', error);
    }
  };

  const saveSkill = async (skillName: string, category: 'technical' | 'soft' | 'certification' | 'language', occupationName: string) => {
    try {
      await skillsApi.save({
        skill_name: skillName,
        category,
        frequency: 50,
        target_occupation: occupationName,
        status: 'interested',
        priority: 0
      });
      showToast.success('Kompetensen sparad!');
      await loadSavedSkills();
    } catch (error) {
      showToast.error('Kunde inte spara kompetensen');
    }
  };

  const deleteSavedSkill = async (id: string) => {
    try {
      await skillsApi.delete(id);
      showToast.success('Kompetensen borttagen');
      await loadSavedSkills();
    } catch (error) {
      showToast.error('Kunde inte ta bort kompetensen');
    }
  };

  const isSkillSaved = (skillName: string, occupationName: string) => {
    return savedSkills.find(s => 
      s.skill_name === skillName && s.target_occupation === occupationName
    );
  };

  const fetchOccupations = async (query: string): Promise<AutocompleteOption[]> => {
    if (!query || query.length < 2) return [];
    
    const filtered = COMMON_OCCUPATIONS.filter(o => 
      o.label.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, 10);
  };

  const analyzeSkills = async () => {
    if (!occupation) return;
    
    setLoading(true);
    
    try {
      // Hämta kompetenser från AI
      const aiResult = await getSkillsFromAI(occupation.label);
      
      if (aiResult.skillsData) {
        setTechnicalSkills(aiResult.skillsData.technicalSkills || []);
        setSoftSkills(aiResult.skillsData.softSkills || []);
        setCertifications(aiResult.skillsData.certifications || []);
        setPriority(aiResult.skillsData.priority || []);
        setGapAnalysis(aiResult.skillsData.gapAnalysis || '');
        setLearningPath(aiResult.skillsData.learningPath || []);
      }
    } catch (error) {
      console.error('Fel vid kompetensanalys:', error);
      showToast.error('Kunde inte hämta kompetenser från AI');
    } finally {
      setLoading(false);
    }
  };

  // Kombinera alla skills till en array
  const skills = [
    ...technicalSkills.map(s => ({ ...s, category: 'technical' as const })),
    ...softSkills.map(s => ({ ...s, category: 'soft' as const })),
    ...certifications.map(c => ({ 
      name: c.name, 
      importance: c.value,
      howToLearn: c.provider,
      category: 'certification' as const
    }))
  ];

  // Filtrera skills efter kategori
  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(s => s.category === selectedCategory);

  const categories = [
    { id: 'all', title: 'Alla kompetenser', icon: Wrench },
    { id: 'technical', title: 'Tekniska', icon: Zap },
    { id: 'soft', title: 'Mjuka färdigheter', icon: TrendingUp },
    { id: 'certification', title: 'Certifieringar', icon: Award },
    { id: 'language', title: 'Språk', icon: BookOpen },
  ];

  const getDemandColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-700';
      case 'soft': return 'bg-purple-100 text-purple-700';
      case 'certification': return 'bg-amber-100 text-amber-700';
      case 'language': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'Teknisk';
      case 'soft': return 'Mjuk färdighet';
      case 'certification': return 'Certifiering';
      case 'language': return 'Språk';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Wrench size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Kompetensutveckling</h2>
            <p className="text-white/80">Se vilka kompetenser som efterfrågas just nu</p>
          </div>
        </div>
        
        <p className="text-white/90 max-w-2xl">
          Analysera aktuella jobbannonser för att se vilka färdigheter, certifieringar 
          och språkkunskaper arbetsgivare efterfrågar mest för ditt yrke.
        </p>
      </div>

      {/* Sök */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Välj yrke att analysera
            </label>
            <Autocomplete
              placeholder="T.ex. Systemutvecklare, Sjuksköterska..."
              value={occupation?.label || ''}
              onChange={() => {}}
              onSelect={setOccupation}
              fetchSuggestions={fetchOccupations}
              showCategories={false}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={analyzeSkills}
              disabled={!occupation || loading}
              className="w-full md:w-auto px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyserar...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Analysera
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sparade kompetenser */}
      {savedSkills.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Bookmark className="text-emerald-500" size={16} />
            Dina sparade kompetenser ({savedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg group"
              >
                <span className="text-sm text-emerald-700 font-medium">{skill.skill_name}</span>
                <span className="text-xs text-emerald-500">({skill.target_occupation})</span>
                <button
                  onClick={() => deleteSavedSkill(skill.id)}
                  className="text-emerald-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultat */}
      {!loading && skills.length > 0 && (
        <div className="space-y-6">
          {/* Kategoritabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = cat.id === 'all' 
                ? skills.length 
                : skills.filter(s => s.category === cat.id).length;
                
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {cat.title}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skills grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => {
              const savedSkill = occupation ? isSkillSaved(skill.name, occupation.label) : null;
              return (
              <div
                key={skill.name}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getDemandColor(skill.category)}`}>
                      {getCategoryLabel(skill.category)}
                    </span>
                    {savedSkill ? (
                      <button
                        onClick={() => deleteSavedSkill(savedSkill.id)}
                        className="p-1 text-green-600 hover:text-red-500 transition-colors"
                        title="Ta bort från sparade"
                      >
                        <CheckCircle size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => occupation && saveSkill(skill.name, skill.category, occupation.label)}
                        disabled={!occupation}
                        className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Spara kompetens"
                      >
                        <Heart size={18} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <TrendingUp size={14} />
                    Viktighet: {skill.importance}
                  </div>
                </div>
                
                {skill.howToLearn && (
                  <div className="text-sm text-slate-600">
                    <p className="text-xs text-slate-400 mb-1">Efterfrågas av:</p>
                    <p className="line-clamp-2">{skill.top_employers.join(', ')}</p>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      )}

      {!loading && skills.length === 0 && occupation && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <Wrench size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Inga kompetenser hittades</h3>
          <p className="text-slate-500">
            Kunde inte extrahera kompetenser från jobbannonser. Detta kan bero på att få annonser nämner specifika kompetenser eller att yrket är ovanligt.
          </p>
        </div>
      )}

      {!loading && !occupation && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
          <Search size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">Analysera kompetensbehov</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Välj ett yrke ovan för att se vilka kompetenser som efterfrågas mest 
            baserat på aktuella jobbannonser från Arbetsförmedlingen.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
            <Star size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-emerald-900 mb-2">Tips för kompetensutveckling</h4>
            <ul className="space-y-2 text-emerald-800">
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="mt-1 shrink-0" />
                <span>Prioritera kompetenser som förekommer i många annonser - de ger störst chans till jobb</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="mt-1 shrink-0" />
                <span>Kolla vilka arbetsgivare som efterfrågar kompetensen - följ dem på LinkedIn</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="mt-1 shrink-0" />
                <span>Kombinera tekniska kompetenser med mjuka färdigheter för bästa resultat</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="mt-1 shrink-0" />
                <span>Överväg certifieringar - många arbetsgivare ser det som ett plus</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
