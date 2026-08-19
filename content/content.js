(() => {
  "use strict";
  if (window.top !== window) return;

  const DEFAULTS = { enabled: true, cooldownSeconds: 10, allowBypass: false };
  const settings = Object.assign({}, DEFAULTS);

  const PAY_URL_RE = /pay\.bilibili\.com|api\.money\.bilibili\.com/;
  const TEXT_RE = /充值|开通|购买|立即支付|确认支付|去支付|付费|打赏|充电|送礼物|送礼|上舰|舰长|提督|总督|应援|众筹|月卡|大会员|超级会员/;
  const CLASS_RE = /pay-tools|pay-widget|recharge|purchase|open-vip|buy-vip|vip-pay|charge-panel|pay-panel/;

  let overlay = null;
  let pendingEl = null;
  let bypassOnce = false;

  function loadSettings() {
    chrome.storage.sync.get(DEFAULTS, (items) => {
      Object.assign(settings, items);
    });
  }
  loadSettings();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const key of Object.keys(DEFAULTS)) {
      if (changes[key]) settings[key] = changes[key].newValue;
    }
  });

  function isPaymentUrl(url) {
    return typeof url === "string" && PAY_URL_RE.test(url);
  }

  function ownText(el) {
    let txt = "";
    for (const child of el.childNodes) {
      if (child.nodeType === 3) txt += child.nodeValue;
    }
    return txt.replace(/\s+/g, "");
  }

  function matches(el) {
    if (!el || el.nodeType !== 1) return false;
    const attrs = (el.className || "") + " " + (el.id || "");
    if (CLASS_RE.test(attrs)) return true;
    const get = (name) => (el.getAttribute ? el.getAttribute(name) : null);
    const href = get("href");
    if (href && isPaymentUrl(href)) return true;
    const aria = get("aria-label") || "";
    if (aria && TEXT_RE.test(aria)) return true;
    const title = get("title") || "";
    if (title && TEXT_RE.test(title)) return true;
    const own = ownText(el);
    if (own && own.length <= 10 && TEXT_RE.test(own)) return true;
    const tag = el.tagName;
    if (tag === "BUTTON" || tag === "A" || (el.getAttribute && el.getAttribute("role") === "button")) {
      const full = (el.textContent || "").replace(/\s+/g, "");
      if (full && TEXT_RE.test(full)) return true;
    }
    return false;
  }

  function findPayTarget(target) {
    let node = target;
    for (let i = 0; i < 7 && node; i++, node = node.parentElement) {
      if (matches(node)) return node;
    }
    return null;
  }

  function dismiss() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    pendingEl = null;
  }

  function continueAnyway() {
    const el = pendingEl;
    dismiss();
    if (!el) return;
    if (settings.allowBypass) {
      try {
        chrome.runtime.sendMessage({ type: "stopPayBypass", seconds: 60 });
      } catch (e) {}
    }
    bypassOnce = true;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    el.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
      })
    );
  }

  function showOverlay() {
    if (overlay) return;
    const sec = Math.max(0, Number(settings.cooldownSeconds) || 0);
    const continueBtnHtml = settings.allowBypass
      ? '<button class="stop-pay-continue" disabled>仍然要支付</button>'
      : "";
    overlay = document.createElement("div");
    overlay.id = "stop-pay-overlay";
    overlay.innerHTML =
      '<div class="stop-pay-card">' +
      '<div class="stop-pay-badge">¥</div>' +
      "<h2>等一下，先别付款</h2>" +
      "<p>「Stop Pay」已拦截本次付费操作</p>" +
      "<ul>" +
      "<li>这笔钱真的 <b>非花不可</b> 吗？</li>" +
      "<li>冷静 " + sec + " 秒，过后你还想要吗？</li>" +
      "<li>省下来的钱，始终属于你自己。</li>" +
      "</ul>" +
      '<div class="stop-pay-count">' + sec + "</div>" +
      '<div class="stop-pay-buttons">' +
      '<button class="stop-pay-cancel" disabled>放弃支付</button>' +
      continueBtnHtml +
      "</div>" +
      "</div>";
    (document.body || document.documentElement).appendChild(overlay);

    const countEl = overlay.querySelector(".stop-pay-count");
    const cancelBtn = overlay.querySelector(".stop-pay-cancel");
    const continueBtn = overlay.querySelector(".stop-pay-continue");

    let left = sec;
    const timer = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        countEl.textContent = "0";
        cancelBtn.disabled = false;
        if (continueBtn) continueBtn.disabled = false;
        return;
      }
      countEl.textContent = String(left);
    }, 1000);

    cancelBtn.addEventListener("click", dismiss);
    if (continueBtn) continueBtn.addEventListener("click", continueAnyway);
  }

  function block(e) {
    if (!settings.enabled) return;
    if (bypassOnce) {
      bypassOnce = false;
      return;
    }
    const target = e.composedPath ? e.composedPath()[0] : e.target;
    const el = findPayTarget(target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    pendingEl = el;
    showOverlay();
  }

  document.addEventListener("click", block, true);
  document.addEventListener("auxclick", block, true);
  document.addEventListener("pointerdown", block, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay) dismiss();
  });

  const nativeOpen = window.open;
  if (typeof nativeOpen === "function") {
    window.open = function (url) {
      if (settings.enabled && isPaymentUrl(url)) {
        showOverlay();
        return null;
      }
      return nativeOpen.apply(window, arguments);
    };
  }

  const observer = new MutationObserver((mutations) => {
    if (!settings.enabled || overlay) return;
    for (const m of mutations) {
      if (m.type === "attributes" && m.target && m.target.tagName === "IFRAME") {
        const src = m.target.src || m.target.getAttribute("src") || "";
        if (isPaymentUrl(src)) {
          m.target.remove();
          showOverlay();
          return;
        }
        continue;
      }
      for (const node of m.addedNodes) {
        if (!node || node.nodeType !== 1) continue;
        const frames = node.matches && node.matches("iframe")
          ? [node]
          : node.querySelectorAll
            ? Array.from(node.querySelectorAll("iframe"))
            : [];
        for (const f of frames) {
          const src = f.src || f.getAttribute("src") || "";
          if (isPaymentUrl(src)) {
            f.remove();
            showOverlay();
            return;
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributeFilter: ["src"]
  });
})();
