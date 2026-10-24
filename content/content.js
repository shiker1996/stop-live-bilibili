(() => {
  "use strict";

  const DEFAULTS = { enabled: true };
  const settings = { ...DEFAULTS };
  const LIVE_HOST = "live.bilibili.com";
  const CARD_SELECTOR = [
    ".bili-live-card",
    ".live-card",
    ".bili-video-card",
    ".feed-card",
    ".video-card",
    ".recommend-card",
    "[class*='live-card']"
  ].join(",");

  function loadSettings() {
    chrome.storage.sync.get(DEFAULTS, (items) => {
      Object.assign(settings, items);
      if (settings.enabled) scan(document);
      else restoreHiddenCards();
    });
  }

  function isLiveLink(anchor) {
    try {
      const hostname = new URL(anchor.href, location.href).hostname;
      return hostname === LIVE_HOST || hostname.endsWith(`.${LIVE_HOST}`);
    } catch (_) {
      return false;
    }
  }

  function cardFor(anchor) {
    const knownCard = anchor.closest(CARD_SELECTOR);
    if (knownCard) return knownCard;

    // Bilibili changes card class names from time to time. Fall back to a
    // nearby card-like wrapper that contains a thumbnail, without hiding a
    // whole page section or navigation container.
    let node = anchor.parentElement;
    for (let depth = 0; node && node !== document.body && depth < 7; depth += 1) {
      const classes = typeof node.className === "string" ? node.className : "";
      const looksLikeCard = /card|feed-item|recommend-item|live-item/i.test(classes);
      if (looksLikeCard && node.querySelector("img, picture, video")) return node;
      node = node.parentElement;
    }
    // Header navigation links do not live inside recommendation cards.
    // Hiding the link itself removes the entry without collapsing its header.
    return anchor;
  }

  function hideLink(anchor) {
    if (anchor.dataset.liveBlockHidden === "true") return;
    const card = cardFor(anchor);
    if (!card) return;
    card.dataset.liveBlockHidden = "true";
    card.dataset.liveBlockDisplay = card.style.display;
    card.style.setProperty("display", "none", "important");
  }

  function scan(root) {
    if (!settings.enabled || !root) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.matches("a[href]")) {
      if (isLiveLink(root)) hideLink(root);
    }
    if (root.querySelectorAll) {
      for (const anchor of root.querySelectorAll("a[href]")) {
        if (isLiveLink(anchor)) hideLink(anchor);
      }
    }
  }

  function restoreHiddenCards() {
    for (const card of document.querySelectorAll('[data-live-block-hidden="true"]')) {
      card.style.display = card.dataset.liveBlockDisplay || "";
      delete card.dataset.liveBlockHidden;
      delete card.dataset.liveBlockDisplay;
    }
  }

  function blockLiveNavigation(event) {
    if (!settings.enabled) return;
    const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
    const anchor = path.find((node) =>
      node && node.nodeType === Node.ELEMENT_NODE && node.matches("a[href]")
    );
    if (!anchor || !isLiveLink(anchor)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  document.addEventListener("click", blockLiveNavigation, true);
  document.addEventListener("auxclick", blockLiveNavigation, true);

  loadSettings();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.enabled) return;
    settings.enabled = changes.enabled.newValue;
    if (settings.enabled) scan(document);
    else restoreHiddenCards();
  });

  const observer = new MutationObserver((mutations) => {
    if (!settings.enabled) return;
    for (const mutation of mutations) {
      if (mutation.type === "attributes") scan(mutation.target);
      for (const node of mutation.addedNodes) scan(node);
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"]
  });
})();
