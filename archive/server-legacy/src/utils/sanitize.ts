import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

// Konfiguration för DOMPurify - tillåt endast säkra taggar
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [], // Inga attribut tillåtna
  KEEP_CONTENT: true,
};

/**
 * Sanerar en sträng från potentiellt skadlig HTML/JS
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, purifyConfig);
}

/**
 * Sanerar alla sträng-egenskaper i ett objekt rekursivt
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Maxlängder för olika fält
export const MAX_LENGTHS = {
  title: 100,
  email: 100,
  phone: 50,
  location: 100,
  summary: 2000,
  company: 100,
  position: 100,
  description: 1000,
  school: 100,
  degree: 100,
  skill: 50,
  language: 50,
  name: 100,
} as const;

/**
 * Validerar och begränsar längden på en sträng
 */
export function validateLength(input: string | null | undefined, maxLength: number, fieldName: string): string {
  if (!input) return '';
  if (input.length > maxLength) {
    throw new Error(`${fieldName} får inte vara längre än ${maxLength} tecken`);
  }
  return input;
}
