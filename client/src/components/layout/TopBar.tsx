import { Link } from 'react-router-dom'
import { Search, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export function TopBar() {
  const [isDark, setIsDark] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Formatera datum på svenska
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    setCurrentDate(date.toLocaleDateString('sv-SE', options))
    
    // Kolla om dark mode är sparat
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode === 'true') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    localStorage.setItem('darkMode', String(newMode))
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigera till jobbsökning med sökterm
      window.location.href = `/job-search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Datum */}
        <div className="hidden sm:block text-slate-600 text-sm font-medium capitalize">
          {currentDate}
        </div>
        
        {/* Sök */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Sök jobb..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent
                         text-sm transition-all"
            />
          </div>
        </form>

        {/* Höger sida - Dark mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title={isDark ? 'Ljust läge' : 'Mörkt läge'}
          >
            {isDark ? (
              <Sun size={20} className="text-amber-500" />
            ) : (
              <Moon size={20} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
