/**
 * Theme Context
 * Hanterar dark mode och temainställningar globalt
 * Spara preferenser i localStorage och respektera systeminställningar
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  toggleDarkMode: () => void
  systemPreference: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Hämta initialt tema från localStorage eller system
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved && ['light', 'dark', 'system'].includes(saved)) {
    return saved
  }
  return 'system'
}

// Kontrollera om systemet föredrar dark mode
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference)
  const [isDark, setIsDark] = useState(false)

  // Beräkna faktiskt dark mode baserat på tema och systempreferens
  useEffect(() => {
    const actualDark = theme === 'system' 
      ? systemPreference === 'dark'
      : theme === 'dark'
    setIsDark(actualDark)
  }, [theme, systemPreference])

  // Applicera dark mode class på html-elementet
  useEffect(() => {
    const root = window.document.documentElement
    
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  // Lyssna på systemförändringar
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }, [])

  const toggleDarkMode = useCallback(() => {
    if (theme === 'system') {
      // Om system, växla till motsatt av nuvarande
      setTheme(isDark ? 'light' : 'dark')
    } else {
      // Växla mellan light och dark
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }, [theme, isDark, setTheme])

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDark,
    toggleDarkMode,
    systemPreference,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook för att använda temat
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook för att bara få dark mode status (lättare att använda)
export function useDarkMode() {
  const { isDark } = useTheme()
  return { isDark }
}

export default ThemeContext
