/**
 * Post Detector & Boundary Locator for Facebook DOM
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { SELECTORS, EXTENSION_CONFIG } from '../shared/constants.js';
import { debugLog } from '../shared/utils.js';

/**
 * Locate the root post container starting from any descendant element
 * Uses a multi-strategy hierarchy based on verified structural invariants.
 */
export function findPostContainer(startElement) {
  if (!startElement || typeof startElement.closest !== 'function') return null;

  // Strategy 1: Role landmark
  const article = startElement.closest(SELECTORS.POST_ARTICLE);
  if (article && isValidPostContainer(article)) {
    return article;
  }

  // Strategy 2: Comet Feed Unit Pagelet
  const feedUnit = startElement.closest(SELECTORS.POST_FEED_UNIT);
  if (feedUnit && isValidPostContainer(feedUnit)) {
    return feedUnit;
  }

  // Strategy 3: Structural Ancestor Walk
  // Ascend parent tree and check if node unites header (menu), content (message/photo), and toolbar
  let curr = startElement;
  let candidate = null;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (isValidPostContainer(curr)) {
      candidate = curr;
      break;
    }
    curr = curr.parentElement;
  }

  if (candidate) {
    return candidate;
  }

  // Strategy 4: Nearest enclosing div with post-like characteristics
  return startElement.closest('div.html-div') || null;
}

/**
 * Validates whether an element has the structural characteristics of a Facebook post
 */
export function isValidPostContainer(el) {
  if (!el || typeof el.querySelector !== 'function') return false;

  // Must have a menu trigger button or profile name
  const hasMenu = el.querySelector(SELECTORS.MENU_BUTTON) !== null;
  const hasProfile = el.querySelector(SELECTORS.PROFILE_NAME) !== null;
  if (!hasMenu && !hasProfile) return false;

  // Must have post content: either a story message, photo anchor, or action toolbar
  const hasMessage = el.querySelector(SELECTORS.STORY_MESSAGE) !== null;
  const hasPhotos = el.querySelector(SELECTORS.PHOTO_ANCHORS) !== null;
  const hasToolbar = el.querySelector(SELECTORS.ACTION_TOOLBAR) !== null;

  return (hasMessage || hasPhotos) && (hasToolbar || hasMenu);
}

/**
 * Find the action controls area in the post header where the button can be injected
 */
export function findHeaderActionSlot(postElement) {
  if (!postElement || typeof postElement.querySelector !== 'function') return null;

  // 1. Locate the three-dot menu button specifically (excluding hide/close buttons)
  const menuBtn =
    postElement.querySelector('[aria-label^="Actions for this post"]') ||
    postElement.querySelector('[aria-haspopup="menu"]:not([aria-label*="Hide"]):not([aria-label*="close" i])') ||
    postElement.querySelector('[aria-haspopup="menu"][role="button"]') ||
    postElement.querySelector('[aria-label*="Actions" i]') ||
    postElement.querySelector('[aria-label*="More" i]');

  // 2. Fallback: Locate the close/hide button container if 3-dots is absent
  const closeBtn =
    postElement.querySelector('[aria-label^="Hide"]') ||
    postElement.querySelector('[aria-label*="close" i]');

  const targetBtn = menuBtn || closeBtn;
  if (!targetBtn) return null;

  // 3. Locate the header row: the flex container uniting the author/profile section
  // with the action buttons (3-dots menu and/or close button).
  const profileAnchor =
    postElement.querySelector('[data-ad-rendering-role="profile_name"]') ||
    postElement.querySelector('h4') ||
    postElement.querySelector('a[role="link"]');

  let headerRow = null;
  let actionSlot = null;

  if (profileAnchor) {
    let curr = targetBtn;
    while (curr && curr !== postElement) {
      if (curr.parentElement && curr.parentElement.contains(profileAnchor)) {
        headerRow = curr.parentElement;
        actionSlot = curr;
        break;
      }
      curr = curr.parentElement;
    }
  }

  // 4. Robust Fallback: If walking up to profileAnchor did not resolve, ascend hierarchy
  if (!headerRow || !actionSlot) {
    const p1 = targetBtn.parentElement;
    const p2 = p1 ? p1.parentElement : null;
    const p3 = p2 ? p2.parentElement : null;

    if (p2 && p3 && (p3.classList.contains('x78zum5') || p3.children.length > 1)) {
      actionSlot = p2;
      headerRow = p3;
    } else if (p1 && p2) {
      actionSlot = p1;
      headerRow = p2;
    } else if (p1) {
      actionSlot = targetBtn;
      headerRow = p1;
    }
  }

  if (!headerRow || !actionSlot) return null;

  return {
    menuBtn: targetBtn,
    wrapper: actionSlot,
    container: headerRow
  };
}

/**
 * Scan DOM for unprocessed Facebook posts
 */
export function scanPosts(rootNode = document.body) {
  if (!rootNode || !(rootNode instanceof Element)) return [];

  const posts = [];

  // Find posts via known selectors
  const candidates = rootNode.querySelectorAll(`
    ${SELECTORS.POST_ARTICLE},
    ${SELECTORS.POST_FEED_UNIT},
    ${SELECTORS.MENU_BUTTON}
  `);

  candidates.forEach((el) => {
    let post = null;
    if (el.matches(SELECTORS.MENU_BUTTON)) {
      post = findPostContainer(el);
    } else {
      post = el;
    }

    if (post && isValidPostContainer(post) && !post.hasAttribute(EXTENSION_CONFIG.PROCESSED_ATTR)) {
      posts.push(post);
    }
  });

  return [...new Set(posts)];
}

/**
 * Initialize MutationObserver to watch for newly rendered posts during scrolling/navigation
 */
export function initPostObserver(onNewPostCallback) {
  // Initial scan
  const initialPosts = scanPosts(document.body);
  initialPosts.forEach(onNewPostCallback);

  // MutationObserver for dynamic infinite scroll
  const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        hasAddedNodes = true;
        break;
      }
    }

    if (hasAddedNodes) {
      const newPosts = scanPosts(document.body);
      if (newPosts.length > 0) {
        debugLog(`Found ${newPosts.length} new posts to process.`);
        newPosts.forEach(onNewPostCallback);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  debugLog('Post detector MutationObserver initialized.');
  return observer;
}
