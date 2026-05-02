const SITE_DEFS = {
  youtube: {
    featureDefs: [
      { id: "YT_SHORTS", defaultEnabled: true },
      { id: "YT_VIDEO_SIDEBAR", defaultEnabled: true },
      { id: "YT_HOMESCREEN", defaultEnabled: true },
      { id: "YT_VIDEO_ENDCARD", defaultEnabled: true },
      { id: "GRAYSCALE", defaultEnabled: false },
    ],
    ruleDefs: [
      { id: "yt-shorts-nav", keys: ["YT_SHORTS"], mode: "any" },
      {
        id: "yt-shorts-home-shelf",
        keys: ["YT_SHORTS", "YT_HOMESCREEN"],
        mode: "any",
      },
      { id: "yt-shorts-search-shelf", keys: ["YT_SHORTS"], mode: "any" },
      { id: "yt-shorts-search-tab", keys: ["YT_SHORTS"], mode: "any" },
      { id: "yt-search-filter-shorts", keys: ["YT_SHORTS"], mode: "any" },
      { id: "yt-home-feed", keys: ["YT_HOMESCREEN"], mode: "any" },
      { id: "yt-watch-endscreen", keys: ["YT_VIDEO_ENDCARD"], mode: "any" },
      { id: "yt-video-sidebar", keys: ["YT_VIDEO_SIDEBAR"], mode: "any" },
      { id: "yt-channel-shorts-tab", keys: ["YT_SHORTS"], mode: "any" },
      { id: "yt-channel-shorts-grid", keys: ["YT_SHORTS"], mode: "any" },
      { id: "yt-channel-shorts-shelf", keys: ["YT_SHORTS"], mode: "any" },
      { id: "yt-mobile-shorts-lockup", keys: ["YT_SHORTS"], mode: "any" },
    ],
  },
  instagram: {
    featureDefs: [
      { id: "INSTA_HIDE_ADS_HOMEFEED", defaultEnabled: true },
      { id: "INSTA_HIDE_REELS_BUTTON", defaultEnabled: true },
      { id: "INSTA_HIDE_EXPLORE_BUTTON", defaultEnabled: true },
      { id: "GRAYSCALE", defaultEnabled: false },
    ],
    ruleDefs: [
      {
        id: "insta-hide-ads-homefeed",
        keys: ["INSTA_HIDE_ADS_HOMEFEED"],
        mode: "any",
      },
      {
        id: "insta-hide-reels-button",
        keys: ["INSTA_HIDE_REELS_BUTTON"],
        mode: "any",
      },
      {
        id: "insta-hide-explore-button",
        keys: ["INSTA_HIDE_EXPLORE_BUTTON"],
        mode: "any",
      },
    ],
  },
};

const SITE_DEFAULT_ID = "youtube";
const INLINE_HIDE_ATTR = "data-ff-inline-hidden";
const CUSTOM_RULES_STYLE_ID = "ff-custom-rules-style";
const GRAYSCALE_STYLE_ID = "ff-grayscale-style";
const SETTINGS_VERSION_KEY = "settingsVersion";
const CURRENT_SETTINGS_VERSION = chrome.runtime.getManifest().version;
const defaults = {
  globalEnabled: true,
  customRulesEnabled: true,
  customRulesText: "",
  sites: Object.keys(SITE_DEFS).reduce((siteAcc, siteId) => {
    const site = SITE_DEFS[siteId];
    siteAcc[siteId] = {
      features: site.featureDefs.reduce((featureAcc, feature) => {
        featureAcc[feature.id] = feature.defaultEnabled;
        return featureAcc;
      }, {}),
    };
    return siteAcc;
  }, {}),
};

let state = {
  globalEnabled: defaults.globalEnabled,
  customRulesEnabled: defaults.customRulesEnabled,
  customRulesText: defaults.customRulesText,
  sites: cloneSites(defaults.sites),
};
let initialized = false;
let currentSiteId = SITE_DEFAULT_ID;

function cloneSites(sourceSites) {
  return Object.keys(SITE_DEFS).reduce((siteAcc, siteId) => {
    const site = SITE_DEFS[siteId];
    const sourceSite =
      sourceSites && sourceSites[siteId] ? sourceSites[siteId] : {};
    const sourceFeatures = sourceSite.features || {};

    siteAcc[siteId] = {
      features: site.featureDefs.reduce((featureAcc, feature) => {
        featureAcc[feature.id] =
          typeof sourceFeatures[feature.id] === "boolean"
            ? sourceFeatures[feature.id]
            : feature.defaultEnabled;
        return featureAcc;
      }, {}),
    };

    return siteAcc;
  }, {});
}

function isFeatureEnabled(featureKey) {
  const site = state.sites[currentSiteId] || defaults.sites[SITE_DEFAULT_ID];
  return Boolean(site.features[featureKey]);
}

function getCurrentSiteId() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
    return "instagram";
  }
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    return "youtube";
  }

  return SITE_DEFAULT_ID;
}

const observer = new MutationObserver(() => {
  applyDynamicRules();
});

let isObserverRunning = false;

// Evaluates a rule based on its keys and mode. For 'all' mode, all keys must be enabled. For 'any' mode, at least one key must be enabled.
function evaluateRule(rule) {
  if (!state.globalEnabled || !rule.keys.length) return false;
  if (rule.mode === "all") {
    return rule.keys.every(isFeatureEnabled);
  }
  return rule.keys.some(isFeatureEnabled);
}

function setRootAttr(name, enabled) {
  if (enabled) {
    document.documentElement.setAttribute(name, "1");
    return;
  }
  document.documentElement.removeAttribute(name);
}

function applyRuleAttributes() {
  setRootAttr("data-ff-global", state.globalEnabled);

  const site = SITE_DEFS[currentSiteId] || SITE_DEFS[SITE_DEFAULT_ID];

  site.featureDefs.forEach((feature) => {
    setRootAttr(
      `data-ff-feature-${feature.id.toLowerCase()}`,
      state.globalEnabled && isFeatureEnabled(feature.id),
    );
  });

  site.ruleDefs.forEach((rule) => {
    setRootAttr(`data-ff-rule-${rule.id}`, evaluateRule(rule));
  });
}

function getCustomRuleSelectors(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((selector) => {
      try {
        document.querySelector(selector);
        return true;
      } catch {
        return false;
      }
    });
}

function removeCustomRulesStyle() {
  const existingStyle = document.getElementById(CUSTOM_RULES_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
}

function applyCustomRulesStyle() {
  removeCustomRulesStyle();

  if (!state.globalEnabled || !state.customRulesEnabled) return;

  const selectors = getCustomRuleSelectors(state.customRulesText);
  if (!selectors.length) return;

  const style = document.createElement("style");
  style.id = CUSTOM_RULES_STYLE_ID;
  style.textContent = selectors
    .map((selector) => `${selector} { display: none !important; }`)
    .join("\n");
  (document.head || document.documentElement).appendChild(style);
}

function removeGrayscaleStyle() {
  const existing = document.getElementById(GRAYSCALE_STYLE_ID);
  if (existing) {
    existing.remove();
  }
}

function applyGrayscaleStyle() {
  removeGrayscaleStyle();
  if (!state.globalEnabled) return;
  if (!isFeatureEnabled("GRAYSCALE")) return;

  const style = document.createElement("style");
  style.id = GRAYSCALE_STYLE_ID;
  style.textContent = `
        html {
            filter: grayscale(100%) !important;
        }
    `;
  (document.head || document.documentElement).appendChild(style);
}

// Hides Shorts elements that may not be covered by CSS rules, based on their aria-label. This is necessary because some Shorts elements are rendered in a way that makes them difficult to target with CSS alone. By using an inline style, we can ensure they are hidden regardless of their position in the DOM or how they are rendered.
function hideShortsByAriaLabel() {
  document.querySelectorAll('[aria-label*="Shorts"]').forEach((el) => {
    const container = el.closest("ytd-rich-item-renderer");
    if (!container || container.hasAttribute(INLINE_HIDE_ATTR)) return;
    container.setAttribute(INLINE_HIDE_ATTR, "1");
    container.style.display = "none";
  });
}

// Hides the Shorts search chip by checking the chip label text instead of the tag name.
function hideShortsChipByLabel() {
  document.querySelectorAll("yt-chip-cloud-chip-renderer").forEach((chip) => {
    if (chip.hasAttribute(INLINE_HIDE_ATTR)) return;

    const label = chip.textContent ? chip.textContent.trim() : "";
    if (label !== "Shorts") return;

    chip.setAttribute(INLINE_HIDE_ATTR, "1");
    chip.style.display = "none";
  });
}

// Hides the Shorts search filter chip by matching the visible label text.
function hideSearchFilterShortsByLabel() {
  document.querySelectorAll("ytd-search-filter-renderer").forEach((filter) => {
    if (filter.hasAttribute(INLINE_HIDE_ATTR)) return;

    const label = filter.textContent ? filter.textContent.trim() : "";
    if (label !== "Shorts") return;

    filter.setAttribute(INLINE_HIDE_ATTR, "1");
    filter.style.display = "none";
  });
}

function restoreInlineHiddenElements() {
  document.querySelectorAll(`[${INLINE_HIDE_ATTR}]`).forEach((el) => {
    el.removeAttribute(INLINE_HIDE_ATTR);
    el.style.display = "";
  });
}

function shouldRunDynamicShortsCleanup() {
  return (
    currentSiteId === "youtube" &&
    state.globalEnabled &&
    isFeatureEnabled("YT_SHORTS")
  );
}

function applyDynamicRules() {
  if (shouldRunDynamicShortsCleanup()) {
    hideShortsByAriaLabel();
    hideShortsChipByLabel();
    hideSearchFilterShortsByLabel();
    return;
  }
  restoreInlineHiddenElements();
}

function updateObserverState() {
  const shouldRun = shouldRunDynamicShortsCleanup();
  if (!shouldRun && isObserverRunning) {
    observer.disconnect();
    isObserverRunning = false;
    return;
  }
  if (shouldRun && !isObserverRunning) {
    observer.observe(document.body, { childList: true, subtree: true });
    isObserverRunning = true;
  }
}

function normalizeIncomingState(incoming) {
  const next = {
    globalEnabled:
      typeof incoming.globalEnabled === "boolean"
        ? incoming.globalEnabled
        : defaults.globalEnabled,
    customRulesEnabled:
      typeof incoming.customRulesEnabled === "boolean"
        ? incoming.customRulesEnabled
        : defaults.customRulesEnabled,
    customRulesText:
      typeof incoming.customRulesText === "string"
        ? incoming.customRulesText
        : defaults.customRulesText,
    sites: cloneSites(defaults.sites),
  };

  const sourceSites = incoming.sites || {};
  Object.keys(SITE_DEFS).forEach((siteId) => {
    const site = SITE_DEFS[siteId];
    const sourceFeatures =
      sourceSites[siteId]?.features ||
      (siteId === SITE_DEFAULT_ID ? incoming.features || {} : {});

    site.featureDefs.forEach((feature) => {
      if (typeof sourceFeatures[feature.id] === "boolean") {
        next.sites[siteId].features[feature.id] = sourceFeatures[feature.id];
      }
    });
  });

  return next;
}

function applyState(nextState) {
  state = normalizeIncomingState(nextState);
  currentSiteId = getCurrentSiteId();
  applyRuleAttributes();
  applyCustomRulesStyle();
  applyGrayscaleStyle();
  applyDynamicRules();
  if (document.body) {
    updateObserverState();
  }
}

function loadStateWithVersionReset(callback) {
  chrome.storage.sync.get(
    {
      globalEnabled: defaults.globalEnabled,
      customRulesEnabled: defaults.customRulesEnabled,
      customRulesText: defaults.customRulesText,
      sites: defaults.sites,
      [SETTINGS_VERSION_KEY]: "",
    },
    (stored) => {
      const storedVersion =
        typeof stored[SETTINGS_VERSION_KEY] === "string"
          ? stored[SETTINGS_VERSION_KEY]
          : "";
      if (storedVersion === CURRENT_SETTINGS_VERSION) {
        callback({
          globalEnabled: stored.globalEnabled,
          customRulesEnabled: stored.customRulesEnabled,
          customRulesText: stored.customRulesText,
          features: stored.features,
          sites: stored.sites,
        });
        return;
      }

      const resetState = {
        globalEnabled: defaults.globalEnabled,
        customRulesEnabled: defaults.customRulesEnabled,
        customRulesText: defaults.customRulesText,
        sites: cloneSites(defaults.sites),
        [SETTINGS_VERSION_KEY]: CURRENT_SETTINGS_VERSION,
      };

      chrome.storage.sync.set(resetState, () => {
        callback(resetState);
      });
    },
  );
}

function init() {
  if (initialized) return;
  initialized = true;

  loadStateWithVersionReset((storedState) => {
    applyState(storedState);
    if (!document.body) return;
    updateObserverState();
  });
}

document.addEventListener("DOMContentLoaded", init, { once: true });
if (document.readyState !== "loading") {
  init();
}

document.addEventListener("yt-navigate-finish", () => {
  applyDynamicRules();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  const hasRelevantChange =
    Object.prototype.hasOwnProperty.call(changes, "globalEnabled") ||
    Object.prototype.hasOwnProperty.call(changes, "customRulesEnabled") ||
    Object.prototype.hasOwnProperty.call(changes, "customRulesText") ||
    Object.prototype.hasOwnProperty.call(changes, "features") ||
    Object.prototype.hasOwnProperty.call(changes, "sites");
  if (!hasRelevantChange) return;

  chrome.storage.sync.get(
    {
      globalEnabled: defaults.globalEnabled,
      customRulesEnabled: defaults.customRulesEnabled,
      customRulesText: defaults.customRulesText,
      sites: defaults.sites,
    },
    (storedState) => {
      applyState(storedState);
    },
  );
});

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "FF_STATE_UPDATE" && msg.state) {
    applyState(msg.state);
  }
});
