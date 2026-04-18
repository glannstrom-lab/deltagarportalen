/**
 * Image Upload API Endpoint
 * Uploads images to Vercel Blob Storage
 *
 * Environment variables required:
 * - BLOB_READ_WRITE_TOKEN
 */

import { put } from '@vercel/blob'

export const config = {
  runtime: 'edge',
}

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://deltagarportalen.se',
  'https://www.deltagarportalen.se',
  'https://deltagarportalen.vercel.app',
  process.env.FRONTEND_URL,
  // Allow localhost in development
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:3000'] : []),
].filter(Boolean)

// Allowed image types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Get CORS headers with origin validation
 */
function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export default async function handler(req) {
  const requestOrigin = req.headers.get('origin') || ''

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(requestOrigin),
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(requestOrigin),
      },
    })
  }

  try {
    // Check for blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Upload] BLOB_READ_WRITE_TOKEN not configured')
      return new Response(JSON.stringify({ error: 'Storage not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(requestOrigin),
        },
      })
    }

    // Get filename from query params
    const url = new URL(req.url)
    const filename = url.searchParams.get('filename')

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(requestOrigin),
        },
      })
    }

    // Validate content type
    const contentType = req.headers.get('content-type')
    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(requestOrigin),
        },
      })
    }

    // Get file data
    const fileData = await req.arrayBuffer()

    // Validate file size
    if (fileData.byteLength > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Max 5MB' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(requestOrigin),
        },
      })
    }

    // Upload to Vercel Blob
    const blob = await put(filename, fileData, {
      access: 'public',
      contentType,
    })

    return new Response(JSON.stringify({ url: blob.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(requestOrigin),
      },
    })
  } catch (error) {
    console.error('[Upload] Error:', error)
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(requestOrigin),
      },
    })
  }
}
