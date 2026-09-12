(() => {
  // src/shared/constants.js
  var SELECTORS = {
    // Post Container Candidates (in priority order)
    POST_ARTICLE: 'div[role="article"]',
    POST_FEED_UNIT: 'div[data-pagelet^="FeedUnit_"]',
    POST_FALLBACK: "div.html-div",
    // Header & Menu Button
    MENU_BUTTON: '[aria-haspopup="menu"][role="button"]',
    ACTIONS_LABEL_PREFIX: "Actions for this post",
    PROFILE_NAME: '[data-ad-rendering-role="profile_name"]',
    STORY_MESSAGE: '[data-ad-rendering-role="story_message"]',
    ACTION_TOOLBAR: '[role="toolbar"]',
    // Media & Photo Anchors
    PHOTO_LINK_KEYWORDS: ["/photo/", "fbid=", "set=pcb.", "set=a."],
    PHOTO_ANCHORS: 'a[href*="/photo"], a[href*="fbid="], a[href*="set=pcb."]',
    FEED_IMAGE: 'img[data-imgperflogname="feedImage"]',
    GENERAL_IMG: "img",
    SVG_AVATAR: 'svg mask image, svg[role="img"] image',
    // Decoy & Honeypot Filter
    HONEYPOT_ATTR: "data-0",
    ARIA_HIDDEN: '[aria-hidden="true"]'
  };
  var EXTENSION_CONFIG = {
    PROCESSED_ATTR: "data-fpid-processed",
    BUTTON_CLASS: "fpid-download-btn",
    MODAL_ID: "fpid-format-modal",
    TOAST_ID: "fpid-toast-container",
    DEBUG_FLAG: "__FB_IMAGE_DOWNLOADER_DEBUG__"
  };
  var FORMATS = {
    ZIP: "zip",
    PDF: "pdf"
  };
  var MESSAGE_TYPES = {
    DOWNLOAD_FILE: "DOWNLOAD_FILE",
    FETCH_IMAGE: "FETCH_IMAGE",
    PING: "PING"
  };

  // src/shared/utils.js
  function debugLog(...args) {
    if (typeof window !== "undefined" && window[EXTENSION_CONFIG.DEBUG_FLAG]) {
      console.log("[FB Image Downloader]", ...args);
    }
  }
  function sanitizeFilename(str, fallback = "facebook-image") {
    if (!str || typeof str !== "string") return fallback;
    const sanitized = str.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100);
    return sanitized.length > 0 ? sanitized : fallback;
  }
  function getFormattedDate(date = /* @__PURE__ */ new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const mins = pad(date.getMinutes());
    return `${year}-${month}-${day}-${hours}${mins}`;
  }
  function normalizeUrl(url) {
    if (!url || typeof url !== "string") return "";
    return url.replace(/&amp;/g, "&").trim();
  }
  function detectExtension(url, mimeType = "") {
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("gif")) return "gif";
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.toLowerCase();
      if (pathname.endsWith(".png")) return "png";
      if (pathname.endsWith(".webp")) return "webp";
      if (pathname.endsWith(".gif")) return "gif";
    } catch (e) {
    }
    return "jpg";
  }

  // src/content/detector.js
  function findPostContainer(startElement) {
    if (!startElement || typeof startElement.closest !== "function") return null;
    const article = startElement.closest(SELECTORS.POST_ARTICLE);
    if (article && isValidPostContainer(article)) {
      return article;
    }
    const feedUnit = startElement.closest(SELECTORS.POST_FEED_UNIT);
    if (feedUnit && isValidPostContainer(feedUnit)) {
      return feedUnit;
    }
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
    return startElement.closest("div.html-div") || null;
  }
  function isValidPostContainer(el) {
    if (!el || typeof el.querySelector !== "function") return false;
    const hasMenu = el.querySelector(SELECTORS.MENU_BUTTON) !== null;
    const hasProfile = el.querySelector(SELECTORS.PROFILE_NAME) !== null;
    if (!hasMenu && !hasProfile) return false;
    const hasMessage = el.querySelector(SELECTORS.STORY_MESSAGE) !== null;
    const hasPhotos = el.querySelector(SELECTORS.PHOTO_ANCHORS) !== null;
    const hasToolbar = el.querySelector(SELECTORS.ACTION_TOOLBAR) !== null;
    return (hasMessage || hasPhotos) && (hasToolbar || hasMenu);
  }
  function findHeaderActionSlot(postElement) {
    if (!postElement || typeof postElement.querySelector !== "function") return null;
    const menuBtn = postElement.querySelector('[aria-label^="Actions for this post"]') || postElement.querySelector('[aria-haspopup="menu"]:not([aria-label*="Hide"]):not([aria-label*="close" i])') || postElement.querySelector('[aria-haspopup="menu"][role="button"]') || postElement.querySelector('[aria-label*="Actions" i]') || postElement.querySelector('[aria-label*="More" i]');
    const closeBtn = postElement.querySelector('[aria-label^="Hide"]') || postElement.querySelector('[aria-label*="close" i]');
    const targetBtn = menuBtn || closeBtn;
    if (!targetBtn) return null;
    const profileAnchor = postElement.querySelector('[data-ad-rendering-role="profile_name"]') || postElement.querySelector("h4") || postElement.querySelector('a[role="link"]');
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
    if (!headerRow || !actionSlot) {
      const p1 = targetBtn.parentElement;
      const p2 = p1 ? p1.parentElement : null;
      const p3 = p2 ? p2.parentElement : null;
      if (p2 && p3 && (p3.classList.contains("x78zum5") || p3.children.length > 1)) {
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
  function scanPosts(rootNode = document.body) {
    if (!rootNode || !(rootNode instanceof Element)) return [];
    const posts = [];
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
  function initPostObserver(onNewPostCallback) {
    const initialPosts = scanPosts(document.body);
    initialPosts.forEach(onNewPostCallback);
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
    debugLog("Post detector MutationObserver initialized.");
    return observer;
  }

  // src/content/extractor.js
  function extractPostImages(postElement) {
    if (!postElement || typeof postElement.querySelectorAll !== "function") {
      return [];
    }
    debugLog("Extracting images from post:", postElement);
    const photoAnchors = postElement.querySelectorAll(SELECTORS.PHOTO_ANCHORS);
    const candidates = [];
    const seenFbid = /* @__PURE__ */ new Set();
    const seenUrls = /* @__PURE__ */ new Set();
    photoAnchors.forEach((anchor, index) => {
      if (anchor.closest(`[${SELECTORS.HONEYPOT_ATTR}]`)) {
        return;
      }
      const href = anchor.getAttribute("href") || "";
      const fbidMatch = href.match(/fbid=([0-9]+)/i);
      const fbid = fbidMatch ? fbidMatch[1] : null;
      const tnMatch = href.match(/__tn__=\*b([0-9]+)/i);
      const gridIndex = tnMatch ? parseInt(tnMatch[1], 10) : index;
      const imgEls = anchor.querySelectorAll(SELECTORS.GENERAL_IMG);
      imgEls.forEach((img) => {
        const rawSrc = img.currentSrc || img.getAttribute("src") || "";
        const normalizedSrc = normalizeUrl(rawSrc);
        if (!isEligiblePostImage(img, normalizedSrc)) {
          return;
        }
        if (fbid && seenFbid.has(fbid)) return;
        if (seenUrls.has(normalizedSrc)) return;
        if (fbid) seenFbid.add(fbid);
        seenUrls.add(normalizedSrc);
        const highResUrl = deriveHighResUrl(normalizedSrc);
        candidates.push({
          index: gridIndex,
          fbid,
          originalUrl: normalizedSrc,
          highResUrl,
          alt: img.getAttribute("alt") || "",
          width: img.naturalWidth || parseInt(img.getAttribute("width"), 10) || null,
          height: img.naturalHeight || parseInt(img.getAttribute("height"), 10) || null
        });
      });
    });
    if (candidates.length === 0) {
      const feedImgs = postElement.querySelectorAll(SELECTORS.FEED_IMAGE);
      feedImgs.forEach((img, idx) => {
        if (img.closest(`[${SELECTORS.HONEYPOT_ATTR}]`)) return;
        const rawSrc = img.currentSrc || img.getAttribute("src") || "";
        const normalizedSrc = normalizeUrl(rawSrc);
        if (isEligiblePostImage(img, normalizedSrc) && !seenUrls.has(normalizedSrc)) {
          seenUrls.add(normalizedSrc);
          candidates.push({
            index: idx,
            fbid: null,
            originalUrl: normalizedSrc,
            highResUrl: deriveHighResUrl(normalizedSrc),
            alt: img.getAttribute("alt") || "",
            width: img.naturalWidth || parseInt(img.getAttribute("width"), 10) || null,
            height: img.naturalHeight || parseInt(img.getAttribute("height"), 10) || null
          });
        }
      });
    }
    candidates.sort((a, b) => a.index - b.index);
    debugLog(`Extraction complete. Found ${candidates.length} eligible images.`);
    return candidates;
  }
  function isEligiblePostImage(imgElement, srcUrl) {
    if (!srcUrl || !srcUrl.startsWith("http")) return false;
    if (!srcUrl.includes("fbcdn.net")) return false;
    if (srcUrl.includes("emoji.php")) return false;
    if (srcUrl.startsWith("data:")) return false;
    const w = imgElement.naturalWidth || parseInt(imgElement.getAttribute("width"), 10) || 0;
    const h = imgElement.naturalHeight || parseInt(imgElement.getAttribute("height"), 10) || 0;
    if (w > 0 && w <= 32 && (h > 0 && h <= 32)) {
      return false;
    }
    return true;
  }
  function deriveHighResUrl(url) {
    if (!url || typeof url !== "string") return url;
    if (url.includes("&ctp=s") || url.includes("?ctp=s")) {
      const highRes = url.replace(/&ctp=s[0-9x]+/gi, "").replace(/\?ctp=s[0-9x]+&/gi, "?").replace(/\?ctp=s[0-9x]+/gi, "");
      return highRes;
    }
    return url;
  }
  function extractAuthorName(postElement) {
    if (!postElement) return "facebook";
    const authorAnchor = postElement.querySelector(`${SELECTORS.PROFILE_NAME} a`) || postElement.querySelector("h4 a");
    if (authorAnchor) {
      const text = authorAnchor.textContent.trim();
      if (text) return sanitizeFilename(text);
    }
    const profileEl = postElement.querySelector(SELECTORS.PROFILE_NAME);
    if (profileEl) {
      const text = profileEl.textContent.trim();
      if (text) return sanitizeFilename(text);
    }
    return "facebook";
  }
  function detectRemainingPhotosInfo(postElement) {
    if (!postElement || typeof postElement.querySelectorAll !== "function") {
      return null;
    }
    const photoAnchors = Array.from(
      postElement.querySelectorAll('a[href*="/photo/"], a[href*="/photo.php"], a[href*="/photos/"]')
    );
    if (photoAnchors.length === 0) return null;
    for (const anchor of photoAnchors) {
      if (anchor.closest(`[${SELECTORS.HONEYPOT_ATTR}]`)) {
        continue;
      }
      const textContent = anchor.textContent || "";
      const badgeMatch = textContent.match(/\+(\d+)/);
      const ariaLabel = anchor.getAttribute("aria-label") || "";
      const ariaMatch = ariaLabel.match(/(\d+)\s+remaining\s+items/i);
      const remainingCount = badgeMatch ? parseInt(badgeMatch[1], 10) : ariaMatch ? parseInt(ariaMatch[1], 10) : null;
      if (remainingCount && remainingCount > 0) {
        const href = anchor.getAttribute("href") || "";
        const fbidMatch = href.match(/fbid=([0-9]+)/i);
        const setMatch = href.match(/[?&]set=([^&]+)/i);
        if (fbidMatch && setMatch) {
          let firstFbid = null;
          for (const firstAnchor of photoAnchors) {
            const firstHref = firstAnchor.getAttribute("href") || "";
            const m = firstHref.match(/fbid=([0-9]+)/i);
            if (m) {
              firstFbid = m[1];
              break;
            }
          }
          return {
            remainingCount,
            lastFbid: fbidMatch[1],
            setId: decodeURIComponent(setMatch[1]),
            firstFbid,
            anchor
          };
        }
      }
    }
    return null;
  }
  function extractImageFromPhotoHtml(html, fbid) {
    if (!html || typeof html !== "string") return null;
    const unescaped = html.replace(/\\\//g, "/");
    const imgObjMatch = unescaped.match(/"image":\{"uri":"(https:\/\/[^"]+fbcdn\.net[^"]+)"/);
    if (imgObjMatch) {
      return imgObjMatch[1];
    }
    const prefetchMatch = unescaped.match(/"uri":"(https:\/\/[^"]+fbcdn\.net\/v\/t39\.30808-6\/[^"]+)"/);
    if (prefetchMatch) {
      return prefetchMatch[1];
    }
    if (fbid) {
      const fbidRegex = new RegExp(`https://[a-z0-9.-]+\\.fbcdn\\.net/v/t39\\.30808-6/[^"'\\s]*${fbid}[^"'\\s]*`);
      const fbidMatch = unescaped.match(fbidRegex);
      if (fbidMatch) {
        return fbidMatch[0];
      }
    }
    const generalMatch = unescaped.match(/https:\/\/[a-z0-9.-]+\.fbcdn\.net\/v\/t39\.30808-6\/[a-zA-Z0-9_.-]+\.jpg[^"'\\\s]*/);
    if (generalMatch) {
      return generalMatch[0];
    }
    return null;
  }
  function extractNextFbidFromPhotoHtml(html) {
    if (!html || typeof html !== "string") return null;
    const nextMatch = html.match(/"nextMediaAfterNodeId":\{"__typename":"Photo","id":"(\d+)"/);
    return nextMatch ? nextMatch[1] : null;
  }
  async function fetchRemainingSetPhotos({ lastFbid, setId, remainingCount = 0, firstFbid = null, maxItems = 50, startIndex = 5 }, onProgress = null, signal = null) {
    if (!lastFbid || !setId) return [];
    const discovered = [];
    const visitedFbids = /* @__PURE__ */ new Set();
    if (firstFbid) visitedFbids.add(firstFbid);
    visitedFbids.add(lastFbid);
    let currentFbid = lastFbid;
    let currentIndex = startIndex;
    let isFirstStep = true;
    debugLog(`Starting media set traversal: lastFbid=${lastFbid}, setId=${setId}, remaining=${remainingCount}`);
    while (discovered.length < maxItems) {
      if (signal && signal.aborted) {
        debugLog("Media set traversal aborted by signal.");
        break;
      }
      const url = `https://www.facebook.com/photo/?fbid=${currentFbid}&set=${encodeURIComponent(setId)}`;
      let html = "";
      try {
        const res = await fetch(url, {
          headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
          },
          signal: signal || void 0
        });
        if (!res.ok) {
          debugLog(`Fetch returned HTTP ${res.status} for fbid ${currentFbid}`);
          break;
        }
        html = await res.text();
      } catch (err) {
        if (err.name === "AbortError") {
          debugLog("Media set traversal fetch aborted.");
          break;
        }
        debugLog(`Error fetching photo page for fbid ${currentFbid}:`, err);
        break;
      }
      const nextFbid = extractNextFbidFromPhotoHtml(html);
      if (!isFirstStep) {
        const rawImgUrl = extractImageFromPhotoHtml(html, currentFbid);
        if (rawImgUrl) {
          const highResUrl = deriveHighResUrl(rawImgUrl);
          discovered.push({
            index: currentIndex++,
            fbid: currentFbid,
            originalUrl: rawImgUrl,
            highResUrl,
            alt: "",
            width: null,
            height: null,
            fromMediaSet: true
          });
          if (typeof onProgress === "function") {
            onProgress(discovered.length, remainingCount);
          }
        }
      }
      isFirstStep = false;
      if (!nextFbid || visitedFbids.has(nextFbid)) {
        debugLog(`Media set traversal finished at nextFbid: ${nextFbid}`);
        break;
      }
      visitedFbids.add(nextFbid);
      currentFbid = nextFbid;
    }
    debugLog(`Discovered ${discovered.length} additional photos from media set.`);
    return discovered;
  }

  // src/content/ui.js
  function ensureStylesInjected() {
    if (document.getElementById("fpid-injected-styles")) return;
    const style = document.createElement("style");
    style.id = "fpid-injected-styles";
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
  function createDownloadButton(onClick) {
    ensureStylesInjected();
    const wrapper = document.createElement("div");
    wrapper.className = "fpid-btn-wrapper";
    const btn = document.createElement("button");
    btn.className = EXTENSION_CONFIG.BUTTON_CLASS;
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", "Download images from this post");
    btn.setAttribute("title", "Download images");
    btn.innerHTML = `
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
      <path d="M10 2a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V2.75A.75.75 0 0 1 10 2z"/>
      <path d="M3.5 13.25a.75.75 0 0 1 .75.75v1.5c0 .414.336.75.75.75h10a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A2.25 2.25 0 0 1 15 17.75H5A2.25 2.25 0 0 1 2.75 15.5v-1.5a.75.75 0 0 1 .75-.75z"/>
    </svg>
  `;
    const tooltip = document.createElement("div");
    tooltip.className = "fpid-tooltip";
    tooltip.textContent = "Download images";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    });
    wrapper.appendChild(btn);
    wrapper.appendChild(tooltip);
    return wrapper;
  }
  function showFormatModal({ imageCount, isScanning = false, onSelectFormat, onCancel }) {
    ensureStylesInjected();
    closeFormatModal();
    const modal = document.createElement("div");
    modal.id = EXTENSION_CONFIG.MODAL_ID;
    modal.innerHTML = `
    <div class="fpid-dialog" role="dialog" aria-modal="true">
      <h3>Download Images</h3>
      <p class="fpid-subtitle" id="fpid-modal-subtitle">${isScanning ? "Scanning full post gallery for hidden photos..." : `Found <strong>${imageCount}</strong> image${imageCount > 1 ? "s" : ""} attached to this post.`}</p>

      <div class="fpid-format-options" id="fpid-format-options-row" style="${isScanning ? "display: none;" : ""}">
        <div class="fpid-format-card" id="fpid-choice-zip">
          <div class="fpid-format-title">ZIP Archive</div>
          <div class="fpid-format-desc">Save each image as a separate file. Best for saving original photos.</div>
        </div>
        <div class="fpid-format-card" id="fpid-choice-pdf">
          <div class="fpid-format-title">PDF Document</div>
          <div class="fpid-format-desc">Places every image on its own page. Best for reading or printing.</div>
        </div>
      </div>

      <div class="fpid-progress-box" id="fpid-progress-box" style="${isScanning ? "display: block;" : "display: none;"}">
        <div class="fpid-progress-label">
          <span id="fpid-progress-status">${isScanning ? `Discovering photos... (Found ${imageCount})` : "Preparing download..."}</span>
          <span id="fpid-progress-percent">${isScanning ? "Scanning..." : "0%"}</span>
        </div>
        <div class="fpid-progress-bar-bg">
          <div class="fpid-progress-bar-fill" id="fpid-progress-fill" style="${isScanning ? "width: 60%;" : "width: 0%;"}"></div>
        </div>
      </div>

      <div class="fpid-actions-row">
        <button type="button" class="fpid-btn-cancel" id="fpid-btn-cancel">Cancel</button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    const zipCard = modal.querySelector("#fpid-choice-zip");
    const pdfCard = modal.querySelector("#fpid-choice-pdf");
    const cancelBtn = modal.querySelector("#fpid-btn-cancel");
    zipCard.addEventListener("click", () => onSelectFormat(FORMATS.ZIP));
    pdfCard.addEventListener("click", () => onSelectFormat(FORMATS.PDF));
    cancelBtn.addEventListener("click", () => {
      closeFormatModal();
      if (onCancel) onCancel();
    });
    return {
      updateScanningProgress(foundCount, totalEstimate) {
        const statusEl = modal.querySelector("#fpid-progress-status");
        const percentEl = modal.querySelector("#fpid-progress-percent");
        const fillEl = modal.querySelector("#fpid-progress-fill");
        if (statusEl) {
          statusEl.textContent = `Discovered ${foundCount} photos...`;
        }
        if (percentEl) {
          percentEl.textContent = totalEstimate > 0 ? `${Math.min(100, Math.round(foundCount / totalEstimate * 100))}%` : "Scanning...";
        }
        if (fillEl) {
          const pct = totalEstimate > 0 ? Math.min(95, Math.round(foundCount / totalEstimate * 100)) : 75;
          fillEl.style.width = `${pct}%`;
        }
      },
      switchToFormatSelection(totalCount) {
        const subtitleEl = modal.querySelector("#fpid-modal-subtitle");
        const optionsRow = modal.querySelector("#fpid-format-options-row");
        const progressBox = modal.querySelector("#fpid-progress-box");
        if (subtitleEl) {
          subtitleEl.innerHTML = `Found <strong>${totalCount}</strong> images attached to this post (full gallery retrieved).`;
        }
        if (progressBox) progressBox.style.display = "none";
        if (optionsRow) optionsRow.style.display = "grid";
      },
      updateProgress(current, total, statusText) {
        const optionsRow = modal.querySelector("#fpid-format-options-row");
        const progressBox = modal.querySelector("#fpid-progress-box");
        const statusEl = modal.querySelector("#fpid-progress-status");
        const percentEl = modal.querySelector("#fpid-progress-percent");
        const fillEl = modal.querySelector("#fpid-progress-fill");
        if (optionsRow) optionsRow.style.display = "none";
        if (progressBox) progressBox.style.display = "block";
        const pct = total > 0 ? Math.round(current / total * 100) : 0;
        if (statusEl) statusEl.textContent = statusText || `Downloading image ${current} of ${total}...`;
        if (percentEl) percentEl.textContent = `${pct}%`;
        if (fillEl) fillEl.style.width = `${pct}%`;
      },
      close() {
        closeFormatModal();
      }
    };
  }
  function closeFormatModal() {
    const existing = document.getElementById(EXTENSION_CONFIG.MODAL_ID);
    if (existing) existing.remove();
  }
  function showToast(message, durationMs = 3500) {
    ensureStylesInjected();
    const existing = document.getElementById(EXTENSION_CONFIG.TOAST_ID);
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = EXTENSION_CONFIG.TOAST_ID;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, durationMs);
  }

  // src/processing/fetcher.js
  async function fetchImageBlob(imageItem) {
    const urlsToTry = [];
    if (imageItem.highResUrl && imageItem.highResUrl !== imageItem.originalUrl) {
      urlsToTry.push(imageItem.highResUrl);
    }
    urlsToTry.push(imageItem.originalUrl);
    let lastError = null;
    for (const url of urlsToTry) {
      try {
        debugLog("Fetching image candidate:", url.slice(0, 100));
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          headers: {
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
          }
        });
        if (response.ok) {
          const blob = await response.blob();
          const mimeType = response.headers.get("content-type") || blob.type || "image/jpeg";
          const extension = detectExtension(url, mimeType);
          debugLog(`Successfully retrieved image blob (${blob.size} bytes, ${mimeType})`);
          return {
            success: true,
            index: imageItem.index,
            blob,
            mimeType,
            extension,
            size: blob.size,
            url
          };
        } else {
          lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
          debugLog(`URL attempt failed: ${lastError.message}`);
        }
      } catch (err) {
        lastError = err;
        debugLog(`Fetch error: ${err.message}`);
      }
    }
    return {
      success: false,
      index: imageItem.index,
      error: lastError ? lastError.message : "Unknown fetch error",
      url: imageItem.originalUrl
    };
  }
  async function fetchAllImages(imageItems, onProgress = () => {
  }) {
    const results = [];
    let completed = 0;
    const total = imageItems.length;
    for (let i = 0; i < total; i++) {
      const item = imageItems[i];
      const res = await fetchImageBlob(item);
      results.push(res);
      completed++;
      onProgress(completed, total, res);
    }
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    return {
      successful,
      failed,
      total
    };
  }

  // src/processing/zip.js
  async function createZipArchive(images, baseName = "facebook-images") {
    const JSZip = window.JSZip;
    if (!JSZip) {
      throw new Error("JSZip library is not loaded.");
    }
    debugLog(`Creating ZIP archive for ${images.length} images...`);
    const zip = new JSZip();
    images.forEach((img, idx) => {
      const paddedIndex = String(idx + 1).padStart(2, "0");
      const ext = img.extension || "jpg";
      const filename = `${baseName}-${paddedIndex}.${ext}`;
      zip.file(filename, img.blob);
    });
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6
      }
    });
    debugLog(`ZIP archive created successfully. Size: ${zipBlob.size} bytes.`);
    return zipBlob;
  }

  // src/processing/pdf.js
  async function createPdfDocument(images) {
    const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
    if (!jsPDF) {
      throw new Error("jsPDF library is not loaded.");
    }
    debugLog(`Creating PDF document for ${images.length} images...`);
    let doc = null;
    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const { width, height, dataUrl } = await readImageData(item.blob);
      const orientation = width >= height ? "l" : "p";
      if (i === 0) {
        doc = new jsPDF({
          orientation,
          unit: "px",
          format: [width, height],
          hotfixes: ["px_scaling"]
        });
        doc.addImage(dataUrl, "JPEG", 0, 0, width, height, void 0, "FAST");
      } else {
        doc.addPage([width, height], orientation);
        doc.addImage(dataUrl, "JPEG", 0, 0, width, height, void 0, "FAST");
      }
    }
    if (!doc) {
      throw new Error("No images available to generate PDF.");
    }
    const pdfBlob = doc.output("blob");
    debugLog(`PDF document created successfully. Size: ${pdfBlob.size} bytes.`);
    return pdfBlob;
  }
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
            dataUrl
          });
        };
        img.onerror = () => reject(new Error("Failed to load image into memory for PDF generation."));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("Failed to read image blob."));
      reader.readAsDataURL(blob);
    });
  }

  // src/content/content.js
  async function handleDownloadClick(postElement) {
    debugLog("Download action triggered for post:", postElement);
    let images = extractPostImages(postElement);
    if (!images || images.length === 0) {
      showToast("No downloadable images found in this post.");
      return;
    }
    const remainingInfo = detectRemainingPhotosInfo(postElement);
    const hasRemaining = Boolean(remainingInfo && remainingInfo.remainingCount > 0);
    const authorName = extractAuthorName(postElement);
    const timestamp = getFormattedDate();
    const baseFilename = `${authorName}-${timestamp}`;
    let abortController = null;
    if (hasRemaining) {
      abortController = new AbortController();
    }
    let modalControls = null;
    modalControls = showFormatModal({
      imageCount: images.length,
      isScanning: hasRemaining,
      onSelectFormat: async (format) => {
        try {
          debugLog(`Format selected: ${format}. Commencing retrieval for ${images.length} images...`);
          const fetchResults = await fetchAllImages(images, (completed, total) => {
            modalControls.updateProgress(
              completed,
              total,
              `Downloading image ${completed} of ${total}...`
            );
          });
          if (fetchResults.successful.length === 0) {
            modalControls.close();
            showToast("Failed to retrieve images from Facebook CDN.");
            return;
          }
          let outputBlob = null;
          let finalFilename = "";
          if (format === FORMATS.ZIP) {
            modalControls.updateProgress(
              fetchResults.total,
              fetchResults.total,
              "Creating local ZIP archive..."
            );
            outputBlob = await createZipArchive(fetchResults.successful, baseFilename);
            finalFilename = `${baseFilename}.zip`;
          } else if (format === FORMATS.PDF) {
            modalControls.updateProgress(
              fetchResults.total,
              fetchResults.total,
              "Composing local PDF document..."
            );
            outputBlob = await createPdfDocument(fetchResults.successful);
            finalFilename = `${baseFilename}.pdf`;
          }
          if (outputBlob && finalFilename) {
            downloadBlobLocally(outputBlob, finalFilename);
            modalControls.updateProgress(fetchResults.total, fetchResults.total, "Download ready!");
            setTimeout(() => {
              modalControls.close();
              if (fetchResults.failed.length > 0) {
                showToast(
                  `Downloaded ${fetchResults.successful.length} images (${fetchResults.failed.length} failed).`
                );
              } else {
                showToast(`Downloaded ${fetchResults.successful.length} images successfully!`);
              }
            }, 800);
          }
        } catch (err) {
          debugLog("Processing error:", err);
          modalControls.close();
          showToast(`Download failed: ${err.message || "An error occurred."}`);
        }
      },
      onCancel: () => {
        debugLog("Download cancelled by user.");
        if (abortController) {
          abortController.abort();
        }
      }
    });
    if (hasRemaining) {
      try {
        const extraPhotos = await fetchRemainingSetPhotos(
          {
            lastFbid: remainingInfo.lastFbid,
            setId: remainingInfo.setId,
            remainingCount: remainingInfo.remainingCount,
            firstFbid: remainingInfo.firstFbid,
            startIndex: images.length
          },
          (foundCount, targetTotal) => {
            modalControls.updateScanningProgress(images.length + foundCount, images.length + targetTotal);
          },
          abortController.signal
        );
        if (extraPhotos.length > 0) {
          const existingFbids = new Set(images.map((img) => img.fbid).filter(Boolean));
          const existingUrls = new Set(images.map((img) => img.originalUrl));
          extraPhotos.forEach((photo) => {
            if (photo.fbid && existingFbids.has(photo.fbid)) return;
            if (existingUrls.has(photo.originalUrl)) return;
            if (photo.fbid) existingFbids.add(photo.fbid);
            existingUrls.add(photo.originalUrl);
            images.push(photo);
          });
        }
        modalControls.switchToFormatSelection(images.length);
      } catch (err) {
        debugLog("Error discovering remaining set photos:", err);
        modalControls.switchToFormatSelection(images.length);
      }
    }
  }
  function downloadBlobLocally(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: MESSAGE_TYPES.DOWNLOAD_FILE,
          blobUrl,
          filename
        },
        (response) => {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 6e4);
        }
      );
    } else {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }, 1e3);
    }
  }
  function onPostDetected(postElement) {
    if (!postElement || postElement.hasAttribute(EXTENSION_CONFIG.PROCESSED_ATTR)) {
      return;
    }
    if (postElement.querySelector(`.${EXTENSION_CONFIG.BUTTON_CLASS}`) || postElement.querySelector(".fpid-btn-wrapper")) {
      postElement.setAttribute(EXTENSION_CONFIG.PROCESSED_ATTR, "true");
      return;
    }
    const slotData = findHeaderActionSlot(postElement);
    if (!slotData || !slotData.container) {
      return;
    }
    const { container, wrapper } = slotData;
    const btnWrapper = createDownloadButton(() => handleDownloadClick(postElement));
    if (wrapper && wrapper.parentElement === container) {
      container.insertBefore(btnWrapper, wrapper);
    } else if (container.firstChild) {
      container.insertBefore(btnWrapper, container.firstChild);
    } else {
      container.appendChild(btnWrapper);
    }
    btnWrapper.style.flexShrink = "0";
    if (wrapper && wrapper.style) {
      wrapper.style.flexShrink = "0";
    }
    postElement.setAttribute(EXTENSION_CONFIG.PROCESSED_ATTR, "true");
    debugLog("Injected download action button into post header.");
  }
  function init() {
    debugLog("Facebook Post Image Downloader content script starting...");
    initPostObserver(onPostDetected);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
