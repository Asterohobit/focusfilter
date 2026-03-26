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