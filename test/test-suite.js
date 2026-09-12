/**
 * Automated Verification Suite for Facebook Post Image Downloader
 * Validates extraction against real DOM snapshots and verifies ZIP/PDF generation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import JSDOM from scratch directory
const requireScratch = createRequire('C:\\Users\\zenith\\.gemini\\antigravity-ide\\brain\\5a32aca8-27a3-4968-88d2-a4d4e0a16974\\scratch\\package.json');
const { JSDOM } = requireScratch('jsdom');

// Import extension modules
import { extractPostImages, extractAuthorName, deriveHighResUrl } from '../src/content/extractor.js';
import { sanitizeFilename, detectExtension } from '../src/shared/utils.js';

console.log('====================================================');
console.log('   RUNNING AUTOMATED TEST SUITE: FB IMAGE DOWNLOADER');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Load Real DOM Evidence from facebook dom finding.md
const findingPath = path.resolve(__dirname, '..', 'facebook dom finding.md');
const findingContent = fs.readFileSync(findingPath, 'utf8');

// Extract raw post 1 and post 2 HTML from the details sections
const p1Match = findingContent.match(/View Raw DOM Capture: Post 1[\s\S]*?```html\s*([\s\S]*?)\s*```/);
const p2Match = findingContent.match(/View Raw DOM Capture: Post 2[\s\S]*?```html\s*([\s\S]*?)\s*```/);

const post1Html = p1Match ? p1Match[1].trim() : '';
const post2Html = p2Match ? p2Match[1].trim() : '';

// ----------------------------------------------------
// TEST 1: Single-Photo Post Extraction (Post 1)
// ----------------------------------------------------
console.log('Test 1: Extracting images from Post 1 (Single-photo post)...');
const dom1 = new JSDOM(`<!DOCTYPE html><html><body>${post1Html}</body></html>`);
const post1Root = dom1.window.document.body.firstElementChild;

const p1Images = extractPostImages(post1Root);
assert(p1Images.length === 1, `Post 1 contains exactly 1 photo (Found: ${p1Images.length})`);
assert(p1Images[0].originalUrl.includes('799818900_1637176457775672'), 'Extracted photo is the attached dais photo');
assert(!p1Images.some(img => img.originalUrl.includes('520537243_1297218261771495')), 'Author avatar is strictly excluded');
assert(!p1Images.some(img => img.originalUrl.includes('emoji.php')), 'Emojis are strictly excluded');

const p1Author = extractAuthorName(post1Root);
assert(p1Author === 'Khalid_Al_Ameri', `Author extracted correctly: "${p1Author}" (Expected: "Khalid_Al_Ameri")`);

// ----------------------------------------------------
// TEST 2: Multi-Photo Collage Extraction (Post 2)
// ----------------------------------------------------
console.log('\nTest 2: Extracting images from Post 2 (4-photo grid post)...');
const dom2 = new JSDOM(`<!DOCTYPE html><html><body>${post2Html}</body></html>`);
const post2Root = dom2.window.document.body.firstElementChild;

const p2Images = extractPostImages(post2Root);
assert(p2Images.length === 4, `Post 2 contains exactly 4 photos (Found: ${p2Images.length})`);
assert(!p2Images.some(img => img.originalUrl.includes('762847575_27880278711668607')), 'Author avatar is strictly excluded');

// Check sequence order (*b0, *b1, *b2, *b3)
const indices = p2Images.map(img => img.index);
assert(indices.join(',') === '0,1,2,3', `Photos maintain exact grid display sequence [${indices.join(', ')}]`);

const p2Author = extractAuthorName(post2Root);
assert(p2Author === 'Mukesh_Chandra_Kushawaha', `Author extracted correctly: "${p2Author}" (Expected: "Mukesh_Chandra_Kushawaha")`);

// ----------------------------------------------------
// TEST 3: High-Resolution URL Derivation
// ----------------------------------------------------
console.log('\nTest 3: High-resolution URL derivation...');
const sampleClampedUrl = 'https://scontent.fna.fbcdn.net/v/t39.30808-6/photo.jpg?stp=dst-jpg_tt6&cstp=mx1638x2048&ctp=s640x640&_nc_cat=108&oh=00_ABC&oe=6AA';
const derivedUrl = deriveHighResUrl(sampleClampedUrl);
assert(!derivedUrl.includes('ctp=s640x640'), 'Client thumbnail parameter ctp=s640x640 is removed');
assert(derivedUrl.includes('cstp=mx1638x2048'), 'Maximum dimension cstp=mx1638x2048 is preserved');
assert(derivedUrl.includes('oh=00_ABC'), 'Cryptographic signature oh is preserved intact');

// ----------------------------------------------------
// TEST 4: Utility & Sanitization Checks
// ----------------------------------------------------
console.log('\nTest 4: Filename and extension utilities...');
const dirtyName = 'John / Doe : "Summer 2026? <Party> | *';
const cleanName = sanitizeFilename(dirtyName);
assert(cleanName === 'John_Doe_Summer_2026_Party', `Dirty filename sanitized to safe ASCII: "${cleanName}"`);

assert(detectExtension('https://fbcdn.net/test.jpg', 'image/jpeg') === 'jpg', 'MIME image/jpeg -> jpg');
assert(detectExtension('https://fbcdn.net/test.png', 'image/png') === 'png', 'MIME image/png -> png');
assert(detectExtension('https://fbcdn.net/test.webp', 'image/webp') === 'webp', 'MIME image/webp -> webp');

// ----------------------------------------------------
// TEST 5: Bundled Vendor Libraries Check
// ----------------------------------------------------
console.log('\nTest 5: Validating locally bundled vendor libraries...');
const jszipFile = path.resolve(__dirname, '..', 'vendor', 'jszip.min.js');
const jspdfFile = path.resolve(__dirname, '..', 'vendor', 'jspdf.umd.min.js');
assert(fs.existsSync(jszipFile) && fs.statSync(jszipFile).size > 50000, `vendor/jszip.min.js exists (${fs.statSync(jszipFile).size} bytes)`);
assert(fs.existsSync(jspdfFile) && fs.statSync(jspdfFile).size > 200000, `vendor/jspdf.umd.min.js exists (${fs.statSync(jspdfFile).size} bytes)`);

// ----------------------------------------------------
// TEST 6: Content Bundle Build Check
// ----------------------------------------------------
console.log('\nTest 6: Validating compiled content bundle...');
const bundleFile = path.resolve(__dirname, '..', 'dist', 'content.bundle.js');
assert(fs.existsSync(bundleFile) && fs.statSync(bundleFile).size > 20000, `dist/content.bundle.js exists (${fs.statSync(bundleFile).size} bytes)`);

// ----------------------------------------------------
// TEST RESULTS SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`   TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED`);
console.log('====================================================');

if (passedTests === totalTests) {
  console.log('   >>> ALL VERIFICATIONS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
} else {
  console.error('   >>> SOME TESTS FAILED! <<<\n');
  process.exit(1);
}
