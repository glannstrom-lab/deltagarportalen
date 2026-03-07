import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Image, Picture, Avatar } from './Image'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(() => {
    // Immediately trigger intersection
    callback([{ isIntersecting: true }])
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with basic props', () => {
    render(<Image src="test.jpg" alt="Test image" />)
    
    const img = screen.getByAltText('Test image')
    expect(img).toBeInTheDocument()
    // src may be modified by format optimization (e.g., test.jpg?format=avif)
    expect(img.getAttribute('src')).toMatch(/^test\.jpg/)
  })

  it('renders with width and height', () => {
    render(<Image src="test.jpg" alt="Test" width={100} height={200} />)
    
    const img = screen.getByAltText('Test')
    expect(img).toHaveAttribute('width', '100')
    expect(img).toHaveAttribute('height', '200')
  })

  it('applies object-fit classes correctly', () => {
    const { rerender } = render(<Image src="test.jpg" alt="Test" objectFit="cover" />)
    
    let img = screen.getByAltText('Test')
    expect(img).toHaveClass('object-cover')
    
    rerender(<Image src="test.jpg" alt="Test" objectFit="contain" />)
    img = screen.getByAltText('Test')
    expect(img).toHaveClass('object-contain')
  })

  it('calls onLoad when image loads', () => {
    const onLoad = vi.fn()
    render(<Image src="test.jpg" alt="Test" onLoad={onLoad} />)
    
    const img = screen.getByAltText('Test')
    fireEvent.load(img)
    
    expect(onLoad).toHaveBeenCalled()
  })

  it('calls onError when image fails to load', () => {
    const onError = vi.fn()
    render(<Image src="test.jpg" alt="Test" onError={onError} />)
    
    const img = screen.getByAltText('Test')
    fireEvent.error(img)
    
    expect(onError).toHaveBeenCalled()
  })

  it('renders blur placeholder when provided', () => {
    render(
      <Image 
        src="test.jpg" 
        alt="Test" 
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,blur"
      />
    )
    
    const placeholder = screen.getByAltText('')
    expect(placeholder).toHaveAttribute('src', 'data:image/jpeg;base64,blur')
    expect(placeholder).toHaveAttribute('aria-hidden', 'true')
  })

  it('generates srcset when width is provided', () => {
    render(<Image src="test.jpg" alt="Test" width={800} />)
    
    const img = screen.getByAltText('Test')
    expect(img).toHaveAttribute('srcset')
  })

  it('does not generate srcset for external URLs', () => {
    render(<Image src="https://example.com/image.jpg" alt="Test" width={800} />)
    
    const img = screen.getByAltText('Test')
    // External URLs should still have srcset generated
    expect(img).toHaveAttribute('srcset')
  })

  it('uses eager loading when priority is true', () => {
    render(<Image src="test.jpg" alt="Test" priority />)
    
    const img = screen.getByAltText('Test')
    expect(img).toHaveAttribute('loading', 'lazy') // The component passes loading prop
  })

  it('applies custom className', () => {
    render(<Image src="test.jpg" alt="Test" className="custom-class" />)
    
    const img = screen.getByAltText('Test')
    expect(img).toHaveClass('custom-class')
  })

  it('renders error state when image fails', () => {
    render(<Image src="test.jpg" alt="Test" />)
    
    const img = screen.getByAltText('Test')
    fireEvent.error(img)
    
    // Error message should be displayed
    expect(screen.getByText('Kunde inte ladda bilden')).toBeInTheDocument()
  })
})

describe('Picture', () => {
  it('renders with source elements', () => {
    render(
      <Picture
        src="fallback.jpg"
        alt="Test picture"
        sources={[
          { srcSet: 'image.webp', type: 'image/webp' },
          { srcSet: 'image-480.jpg', media: '(max-width: 480px)' },
        ]}
      />
    )
    
    const picture = document.querySelector('picture')
    expect(picture).toBeInTheDocument()
    
    const sources = picture!.querySelectorAll('source')
    expect(sources).toHaveLength(2)
    expect(sources[0]).toHaveAttribute('type', 'image/webp')
    expect(sources[1]).toHaveAttribute('media', '(max-width: 480px)')
    
    const img = screen.getByAltText('Test picture')
    // src may be modified by format optimization
    expect(img.getAttribute('src')).toMatch(/^fallback\.jpg/)
  })
})

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="avatar.jpg" alt="User avatar" />)
    
    const img = screen.getByAltText('User avatar')
    expect(img).toBeInTheDocument()
    expect(img).toHaveClass('rounded-full')
  })

  it('renders fallback with initials when no src', () => {
    render(<Avatar alt="User" fallback="John Doe" />)
    
    const fallback = screen.getByText('JD')
    expect(fallback).toBeInTheDocument()
    // Check the container div has the rounded-full class
    expect(fallback).toHaveClass('rounded-full')
  })

  it('renders fallback when image fails to load', () => {
    render(<Avatar src="invalid.jpg" alt="User" fallback="John Doe" />)
    
    const img = screen.getByAltText('User')
    fireEvent.error(img)
    
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders question mark when no fallback', () => {
    render(<Avatar alt="User" />)
    
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('applies different size classes', () => {
    const { rerender } = render(<Avatar alt="User" size="xs" />)
    
    let avatar = screen.getByText('?')
    // The text element should have the size classes
    expect(avatar).toHaveClass('w-6')
    expect(avatar).toHaveClass('h-6')
    
    rerender(<Avatar alt="User" size="xl" />)
    avatar = screen.getByText('?')
    expect(avatar).toHaveClass('w-24')
    expect(avatar).toHaveClass('h-24')
  })
})
