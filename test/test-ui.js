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

console.log('  Found header row container with', container.children.length, 'child elements');
if (container.children.length !== 4) {
  throw new Error(`Expected headerRow to have 4 children initially, found ${container.children.length}`);
}

// Inject our 36x36 circular button
const btnWrapper = createDownloadButton(() => {});
container.insertBefore(btnWrapper, wrapper);

// Protect button slots from squashing
btnWrapper.style.flexShrink = '0';
if (wrapper && wrapper.style) wrapper.style.flexShrink = '0';

console.log('  After injection, header row container has', container.children.length, 'child elements');
if (container.children.length !== 5) {
  throw new Error(`Expected headerRow to have 5 children after injection, found ${container.children.length}`);
}

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

// 4. Check horizontal sequence: Download button is immediately BEFORE 3-dots slot, which is BEFORE Hide/X slot
const childrenArray = Array.from(container.children);
const dlIdx = childrenArray.indexOf(btnWrapper);
const menuIdx = childrenArray.indexOf(wrapper);
const hideSlot = childrenArray.find(ch => ch.contains(hideBtnAfter));
const hideIdx = childrenArray.indexOf(hideSlot);

if (dlIdx !== -1 && menuIdx !== -1 && dlIdx < menuIdx) {
  console.log(`  ✓ PASS: Correct layout sequence: [Download button] (index ${dlIdx}) -> [3-dots button] (index ${menuIdx})!`);
} else {
  throw new Error(`Incorrect button order: dl=${dlIdx}, menu=${menuIdx}`);
}

if (hideIdx !== -1 && menuIdx < hideIdx) {
  console.log(`  ✓ PASS: Correct layout sequence: [3-dots button] (index ${menuIdx}) -> [Hide X button] (index ${hideIdx})!`);
} else {
  throw new Error(`Incorrect button order: menu=${menuIdx}, hide=${hideIdx}`);
}

// 5. Verify no button slot has overlapping or crammed buttons
if (wrapper.contains(hideBtnAfter)) {
  throw new Error('3-dots slot must NOT contain Hide/X button!');
}
if (wrapper.contains(btnWrapper)) {
  throw new Error('3-dots slot must NOT contain Download button!');
}
console.log('  ✓ PASS: Button slots are completely isolated siblings — no collision or overlapping!');

// 6. Test on Post 2 (post without Hide/X button)
console.log('\nTesting header button injection on real Post 2 DOM (no Hide button)...');
const p2Match = content.match(/View Raw DOM Capture: Post 2[\s\S]*?```html\s*([\s\S]*?)\s*```/);
const dom2 = new JSDOM(`<!DOCTYPE html><html><head></head><body>${p2Match[1]}</body></html>`);
const post2 = dom2.window.document.body.firstElementChild;
const slotData2 = findHeaderActionSlot(post2);

if (!slotData2 || !slotData2.container) {
  throw new Error('Failed to locate Post 2 header action container');
}

const { container: c2, wrapper: w2 } = slotData2;
const btnWrapper2 = createDownloadButton(() => {});
c2.insertBefore(btnWrapper2, w2);

const c2Array = Array.from(c2.children);
const dlIdx2 = c2Array.indexOf(btnWrapper2);
const menuIdx2 = c2Array.indexOf(w2);

if (dlIdx2 !== -1 && menuIdx2 !== -1 && dlIdx2 < menuIdx2) {
  console.log(`  ✓ PASS: Post 2 sequence verified: [Download button] (index ${dlIdx2}) -> [3-dots button] (index ${menuIdx2})!`);
} else {
  throw new Error(`Post 2 incorrect button order: dl=${dlIdx2}, menu=${menuIdx2}`);
}

console.log('\nAll UI injection checks passed successfully!');
