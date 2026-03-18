/**
 * API Response Wrapper
 * Standardiserad felhantering för konsekventa API-responses
 * Gör det enklare att hantera fel i frontend och ger bättre debugging
 */

import { Response } from 'express'

// Pagination type for reuse
export interface PaginationInfo {
  page: number
  perPage: number
  total: number
  totalPages: number
}

// Metadata type for responses
export interface ResponseMeta {
  timestamp: string
  requestId: string
  cache?: boolean
  pagination?: PaginationInfo
}

// Standardiserat response-format
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
    context?: string
  }
  meta?: ResponseMeta
}

// Generera unikt request ID för spårbarhet
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// Skapa metadata för response
export function createMeta(options?: {
  cache?: boolean
  pagination?: PaginationInfo
  requestId?: string
}): ResponseMeta {
  const meta: ResponseMeta = {
    timestamp: new Date().toISOString(),
    requestId: options?.requestId || generateRequestId()
  }

  if (options?.cache !== undefined) {
    meta.cache = options.cache
  }

  if (options?.pagination) {
    meta.pagination = options.pagination
  }

  return meta
}

// Skapa success response
export function successResponse<T>(
  res: Response,
  data: T,
  options?: {
    statusCode?: number
    cache?: boolean
    pagination?: PaginationInfo
    requestId?: string
  }
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: createMeta(options)
  }

  res.status(options?.statusCode || 200).json(response)
}

// Skapa error response
export function errorResponse(
  res: Response,
  options: {
    code: string
    message: string
    details?: unknown
    context?: string
    statusCode?: number
    requestId?: string
  }
): void {
  const errorObj: ApiResponse['error'] = {
    code: options.code,
    message: options.message
  }

  if (options.details !== undefined) {
    errorObj!.details = options.details
  }

  if (options.context !== undefined) {
    errorObj!.context = options.context
  }

  const response: ApiResponse = {
    success: false,
    error: errorObj,
    meta: createMeta({ requestId: options.requestId })
  }

  // Logga felet för debugging (men inte skicka till klienten)
  console.error(`[API Error] ${options.code}: ${options.message}`, {
    details: options.details,
    context: options.context,
    requestId: response.meta?.requestId,
    timestamp: response.meta?.timestamp
  })

  res.status(options.statusCode || 400).json(response)
}

// Fördefinierade fel för vanliga scenarier
export const commonErrors = {
  // 400 - Bad Request
  validation: (res: Response, details?: unknown) => 
    errorResponse(res, {
      code: 'VALIDATION_ERROR',
      message: 'Ogiltig data. Kontrollera att alla fält är korrekt ifyllda.',
      details,
      statusCode: 400
    }),
  
  // 401 - Unauthorized
  unauthorized: (res: Response, context?: string) =>
    errorResponse(res, {
      code: 'UNAUTHORIZED',
      message: 'Du måste vara inloggad för att göra detta.',
      context,
      statusCode: 401
    }),
  
  // 403 - Forbidden
  forbidden: (res: Response, context?: string) =>
    errorResponse(res, {
      code: 'FORBIDDEN',
      message: 'Du har inte behörighet att göra detta.',
      context,
      statusCode: 403
    }),
  
  // 404 - Not Found
  notFound: (res: Response, resource: string = 'Resursen') =>
    errorResponse(res, {
      code: 'NOT_FOUND',
      message: `${resource} hittades inte.`,
      statusCode: 404
    }),
  
  // 409 - Conflict
  conflict: (res: Response, message: string = 'Detta finns redan.') =>
    errorResponse(res, {
      code: 'CONFLICT',
      message,
      statusCode: 409
    }),
  
  // 429 - Too Many Requests
  rateLimit: (res: Response, retryAfter?: number) =>
    errorResponse(res, {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'För många förfrågningar. Försök igen senare.',
      details: retryAfter ? { retryAfter } : undefined,
      statusCode: 429
    }),
  
  // 500 - Internal Server Error
  internal: (res: Response, details?: unknown) =>
    errorResponse(res, {
      code: 'INTERNAL_ERROR',
      message: 'Ett tekniskt fel uppstod. Vi har loggat felet och jobbar på att åtgärda det.',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      statusCode: 500
    }),
  
  // 503 - Service Unavailable
  serviceUnavailable: (res: Response, context?: string) =>
    errorResponse(res, {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Tjänsten är tillfälligt otillgänglig. Försök igen om en stund.',
      context,
      statusCode: 503
    })
}

// Async wrapper för att hantera errors i route handlers
export function asyncHandler(
  fn: (req: any, res: Response, next: any) => Promise<void>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Middleware för att fånga alla errors
export function errorHandler(err: any, req: any, res: Response, next: any) {
  console.error('Unhandled error:', err)
  
  // Om det redan är ett formaterat API-fel
  if (err.code && err.message) {
    return errorResponse(res, {
      code: err.code,
      message: err.message,
      details: err.details,
      statusCode: err.statusCode || 500
    })
  }
  
  // Standard fel
  commonErrors.internal(res, process.env.NODE_ENV === 'development' ? err : undefined)
}

export default {
  successResponse,
  errorResponse,
  commonErrors,
  asyncHandler,
  errorHandler,
  generateRequestId,
  createMeta
}
