/**
 * Main Content Script Coordinator for Facebook Post Image Downloader
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { EXTENSION_CONFIG, FORMATS, MESSAGE_TYPES } from '../shared/constants.js';
import { debugLog, getFormattedDate } from '../shared/utils.js';
import { initPostObserver, findHeaderActionSlot } from './detector.js';
import { extractPostImages, extractAuthorName } from './extractor.js';
import { createDownloadButton, showFormatModal, showToast } from './ui.js';
import { fetchAllImages } from '../processing/fetcher.js';
import { createZipArchive } from '../processing/zip.js';
import { createPdfDocument } from '../processing/pdf.js';

/**
 * Handle "Download images" click on a specific post
 */
async function handleDownloadClick(postElement) {
  debugLog('Download action triggered for post:', postElement);

  // Extract images strictly belonging to this post
  const images = extractPostImages(postElement);

  if (!images || images.length === 0) {
    showToast('No downloadable images found in this post.');
    return;
  }

  const authorName = extractAuthorName(postElement);
  const timestamp = getFormattedDate();
  const baseFilename = `${authorName}-${timestamp}`;

  // Show format choice modal (ZIP or PDF)
  let modalControls = null;
  modalControls = showFormatModal({
    imageCount: images.length,
    onSelectFormat: async (format) => {
      try {
        debugLog(`Format selected: ${format}. Commencing image retrieval...`);

        // Fetch all images locally
        const fetchResults = await fetchAllImages(images, (completed, total) => {
          modalControls.updateProgress(
            completed,
            total,
            `Downloading image ${completed} of ${total}...`
          );
        });

        if (fetchResults.successful.length === 0) {
          modalControls.close();
          showToast('Failed to retrieve images from Facebook CDN.');
          return;
        }

        let outputBlob = null;
        let finalFilename = '';

        if (format === FORMATS.ZIP) {
          modalControls.updateProgress(
            fetchResults.total,
            fetchResults.total,
            'Creating local ZIP archive...'
          );
          outputBlob = await createZipArchive(fetchResults.successful, baseFilename);
          finalFilename = `${baseFilename}.zip`;
        } else if (format === FORMATS.PDF) {
          modalControls.updateProgress(
            fetchResults.total,
            fetchResults.total,
            'Composing local PDF document...'
          );
          outputBlob = await createPdfDocument(fetchResults.successful);
          finalFilename = `${baseFilename}.pdf`;
        }

        // Trigger local browser download
        if (outputBlob && finalFilename) {
          downloadBlobLocally(outputBlob, finalFilename);
          modalControls.updateProgress(fetchResults.total, fetchResults.total, 'Download ready!');
          setTimeout(() => {
            modalControls.close();
            if (fetchResults.failed.length > 0) {
              showToast(
                `Downloaded ${fetchResults.successful.length} images (${fetchResults.failed.length} failed).`
              );
            } else {
              showToast(`Downloaded ${fetchResults.successful.length} images successfully!`);
            }
          }, 800);
        }
      } catch (err) {
        debugLog('Processing error:', err);
        modalControls.close();
        showToast(`Download failed: ${err.message || 'An error occurred.'}`);
      }
    },
    onCancel: () => {
      debugLog('Download cancelled by user.');
    }
  });
}

/**
 * Trigger local browser file download from Blob without external servers
 */
function downloadBlobLocally(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);

  // Send message to background script for native download, with fallback to anchor click
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage(
      {
        type: MESSAGE_TYPES.DOWNLOAD_FILE,
        blobUrl: blobUrl,
        filename: filename
      },
      (response) => {
        // Revoke after background processes or on fallback
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
    );
  } else {
    // Standard client fallback
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }
}

/**
 * Process a detected post and inject download button
 */
function onPostDetected(postElement) {
  if (!postElement || postElement.hasAttribute(EXTENSION_CONFIG.PROCESSED_ATTR)) {
    return;
  }

  // Prevent duplicate injections
  if (postElement.querySelector(`.${EXTENSION_CONFIG.BUTTON_CLASS}`)) {
    postElement.setAttribute(EXTENSION_CONFIG.PROCESSED_ATTR, 'true');
    return;
  }

  const slot = findHeaderActionSlot(postElement);
  if (!slot) {
    return;
  }

  const btn = createDownloadButton(() => handleDownloadClick(postElement));

  // Insert next to the three-dot button
  slot.parentElement.insertBefore(btn, slot);
  postElement.setAttribute(EXTENSION_CONFIG.PROCESSED_ATTR, 'true');
  debugLog('Injected download action button into post.');
}

/**
 * Initialize extension when DOM is ready
 */
function init() {
  debugLog('Facebook Post Image Downloader content script starting...');
  initPostObserver(onPostDetected);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
