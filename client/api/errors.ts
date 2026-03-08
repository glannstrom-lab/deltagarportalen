import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const error = req.body;
    
    // Logga felet till konsolen (kan ses i Vercel logs)
    console.error('[Client Error]', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      component: error?.component,
      url: error?.url,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Returnera 200 för att inte störa användarupplevelsen
    return res.json({ success: true });
  } catch (e) {
    console.error('Error logging client error:', e);
    return res.status(500).json({ error: 'Failed to log error' });
  }
}
