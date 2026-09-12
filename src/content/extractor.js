/**
 * Media Extraction & Ownership Logic for Facebook Posts
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { SELECTORS } from '../shared/constants.js';
import { normalizeUrl, debugLog, sanitizeFilename } from '../shared/utils.js';

/**
 * Extract all eligible image attachments belonging exclusively to postElement
 */
export function extractPostImages(postElement) {
  if (!postElement || !(postElement instanceof Element)) {
    return [];
  }

  debugLog('Extracting images from post:', postElement);

  // Find all candidate photo anchors inside post
  const photoAnchors = postElement.querySelectorAll(SELECTORS.PHOTO_ANCHORS);
  const candidates = [];
  const seenFbid = new Set();
  const seenUrls = new Set();

  photoAnchors.forEach((anchor, index) => {
    // Skip if inside decoy honeypot layer
    if (anchor.closest(`[${SELECTORS.HONEYPOT_ATTR}]`)) {
      return;
    }

    const href = anchor.getAttribute('href') || '';
    const fbidMatch = href.match(/fbid=([0-9]+)/i);
    const fbid = fbidMatch ? fbidMatch[1] : null;

    // Check for Facebook index tracking parameter __tn__=*b0, *b1, etc.
    const tnMatch = href.match(/__tn__=\*b([0-9]+)/i);
    const gridIndex = tnMatch ? parseInt(tnMatch[1], 10) : index;

    // Find <img> tags inside this anchor
    const imgEls = anchor.querySelectorAll(SELECTORS.GENERAL_IMG);
    imgEls.forEach((img) => {
      const rawSrc = img.currentSrc || img.getAttribute('src') || '';
      const normalizedSrc = normalizeUrl(rawSrc);

      // Validate eligibility
      if (!isEligiblePostImage(img, normalizedSrc)) {
        return;
      }

      // Deduplicate by fbid or URL
      if (fbid && seenFbid.has(fbid)) return;
      if (seenUrls.has(normalizedSrc)) return;

      if (fbid) seenFbid.add(fbid);
      seenUrls.add(normalizedSrc);

      // Derive high-resolution URL candidate
      const highResUrl = deriveHighResUrl(normalizedSrc);

      candidates.push({
        index: gridIndex,
        fbid: fbid,
        originalUrl: normalizedSrc,
        highResUrl: highResUrl,
        alt: img.getAttribute('alt') || '',
        width: img.naturalWidth || parseInt(img.getAttribute('width'), 10) || null,
        height: img.naturalHeight || parseInt(img.getAttribute('height'), 10) || null
      });
    });
  });

  // If no photo anchors were found (e.g. some unique post layout), check for feedImage
  if (candidates.length === 0) {
    const feedImgs = postElement.querySelectorAll(SELECTORS.FEED_IMAGE);
    feedImgs.forEach((img, idx) => {
      if (img.closest(`[${SELECTORS.HONEYPOT_ATTR}]`)) return;

      const rawSrc = img.currentSrc || img.getAttribute('src') || '';
      const normalizedSrc = normalizeUrl(rawSrc);

      if (isEligiblePostImage(img, normalizedSrc) && !seenUrls.has(normalizedSrc)) {
        seenUrls.add(normalizedSrc);
        candidates.push({
          index: idx,
          fbid: null,
          originalUrl: normalizedSrc,
          highResUrl: deriveHighResUrl(normalizedSrc),
          alt: img.getAttribute('alt') || '',
          width: img.naturalWidth || parseInt(img.getAttribute('width'), 10) || null,
          height: img.naturalHeight || parseInt(img.getAttribute('height'), 10) || null
        });
      }
    });
  }

  // Sort candidates by gridIndex to maintain natural photo order
  candidates.sort((a, b) => a.index - b.index);

  debugLog(`Extraction complete. Found ${candidates.length} eligible images.`);
  return candidates;
}

/**
 * Strict image eligibility check:
 * Excludes avatars, emojis, inline icons, and non-CDN media
 */
export function isEligiblePostImage(imgElement, srcUrl) {
  if (!srcUrl || !srcUrl.startsWith('http')) return false;

  // Must be from Facebook CDN
  if (!srcUrl.includes('fbcdn.net')) return false;

  // Exclude Facebook emojis
  if (srcUrl.includes('emoji.php')) return false;

  // Exclude data URIs
  if (srcUrl.startsWith('data:')) return false;

  // Check dimensions: emojis and icons are typically <= 32px
  const w = imgElement.naturalWidth || parseInt(imgElement.getAttribute('width'), 10) || 0;
  const h = imgElement.naturalHeight || parseInt(imgElement.getAttribute('height'), 10) || 0;
  if ((w > 0 && w <= 32) && (h > 0 && h <= 32)) {
    return false;
  }

  return true;
}

/**
 * Derive high-resolution image URL from Facebook CDN query string
 * Strips feed thumbnail clamp (&ctp=s...) while preserving cryptographic signature (oh)
 */
export function deriveHighResUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // Check if URL has ctp parameter (client thumbnail preview clamp)
  if (url.includes('&ctp=s') || url.includes('?ctp=s')) {
    // Remove the &ctp=s... or ?ctp=s... parameter
    const highRes = url
      .replace(/&ctp=s[0-9x]+/gi, '')
      .replace(/\?ctp=s[0-9x]+&/gi, '?')
      .replace(/\?ctp=s[0-9x]+/gi, '');
    return highRes;
  }

  return url;
}

/**
 * Extract author name from post for descriptive naming
 */
export function extractAuthorName(postElement) {
  if (!postElement) return 'facebook';

  const profileEl = postElement.querySelector(SELECTORS.PROFILE_NAME);
  if (profileEl) {
    const text = profileEl.textContent.trim();
    if (text) return sanitizeFilename(text);
  }

  // Fallback to h4 link
  const h4Anchor = postElement.querySelector('h4 a');
  if (h4Anchor) {
    const text = h4Anchor.textContent.trim();
    if (text) return sanitizeFilename(text);
  }

  return 'facebook';
}
