import { describe, it, expect } from 'vitest'
import { useWidgetSize } from './useWidgetSize'

// Hook is pure — no React renderer needed
describe('useWidgetSize', () => {
  it('S returns compact + minimal true, isS true, others false', () => {
    const r = useWidgetSize('S')
    expect(r).toEqual({ isS: true, isM: false, isL: false, isXL: false, compact: true, minimal: true })
  })
  it('M returns minimal true, compact false', () => {
    const r = useWidgetSize('M')
    expect(r).toEqual({ isS: false, isM: true, isL: false, isXL: false, compact: false, minimal: true })
  })
  it('L returns compact false, minimal false', () => {
    const r = useWidgetSize('L')
    expect(r).toEqual({ isS: false, isM: false, isL: true, isXL: false, compact: false, minimal: false })
  })
  it('XL returns isXL true, others false', () => {
    const r = useWidgetSize('XL')
    expect(r).toEqual({ isS: false, isM: false, isL: false, isXL: true, compact: false, minimal: false })
  })
})
