/**
 * Retry Service med exponential backoff
 * Hanterar tillfälliga nätverksfel och timeout
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 sekund
  maxDelay: 10000, // 10 sekunder
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server errors
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly attempt: number,
    public readonly lastError?: Error
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Vänta en viss tid
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Beräkna delay med exponential backoff och jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 1000; // Lägg till slumpmässighet
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Kör en funktion med retry-logik
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName: string = 'Operation'
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      console.log(`[Retry] ${operationName} - Försök ${attempt + 1}/${fullConfig.maxRetries + 1}`);
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Kolla om vi ska retry:a
      const shouldRetry = attempt < fullConfig.maxRetries && isRetryableError(error, fullConfig);
      
      if (!shouldRetry) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, fullConfig);
      console.log(`[Retry] ${operationName} - Försök ${attempt + 1} misslyckades, väntar ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new RetryableError(
    `${operationName} misslyckades efter ${fullConfig.maxRetries + 1} försök`,
    fullConfig.maxRetries,
    lastError
  );
}

/**
 * Kolla om ett fel är retry-bart
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  // Kolla om det är en timeout
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true;
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return true;
    }
  }

  // Kolla HTTP status kod (om tillgänglig)
  const statusCode = (error as any)?.status || (error as any)?.statusCode;
  if (statusCode && config.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * Wrapper för fetch med retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Kolla om vi ska retry:a baserat på status
        if (!response.ok) {
          const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
          if (config.retryableStatusCodes.includes(response.status)) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    retryConfig,
    `Fetch ${url}`
  );
}

export default { withRetry, fetchWithRetry, RetryableError };
