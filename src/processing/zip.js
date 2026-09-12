/**
 * Local ZIP Archive Generator using bundled JSZip
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { debugLog } from '../shared/utils.js';

/**
 * Generate a ZIP archive blob containing all downloaded image files
 * @param {Array} images - Array of fetched image items { index, blob, extension }
 * @param {string} baseName - Base name for the files (e.g. "khalid_al_ameri")
 * @returns {Promise<Blob>} The generated ZIP archive Blob
 */
export async function createZipArchive(images, baseName = 'facebook-images') {
  const JSZip = window.JSZip;
  if (!JSZip) {
    throw new Error('JSZip library is not loaded.');
  }

  debugLog(`Creating ZIP archive for ${images.length} images...`);
  const zip = new JSZip();

  images.forEach((img, idx) => {
    const paddedIndex = String(idx + 1).padStart(2, '0');
    const ext = img.extension || 'jpg';
    const filename = `${baseName}-${paddedIndex}.${ext}`;
    zip.file(filename, img.blob);
  });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });

  debugLog(`ZIP archive created successfully. Size: ${zipBlob.size} bytes.`);
  return zipBlob;
}
