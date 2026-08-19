const els = {
  enabled: document.getElementById("enabled"),
  cooldown: document.getElementById("cooldown"),
  bypass: document.getElementById("bypass"),
  save: document.getElementById("save"),
  status: document.getElementById("status")
};

chrome.storage.sync.get(
  { enabled: true, cooldownSeconds: 10, allowBypass: false },
  (items) => {
    els.enabled.checked = items.enabled;
    els.cooldown.value = items.cooldownSeconds;
    els.bypass.checked = items.allowBypass;
  }
);

els.save.addEventListener("click", () => {
  const cooldown = Math.max(
    0,
    Math.min(60, parseInt(els.cooldown.value, 10) || 0)
  );
  chrome.storage.sync.set(
    {
      enabled: els.enabled.checked,
      cooldownSeconds: cooldown,
      allowBypass: els.bypass.checked
    },
    () => {
      els.status.textContent = "已保存";
      setTimeout(() => {
        els.status.textContent = "";
      }, 1500);
    }
  );
});
