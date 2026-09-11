import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/services/laslogg', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/laslogg')>('@/services/laslogg')
  return { ...faktisk, laslogg: { minAiPolicy: vi.fn() } }
})

import { useOrgAiSparr } from './useOrgAiSparr'
import { laslogg } from '@/services/laslogg'

describe('useOrgAiSparr', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ger organisationen som stängt av AI', async () => {
    vi.mocked(laslogg.minAiPolicy).mockResolvedValue([{ org_id: 'o1', org_name: 'Testkommun', ai_enabled: false }])
    const { result } = renderHook(() => useOrgAiSparr())
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current?.org_name).toBe('Testkommun'))
  })

  it('ger null när ingen spärr finns, och null (inte krasch) vid fel', async () => {
    vi.mocked(laslogg.minAiPolicy).mockResolvedValue([{ org_id: 'o1', org_name: 'Testkommun', ai_enabled: true }])
    const a = renderHook(() => useOrgAiSparr())
    await waitFor(() => expect(a.result.current).toBeNull())

    vi.mocked(laslogg.minAiPolicy).mockRejectedValue(new Error('nere'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const b = renderHook(() => useOrgAiSparr())
    await waitFor(() => expect(b.result.current).toBeNull())
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
