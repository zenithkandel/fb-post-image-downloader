/**
 * Verification of ZIP and PDF processing libraries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requireScratch = createRequire('C:\\Users\\zenith\\.gemini\\antigravity-ide\\brain\\5a32aca8-27a3-4968-88d2-a4d4e0a16974\\scratch\\package.json');
const JSZip = requireScratch('jszip');
const { jsPDF } = requireScratch('jspdf');

console.log('Testing JSZip packaging...');
const zip = new JSZip();
zip.file('image-01.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])); // Minimal JPEG magic bytes
zip.file('image-02.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]));

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
console.log('  ✓ Generated ZIP buffer:', zipBuffer.length, 'bytes');

// Verify ZIP signature: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
if (zipBuffer[0] === 0x50 && zipBuffer[1] === 0x4B && zipBuffer[2] === 0x03 && zipBuffer[3] === 0x04) {
  console.log('  ✓ Valid ZIP PK magic bytes verified!');
} else {
  throw new Error('Invalid ZIP magic bytes');
}

console.log('\nTesting jsPDF document creation...');
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'px',
  format: [800, 600]
});
doc.text('Facebook Post Image Downloader Test', 20, 20);
doc.addPage([600, 800], 'portrait');
doc.text('Page 2 Portrait', 20, 20);

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
console.log('  ✓ Generated PDF buffer:', pdfBuffer.length, 'bytes');

// Verify PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
if (pdfBuffer.slice(0, 4).toString('ascii') === '%PDF') {
  console.log('  ✓ Valid %PDF magic bytes verified!');
} else {
  throw new Error('Invalid PDF magic bytes');
}

console.log('\nAll processing pipeline tests passed successfully!');
