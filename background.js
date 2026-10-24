const LIVE_RULE = {
  id: 3,
  priority: 1,
  action: { type: "block" },
  condition: {
    urlFilter: "||live.bilibili.com^",
    resourceTypes: ["main_frame", "sub_frame"]
  }
};

// Rules 1 and 2 belonged to the previous payment-blocking version.
const RULE_IDS = [1, 2, LIVE_RULE.id];

async function applyRules(enabled) {
  try {
    const current = await chrome.declarativeNetRequest.getDynamicRules();
    const toRemove = current
      .filter((rule) => RULE_IDS.includes(rule.id))
      .map((rule) => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: toRemove,
      addRules: enabled ? [LIVE_RULE] : []
    });
  } catch (error) {
    console.error("[Live Block] applyRules failed:", error);
  }
}

async function syncRules() {
  const { enabled = true } = await chrome.storage.sync.get({ enabled: true });
  await applyRules(enabled);
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabled) {
    applyRules(changes.enabled.newValue);
  }
});
