/**
 * Central Design System för Deltagarportalen
 * "Calm & Capable" Palett - UPPDATERAD
 * 
 * Ändringar:
 * - Indigo → Violet (mer mänsklig & inspirerande)
 * - Slate → Warm Stone (mer inbjudande)
 * - Justerade semantiska färger för bättre kontrast
 */

import { cn } from '@/lib/utils'

// ============================================
// FÄRGSYSTEM - NYA "Calm & Capable" Färger
// ============================================
export const colors = {
  // NY: Primärfärg - Violet
  primary: {
    50: 'bg-violet-50',
    100: 'bg-violet-100',
    200: 'bg-violet-200',
    300: 'bg-violet-300',
    500: 'bg-violet-500',
    600: 'bg-violet-600',   // Huvudfärg
    700: 'bg-violet-700',   // Hover
    text: 'text-violet-600',
    textLight: 'text-violet-700',
    border: 'border-violet-200',
    ring: 'ring-violet-500',
  },
  
  // NY: Neutrala färger - Warm Stone (istället för Slate)
  neutral: {
    50: 'bg-stone-50',      // Huvudbakgrund
    100: 'bg-stone-100',    // Sekundär bakgrund
    200: 'bg-stone-200',    // Kanter
    300: 'bg-stone-300',
    400: 'text-stone-400',  // Platshållare
    500: 'text-stone-500',  // Sekundär text
    600: 'text-stone-600',  // Brödtext
    700: 'text-stone-700',  // Rubriker
    800: 'text-stone-800',  // Stark text
    900: 'text-stone-900',
    border: 'border-stone-200',
    borderLight: 'border-stone-100',
  },
  
  // BAKÅTKOMPATIBEL: Slate (mappad till stone)
  slate: {
    50: 'bg-stone-50',
    100: 'bg-stone-100',
    200: 'bg-stone-200',
    300: 'bg-stone-300',
    400: 'text-stone-400',
    500: 'text-stone-500',
    600: 'text-stone-600',
    700: 'text-stone-700',
    800: 'text-stone-800',
    900: 'text-stone-900',
    border: 'border-stone-200',
    borderLight: 'border-stone-100',
  },
  
  // UPPDATERAD: Status-färger med bättre kontrast
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',    // Mörkare för WCAG AA
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
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
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    icon: 'text-blue-600',
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
  // Focus states - UPPDATERAD med violet
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
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
  h1: 'text-2xl sm:text-3xl font-bold text-stone-800',
  h2: 'text-xl sm:text-2xl font-bold text-stone-800',
  h3: 'text-lg font-semibold text-stone-800',
  h4: 'text-base font-semibold text-stone-800',
  // Body - UPPDATERAD med stone
  body: 'text-base text-stone-600',
  bodySmall: 'text-sm text-stone-600',
  bodyLarge: 'text-lg text-stone-600',
  // Labels
  label: 'text-sm font-medium text-stone-700 mb-1.5',
  labelSmall: 'text-xs font-medium text-stone-600',
  // Special
  caption: 'text-xs text-stone-500',
  button: 'text-sm font-medium',
  overline: 'text-xs font-semibold uppercase tracking-wider text-stone-500',
}

// ============================================
// KOMPONENT-KLASSER (Helper functions)
// ============================================

// Button varianter - UPPDATERADE med nya färger och förbättrad tillgänglighet
export const buttonVariants = {
  primary: cn(
    'bg-violet-600 text-white hover:bg-violet-700',
    shadows.button,
    'hover:shadow',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
  ),
  secondary: cn(
    'bg-white border border-stone-200 text-stone-700',
    'hover:bg-stone-50 hover:border-stone-300',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
  ),
  outline: cn(
    'bg-transparent border-2 border-violet-600 text-violet-600',
    'hover:bg-violet-50',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
  ),
  ghost: cn(
    'bg-transparent text-stone-600',
    'hover:bg-stone-100 hover:text-stone-900',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
  ),
  danger: cn(
    'bg-red-50 text-red-600 border border-red-200',
    'hover:bg-red-100 hover:border-red-300',
    animations.press,
    radius.button,
    'font-medium transition-all duration-200',
    'inline-flex items-center justify-center gap-2',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
  ),
  icon: cn(
    'w-10 h-10 rounded-lg',
    'inline-flex items-center justify-center',
    'text-stone-600 hover:bg-stone-100',
    animations.press,
    'transition-colors duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
  ),
}

// Card varianter - UPPDATERADE med stone
export const cardVariants = {
  default: cn(
    'bg-white',
    radius.card,
    shadows.card,
    colors.neutral.border,
    'border',
    spacing.card
  ),
  hover: cn(
    'bg-white',
    radius.card,
    shadows.card,
    colors.neutral.border,
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
    colors.neutral.border,
    'border',
    spacing.card
  ),
  flat: cn(
    'bg-white',
    radius.card,
    colors.neutral.border,
    'border',
    spacing.card
  ),
}

// Input styling - UPPDATERAD med stone och violet
export const inputBase = cn(
  'w-full',
  spacing.input,
  colors.neutral.border,
  'border',
  radius.input,
  'text-stone-800 placeholder:text-stone-400',
  'transition-all duration-200',
  animations.focusRing,
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

// Label styling
export const labelBase = cn(
  'block',
  typography.label
)

// Badge styling - UPPDATERAD
export const badgeVariants = {
  default: 'bg-stone-100 text-stone-700 px-2 py-0.5 text-xs font-medium rounded-full',
  primary: 'bg-violet-100 text-violet-700 px-2 py-0.5 text-xs font-medium rounded-full',
  success: 'bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium rounded-full',
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

// ============================================
// NY: Gradients för "Calm & Capable"
// ============================================
export const gradients = {
  primary: 'bg-gradient-to-r from-violet-600 to-violet-700',
  hero: 'bg-gradient-to-br from-violet-50 to-stone-50',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-600',
  card: 'bg-gradient-to-b from-white to-stone-50',
}

// ============================================
// NY: Focus states specifika
// ============================================
export const focusStates = {
  primary: 'focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500',
  neutral: 'focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400',
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
  gradients,
  focusStates,
}
