/**
 * CV Store - Zustand store for CV UI state
 * Handles non-persisted UI state only
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

interface CVUIState {
  // UI State
  currentStep: number
  isPreviewOpen: boolean
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  cvScore: number
  pendingCount: number
  
  // Actions
  setCurrentStep: (step: number) => void
  setPreviewOpen: (open: boolean) => void
  markSaving: () => void
  markSaved: () => void
  markError: () => void
  markUnsaved: () => void
  setCVScore: (score: number) => void
  setPendingCount: (count: number) => void
  
  // Draft handling
  hasDraft: boolean
  setHasDraft: (hasDraft: boolean) => void
}

export const useCVStore = create<CVUIState>()(
  devtools(
    persist(
      (set) => ({
      // Initial state
      currentStep: 1,
      isPreviewOpen: false,
      lastSavedAt: null,
      hasUnsavedChanges: false,
      saveStatus: 'idle',
      cvScore: 0,
      pendingCount: 0,
      hasDraft: false,
      
      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      setPreviewOpen: (open) => set({ isPreviewOpen: open }),
      
      markSaving: () => set({ 
        saveStatus: 'saving',
        hasUnsavedChanges: true 
      }),
      
      markSaved: () => set({ 
        saveStatus: 'saved',
        lastSavedAt: new Date(),
        hasUnsavedChanges: false 
      }),
      
      markError: () => set({ 
        saveStatus: 'error',
        hasUnsavedChanges: true 
      }),
      
      markUnsaved: () => set({ 
        hasUnsavedChanges: true,
        saveStatus: 'idle' 
      }),
      
      setCVScore: (score) => set({ cvScore: score }),
      setPendingCount: (count) => set({ pendingCount: count }),
      setHasDraft: (hasDraft) => set({ hasDraft }),
      }),
      {
        name: 'cv-ui-storage',
        partialize: (state) => ({
          currentStep: state.currentStep,
          hasDraft: state.hasDraft
        }),
      }
    ),
    { name: 'CVStore', enabled: process.env.NODE_ENV === 'development' }
  )
)
