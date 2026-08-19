/**
 * Global type declarations
 */

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

/**
 * Felhändelsen från Web Speech API.
 *
 * Deklarationen saknades, så `onerror` var typad som ett vanligt `Event` och
 * `error`-koden gick inte att läsa utan en cast. Följden i
 * InterviewSimulator: `onerror = () => { ... }` tog inte ens emot
 * event-objektet, och en nekad mikrofon blev helt tyst — knappen slog om
 * tillbaka och ingenting hände. Den som inte förstår varför slutar försöka.
 *
 * Koderna är de i specen; `not-allowed` och `service-not-allowed` är de två
 * som betyder "webbläsaren släppte inte fram mikrofonen".
 */
interface SpeechRecognitionErrorEvent extends Event {
  error:
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported'
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onnomatch: ((this: SpeechRecognition, ev: Event) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  abort(): void
  start(): void
  stop(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
  prototype: SpeechRecognition
}

interface Window {
  SpeechRecognition: SpeechRecognitionConstructor
  webkitSpeechRecognition: SpeechRecognitionConstructor
}
