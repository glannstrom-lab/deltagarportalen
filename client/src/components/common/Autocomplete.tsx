import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface AutocompleteOption {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string, option?: AutocompleteOption) => void;
  onSelect?: (option: AutocompleteOption) => void;
  placeholder?: string;
  label?: string;
  fetchSuggestions: (query: string) => Promise<AutocompleteOption[]>;
  minLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  showCategories?: boolean;
}

export function Autocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Börja skriva...',
  label,
  fetchSuggestions,
  minLength = 2,
  debounceMs = 300,
  disabled = false,
  className = '',
  showCategories = true,
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestionsDebounced = useCallback(
    async (query: string) => {
      if (query.length < minLength) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('Fel vid hämtning av förslag:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSuggestions, minLength]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setHighlightedIndex(-1);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestionsDebounced(newValue);
    }, debounceMs);
  };

  const handleSelect = (option: AutocompleteOption) => {
    setInputValue(option.label);
    onChange(option.label, option);
    onSelect?.(option);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const groupedSuggestions = showCategories
    ? suggestions.reduce((acc, suggestion) => {
        const category = suggestion.category || 'Övrigt';
        if (!acc[category]) acc[category] = [];
        acc[category].push(suggestion);
        return acc;
      }, {} as Record<string, AutocompleteOption[]>)
    : { '': suggestions };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search size={18} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent
                     disabled:bg-slate-100 disabled:text-slate-500
                     transition-all"
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        )}
        
        {!isLoading && inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 
                       hover:text-slate-600 transition-colors"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg 
                     border border-slate-200 max-h-80 overflow-auto"
        >
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category}>
              {showCategories && category !== '' && (
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 uppercase tracking-wider">
                  {category}
                </div>
              )}
              
              {items.map((suggestion, index) => {
                const globalIndex = suggestions.findIndex(s => s.id === suggestion.id);
                const isHighlighted = globalIndex === highlightedIndex;
                
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors
                      ${isHighlighted 
                        ? 'bg-[#4f46e5] text-white' 
                        : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="font-medium">{suggestion.label}</div>
                    {suggestion.description && (
                      <div className={`text-xs mt-0.5 truncate
                        ${isHighlighted ? 'text-white/80' : 'text-slate-500'}`}>
                        {suggestion.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {suggestions.length === 0 && inputValue.length >= minLength && !isLoading && (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">
              Inga resultat hittades
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Autocomplete;
