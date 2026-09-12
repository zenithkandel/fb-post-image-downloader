/**
 * Background Service Worker for Facebook Post Image Downloader
 * Manifest V3 - Privacy-First, Zero Backend
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FB Image Downloader] Service worker installed.');
});

// Handle incoming messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'DOWNLOAD_FILE') {
    const { blobUrl, filename } = message;

    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download(
        {
          url: blobUrl,
          filename: filename,
          saveAs: false
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('[FB Image Downloader] Download failed:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('[FB Image Downloader] Download initiated with ID:', downloadId);
            sendResponse({ success: true, downloadId });
          }
        }
      );
      return true; // Keep message channel open for asynchronous sendResponse
    } else {
      sendResponse({ success: false, error: 'chrome.downloads API unavailable' });
    }
  }

  if (message && message.type === 'PING') {
    sendResponse({ success: true, status: 'pong' });
  }
});
