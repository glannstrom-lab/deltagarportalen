/**
 * Image Upload API Endpoint
 * Uploads images to Vercel Blob Storage
 *
 * Environment variables required:
 * - BLOB_READ_WRITE_TOKEN
 */

const { put } = require('@vercel/blob');

// Allowed image types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://jobin.se',
  'https://www.jobin.se',
  'https://deltagarportalen.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

/**
 * Get CORS headers
 */
function getCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';

  // Set CORS headers
  Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Upload] BLOB_READ_WRITE_TOKEN not configured');
      return res.status(500).json({ error: 'Storage not configured' });
    }

    // Get filename from query params
    const filename = req.query.filename;

    if (!filename) {
      return res.status(400).json({ error: 'Filename required' });
    }

    // Validate content type
    const contentType = req.headers['content-type'];
    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' });
    }

    // Get raw body as buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Max 5MB' });
    }

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

// Disable body parsing - we handle raw stream
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
