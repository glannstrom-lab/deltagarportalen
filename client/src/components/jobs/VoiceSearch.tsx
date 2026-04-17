/**
 * Voice Search Component - Röstbaserad Jobbsökning
 * Feature #5: Sök jobb genom att prata - tillgängligt för synskadade/dyslektiker
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  MicOff,
  Search,
  Volume2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
  MapPin,
  ChevronRight,
} from '@/components/ui/icons';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { searchJobs, type PlatsbankenJob } from '@/services/arbetsformedlingenApi';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceSearch() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setError(
        lang === 'en'
          ? 'Voice search is not supported in your browser. Try Chrome or Edge.'
          : 'Röstsökning stöds inte i din webbläsare. Prova Chrome eller Edge.'
      );
      return;
    }

    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = lang === 'en' ? 'en-US' : 'sv-SE';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError(
          lang === 'en'
            ? 'Microphone access denied. Please enable it in your browser settings.'
            : 'Mikrofonåtkomst nekad. Aktivera det i webbläsarens inställningar.'
        );
      } else if (event.error === 'no-speech') {
        setError(
          lang === 'en'
            ? "I didn't hear anything. Try again?"
            : 'Jag hörde inget. Försök igen?'
        );
      } else {
        setError(
          lang === 'en'
            ? `Error: ${event.error}. Please try again.`
            : `Fel: ${event.error}. Försök igen.`
        );
      }
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimText);
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.abort();
    };
  }, [lang]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognition) return;

    setTranscript('');
    setInterimTranscript('');
    setError(null);

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [recognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognition) return;

    try {
      recognition.stop();
    } catch (err) {
      console.error('Failed to stop recognition:', err);
    }
  }, [recognition]);

  // Search with transcript
  const performSearch = useCallback(async () => {
    const query = transcript.trim();
    if (!query) return;

    setIsSearching(true);
    setError(null);

    try {
      const result = await searchJobs({ query, limit: 20 });
      setJobs(result.hits);

      // Announce results via speech
      if ('speechSynthesis' in window) {
        const count = result.hits.length;
        const message =
          lang === 'en'
            ? `Found ${count} jobs matching "${query}".`
            : `Hittade ${count} jobb som matchar "${query}".`;

        speak(message);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(
        lang === 'en'
          ? 'Search failed. Please try again.'
          : 'Sökningen misslyckades. Försök igen.'
      );
    } finally {
      setIsSearching(false);
    }
  }, [transcript, lang]);

  // Trigger search when transcript finalizes
  useEffect(() => {
    if (transcript && !isListening) {
      performSearch();
    }
  }, [transcript, isListening, performSearch]);

  // Text-to-speech for accessibility
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'sv-SE';
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [lang]);

  // Read job details aloud
  const readJob = useCallback(
    (job: PlatsbankenJob) => {
      const text =
        lang === 'en'
          ? `${job.headline} at ${job.employer?.name || 'Unknown employer'} in ${
              job.workplace_address?.municipality || 'Unknown location'
            }.`
          : `${job.headline} hos ${job.employer?.name || 'Okänd arbetsgivare'} i ${
              job.workplace_address?.municipality || 'Okänd plats'
            }.`;

      speak(text);
    },
    [lang, speak]
  );

  if (!isSupported) {
    return (
      <Card className="p-8 text-center">
        <MicOff className="w-12 h-12 text-stone-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {lang === 'en' ? 'Voice Search Not Available' : 'Röstsökning ej tillgänglig'}
        </h3>
        <p className="text-stone-600 dark:text-stone-400">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mic className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {lang === 'en' ? 'Voice Job Search' : 'Sök jobb med rösten'}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
              {lang === 'en'
                ? 'Click the microphone and say what kind of job you\'re looking for. Example: "Programmer in Stockholm"'
                : 'Klicka på mikrofonen och säg vilken typ av jobb du söker. Exempel: "Programmerare i Stockholm"'}
            </p>
          </div>
        </div>
      </Card>

      {/* Voice control area */}
      <div className="flex flex-col items-center">
        {/* Microphone button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg',
            isListening
              ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
              : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
          )}
          aria-label={
            isListening
              ? lang === 'en'
                ? 'Stop listening'
                : 'Sluta lyssna'
              : lang === 'en'
              ? 'Start listening'
              : 'Börja lyssna'
          }
        >
          {isListening ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        {/* Status text */}
        <p className="mt-4 text-stone-600 dark:text-stone-400 text-center">
          {isListening ? (
            <span className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {lang === 'en' ? 'Listening...' : 'Lyssnar...'}
            </span>
          ) : isSearching ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {lang === 'en' ? 'Searching...' : 'Söker...'}
            </span>
          ) : (
            lang === 'en' ? 'Click the microphone to start' : 'Klicka på mikrofonen för att börja'
          )}
        </p>

        {/* Transcript display */}
        {(transcript || interimTranscript) && (
          <div className="mt-4 w-full max-w-md">
            <Card className="p-4">
              <p className="text-stone-800 dark:text-stone-100 text-center">
                <span className="font-medium">{transcript}</span>
                {interimTranscript && (
                  <span className="text-stone-400 italic"> {interimTranscript}</span>
                )}
              </p>
            </Card>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Example phrases */}
      {!transcript && jobs.length === 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
            {lang === 'en' ? 'Try saying:' : 'Prova att säga:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {(lang === 'en'
              ? [
                  'Software developer in Stockholm',
                  'Nurse jobs',
                  'Part-time warehouse work',
                  'Remote customer service',
                ]
              : [
                  'Systemutvecklare i Stockholm',
                  'Sjuksköterska jobb',
                  'Deltid lager',
                  'Distans kundtjänst',
                ]
            ).map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  setTranscript(phrase);
                  performSearch();
                }}
                className="px-3 py-1.5 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full text-sm hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Results */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {lang === 'en'
                ? `${jobs.length} jobs found for "${transcript}"`
                : `${jobs.length} jobb hittade för "${transcript}"`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTranscript('');
                setJobs([]);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {lang === 'en' ? 'New search' : 'Ny sökning'}
            </Button>
          </div>

          {jobs.map((job) => (
            <Card
              key={job.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => readJob(job)}
              tabIndex={0}
              role="button"
              aria-label={`${job.headline}. ${
                lang === 'en' ? 'Click to hear details' : 'Klicka för att höra detaljer'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-1">
                    {job.headline}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2 mt-1">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{job.employer?.name}</span>
                  </p>
                  {job.workplace_address?.municipality && (
                    <p className="text-sm text-stone-500 dark:text-stone-500 flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {job.workplace_address.municipality}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    readJob(job);
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isSpeaking
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400'
                  )}
                  aria-label={lang === 'en' ? 'Read aloud' : 'Läs upp'}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Accessibility note */}
      <Card className="p-4 bg-stone-50 dark:bg-stone-800/50">
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
          {lang === 'en'
            ? '♿ This feature is designed to be accessible for users with visual impairments or dyslexia. Jobs can be read aloud by clicking on them.'
            : '♿ Denna funktion är anpassad för användare med synnedsättning eller dyslexi. Jobb kan läsas upp genom att klicka på dem.'}
        </p>
      </Card>
    </div>
  );
}

export default VoiceSearch;
