// To use this file, include it in manifest.json under "content_scripts" with:
// "js": ["content.js"],
// A function to find and remove elements
function removeAnnoyingElements() {
    // Example: Removing anything with the word "Shorts" in its aria-label
    const shortsElements = document.querySelectorAll('[aria-label*="Shorts"]');
    shortsElements.forEach(el => {
        // We go up the DOM tree to hide the whole container, not just the text
        const container = el.closest('ytd-rich-item-renderer');
        if (container) {
            container.style.display = 'none';
        }
    });
}

// 1. Run once immediately just in case
removeAnnoyingElements();

// 2. Set up a MutationObserver to watch for new elements loading in
const observer = new MutationObserver((mutations) => {
    // Whenever the DOM changes, run our cleanup function
    removeAnnoyingElements();
});

// Start observing the entire body of the webpage for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

const STYLE_ID = 'focusfilter-css';

const CSS = `
  a[title="Shorts"] { display: none !important; }
  ytd-rich-shelf-renderer[is-shorts] { display: none !important; }
  grid-shelf-view-model { display: none !important; }
  ytd-two-column-browse-results-renderer[page-subtype="home"] { display: none !important; }
  div[class="ytp-fullscreen-grid-stills-container"] { display: none !important; }
  div[id="secondary"][class="style-scope ytd-watch-flexy"] { display: none !important; }
  yt-tab-shape[tab-title="Shorts"] { display: none !important; }
  ytd-rich-item-renderer[is-shorts-grid] { display: none !important; }
  ytd-reel-shelf-renderer { display: none !important; }
  ytm-shorts-lockup-view-model { display: none !important; }
  ytm-shorts-lockup-view-model-v2 { display: none !important; }
`;

function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

function removeCSS() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
}

// 3. Listen for on/off message from the popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'FF_TOGGLE') return;
    if (msg.enabled) {
        injectCSS();
        observer.observe(document.body, { childList: true, subtree: true });
        removeAnnoyingElements();
    } else {
        removeCSS();
        observer.disconnect();
    }
});

// Boot: apply CSS based on stored state
chrome.storage.sync.get({ enabled: true }, (s) => {
    if (s.enabled) injectCSS();
});