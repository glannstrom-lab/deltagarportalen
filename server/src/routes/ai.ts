import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'

const router = Router()

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:3002'
const AI_ENABLED = process.env.AI_ENABLED === 'true'

// Helper function för AI-proxy
async function proxyToAI(endpoint: string, body: any, res: any) {
  if (!AI_ENABLED) {
    return res.status(503).json({ 
      error: 'AI-funktioner är inte aktiverade',
      message: 'Kontakta administratören för att aktivera AI-funktioner'
    })
  }

  try {
    const response = await fetch(`${AI_SERVER_URL}/api/ai${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI server error:', error)
      return res.status(response.status).json({
        error: 'Kunde inte kommunicera med AI-tjänsten'
      })
    }

    const data = await response.json()
    res.json(data)

  } catch (error) {
    console.error('AI proxy error:', error)
    res.status(500).json({
      error: 'AI-servern är inte tillgänglig',
      message: 'Kontrollera att AI-servern körs på ' + AI_SERVER_URL
    })
  }
}

/**
 * CV-optimering
 */
router.post('/cv-optimering', authMiddleware, async (req, res) => {
  await proxyToAI('/cv-optimering', req.body, res)
})

/**
 * Generera CV-text
 */
router.post('/generera-cv-text', authMiddleware, async (req, res) => {
  await proxyToAI('/generera-cv-text', req.body, res)
})

/**
 * Personligt brev
 */
router.post('/personligt-brev', authMiddleware, async (req, res) => {
  await proxyToAI('/personligt-brev', req.body, res)
})

/**
 * Intervjuförberedelser
 */
router.post('/intervju-forberedelser', authMiddleware, async (req, res) => {
  await proxyToAI('/intervju-forberedelser', req.body, res)
})

/**
 * Jobbtips
 */
router.post('/jobbtips', authMiddleware, async (req, res) => {
  await proxyToAI('/jobbtips', req.body, res)
})

/**
 * Övningshjälp
 */
router.post('/ovningshjalp', authMiddleware, async (req, res) => {
  await proxyToAI('/ovningshjalp', req.body, res)
})

/**
 * Löneförhandling
 */
router.post('/loneforhandling', authMiddleware, async (req, res) => {
  await proxyToAI('/loneforhandling', req.body, res)
})

/**
 * Health check för AI-servern
 */
router.get('/health', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_SERVER_URL}/api/health`, {
      method: 'GET'
    })

    if (!response.ok) {
      return res.json({
        status: 'unavailable',
        enabled: AI_ENABLED,
        url: AI_SERVER_URL,
        message: 'AI-servern svarar men rapporterar fel'
      })
    }

    const data = await response.json()
    res.json({
      status: 'OK',
      enabled: AI_ENABLED,
      url: AI_SERVER_URL,
      aiServer: data
    })

  } catch (error) {
    res.json({
      status: 'unavailable',
      enabled: AI_ENABLED,
      url: AI_SERVER_URL,
      message: 'AI-servern är inte tillgänglig',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    })
  }
})

export default router
