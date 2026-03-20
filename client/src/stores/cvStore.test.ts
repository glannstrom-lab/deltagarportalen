import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCVStore } from './cvStore'

describe('cvStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCVStore.getState()
    useCVStore.setState({
      currentStep: 1,
      isPreviewOpen: false,
      lastSavedAt: null,
      hasUnsavedChanges: false,
      saveStatus: 'idle',
      cvScore: 0,
      pendingCount: 0,
      hasDraft: false,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const store = useCVStore.getState()

      expect(store.currentStep).toBe(1)
      expect(store.isPreviewOpen).toBe(false)
      expect(store.lastSavedAt).toBeNull()
      expect(store.hasUnsavedChanges).toBe(false)
      expect(store.saveStatus).toBe('idle')
      expect(store.cvScore).toBe(0)
      expect(store.pendingCount).toBe(0)
      expect(store.hasDraft).toBe(false)
    })
  })

  describe('setCurrentStep', () => {
    it('should update current step', () => {
      const store = useCVStore.getState()

      store.setCurrentStep(3)

      expect(useCVStore.getState().currentStep).toBe(3)
    })

    it('should allow setting step to any number', () => {
      const store = useCVStore.getState()

      store.setCurrentStep(1)
      expect(useCVStore.getState().currentStep).toBe(1)

      store.setCurrentStep(5)
      expect(useCVStore.getState().currentStep).toBe(5)

      store.setCurrentStep(10)
      expect(useCVStore.getState().currentStep).toBe(10)
    })
  })

  describe('setPreviewOpen', () => {
    it('should open preview', () => {
      const store = useCVStore.getState()

      store.setPreviewOpen(true)

      expect(useCVStore.getState().isPreviewOpen).toBe(true)
    })

    it('should close preview', () => {
      useCVStore.setState({ isPreviewOpen: true })
      const store = useCVStore.getState()

      store.setPreviewOpen(false)

      expect(useCVStore.getState().isPreviewOpen).toBe(false)
    })

    it('should toggle preview state', () => {
      const store = useCVStore.getState()

      expect(useCVStore.getState().isPreviewOpen).toBe(false)

      store.setPreviewOpen(true)
      expect(useCVStore.getState().isPreviewOpen).toBe(true)

      store.setPreviewOpen(false)
      expect(useCVStore.getState().isPreviewOpen).toBe(false)
    })
  })

  describe('save status management', () => {
    describe('markSaving', () => {
      it('should set status to saving and mark as unsaved', () => {
        const store = useCVStore.getState()

        store.markSaving()

        const state = useCVStore.getState()
        expect(state.saveStatus).toBe('saving')
        expect(state.hasUnsavedChanges).toBe(true)
      })
    })

    describe('markSaved', () => {
      it('should set status to saved and clear unsaved flag', () => {
        useCVStore.setState({ hasUnsavedChanges: true, saveStatus: 'saving' })
        const store = useCVStore.getState()

        store.markSaved()

        const state = useCVStore.getState()
        expect(state.saveStatus).toBe('saved')
        expect(state.hasUnsavedChanges).toBe(false)
        expect(state.lastSavedAt).toBeInstanceOf(Date)
      })

      it('should update lastSavedAt timestamp', () => {
        const beforeSave = new Date()
        const store = useCVStore.getState()

        store.markSaved()

        const state = useCVStore.getState()
        expect(state.lastSavedAt).not.toBeNull()
        expect(state.lastSavedAt!.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime())
      })
    })

    describe('markError', () => {
      it('should set status to error and mark as unsaved', () => {
        const store = useCVStore.getState()

        store.markError()

        const state = useCVStore.getState()
        expect(state.saveStatus).toBe('error')
        expect(state.hasUnsavedChanges).toBe(true)
      })
    })

    describe('markUnsaved', () => {
      it('should mark as unsaved and reset status to idle', () => {
        useCVStore.setState({ saveStatus: 'saved', hasUnsavedChanges: false })
        const store = useCVStore.getState()

        store.markUnsaved()

        const state = useCVStore.getState()
        expect(state.saveStatus).toBe('idle')
        expect(state.hasUnsavedChanges).toBe(true)
      })
    })

    describe('save workflow', () => {
      it('should handle complete save workflow', () => {
        const store = useCVStore.getState()

        // Start: idle, no changes
        expect(useCVStore.getState().saveStatus).toBe('idle')
        expect(useCVStore.getState().hasUnsavedChanges).toBe(false)

        // User makes changes
        store.markUnsaved()
        expect(useCVStore.getState().saveStatus).toBe('idle')
        expect(useCVStore.getState().hasUnsavedChanges).toBe(true)

        // Auto-save starts
        store.markSaving()
        expect(useCVStore.getState().saveStatus).toBe('saving')

        // Save completes successfully
        store.markSaved()
        expect(useCVStore.getState().saveStatus).toBe('saved')
        expect(useCVStore.getState().hasUnsavedChanges).toBe(false)
      })

      it('should handle save error workflow', () => {
        const store = useCVStore.getState()

        store.markUnsaved()
        store.markSaving()
        store.markError()

        const state = useCVStore.getState()
        expect(state.saveStatus).toBe('error')
        expect(state.hasUnsavedChanges).toBe(true)
      })
    })
  })

  describe('setCVScore', () => {
    it('should update CV score', () => {
      const store = useCVStore.getState()

      store.setCVScore(85)

      expect(useCVStore.getState().cvScore).toBe(85)
    })

    it('should handle score of 0', () => {
      useCVStore.setState({ cvScore: 50 })
      const store = useCVStore.getState()

      store.setCVScore(0)

      expect(useCVStore.getState().cvScore).toBe(0)
    })

    it('should handle score of 100', () => {
      const store = useCVStore.getState()

      store.setCVScore(100)

      expect(useCVStore.getState().cvScore).toBe(100)
    })
  })

  describe('setPendingCount', () => {
    it('should update pending count', () => {
      const store = useCVStore.getState()

      store.setPendingCount(5)

      expect(useCVStore.getState().pendingCount).toBe(5)
    })

    it('should handle count of 0', () => {
      useCVStore.setState({ pendingCount: 3 })
      const store = useCVStore.getState()

      store.setPendingCount(0)

      expect(useCVStore.getState().pendingCount).toBe(0)
    })
  })

  describe('draft handling', () => {
    describe('setHasDraft', () => {
      it('should set hasDraft to true', () => {
        const store = useCVStore.getState()

        store.setHasDraft(true)

        expect(useCVStore.getState().hasDraft).toBe(true)
      })

      it('should set hasDraft to false', () => {
        useCVStore.setState({ hasDraft: true })
        const store = useCVStore.getState()

        store.setHasDraft(false)

        expect(useCVStore.getState().hasDraft).toBe(false)
      })
    })
  })

  describe('persistence', () => {
    it('should persist currentStep and hasDraft', () => {
      // The partialize function only keeps currentStep and hasDraft
      const store = useCVStore.getState()

      store.setCurrentStep(4)
      store.setHasDraft(true)
      store.setCVScore(90)

      // All values are set
      expect(useCVStore.getState().currentStep).toBe(4)
      expect(useCVStore.getState().hasDraft).toBe(true)
      expect(useCVStore.getState().cvScore).toBe(90)
    })
  })

  describe('multiple state updates', () => {
    it('should handle rapid state updates correctly', () => {
      const store = useCVStore.getState()

      // Simulate rapid user interactions
      store.setCurrentStep(1)
      store.markUnsaved()
      store.setCurrentStep(2)
      store.markSaving()
      store.setCVScore(50)
      store.markSaved()
      store.setCurrentStep(3)

      const state = useCVStore.getState()
      expect(state.currentStep).toBe(3)
      expect(state.saveStatus).toBe('saved')
      expect(state.cvScore).toBe(50)
      expect(state.hasUnsavedChanges).toBe(false)
    })
  })
})
