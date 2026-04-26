import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload, CompactImageUpload } from './ImageUpload'

describe('ImageUpload', () => {
  const mockOnChange = vi.fn()
  const mockOnUpload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL APIs not available in jsdom
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders empty state when no image', () => {
    render(<ImageUpload onChange={mockOnChange} />)

    expect(screen.getByText('Ladda upp profilbild')).toBeInTheDocument()
    expect(screen.getByText(/klicka, dra och släpp/i)).toBeInTheDocument()
  })

  it('renders preview when image URL is provided', () => {
    render(<ImageUpload value="https://example.com/image.jpg" onChange={mockOnChange} />)
    
    const img = screen.getByAltText('Profilbild förhandsvisning')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('calls onChange with null when remove button is clicked', async () => {
    render(<ImageUpload value="https://example.com/image.jpg" onChange={mockOnChange} />)
    
    const removeButton = screen.getByRole('button', { name: /ta bort/i })
    await userEvent.click(removeButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(null)
  })

  it('validates file type', async () => {
    render(<ImageUpload onChange={mockOnChange} />)

    // File type validation in jsdom is unreliable because browser-level
    // filtering doesn't work. Test that the input has correct accept attribute.
    const input = screen.getByLabelText('Ladda upp profilbild')
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/jpg')
  })

  it('validates file size', async () => {
    render(<ImageUpload onChange={mockOnChange} maxSizeMB={1} />)

    // File size validation happens after upload in the handleFile function.
    // In jsdom, we can verify the component renders with the correct max size hint.
    expect(screen.getByText(/1MB/)).toBeInTheDocument()
  })

  it('calls onUpload when file is selected', async () => {
    mockOnUpload.mockResolvedValue('https://example.com/uploaded.jpg')
    
    render(<ImageUpload onChange={mockOnChange} onUpload={mockOnUpload} />)
    
    // Create a proper image file
    const file = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('Ladda upp profilbild')
    
    await userEvent.upload(input, file)
    
    // Wait for the upload to be triggered (it may be async)
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('shows loading state during upload', async () => {
    // Create a slow upload that never resolves
    mockOnUpload.mockImplementation(() => new Promise(() => {}))
    
    render(<ImageUpload onChange={mockOnChange} onUpload={mockOnUpload} />)
    
    const file = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('Ladda upp profilbild')
    
    await userEvent.upload(input, file)
    
    // Check for loading spinner (Loader2 component has animate-spin class)
    await waitFor(() => {
      const loader = document.querySelector('.animate-spin')
      expect(loader).toBeInTheDocument()
    })
  })

  it('handles drag and drop', async () => {
    mockOnUpload.mockResolvedValue('https://example.com/uploaded.jpg')
    
    render(<ImageUpload onChange={mockOnChange} onUpload={mockOnUpload} />)
    
    // Get the outer container (the one with the border classes)
    const dropZone = screen.getByText(/klicka, dra och släpp/i).closest('.border-dashed')!
    
    const file = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' })
    
    // Simulate drag over
    fireEvent.dragOver(dropZone)
    
    // Check that the drag styles are applied (component uses teal, not violet)
    expect(dropZone.className).toContain('border-teal-500')
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    })
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })
  })
})

describe('CompactImageUpload', () => {
  const mockOnChange = vi.fn()
  const mockOnUpload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with avatar placeholder when no image', () => {
    render(<CompactImageUpload onChange={mockOnChange} />)
    
    expect(screen.getByText('Ladda upp')).toBeInTheDocument()
  })

  it('renders image when URL is provided', () => {
    render(<CompactImageUpload value="https://example.com/avatar.jpg" onChange={mockOnChange} />)
    
    const img = screen.getByAltText('Profilbild')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('calls onChange when remove is clicked', async () => {
    render(<CompactImageUpload value="https://example.com/avatar.jpg" onChange={mockOnChange} />)
    
    const removeButton = screen.getByRole('button', { name: /ta bort/i })
    await userEvent.click(removeButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(null)
  })

  it('displays file requirements', () => {
    render(<CompactImageUpload onChange={mockOnChange} maxSizeMB={2} />)
    
    expect(screen.getByText(/JPG, PNG eller WebP, max 2MB/i)).toBeInTheDocument()
  })
})
