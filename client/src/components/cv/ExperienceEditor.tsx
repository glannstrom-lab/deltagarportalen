/**
 * Enhanced Work Experience Editor
 * Better UX with collapsible cards, smart fields, and validation
 */

import { useState } from 'react'
import {
  Briefcase, Building2, MapPin, Calendar,
  ChevronDown, ChevronUp, GripVertical, Trash2,
  Sparkles, CheckCircle, AlertCircle, ArrowUp, ArrowDown
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import type { WorkExperience } from '@/services/supabaseApi'

interface ExperienceEditorProps {
  experiences: WorkExperience[]
  onChange: (experiences: WorkExperience[]) => void
}

interface ValidationErrors {
  [key: string]: {
    company?: string
    title?: string
    startDate?: string
  }
}

export function ExperienceEditor({ experiences, onChange }: ExperienceEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    experiences.length === 1 ? experiences[0].id : null
  )
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: crypto.randomUUID(),
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
    onChange([...experiences, newExp])
    setExpandedId(newExp.id)
  }

  const updateExperience = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    const updated = experiences.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    )
    onChange(updated)

    // Clear error when user types
    if (errors[id]?.[field as 'company' | 'title' | 'startDate']) {
      setErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], [field]: undefined }
      }))
    }
  }

  const removeExperience = (id: string) => {
    onChange(experiences.filter(exp => exp.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const validateExperience = (exp: WorkExperience): boolean => {
    const expErrors: Partial<ValidationErrors[string]> = {}

    if (!exp.company.trim()) {
      expErrors.company = 'Företagsnamn krävs'
    }
    if (!exp.title.trim()) {
      expErrors.title = 'Jobbtitel krävs'
    }
    if (!exp.startDate) {
      expErrors.startDate = 'Startdatum krävs'
    }

    if (Object.keys(expErrors).length > 0) {
      setErrors(prev => ({ ...prev, [exp.id]: expErrors as ValidationErrors[string] }))
      return false
    }
    return true
  }

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedId === targetId) return
    
    const draggedIndex = experiences.findIndex(exp => exp.id === draggedId)
    const targetIndex = experiences.findIndex(exp => exp.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    const newExperiences = [...experiences]
    const [removed] = newExperiences.splice(draggedIndex, 1)
    newExperiences.splice(targetIndex, 0, removed)
    
    onChange(newExperiences)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  // Move experience up (keyboard accessible alternative to drag)
  const moveExperienceUp = (id: string) => {
    const index = experiences.findIndex(exp => exp.id === id)
    if (index <= 0) return
    const newExperiences = [...experiences]
    ;[newExperiences[index - 1], newExperiences[index]] = [newExperiences[index], newExperiences[index - 1]]
    onChange(newExperiences)
  }

  // Move experience down
  const moveExperienceDown = (id: string) => {
    const index = experiences.findIndex(exp => exp.id === id)
    if (index === -1 || index >= experiences.length - 1) return
    const newExperiences = [...experiences]
    ;[newExperiences[index], newExperiences[index + 1]] = [newExperiences[index + 1], newExperiences[index]]
    onChange(newExperiences)
  }

  const getDuration = (startDate: string, endDate: string, current: boolean) => {
    if (!startDate) return ''
    
    const start = new Date(startDate)
    const end = current ? new Date() : (endDate ? new Date(endDate) : new Date())
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth())
    
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    
    if (years === 0) return `${remainingMonths} mån`
    if (remainingMonths === 0) return `${years} år`
    return `${years} år ${remainingMonths} mån`
  }

  const getCompletionStatus = (exp: WorkExperience) => {
    const required = ['company', 'title', 'startDate']
    const filled = required.filter(field => exp[field as keyof WorkExperience])
    return {
      complete: filled.length === required.length,
      count: filled.length,
      total: required.length
    }
  }

  return (
    <div className="space-y-4">
      {experiences.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">Inga jobb tillagda ännu</p>
          <p className="text-sm text-slate-400 mb-4">Lägg till din första arbetslivserfarenhet</p>
          <button
            onClick={addExperience}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            + Lägg till jobb
          </button>
        </div>
      ) : (
        <>
          {/* Experience List */}
          <div className="space-y-3" role="list" aria-label="Arbetslivserfarenhet">
            {experiences.map((exp, index) => {
              const isExpanded = expandedId === exp.id
              const status = getCompletionStatus(exp)
              const duration = getDuration(exp.startDate, exp.endDate, exp.current)

              return (
                <div
                  key={exp.id}
                  draggable
                  onDragStart={() => handleDragStart(exp.id)}
                  onDragOver={(e) => handleDragOver(e, exp.id)}
                  onDragEnd={handleDragEnd}
                  role="listitem"
                  className={`
                    bg-white border rounded-xl overflow-hidden transition-all
                    ${isExpanded ? 'border-purple-300 shadow-md' : 'border-slate-200 hover:border-slate-300'}
                    ${draggedId === exp.id ? 'opacity-50' : ''}
                  `}
                >
                  {/* Header - Always visible */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    role="button"
                    aria-expanded={isExpanded}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setExpandedId(isExpanded ? null : exp.id)
                      }
                    }}
                  >
                    {/* Move buttons (keyboard accessible) */}
                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveExperienceUp(exp.id)}
                        disabled={index === 0}
                        className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Flytta ${exp.title || 'erfarenhet'} uppåt`}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveExperienceDown(exp.id)}
                        disabled={index === experiences.length - 1}
                        className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Flytta ${exp.title || 'erfarenhet'} nedåt`}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Status indicator */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${status.complete ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}
                    `}>
                      {status.complete ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-xs font-bold">{status.count}/{status.total}</span>
                      )}
                    </div>
                    
                    {/* Title and company */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 truncate">
                        {exp.title || 'Ny position'}
                      </h4>
                      <p className="text-sm text-slate-500 truncate">
                        {exp.company || 'Företagsnamn'} 
                        {duration && <span className="text-slate-400"> · {duration}</span>}
                      </p>
                    </div>
                    
                    {/* Expand/collapse */}
                    <button className="p-1 hover:bg-slate-200 rounded">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <div className="pt-4 space-y-4">
                        {/* Job Title */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Jobbtitel *
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                              onBlur={() => {
                                if (!exp.title.trim()) {
                                  setErrors(prev => ({
                                    ...prev,
                                    [exp.id]: { ...prev[exp.id], title: 'Jobbtitel krävs' }
                                  }))
                                }
                              }}
                              placeholder="t.ex. Butikssäljare"
                              aria-required="true"
                              aria-invalid={!!errors[exp.id]?.title}
                              className={`
                                w-full pl-10 pr-4 py-2.5 border rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-purple-500
                                ${errors[exp.id]?.title ? 'border-red-300 bg-red-50' : 'border-slate-200'}
                              `}
                            />
                          </div>
                          {errors[exp.id]?.title && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <AlertCircle className="w-3 h-3" /> {errors[exp.id].title}
                            </p>
                          )}
                        </div>

                        {/* Company */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Företag *
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              onBlur={() => {
                                if (!exp.company.trim()) {
                                  setErrors(prev => ({
                                    ...prev,
                                    [exp.id]: { ...prev[exp.id], company: 'Företagsnamn krävs' }
                                  }))
                                }
                              }}
                              placeholder="t.ex. ICA Maxi"
                              aria-required="true"
                              aria-invalid={!!errors[exp.id]?.company}
                              className={`
                                w-full pl-10 pr-4 py-2.5 border rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-purple-500
                                ${errors[exp.id]?.company ? 'border-red-300 bg-red-50' : 'border-slate-200'}
                              `}
                            />
                          </div>
                          {errors[exp.id]?.company && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                              <AlertCircle className="w-3 h-3" /> {errors[exp.id].company}
                            </p>
                          )}
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Plats
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                              placeholder="t.ex. Stockholm"
                              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Startdatum *
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                onBlur={() => {
                                  if (!exp.startDate) {
                                    setErrors(prev => ({
                                      ...prev,
                                      [exp.id]: { ...prev[exp.id], startDate: 'Startdatum krävs' }
                                    }))
                                  }
                                }}
                                max={new Date().toISOString().slice(0, 7)}
                                className={`
                                  w-full pl-10 pr-4 py-2.5 border rounded-lg
                                  focus:outline-none focus:ring-2 focus:ring-purple-500
                                  ${errors[exp.id]?.startDate ? 'border-red-300 bg-red-50' : 'border-slate-200'}
                                `}
                              />
                            </div>
                            {errors[exp.id]?.startDate && (
                              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors[exp.id].startDate}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Slutdatum
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                disabled={exp.current}
                                min={exp.startDate || undefined}
                                max={new Date().toISOString().slice(0, 7)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Current job checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-700">Jag jobbar här fortfarande</span>
                        </label>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Beskrivning
                          </label>
                          <RichTextEditor
                            value={exp.description || ''}
                            onChange={(value) => updateExperience(exp.id, 'description', value)}
                            placeholder="Beskriv dina arbetsuppgifter och prestationer..."
                            maxLength={1000}
                            minHeight="100px"
                            helpText="Tips: Använd aktiva verb som 'Ledde', 'Utvecklade', 'Förbättrade'. Kvantifiera resultat när det är möjligt."
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Ta bort
                          </button>
                          
                          <button
                            onClick={() => {
                              if (validateExperience(exp)) {
                                setExpandedId(null)
                              }
                            }}
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

          {/* Add button */}
          <button
            onClick={addExperience}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            + Lägg till ytterligare ett jobb
          </button>
        </>
      )}
    </div>
  )
}
