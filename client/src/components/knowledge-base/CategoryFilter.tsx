import { useState } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { articleCategories } from '../../services/articleData'

interface CategoryFilterProps {
  selectedCategory: string
  selectedSubcategory: string
  onCategoryChange: (category: string, subcategory: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  energyFilter: string
  onEnergyFilterChange: (energy: string) => void
}

export default function CategoryFilter({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  energyFilter,
  onEnergyFilterChange,
}: CategoryFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const clearFilters = () => {
    onCategoryChange('', '')
    onSearchChange('')
    onEnergyFilterChange('')
  }

  const hasActiveFilters = selectedCategory || searchQuery || energyFilter

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Sök artiklar..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Energy filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Energinivå
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: '', label: 'Alla' },
            { id: 'low', label: '🟢 Låg', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
            { id: 'medium', label: '🟡 Medel', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
            { id: 'high', label: '🟠 Hög', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onEnergyFilterChange(option.id)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${energyFilter === option.id 
                  ? 'bg-teal-600 text-white' 
                  : option.color || 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Kategorier
        </label>
        
        <button
          onClick={() => onCategoryChange('', '')}
          className={`
            w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
            ${!selectedCategory ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}
          `}
        >
          Alla kategorier
        </button>

        {articleCategories.map((category) => (
          <div key={category.id}>
            <button
              onClick={() => {
                onCategoryChange(category.id, '')
                toggleCategory(category.id)
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                ${selectedCategory === category.id 
                  ? 'bg-teal-50 text-teal-700 font-medium' 
                  : 'text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <span>{category.name}</span>
              {category.subcategories && category.subcategories.length > 0 && 
                (expandedCategories.has(category.id) || selectedCategory === category.id
                  ? <ChevronDown size={16} />
                  : <ChevronRight size={16} />
                )
              }
            </button>

            {/* Subcategories */}
            {(expandedCategories.has(category.id) || selectedCategory === category.id) && 
              category.subcategories && (
              <div className="ml-4 mt-1 space-y-1">
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onCategoryChange(category.id, sub.id)}
                    className={`
                      w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors
                      ${selectedSubcategory === sub.id 
                        ? 'bg-teal-100/50 text-teal-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
        >
          <X size={16} />
          Rensa filter
        </button>
      )}
    </div>
  )
}
