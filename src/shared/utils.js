/**
 * Utility functions for Facebook Post Image Downloader
 */

import { EXTENSION_CONFIG } from './constants.js';

/**
 * Log messages only if debug mode is active
 */
export function debugLog(...args) {
  if (typeof window !== 'undefined' && window[EXTENSION_CONFIG.DEBUG_FLAG]) {
    console.log('[FB Image Downloader]', ...args);
  }
}

/**
 * Sanitize strings for safe cross-platform file and directory names
 */
export function sanitizeFilename(str, fallback = 'facebook-image') {
  if (!str || typeof str !== 'string') return fallback;
  // Strip illegal Windows & POSIX characters: / \ : * ? " < > | and control chars
  const sanitized = str
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100);
  return sanitized.length > 0 ? sanitized : fallback;
}

/**
 * Generate formatted timestamp string: YYYY-MM-DD-HHmm
 */
export function getFormattedDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  return `${year}-${month}-${day}-${hours}${mins}`;
}

/**
 * Normalize and unescape Facebook image URLs
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/&amp;/g, '&').trim();
}

/**
 * Detect file extension from URL and MIME type
 */
export function detectExtension(url, mimeType = '') {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';

  // Fallback to URL inspection
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.endsWith('.png')) return 'png';
    if (pathname.endsWith('.webp')) return 'webp';
    if (pathname.endsWith('.gif')) return 'gif';
  } catch (e) {
    // Ignore URL parse error
  }

  return 'jpg'; // Default safe image extension
}

/**
 * Debounce helper for event listeners & MutationObservers
 */
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Sleep / delay helper
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
