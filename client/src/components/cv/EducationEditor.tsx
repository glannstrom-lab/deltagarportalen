/**
 * Enhanced Education Editor
 * Similar to ExperienceEditor but tailored for education
 */

import { useState } from 'react'
import { 
  GraduationCap, School, MapPin, Calendar, 
  ChevronDown, ChevronUp, GripVertical, Trash2,
  Award, CheckCircle, AlertCircle, Sparkles
} from '@/components/ui/icons'
import { RichTextEditor } from './RichTextEditor'
import type { Education } from '@/services/supabaseApi'

interface EducationEditorProps {
  education: Education[]
  onChange: (education: Education[]) => void
}

const educationLevels = [
  { value: 'grundskola', label: 'Grundskola' },
  { value: 'gymnasium', label: 'Gymnasieutbildning' },
  { value: 'yrkeshogskola', label: 'Yrkeshögskola' },
  { value: 'hogskola', label: 'Högskola/Universitet' },
  { value: 'master', label: 'Masterexamen' },
  { value: 'doktor', label: 'Doktorsexamen' },
  { value: 'annan', label: 'Annan utbildning' },
]

export function EducationEditor({ education, onChange }: EducationEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    education.length === 1 ? education[0].id : null
  )
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const addEducation = () => {
    const newEd: Education = {
      id: crypto.randomUUID(),
      school: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
    onChange([...education, newEd])
    setExpandedId(newEd.id)
  }

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    const updated = education.map(ed =>
      ed.id === id ? { ...ed, [field]: value } : ed
    )
    onChange(updated)
  }

  const removeEducation = (id: string) => {
    onChange(education.filter(ed => ed.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedId === targetId) return
    
    const draggedIndex = education.findIndex(ed => ed.id === draggedId)
    const targetIndex = education.findIndex(ed => ed.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newEducation = [...education]
    const [removed] = newEducation.splice(draggedIndex, 1)
    newEducation.splice(targetIndex, 0, removed)
    
    onChange(newEducation)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const getCompletionStatus = (ed: Education) => {
    const required = ['school', 'degree', 'startDate']
    const filled = required.filter(field => ed[field as keyof Education])
    return {
      complete: filled.length === required.length,
      count: filled.length,
      total: required.length
    }
  }

  const getEducationLabel = (degree: string) => {
    return educationLevels.find(l => l.value === degree)?.label || degree
  }

  return (
    <div className="space-y-4">
      {education.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
          <GraduationCap className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-700 mb-1">Inga utbildningar tillagda ännu</p>
          <p className="text-sm text-stone-600 mb-4">Lägg till din utbildningsbakgrund</p>
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            + Lägg till utbildning
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {education.map((ed) => {
              const isExpanded = expandedId === ed.id
              const status = getCompletionStatus(ed)
              
              return (
                <div
                  key={ed.id}
                  draggable
                  onDragStart={() => handleDragStart(ed.id)}
                  onDragOver={(e) => handleDragOver(e, ed.id)}
                  onDragEnd={handleDragEnd}
                  className={`
                    bg-white border rounded-xl overflow-hidden transition-all
                    ${isExpanded ? 'border-purple-300 shadow-md' : 'border-stone-200 hover:border-stone-300'}
                    ${draggedId === ed.id ? 'opacity-50' : ''}
                  `}
                >
                  {/* Header */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : ed.id)}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <div className="text-stone-300 hover:text-stone-700 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${status.complete ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}
                    `}>
                      {status.complete ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-stone-800 truncate">
                        {ed.degree || 'Ny utbildning'}
                      </h4>
                      <p className="text-sm text-stone-700 truncate">
                        {ed.school || 'Skola/Universitet'}
                        {ed.field && <span className="text-stone-600"> · {ed.field}</span>}
                      </p>
                    </div>
                    
                    <button className="p-1 hover:bg-stone-200 rounded">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-stone-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-stone-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-stone-100">
                      <div className="pt-4 space-y-4">
                        {/* Education Level */}
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Utbildningsnivå
                          </label>
                          <select
                            value={ed.level || ''}
                            onChange={(e) => updateEducation(ed.id, 'level', e.target.value)}
                            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          >
                            <option value="">Välj nivå...</option>
                            {educationLevels.map(level => (
                              <option key={level.value} value={level.value}>
                                {level.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Degree/Program */}
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Examen/Program *
                          </label>
                          <div className="relative">
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                            <input
                              type="text"
                              value={ed.degree}
                              onChange={(e) => updateEducation(ed.id, 'degree', e.target.value)}
                              placeholder="t.ex. Civilingenjör"
                              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Field of Study */}
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Ämnesområde
                          </label>
                          <input
                            type="text"
                            value={ed.field}
                            onChange={(e) => updateEducation(ed.id, 'field', e.target.value)}
                            placeholder="t.ex. Datateknik"
                            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* School */}
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Skola/Universitet *
                          </label>
                          <div className="relative">
                            <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                            <input
                              type="text"
                              value={ed.school}
                              onChange={(e) => updateEducation(ed.id, 'school', e.target.value)}
                              placeholder="t.ex. KTH"
                              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Ort
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                            <input
                              type="text"
                              value={ed.location}
                              onChange={(e) => updateEducation(ed.id, 'location', e.target.value)}
                              placeholder="t.ex. Stockholm"
                              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Startdatum *
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                              <input
                                type="month"
                                value={ed.startDate}
                                onChange={(e) => updateEducation(ed.id, 'startDate', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">
                              Slutdatum
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
                              <input
                                type="month"
                                value={ed.endDate}
                                onChange={(e) => updateEducation(ed.id, 'endDate', e.target.value)}
                                disabled={ed.current}
                                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-stone-100 disabled:text-stone-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Current education checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ed.current}
                            onChange={(e) => updateEducation(ed.id, 'current', e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-stone-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-stone-700">Pågående utbildning</span>
                        </label>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">
                            Beskrivning (valfritt)
                          </label>
                          <RichTextEditor
                            value={ed.description || ''}
                            onChange={(value) => updateEducation(ed.id, 'description', value)}
                            placeholder="Beskriv vad du lärt dig, specialiseringar, projekt..."
                            maxLength={500}
                            minHeight="80px"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <button
                            onClick={() => removeEducation(ed.id)}
                            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Ta bort
                          </button>
                          
                          <button
                            onClick={() => setExpandedId(null)}
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Klar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={addEducation}
            className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            + Lägg till ytterligare en utbildning
          </button>
        </>
      )}
    </div>
  )
}
