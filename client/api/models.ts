import type { VercelRequest, VercelResponse } from '@vercel/node';

const RECOMMENDED_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Bra balans mellan kvalitet och pris', recommended: true },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Kraftfullaste modellen, dyrare', recommended: false },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'OpenAI:s senaste multimodella modell', recommended: false },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Billigare alternativ från OpenAI', recommended: false },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Snabb och prisvärd', recommended: false },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Open source-alternativ', recommended: false },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Meta:s öppna modell', recommended: false }
];

const DEFAULT_MODEL = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    currentModel: DEFAULT_MODEL,
    models: RECOMMENDED_MODELS,
    note: 'För att byta modell, uppdatera AI_MODEL i Vercel miljövariabler och redeploya'
  });
}
