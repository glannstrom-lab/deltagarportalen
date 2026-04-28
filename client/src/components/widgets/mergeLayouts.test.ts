import { describe, it, expect } from 'vitest'
import { mergeLayouts } from './mergeLayouts'
import type { WidgetLayoutItem } from './types'

describe('mergeLayouts', () => {
  it('appends missing widgets from default to end of persisted', () => {
    const persisted: WidgetLayoutItem[] = [
      { id: 'cv', size: 'L', order: 0, visible: true },
    ]
    const defaultLayout: WidgetLayoutItem[] = [
      { id: 'cv', size: 'L', order: 0, visible: true },
      { id: 'cover-letter', size: 'M', order: 1, visible: true },
    ]
    const result = mergeLayouts(persisted, defaultLayout)
    expect(result.map(w => w.id)).toContain('cv')
    expect(result.map(w => w.id)).toContain('cover-letter')
    // cover-letter appended at end
    expect(result[result.length - 1].id).toBe('cover-letter')
  })

  it('removes widgets not in WIDGET_REGISTRY', () => {
    const persisted: WidgetLayoutItem[] = [
      { id: 'cv', size: 'L', order: 0, visible: true },
      { id: 'unknown-widget', size: 'M', order: 1, visible: true },
    ]
    const defaultLayout: WidgetLayoutItem[] = [
      { id: 'cv', size: 'L', order: 0, visible: true },
    ]
    const result = mergeLayouts(persisted, defaultLayout)
    expect(result.map(w => w.id)).not.toContain('unknown-widget')
    expect(result.map(w => w.id)).toContain('cv')
    expect(result).toHaveLength(1)
  })

  it('preserves user-set size and visibility for persisted widgets', () => {
    const persisted: WidgetLayoutItem[] = [
      { id: 'cv', size: 'S', order: 0, visible: false },
    ]
    const defaultLayout: WidgetLayoutItem[] = [
      { id: 'cv', size: 'L', order: 0, visible: true },
    ]
    const result = mergeLayouts(persisted, defaultLayout)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('cv')
    expect(result[0].size).toBe('S')
    expect(result[0].visible).toBe(false)
  })

  it('returns empty array when both inputs empty', () => {
    const result = mergeLayouts([], [])
    expect(result).toEqual([])
  })

  it('appended default widgets get visible: true even if default item omits visible', () => {
    const persisted: WidgetLayoutItem[] = []
    const defaultLayout = [{ id: 'cv', size: 'L', order: 0 } as any]
    const result = mergeLayouts(persisted, defaultLayout)
    expect(result).toHaveLength(1)
    expect(result[0].visible).toBe(true)
  })
})
