// Storage helpers
const STORAGE_KEY = "mono-tab-settings";
const GOOGLE_EVENTS_CACHE_KEY = "mono-tab-google-events-cache";
const GOOGLE_SYNC_META_KEY = "mono-tab-google-sync-meta";
const TODOS_KEY = "mono-tab-todos";
const MEMO_KEY = "mono-tab-memo";
const POMODORO_KEY = "mono-tab-pomodoro";
const ACTIVE_WIDGET_KEY = "mono-tab-active-widget";
const CALENDAR_PAGE_KEY = "mono-tab-calendar-page";
const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

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

const $ = (selector) => document.querySelector(selector);
const clock = $("#clock");
const date = $("#date");
const searchForm = $("#searchForm");
const searchInput = $("#searchInput");
const quickLinks = $("#quickLinks");
const wrapper = $("#wrapper");
const panelDate = $("#panelDate");
const calendarGrid = $("#calendarGrid");
const calendarMonthLabel = $("#calendarMonthLabel");
const selectedDateTitle = $("#selectedDateTitle");
const eventList = $("#eventList");
const calendarPanelEyebrow = $("#calendarPanelEyebrow");
const calendarPanelDescription = $("#calendarPanelDescription");
const calendarPagePosition = $("#calendarPagePosition");
const calendarMonthView = $("#calendarMonthView");
const calendarScheduleView = $("#calendarScheduleView");
const todoForm = $("#todoForm");
const todoInput = $("#todoInput");
const todoList = $("#todoList");
const todoCount = $("#todoCount");
const clearCompletedTodos = $("#clearCompletedTodos");
const memoTextarea = $("#memoTextarea");
const memoCount = $("#memoCount");
const widgetPanels = Array.from(document.querySelectorAll(".widget-panel"));
const widgetPosition = $("#widgetPosition");
const widgetDots = $("#widgetDots");
const pomodoroModeLabel = $("#pomodoroModeLabel");
const pomodoroTime = $("#pomodoroTime");
const pomodoroMessage = $("#pomodoroMessage");
const settingsButton = $("#settingsButton");
const settingsPanel = $("#settingsPanel");
const closeSettingsButton = $("#closeSettings");
const linkSettings = $("#linkSettings");
const googleConnectionState = $("#googleConnectionState");
const settingsGoogleConnectionState = $("#settingsGoogleConnectionState");

const controls = {
  clockFont: $("#clockFont"), clockSize: $("#clockSize"), timeFormat: $("#timeFormat"), showSeconds: $("#showSeconds"),
  dateStyle: $("#dateStyle"), showWeekday: $("#showWeekday"), showSearch: $("#showSearch"), searchEngine: $("#searchEngine"),
  background: $("#backgroundSelect"), layout: $("#layout"), contrast: $("#contrast"),
};

let settings = loadSettings();
let currentPage = 1;
let wheelLocked = false;
const state = { isOverlayOpen: false, isSettingsOpen: false };
let events = [];
let googleSyncMeta = readJson(GOOGLE_SYNC_META_KEY, { connected: false, syncing: false, lastSyncAt: null, error: "", cacheOnly: false });
let todos = loadTodos();
let memo = loadMemo();
let activeWidget = Number(localStorage.getItem(ACTIVE_WIDGET_KEY)) || 0;
let calendarPage = Number(localStorage.getItem(CALENDAR_PAGE_KEY)) === 2 ? 2 : 1;
let pomodoro = loadPomodoro();
let pomodoroTimer = null;
const today = new Date();
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = formatDate(today);

function readJson(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalizeLinks(links) { return Array.from({ length: 5 }, (_, i) => ({ name: links?.[i]?.name || "", url: links?.[i]?.url || "" })); }
function loadSettings() { const stored = readJson(STORAGE_KEY, {}); return { ...defaultSettings, ...stored, links: normalizeLinks(stored.links || defaultSettings.links) }; }
function saveSettings() { writeJson(STORAGE_KEY, settings); }
function formatDate(value) { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function formatJapaneseDate(dateString) { const d = new Date(`${dateString}T00:00:00`); const w = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(d); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${w}）`; }
function makeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

// Settings
function applySettings() {
  document.body.className = `bg-${settings.background} contrast-${settings.contrast}${currentPage === 2 ? " page-2" : ""}`;
  wrapper.className = `wrapper layout-${settings.layout}`;
  clock.className = `clock font-${settings.clockFont} size-${settings.clockSize}`;
  searchForm.classList.toggle("hidden", !settings.showSearch);
  if (settings.showSearch && currentPage === 1) searchInput.focus();
  renderDate(); renderLinks(); syncControls();
}
function syncControls() { Object.entries(controls).forEach(([k, c]) => { c.type === "checkbox" ? c.checked = Boolean(settings[k]) : c.value = settings[k]; }); }
function bindSettingsControls() { Object.entries(controls).forEach(([k, c]) => c.addEventListener("change", () => { settings[k] = c.type === "checkbox" ? c.checked : c.value; saveSettings(); applySettings(); renderClock(); })); }
function setOverlayOpen(isOpen) { state.isOverlayOpen = Boolean(isOpen); document.body.classList.toggle("overlay-open", state.isOverlayOpen || state.isSettingsOpen); }
function openSettings() { state.isSettingsOpen = true; settingsPanel.classList.add("open"); settingsPanel.setAttribute("aria-hidden", "false"); settingsButton.setAttribute("aria-expanded", "true"); setOverlayOpen(state.isOverlayOpen); }
function closeSettings() { state.isSettingsOpen = false; settingsPanel.classList.remove("open"); settingsPanel.setAttribute("aria-hidden", "true"); settingsButton.setAttribute("aria-expanded", "false"); setOverlayOpen(state.isOverlayOpen); }
function toggleSettings(forceOpen) { const isOpen = typeof forceOpen === "boolean" ? forceOpen : !state.isSettingsOpen; isOpen ? openSettings() : closeSettings(); }

function buildLinkSettings() { linkSettings.textContent = ""; settings.links.forEach((link, index) => { const slot = document.createElement("div"); slot.className = "link-slot"; slot.innerHTML = `<strong>Slot ${index + 1}</strong>`; const name = document.createElement("input"); name.type = "text"; name.placeholder = "表示名"; name.value = link.name; name.addEventListener("input", () => updateLink(index, "name", name.value)); const url = document.createElement("input"); url.type = "url"; url.placeholder = "URL"; url.value = link.url; url.addEventListener("input", () => updateLink(index, "url", url.value)); slot.append(name, url); linkSettings.append(slot); }); }
function updateLink(index, key, value) { settings.links[index][key] = value; saveSettings(); renderLinks(); }

// Page navigation
function goToPage(page) { currentPage = page === 2 ? 2 : 1; document.body.classList.toggle("page-2", currentPage === 2); if (currentPage === 1 && settings.showSearch) searchInput.focus(); }

// Clock / Date
function renderClock() { const now = new Date(); const timeText = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", second: settings.showSeconds ? "2-digit" : undefined, hour12: settings.timeFormat === "12h" }).format(now); clock.textContent = timeText; clock.dateTime = timeText; renderDate(now); }
function renderDate(currentDate = new Date()) { if (settings.dateStyle === "hidden") { date.classList.add("hidden"); date.textContent = ""; return; } date.classList.remove("hidden"); const y = currentDate.getFullYear(); const m = currentDate.getMonth() + 1; const d = currentDate.getDate(); const mm = String(m).padStart(2, "0"); const dd = String(d).padStart(2, "0"); const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(currentDate); const wt = settings.showWeekday ? `（${weekday}）` : ""; date.textContent = ({ full: `${y}年${m}月${d}日${wt}`, simple: `${m}月${d}日${wt}`, dot: `${y}.${mm}.${dd}${wt}`, slash: `${y}/${mm}/${dd}${wt}` })[settings.dateStyle] || `${m}月${d}日${wt}`; panelDate.textContent = `${y}.${mm}.${dd}${wt}`; panelDate.dateTime = `${y}-${mm}-${dd}`; }

// Search / Links
function renderLinks() { quickLinks.textContent = ""; settings.links.slice(0, 5).forEach((link) => { if (!link.name.trim() || !link.url.trim()) return; const a = document.createElement("a"); a.className = "quick-link"; a.href = link.url; a.textContent = link.name; quickLinks.append(a); }); }
function isUrlLike(value) { return /^https?:\/\//i.test(value) || /^localhost(:\d+)?(\/.*)?$/i.test(value) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(value); }
function searchUrl(query) { const engines = { google: "https://www.google.com/search?q=", brave: "https://search.brave.com/search?q=", duckduckgo: "https://duckduckgo.com/?q=", bing: "https://www.bing.com/search?q=" }; return `${engines[settings.searchEngine] || engines.google}${encodeURIComponent(query)}`; }
function destinationFor(input) { const value = input.trim(); if (/^https?:\/\//i.test(value)) return value; return isUrlLike(value) ? `https://${value}` : searchUrl(value); }

// Calendar
function loadCachedGoogleEvents() {
  const cache = readJson(GOOGLE_EVENTS_CACHE_KEY, null);
  if (!cache || !Array.isArray(cache.events)) return { events: [], meta: null };
  return { events: cache.events, meta: cache };
}
function cacheGoogleEvents(nextEvents, meta = {}) {
  const payload = { events: nextEvents, fetchedAt: Date.now(), ...meta };
  writeJson(GOOGLE_EVENTS_CACHE_KEY, payload);
  googleSyncMeta = { ...googleSyncMeta, connected: true, lastSyncAt: payload.fetchedAt, error: "", cacheOnly: false };
  writeJson(GOOGLE_SYNC_META_KEY, googleSyncMeta);
}
function getMonthRange() {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  return {
    timeMin: new Date(year, month, 1, 0, 0, 0, 0).toISOString(),
    timeMax: new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString(),
  };
}
function formatEventTime(event) {
  if (event.allDay) return "終日";
  return event.endTime ? `${event.startTime} - ${event.endTime}` : (event.startTime || "時間なし");
}
function getEventsForDate(dateString) {
  return events.filter((event) => event.date === dateString).sort((a, b) => (a.allDay === b.allDay ? 0 : a.allDay ? -1 : 1) || (a.startTime || "99:99").localeCompare(b.startTime || "99:99") || a.title.localeCompare(b.title));
}
function getVisibleEventLimit() { return window.matchMedia("(max-width: 1365px), (max-height: 760px)").matches ? 1 : 2; }
function isChromeIdentityAvailable() { return typeof chrome !== "undefined" && chrome.identity && typeof chrome.identity.getAuthToken === "function"; }
async function getGoogleAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    if (!isChromeIdentityAvailable()) { reject(new Error("chrome.identity API is not available. 拡張機能として読み込んでください。")); return; }
    chrome.identity.getAuthToken({ interactive }, (token) => {
      const message = chrome.runtime?.lastError?.message;
      if (message || !token) reject(new Error(message || "Google auth token could not be acquired."));
      else resolve(token);
    });
  });
}
async function revokeGoogleAuthToken() {
  let token = null;
  try { token = await getGoogleAuthToken(false); } catch {}
  if (token && isChromeIdentityAvailable()) {
    await new Promise((resolve) => chrome.identity.removeCachedAuthToken({ token }, resolve));
    try { await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${encodeURIComponent(token)}`); } catch {}
  }
  events = [];
  googleSyncMeta = { connected: false, syncing: false, lastSyncAt: null, error: "", cacheOnly: false };
  localStorage.removeItem(GOOGLE_EVENTS_CACHE_KEY);
  localStorage.removeItem(GOOGLE_SYNC_META_KEY);
  renderCalendarPanel();
}
async function fetchGoogleCalendarEvents({ timeMin, timeMax }) {
  const token = await getGoogleAuthToken(false);
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime" });
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    let details = "";
    try { details = (await response.json()).error?.message || ""; } catch {}
    throw new Error(`Google Calendar API error (${response.status})${details ? `: ${details}` : ""}`);
  }
  const data = await response.json();
  return (data.items || []).map(normalizeGoogleEvent).filter(Boolean);
}
function normalizeGoogleEvent(event) {
  const startValue = event.start?.dateTime || event.start?.date;
  if (!startValue) return null;
  const allDay = Boolean(event.start?.date);
  const start = allDay ? new Date(`${event.start.date}T00:00:00`) : new Date(event.start.dateTime);
  const endValue = event.end?.dateTime || event.end?.date || "";
  const end = endValue ? (event.end?.date ? new Date(`${event.end.date}T00:00:00`) : new Date(endValue)) : null;
  const timeFormatter = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
  return {
    id: event.id || makeId("google-event"),
    source: "google",
    title: event.summary || "無題の予定",
    date: formatDate(start),
    startTime: allDay ? "" : timeFormatter.format(start),
    endTime: allDay || !end ? "" : timeFormatter.format(end),
    note: event.description || "",
    location: event.location || "",
    htmlLink: event.htmlLink || "",
    allDay,
  };
}
function lastSyncText() {
  if (!googleSyncMeta.lastSyncAt) return "未同期";
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date(googleSyncMeta.lastSyncAt));
}
function renderGoogleConnectionState() {
  const targets = [googleConnectionState, settingsGoogleConnectionState].filter(Boolean);
  targets.forEach((target) => {
    target.textContent = "";
    const status = document.createElement("div");
    status.className = "google-status-line";
    const connectedLabel = googleSyncMeta.error ? "Google Calendar sync failed" : googleSyncMeta.connected ? "Google Calendar connected" : "Google Calendar not connected";
    status.innerHTML = `<strong>${connectedLabel}</strong><span>Read only</span>`;
    const detail = document.createElement("p");
    detail.textContent = googleSyncMeta.error || `${googleSyncMeta.cacheOnly ? "前回同期データ / " : ""}最終同期: ${lastSyncText()}`;
    const actions = document.createElement("div");
    actions.className = "google-actions";
    const connect = document.createElement("button"); connect.type = "button"; connect.textContent = googleSyncMeta.error ? "再試行" : "Google Calendarに接続"; connect.addEventListener("click", () => syncGoogleCalendar(true));
    const sync = document.createElement("button"); sync.type = "button"; sync.textContent = googleSyncMeta.syncing ? "同期中..." : "同期"; sync.disabled = googleSyncMeta.syncing; sync.addEventListener("click", () => syncGoogleCalendar(false));
    const disconnect = document.createElement("button"); disconnect.type = "button"; disconnect.textContent = "接続解除"; disconnect.addEventListener("click", revokeGoogleAuthToken);
    if (googleSyncMeta.connected || googleSyncMeta.error) actions.append(sync, disconnect); else actions.append(connect);
    target.append(status, detail, actions);
  });
}
async function syncGoogleCalendar(interactive = false) {
  googleSyncMeta = { ...googleSyncMeta, syncing: true, error: "" }; renderGoogleConnectionState();
  try {
    if (interactive) await getGoogleAuthToken(true);
    const range = getMonthRange();
    events = await fetchGoogleCalendarEvents(range);
    cacheGoogleEvents(events, range);
  } catch (error) {
    const cached = loadCachedGoogleEvents();
    if (cached.events.length) events = cached.events;
    googleSyncMeta = { ...googleSyncMeta, connected: Boolean(cached.events.length || googleSyncMeta.connected), syncing: false, error: error.message || "Google Calendar sync failed", cacheOnly: Boolean(cached.events.length) };
    writeJson(GOOGLE_SYNC_META_KEY, googleSyncMeta);
  } finally {
    googleSyncMeta.syncing = false;
    writeJson(GOOGLE_SYNC_META_KEY, googleSyncMeta);
    renderCalendarPanel();
  }
}
function initializeGoogleCalendarCache() {
  const cached = loadCachedGoogleEvents();
  events = cached.events;
  if (cached.meta?.fetchedAt && !googleSyncMeta.lastSyncAt) googleSyncMeta.lastSyncAt = cached.meta.fetchedAt;
  if (cached.events.length && !googleSyncMeta.connected) googleSyncMeta.cacheOnly = true;
}
function renderCalendarPanel() {
  calendarPage = calendarPage === 2 ? 2 : 1;
  calendarPagePosition.textContent = `${calendarPage} / 2`;
  calendarMonthView.classList.toggle("active", calendarPage === 1);
  calendarScheduleView.classList.toggle("active", calendarPage === 2);
  renderGoogleConnectionState();
  renderCalendarMonthView();
  renderCalendarScheduleView();
  localStorage.setItem(CALENDAR_PAGE_KEY, String(calendarPage));
}
function renderCalendar() { renderCalendarPanel(); }
function renderCalendarMonthView() { calendarGrid.textContent = ""; const year = visibleMonth.getFullYear(); const month = visibleMonth.getMonth(); calendarMonthLabel.textContent = calendarPage === 1 ? `${year}年${month + 1}月` : "SCHEDULE"; calendarPanelEyebrow.textContent = "Google Calendar Viewer"; calendarPanelDescription.textContent = calendarPage === 1 ? "月曜始まり / 読み取り専用" : formatJapaneseDate(selectedDate); renderMonthGrid(year, month); }
function renderCalendarScheduleView() { selectedDateTitle.textContent = formatJapaneseDate(selectedDate); eventList.textContent = ""; if (googleSyncMeta.error) { const error = document.createElement("li"); error.className = "empty-state schedule-empty"; error.textContent = `${googleSyncMeta.error}${events.length ? " / 前回同期データを表示しています" : ""}`; eventList.append(error); } const list = getEventsForDate(selectedDate); if (!list.length) { const empty = document.createElement("li"); empty.className = "empty-state schedule-empty"; empty.textContent = "予定はありません"; eventList.append(empty); return; } list.forEach((event) => { const item = document.createElement("li"); item.className = "event-item schedule-event-item google-event-item"; const body = document.createElement("div"); body.className = "event-body"; const title = document.createElement("strong"); title.textContent = event.title; const meta = document.createElement("p"); meta.textContent = [event.location, event.note].filter(Boolean).join(" / "); body.append(title); if (meta.textContent) body.append(meta); if (event.htmlLink) { const link = document.createElement("a"); link.href = event.htmlLink; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = "Google Calendarで開く"; body.append(link); } const time = document.createElement("div"); time.className = "event-time"; time.textContent = formatEventTime(event); item.append(time, body); eventList.append(item); }); }
function setCalendarPage(page) { calendarPage = page === 2 ? 2 : 1; renderCalendarPanel(); }
function nextCalendarPage() { setCalendarPage(calendarPage === 1 ? 2 : 1); }
function previousCalendarPage() { setCalendarPage(calendarPage === 1 ? 2 : 1); }
function renderMonthGrid(year = visibleMonth.getFullYear(), month = visibleMonth.getMonth()) { const first = new Date(year, month, 1); const startOffset = (first.getDay() + 6) % 7; const start = new Date(year, month, 1 - startOffset); for (let i = 0; i < 42; i += 1) { const day = new Date(start); day.setDate(start.getDate() + i); calendarGrid.append(renderCalendarDay(day, month)); } }
function renderCalendarDay(day, visibleMonthIndex) { const dateString = formatDate(day); const dayEvents = getEventsForDate(dateString); const button = document.createElement("button"); button.type = "button"; button.className = "calendar-day"; button.setAttribute("role", "gridcell"); button.setAttribute("aria-label", `${formatJapaneseDate(dateString)}${dayEvents.length ? ` ${dayEvents.length}件の予定` : ""}`); if (day.getMonth() !== visibleMonthIndex) button.classList.add("muted"); if (dateString === formatDate(new Date())) button.classList.add("today"); if (dateString === selectedDate) button.classList.add("selected"); const number = document.createElement("span"); number.className = "calendar-day-number"; number.textContent = day.getDate(); const eventWrap = document.createElement("div"); eventWrap.className = "calendar-day-events"; const limit = getVisibleEventLimit(); dayEvents.slice(0, limit).forEach((event) => { const chip = document.createElement("span"); chip.className = "calendar-event-chip"; chip.textContent = `${event.allDay ? "終日" : event.startTime} ${event.title}`.trim(); eventWrap.append(chip); }); if (dayEvents.length > limit) { const more = document.createElement("span"); more.className = "calendar-more"; more.textContent = `+${dayEvents.length - limit} more`; eventWrap.append(more); } button.append(number, eventWrap); button.addEventListener("click", () => { selectedDate = dateString; renderCalendarPanel(); }); return button; }

// Widget Stack
function renderWidgetStack() { activeWidget = Math.max(0, Math.min(widgetPanels.length - 1, activeWidget)); widgetPanels.forEach((panel, index) => panel.classList.toggle("active", index === activeWidget)); widgetPosition.textContent = `${activeWidget + 1} / ${widgetPanels.length}`; widgetDots.textContent = ""; widgetPanels.forEach((_, index) => { const dot = document.createElement("button"); dot.type = "button"; dot.textContent = index === activeWidget ? "●" : "○"; dot.setAttribute("aria-label", `Widget ${index + 1}`); dot.addEventListener("click", () => setActiveWidget(index)); widgetDots.append(dot); }); localStorage.setItem(ACTIVE_WIDGET_KEY, String(activeWidget)); }
function setActiveWidget(index) { activeWidget = index; renderWidgetStack(); }
function shiftWidget(delta) { setActiveWidget((activeWidget + delta + widgetPanels.length) % widgetPanels.length); }

// Todo
function loadTodos() { const stored = readJson(TODOS_KEY, []); return Array.isArray(stored) ? stored : []; }
function saveTodos() { writeJson(TODOS_KEY, todos); }
function renderTodos() { todoList.textContent = ""; const done = todos.filter((todo) => todo.completed).length; todoCount.textContent = `完了 ${done} / 全部 ${todos.length}`; if (!todos.length) { const empty = document.createElement("li"); empty.className = "empty-state"; empty.textContent = "タスクはありません"; todoList.append(empty); return; } todos.forEach((todo) => { const item = document.createElement("li"); item.className = `todo-item${todo.completed ? " completed" : ""}`; const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = todo.completed; checkbox.addEventListener("change", () => toggleTodo(todo.id)); const text = document.createElement("span"); text.className = "todo-text"; text.textContent = todo.text; const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.addEventListener("click", () => deleteTodo(todo.id)); item.append(checkbox, text, remove); todoList.append(item); }); }
function addTodo(text) { const trimmed = text.trim(); if (!trimmed) return; todos.unshift({ id: makeId("todo"), text: trimmed, completed: false, createdAt: Date.now() }); saveTodos(); renderTodos(); }
function toggleTodo(id) { todos = todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo); saveTodos(); renderTodos(); }
function deleteTodo(id) { todos = todos.filter((todo) => todo.id !== id); saveTodos(); renderTodos(); }
function clearCompleted() { todos = todos.filter((todo) => !todo.completed); saveTodos(); renderTodos(); }

// Memo
function loadMemo() { return localStorage.getItem(MEMO_KEY) || ""; }
function saveMemo() { memo = memoTextarea.value; localStorage.setItem(MEMO_KEY, memo); renderMemo(); }
function renderMemo() { memoTextarea.value = memo; memoCount.textContent = `${memo.length} chars`; }

// Pomodoro
function loadPomodoro() { const saved = readJson(POMODORO_KEY, null); if (!saved) return { mode: "focus", remainingSeconds: FOCUS_SECONDS, isRunning: false, lastUpdatedAt: Date.now() }; const duration = saved.mode === "break" ? BREAK_SECONDS : FOCUS_SECONDS; let remaining = Math.min(Number(saved.remainingSeconds) || duration, duration); if (saved.isRunning) remaining = Math.max(0, remaining - Math.floor((Date.now() - (saved.lastUpdatedAt || Date.now())) / 1000)); return { mode: saved.mode === "break" ? "break" : "focus", remainingSeconds: remaining, isRunning: Boolean(saved.isRunning), lastUpdatedAt: Date.now() }; }
function savePomodoro() { pomodoro.lastUpdatedAt = Date.now(); writeJson(POMODORO_KEY, pomodoro); }
function renderPomodoro() { const min = Math.floor(pomodoro.remainingSeconds / 60); const sec = pomodoro.remainingSeconds % 60; pomodoroTime.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`; pomodoroModeLabel.textContent = pomodoro.mode === "focus" ? "Focus time" : "Break time"; $("#focusMode").classList.toggle("active", pomodoro.mode === "focus"); $("#breakMode").classList.toggle("active", pomodoro.mode === "break"); }
function startPomodoro() { clearInterval(pomodoroTimer); pomodoro.isRunning = true; savePomodoro(); pomodoroTimer = setInterval(tickPomodoro, 1000); }
function pausePomodoro() { pomodoro.isRunning = false; clearInterval(pomodoroTimer); savePomodoro(); renderPomodoro(); }
function resetPomodoro() { pausePomodoro(); pomodoro.remainingSeconds = pomodoro.mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS; pomodoroMessage.textContent = ""; savePomodoro(); renderPomodoro(); }
function switchPomodoroMode(mode) { const shouldResume = pomodoro.isRunning; pausePomodoro(); pomodoro.mode = mode === "break" ? "break" : "focus"; pomodoro.remainingSeconds = pomodoro.mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS; pomodoroMessage.textContent = pomodoro.mode === "focus" ? "Focus time" : "Break time"; savePomodoro(); renderPomodoro(); if (shouldResume) startPomodoro(); }
function tickPomodoro() { if (!pomodoro.isRunning) return; pomodoro.remainingSeconds -= 1; if (pomodoro.remainingSeconds <= 0) switchPomodoroMode(pomodoro.mode === "focus" ? "break" : "focus"); savePomodoro(); renderPomodoro(); }

searchForm.addEventListener("submit", (e) => { e.preventDefault(); const query = searchInput.value.trim(); if (query) window.location.href = destinationFor(query); });
settingsButton.addEventListener("click", () => toggleSettings()); closeSettingsButton.addEventListener("click", closeSettings);
$("#goCalendar").addEventListener("click", () => goToPage(2)); $("#goHome").addEventListener("click", () => goToPage(1)); $("#returnHome").addEventListener("click", () => goToPage(1));
$("#prevMonth").addEventListener("click", () => { visibleMonth.setMonth(visibleMonth.getMonth() - 1); renderCalendar(); if (googleSyncMeta.connected) syncGoogleCalendar(false); }); $("#nextMonth").addEventListener("click", () => { visibleMonth.setMonth(visibleMonth.getMonth() + 1); renderCalendar(); if (googleSyncMeta.connected) syncGoogleCalendar(false); }); $("#todayButton").addEventListener("click", () => { const now = new Date(); visibleMonth = new Date(now.getFullYear(), now.getMonth(), 1); selectedDate = formatDate(now); renderCalendar(); });
$("#syncGoogleCalendarMonth").addEventListener("click", () => syncGoogleCalendar(!googleSyncMeta.connected));
$("#prevCalendarPage").addEventListener("click", previousCalendarPage); $("#nextCalendarPage").addEventListener("click", nextCalendarPage);
todoForm.addEventListener("submit", (e) => { e.preventDefault(); addTodo(todoInput.value); todoInput.value = ""; }); clearCompletedTodos.addEventListener("click", clearCompleted);
memoTextarea.addEventListener("input", saveMemo);
$("#prevWidget").addEventListener("click", () => shiftWidget(-1)); $("#nextWidget").addEventListener("click", () => shiftWidget(1));
$("#startPomodoro").addEventListener("click", startPomodoro); $("#pausePomodoro").addEventListener("click", pausePomodoro); $("#resetPomodoro").addEventListener("click", resetPomodoro); $("#focusMode").addEventListener("click", () => switchPomodoroMode("focus")); $("#breakMode").addEventListener("click", () => switchPomodoroMode("break"));
function canNavigatePages() { return !state.isOverlayOpen && !state.isSettingsOpen; }
function handleWheelNavigation(event) { if (!canNavigatePages() || event.target.closest(".todo-list, .event-list, .calendar-schedule-scroll, .calendar-page-controls, .calendar-toolbar, .settings-panel, .memo-textarea")) return; event.preventDefault(); if (wheelLocked || Math.abs(event.deltaY) < 18) return; wheelLocked = true; goToPage(event.deltaY > 0 ? 2 : 1); setTimeout(() => { wheelLocked = false; }, 640); }
window.addEventListener("wheel", handleWheelNavigation, { passive: false });
window.addEventListener("keydown", (event) => { if (event.key === "Escape") { if (state.isSettingsOpen) closeSettings(); else goToPage(1); } if (currentPage === 2 && canNavigatePages() && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { if (event.key === "ArrowLeft") shiftWidget(-1); if (event.key === "ArrowRight") shiftWidget(1); } });

initializeGoogleCalendarCache(); buildLinkSettings(); bindSettingsControls(); applySettings(); renderCalendarPanel(); renderTodos(); renderMemo(); renderWidgetStack(); renderPomodoro(); if (pomodoro.isRunning) startPomodoro(); renderClock(); setInterval(renderClock, 1000);
