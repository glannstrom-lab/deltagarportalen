/**
 * Enhanced Skills Editor
 * With categories, drag-drop sorting, and smart suggestions
 */

import { useState, useCallback } from 'react'
import { 
  GripVertical, Trash2, Plus, Sparkles, Star,
  Code, Users, Wrench, Palette, BarChart3, Globe,
  CheckCircle
} from 'lucide-react'

interface Skill {
  id: string
  name: string
  level: number // 1-5
  category: SkillCategory
}

type SkillCategory = 'technical' | 'soft' | 'language' | 'tool' | 'certification' | 'other'

interface SkillsEditorProps {
  skills: Skill[]
  onChange: (skills: Skill[]) => void
}

const categories: { value: SkillCategory; label: string; icon: any }[] = [
  { value: 'technical', label: 'Teknisk', icon: Code },
  { value: 'soft', label: 'Mjuk', icon: Users },
  { value: 'tool', label: 'Verktyg', icon: Wrench },
  { value: 'language', label: 'Språk', icon: Globe },
  { value: 'certification', label: 'Certifiering', icon: CheckCircle },
  { value: 'other', label: 'Övrigt', icon: Palette },
]

const skillSuggestions: Record<SkillCategory, string[]> = {
  technical: ['JavaScript', 'Python', 'React', 'SQL', 'HTML/CSS', 'Node.js', 'TypeScript', 'AWS'],
  soft: ['Kommunikation', 'Lagarbete', 'Problemlösning', 'Ledarskap', 'Tidsplanering', 'Anpassningsbar'],
  tool: ['Excel', 'PowerPoint', 'Photoshop', 'Figma', 'Salesforce', 'Jira', 'Slack'],
  language: ['Svenska', 'Engelska', 'Tyska', 'Franska', 'Spanska', 'Arabiska'],
  certification: ['Körkort B', 'Hygienpass', 'Säkerhetsklass', 'Första hjälpen', ' truckkort'],
  other: ['Projektledning', 'Eventplanering', 'Sociala medier', 'Kundservice'],
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('technical')
  const [showSuggestions, setShowSuggestions] = useState<SkillCategory | null>(null)

  const addSkill = (name: string = newSkillName, category: SkillCategory = newSkillCategory) => {
    if (!name.trim()) return
    
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: name.trim(),
      level: 3,
      category
    }
    onChange([...skills, newSkill])
    setNewSkillName('')
  }

  const updateSkill = (id: string, updates: Partial<Skill>) => {
    onChange(skills.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeSkill = (id: string) => {
    onChange(skills.filter(s => s.id !== id))
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedId === targetId) return
    
    const draggedIndex = skills.findIndex(s => s.id === draggedId)
    const targetIndex = skills.findIndex(s => s.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newSkills = [...skills]
    const [removed] = newSkills.splice(draggedIndex, 1)
    newSkills.splice(targetIndex, 0, removed)
    
    onChange(newSkills)
  }, [draggedId, skills, onChange])

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const getSkillsByCategory = (category: SkillCategory) => {
    return skills.filter(s => s.category === category)
  }

  const getCategoryIcon = (category: SkillCategory) => {
    const cat = categories.find(c => c.value === category)
    return cat ? <cat.icon className="w-4 h-4" /> : null
  }

  const getCategoryLabel = (category: SkillCategory) => {
    return categories.find(c => c.value === category)?.label || category
  }

  return (
    <div className="space-y-6">
      {/* Add new skill */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h4 className="font-medium text-slate-800 mb-3">Lägg till kompetens</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="t.ex. Projektledning"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button
            onClick={() => addSkill()}
            disabled={!newSkillName.trim()}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Lägg till
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-4">
          <button
            onClick={() => setShowSuggestions(showSuggestions ? null : newSkillCategory)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            Visa förslag för {getCategoryLabel(newSkillCategory).toLowerCase()}a kompetenser
          </button>
          
          {showSuggestions === newSkillCategory && (
            <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in duration-200">
              {skillSuggestions[newSkillCategory]
                .filter(s => !skills.some(existing => existing.name.toLowerCase() === s.toLowerCase()))
                .map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => addSkill(suggestion, newSkillCategory)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-purple-400 hover:text-purple-700 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills by category */}
      {categories.map(category => {
        const categorySkills = getSkillsByCategory(category.value)
        if (categorySkills.length === 0) return null

        return (
          <div key={category.value} className="space-y-3">
            <h4 className="font-medium text-slate-800 flex items-center gap-2">
              <category.icon className="w-4 h-4 text-purple-500" />
              {category.label}
              <span className="text-sm font-normal text-slate-400">({categorySkills.length})</span>
            </h4>
            
            <div className="space-y-2">
              {categorySkills.map((skill) => (
                <div
                  key={skill.id}
                  draggable
                  onDragStart={() => handleDragStart(skill.id)}
                  onDragOver={(e) => handleDragOver(e, skill.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg
                    hover:border-purple-300 transition-colors
                    ${draggedId === skill.id ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <span className="flex-1 font-medium text-slate-700">{skill.name}</span>
                  
                  {/* Star rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => updateSkill(skill.id, { level: star })}
                        className="p-0.5 focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            star <= skill.level
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {skills.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">Inga kompetenser tillagda ännu</p>
          <p className="text-sm text-slate-400">Lägg till dina kompetenser ovan</p>
        </div>
      )}
    </div>
  )
}
