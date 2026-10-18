/** O9 (2026-10-18): annonstexten från länken på jobbsidan står i rutan när panelen öppnas. */
import { describe, it, expect } from 'vitest'
import { render as rtlRender, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'

const render = (ui: ReactElement) => rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)
import { JobAdaptPanel } from './JobAdaptPanel'
import type { CVData } from '@/services/supabaseApi'

const cv = { firstName: 'Ada', skills: [], workExperience: [], education: [] } as unknown as CVData

describe('JobAdaptPanel — förifylld annons', () => {
  it('rutan innehåller annonstexten från länken', () => {
    render(<JobAdaptPanel cvData={cv} onAddSkill={() => {}} onUpdateSummary={() => {}} initialJobDescription="Vi söker dig med truckkort." />)
    expect(screen.getByRole('textbox')).toHaveValue('Vi söker dig med truckkort.')
  })

  it('utan länk är rutan tom, som förut', () => {
    render(<JobAdaptPanel cvData={cv} onAddSkill={() => {}} onUpdateSummary={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })
})
