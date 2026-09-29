import { describe, it, expect } from 'vitest'
import { innehallSprak } from './contentApi'

describe('innehallSprak (NY4)', () => {
  it('svenska är alltid svenska', () => {
    expect(innehallSprak('sv', { content: 'x', content_en: 'y', title_en: 'y' })).toBe('sv')
  })
  it('hel artikel: avgörs av content_en', () => {
    expect(innehallSprak('en', { content: 'x', content_en: 'y' })).toBe('en')
    expect(innehallSprak('en', { content: 'x', content_en: null, title_en: 'T' })).toBe('sv')
  })
  it('listrad utan brödtext: avgörs av title_en', () => {
    expect(innehallSprak('en', { title_en: 'Title' })).toBe('en')
    expect(innehallSprak('en', { title_en: null })).toBe('sv')
  })
})
