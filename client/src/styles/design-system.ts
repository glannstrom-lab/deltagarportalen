/**
 * Central Design System för Deltagarportalen
 * Definierar standardiserade färger, shadows, spacing och animationer
 */

import { cn } from '@/lib/utils'

// ============================================
// FÄRGSYSTEM
// ============================================
export const colors = {
  // Primära färger
  primary: {
    50: 'bg-indigo-50',
    100: 'bg-indigo-100',
    200: 'bg-indigo-200',
    500: 'bg-indigo-500',
    600: 'bg-indigo-600',
    700: 'bg-indigo-700',
    text: 'text-indigo-600',
    textLight: 'text-indigo-700',
    border: 'border-indigo-200',
    ring: 'ring-indigo-500',
  },
  // Neutrala färger
  slate: {
    50: 'bg-slate-50',
    100: 'bg-slate-100',
    200: 'bg-slate-200',
    300: 'bg-slate-300',
    400: 'text-slate-400',
    500: 'text-slate-500',
    600: 'text-slate-600',
    700: 'text-slate-700',
    800: 'text-slate-800',
    900: 'text-slate-900',
    border: 'border-slate-200',
    borderLight: 'border-slate-100',
  },
  // Status-färger
  success: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    icon: 'text-green-600',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    icon: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
}

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: 'shadow-sm',
  DEFAULT: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  inner: 'shadow-inner',
  // Specifika användningsområden
  card: 'shadow-sm',
  cardHover: 'shadow-md',
  elevated: 'shadow-lg',
  modal: 'shadow-xl',
  button: 'shadow-sm',
  buttonHover: 'shadow',
}

// ============================================
// BORDER RADIUS
// ============================================
export const radius = {
  sm: 'rounded-md',      // 6px
  DEFAULT: 'rounded-lg', // 8px
  lg: 'rounded-xl',      // 12px
  xl: 'rounded-2xl',     // 16px
  '2xl': 'rounded-3xl',  // 24px
  full: 'rounded-full',
  // Specifika användningsområden
  button: 'rounded-lg',
  input: 'rounded-lg',
  card: 'rounded-xl',
  cardLarge: 'rounded-2xl',
  modal: 'rounded-2xl',
  badge: 'rounded-full',
  avatar: 'rounded-full',
}

// ============================================
// SPACING
// ============================================
export const spacing = {
  // Page sections
  section: 'space-y-6',
  sectionLarge: 'space-y-8',
  // Cards
  card: 'p-6',
  cardSmall: 'p-4',
  cardLarge: 'p-8',
  // Form elements
  input: 'px-4 py-3',
  inputTouch: 'px-4 py-3.5',
  // Buttons
  button: 'px-5 py-2.5',
  buttonSmall: 'px-3 py-1.5',
  buttonLarge: 'px-6 py-3',
  buttonTouch: 'px-4 py-3 min-h-[48px] min-w-[48px]',
  buttonTouchLarge: 'px-6 py-4 min-h-[56px] min-w-[56px]',
}

// ============================================
// ANIMATIONER
// ============================================
export const animations = {
  // Page transitions
  pageEnter: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideRight: 'animate-in slide-in-from-right-4 duration-300',
  // Micro-interactions
  press: 'active:scale-[0.98] transition-transform duration-150',
  lift: 'hover:-translate-y-0.5 transition-transform duration-200',
  liftLarge: 'hover:-translate-y-1 transition-transform duration-200',
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
  // Loading
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
}

// ============================================
// TYPOGRAFI
// ============================================
export const typography = {
  // Headers
  h1: 'text-2xl sm:text-3xl font-bold text-slate-800',
  h2: 'text-xl sm:text-2xl font-bold text-slate-800',
  h3: 'text-lg font-semibold text-slate-800',
  h4: 'text-base font-semibold text-slate-800',
  // Body
  body: 'text-base text-slate-600',
  bodySmall: 'text-sm text-slate-600',
  bodyLarge: 'text-lg text-slate-600',
  // Labels
  label: 'text-sm font-medium text-slate-700 mb-1.5',
  labelSmall: 'text-xs font-medium text-slate-600',
  // Special
  caption: 'text-xs text-slate-500',
  button: 'text-sm font-medium',
  overline: 'text-xs font-semibold uppercase tracking-wider text-slate-500',
}

// ============================================
// KOMPONENT-KLASSER (Helper functions)
// ============================================

// Button varianter
export const buttonVariants = {
  primary: cn(
    'bg-indigo-600 text-white hover:bg-indigo-700',
    shadows.button,
    'hover:shadow',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2'
  ),
  secondary: cn(
    'bg-white border border-slate-200 text-slate-700',
    'hover:bg-slate-50 hover:border-slate-300',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2'
  ),
  outline: cn(
    'bg-transparent border-2 border-indigo-600 text-indigo-600',
    'hover:bg-indigo-50',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2'
  ),
  ghost: cn(
    'bg-transparent text-slate-600',
    'hover:bg-slate-100 hover:text-slate-900',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2'
  ),
  danger: cn(
    'bg-red-50 text-red-600 border border-red-200',
    'hover:bg-red-100 hover:border-red-300',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2'
  ),
  icon: cn(
    'w-10 h-10 rounded-lg',
    'inline-flex items-center justify-center',
    'text-slate-600 hover:bg-slate-100',
    animations.press,
    'transition-colors duration-200'
  ),
}

// Card varianter
export const cardVariants = {
  default: cn(
    'bg-white',
    radius.card,
    shadows.card,
    colors.slate.border,
    'border',
    spacing.card
  ),
  hover: cn(
    'bg-white',
    radius.card,
    shadows.card,
    colors.slate.border,
    'border',
    spacing.card,
    'hover:shadow-md',
    animations.lift,
    'transition-all duration-200'
  ),
  elevated: cn(
    'bg-white',
    radius.cardLarge,
    shadows.elevated,
    colors.slate.border,
    'border',
    spacing.card
  ),
  flat: cn(
    'bg-white',
    radius.card,
    colors.slate.border,
    'border',
    spacing.card
  ),
}

// Input styling
export const inputBase = cn(
  'w-full',
  spacing.input,
  colors.slate.border,
  'border',
  radius.input,
  'text-slate-800 placeholder:text-slate-400',
  'transition-all duration-200',
  animations.focusRing,
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

// Label styling
export const labelBase = cn(
  'block',
  typography.label
)

// Badge styling
export const badgeVariants = {
  default: 'bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-medium rounded-full',
  primary: 'bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs font-medium rounded-full',
  success: 'bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium rounded-full',
  warning: 'bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium rounded-full',
  error: 'bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium rounded-full',
}

// ============================================
// TOUCH/MOBIL SPECIFIKT
// ============================================
export const touch = {
  // Minimum touch target size (44px WCAG)
  minTarget: 'min-h-[44px] min-w-[44px]',
  largeTarget: 'min-h-[56px] min-w-[56px]',
  // Touch padding
  button: 'px-4 py-3 min-h-[48px]',
  buttonLarge: 'px-6 py-4 min-h-[56px]',
  input: 'px-4 py-3.5 min-h-[48px]',
  listItem: 'py-3 px-4',
}

// ============================================
// UTILITIES
// ============================================
export const container = {
  maxWidth: 'max-w-7xl mx-auto',
  maxWidthNarrow: 'max-w-3xl mx-auto',
  padding: 'px-4 sm:px-6',
  paddingLarge: 'px-4 sm:px-6 lg:px-8',
}

export const flex = {
  center: 'flex items-center justify-center',
  between: 'flex items-center justify-between',
  start: 'flex items-start',
  col: 'flex flex-col',
  colCenter: 'flex flex-col items-center',
  wrap: 'flex flex-wrap',
  gap2: 'flex items-center gap-2',
  gap3: 'flex items-center gap-3',
  gap4: 'flex items-center gap-4',
}

// ============================================
// STATUS/STATES
// ============================================
export const states = {
  loading: 'opacity-70 pointer-events-none',
  disabled: 'opacity-50 cursor-not-allowed',
  hidden: 'hidden',
  visible: 'visible',
  invisible: 'invisible',
}

export default {
  colors,
  shadows,
  radius,
  spacing,
  animations,
  typography,
  buttonVariants,
  cardVariants,
  inputBase,
  labelBase,
  badgeVariants,
  touch,
  container,
  flex,
  states,
}
