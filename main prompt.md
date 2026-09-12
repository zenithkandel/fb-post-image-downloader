Absolutely. I’d give the coding agent a **full engineering brief**, not just a feature request. The goal is to make the agent first understand the evidence you collected, reverse-engineer the current Facebook DOM behavior from that evidence, then build the extension around **stable semantics rather than hardcoded Facebook class names**.

You can copy the prompt below almost verbatim. Put your screenshots/DOM captures/URLs/resources alongside it.

---

# MASTER PROMPT — FACEBOOK POST IMAGE DOWNLOADER CHROME EXTENSION

```text
You are an experienced Chrome Extension engineer, frontend engineer, browser automation engineer, and reverse-engineering/debugging engineer.

I want you to build a production-quality Chrome Extension that allows a user to download all images attached to a specific Facebook post directly from the Facebook website.

The entire project MUST run client-side.

There must be:
- NO backend
- NO server
- NO database
- NO external API
- NO image upload
- NO cloud processing
- NO analytics
- NO telemetry
- NO user account
- NO external processing service

All image detection, image retrieval, image processing, ZIP generation, PDF generation, and downloading must happen locally in the user's browser.

The extension should be implemented as a Chrome Extension using Manifest V3.

IMPORTANT:
I am providing real-world Facebook screenshots, DOM captures, HTML snippets, image URLs, and other evidence alongside this prompt.

Treat those resources as research evidence, NOT as a guarantee that Facebook's DOM will always remain identical.

Do NOT blindly hardcode the exact CSS classes, element IDs, or generated attributes found in the evidence.

Your job is to analyze the supplied evidence and identify the most stable and semantically meaningful way to implement the extension.

==================================================
1. CORE PRODUCT
==================================================

The extension should add a "Download images" action to Facebook posts.

The ideal user experience is:

1. User visits Facebook normally.
2. User sees a Facebook post containing one or more images.
3. The extension adds a "Download images" action to that post's existing post-menu / three-dot menu if this can be done reliably.
4. User clicks "Download images".
5. The extension identifies EXACTLY which Facebook post the clicked action belongs to.
6. The extension extracts ALL images belonging to that post.
7. The extension asks the user what output format they want:
   - ZIP
   - PDF
8. The extension processes everything locally.
9. The resulting ZIP or PDF is downloaded to the user's computer.

Example:

Facebook post
    |
    | click three-dot menu
    v
Facebook menu
    |
    +-- Save post
    +-- ...
    +-- Download images
             |
             v
       Format selection
        /           \
      ZIP           PDF
       |             |
       v             v
   local ZIP      local PDF
       \             /
        \           /
         v         v
       browser download
```

==================================================
2. ABSOLUTE PRIVACY REQUIREMENT
===============================

This is a privacy-first extension.

No user data or images should ever leave the browser.

The extension must NOT:

* upload Facebook images anywhere
* send URLs to an external service
* send metadata to an external service
* use an external image-processing API
* use a remote PDF generation service
* use a remote ZIP generation service
* use analytics
* use tracking
* use telemetry
* use a remote database
* contact a backend owned by us

All processing must happen locally.

If a library is required, bundle it locally with the extension.

Do NOT load libraries from:

* CDN
* remote JavaScript URL
* remote CSS URL
* external API

The extension should continue to work as a self-contained client-side application.

==================================================
3. IMPORTANT SECURITY / PRIVACY PRINCIPLE
=========================================

The extension should only process content that is already accessible to the user through their current Facebook browser session.

Do not attempt to:

* bypass Facebook authentication
* bypass privacy restrictions
* access posts that the user cannot normally access
* access private content outside the user's browser session
* bypass technical access controls
* use stolen cookies
* extract Facebook authentication tokens
* use Facebook internal/private APIs
* use Graph API credentials
* automate account login
* scrape Facebook's private backend endpoints

Use the DOM and browser-accessible resources associated with the currently rendered Facebook page.

==================================================
4. TECHNOLOGY REQUIREMENTS
==========================

Use:

* Chrome Extension
* Manifest V3
* Vanilla JavaScript unless a framework is genuinely necessary
* HTML
* CSS
* JavaScript
* Browser APIs
* MutationObserver where appropriate
* Web APIs such as Blob, URL, fetch, Canvas/ImageBitmap/etc. where appropriate
* JSZip or an equivalent locally bundled ZIP library
* jsPDF or another suitable locally bundled PDF library if appropriate

Avoid introducing a framework simply for the sake of using one.

I prefer a small, understandable, maintainable extension rather than an unnecessarily complicated React/Vite/etc. application.

If you believe a build system is genuinely necessary, explain why before introducing it.

Otherwise, prefer a simple extension structure that can be loaded directly through Chrome's "Load unpacked" functionality.

==================================================
5. IMPORTANT: DO NOT START BY CODING EVERYTHING
===============================================

Before implementing the complete extension, first inspect ALL evidence/resources supplied with this prompt.

The supplied evidence may include:

* screenshots
* DOM snapshots
* HTML snippets
* copied elements
* image URLs
* src attributes
* srcset attributes
* surrounding anchor elements
* post structures
* screenshots of Facebook menus
* screenshots of image viewers
* examples of posts with different numbers of images
* examples of posts without images
* other debugging information

Analyze them carefully.

Your first task is to determine:

A. How Facebook represents a post in the DOM.

B. How the post menu is represented.

C. What stable attributes can be used.

D. How images belonging to a post can be identified.

E. How image URLs are represented.

F. Whether high-resolution image URLs can be derived from currently accessible page data.

G. Whether images can actually be fetched into browser-readable Blobs.

H. Whether the resulting Blobs can be processed locally.

I. What problems can occur due to Facebook's dynamic SPA behavior.

Do NOT assume that an observed CSS class is stable.

==================================================
6. FACEBOOK DOM: IMPORTANT RULE
===============================

Facebook's DOM is dynamic and may contain:

* generated class names
* generated IDs
* React-generated structures
* changing attributes
* nested divs
* accessibility attributes
* role attributes
* links
* image elements
* hidden elements
* duplicated elements
* lazy-loaded images
* re-rendered components

Therefore:

DO NOT build the entire extension around selectors such as:

document.querySelector('.some-facebook-class')

unless there is absolutely no alternative.

Prefer stable signals such as:

* semantic relationships
* aria-label
* role
* element type
* href patterns
* image attributes
* srcset
* parent/ancestor relationships
* accessible names
* structural relationships
* recognizable Facebook post boundaries

If a CSS class from my evidence appears useful, treat it as one signal rather than the sole source of truth.

==================================================
7. POST DETECTION
=================

The most important requirement is identifying the EXACT post associated with the clicked "Download images" action.

For example:

POST A
image A1
image A2

POST B
image B1
image B2

If the user clicks "Download images" on POST A, the extension MUST download:

A1
A2

and MUST NOT download:

B1
B2

Never perform a global search such as:

document.querySelectorAll('img')

and assume every image belongs to the selected post.

Image extraction must be scoped to the exact post element.

The extension should create a strong relationship between:

download action
|
v
specific post DOM node
|
v
images inside that post

The implementation should be designed so that clicking an action always gives the extractor access to the exact originating post element.

==================================================
8. HOW TO FIND THE POST CONTAINER
=================================

Analyze the supplied DOM evidence and determine the most reliable way to identify a Facebook post container.

Possible signals may include:

* semantic HTML
* article-like containers
* role attributes
* known structural patterns
* proximity to the post header
* relationship with the menu
* relationship with the image container
* accessibility structure

Do NOT assume one selector is permanently valid.

Build the detection logic in a way that can support multiple Facebook DOM variants if practical.

Consider creating an abstraction such as:

findPostContainer(element)

or:

getPostRootFromMenu(menuElement)

The function should receive an element associated with the clicked action and walk upward through ancestors / relevant relationships to identify the post root.

Document why the chosen detection strategy works.

==================================================
9. POST MENU INTEGRATION
========================

The preferred UX is to add:

"Download images"

to the existing Facebook post's three-dot menu.

However, do NOT sacrifice reliability just to force the extension into Facebook's menu.

First investigate the supplied DOM evidence.

If the existing menu has a reliable accessible structure, integrate with it.

If doing so requires brittle selectors that are likely to break immediately when Facebook changes its DOM, consider a fallback design such as a small native-looking action adjacent to the post menu.

The extension should prioritize:

1. Correctness
2. Reliability
3. Maintainability
4. Good UX

over blindly reproducing the exact current Facebook DOM.

==================================================
10. DYNAMIC FACEBOOK PAGE
=========================

Facebook behaves like a dynamic single-page application.

Posts can be:

* inserted after page load
* removed
* re-rendered
* moved
* duplicated
* lazily loaded
* updated as the user scrolls
* replaced by React re-rendering

Therefore, the extension cannot assume that all posts exist when content.js first runs.

Use MutationObserver or another appropriate strategy.

The implementation should:

* detect newly inserted posts
* add the extension action when appropriate
* avoid duplicate actions
* tolerate post re-rendering
* avoid continuously scanning the entire page unnecessarily
* avoid causing performance problems while scrolling

The logic should be idempotent.

Running the detection function multiple times should NOT result in:

Download images
Download images
Download images
Download images

being inserted repeatedly.

Use an appropriate marker or other robust mechanism to identify posts that have already been processed.

==================================================
11. PERFORMANCE
===============

Facebook can contain a large number of DOM nodes.

Do NOT run an expensive full-page DOM scan every few milliseconds.

Avoid:

setInterval(() => {
scanEntireFacebookPage();
}, 100);

or similar approaches.

Prefer:

* MutationObserver
* targeted scans
* debouncing/throttling where appropriate
* processing only newly added nodes when possible
* WeakSet or similar mechanisms where appropriate
* avoiding unnecessary DOM traversal

The extension should remain lightweight during normal Facebook scrolling.

==================================================
12. IMAGE DISCOVERY
===================

When the user clicks "Download images", inspect ONLY the selected post.

Determine which images actually belong to the post.

Potential image representations may include:

* <img src="...">
* srcset
* <picture>
* image links
* anchor hrefs
* lazy-loaded attributes
* background images if genuinely necessary
* Facebook-specific image structures

Do NOT automatically treat every <img> inside the post as a downloadable image.

For example, the post may contain:

* profile picture
* page avatar
* reaction icons
* emoji
* sponsored UI
* unrelated icons
* video thumbnails
* navigation images
* author profile photo

These must not accidentally become downloaded post images.

Define a clear image eligibility algorithm.

The algorithm should distinguish:

POST MEDIA

from:

POST UI

For example:

author avatar = NOT downloadable
reaction icon = NOT downloadable
Facebook UI icon = NOT downloadable
actual attached post photo = downloadable

==================================================
13. IMAGE OWNERSHIP
===================

Create a robust concept of:

isImageBelongingToPost(imageElement, postElement)

or equivalent.

An image should only be included if it can reasonably be established that it is media belonging to the selected post.

Use the evidence I provide to understand Facebook's structure.

If Facebook has a dedicated media container inside the post, prefer that.

If images are linked to a photo URL, use that relationship.

If there are multiple possible heuristics, combine them rather than relying on one fragile test.

==================================================
14. DUPLICATE IMAGE HANDLING
============================

Facebook may render the same image more than once in the DOM.

For example:

* responsive versions
* hidden copies
* preload copies
* duplicated accessibility structures
* lazy-loading placeholders

Do not download the same image multiple times simply because it appears multiple times in the DOM.

Create a sensible deduplication mechanism.

Potential deduplication keys could include:

* canonical image URL
* normalized image URL
* media identifier
* source relationship

Use URL-based deduplication when appropriate.

==================================================
15. IMAGE QUALITY
=================

The extension should attempt to download the highest-quality image representation reasonably available from the current page.

Do NOT simply take:

img.src

without investigating whether better data exists.

Inspect things such as:

* src
* srcset
* picture/source elements
* surrounding anchors
* image-related hrefs
* accessible image URLs
* other currently rendered attributes

If srcset contains multiple resolutions, choose the highest appropriate resolution.

If an image links to a larger Facebook photo representation, investigate whether that URL is the correct source.

However:

DO NOT invent undocumented URL transformations without evidence.

Do not assume that modifying URL parameters will always produce an original image.

Use actual accessible URLs and validate them.

==================================================
16. IMAGE FETCHING
==================

This is a critical technical requirement.

Before implementing the entire ZIP/PDF pipeline, create a proof of concept that:

1. Detects one real Facebook post image.
2. Obtains its best available URL.
3. Retrieves it in the extension's context.
4. Converts it to a Blob or another locally processable representation.
5. Successfully processes that Blob.

You MUST verify the actual behavior in Chrome.

Do not assume that because an image can be displayed by Facebook, the extension can necessarily fetch it using:

fetch(imageUrl)

There may be issues involving:

* CORS
* credentials
* Facebook CDN behavior
* extension origins
* host permissions
* content-script restrictions
* cookies
* redirects
* opaque responses

Investigate the actual behavior.

If direct fetching from content.js does not work, design an appropriate MV3 architecture using permitted browser-extension mechanisms.

Possible architecture may involve:

content script
↓
background/service worker
↓
browser-accessible request
↓
Blob
↓
content/PDF/ZIP processing

But choose the architecture based on actual testing rather than assumptions.

==================================================
17. HOST PERMISSIONS
====================

Use the minimum permissions required.

Do not request broad permissions without justification.

If host permissions are necessary for Facebook image/CDN URLs, determine the minimum appropriate patterns.

Explain why each permission exists.

Do not request:

<all_urls>

unless absolutely necessary.

Prefer the narrowest permissions compatible with the implementation.

==================================================
18. DOWNLOAD FORMAT SELECTION
=============================

When the user clicks "Download images", provide a clean format-selection UI.

The user must be able to choose:

ZIP
or
PDF

The UI should clearly explain:

ZIP:

* Each image remains an individual image file.
* Best for keeping the original images separately.

PDF:

* Each image becomes one page.
* Best for viewing/sharing as a single document.

The interface should be simple and professional.

Do not create a giant complicated settings page.

==================================================
19. ZIP OUTPUT
==============

For ZIP:

Create a ZIP archive entirely locally.

Example:

facebook-images.zip

Inside:

image-01.jpg
image-02.jpg
image-03.png
image-04.webp

Use the appropriate extension where possible.

Do not convert every image unnecessarily.

If the original format is JPEG, preserve JPEG.

If PNG, preserve PNG.

If WebP, preserve WebP where appropriate.

Avoid unnecessarily degrading images.

==================================================
20. FILE NAMING
===============

Use predictable filenames.

Example:

image-01.jpg
image-02.jpg
image-03.jpg

If useful and safe, a more descriptive naming scheme could be:

facebook-image-01.jpg

Do not put dangerous characters in filenames.

Sanitize any filename derived from user-controlled/page-controlled text.

Avoid filenames containing:

/

:
*
?
"
<

>

|

Keep names cross-platform compatible.

==================================================
21. PDF OUTPUT
==============

For PDF:

Create one PDF locally in the browser.

Each downloaded image should correspond to one PDF page.

Example:

Page 1 = image 1
Page 2 = image 2
Page 3 = image 3
Page 4 = image 4

Preserve image aspect ratio.

Do NOT stretch images.

Do NOT crop images unless explicitly required.

Prefer fitting each image inside the page while preserving the entire image.

The PDF generation should support:

* portrait images
* landscape images
* square images
* different aspect ratios

If possible, choose page orientation based on each image, or use another sensible consistent strategy.

Explain your chosen PDF layout.

==================================================
22. PDF IMAGE QUALITY
=====================

Do not unnecessarily resize images to extremely low resolutions.

Avoid making the PDF blurry.

At the same time, do not create absurdly huge PDFs if images are very large.

Use a sensible balance between:

* original image quality
* PDF file size
* browser memory
* performance

If jsPDF is used, configure it appropriately.

==================================================
23. LARGE DOWNLOADS
===================

The extension should handle posts with multiple images gracefully.

For example:

1 image
5 images
10 images
20 images
30 images

Do not assume only 2–3 images exist.

However, browser memory limits must be respected.

Do not load the same image into memory repeatedly unnecessarily.

==================================================
24. PROGRESS UI
===============

When processing multiple images, show progress.

Example:

Preparing images...

1 / 8
2 / 8
3 / 8
...

or:

Downloading images
████████░░ 80%

Then:

Creating ZIP...

or:

Creating PDF...

Then:

Download ready.

The UI should remain responsive.

==================================================
25. ERROR HANDLING
==================

The extension should fail gracefully.

Possible problems:

* image URL no longer works
* image fetch fails
* CORS restriction
* image deleted
* image not fully loaded
* Facebook re-rendered the post
* user navigated away
* image format unsupported
* PDF generation fails
* ZIP generation fails
* browser memory issue

Do NOT simply crash.

For example:

8 images detected.

7 downloaded successfully.
1 failed.

Then allow the user to:

Download 7 successful images

and show which image failed.

Do not make one failed image prevent every other image from being processed unless technically unavoidable.

==================================================
26. NO-IMAGE POST
=================

If the user clicks the extension action on a post that has no downloadable images:

show a clear message:

"No images found in this post."

Do not generate an empty ZIP/PDF.

==================================================
27. VIDEO POSTS
===============

Do not automatically treat video thumbnails as image attachments.

If the post contains a video, determine whether the image is:

* an actual attached photo
  or
* merely a video preview/thumbnail

For the first version, it is acceptable to support images only.

Clearly exclude video media unless the evidence shows that it is genuinely represented as an image attachment.

==================================================
28. CAROUSELS / MULTI-IMAGE POSTS
=================================

The extension should attempt to support posts containing:

* 1 image
* 2 images
* 3 images
* 4 images
* many images
* Facebook multi-photo layouts
* carousel-like image layouts where the actual post contains multiple image media items

Do not assume only visible images count if Facebook's DOM clearly contains additional attached images.

Investigate the supplied evidence.

If Facebook lazily loads images only after interaction, determine whether the extension can reliably obtain all attached images without requiring the user to manually open every image.

If that is impossible from the currently available DOM, document the limitation instead of pretending it is solved.

==================================================
29. IMAGE VIEWER
================

The extension may encounter Facebook's image viewer/lightbox.

Analyze the provided evidence for both:

A. Normal feed post

and:

B. Facebook image/photo viewer

The primary feature should operate from the post itself.

Do not make opening every image a prerequisite unless technically unavoidable.

If supporting the viewer is useful, implement it as a secondary compatibility mode.

==================================================
30. CONTENT SCRIPT ARCHITECTURE
===============================

Design the content script carefully.

A possible architecture:

content.js
|
+-- detectPosts()
|
+-- findPostContainer()
|
+-- injectDownloadAction()
|
+-- handleDownloadClick()
|
+-- extractPostImages()
|
+-- resolveBestImageUrl()
|
+-- deduplicateImages()

But do not blindly follow this structure if a better design emerges.

Separate responsibilities clearly.

Avoid putting everything into one 1000-line function.

==================================================
31. BACKGROUND / SERVICE WORKER
===============================

Use a background service worker if necessary for:

* privileged browser operations
* image retrieval
* download operations
* communication between content script and extension UI
* long-running processing that should not be tied directly to the page

But do not create a background worker simply because Manifest V3 supports one.

Keep architecture as simple as possible.

==================================================
32. COMMUNICATION
=================

If content.js and background.js need to communicate, use Chrome Extension messaging APIs.

Keep messages structured.

For example:

{
type: "DOWNLOAD_POST_IMAGES",
postId: "...",
images: [...]
}

and:

{
type: "DOWNLOAD_PROGRESS",
completed: 4,
total: 10
}

Do not send unnecessary page data.

==================================================
33. UI DESIGN
=============

The UI should look like a polished real Chrome extension.

Avoid:

* giant colorful gradients
* excessive rounded cards
* "AI-looking" design
* unnecessary animations
* neon colors
* excessive glassmorphism
* clutter
* generic dashboard aesthetics

Prefer:

* clean
* minimal
* professional
* compact
* accessible
* clear typography
* subtle borders
* sensible spacing
* obvious actions

The UI should feel like a serious utility rather than a demo.

==================================================
34. EXTENSION POPUP
===================

A popup is optional.

Do not make the extension depend on the popup for normal operation if the action is already available directly on Facebook posts.

If a popup is implemented, it can contain:

* extension name
* short description
* enabled/disabled state if useful
* small settings
* privacy statement

But keep it minimal.

==================================================
35. SETTINGS
============

Do not create unnecessary settings.

Possible useful settings:

* default output format
* automatic download vs ask every time
* filename preference

But do not overengineer the first version.

The user requirement is that the extension should ask the user for:

ZIP or PDF.

Therefore, default behavior should preserve that explicit choice unless there is a deliberate setting to change it.

==================================================
36. FILE DOWNLOAD
=================

Use Chrome's download functionality appropriately.

Do not create server-side download URLs.

The final generated file should exist locally as a Blob/object URL or appropriate browser representation and then be downloaded using browser APIs.

Clean up object URLs after use.

For example:

URL.createObjectURL(...)
URL.revokeObjectURL(...)

Use appropriate cleanup to avoid memory leaks.

==================================================
37. MEMORY MANAGEMENT
=====================

This extension can potentially process large images.

Be careful with:

* ArrayBuffers
* Blobs
* object URLs
* Canvas
* ImageBitmap
* PDF buffers
* ZIP buffers

Release temporary resources when they are no longer needed.

Do not keep every intermediate copy of every image in memory longer than necessary.

==================================================
38. ACCESSIBILITY
=================

The injected button/action must be accessible.

Use:

* accessible text
* aria-label where appropriate
* keyboard accessibility
* visible focus state
* appropriate semantic button behavior

Do not create clickable divs when a real button can be used.

If integrating with Facebook's menu, preserve appropriate keyboard behavior as much as possible.

==================================================
39. INTERNATIONALIZATION / FACEBOOK LANGUAGE
============================================

Do not rely exclusively on Facebook's visible English text.

For example, do not assume:

aria-label="More"

is always English.

Facebook users may use different languages.

Use semantic relationships and structural detection where possible.

If the extension needs to identify Facebook's menu, support multiple possible labels where practical, but avoid depending entirely on translated strings.

==================================================
40. SPA NAVIGATION
==================

Facebook may change URLs without performing a full page reload.

The extension must continue working during:

* navigation between feed sections
* profile navigation
* opening posts
* returning to feed
* history changes

Do not assume content.js executes only once per browser session.

==================================================
41. FACEBOOK DOM CHANGES
========================

The implementation should be defensive.

If a selector fails:

* do not crash
* log useful development information
* attempt alternate detection strategies if appropriate

Consider implementing a selector strategy such as:

Strategy 1:
semantic/ARIA detection

Strategy 2:
structural detection

Strategy 3:
known DOM pattern from supplied evidence

Avoid a single point of failure.

==================================================
42. DEVELOPMENT DEBUG MODE
==========================

During development, implement useful debug tooling.

For example:

window.**FB_IMAGE_DOWNLOADER_DEBUG** = true

or an internal debug flag.

When enabled, it should be possible to inspect:

* detected post
* detected menu
* detected images
* image URLs
* rejected images
* reasons for rejecting them
* selected best image URL
* fetch status
* processing status

For example:

Detected post: <element>

Candidate images:

1. avatar.jpg — REJECTED — profile image
2. photo.jpg — ACCEPTED
3. icon.png — REJECTED — UI icon
4. photo2.jpg — ACCEPTED

This will be extremely useful while testing against Facebook.

Do not leave excessive logging enabled in production mode.

==================================================
43. TESTING STRATEGY
====================

Create a test checklist.

At minimum test:

TEST 1
Single-image Facebook post.

Expected:
1 image.

TEST 2
Two-image post.

Expected:
2 images.

TEST 3
Four-image post.

Expected:
4 images.

TEST 4
Large multi-image post.

Expected:
all available post images.

TEST 5
Post with no images.

Expected:
"No images found."

TEST 6
Two adjacent posts.

Expected:
clicking post A only downloads A's images.

TEST 7
Post containing author avatar.

Expected:
author avatar is NOT downloaded.

TEST 8
Post containing reaction icons.

Expected:
reaction icons are NOT downloaded.

TEST 9
Post containing video.

Expected:
video thumbnail is not incorrectly treated as an attached photo.

TEST 10
Infinite scrolling.

Expected:
new posts receive the action.

TEST 11
Facebook dynamically re-renders a post.

Expected:
no duplicate download buttons.

TEST 12
Image fetch failure.

Expected:
other images continue processing.

TEST 13
ZIP.

Expected:
each image exists as a separate file.

TEST 14
PDF.

Expected:
one image per page.

TEST 15
Portrait image.

Expected:
correct aspect ratio.

TEST 16
Landscape image.

Expected:
correct aspect ratio.

TEST 17
Square image.

Expected:
correct aspect ratio.

TEST 18
Mixed image orientations.

Expected:
all images fit correctly.

TEST 19
Large images.

Expected:
reasonable performance.

TEST 20
Large number of images.

Expected:
progress UI and graceful handling.

==================================================
44. EVIDENCE-DRIVEN IMPLEMENTATION
==================================

The files I provide with this prompt are important.

They may include files such as:

screenshots/
dom/
html/
urls/
notes/
etc.

Read and analyze them before implementation.

For every important detection mechanism, answer internally:

"What evidence supports this?"

Do not invent Facebook DOM behavior.

If the evidence contradicts an assumption, trust the evidence.

If evidence is insufficient, perform a small targeted experiment rather than guessing.

==================================================
45. DO NOT OVERFIT TO MY EXAMPLES
=================================

The supplied Facebook DOM examples are snapshots.

They represent Facebook as observed during development.

They are NOT guaranteed to remain identical.

Therefore:

BAD:

const posts = document.querySelectorAll(
'div.x1abc123.x2def456.x3ghi789'
);

GOOD:

Use stable semantic and structural relationships discovered from the evidence.

Potentially combine several signals with fallback logic.

==================================================
46. ERROR REPORTING
===================

In development mode, report meaningful failures.

Examples:

Could not identify post container.

Could not find downloadable media.

Image URL discovered but fetch failed.

Image was detected but rejected because it appears to be an avatar.

PDF generation failed.

ZIP generation failed.

Do not silently swallow all errors.

==================================================
47. USER-FACING ERROR MESSAGES
==============================

Do not expose technical stack traces to normal users.

Instead use messages such as:

"Couldn't find any images in this post."

"Some images couldn't be downloaded."

"Facebook changed this page structure. Please refresh the page and try again."

"Couldn't create the PDF."

For development/debug mode, provide the technical information separately.

==================================================
48. BROWSER COMPATIBILITY
=========================

Primary target:

Google Chrome / Chromium-based browsers supporting Manifest V3.

Do not spend excessive effort supporting Firefox initially unless the architecture naturally supports it.

==================================================
49. PROJECT STRUCTURE
=====================

Create a clean project structure.

For example:

facebook-image-downloader/
│
├── manifest.json
│
├── src/
│   ├── content/
│   │   ├── content.js
│   │   ├── detector.js
│   │   ├── post.js
│   │   ├── images.js
│   │   └── ui.js
│   │
│   ├── background/
│   │   └── service-worker.js
│   │
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   │
│   ├── processing/
│   │   ├── zip.js
│   │   └── pdf.js
│   │
│   └── shared/
│       ├── constants.js
│       └── utils.js
│
├── vendor/
│   ├── jszip.min.js
│   └── jspdf.min.js
│
├── icons/
│
└── README.md

This is only an example.

Choose the simplest architecture that satisfies the requirements.

==================================================
50. MANIFEST
============

Use Manifest V3.

Include only required permissions.

Do not add unnecessary permissions.

The manifest should clearly identify:

* extension name
* version
* description
* icons
* content scripts
* background service worker if needed
* permissions
* host permissions
* web-accessible resources if genuinely needed

==================================================
51. NO INLINE REMOTE DEPENDENCIES
=================================

Do not do:

<script src="https://cdn.example.com/library.js"></script>

Do not do:

import("https://...")

Do not send processing to an external service.

All dependencies must be local.

==================================================
52. ZIP LIBRARY
===============

If using JSZip:

Bundle it locally.

Do not fetch it from a CDN.

Create a clean abstraction around ZIP generation so the rest of the application does not depend directly on JSZip internals.

For example:

createZip(images)

should return a Blob or equivalent downloadable result.

==================================================
53. PDF LIBRARY
===============

If using jsPDF:

Bundle it locally.

Create a clean abstraction:

createPdf(images)

The rest of the application should not need to know the internals of jsPDF.

==================================================
54. DO NOT MODIFY THE ORIGINAL FACEBOOK PAGE MORE THAN NECESSARY
================================================================

The extension should be minimally invasive.

Do not:

* replace Facebook's CSS
* modify Facebook's page structure unnecessarily
* hide Facebook UI
* inject huge amounts of DOM
* interfere with normal Facebook functionality

Only add the necessary action/UI.

==================================================
55. CLEANUP
===========

When processing is complete:

* remove temporary UI
* revoke object URLs
* release temporary resources
* clear unnecessary arrays
* remove temporary DOM nodes

Do not leak memory over a long Facebook browsing session.

==================================================
56. ARCHITECTURAL PRIORITY
==========================

Prioritize:

1. Correct post detection
2. Correct image ownership
3. Reliable image retrieval
4. Local processing
5. Correct ZIP/PDF generation
6. Good UX
7. Performance
8. Maintainability

Do not prioritize visual polish over extraction correctness.

==================================================
57. DO NOT PRETEND SOMETHING WORKS
==================================

This is extremely important.

If a technical limitation prevents a feature from working reliably, tell me.

Do NOT:

* fake successful downloads
* generate empty PDFs
* pretend a thumbnail is the original
* silently download the wrong image
* claim CORS is solved without testing
* claim all Facebook posts are supported without testing
* hardcode assumptions that were not verified

If something is uncertain:

1. identify the uncertainty
2. create a small experiment
3. test it
4. document the result
5. implement based on the result

==================================================
58. DEVELOPMENT PHASES
======================

Build the extension in phases.

PHASE 1 — DOM RESEARCH

Analyze the supplied evidence.

Determine:

* post structure
* menu structure
* media structure
* stable attributes
* possible selectors
* post boundaries
* image ownership

Output a short technical analysis before proceeding.

PHASE 2 — POST DETECTION

Implement:

findPostContainer()

and test it on supplied examples.

PHASE 3 — UI INJECTION

Inject:

Download images

into the correct location.

Verify that the action is attached to the correct post.

PHASE 4 — IMAGE EXTRACTION

Implement:

extractPostImages(postElement)

Return structured objects such as:

{
url: "...",
type: "image/jpeg",
width: 2048,
height: 1365,
source: "..."
}

Do not immediately create ZIP/PDF.

First verify extraction.

PHASE 5 — IMAGE FETCH PROOF OF CONCEPT

Take one extracted URL.

Fetch it.

Convert to Blob.

Verify that the browser can process it locally.

PHASE 6 — ZIP

Implement ZIP generation.

PHASE 7 — PDF

Implement PDF generation.

PHASE 8 — PROGRESS + ERROR HANDLING

Add user-facing progress and errors.

PHASE 9 — PERFORMANCE

Optimize MutationObserver and extraction.

PHASE 10 — FINAL CLEANUP

Remove development-only logging and polish the code.

==================================================
59. DATA FLOW
=============

The intended architecture should conceptually look like:

Facebook DOM
|
v
Post detector
|
v
Exact post element
|
v
Media detector
|
v
Candidate images
|
v
Image validation
|
v
Best available image URLs
|
v
Local image retrieval
|
v
Blobs
|
+----------------+
|                |
v                v
ZIP              PDF
|                |
+--------+-------+
|
v
local browser download

```

==================================================
60. IMAGE OBJECT MODEL
==================================================

Use a structured representation internally.

For example:

{
    index: 1,
    url: "...",
    originalUrl: "...",
    mimeType: "image/jpeg",
    extension: "jpg",
    width: 2048,
    height: 1365,
    sourceElement: ...
}

You may change this structure if you have a better design.

Do not store DOM elements in long-lived objects unless necessary.

==================================================
61. USER EXPERIENCE FLOW
==================================================

Recommended flow:

User clicks:

Download images

↓

Small modal/dialog:

Download images from this post

Found 6 images

Choose format:

[ ZIP ]
[ PDF ]

[ Cancel ]

↓

User chooses ZIP

↓

Downloading images...

3 / 6

↓

Creating ZIP...

↓

Download starts.

For PDF:

Downloading images...

6 / 6

↓

Creating PDF...

↓

Download starts.

Keep this fast and simple.

==================================================
62. FORMAT CHOICE UI
==================================================

The format selector should clearly explain the difference.

Example:

ZIP
"Downloads every image as a separate file."

PDF
"Places every image on its own PDF page."

Do not overwhelm the user with technical information.

==================================================
63. POST TITLE / FILENAME
==================================================

If you can safely derive useful information such as:

- page name
- poster name
- date

you may use it for filenames.

But this is optional.

Do not make filename generation dependent on complex Facebook text parsing.

A safe default is:

facebook-images-2026-09-12.zip

or:

facebook-images.pdf

If generating a timestamp, use the local browser time.

==================================================
64. CODE QUALITY
==================================================

Write production-quality JavaScript.

Use:

- clear names
- small functions
- comments for tricky Facebook-specific logic
- defensive checks
- consistent error handling
- no unnecessary global variables

Avoid:

- giant functions
- duplicate code
- magic numbers
- unnecessary dependencies
- dead code
- excessive abstraction

==================================================
65. FACEBOOK-SPECIFIC CODE SHOULD BE ISOLATED
==================================================

Try to isolate Facebook-specific DOM assumptions.

For example:

facebook/
    post-detector.js
    menu-detector.js
    media-detector.js
    image-resolver.js

Then the ZIP/PDF system should not care that the images came from Facebook.

This will make future maintenance easier if Facebook changes its DOM.

==================================================
66. FUTURE MAINTAINABILITY
==================================================

Assume Facebook may change its DOM.

Make it easy to update:

- selectors
- detection heuristics
- image extraction logic

without rewriting the entire application.

Put Facebook-specific selectors and detection rules in a clearly identifiable place.

==================================================
67. README
==================================================

Create a complete README explaining:

- what the extension does
- privacy model
- installation
- loading unpacked extension in Chrome
- development workflow
- architecture
- permissions
- how image detection works
- how ZIP generation works
- how PDF generation works
- known limitations
- Facebook DOM maintenance considerations
- troubleshooting
- testing procedure

==================================================
68. INSTALLATION
==================================================

The final project should be loadable through:

Chrome
→ Extensions
→ Developer mode
→ Load unpacked

Do not require a server to run the extension.

==================================================
69. NO BACKEND
==================================================

Before finalizing, verify that the project contains absolutely no backend requirement.

There should be no:

Node server
PHP server
Python server
Express server
API endpoint
database
cloud function

The extension should operate independently.

==================================================
70. FINAL VALIDATION
==================================================

Before considering the task complete, verify:

[ ] Manifest V3
[ ] No backend
[ ] No external API
[ ] No analytics
[ ] No image upload
[ ] All libraries local
[ ] Facebook post action appears
[ ] Dynamic posts are detected
[ ] Duplicate actions are prevented
[ ] Exact post is identified
[ ] Images are scoped to exact post
[ ] Avatar is excluded
[ ] UI icons are excluded
[ ] Video thumbnails are excluded where appropriate
[ ] Duplicate images are deduplicated
[ ] Best available image URL is selected
[ ] Image fetching actually works
[ ] ZIP works
[ ] PDF works
[ ] Multiple image orientations work
[ ] Progress UI works
[ ] Errors are handled
[ ] Object URLs are cleaned up
[ ] Permissions are minimal
[ ] README exists
[ ] Debug mode exists during development
[ ] Production logging is clean

==================================================
71. IMPORTANT DELIVERABLE
==================================================

Do not only give me a conceptual explanation.

I want the actual complete extension source code.

The final deliverable should include all necessary files.

Do not leave:

TODO

"implement later"

"you can add this"

or pseudo-code

for any core feature.

The extension should be usable after loading it into Chrome.

==================================================
72. IF A REQUIREMENT IS TECHNICALLY IMPOSSIBLE
==================================================

If one of my requirements cannot reliably be implemented due to Chrome Extension restrictions, Facebook behavior, CORS, browser security, or another technical limitation:

DO NOT silently substitute a fake solution.

Instead:

1. Explain the limitation.
2. Explain exactly where it occurs.
3. Determine whether an MV3-supported alternative exists.
4. Test the alternative.
5. Implement the best legitimate solution.
6. Document the limitation.

==================================================
73. FIRST RESPONSE BEFORE CODING
==================================================

Before writing the full implementation, inspect all supplied evidence and give me:

A. DOM findings

B. Post detection strategy

C. Menu injection strategy

D. Image detection strategy

E. High-resolution URL strategy

F. Image fetching strategy

G. CORS/security considerations

H. ZIP strategy

I. PDF strategy

J. Extension architecture

K. Required permissions

L. Known limitations

M. Testing plan

Then proceed with implementation.

Do not spend the entire response explaining obvious concepts.

The goal is to actually build the extension.

==================================================
74. MOST IMPORTANT PRINCIPLES
==================================================

Remember these principles throughout implementation:

1. Exact post scope is more important than convenience.

2. Never globally scrape all images on the page.

3. Never depend entirely on generated Facebook CSS classes.

4. Never upload user images.

5. Never use a backend.

6. Never use Facebook private APIs.

7. Verify image fetching before building the ZIP/PDF pipeline.

8. Use locally bundled libraries.

9. Handle Facebook's dynamic DOM.

10. Do not pretend unsupported behavior works.

11. Keep Facebook-specific code isolated.

12. Make the extension maintainable when Facebook changes its DOM.

13. Prefer correctness over cleverness.

14. Prefer simple architecture over unnecessary frameworks.

15. Keep the user's images entirely inside the user's browser.

==================================================
75. EVIDENCE FILES
==================================================

The resources attached alongside this prompt are part of the specification.

You should inspect all of them.

Some may represent:

- real Facebook post DOM
- single-image post
- multi-image post
- no-image post
- Facebook menu
- image viewer
- image URLs
- srcset examples
- screenshots
- browser inspection results

Use them to build the implementation.

Again:

The evidence is authoritative for understanding the observed behavior, but DO NOT assume the exact Facebook CSS class names are permanent.

==================================================
FINAL GOAL
==================================================

Build a polished, reliable, privacy-first Chrome Extension that gives the user a simple way to do:

Facebook post
    ↓
Download images
    ↓
Choose ZIP or PDF
    ↓
Everything processed locally
    ↓
File downloaded to user's computer

No server.
No backend.
No upload.
No external processing.

The user should be able to install the extension, open Facebook, find a post, click the new action, choose ZIP/PDF, and receive the resulting file locally.
```

---

## What I recommend you collect alongside that prompt

Don't just throw random screenshots at the agent. Make a small **evidence pack**.

### A. Screenshots

Collect at least:

1. Single-image Facebook post
2. Multi-image Facebook post
3. Post with 4+ images
4. Post with no image
5. Post with profile/avatar + actual image
6. Facebook three-dot menu opened
7. Facebook image viewer
8. Two adjacent posts

The **two adjacent posts** screenshot is especially useful because it demonstrates the scope problem.

---

### B. DOM captures

For each of these, use Chrome DevTools → Inspect and save/copy the relevant HTML:

```text
01-single-image-post.html
02-multi-image-post.html
03-no-image-post.html
04-adjacent-posts.html
05-menu-open.html
06-image-viewer.html
```

You don't need to give the agent the entire Facebook page HTML. **The relevant post subtree is much better.**

---

### C. Image information

For the multi-image post, record things like:

```text
Image 1:
src:
srcset:
parent:
href:

Image 2:
src:
srcset:
parent:
href:
```

You don't necessarily have to manually organize this if your DevTools capture already contains it—the agent can inspect the HTML.

---

### D. One very useful thing: screenshots with DevTools open

I'd capture something like:

```text
┌─────────────────────────────┬──────────────────────┐
│                             │ Chrome DevTools      │
│ Facebook post               │                      │
│                             │ <div ...>            │
│          [IMAGE]            │   <img ...>          │
│                             │   <img ...>          │
│                             │ </div>               │
└─────────────────────────────┴──────────────────────┘
```

That gives the agent a visual ↔ DOM relationship.

---

## One thing I would NOT do

Don't spend hours trying to discover the "correct Facebook class name."

For example, don't come to the agent with:

```text
Post = div.x1abcd123.x9xyz
Menu = div.x7blahblah
Image = img.x8something
```

and expect that to be the solution.

Those classes can change.

The useful information is more like:

```text
This button is inside the post header.

This post container contains the media container.

The actual photos are linked in these anchors.

The author's avatar is also an img, but it is in the header and therefore isn't part of the media container.

The post menu and media container share this ancestor.
```

**That structural information is gold.**

---

## And one important technical warning

The hardest part of your project probably **isn't ZIP or PDF generation**.

Those are relatively straightforward.

The difficult chain is:

**Facebook post → exact post DOM → correct media → highest-quality URL → browser can actually fetch it → Blob → local processing**

Especially:

> **"The image is visible in Facebook, therefore my extension can fetch the image."**

That assumption needs to be tested.

So I'd actually tell your coding agent to make the **first milestone extremely small**:

> "Before building the UI, ZIP, PDF, or anything else, prove that you can click an action attached to a real Facebook post, identify that exact post, find exactly one of its actual attached photos, fetch that photo into a Blob inside the extension, and display/log its byte size."

Once that works, the rest becomes much more predictable.

If you give the agent the master prompt **plus a good evidence pack**, it should have enough context to do the actual engineering rather than guessing what Facebook's DOM looks like.
