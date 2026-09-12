/**
 * Renderingshjälp för företagsvyns flikar — samma skal som prod ger dem:
 * React Query, router och bekräftelsedialogen. retry: false så ett fel blir ett
 * fel-läge direkt i stället för tre tysta omförsök.
 */

import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

export function rendera(ui: ReactElement, sokvag = '/foretag') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[sokvag]}>
        <I18nextProvider i18n={i18n}>
          <ConfirmDialogProvider>{ui}</ConfirmDialogProvider>
        </I18nextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
