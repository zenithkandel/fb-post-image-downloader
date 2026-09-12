/**
 * Constants and selectors for Facebook Post Image Downloader Chrome Extension
 * Manifest V3 - Privacy-First, Zero Backend
 */

export const SELECTORS = {
  // Post Container Candidates (in priority order)
  POST_ARTICLE: 'div[role="article"]',
  POST_FEED_UNIT: 'div[data-pagelet^="FeedUnit_"]',
  POST_FALLBACK: 'div.html-div',

  // Header & Menu Button
  MENU_BUTTON: '[aria-haspopup="menu"][role="button"]',
  ACTIONS_LABEL_PREFIX: 'Actions for this post',
  PROFILE_NAME: '[data-ad-rendering-role="profile_name"]',
  STORY_MESSAGE: '[data-ad-rendering-role="story_message"]',
  ACTION_TOOLBAR: '[role="toolbar"]',

  // Media & Photo Anchors
  PHOTO_LINK_KEYWORDS: ['/photo/', 'fbid=', 'set=pcb.', 'set=a.'],
  PHOTO_ANCHORS: 'a[href*="/photo"], a[href*="fbid="], a[href*="set=pcb."]',
  FEED_IMAGE: 'img[data-imgperflogname="feedImage"]',
  GENERAL_IMG: 'img',
  SVG_AVATAR: 'svg mask image, svg[role="img"] image',

  // Decoy & Honeypot Filter
  HONEYPOT_ATTR: 'data-0',
  ARIA_HIDDEN: '[aria-hidden="true"]'
};

export const EXTENSION_CONFIG = {
  PROCESSED_ATTR: 'data-fpid-processed',
  BUTTON_CLASS: 'fpid-download-btn',
  MODAL_ID: 'fpid-format-modal',
  TOAST_ID: 'fpid-toast-container',
  DEBUG_FLAG: '__FB_IMAGE_DOWNLOADER_DEBUG__'
};

export const FORMATS = {
  ZIP: 'zip',
  PDF: 'pdf'
};

export const MESSAGE_TYPES = {
  DOWNLOAD_FILE: 'DOWNLOAD_FILE',
  FETCH_IMAGE: 'FETCH_IMAGE',
  PING: 'PING'
};
