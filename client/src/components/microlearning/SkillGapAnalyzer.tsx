import { useState } from 'react';
import { X, Search, Loader2, Sparkles, CheckCircle, ArrowRight, Target, Lightbulb } from '@/components/ui/icons';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { aiService } from '@/services/aiService';
import { Autocomplete } from '@/components/common/Autocomplete';

interface SkillGapAnalyzerProps {
  onClose: () => void;
  onComplete: () => void;
}

interface SkillGap {
  skill: string;
  importance: 'critical' | 'high' | 'medium' | 'nice-to-have';
  demandLevel: 'very-high' | 'high' | 'medium' | 'low';
  rationale: string;
  estimatedLearningTime: string;
}

const COMMON_OCCUPATIONS = [
  { label: 'Systemutvecklare', value: 'systemutvecklare' },
  { label: 'Sjuksköterska', value: 'sjuksköterska' },
  { label: 'Lärare', value: 'lärare' },
  { label: 'Ekonomiassistent', value: 'ekonomiassistent' },
  { label: 'Kundtjänstmedarbetare', value: 'kundtjänst' },
  { label: 'Lagerarbetare', value: 'lagerarbetare' },
  { label: 'Vårdbiträde', value: 'vårdbiträde' },
  { label: 'Administratör', value: 'administratör' },
  { label: 'Säljare', value: 'säljare' },
  { label: 'Projektledare', value: 'projektledare' }
];

export default function SkillGapAnalyzer({ onClose, onComplete }: SkillGapAnalyzerProps) {
  const [step, setStep] = useState<'intro' | 'select-role' | 'analyzing' | 'results'>('intro');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedPaths, setSavedPaths] = useState<string[]>([]);

  const startAnalysis = async () => {
    setLoading(true);
    setStep('analyzing');

    try {
      // Hämta användarens CV-data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: cvData } = await supabase
        .from('cvs')
        .select('skills, work_experience, education')
        .eq('user_id', user.id)
        .maybeSingle();

      // Använd bara selectedRole från UI, inte från profilen (kolumnen finns inte)

      // Anropa Vercel API via aiService för analys
      const result = await aiService.kompetensgap({
        cvText: JSON.stringify({
          skills: cvData?.skills || [],
          workExperience: cvData?.work_experience || [],
          education: cvData?.education || []
        }),
        drömjobb: selectedRole || ''
      });
      
      // Parsa resultatet (som kommer som en string från aiService)
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
      const gaps = parsedResult.skillGaps || parsedResult;
      
      setSkillGaps(gaps);
      
      // Skapa learning paths i Supabase för varje gap
      if (user) {
        const pathIds: string[] = [];
        for (const gap of gaps.slice(0, 5)) {
          const { data: existing } = await supabase
            .from('user_learning_paths')
            .select('id')
            .eq('user_id', user.id)
            .eq('target_skill', gap.skill)
            .eq('status', 'ACTIVE')
            .single();

          if (!existing) {
            const { data: newPath } = await supabase
              .from('user_learning_paths')
              .insert({
                user_id: user.id,
                target_skill: gap.skill,
                skill_gap_source: 'CAREER_GOAL',
                priority: gap.importance === 'critical' ? 10 : gap.importance === 'high' ? 8 : 5,
                status: 'ACTIVE'
              })
              .select('id')
              .single();
            
            if (newPath) pathIds.push(newPath.id);
          } else {
            pathIds.push(existing.id);
          }
        }
        setSavedPaths(pathIds);
      }
      
      setStep('results');

    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      showToast.error('Kunde inte analysera kompetensgap');
      setStep('select-role');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (savedPaths.length > 0) {
      showToast.success(`${savedPaths.length} nya lärandemål skapade!`);
    }
    onComplete();
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'Kritisk';
      case 'high':
        return 'Hög';
      case 'medium':
        return 'Medium';
      default:
        return 'Nice-to-have';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Target className="text-indigo-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Kompetensanalys</h2>
              <p className="text-sm text-slate-700">
                {step === 'intro' && 'Upptäck vad du behöver lära dig'}
                {step === 'select-role' && 'Välj ditt målyrke'}
                {step === 'analyzing' && 'Analyserar ditt CV...'}
                {step === 'results' && 'Dina kompetensgap'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'intro' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-900">
                    Så här fungerar det
                  </h3>
                </div>
                <ul className="space-y-3 text-indigo-800">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      1
                    </span>
                    <span>Vi analyserar ditt CV och dina nuvarande kompetenser</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      2
                    </span>
                    <span>Du väljer vilket yrke du vill jobba med</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      3
                    </span>
                    <span>AI:n identifierar vilka kompetenser du saknar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      4
                    </span>
                    <span>Vi skapar en personlig lärandeplan med kurser</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                <Lightbulb className="text-amber-500 shrink-0" size={20} />
                <p className="text-sm text-amber-800">
                  Det tar bara några minuter. Du kan göra om analysen när som helst 
                  om dina mål ändras.
                </p>
              </div>

              <button
                onClick={() => setStep('select-role')}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                Starta analysen
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'select-role' && (
            <div className="space-y-6">
              <p className="text-slate-600">
                Välj det yrke du vill jobba med. Du kan även skriva in ett annat yrke 
                om det inte finns i listan.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vilket yrke siktar du på?
                </label>
                <Autocomplete
                  placeholder="T.ex. Systemutvecklare, Sjuksköterska..."
                  value={selectedRole}
                  onChange={() => {}}
                  onSelect={(option) => setSelectedRole(option.label)}
                  fetchSuggestions={async (query) => {
                    if (!query || query.length < 2) return [];
                    return COMMON_OCCUPATIONS.filter(o => 
                      o.label.toLowerCase().includes(query.toLowerCase())
                    );
                  }}
                  showCategories={false}
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Vanliga yrken att byta till:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COMMON_OCCUPATIONS.slice(0, 6).map(occupation => (
                    <button
                      key={occupation.value}
                      onClick={() => setSelectedRole(occupation.label)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedRole === occupation.label
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      {occupation.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startAnalysis}
                disabled={!selectedRole || loading}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Analyserar...
                  </>
                ) : (
                  <>
                    Analysera kompetensgap
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Analyserar ditt CV...
              </h3>
              <p className="text-slate-700 text-center max-w-sm">
                AI:n jämför dina kompetenser med vad som efterfrågas för {selectedRole}
              </p>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-emerald-900">
                    Analys klar!
                  </h3>
                  <p className="text-sm text-emerald-800">
                    Vi har identifierat {skillGaps.length} kompetenser att utveckla. 
                    Lärandemål har skapats automatiskt.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {skillGaps.map((gap, index) => (
                  <div
                    key={index}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-800">
                            {gap.skill}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getImportanceColor(gap.importance)}`}>
                            {getImportanceLabel(gap.importance)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {gap.rationale}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-700">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Efterfrågan: {gap.demandLevel === 'very-high' ? 'Mycket hög' : gap.demandLevel === 'high' ? 'Hög' : gap.demandLevel}
                          </span>
                          <span>
                            ⏱️ {gap.estimatedLearningTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 rounded-xl p-4">
                <h4 className="font-medium text-indigo-900 mb-2">
                  Nästa steg
                </h4>
                <p className="text-sm text-indigo-800">
                  Vi har skapat lärandemål för varje kompetens. Gå tillbaka till 
                  Mikro-Lärande Hub för att se rekommenderade kurser!
                </p>
              </div>

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Spara och gå till lärandemål
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'intro' && step !== 'results' && (
          <div className="p-6 border-t border-slate-200 flex justify-between">
            <button
              onClick={() => setStep(step === 'select-role' ? 'intro' : 'select-role')}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Tillbaka
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
