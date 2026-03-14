/**
 * Design System Tokens
 * Enhetlig design över hela applikationen
 */

// Färger
export const colors = {
  // Primärfärg - Indigo
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',  // Primary
    600: '#4f46e5',  // Primary Dark
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Sekundärfärg - Teal (endast för hälsa/välmående)
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // Secondary
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  
  // Neutrala färger
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
  
  // Semantiska färger
  success: {
    light: '#d1fae5',
    DEFAULT: '#10b981',
    dark: '#047857',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    dark: '#1d4ed8',
  },
}

// Avstånd (spacing)
export const spacing = {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '16px',   // 1rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
}

// Border radius
export const borderRadius = {
  none: '0',
  sm: '4px',     // rounded-sm
  md: '8px',     // rounded-md
  lg: '12px',    // rounded-lg
  xl: '16px',    // rounded-xl (default för kort)
  '2xl': '20px', // rounded-2xl
  '3xl': '24px', // rounded-3xl
  full: '9999px',
}

// Typografi
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
}

// Skuggor
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}

// Animationer
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
}

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Z-index skala
export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
}

// Widget-specifika tokens
export const widgetTokens = {
  // Standard padding för alla widgets
  padding: '24px', // p-6
  
  // Border radius för widgets
  borderRadius: '16px', // rounded-2xl
  
  // Skugga för widgets
  shadow: shadows.md,
  
  // Hover skugga
  hoverShadow: shadows.lg,
  
  // Färger per widget-typ
  variants: {
    cv: {
      bg: colors.primary[50],
      border: colors.primary[200],
      text: colors.primary[700],
      icon: colors.primary[500],
      gradient: 'from-violet-500 to-purple-600',
    },
    jobSearch: {
      bg: colors.info.light,
      border: '#bfdbfe',
      text: colors.info.dark,
      icon: colors.info.DEFAULT,
      gradient: 'from-blue-500 to-indigo-600',
    },
    wellness: {
      bg: colors.secondary[50],
      border: colors.secondary[200],
      text: colors.secondary[800],
      icon: colors.secondary[500],
      gradient: 'from-teal-500 to-emerald-600',
    },
    success: {
      bg: colors.success.light,
      border: '#a7f3d0',
      text: colors.success.dark,
      icon: colors.success.DEFAULT,
      gradient: 'from-emerald-500 to-teal-600',
    },
    warning: {
      bg: colors.warning.light,
      border: '#fde68a',
      text: colors.warning.dark,
      icon: colors.warning.DEFAULT,
      gradient: 'from-amber-500 to-orange-600',
    },
  }
}

// Hjälpfunktion för att få Tailwind-klasser
export const getWidgetClasses = (variant: keyof typeof widgetTokens.variants) => {
  const tokens = widgetTokens.variants[variant]
  return {
    bg: tokens.bg,
    border: tokens.border,
    text: tokens.text,
    icon: tokens.icon,
    gradient: tokens.gradient,
  }
}

// Export allt som ett design system-objekt
export const designSystem = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
  breakpoints,
  zIndex,
  widgetTokens,
}

export default designSystem
