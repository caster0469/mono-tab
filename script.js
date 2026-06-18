const STORAGE_KEY = "mono-tab-settings";

const defaultSettings = {
  clockFont: "mono",
  clockSize: "large",
  timeFormat: "24h",
  showSeconds: false,
  dateStyle: "simple",
  showWeekday: true,
  showSearch: true,
  searchEngine: "google",
  links: [
    { name: "YouTube", url: "https://www.youtube.com/" },
    { name: "ChatGPT", url: "https://chat.openai.com/" },
    { name: "GitHub", url: "https://github.com/" },
    { name: "Gmail", url: "https://mail.google.com/" },
    { name: "Drive", url: "https://drive.google.com/" },
  ],
  background: "soft-glow",
  layout: "center",
  contrast: "soft-gray",
};

const clock = document.querySelector("#clock");
const date = document.querySelector("#date");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const quickLinks = document.querySelector("#quickLinks");
const wrapper = document.querySelector("#wrapper");
const settingsButton = document.querySelector("#settingsButton");
const settingsPanel = document.querySelector("#settingsPanel");
const closeSettings = document.querySelector("#closeSettings");
const linkSettings = document.querySelector("#linkSettings");

const controls = {
  clockFont: document.querySelector("#clockFont"),
  clockSize: document.querySelector("#clockSize"),
  timeFormat: document.querySelector("#timeFormat"),
  showSeconds: document.querySelector("#showSeconds"),
  dateStyle: document.querySelector("#dateStyle"),
  showWeekday: document.querySelector("#showWeekday"),
  showSearch: document.querySelector("#showSearch"),
  searchEngine: document.querySelector("#searchEngine"),
  background: document.querySelector("#backgroundSelect"),
  layout: document.querySelector("#layout"),
  contrast: document.querySelector("#contrast"),
};

let settings = loadSettings();

function normalizeLinks(links) {
  return Array.from({ length: 5 }, (_, index) => ({
    name: links?.[index]?.name || "",
    url: links?.[index]?.url || "",
  }));
}

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultSettings, ...stored, links: normalizeLinks(stored?.links || defaultSettings.links) };
  } catch {
    return { ...defaultSettings, links: normalizeLinks(defaultSettings.links) };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applySettings() {
  document.body.className = `bg-${settings.background} contrast-${settings.contrast}`;
  wrapper.className = `wrapper layout-${settings.layout}`;
  clock.className = `clock font-${settings.clockFont} size-${settings.clockSize}`;
  searchForm.classList.toggle("hidden", !settings.showSearch);
  if (settings.showSearch) searchInput.focus();
  renderDate();
  renderLinks();
  syncControls();
}

function renderClock() {
  const now = new Date();
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: settings.showSeconds ? "2-digit" : undefined,
    hour12: settings.timeFormat === "12h",
  };
  const timeText = new Intl.DateTimeFormat("ja-JP", options).format(now);
  clock.textContent = timeText;
  clock.dateTime = timeText;
  renderDate(now);
}

function renderDate(currentDate = new Date()) {
  if (settings.dateStyle === "hidden") {
    date.classList.add("hidden");
    date.textContent = "";
    return;
  }

  date.classList.remove("hidden");
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(currentDate);
  const weekdayText = settings.showWeekday ? `（${weekday}）` : "";

  const formats = {
    full: `${year}年${month}月${day}日${weekdayText}`,
    simple: `${month}月${day}日${weekdayText}`,
    dot: `${year}.${paddedMonth}.${paddedDay}${weekdayText}`,
    slash: `${year}/${paddedMonth}/${paddedDay}${weekdayText}`,
  };
  date.textContent = formats[settings.dateStyle] || formats.simple;
}

function renderLinks() {
  quickLinks.textContent = "";
  settings.links.slice(0, 5).forEach((link) => {
    if (!link.name.trim() || !link.url.trim()) return;
    const anchor = document.createElement("a");
    anchor.className = "quick-link";
    anchor.href = link.url;
    anchor.textContent = link.name;
    quickLinks.append(anchor);
  });
}

function isUrlLike(value) {
  return /^https?:\/\//i.test(value)
    || /^localhost(:\d+)?(\/.*)?$/i.test(value)
    || /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(value);
}

function searchUrl(query) {
  const engines = {
    google: "https://www.google.com/search?q=",
    brave: "https://search.brave.com/search?q=",
    duckduckgo: "https://duckduckgo.com/?q=",
    bing: "https://www.bing.com/search?q=",
  };
  return `${engines[settings.searchEngine] || engines.google}${encodeURIComponent(query)}`;
}

function destinationFor(input) {
  const value = input.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (isUrlLike(value)) return `https://${value}`;
  return searchUrl(value);
}

function buildLinkSettings() {
  linkSettings.textContent = "";
  settings.links.forEach((link, index) => {
    const slot = document.createElement("div");
    slot.className = "link-slot";
    slot.innerHTML = `<strong>Slot ${index + 1}</strong>`;

    const name = document.createElement("input");
    name.type = "text";
    name.placeholder = "表示名";
    name.value = link.name;
    name.addEventListener("input", () => updateLink(index, "name", name.value));

    const url = document.createElement("input");
    url.type = "url";
    url.placeholder = "URL";
    url.value = link.url;
    url.addEventListener("input", () => updateLink(index, "url", url.value));

    slot.append(name, url);
    linkSettings.append(slot);
  });
}

function updateLink(index, key, value) {
  settings.links[index][key] = value;
  saveSettings();
  renderLinks();
}

function syncControls() {
  Object.entries(controls).forEach(([key, control]) => {
    if (control.type === "checkbox") control.checked = Boolean(settings[key]);
    else control.value = settings[key];
  });
}

function bindSettingsControls() {
  Object.entries(controls).forEach(([key, control]) => {
    control.addEventListener("change", () => {
      settings[key] = control.type === "checkbox" ? control.checked : control.value;
      saveSettings();
      applySettings();
      renderClock();
    });
  });
}

function toggleSettings(forceOpen) {
  const isOpen = typeof forceOpen === "boolean" ? forceOpen : !settingsPanel.classList.contains("open");
  settingsPanel.classList.toggle("open", isOpen);
  settingsPanel.setAttribute("aria-hidden", String(!isOpen));
  settingsButton.setAttribute("aria-expanded", String(isOpen));
  settingsButton.setAttribute("aria-label", isOpen ? "設定を閉じる" : "設定を開く");
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) window.location.href = destinationFor(query);
});
settingsButton.addEventListener("click", () => toggleSettings());
closeSettings.addEventListener("click", () => toggleSettings(false));

buildLinkSettings();
bindSettingsControls();
applySettings();
renderClock();
setInterval(renderClock, 1000);
