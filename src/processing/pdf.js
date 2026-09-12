/**
 * Local PDF Document Generator using bundled jsPDF
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { debugLog } from '../shared/utils.js';

/**
 * Generate a PDF blob containing all images, one per page, matching individual aspect ratios
 * @param {Array} images - Array of fetched image items { index, blob, extension, mimeType }
 * @returns {Promise<Blob>} The generated PDF Blob
 */
export async function createPdfDocument(images) {
  const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
  if (!jsPDF) {
    throw new Error('jsPDF library is not loaded.');
  }

  debugLog(`Creating PDF document for ${images.length} images...`);

  let doc = null;

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const { width, height, dataUrl } = await readImageData(item.blob);

    const orientation = width >= height ? 'l' : 'p';

    if (i === 0) {
      // First page
      doc = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [width, height],
        hotfixes: ['px_scaling']
      });
      doc.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    } else {
      // Subsequent pages with dynamic dimension
      doc.addPage([width, height], orientation);
      doc.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    }
  }

  if (!doc) {
    throw new Error('No images available to generate PDF.');
  }

  const pdfBlob = doc.output('blob');
  debugLog(`PDF document created successfully. Size: ${pdfBlob.size} bytes.`);
  return pdfBlob;
}

/**
 * Read image dimensions and base64 data URL from a Blob
 */
function readImageData(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
          dataUrl: dataUrl
        });
      };
      img.onerror = () => reject(new Error('Failed to load image into memory for PDF generation.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image blob.'));
    reader.readAsDataURL(blob);
  });
}
