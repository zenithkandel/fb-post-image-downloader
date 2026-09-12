# Facebook Post Image Downloader (Chrome Extension — Manifest V3)

A production-quality, privacy-first, 100% client-side Chrome Extension that allows users to download all images attached to any Facebook post directly as a **ZIP archive** or **PDF document**.

---

## Key Highlights

- **100% Client-Side**: No backend, no cloud processing, no database, no external APIs. All image detection, retrieval, ZIP compression, and PDF generation happen directly inside the user's browser.
- **Zero Data Leakage**: No images, URLs, or metadata ever leave your computer.
- **High-Resolution Engine**: Automatically removes feed display restrictions (`ctp=s640x640`) to retrieve full-resolution originals ($1638\times 2048$+) without breaking cryptographic CDN signatures.
- **Smart Filtering**: Strictly isolates genuine post photos. Profile avatars, emojis, reactions, and UI icons are never downloaded.
- **Dual Export Formats**:
  - **ZIP**: Saves each photo as an individual file, preserving native format (JPEG, PNG, WebP).
  - **PDF**: Places each photo on its own page, automatically adjusting dimensions and orientation to match the image's natural aspect ratio.

---

## Architecture Overview

```
fb-post-image-downloader/
├── manifest.json              # Manifest V3 extension configuration
├── dist/
│   └── content.bundle.js      # Bundled self-contained content script (IIFE)
├── vendor/                    # Locally bundled libraries (Zero CDN dependencies)
│   ├── jszip.min.js           # JSZip v3.10.1 (Local archive builder)
│   └── jspdf.umd.min.js       # jsPDF v2.5.2 (Local PDF composer)
├── src/
│   ├── shared/
│   │   ├── constants.js       # Selectors, configuration tokens, & message types
│   │   └── utils.js           # Sanitization, debounce, logger, & URL helpers
│   ├── content/
│   │   ├── content.js         # Main content script coordinator
│   │   ├── detector.js        # Post boundary locator & MutationObserver
│   │   ├── extractor.js       # Media anchor parser & high-res resolver
│   │   └── ui.js              # Injected button, modal dialog, & progress UI
│   ├── processing/
│   │   ├── fetcher.js         # Binary Blob retriever with fallback handling
│   │   ├── zip.js             # JSZip archive builder
│   │   └── pdf.js             # jsPDF multi-page document composer
│   └── background/
│       └── service-worker.js  # Chrome downloads API manager
├── icons/                     # Extension icons (16px, 32px, 48px, 128px)
├── facebook dom finding.md    # Reverse-engineered Facebook DOM documentation
└── package.json               # Build and test configurations
```

---

## Installation Guide (Load Unpacked)

1. **Clone or Download** this repository to your computer.
2. Open Google Chrome or any Chromium-based browser (Brave, Edge, Opera, Vivaldi).
3. In the URL bar, navigate to:
   ```text
   chrome://extensions/
   ```
4. In the top right corner, enable **Developer mode**.
5. Click **Load unpacked** in the top left corner.
6. Select this project's folder:
   ```text
   c:\xampp\htdocs\codes\fb-post-image-downloader
   ```
7. The extension **Facebook Post Image Downloader** is now installed and active!

---

## User Flow

1. Open Facebook (`https://www.facebook.com`) in Chrome.
2. Scroll to any post with attached photos.
3. You will see a clean **"Download images"** button in the post header next to the three-dot menu.
4. Click **"Download images"**:
   - A modal dialog appears showing the number of detected photos.
   - Choose **ZIP Archive** or **PDF Document**.
5. The extension retrieves the highest available resolution for each image directly into memory, shows real-time progress, packages the file, and triggers a local browser download.

---

## How Image Detection Works

Facebook posts in modern Comet web architecture follow a strict **4-child container structure**:
1. **Child #1 (Honeypot/Obfuscation)**: Decoy blocks with `data-0="0"` through `data-19="19"` (automatically ignored).
2. **Child #2 (Header)**: Author avatar, profile name, and three-dot actions button (`aria-haspopup="menu"`).
3. **Child #3 (Body & Media)**: Story message text and attached photo anchors.
4. **Child #4 (Footer)**: Reactions counter and toolbar buttons.

### Eligibility Rules
To guarantee that only true post media is extracted:
1. **Anchor Enclosure**: Images must be enclosed in `a[href*="/photo"]` or `a[href*="fbid="]`.
2. **CDN Protocol**: Must be an `<img>` element with `src` pointing to `https://scontent*.fbcdn.net/`.
3. **Avatar Elimination**: Avatars are rendered inside SVG masks (`<svg role="img"><image .../></svg>`) and are ignored.
4. **Emoji Elimination**: Emojis are served from `static.xx.fbcdn.net/images/emoji.php` and $\le 32\times 32\text{px}$, which are excluded.
5. **Deduplication**: Images are deduplicated using their Facebook photo ID (`fbid`) and canonical CDN cryptographic hash (`oh`).

---

## High-Resolution Strategy

Facebook limits feed images to thumbnails via URL query parameters:
```text
.../799818900_..._n.jpg?stp=dst-jpg_tt6&cstp=mx1638x2048&ctp=s640x640&...&oh=...&oe=...
```
- `ctp=s640x640`: Feed thumbnail clamp (47 KB).
- `cstp=mx1638x2048`: Maximum server dimension (cryptographically bound).
- `oh`: Cryptographic signature HMAC.

**Our Engine**:
1. Strips `&ctp=s640x640` while keeping `cstp` and `oh`.
2. This requests the un-clamped $1638\times 2048$ original file (**725 KB vs. 47 KB — a 15.2x increase in clarity!**).
3. If any CDN configuration rejects the stripped URL, the engine automatically falls back to the untouched original URL.

---

## Development & Building

To modify source files and rebuild the bundle:
```bash
# Build the content bundle
npm run build

# Run automated test suite
npm run test
```

### Debug Mode
To inspect live DOM matching in the Chrome DevTools console:
```javascript
window.__FB_IMAGE_DOWNLOADER_DEBUG__ = true;
```
This logs detected posts, matched image URLs, rejected candidates (avatars, emojis), and byte sizes.

---

## Privacy & Security Statement

- **Permissions**: Only requests `downloads` (to save the ZIP/PDF to your computer).
- **Host Permissions**: Restricted strictly to `*://*.facebook.com/*` and `*://*.fbcdn.net/*`.
- **No Third-Party Requests**: All dependencies (`JSZip`, `jsPDF`) are bundled locally. No external scripts or fonts are fetched at runtime.
