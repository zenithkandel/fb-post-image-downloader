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
  if (!postElement || typeof postElement.querySelectorAll !== 'function') {
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

  // Find the primary author link inside profile_name or h4
  const authorAnchor =
    postElement.querySelector(`${SELECTORS.PROFILE_NAME} a`) ||
    postElement.querySelector('h4 a');

  if (authorAnchor) {
    const text = authorAnchor.textContent.trim();
    if (text) return sanitizeFilename(text);
  }

  // Fallback to profile container text
  const profileEl = postElement.querySelector(SELECTORS.PROFILE_NAME);
  if (profileEl) {
    const text = profileEl.textContent.trim();
    if (text) return sanitizeFilename(text);
  }

  return 'facebook';
}

/**
 * Detect if post has a "+N" remaining photos indicator or "remaining items" aria-label
 * Returns metadata needed to traverse the media set, or null if all photos are visible.
 */
export function detectRemainingPhotosInfo(postElement) {
  if (!postElement || typeof postElement.querySelectorAll !== 'function') {
    return null;
  }

  const photoAnchors = Array.from(
    postElement.querySelectorAll('a[href*="/photo/"], a[href*="/photo.php"], a[href*="/photos/"]')
  );
  if (photoAnchors.length === 0) return null;

  for (const anchor of photoAnchors) {
    if (anchor.closest(`[${SELECTORS.HONEYPOT_ATTR}]`)) {
      continue;
    }

    // Check text for +N badge (e.g. "+4")
    const textContent = anchor.textContent || '';
    const badgeMatch = textContent.match(/\+(\d+)/);

    // Check aria-label for "N remaining items" or "+N"
    const ariaLabel = anchor.getAttribute('aria-label') || '';
    const ariaMatch = ariaLabel.match(/(\d+)\s+remaining\s+items/i);

    const remainingCount = badgeMatch
      ? parseInt(badgeMatch[1], 10)
      : (ariaMatch ? parseInt(ariaMatch[1], 10) : null);

    if (remainingCount && remainingCount > 0) {
      const href = anchor.getAttribute('href') || '';
      const fbidMatch = href.match(/fbid=([0-9]+)/i);
      const setMatch = href.match(/[?&]set=([^&]+)/i);

      if (fbidMatch && setMatch) {
        // Find the first fbid in this post for circular loop detection
        let firstFbid = null;
        for (const firstAnchor of photoAnchors) {
          const firstHref = firstAnchor.getAttribute('href') || '';
          const m = firstHref.match(/fbid=([0-9]+)/i);
          if (m) {
            firstFbid = m[1];
            break;
          }
        }

        return {
          remainingCount,
          lastFbid: fbidMatch[1],
          setId: decodeURIComponent(setMatch[1]),
          firstFbid,
          anchor
        };
      }
    }
  }

  return null;
}

/**
 * Extract high-resolution image URL from a Facebook Comet photo viewer HTML response
 */
export function extractImageFromPhotoHtml(html, fbid) {
  if (!html || typeof html !== 'string') return null;

  const unescaped = html.replace(/\\\//g, '/');

  // Priority 1: Direct "image":{"uri":"..."} object
  const imgObjMatch = unescaped.match(/"image":\{"uri":"(https:\/\/[^"]+fbcdn\.net[^"]+)"/);
  if (imgObjMatch) {
    return imgObjMatch[1];
  }

  // Priority 2: prefetch_uris_v2 with t39.30808-6 or fbcdn.net
  const prefetchMatch = unescaped.match(/"uri":"(https:\/\/[^"]+fbcdn\.net\/v\/t39\.30808-6\/[^"]+)"/);
  if (prefetchMatch) {
    return prefetchMatch[1];
  }

  // Priority 3: High-res t39.30808-6 URL containing the specific fbid
  if (fbid) {
    const fbidRegex = new RegExp(`https:\/\/[a-z0-9.-]+\\.fbcdn\\.net\/v\/t39\\.30808-6\/[^"'\\s]*${fbid}[^"'\\s]*`);
    const fbidMatch = unescaped.match(fbidRegex);
    if (fbidMatch) {
      return fbidMatch[0];
    }
  }

  // Priority 4: General t39.30808-6 jpg image
  const generalMatch = unescaped.match(/https:\/\/[a-z0-9.-]+\.fbcdn\.net\/v\/t39\.30808-6\/[a-zA-Z0-9_.-]+\.jpg[^"'\\\s]*/);
  if (generalMatch) {
    return generalMatch[0];
  }

  return null;
}

/**
 * Extract nextMediaAfterNodeId from a Facebook Comet photo viewer HTML response
 */
export function extractNextFbidFromPhotoHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const nextMatch = html.match(/"nextMediaAfterNodeId":\{"__typename":"Photo","id":"(\d+)"/);
  return nextMatch ? nextMatch[1] : null;
}

/**
 * Sequentially traverse Facebook Comet media set to discover photos missing from feed DOM
 */
export async function fetchRemainingSetPhotos(
  { lastFbid, setId, remainingCount = 0, firstFbid = null, maxItems = 50, startIndex = 5 },
  onProgress = null,
  signal = null
) {
  if (!lastFbid || !setId) return [];

  const discovered = [];
  const visitedFbids = new Set();
  if (firstFbid) visitedFbids.add(firstFbid);
  visitedFbids.add(lastFbid);

  let currentFbid = lastFbid;
  let currentIndex = startIndex;
  let isFirstStep = true;

  debugLog(`Starting media set traversal: lastFbid=${lastFbid}, setId=${setId}, remaining=${remainingCount}`);

  while (discovered.length < maxItems) {
    if (signal && signal.aborted) {
      debugLog('Media set traversal aborted by signal.');
      break;
    }

    const url = `https://www.facebook.com/photo/?fbid=${currentFbid}&set=${encodeURIComponent(setId)}`;
    let html = '';

    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: signal || undefined
      });

      if (!res.ok) {
        debugLog(`Fetch returned HTTP ${res.status} for fbid ${currentFbid}`);
        break;
      }

      html = await res.text();
    } catch (err) {
      if (err.name === 'AbortError') {
        debugLog('Media set traversal fetch aborted.');
        break;
      }
      debugLog(`Error fetching photo page for fbid ${currentFbid}:`, err);
      break;
    }

    const nextFbid = extractNextFbidFromPhotoHtml(html);

    // For photos beyond the initial visible ones, extract high-res image
    if (!isFirstStep) {
      const rawImgUrl = extractImageFromPhotoHtml(html, currentFbid);
      if (rawImgUrl) {
        const highResUrl = deriveHighResUrl(rawImgUrl);
        discovered.push({
          index: currentIndex++,
          fbid: currentFbid,
          originalUrl: rawImgUrl,
          highResUrl: highResUrl,
          alt: '',
          width: null,
          height: null,
          fromMediaSet: true
        });

        if (typeof onProgress === 'function') {
          onProgress(discovered.length, remainingCount);
        }
      }
    }

    isFirstStep = false;

    // Halt when set completes, loops back, or no next photo
    if (!nextFbid || visitedFbids.has(nextFbid)) {
      debugLog(`Media set traversal finished at nextFbid: ${nextFbid}`);
      break;
    }

    visitedFbids.add(nextFbid);
    currentFbid = nextFbid;
  }

  debugLog(`Discovered ${discovered.length} additional photos from media set.`);
  return discovered;
}
