const STORAGE_KEY = "mono-tab-settings";
const TODOS_KEY = "mono-tab-todos";

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
  calendarEmbedUrl: "",
};

const clock = document.querySelector("#clock");
const date = document.querySelector("#date");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const quickLinks = document.querySelector("#quickLinks");
const wrapper = document.querySelector("#wrapper");
const pages = document.querySelector("#pages");
const panelDate = document.querySelector("#panelDate");
const calendarMount = document.querySelector("#calendarMount");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const todoList = document.querySelector("#todoList");
const todoCount = document.querySelector("#todoCount");
const goCalendar = document.querySelector("#goCalendar");
const goHome = document.querySelector("#goHome");
const returnHome = document.querySelector("#returnHome");
const homeIndicator = document.querySelector("#homeIndicator");
const dashboardIndicator = document.querySelector("#dashboardIndicator");
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
  calendarEmbedUrl: document.querySelector("#calendarEmbedUrl"),
};

const clearCalendarUrl = document.querySelector("#clearCalendarUrl");

let settings = loadSettings();
let todos = loadTodos();
let currentPage = 1;
let wheelLocked = false;

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
  document.body.className = `bg-${settings.background} contrast-${settings.contrast}${currentPage === 2 ? " page-2" : ""}`;
  wrapper.className = `wrapper layout-${settings.layout}`;
  clock.className = `clock font-${settings.clockFont} size-${settings.clockSize}`;
  searchForm.classList.toggle("hidden", !settings.showSearch);
  if (settings.showSearch && currentPage === 1) searchInput.focus();
  renderDate();
  renderCalendar();
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
  if (panelDate) {
    panelDate.textContent = `${year}.${paddedMonth}.${paddedDay}${weekdayText}`;
    panelDate.dateTime = `${year}-${paddedMonth}-${paddedDay}`;
  }
}


function extractCalendarEmbedUrl(input) {
  const value = input.trim();
  if (!value) return "";

  const srcMatch = value.match(/\bsrc\s*=\s*(["'])(.*?)\1/i) || value.match(/\bsrc\s*=\s*([^\s>]+)/i);
  const candidate = (srcMatch?.[2] || srcMatch?.[1] || value).trim();
  const withoutEntities = candidate.replace(/&amp;/g, "&");

  try {
    const url = new URL(withoutEntities);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderCalendar() {
  calendarMount.textContent = "";
  const calendarUrl = extractCalendarEmbedUrl(settings.calendarEmbedUrl || "");

  if (!calendarUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "calendar-placeholder";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = "Calendar not connected";
    const text = document.createElement("span");
    text.textContent = "Paste your Google Calendar embed URL in settings";
    content.append(title, text);
    placeholder.append(content);
    calendarMount.append(placeholder);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.className = "calendar-frame";
  iframe.src = calendarUrl;
  iframe.title = "Google Calendar";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  iframe.addEventListener("error", () => {
    iframe.replaceWith(document.createTextNode("Calendar could not be loaded."));
  });
  calendarMount.append(iframe);
}

function loadTodos() {
  try {
    const stored = JSON.parse(localStorage.getItem(TODOS_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function renderTodos() {
  todoList.textContent = "";
  const remaining = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = String(remaining);

  if (!todos.length) {
    const empty = document.createElement("li");
    empty.className = "empty-todos";
    empty.textContent = "No tasks yet";
    todoList.append(empty);
    return;
  }

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `${todo.text} を切り替え`);
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const remove = document.createElement("button");
    remove.className = "delete-todo";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${todo.text} を削除`);
    remove.addEventListener("click", () => deleteTodo(todo.id));

    item.append(checkbox, text, remove);
    todoList.append(item);
  });
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.unshift({
    id: `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    text: trimmed,
    completed: false,
    createdAt: Date.now(),
  });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
}

function goToPage(page) {
  currentPage = page === 2 ? 2 : 1;
  document.body.classList.toggle("page-2", currentPage === 2);
  if (currentPage === 1 && settings.showSearch) searchInput.focus();
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
      const value = control.type === "checkbox" ? control.checked : control.value;
      settings[key] = key === "calendarEmbedUrl" ? extractCalendarEmbedUrl(value) : value;
      if (key === "calendarEmbedUrl") control.value = settings[key];
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
clearCalendarUrl.addEventListener("click", () => {
  settings.calendarEmbedUrl = "";
  controls.calendarEmbedUrl.value = "";
  saveSettings();
  renderCalendar();
});
todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = "";
});
goCalendar.addEventListener("click", () => goToPage(2));
goHome.addEventListener("click", () => goToPage(1));
returnHome.addEventListener("click", () => goToPage(1));
homeIndicator.addEventListener("click", () => goToPage(2));
dashboardIndicator.addEventListener("click", () => goToPage(1));
homeIndicator.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") goToPage(2); });
dashboardIndicator.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") goToPage(1); });
window.addEventListener("wheel", (event) => {
  if (settingsPanel.classList.contains("open") || event.target.closest(".todo-list, .settings-panel")) return;
  event.preventDefault();
  if (wheelLocked || Math.abs(event.deltaY) < 18) return;
  wheelLocked = true;
  goToPage(event.deltaY > 0 ? 2 : 1);
  setTimeout(() => { wheelLocked = false; }, 640);
}, { passive: false });
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (settingsPanel.classList.contains("open")) toggleSettings(false);
    else goToPage(1);
  }
});

buildLinkSettings();
bindSettingsControls();
applySettings();
renderTodos();
renderClock();
setInterval(renderClock, 1000);
