/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === SEMANTIC DOMAIN COLORS ===

        // ACTION domain - Turkos (CTA, brand, primära handlingar)
        teal: {
          50: '#E1F5EE',   // Background
          100: '#C3EBD9',
          200: '#A5E1C4',
          300: '#9FE1CB',  // Accent
          400: '#6DD4B4',
          500: '#3BC79D',
          600: '#1A9E76',
          700: '#148860',
          800: '#0F7249',
          900: '#0F6E56',  // Solid
        },

        // INFO domain - Blå (sparade jobb, information, referens)
        blue: {
          50: '#DCEBFB',   // Background
          100: '#C5DCF7',
          200: '#AECDF3',
          300: '#9EC5ED',  // Accent
          400: '#78B0E5',
          500: '#529BDD',
          600: '#3280C7',
          700: '#2769A8',
          800: '#1E5A9C',  // Solid (alt)
          900: '#1E5A9C',  // Solid
        },

        // ACTIVITY domain - Persika (utåtriktad aktivitet, ansökningar)
        peach: {
          50: '#FFE8D6',   // Background
          100: '#FFDCC0',
          200: '#FFD0AA',
          300: '#F4B988',  // Accent
          400: '#E9A060',
          500: '#DE8738',
          600: '#C46E20',
          700: '#B05A1A',  // Solid (alt)
          800: '#9C4A14',
          900: '#B05A1A',  // Solid
        },

        // WELLBEING domain - Rosa (mående, hälsa, personliga känslor)
        pink: {
          50: '#FBE2EC',   // Background
          100: '#F8D0DE',
          200: '#F5BED0',
          300: '#F0A8C0',  // Accent
          400: '#E88AA8',
          500: '#E06C90',
          600: '#C94A72',
          700: '#B23358',
          800: '#9F1F4D',  // Solid (alt)
          900: '#9F1F4D',  // Solid
        },

        // COACHING domain - Lila (självkännedom, reflektion, intresseguide)
        purple: {
          50: '#E8E1F4',   // Background
          100: '#DDD3EE',
          200: '#D2C5E8',
          300: '#BFA9E0',  // Accent
          400: '#A88AD4',
          500: '#916BC8',
          600: '#7A4FBA',
          700: '#6840A2',
          800: '#5B3F8F',  // Solid (alt)
          900: '#5B3F8F',  // Solid
        },

        // === NEUTRAL COLORS ===
        canvas: '#FAFAF8',  // Page background

        neutral: {
          50: '#F1F1EE',   // Card backgrounds
          100: '#E8E8E5',
          200: '#DDDDD9',  // Borders
          300: '#C8C8C4',
          400: '#A8A8A3',
          500: '#888780',  // Secondary text
          600: '#68675F',
          700: '#484740',
          800: '#38372F',
          900: '#2C2C2A',  // Primary text
        },

        // === BACKWARDS COMPATIBLE ===
        // Stone (mapped to neutral)
        stone: {
          50: '#F1F1EE',
          100: '#E8E8E5',
          200: '#DDDDD9',
          300: '#C8C8C4',
          400: '#A8A8A3',
          500: '#888780',
          600: '#68675F',
          700: '#484740',
          800: '#38372F',
          900: '#2C2C2A',
        },

        // Slate (legacy)
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

        // === STATUS COLORS ===
        success: {
          light: '#d1fae5',
          DEFAULT: '#059669',
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

        // === SEMANTIC TOKENS ===
        action: {
          DEFAULT: '#0F6E56',
          bg: '#E1F5EE',
          accent: '#9FE1CB',
        },
        info: {
          DEFAULT: '#1E5A9C',
          bg: '#DCEBFB',
          accent: '#9EC5ED',
          light: '#dbeafe',
          dark: '#1d4ed8',
        },
        activity: {
          DEFAULT: '#B05A1A',
          bg: '#FFE8D6',
          accent: '#F4B988',
        },
        wellbeing: {
          DEFAULT: '#9F1F4D',
          bg: '#FBE2EC',
          accent: '#F0A8C0',
        },
        coaching: {
          DEFAULT: '#5B3F8F',
          bg: '#E8E1F4',
          accent: '#BFA9E0',
        },

        // Page background
        page: {
          DEFAULT: '#FAFAF8',
          dark: '#F1F1EE',
        },
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3)',
        'glow-sky': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'bento': '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'bento-hover': '0 2px 8px rgba(0, 0, 0, 0.06), 0 16px 40px rgba(0, 0, 0, 0.1)',
      },

      backdropBlur: {
        'xs': '2px',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'count-up': 'countUp 0.6s ease-out',
        'confetti': 'confetti 0.6s ease-out forwards',
        'progress-fill': 'progressFill 1s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(20, 184, 166, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.4)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width, 100%)' },
        },
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
