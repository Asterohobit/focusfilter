const SITE_DEFS = [
  {
    id: "youtube",
    label: "YouTube",
    sectionTitle: "YouTube Rules",
    features: [
      {
        id: "YT_SHORTS",
        label: "Hide Shorts surfaces",
        description: "Navigation, shelves, and related Shorts elements",
        defaultEnabled: true,
      },
      {
        id: "YT_VIDEO_SIDEBAR",
        label: "Hide video sidebar",
        description: "Recommended videos on the watch page",
        defaultEnabled: true,
      },
      {
        id: "YT_HOMESCREEN",
        label: "Hide home recommendations",
        description: "Home feed recommendations",
        defaultEnabled: true,
      },
      {
        id: "YT_SUBSCRIPTIONS_HIDE",
        label: "Hide subscriptions",
        description: "Remove all subscription related elements",
        defaultEnabled: false,
      },
      {
        id: "YT_SUBSCRIPTIONS_FEED_HIDE",
        label: "Hide subscriptions feed",
        description: "Only subscriptions feed",
        defaultEnabled: false,
      },
      {
        id: "YT_VIDEO_ENDCARD",
        label: "Hide recommendations on video end screen",
        description: "Recommended videos at the end of a video",
        defaultEnabled: false,
      },
      {
        id: "YT_SHORTS_NEXT_SHORT",
        label: "Disable Shorts scrolling",
        description: "Hide the subsequent Shorts",
        defaultEnabled: false,
      },
      {
        id: "YT_DISABLE_AUTOPLAY",
        label: "Disable autoplay",
        description: "Prevent automatically playing next video",
        defaultEnabled: false,
      },
      {
        id: "YT_COMMENTS_DISABLE",
        label: "Hide comments",
        description: "Comments section on the watch page",
        defaultEnabled: false,
      },
      {
        id: "GRAYSCALE",
        label: "Grayscale site",
        description: "Render the site in black and white",
        defaultEnabled: false,
      },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    sectionTitle: "Instagram Rules",
    features: [
      {
        id: "INSTA_HIDE_ADS_HOMEFEED",
        label: "Hide ads in home feed",
        description: "Articles containing ad marker links",
        defaultEnabled: true,
      },
      {
        id: "INSTA_HIDE_REELS_BUTTON",
        label: "Hide Reels button",
        description: "Reels navigation button in the sidebar",
        defaultEnabled: true,
      },
      {
        id: "INSTA_HIDE_EXPLORE_BUTTON",
        label: "Hide Explore button",
        description: "Explore navigation button in the sidebar",
        defaultEnabled: true,
      },
      {
        id: "GRAYSCALE",
        label: "Grayscale site",
        description: "Render the site in black and white",
        defaultEnabled: false,
      },
    ],
  },
];

const SITE_DEFAULT_ID = "youtube";

const defaults = {
  globalEnabled: true,
  customRulesEnabled: true,
  customRulesText: "",
  sites: SITE_DEFS.reduce((siteAcc, site) => {
    siteAcc[site.id] = {
      features: site.features.reduce((featureAcc, feature) => {
        featureAcc[feature.id] = feature.defaultEnabled;
        return featureAcc;
      }, {}),
    };
    return siteAcc;
  }, {}),
};
const SETTINGS_VERSION_KEY = "settingsVersion";
const CURRENT_SETTINGS_VERSION = chrome.runtime.getManifest().version;
const MAX_CUSTOM_RULES_TEXT_LENGTH = 1000;

const masterToggle = document.getElementById("master-toggle");
const siteSelect = document.getElementById("site-select");
const siteSectionTitle = document.getElementById("site-section-title");
const featureRows = document.getElementById("feature-rows");
const customRulesToggle = document.getElementById("custom-rules-toggle");
const customRulesStatus = document.getElementById("custom-rules-status");
const customRulesInput = document.getElementById("custom-rules-input");
const customRulesUpdate = document.getElementById("custom-rules-update");

let state = {
  globalEnabled: defaults.globalEnabled,
  customRulesEnabled: defaults.customRulesEnabled,
  customRulesText: defaults.customRulesText,
  sites: cloneSites(defaults.sites),
};
let selectedSiteId = SITE_DEFAULT_ID;

function cloneSites(sourceSites) {
  return SITE_DEFS.reduce((siteAcc, site) => {
    const sourceSite =
      sourceSites && sourceSites[site.id] ? sourceSites[site.id] : {};
    const sourceFeatures = sourceSite.features || {};

    siteAcc[site.id] = {
      features: site.features.reduce((featureAcc, feature) => {
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

function getSiteDefinition(siteId) {
  return SITE_DEFS.find((site) => site.id === siteId) || SITE_DEFS[0];
}

function normalizeSiteId(siteId) {
  return SITE_DEFS.some((site) => site.id === siteId)
    ? siteId
    : SITE_DEFAULT_ID;
}

function detectSiteFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) {
      return "instagram";
    }
    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      return "youtube";
    }
  } catch {
    return SITE_DEFAULT_ID;
  }

  return SITE_DEFAULT_ID;
}

function detectCurrentSite(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab || typeof tab.url !== "string") {
      callback(SITE_DEFAULT_ID);
      return;
    }

    callback(detectSiteFromUrl(tab.url));
  });
}

function getSelectedSiteFeatures() {
  const siteState =
    state.sites[selectedSiteId] || defaults.sites[SITE_DEFAULT_ID];
  return siteState.features;
}

function clampCustomRulesText(text) {
  return typeof text === "string"
    ? text.slice(0, MAX_CUSTOM_RULES_TEXT_LENGTH)
    : "";
}

function countCustomRules(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
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
    customRulesText: clampCustomRulesText(
      typeof incoming.customRulesText === "string"
        ? incoming.customRulesText
        : defaults.customRulesText,
    ),
    sites: cloneSites(defaults.sites),
  };

  const sourceSites = incoming.sites || {};
  SITE_DEFS.forEach((site) => {
    const sourceFeatures =
      sourceSites[site.id]?.features ||
      (site.id === SITE_DEFAULT_ID ? incoming.features || {} : {});
    site.features.forEach((feature) => {
      if (typeof sourceFeatures[feature.id] === "boolean") {
        next.sites[site.id].features[feature.id] = sourceFeatures[feature.id];
      }
    });
  });

  return next;
}

function saveAndBroadcast() {
  state.customRulesText = clampCustomRulesText(state.customRulesText);
  chrome.storage.sync.set(
    { ...state, [SETTINGS_VERSION_KEY]: CURRENT_SETTINGS_VERSION },
    () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab || typeof tab.id !== "number") return;
        chrome.tabs.sendMessage(
          tab.id,
          { type: "FF_STATE_UPDATE", state },
          () => {
            void chrome.runtime.lastError;
          },
        );
      });
    },
  );
}

function renderFeatureRows() {
  featureRows.textContent = "";
  const site = getSiteDefinition(selectedSiteId);

  site.features.forEach((feature) => {
    const row = document.createElement("div");
    row.className = "row";

    const textWrap = document.createElement("div");

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = feature.label;

    const status = document.createElement("div");
    status.className = "status";
    status.id = `status-${feature.id}`;
    status.textContent = feature.description;

    textWrap.appendChild(label);
    textWrap.appendChild(status);

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "tog";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `toggle-${site.id}-${feature.id}`;
    input.dataset.featureId = feature.id;

    const track = document.createElement("div");
    track.className = "track";

    toggleLabel.appendChild(input);
    toggleLabel.appendChild(track);

    row.appendChild(textWrap);
    row.appendChild(toggleLabel);
    featureRows.appendChild(row);

    input.addEventListener("change", () => {
      state.sites[selectedSiteId].features[feature.id] = input.checked;
      renderState();
      saveAndBroadcast();
    });
  });
}

function renderState() {
  masterToggle.checked = state.globalEnabled;

  const site = getSiteDefinition(selectedSiteId);

  if (siteSectionTitle) {
    siteSectionTitle.textContent = site.sectionTitle;
  }

  if (siteSelect && siteSelect.value !== selectedSiteId) {
    siteSelect.value = selectedSiteId;
  }

  if (customRulesToggle) {
    customRulesToggle.checked = state.customRulesEnabled;
    customRulesToggle.disabled = !state.globalEnabled;
  }

  if (customRulesStatus) {
    const ruleCount = countCustomRules(state.customRulesText);
    customRulesStatus.textContent =
      ruleCount > 0
        ? `${ruleCount} selector${ruleCount === 1 ? "" : "s"} saved`
        : "";
    if (!state.globalEnabled) {
      customRulesStatus.textContent = "Disabled by global switch";
    } else if (!state.customRulesEnabled) {
      customRulesStatus.textContent = "Disabled";
    } else {
      const ruleCount = countCustomRules(state.customRulesText);
      customRulesStatus.textContent =
        ruleCount > 0
          ? `${ruleCount} selector${ruleCount === 1 ? "" : "s"} saved`
          : "Enabled";
    }
  }

  if (customRulesInput && document.activeElement !== customRulesInput) {
    customRulesInput.value = state.customRulesText;
  }

  if (customRulesInput) {
    customRulesInput.disabled = !state.globalEnabled;
  }

  if (customRulesUpdate) {
    customRulesUpdate.disabled = !state.globalEnabled;
  }

  site.features.forEach((feature) => {
    const input = document.getElementById(`toggle-${site.id}-${feature.id}`);
    const status = document.getElementById(`status-${feature.id}`);
    if (!input || !status) return;

    input.checked = Boolean(getSelectedSiteFeatures()[feature.id]);
  });
}

function renderSiteOptions() {
  if (!siteSelect) return;

  siteSelect.textContent = "";

  SITE_DEFS.forEach((site) => {
    const option = document.createElement("option");
    option.value = site.id;
    option.textContent = site.label;
    siteSelect.appendChild(option);
  });

  siteSelect.value = selectedSiteId;
}

function updateSiteView() {
  renderFeatureRows();
  renderState();
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

if (siteSelect) {
  siteSelect.addEventListener("change", () => {
    selectedSiteId = normalizeSiteId(siteSelect.value);
    updateSiteView();
  });
}

masterToggle.addEventListener("change", () => {
  state.globalEnabled = masterToggle.checked;
  renderState();
  saveAndBroadcast();
});

if (customRulesToggle) {
  customRulesToggle.addEventListener("change", () => {
    state.customRulesEnabled = customRulesToggle.checked;
    renderState();
    saveAndBroadcast();
  });
}

if (customRulesUpdate) {
  customRulesUpdate.addEventListener("click", () => {
    if (customRulesInput) {
      state.customRulesText = clampCustomRulesText(customRulesInput.value);
    }
    renderState();
    saveAndBroadcast();
  });
}

renderSiteOptions();
renderFeatureRows();
detectCurrentSite((siteId) => {
  selectedSiteId = normalizeSiteId(siteId);
  renderSiteOptions();
  updateSiteView();
});
loadStateWithVersionReset((storedState) => {
  state = normalizeIncomingState(storedState);
  renderState();
});
