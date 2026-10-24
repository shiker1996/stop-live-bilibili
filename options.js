const enabled = document.getElementById("enabled");
const save = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get({ enabled: true }, (items) => {
  enabled.checked = items.enabled;
});

save.addEventListener("click", () => {
  chrome.storage.sync.set({ enabled: enabled.checked }, () => {
    status.textContent = "已保存";
    setTimeout(() => {
      status.textContent = "";
    }, 1500);
  });
});
