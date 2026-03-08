/**
 * API Route for uploading images to Vercel Blob
 * 
 * Required environment variables:
 * - BLOB_READ_WRITE_TOKEN (from Vercel Blob)
 */

import { put } from '@vercel/blob'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false, // Required for raw file upload
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get filename from query
    const { filename } = req.query
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename required' })
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    const hasValidExtension = allowedExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidExtension) {
      return res.status(400).json({ error: 'Invalid file type' })
    }

    // Upload to Vercel Blob
    const blob = await put(`cv-images/${filename}`, req, {
      access: 'public',
      contentType: req.headers['content-type'] || 'image/jpeg',
    })

    return res.status(200).json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    })
  }
}
