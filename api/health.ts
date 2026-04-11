import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Deltagarportalen AI API',
    endpoints: [
      '/api/ai/cv-optimering',
      '/api/ai/generera-cv-text',
      '/api/ai/personligt-brev',
      '/api/ai/intervju-forberedelser',
      '/api/ai/jobbtips',
      '/api/ai/ovningshjalp',
      '/api/ai/loneforhandling',
      '/api/ai/linkedin-optimering',
      '/api/ai/karriarplan',
      '/api/ai/kompetensgap',
      '/api/ai/ansokningscoach',
      '/api/ai/intervju-simulator',
      '/api/ai/mentalt-stod',
      '/api/ai/natverkande',
      '/api/ai/chatbot'
    ]
  });
}
