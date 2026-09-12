/**
 * Image Retrieval & Binary Blob Processing
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { detectExtension, debugLog } from '../shared/utils.js';

/**
 * Fetch a single image with automatic high-res fallback
 */
export async function fetchImageBlob(imageItem) {
  const urlsToTry = [];
  if (imageItem.highResUrl && imageItem.highResUrl !== imageItem.originalUrl) {
    urlsToTry.push(imageItem.highResUrl);
  }
  urlsToTry.push(imageItem.originalUrl);

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      debugLog('Fetching image candidate:', url.slice(0, 100));
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const mimeType = response.headers.get('content-type') || blob.type || 'image/jpeg';
        const extension = detectExtension(url, mimeType);

        debugLog(`Successfully retrieved image blob (${blob.size} bytes, ${mimeType})`);
        return {
          success: true,
          index: imageItem.index,
          blob: blob,
          mimeType: mimeType,
          extension: extension,
          size: blob.size,
          url: url
        };
      } else {
        lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
        debugLog(`URL attempt failed: ${lastError.message}`);
      }
    } catch (err) {
      lastError = err;
      debugLog(`Fetch error: ${err.message}`);
    }
  }

  // If all attempts failed
  return {
    success: false,
    index: imageItem.index,
    error: lastError ? lastError.message : 'Unknown fetch error',
    url: imageItem.originalUrl
  };
}

/**
 * Fetch an array of images sequentially/in parallel with progress tracking
 */
export async function fetchAllImages(imageItems, onProgress = () => {}) {
  const results = [];
  let completed = 0;
  const total = imageItems.length;

  for (let i = 0; i < total; i++) {
    const item = imageItems[i];
    const res = await fetchImageBlob(item);
    results.push(res);
    completed++;
    onProgress(completed, total, res);
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    successful,
    failed,
    total
  };
}
