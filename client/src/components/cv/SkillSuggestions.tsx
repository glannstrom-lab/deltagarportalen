import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Check, Loader2 } from 'lucide-react';
import { taxonomyApi } from '@/services/api';

interface Skill {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  category: 'technical' | 'soft' | 'tool' | 'language';
}

interface SkillSuggestionsProps {
  occupationTitle: string;
  currentSkills: Skill[];
  onAddSkill: (skill: { name: string; category: Skill['category'] }) => void;
}

export default function SkillSuggestions({ 
  occupationTitle, 
  currentSkills, 
  onAddSkill 
}: SkillSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    preferred_label: string;
    isAdded: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    if (occupationTitle && occupationTitle.length > 2) {
      loadSuggestions();
    }
  }, [occupationTitle]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      // Sök efter yrket först
      const occupations = await taxonomyApi.searchOccupations(occupationTitle, 1);
      
      if (occupations.length > 0) {
        // Hämta kompetenser för yrket
        const skills = await taxonomyApi.getSkillsForOccupation(occupations[0].id);
        
        // Markera vilka som redan finns
        const currentSkillNames = currentSkills.map(s => s.name.toLowerCase());
        const enrichedSkills = skills.map(skill => ({
          ...skill,
          isAdded: currentSkillNames.includes(skill.preferred_label.toLowerCase())
        }));
        
        setSuggestions(enrichedSkills.slice(0, 10));
      }
    } catch (error) {
      console.error('Fel vid hämtning av kompetensförslag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skill: typeof suggestions[0]) => {
    onAddSkill({
      name: skill.preferred_label,
      category: 'technical'
    });
    
    // Markera som tillagd
    setSuggestions(prev => 
      prev.map(s => s.id === skill.id ? { ...s, isAdded: true } : s)
    );
  };

  if (!occupationTitle || occupationTitle.length < 3) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-blue-500" />
          <p className="text-sm text-blue-700">Hämtar kompetensförslag...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const addedCount = suggestions.filter(s => s.isAdded).length;
  const availableSuggestions = suggestions.filter(s => !s.isAdded);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="text-amber-600" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900">Kompetensförslag</h4>
            <p className="text-sm text-amber-700">
              Vanliga kompetenser för {occupationTitle}
              {addedCount > 0 && ` • ${addedCount} tillagda`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-sm text-amber-700 hover:text-amber-900"
        >
          {showSuggestions ? 'Dölj' : 'Visa'}
        </button>
      </div>

      {showSuggestions && (
        <>
          {availableSuggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleAddSkill(skill)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-800 text-sm rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <Plus size={14} />
                  {skill.preferred_label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700">
              Bra jobbat! Du har lagt till alla föreslagna kompetenser.
            </p>
          )}

          {addedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="text-xs text-amber-600 mb-2">Redan tillagda:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions
                  .filter(s => s.isAdded)
                  .map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg"
                    >
                      <Check size={12} />
                      {skill.preferred_label}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
