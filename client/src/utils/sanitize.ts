/**
 * HTML Sanitization utilities using DOMPurify
 * Protects against XSS attacks when rendering external HTML content
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify with safe defaults
const SAFE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'span', 'div',
    'a'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // Allow target attribute
  ADD_TAGS: [], // No additional tags
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

// Hook to add rel="noopener noreferrer" to external links
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    // Add security attributes to external links
    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    // Remove javascript: and data: URLs
    if (href.startsWith('javascript:') || href.startsWith('data:')) {
      node.removeAttribute('href');
    }
  }
});

/**
 * Sanitize HTML content for safe rendering
 * Use this with dangerouslySetInnerHTML
 */
export function sanitizeHTML(html: string | undefined | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, SAFE_CONFIG);
}

/**
 * Sanitize HTML and convert newlines to <br> tags
 * Useful for job descriptions and similar content
 */
export function sanitizeHTMLWithLineBreaks(html: string | undefined | null): string {
  if (!html) return '';
  // First sanitize, then convert newlines
  const sanitized = DOMPurify.sanitize(html, SAFE_CONFIG);
  return sanitized.replace(/\n/g, '<br/>');
}

/**
 * Strip all HTML tags and return plain text
 * Useful for previews and excerpts
 */
export function stripHTML(html: string | undefined | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Check if content contains potentially dangerous HTML
 */
export function containsDangerousHTML(html: string): boolean {
  const dangerous = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  return dangerous.some(pattern => pattern.test(html));
}

/**
 * Allowlist of URL schemes considered safe to render as a navigable
 * attribute (href, src). Everything else - javascript:, data:, vbscript:,
 * file:, and any unrecognised scheme - is rejected.
 */
const SAFE_URL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * Remove ASCII control characters (0x00-0x1F and 0x7F) from a string,
 * including tab/newline/CR/NUL. Written as an explicit char-code loop
 * rather than a regex with \u/\x escapes so the control characters
 * themselves never need to appear literally in source.
 */
function stripControlChars(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const isControl = code < 32 || code === 127;
    if (!isControl) {
      out += input[i];
    }
  }
  return out;
}

/**
 * Decode the handful of HTML-entity forms that can be used to obfuscate a
 * dangerous URL scheme past a naive `startsWith('javascript:')` check, e.g.
 * `&#106;avascript:alert(1)` or `&#x6A;avascript:alert(1)`. Only used for the
 * safety *check* - the original (control-character-stripped) string is what
 * actually gets rendered, so innocuous literal text isn't mangled.
 */
function decodeEntitiesForUrlCheck(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/gi, '&');
}

/**
 * Validate a URL before using it as an href/src. Returns the sanitized URL
 * (control characters stripped, trimmed) if it's safe to render, or null if
 * it should be rejected.
 *
 * A35 (docs/ROADMAP.md spar A, docs/review-2026-08-09/sakerhet-gdpr.md):
 * MarkdownRenderer.tsx parses AI-generated markdown with its own inline
 * parser and builds `<a href={...}>` directly in JSX - a path that never
 * touches DOMPurify (DOMPurify only guards dangerouslySetInnerHTML call
 * sites via sanitizeHTML() above). React does not sanitize href against
 * javascript: URLs, so a prompt-injected or model-produced
 * `[text](javascript:alert(1))` executes on click. Use this for any href/src
 * built from untrusted (including AI-generated) text outside DOMPurify's
 * reach.
 *
 * Rejects: javascript:, data:, vbscript:, and any other scheme not in the
 * allowlist - including obfuscated variants using embedded control
 * characters (a tab or newline spliced into the middle of "javascript:" -
 * browsers strip these anywhere in a URL before parsing the scheme, so
 * they're exactly as dangerous as the unobfuscated form) or HTML-entity-
 * encoded characters (`&#106;avascript:`).
 *
 * Allows: http:, https:, mailto:, tel:, and scheme-less URLs (relative
 * paths, #anchors, //protocol-relative - none of these can execute script).
 */
export function sanitizeHref(rawUrl: string | undefined | null): string | null {
  if (!rawUrl) return null;

  const stripped = stripControlChars(rawUrl).trim();
  if (!stripped) return null;

  const decoded = decodeEntitiesForUrlCheck(stripped);
  const schemeMatch = decoded.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);

  if (!schemeMatch) {
    // No scheme - relative/anchor/protocol-relative link. Cannot execute
    // script on its own.
    return stripped;
  }

  const scheme = schemeMatch[1].toLowerCase();
  return SAFE_URL_SCHEMES.has(scheme) ? stripped : null;
}

export default {
  sanitizeHTML,
  sanitizeHTMLWithLineBreaks,
  stripHTML,
  containsDangerousHTML,
  sanitizeHref,
};
