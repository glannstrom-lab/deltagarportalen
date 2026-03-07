import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload, CompactImageUpload } from './ImageUpload'

describe('ImageUpload', () => {
  const mockOnChange = vi.fn()
  const mockOnUpload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no image', () => {
    render(<ImageUpload onChange={mockOnChange} />)
    
    expect(screen.getByText('Ladda upp profilbild')).toBeInTheDocument()
    expect(screen.getByText('Klicka eller dra och släpp en bild')).toBeInTheDocument()
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
    
    const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText('Ladda upp profilbild')
    
    await userEvent.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText(/ogiltigt filformat/i)).toBeInTheDocument()
    })
  })

  it('validates file size', async () => {
    render(<ImageUpload onChange={mockOnChange} maxSizeMB={1} />)
    
    // Create a large file (2MB)
    const largeContent = new Uint8Array(2 * 1024 * 1024)
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText('Ladda upp profilbild')
    
    await userEvent.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText(/filen är för stor/i)).toBeInTheDocument()
    })
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
    const dropZone = screen.getByText(/klicka eller dra och släpp/i).closest('.border-dashed')!
    
    const file = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' })
    
    // Simulate drag over
    fireEvent.dragOver(dropZone)
    
    // Check that the drag styles are applied
    expect(dropZone.className).toContain('border-violet-500')
    
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
