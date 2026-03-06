import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

const RECOMMENDED_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Bra balans mellan kvalitet och pris', recommended: true },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Kraftfullaste modellen, dyrare', recommended: false },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'OpenAI:s senaste multimodella modell', recommended: false },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Billigare alternativ från OpenAI', recommended: false },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    model: DEFAULT_MODEL,
    modelInfo: RECOMMENDED_MODELS.find(m => m.id === DEFAULT_MODEL) || { id: DEFAULT_MODEL, name: DEFAULT_MODEL },
    rateLimit: {
      windowMs: '15 minuter',
      max: 20
    },
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
