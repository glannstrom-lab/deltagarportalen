import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n/config'
import en from '@/i18n/locales/en.json'
import EnhancedArticleCard from './EnhancedArticleCard'

async function engelska() {
  i18n.addResourceBundle('en', 'translation', en, true, true)
  await i18n.changeLanguage('en')
}

const artikel = { id: 'a', title: 'Titel', summary: 'Sammanfattning', category: 'job-search' }

function rita(contentSprak?: 'sv' | 'en') {
  return render(<MemoryRouter><EnhancedArticleCard article={{ ...artikel, contentSprak }} /></MemoryRouter>)
}

describe('EnhancedArticleCard — bara på svenska (NY4)', () => {
  afterEach(async () => { await i18n.changeLanguage('sv') })

  it('märker en artikel utan engelsk text i engelskt läge', async () => {
    await engelska()
    rita('sv')
    expect(screen.getByText(/swedish only/i)).toBeInTheDocument()
  })

  it('märker inte en översatt artikel', async () => {
    await engelska()
    rita('en')
    expect(screen.queryByText(/swedish only/i)).not.toBeInTheDocument()
  })

  it('märker ingenting på svenska', () => {
    rita('sv')
    expect(screen.queryByText(/bara på svenska/i)).not.toBeInTheDocument()
  })
})
