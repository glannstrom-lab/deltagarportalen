import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardSkeleton } from './DashboardSkeleton'

describe('DashboardSkeleton', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<DashboardSkeleton />)
      expect(container.firstChild).toBeTruthy()
    })

    it('should render the main container', () => {
      render(<DashboardSkeleton />)
      const main = screen.getByRole('status')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      render(<DashboardSkeleton />)
      const status = screen.getByRole('status')
      expect(status).toBeInTheDocument()
    })

    it('should have aria-label describing the loading state', () => {
      render(<DashboardSkeleton />)
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-label', 'Laddar dashboard')
    })

    it('should have aria-busy="true" indicating loading', () => {
      render(<DashboardSkeleton />)
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-busy', 'true')
    })

    it('should have screen reader only text', () => {
      render(<DashboardSkeleton />)
      const srText = screen.getByText('Dashboard laddar...')
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('Structure', () => {
    it('should render max-width container', () => {
      const { container } = render(<DashboardSkeleton />)
      const maxWidthContainer = container.querySelector('.max-w-5xl')
      expect(maxWidthContainer).toBeInTheDocument()
    })

    it('should render grid layout', () => {
      const { container } = render(<DashboardSkeleton />)
      const gridContainer = container.querySelector('.grid.lg\\:grid-cols-3')
      expect(gridContainer).toBeInTheDocument()
    })

    it('should render KPI cards grid', () => {
      const { container } = render(<DashboardSkeleton />)
      const kpiGrid = container.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4')
      expect(kpiGrid).toBeInTheDocument()
    })

    it('should render 4 KPI card skeletons', () => {
      const { container } = render(<DashboardSkeleton />)
      const kpiGrid = container.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4')
      expect(kpiGrid?.children.length).toBe(4)
    })
  })

  describe('Skeleton Elements', () => {
    it('should render shimmer elements with skeleton-shimmer class', () => {
      const { container } = render(<DashboardSkeleton />)
      const shimmerElements = container.querySelectorAll('.skeleton-shimmer')
      expect(shimmerElements.length).toBeGreaterThan(0)
    })

    it('should render hero section skeleton', () => {
      const { container } = render(<DashboardSkeleton />)
      // Hero section has rounded-2xl and mb-4 or mb-6
      const heroSection = container.querySelector('.rounded-2xl.mb-4')
      expect(heroSection).toBeInTheDocument()
    })

    it('should render sidebar section', () => {
      const { container } = render(<DashboardSkeleton />)
      // Look for the RIASEC skeleton with rounded-full element
      const riasecChart = container.querySelector('.rounded-full.w-40.h-40')
      expect(riasecChart).toBeInTheDocument()
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', () => {
      const { container } = render(<DashboardSkeleton />)
      const darkModeElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkModeElements.length).toBeGreaterThan(0)
    })

    it('should use dark:bg-stone classes', () => {
      const { container } = render(<DashboardSkeleton />)
      const darkBgElements = container.querySelectorAll('[class*="dark:bg-stone"]')
      expect(darkBgElements.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive padding classes (sm:)', () => {
      const { container } = render(<DashboardSkeleton />)
      const responsiveElements = container.querySelectorAll('[class*="sm:p-"]')
      expect(responsiveElements.length).toBeGreaterThan(0)
    })

    it('should have responsive gap classes', () => {
      const { container } = render(<DashboardSkeleton />)
      const responsiveGapElements = container.querySelectorAll('[class*="sm:gap-"]')
      expect(responsiveGapElements.length).toBeGreaterThan(0)
    })

    it('should have lg:col-span-2 for main content', () => {
      const { container } = render(<DashboardSkeleton />)
      const mainContent = container.querySelector('.lg\\:col-span-2')
      expect(mainContent).toBeInTheDocument()
    })
  })

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<DashboardSkeleton />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
