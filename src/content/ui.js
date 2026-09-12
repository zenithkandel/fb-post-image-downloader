/**
 * UI Components & Injected Actions
 * Manifest V3 - Privacy-First, Zero Backend
 */

import { EXTENSION_CONFIG, FORMATS } from '../shared/constants.js';

/**
 * Ensure UI styles are injected into the page once
 */
function ensureStylesInjected() {
  if (document.getElementById('fpid-injected-styles')) return;

  const style = document.createElement('style');
  style.id = 'fpid-injected-styles';
  style.textContent = `
    /* Download button wrapper matching Facebook 36px icon button slots */
    .fpid-btn-wrapper {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      flex-shrink: 0 !important;
      margin: 0 4px !important;
      position: relative !important;
      box-sizing: border-box !important;
    }

    /* Native-styled circular icon button */
    .${EXTENSION_CONFIG.BUTTON_CLASS} {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 36px !important;
      height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      border-radius: 50% !important;
      border: none !important;
      background-color: transparent !important;
      color: var(--secondary-icon, #B0B3B8) !important;
      cursor: pointer !important;
      transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease !important;
      padding: 0 !important;
      margin: 0 !important;
      outline: none !important;
      position: relative !important;
      user-select: none !important;
      box-sizing: border-box !important;
    }
    .${EXTENSION_CONFIG.BUTTON_CLASS}:hover {
      background-color: var(--hover-overlay, rgba(255, 255, 255, 0.1)) !important;
      color: #0866FF !important;
      transform: scale(1.08) !important;
    }
    .${EXTENSION_CONFIG.BUTTON_CLASS}:active {
      transform: scale(0.95) !important;
    }
    .${EXTENSION_CONFIG.BUTTON_CLASS} svg {
      width: 20px !important;
      height: 20px !important;
      fill: currentColor !important;
      display: block !important;
    }

    /* Floating Facebook-like tooltip */
    .fpid-tooltip {
      position: absolute;
      top: 42px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.88);
      color: #FFFFFF;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.15s ease, transform 0.15s ease;
      z-index: 9999999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      line-height: 1.2;
    }
    .fpid-btn-wrapper:hover .fpid-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(2px);
    }

    /* Modal Overlay */
    #${EXTENSION_CONFIG.MODAL_ID} {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #${EXTENSION_CONFIG.MODAL_ID} .fpid-dialog {
      background: #242526;
      color: #E4E6EB;
      width: 90%;
      max-width: 440px;
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 24px;
      box-sizing: border-box;
      animation: fpid-fade-in 0.2s ease-out;
    }
    @keyframes fpid-fade-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    #${EXTENSION_CONFIG.MODAL_ID} h3 {
      margin: 0 0 6px 0;
      font-size: 18px;
      font-weight: 700;
      color: #FFFFFF;
    }
    #${EXTENSION_CONFIG.MODAL_ID} p.fpid-subtitle {
      margin: 0 0 20px 0;
      font-size: 13px;
      color: #B0B3B8;
    }
    .fpid-format-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .fpid-format-card {
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      padding: 16px 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #E4E6EB;
    }
    .fpid-format-card:hover {
      border-color: #0866FF;
      background: rgba(8, 102, 255, 0.1);
      transform: translateY(-2px);
    }
    .fpid-format-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #FFFFFF;
    }
    .fpid-format-desc {
      font-size: 11px;
      color: #B0B3B8;
      line-height: 1.4;
    }
    .fpid-progress-box {
      margin: 16px 0;
      display: none;
    }
    .fpid-progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #E4E6EB;
    }
    .fpid-progress-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    .fpid-progress-bar-fill {
      height: 100%;
      width: 0%;
      background: #0866FF;
      border-radius: 4px;
      transition: width 0.2s ease;
    }
    .fpid-actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }
    .fpid-btn-cancel {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: transparent;
      color: #E4E6EB;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .fpid-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    /* Toast notification */
    #${EXTENSION_CONFIG.TOAST_ID} {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #18191A;
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 13px;
      font-weight: 600;
      z-index: 1000000;
      animation: fpid-toast-in 0.25s ease-out;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
    }
    @keyframes fpid-toast-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Create a native-styled "Download images" button element
 */
export function createDownloadButton(onClick) {
  ensureStylesInjected();

  const wrapper = document.createElement('div');
  wrapper.className = 'fpid-btn-wrapper';

  const btn = document.createElement('button');
  btn.className = EXTENSION_CONFIG.BUTTON_CLASS;
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-label', 'Download images from this post');
  btn.setAttribute('title', 'Download images');
  btn.innerHTML = `
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
      <path d="M10 2a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V2.75A.75.75 0 0 1 10 2z"/>
      <path d="M3.5 13.25a.75.75 0 0 1 .75.75v1.5c0 .414.336.75.75.75h10a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A2.25 2.25 0 0 1 15 17.75H5A2.25 2.25 0 0 1 2.75 15.5v-1.5a.75.75 0 0 1 .75-.75z"/>
    </svg>
  `;

  const tooltip = document.createElement('div');
  tooltip.className = 'fpid-tooltip';
  tooltip.textContent = 'Download images';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(tooltip);

  return wrapper;
}

/**
 * Show format choice modal dialog
 */
export function showFormatModal({ imageCount, isScanning = false, onSelectFormat, onCancel }) {
  ensureStylesInjected();
  closeFormatModal(); // Close any existing modal

  const modal = document.createElement('div');
  modal.id = EXTENSION_CONFIG.MODAL_ID;
  modal.innerHTML = `
    <div class="fpid-dialog" role="dialog" aria-modal="true">
      <h3>Download Images</h3>
      <p class="fpid-subtitle" id="fpid-modal-subtitle">${
        isScanning
          ? 'Scanning full post gallery for hidden photos...'
          : `Found <strong>${imageCount}</strong> image${imageCount > 1 ? 's' : ''} attached to this post.`
      }</p>

      <div class="fpid-format-options" id="fpid-format-options-row" style="${isScanning ? 'display: none;' : ''}">
        <div class="fpid-format-card" id="fpid-choice-zip">
          <div class="fpid-format-title">ZIP Archive</div>
          <div class="fpid-format-desc">Save each image as a separate file. Best for saving original photos.</div>
        </div>
        <div class="fpid-format-card" id="fpid-choice-pdf">
          <div class="fpid-format-title">PDF Document</div>
          <div class="fpid-format-desc">Places every image on its own page. Best for reading or printing.</div>
        </div>
      </div>

      <div class="fpid-progress-box" id="fpid-progress-box" style="${isScanning ? 'display: block;' : 'display: none;'}">
        <div class="fpid-progress-label">
          <span id="fpid-progress-status">${isScanning ? `Discovering photos... (Found ${imageCount})` : 'Preparing download...'}</span>
          <span id="fpid-progress-percent">${isScanning ? 'Scanning...' : '0%'}</span>
        </div>
        <div class="fpid-progress-bar-bg">
          <div class="fpid-progress-bar-fill" id="fpid-progress-fill" style="${isScanning ? 'width: 60%;' : 'width: 0%;'}"></div>
        </div>
      </div>

      <div class="fpid-actions-row">
        <button type="button" class="fpid-btn-cancel" id="fpid-btn-cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const zipCard = modal.querySelector('#fpid-choice-zip');
  const pdfCard = modal.querySelector('#fpid-choice-pdf');
  const cancelBtn = modal.querySelector('#fpid-btn-cancel');

  zipCard.addEventListener('click', () => onSelectFormat(FORMATS.ZIP));
  pdfCard.addEventListener('click', () => onSelectFormat(FORMATS.PDF));
  cancelBtn.addEventListener('click', () => {
    closeFormatModal();
    if (onCancel) onCancel();
  });

  return {
    updateScanningProgress(foundCount, totalEstimate) {
      const statusEl = modal.querySelector('#fpid-progress-status');
      const percentEl = modal.querySelector('#fpid-progress-percent');
      const fillEl = modal.querySelector('#fpid-progress-fill');

      if (statusEl) {
        statusEl.textContent = `Discovered ${foundCount} photos...`;
      }
      if (percentEl) {
        percentEl.textContent = totalEstimate > 0 ? `${Math.min(100, Math.round((foundCount / totalEstimate) * 100))}%` : 'Scanning...';
      }
      if (fillEl) {
        const pct = totalEstimate > 0 ? Math.min(95, Math.round((foundCount / totalEstimate) * 100)) : 75;
        fillEl.style.width = `${pct}%`;
      }
    },
    switchToFormatSelection(totalCount) {
      const subtitleEl = modal.querySelector('#fpid-modal-subtitle');
      const optionsRow = modal.querySelector('#fpid-format-options-row');
      const progressBox = modal.querySelector('#fpid-progress-box');

      if (subtitleEl) {
        subtitleEl.innerHTML = `Found <strong>${totalCount}</strong> images attached to this post (full gallery retrieved).`;
      }
      if (progressBox) progressBox.style.display = 'none';
      if (optionsRow) optionsRow.style.display = 'grid';
    },
    updateProgress(current, total, statusText) {
      const optionsRow = modal.querySelector('#fpid-format-options-row');
      const progressBox = modal.querySelector('#fpid-progress-box');
      const statusEl = modal.querySelector('#fpid-progress-status');
      const percentEl = modal.querySelector('#fpid-progress-percent');
      const fillEl = modal.querySelector('#fpid-progress-fill');

      if (optionsRow) optionsRow.style.display = 'none';
      if (progressBox) progressBox.style.display = 'block';

      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      if (statusEl) statusEl.textContent = statusText || `Downloading image ${current} of ${total}...`;
      if (percentEl) percentEl.textContent = `${pct}%`;
      if (fillEl) fillEl.style.width = `${pct}%`;
    },
    close() {
      closeFormatModal();
    }
  };
}

/**
 * Remove format modal from DOM
 */
export function closeFormatModal() {
  const existing = document.getElementById(EXTENSION_CONFIG.MODAL_ID);
  if (existing) existing.remove();
}

/**
 * Show a lightweight non-intrusive toast notification
 */
export function showToast(message, durationMs = 3500) {
  ensureStylesInjected();
  const existing = document.getElementById(EXTENSION_CONFIG.TOAST_ID);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = EXTENSION_CONFIG.TOAST_ID;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, durationMs);
}
