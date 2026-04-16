/**
 * AI Team Types
 * TypeScript definitions for the AI Team feature
 */

import type { LucideIcon } from '@/components/ui/icons'

// Agent types
export type AgentId =
  | 'arbetskonsulent'
  | 'arbetsterapeut'
  | 'studievagledare'
  | 'motivationscoach'
  | 'digitalcoach'

export interface Agent {
  id: AgentId
  nameKey: string
  descriptionKey: string
  icon: LucideIcon
  color: AgentColor
  quickActions: QuickAction[]
}

export type AgentColor = 'teal' | 'rose' | 'violet' | 'amber' | 'sky'

// Personality types
export type PersonalityId =
  | 'professional'
  | 'empathetic'
  | 'direct'
  | 'arnold'
  | 'mormor'
  | 'pirate'
  | 'sportscaster'

export type PersonalityCategory = 'serious' | 'fun'

export interface Personality {
  id: PersonalityId
  nameKey: string
  descriptionKey: string
  category: PersonalityCategory
  systemPrompt: string
}

// Quick actions
export interface QuickAction {
  id: string
  labelKey: string
  prompt: string
}

// Chat messages
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentId: AgentId
  personalityId: PersonalityId
}

// Store state
export interface AITeamState {
  selectedAgent: AgentId
  selectedPersonality: PersonalityId
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null

  // Actions
  setAgent: (agentId: AgentId) => void
  setPersonality: (personalityId: PersonalityId) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetChat: () => void
}

// Color utilities
export const agentColorClasses: Record<AgentColor, {
  bg: string
  bgLight: string
  text: string
  border: string
  ring: string
}> = {
  teal: {
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    ring: 'ring-teal-500',
  },
  rose: {
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    ring: 'ring-rose-500',
  },
  violet: {
    bg: 'bg-violet-500',
    bgLight: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    ring: 'ring-violet-500',
  },
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    ring: 'ring-amber-500',
  },
  sky: {
    bg: 'bg-sky-500',
    bgLight: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    ring: 'ring-sky-500',
  },
}
