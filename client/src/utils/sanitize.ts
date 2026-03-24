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

export default {
  sanitizeHTML,
  sanitizeHTMLWithLineBreaks,
  stripHTML,
  containsDangerousHTML,
};
