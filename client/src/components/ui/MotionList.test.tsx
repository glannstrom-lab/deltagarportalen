import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'fs'
import path from 'path'
import { MotionList } from './MotionList'

describe('MotionList (LIV-ROADMAP Fas 2 — stagger-primitiv)', () => {
  it('wrappar varje barn i .stagger-item med växande --stagger-index', () => {
    const { container } = render(
      <MotionList>
        <div>ett</div>
        <div>två</div>
        <div>tre</div>
      </MotionList>
    )
    const items = container.querySelectorAll('.stagger-item')
    expect(items).toHaveLength(3)
    expect((items[0] as HTMLElement).style.getPropertyValue('--stagger-index')).toBe('0')
    expect((items[1] as HTMLElement).style.getPropertyValue('--stagger-index')).toBe('1')
    expect((items[2] as HTMLElement).style.getPropertyValue('--stagger-index')).toBe('2')
  })

  it('capar --stagger-index så listan inte får oändligt växande delay', () => {
    const many = Array.from({ length: 12 }, (_, i) => <div key={i}>{i}</div>)
    const { container } = render(<MotionList cap={8}>{many}</MotionList>)
    const items = container.querySelectorAll('.stagger-item')
    expect(items).toHaveLength(12)
    // Allt efter index 8 ska vara capat till 8.
    expect((items[11] as HTMLElement).style.getPropertyValue('--stagger-index')).toBe('8')
  })

  it('är reduced-motion-säker: använder INTE framer-motion (förlitar sig på CSS-tokens)', () => {
    const src = readFileSync(path.join(__dirname, 'MotionList.tsx'), 'utf-8')
    expect(/from ['"]framer-motion['"]/.test(src)).toBe(false)
  })
})
