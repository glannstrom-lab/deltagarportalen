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

// Response mode types
export type ResponseMode = 'short' | 'medium' | 'detailed'

/**
 * Fråga som väntar på att skickas.
 *
 * Fokuslägets guide samlade in en fråga och kastade den — den skickades
 * aldrig någonstans, och sista steget sa ändå "Bra! Öppna AI-team i
 * normalläge för att fortsätta samtalet", som om den gått iväg. Guiden lämnar
 * den här i stället, och `AgentChat` plockar upp den.
 */
export type PendingQuestion = string | null

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
  /**
   * OBS: det HÄR fältet finns inte längre på personligheterna.
   *
   * Klienten hade sju `systemPrompt`-strängar som aldrig skickades någonstans
   * — `grep` för `.systemPrompt` gav noll träffar utanför definitionen. Den
   * faktiska tonen styrs av `PERSONALITY_MODIFIERS` i `client/api/ai.js`.
   * Det var värre än vanlig dödkod: klientversionen var mer riskabel än
   * serverns (Arnold-texten där instruerade filmcitat utan faktabroms), så
   * den som ville härda tonlägena hade härdat fel fil och trott sig klar.
   */
}

// Quick actions
export interface QuickAction {
  id: string
  labelKey: string
  prompt: string
  linkTo?: string // Optional link to another page for the feature
  linkLabelKey?: string // Label for the link button
}

// Chat messages
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentId: AgentId
  personalityId: PersonalityId
  suggestions?: string[] // Follow-up question suggestions
}

// Store state
export interface AITeamState {
  pendingQuestion: PendingQuestion
  setPendingQuestion: (question: PendingQuestion) => void
  selectedAgent: AgentId
  selectedPersonality: PersonalityId
  responseMode: ResponseMode
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null

  // Actions
  setAgent: (agentId: AgentId) => void
  setPersonality: (personalityId: PersonalityId) => void
  setResponseMode: (mode: ResponseMode) => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setMessages: (messages: ChatMessage[]) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetChat: () => void
}

// Color utilities
/**
 * Agentens färger — samtliga fem pekar på hubbens tokens.
 *
 * Fram till 2026-08-23 hade varje agent sin egen pastell (teal/rose/violet/
 * amber/sky). Följden: fem olika pasteller bredvid varandra i agentväljaren,
 * och när man valt en färgades tipsrutan, snabbfunktionernas ikon och varje
 * AI-avatar om efter den — mitt på en sida som hör till hubben Resurser
 * (sky). DESIGN.md §4 säger uttryckligen att variationen ska komma från ikon
 * och text, inte från olika pasteller på samma sida, och §14 att komponenter
 * alltid konsumerar `--c-*` — aldrig en specifik hubbs token.
 *
 * Nycklarna är kvar med flit: agenterna behåller sin identitet via ikon och
 * namn, och skulle en framtida design vilja återinföra färgvariation är det
 * ett eget beslut — inte något som smyger tillbaka via en datafil.
 */
const HUBBFARGER = {
  bg: 'bg-[var(--c-solid)]',
  bgLight: 'bg-[var(--c-bg)]',
  text: 'text-[var(--c-text)]',
  border: 'border-[var(--c-accent)]',
  ring: 'ring-[var(--c-solid)]',
} as const

export const agentColorClasses: Record<AgentColor, {
  bg: string
  bgLight: string
  text: string
  border: string
  ring: string
}> = {
  teal: HUBBFARGER,
  rose: HUBBFARGER,
  violet: HUBBFARGER,
  amber: HUBBFARGER,
  sky: HUBBFARGER,
}
