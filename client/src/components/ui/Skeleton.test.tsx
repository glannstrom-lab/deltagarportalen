import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  CardSkeleton,
  DashboardWidgetSkeleton,
  ListSkeleton,
  FormSkeleton,
} from './Skeleton'

describe('Skeleton', () => {
  it('renders basic skeleton', () => {
    render(<Skeleton data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('renders card skeleton', () => {
    render(<CardSkeleton data-testid="card-skeleton" />)
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument()
  })

  it('renders dashboard widget skeleton', () => {
    render(<DashboardWidgetSkeleton />)
    // Should have multiple skeleton elements
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders list skeleton with correct number of items', () => {
    render(<ListSkeleton items={3} />)
    // Should render 3 list items
    const items = document.querySelectorAll('.border-slate-200')
    expect(items.length).toBe(3)
  })

  it('renders form skeleton with correct number of fields', () => {
    render(<FormSkeleton fields={4} />)
    // Should render 4 form fields plus button
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />)
    expect(screen.getByTestId('skeleton')).toHaveClass('custom-class')
  })
})
