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

        // Actions
        setAgent: (agentId: AgentId) => {
          set({
            selectedAgent: agentId,
            messages: [], // Clear messages when switching agents
            isLoading: false, // Reset loading state
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
