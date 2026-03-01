import { render as rtlRender } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactElement } from 'react'

// Create a custom render function that includes providers
export function render(ui: ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route)
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Re-export testing library utilities
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'
