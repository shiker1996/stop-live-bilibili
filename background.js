const DEFAULT_RULES = [
  {
    id: 1,
    priority: 2,
    action: { type: "block" },
    condition: {
      urlFilter: "||pay.bilibili.com^",
      resourceTypes: [
        "main_frame",
        "sub_frame",
        "xmlhttprequest",
        "script",
        "image",
        "media",
        "font",
        "ping",
        "other"
      ]
    }
  },
  {
    id: 2,
    priority: 2,
    action: { type: "block" },
    condition: {
      urlFilter: "||api.money.bilibili.com^",
      requestMethods: ["post"],
      resourceTypes: ["xmlhttprequest", "other"]
    }
  }
];

const RULE_IDS = new Set(DEFAULT_RULES.map((r) => r.id));

async function applyRules(enabled) {
  try {
    const current = await chrome.declarativeNetRequest.getDynamicRules();
    const toRemove = current
      .filter((r) => RULE_IDS.has(r.id))
      .map((r) => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: toRemove,
      addRules: enabled ? DEFAULT_RULES : []
    });
  } catch (e) {
    console.error("[StopPay] applyRules failed:", e);
  }
}

async function syncRules() {
  const { enabled = true } = await chrome.storage.sync.get({ enabled: true });
  await applyRules(enabled);
}

chrome.runtime.onInstalled.addListener(() => {
  syncRules();
});

chrome.runtime.onStartup.addListener(() => {
  syncRules();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabled) {
    applyRules(changes.enabled.newValue);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "stopPayBypass") {
    const seconds = Number(msg.seconds) || 60;
    applyRules(false).then(() => {
      setTimeout(() => syncRules(), seconds * 1000);
      sendResponse({ ok: true });
    });
    return true;
  }
});
