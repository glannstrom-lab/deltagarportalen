/**
 * AI Streaming Service
 *
 * Provides real-time streaming for AI responses using Server-Sent Events (SSE).
 * Use this for long-running AI tasks to show content as it's generated.
 */

import { supabase } from '@/lib/supabase';

const API_BASE = '/api';

export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export type AIStreamFunction =
  | 'personligt-brev'
  | 'cv-optimering'
  | 'generera-cv-text'
  | 'intervju-forberedelser'
  | 'jobbtips'
  | 'loneforhandling'
  | 'karriarplan'
  | 'kompetensgap'
  | 'linkedin-optimering'
  | 'mentalt-stod'
  | 'natverkande'
  | 'ansokningscoach'
  | 'chatbot';

/**
 * Stream AI response with real-time callbacks
 *
 * @param functionName - The AI function to call
 * @param data - Input data for the function
 * @param callbacks - Callbacks for streaming events
 * @returns AbortController to cancel the stream
 *
 * @example
 * ```tsx
 * const [text, setText] = useState('');
 * const [isStreaming, setIsStreaming] = useState(false);
 *
 * const handleStream = () => {
 *   setIsStreaming(true);
 *   setText('');
 *
 *   streamAI('personligt-brev', { jobbAnnons: '...' }, {
 *     onToken: (token) => setText(prev => prev + token),
 *     onComplete: () => setIsStreaming(false),
 *     onError: (err) => {
 *       console.error(err);
 *       setIsStreaming(false);
 *     }
 *   });
 * };
 * ```
 */
export async function streamAI(
  functionName: AIStreamFunction,
  data: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<AbortController> {
  const controller = new AbortController();

  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      callbacks.onError?.(new Error('Inte inloggad. Logga in för att använda AI-funktioner.'));
      return controller;
    }

    callbacks.onStart?.();

    const response = await fetch(`${API_BASE}/ai-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ function: functionName, data }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      callbacks.onError?.(new Error(errorData.error || `HTTP error! status: ${response.status}`));
      return controller;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError?.(new Error('No response body'));
      return controller;
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            callbacks.onComplete?.(fullText);
            return controller;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              callbacks.onError?.(new Error(parsed.error));
              return controller;
            }
            if (parsed.content) {
              fullText += parsed.content;
              callbacks.onToken?.(parsed.content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    callbacks.onComplete?.(fullText);
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // Stream was cancelled
      return controller;
    }
    callbacks.onError?.(error as Error);
  }

  return controller;
}

/**
 * React hook for streaming AI responses
 *
 * @example
 * ```tsx
 * function CoverLetterGenerator() {
 *   const { streamedText, isStreaming, error, startStream, cancelStream } = useAIStream();
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
 *       <div>{streamedText}</div>
 *       {error && <p className="text-red-500">{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAIStream() {
  let streamedText = '';
  let isStreaming = false;
  let error: Error | null = null;
  let abortController: AbortController | null = null;

  const startStream = async (
    functionName: AIStreamFunction,
    data: Record<string, unknown>,
    onToken?: (token: string, fullText: string) => void,
    onComplete?: (fullText: string) => void
  ) => {
    streamedText = '';
    isStreaming = true;
    error = null;

    abortController = await streamAI(functionName, data, {
      onStart: () => {
        isStreaming = true;
      },
      onToken: (token) => {
        streamedText += token;
        onToken?.(token, streamedText);
      },
      onComplete: (fullText) => {
        isStreaming = false;
        onComplete?.(fullText);
      },
      onError: (err) => {
        error = err;
        isStreaming = false;
      },
    });

    return abortController;
  };

  const cancelStream = () => {
    if (abortController) {
      abortController.abort();
      isStreaming = false;
    }
  };

  return {
    streamedText,
    isStreaming,
    error,
    startStream,
    cancelStream,
  };
}

export default streamAI;
