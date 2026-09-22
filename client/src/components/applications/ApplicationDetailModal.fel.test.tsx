/**
 * ApplicationDetailModal — ett misslyckat anrop får inte vara tyst.
 *
 * `useApplications` har ingen `onError` på sina mutationer, så felet landar i
 * modalens catch. Före 2026-09-22 loggades det bara till konsolen: statusbyte,
 * arkivering, radering, dokumentkoppling och avbockad påminnelse misslyckades
 * utan att personen fick veta det — klicket såg bara ut att inte göra något.
 *
 * Mutation: ta bort `showToast.error(...)` ur respektive catch → RÖD.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ConfirmDialogProvider } from '@/components/ui'
import type { Application } from '@/types/application.types'

const toastError = vi.hoisted(() => vi.fn())
vi.mock('@/components/Toast', () => ({
  showToast: { success: vi.fn(), error: toastError, info: vi.fn() },
}))

const hook = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  updateApplication: vi.fn(),
  archiveApplication: vi.fn(),
  deleteApplication: vi.fn(),
  completeReminder: vi.fn(),
}))

vi.mock('@/hooks/useApplications', () => ({
  useApplications: () => ({
    updateStatus: hook.updateStatus,
    updateApplication: hook.updateApplication,
    archiveApplication: hook.archiveApplication,
    deleteApplication: hook.deleteApplication,
  }),
  useApplication: () => ({
    contacts: [],
    reminders: [{ id: 'r1', title: 'Ring Ica', reminderDate: '2026-09-23', isCompleted: false }],
    history: [],
    isLoading: false,
    addContact: vi.fn(),
    addReminder: vi.fn(),
    completeReminder: hook.completeReminder,
    isAddingContact: false,
    isAddingReminder: false,
  }),
}))

vi.mock('./DocumentSelector', () => ({ DocumentSelector: () => null }))

import { ApplicationDetailModal } from './ApplicationDetailModal'

const ansokan = {
  id: 'a1', userId: 'u1', jobId: 'j1', jobData: {}, status: 'applied', source: 'manual',
  priority: 'medium', jobTitle: 'Butikssäljare', companyName: 'Ica Maxi',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
} as unknown as Application

const onClose = vi.fn()
const rita = () =>
  render(
    <MemoryRouter>
      <ConfirmDialogProvider>
        <ApplicationDetailModal application={ansokan} isOpen onClose={onClose} onEdit={vi.fn()} />
      </ConfirmDialogProvider>
    </MemoryRouter>
  )

beforeEach(() => {
  vi.clearAllMocks()
  for (const f of Object.values(hook)) f.mockRejectedValue(new Error('nätet borta'))
})

describe('ApplicationDetailModal — fel syns', () => {
  it('misslyckad arkivering säger till och stänger inte modalen', async () => {
    rita()
    fireEvent.click(screen.getByRole('button', { name: 'Arkivera' }))
    await waitFor(() => expect(toastError).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('misslyckat statusbyte säger till', async () => {
    rita()
    fireEvent.click(screen.getByRole('button', { expanded: false, name: /Ansökt|Skickad|applied/i }))
    const val = await screen.findAllByRole('button')
    const nasta = val.find((b) => b.closest('.absolute'))
    expect(nasta).toBeTruthy()
    fireEvent.click(nasta!)
    await waitFor(() => expect(toastError).toHaveBeenCalled())
  })

  it('misslyckad avbockning av påminnelse säger till', async () => {
    rita()
    fireEvent.click(screen.getByRole('tab', { name: /Påminnelser/ }))
    fireEvent.click(screen.getByRole('button', { name: /Ring Ica/ }))
    await waitFor(() => expect(toastError).toHaveBeenCalled())
  })
})
