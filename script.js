// Storage helpers
const STORAGE_KEY = "mono-tab-settings";
const EVENTS_KEY = "mono-tab-events";
const TODOS_KEY = "mono-tab-todos";
const MEMO_KEY = "mono-tab-memo";
const POMODORO_KEY = "mono-tab-pomodoro";
const ACTIVE_WIDGET_KEY = "mono-tab-active-widget";
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
const eventForm = $("#eventForm");
const eventTitle = $("#eventTitle");
const eventTime = $("#eventTime");
const eventNote = $("#eventNote");
const showEventForm = $("#showEventForm");
const cancelEvent = $("#cancelEvent");
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
const closeSettings = $("#closeSettings");
const linkSettings = $("#linkSettings");

const controls = {
  clockFont: $("#clockFont"), clockSize: $("#clockSize"), timeFormat: $("#timeFormat"), showSeconds: $("#showSeconds"),
  dateStyle: $("#dateStyle"), showWeekday: $("#showWeekday"), showSearch: $("#showSearch"), searchEngine: $("#searchEngine"),
  background: $("#backgroundSelect"), layout: $("#layout"), contrast: $("#contrast"),
};

let settings = loadSettings();
let currentPage = 1;
let wheelLocked = false;
let events = loadEvents();
let todos = loadTodos();
let memo = loadMemo();
let activeWidget = Number(localStorage.getItem(ACTIVE_WIDGET_KEY)) || 0;
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
function toggleSettings(forceOpen) { const isOpen = typeof forceOpen === "boolean" ? forceOpen : !settingsPanel.classList.contains("open"); settingsPanel.classList.toggle("open", isOpen); settingsPanel.setAttribute("aria-hidden", String(!isOpen)); settingsButton.setAttribute("aria-expanded", String(isOpen)); }
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
function loadEvents() { const stored = readJson(EVENTS_KEY, []); return Array.isArray(stored) ? stored : []; }
function saveEvents() { writeJson(EVENTS_KEY, events); }
function getEventsForDate(dateString) { return events.filter((event) => event.date === dateString).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")); }
function hasEvents(dateString) { return getEventsForDate(dateString).length > 0; }
function renderCalendar() { calendarGrid.textContent = ""; const year = visibleMonth.getFullYear(); const month = visibleMonth.getMonth(); calendarMonthLabel.textContent = `${year}年${month + 1}月`; const first = new Date(year, month, 1); const startOffset = (first.getDay() + 6) % 7; const start = new Date(year, month, 1 - startOffset); for (let i = 0; i < 42; i += 1) { const day = new Date(start); day.setDate(start.getDate() + i); const dateString = formatDate(day); const button = document.createElement("button"); button.type = "button"; button.className = "calendar-day"; if (day.getMonth() !== month) button.classList.add("muted"); if (dateString === formatDate(new Date())) button.classList.add("today"); if (dateString === selectedDate) button.classList.add("selected"); button.innerHTML = `<span>${day.getDate()}</span>${hasEvents(dateString) ? '<i aria-hidden="true"></i>' : ""}`; button.addEventListener("click", () => { selectedDate = dateString; renderCalendar(); renderSelectedDateEvents(); }); calendarGrid.append(button); } renderSelectedDateEvents(); }
function renderSelectedDateEvents() { selectedDateTitle.textContent = formatJapaneseDate(selectedDate); eventList.textContent = ""; const list = getEventsForDate(selectedDate); if (!list.length) { const empty = document.createElement("li"); empty.className = "empty-state"; empty.textContent = "予定はありません"; eventList.append(empty); return; } list.forEach((event) => { const item = document.createElement("li"); item.className = "event-item"; item.innerHTML = `<div><time>${event.time || "--:--"}</time><strong></strong><p></p></div>`; item.querySelector("strong").textContent = event.title; item.querySelector("p").textContent = event.note || ""; const del = document.createElement("button"); del.type = "button"; del.textContent = "×"; del.setAttribute("aria-label", `${event.title} を削除`); del.addEventListener("click", () => deleteEvent(event.id)); item.append(del); eventList.append(item); }); }
function addEvent() { const title = eventTitle.value.trim(); if (!title) return; events.push({ id: makeId("event"), title, date: selectedDate, time: eventTime.value, note: eventNote.value.trim(), createdAt: Date.now() }); saveEvents(); eventForm.reset(); eventForm.classList.add("hidden"); renderCalendar(); }
function deleteEvent(id) { events = events.filter((event) => event.id !== id); saveEvents(); renderCalendar(); }

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
settingsButton.addEventListener("click", () => toggleSettings()); closeSettings.addEventListener("click", () => toggleSettings(false));
$("#goCalendar").addEventListener("click", () => goToPage(2)); $("#goHome").addEventListener("click", () => goToPage(1)); $("#returnHome").addEventListener("click", () => goToPage(1)); $("#homeIndicator").addEventListener("click", () => goToPage(2)); $("#dashboardIndicator").addEventListener("click", () => goToPage(1));
$("#prevMonth").addEventListener("click", () => { visibleMonth.setMonth(visibleMonth.getMonth() - 1); renderCalendar(); }); $("#nextMonth").addEventListener("click", () => { visibleMonth.setMonth(visibleMonth.getMonth() + 1); renderCalendar(); }); $("#todayButton").addEventListener("click", () => { const now = new Date(); visibleMonth = new Date(now.getFullYear(), now.getMonth(), 1); selectedDate = formatDate(now); renderCalendar(); });
showEventForm.addEventListener("click", () => { eventForm.classList.toggle("hidden"); eventTitle.focus(); }); cancelEvent.addEventListener("click", () => { eventForm.reset(); eventForm.classList.add("hidden"); }); eventForm.addEventListener("submit", (e) => { e.preventDefault(); addEvent(); });
todoForm.addEventListener("submit", (e) => { e.preventDefault(); addTodo(todoInput.value); todoInput.value = ""; }); clearCompletedTodos.addEventListener("click", clearCompleted);
memoTextarea.addEventListener("input", saveMemo);
$("#prevWidget").addEventListener("click", () => shiftWidget(-1)); $("#nextWidget").addEventListener("click", () => shiftWidget(1));
$("#startPomodoro").addEventListener("click", startPomodoro); $("#pausePomodoro").addEventListener("click", pausePomodoro); $("#resetPomodoro").addEventListener("click", resetPomodoro); $("#focusMode").addEventListener("click", () => switchPomodoroMode("focus")); $("#breakMode").addEventListener("click", () => switchPomodoroMode("break"));
window.addEventListener("wheel", (event) => { if (settingsPanel.classList.contains("open") || event.target.closest(".todo-list, .event-list, .settings-panel, .memo-textarea")) return; event.preventDefault(); if (wheelLocked || Math.abs(event.deltaY) < 18) return; wheelLocked = true; goToPage(event.deltaY > 0 ? 2 : 1); setTimeout(() => { wheelLocked = false; }, 640); }, { passive: false });
window.addEventListener("keydown", (event) => { if (event.key === "Escape") { if (settingsPanel.classList.contains("open")) toggleSettings(false); else goToPage(1); } if (currentPage === 2 && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { if (event.key === "ArrowLeft") shiftWidget(-1); if (event.key === "ArrowRight") shiftWidget(1); } });

buildLinkSettings(); bindSettingsControls(); applySettings(); renderCalendar(); renderTodos(); renderMemo(); renderWidgetStack(); renderPomodoro(); if (pomodoro.isRunning) startPomodoro(); renderClock(); setInterval(renderClock, 1000);
