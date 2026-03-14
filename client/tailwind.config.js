/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NYTT: Primärfärg - Violet (mer mänsklig och inspirerande)
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',  // Huvudprimärfärg
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        
        // NYTT: Neutrala färger - Warm Stone (istället för kall Slate)
        neutral: {
          50: '#fafaf9',   // Huvudbakgrund
          100: '#f5f5f4',
          200: '#e7e5e4',  // Kanter
          300: '#d6d3d1',
          400: '#a8a29e',  // Sekundär text
          500: '#78716c',
          600: '#57534e',  // Brödtext
          700: '#44403c',  // Rubriker
          800: '#292524',
          900: '#1c1917',
        },
        
        // BAKÅTKOMPATIBEL: Slate behålls för nuvarande kod
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        
        // Sekundärfärg - Teal (för hälsa/välmående)
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        
        // Semantiska färger - justerade för bättre kontrast
        success: {
          light: '#d1fae5',
          DEFAULT: '#059669',  // Mörkare för WCAG AA
          dark: '#047857',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#d97706',
          dark: '#b45309',
        },
        error: {
          light: '#fee2e2',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        },
        info: {
          light: '#dbeafe',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        
        // Bakgrundsfärger
        page: {
          DEFAULT: '#fafaf9',  // Neutral-50
          dark: '#f5f5f4',     // Neutral-100
        },
        
        // Accentfärger (behålls för kompatibilitet)
        accent: {
          orange: '#f97316',
          blue: '#3b82f6',
          green: '#10b981',
          pink: '#ec4899',
        },
      },
      
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
