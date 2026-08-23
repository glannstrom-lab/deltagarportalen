/**
 * AI Team Store - Zustand store for AI Team feature
 * Manages agent selection, personality, chat history, and loading states
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { AITeamState, AgentId, PersonalityId, ResponseMode, ChatMessage } from '@/components/ai-team/types'

export const useAITeamStore = create<AITeamState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedAgent: 'arbetskonsulent',
        selectedPersonality: 'professional',
        responseMode: 'medium',
        messages: [],
        isLoading: false,
        error: null,
        pendingQuestion: null,

        // Actions
        /**
         * Byt agent.
         *
         * Nollställde fram till 2026-08-23 `messages` synkront. Två problem:
         *
         * 1. Det raderade den synliga konversationen utan varning — och i
         *    `AgentSelector` är korten en `radiogroup`, så en piltangent
         *    räckte. En tangentbordsanvändare kunde tappa hela samtalet på
         *    ett felklick.
         * 2. Sparningen till `ai_team_sessions` är debouncead 1000 ms. Bytte
         *    man agent inom den sekunden avbröt effektens cleanup timern
         *    SAMTIDIGT som `messages` nollställdes — meddelandet fanns då
         *    varken i minnet eller i databasen.
         *
         * `AgentChat` laddar redan historiken per agent vid byte, så det
         * finns ingen anledning att tömma här. Den som byter tillbaka får
         * sitt samtal tillbaka i stället för en tom ruta.
         */
        setAgent: (agentId: AgentId) => {
          if (get().selectedAgent === agentId) return
          set({
            selectedAgent: agentId,
            isLoading: false,
            error: null,
          })
        },

        setPersonality: (personalityId: PersonalityId) => {
          set({ selectedPersonality: personalityId })
        },

        setResponseMode: (mode: ResponseMode) => {
          set({ responseMode: mode })
        },

        addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
          const newMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          }
          set((state) => ({
            // Keep last 50 messages for performance
            messages: [...state.messages, newMessage].slice(-50),
            error: null,
          }))
        },

        clearMessages: () => {
          set({ messages: [], error: null })
        },

        setMessages: (messages: ChatMessage[]) => {
          set({ messages, error: null })
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading })
        },

        /** Se `PendingQuestion` i types.ts. Persisteras INTE. */
        setPendingQuestion: (question: string | null) => {
          set({ pendingQuestion: question })
        },

        setError: (error: string | null) => {
          set({ error, isLoading: false })
        },

        resetChat: () => {
          set({
            messages: [],
            isLoading: false,
            error: null,
          })
        },
      }),
      {
        name: 'ai-team-storage',
        partialize: (state) => ({
          selectedAgent: state.selectedAgent,
          selectedPersonality: state.selectedPersonality,
          responseMode: state.responseMode,
          // Don't persist messages - start fresh each session
        }),
      }
    ),
    { name: 'AITeamStore', enabled: process.env.NODE_ENV === 'development' }
  )
)
