import type { VercelRequest, VercelResponse } from '@vercel/node';

// Generera ett unikt fel-ID
const generateErrorId = () => {
  return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

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

  const errorId = generateErrorId();

  try {
    const error = req.body || {};
    
    // Logga detaljerat fel till konsolen (kan ses i Vercel logs)
    console.error('[Client Error]', JSON.stringify({
      errorId,
      message: error.message || error.error?.message || 'Unknown error',
      stack: error.stack || error.error?.stack,
      component: error.component,
      url: error.url || req.headers.referer,
      method: req.method,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      // Ytterligare kontext
      errorType: error.name || error.error?.name,
      source: error.source,
      lineno: error.lineno,
      colno: error.colno,
      filename: error.filename,
      // För React-fel
      errorInfo: error.errorInfo,
      componentStack: error.componentStack
    }, null, 2));

    // Returnera errorId så klienten kan referera till det
    return res.json({ 
      success: true, 
      errorId,
      message: 'Error logged successfully'
    });
  } catch (e: any) {
    console.error('[Error Logging Failed]', {
      errorId,
      message: e.message,
      stack: e.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Failed to log error',
      errorId
    });
  }
}
