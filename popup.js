const toggle = document.getElementById("enabled");
const dot = document.getElementById("dot");

function render() {
  dot.style.background = toggle.checked ? "#2eb872" : "#ccd0d6";
}

chrome.storage.sync.get({ enabled: true }, (items) => {
  toggle.checked = items.enabled;
  render();
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked }, render);
});

document.getElementById("options").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
