/**
 * Test UI button injection on real Facebook post header DOM
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requireScratch = createRequire('C:\\Users\\zenith\\.gemini\\antigravity-ide\\brain\\5a32aca8-27a3-4968-88d2-a4d4e0a16974\\scratch\\package.json');
const { JSDOM } = requireScratch('jsdom');

import { findHeaderActionSlot } from '../src/content/detector.js';
import { createDownloadButton } from '../src/content/ui.js';

console.log('Testing header button injection on real Post 1 DOM...');

const findingPath = path.resolve(__dirname, '..', 'facebook dom finding.md');
const content = fs.readFileSync(findingPath, 'utf8');
const p1Match = content.match(/View Raw DOM Capture: Post 1[\s\S]*?```html\s*([\s\S]*?)\s*```/);
const html = p1Match[1];

const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${html}</body></html>`);
const doc = dom.window.document;
globalThis.document = doc;
globalThis.HTMLElement = dom.window.HTMLElement;

const post1 = doc.body.firstElementChild;
const slotData = findHeaderActionSlot(post1);

if (!slotData || !slotData.container) {
  throw new Error('Failed to locate header action container');
}

const { container, wrapper, menuBtn } = slotData;

console.log('  Found container with', container.children.length, 'existing buttons (3-dots & X)');
const initialChildrenCount = container.children.length;

// Inject our 36x36 circular button
const btnWrapper = createDownloadButton(() => {});
container.insertBefore(btnWrapper, wrapper);

// Protect children
Array.from(container.children).forEach(child => {
  if (child && child.style) child.style.flexShrink = '0';
});

console.log('  After injection, container has', container.children.length, 'buttons');

// Verify:
// 1. 3-dots button must still be in the DOM
const menuBtnAfter = post1.querySelector('[aria-label^="Actions for this post"]');
if (menuBtnAfter) {
  console.log('  ✓ PASS: Default 3-dots button is preserved in the DOM!');
} else {
  throw new Error('3-dots button disappeared!');
}

// 2. Hide/X button must still be in the DOM
const hideBtnAfter = post1.querySelector('[aria-label^="Hide"]');
if (hideBtnAfter) {
  console.log('  ✓ PASS: Default X button is preserved in the DOM!');
} else {
  throw new Error('X button disappeared!');
}

// 3. Download button exists and is 36px circular button
const dlBtn = post1.querySelector('.fpid-download-btn');
if (dlBtn) {
  console.log('  ✓ PASS: Download button exists!');
} else {
  throw new Error('Download button missing!');
}

// 4. Check order: Download button wrapper is immediately BEFORE the 3-dots wrapper
const childrenArray = Array.from(container.children);
const dlIdx = childrenArray.indexOf(btnWrapper);
const menuIdx = childrenArray.indexOf(wrapper);

if (dlIdx !== -1 && menuIdx !== -1 && dlIdx < menuIdx) {
  console.log(`  ✓ PASS: Correct layout sequence: [Download button] (index ${dlIdx}) -> [3-dots button] (index ${menuIdx})!`);
} else {
  throw new Error(`Incorrect button order: dl=${dlIdx}, menu=${menuIdx}`);
}

console.log('\nAll UI injection checks passed successfully!');
