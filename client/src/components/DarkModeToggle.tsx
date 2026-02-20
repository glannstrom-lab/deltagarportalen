import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [isSystemPreference, setIsSystemPreference] = useState(true)

  useEffect(() => {
    // Kolla om användaren har en sparad preferens
    const savedMode = localStorage.getItem('darkMode')
    
    if (savedMode !== null) {
      setIsSystemPreference(false)
      setIsDark(savedMode === 'true')
    } else {
      // Använd systempreferens
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      setIsSystemPreference(true)
    }
  }, [])

  useEffect(() => {
    // Applicera dark mode class på html-elementet
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleDarkMode = () => {
    const newValue = !isDark
    setIsDark(newValue)
    setIsSystemPreference(false)
    localStorage.setItem('darkMode', newValue.toString())
  }

  const resetToSystem = () => {
    localStorage.removeItem('darkMode')
    setIsSystemPreference(true)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleDarkMode}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isDark 
            ? 'bg-slate-700 text-slate-200' 
            : 'bg-slate-100 text-slate-700'
        } hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500`}
        aria-label={isDark ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
        aria-pressed={isDark}
      >
        {isDark ? (
          <>
            <Moon className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">Mörkt</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">Ljust</span>
          </>
        )}
      </button>
      
      {!isSystemPreference && (
        <button
          onClick={resetToSystem}
          className="text-xs text-slate-400 hover:text-slate-600 underline"
          aria-label="Återställ till systeminställning"
        >
          System
        </button>
      )}
    </div>
  )
}

// Hook för att hantera dark mode
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const savedMode = localStorage.getItem('darkMode')
      if (savedMode !== null) {
        setIsDark(savedMode === 'true')
      } else {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }

    checkDarkMode()

    // Lyssna på förändringar i systempreferens
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('darkMode') === null) {
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return { isDark }
}
