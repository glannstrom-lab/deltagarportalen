/**
 * Image Upload API Endpoint
 * Uploads images to Vercel Blob Storage
 *
 * Environment variables required:
 * - BLOB_READ_WRITE_TOKEN
 * - VITE_SUPABASE_URL / SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
 *
 * Säkerhet (2026-05-15):
 * - Kräver Bearer-token + auth.getUser-verifiering
 * - Magic-byte-validering på buffer (Content-Type kan spoofas)
 * - Rate-limit via Supabase RPC check_rate_limit (5/15 min per user)
 * - Filnamn saniteras mot path-traversal
 *
 * GDPR / Region (2026-05-15):
 * - Funktionen körs i `fra1` (Frankfurt) — se vercel.json regions.
 * - Vercel Blob-storage REGION måste vara EU. Kontrollera i Vercel-dashboarden:
 *   Project → Storage → Blob → store-namn → Settings → Region: "Europe (Frankfurt)"
 *   eller "Europe (Ireland)". Default vid skapande är USA — måste ändras manuellt.
 *   Om store ligger i USA: skapa ny EU-store, migrera filer, byt BLOB_READ_WRITE_TOKEN.
 * - Se docs/HOSTING-REGIONS.md för fullständig regions-policy.
 */

const { put } = require('@vercel/blob');
const { createClient } = require('@supabase/supabase-js');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RATE_LIMIT_PER_USER_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

const ALLOWED_ORIGINS = [
  'https://jobin.se',
  'https://www.jobin.se',
  'https://deltagarportalen.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

function getCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Magic-byte-validering — Content-Type-header kan spoofas av klient.
 * Returnerar det DETEKTERADE content-type, eller null om okänt.
 */
function detectImageType(buffer) {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return 'image/png';
  }
  // GIF: 47 49 46 38 (37 or 39) 61 -> "GIF87a" or "GIF89a"
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) {
    return 'image/gif';
  }
  // WebP: RIFF .... WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  return null;
}

/**
 * Sanera filnamn — path-traversal-skydd. Tar bort separators och
 * begränsar till säkra tecken.
 */
function sanitizeFilename(name) {
  return String(name)
    .replace(/[/\\]/g, '_')              // path separators
    .replace(/\.\./g, '_')               // parent-dir
    .replace(/[^\w.\-]/g, '_')           // bara ord-tecken, punkt, bindestreck
    .slice(0, 200);                      // max 200 tecken
}

async function checkRateLimit(supabase, userId) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: userId,
      p_endpoint: 'upload-image',
      p_max_requests: RATE_LIMIT_PER_USER_PER_WINDOW,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });
    if (error) {
      console.error('[Upload] Rate-limit RPC error:', error.message);
      return { allowed: true, remaining: RATE_LIMIT_PER_USER_PER_WINDOW, resetIn: 0 };
    }
    if (data && data.length > 0) {
      const r = data[0];
      const resetIn = r.reset_at
        ? Math.max(0, new Date(r.reset_at).getTime() - Date.now())
        : RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      return { allowed: r.allowed, remaining: r.remaining || 0, resetIn };
    }
    return { allowed: true, remaining: RATE_LIMIT_PER_USER_PER_WINDOW, resetIn: 0 };
  } catch (err) {
    console.error('[Upload] Rate-limit check failed:', err);
    return { allowed: true, remaining: RATE_LIMIT_PER_USER_PER_WINDOW, resetIn: 0 };
  }
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ---------- AUTH ----------
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — Bearer token required' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // ---------- RATE LIMIT ----------
  const rl = await checkRateLimit(supabase, user.id);
  if (!rl.allowed) {
    const retryAfter = Math.ceil(rl.resetIn / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'För många uppladdningar. Försök igen om en stund.',
      retryAfter,
    });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Upload] BLOB_READ_WRITE_TOKEN not configured');
      return res.status(500).json({ error: 'Storage not configured' });
    }

    const rawFilename = req.query.filename;
    if (!rawFilename) {
      return res.status(400).json({ error: 'Filename required' });
    }
    const filename = sanitizeFilename(rawFilename);

    // Content-Type-header (svag) ska matcha tillåtna typer
    const contentTypeHeader = req.headers['content-type'];
    if (!contentTypeHeader || !ALLOWED_TYPES.includes(contentTypeHeader)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' });
    }

    // Läs buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File too large. Max 5MB' });
    }

    // Magic-byte-validering — stark (klienten kan inte spoofa byte-mönster)
    const detectedType = detectImageType(buffer);
    if (!detectedType) {
      return res.status(400).json({ error: 'File content is not a valid image' });
    }
    if (detectedType !== contentTypeHeader) {
      return res.status(400).json({
        error: 'Content-Type mismatch (header says ' + contentTypeHeader +
               ', actual file is ' + detectedType + ')',
      });
    }

    // Inkludera user.id i blob-path så uppladdningar är spårbara per user
    const blobPath = `user-${user.id}/${filename}`;

    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: detectedType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
