/**
 * React Hook for AI Streaming
 *
 * Provides real-time streaming for AI responses using Server-Sent Events (SSE).
 * Perfect for long-running AI tasks like cover letter generation.
 */

import { useState, useCallback, useRef } from 'react';
import { streamAI, type AIStreamFunction } from '@/services/aiStreamService';

export interface UseAIStreamOptions {
  onToken?: (token: string, fullText: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAIStreamReturn {
  streamedText: string;
  isStreaming: boolean;
  error: Error | null;
  startStream: (functionName: AIStreamFunction, data: Record<string, unknown>) => Promise<void>;
  cancelStream: () => void;
  reset: () => void;
}

/**
 * React hook for streaming AI responses
 *
 * @example
 * ```tsx
 * function CoverLetterGenerator() {
 *   const {
 *     streamedText,
 *     isStreaming,
 *     error,
 *     startStream,
 *     cancelStream,
 *     reset
 *   } = useAIStream({
 *     onComplete: (text) => console.log('Done!', text)
 *   });
 *
 *   const handleGenerate = () => {
 *     startStream('personligt-brev', {
 *       jobbAnnons: jobDescription,
 *       companyName: company,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isStreaming}>
 *         {isStreaming ? 'Genererar...' : 'Generera'}
 *       </button>
 *       {isStreaming && <button onClick={cancelStream}>Avbryt</button>}
 *       <div className="whitespace-pre-wrap">{streamedText}</div>
 *       {error && <p className="text-red-500">{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAIStream(options: UseAIStreamOptions = {}): UseAIStreamReturn {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (functionName: AIStreamFunction, data: Record<string, unknown>) => {
      // Reset state
      setStreamedText('');
      setError(null);
      setIsStreaming(true);

      try {
        abortControllerRef.current = await streamAI(functionName, data, {
          onStart: () => {
            setIsStreaming(true);
          },
          onToken: (token) => {
            setStreamedText((prev) => {
              const newText = prev + token;
              options.onToken?.(token, newText);
              return newText;
            });
          },
          onComplete: (fullText) => {
            setIsStreaming(false);
            options.onComplete?.(fullText);
          },
          onError: (err) => {
            setError(err);
            setIsStreaming(false);
            options.onError?.(err);
          },
        });
      } catch (err) {
        setError(err as Error);
        setIsStreaming(false);
        options.onError?.(err as Error);
      }
    },
    [options]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    cancelStream();
    setStreamedText('');
    setError(null);
  }, [cancelStream]);

  return {
    streamedText,
    isStreaming,
    error,
    startStream,
    cancelStream,
    reset,
  };
}

export default useAIStream;
