const clockElement = document.querySelector("#clock");
const dateElement = document.querySelector("#date");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const statusList = document.querySelector("#statusList");
const todoList = document.querySelector("#todoList");
const todoCount = document.querySelector("#todoCount");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const memoText = document.querySelector("#memoText");

const STORAGE_KEYS = {
  todos: "mono-tab-todos",
  memo: "mono-tab-memo",
};

const LEGACY_STORAGE_KEYS = {
  todos: "mono-tab.todos",
  memo: "mono-tab.memo",
};

const sessionStartedAt = Date.now();
const statusState = {
  battery: { label: "Battery", value: "Checking...", detail: "Detecting battery API", icon: "◐", percent: 0 },
  network: { label: "Network", value: "Checking...", detail: "Detecting connection", icon: "≋", percent: 0 },
  memory: { label: "JS Memory", value: "Checking...", detail: "Browser heap only", icon: "▤", percent: 0 },
  storage: { label: "Browser Storage", value: "Checking...", detail: "Origin quota estimate", icon: "▥", percent: 0 },
  session: { label: "Session", value: "00:00:00", detail: "Since this tab opened", icon: "◷", percent: 0 },
};

function updateClock() {
  const now = new Date();
  clockElement.textContent = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  dateElement.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);
}

function looksLikeUrl(value) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) return true;
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed);
}

function buildUrl(value) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (looksLikeUrl(trimmed)) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "Unavailable";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function renderStatus() {
  statusList.innerHTML = Object.values(statusState)
    .map(
      (item) => `
        <div class="status-item">
          <span class="status-icon" aria-hidden="true">${item.icon}</span>
          <span class="status-main">
            <span class="status-name">${item.label}</span>
            <span class="status-value">${item.value}</span>
          </span>
          <span class="status-detail">${item.detail}</span>
          <span class="status-bar" aria-hidden="true">
            <span class="status-fill" style="width: ${Math.max(0, Math.min(100, item.percent || 0))}%"></span>
          </span>
        </div>
      `,
    )
    .join("");
}

async function updateBatteryStatus() {
  try {
    if (!("getBattery" in navigator)) {
      statusState.battery = { ...statusState.battery, value: "Unavailable", detail: "Battery API unavailable", percent: 0 };
      renderStatus();
      return;
    }
    const battery = await navigator.getBattery();
    const applyBattery = () => {
      const level = Math.round(battery.level * 100);
      statusState.battery = {
        ...statusState.battery,
        value: `${level}% ${battery.charging ? "Charging" : "Battery"}`,
        detail: battery.charging ? "Power connected" : "Discharging",
        percent: level,
      };
      renderStatus();
    };
    applyBattery();
    battery.addEventListener("levelchange", applyBattery);
    battery.addEventListener("chargingchange", applyBattery);
  } catch (error) {
    statusState.battery = { ...statusState.battery, value: "Unavailable", detail: "Battery API blocked", percent: 0 };
    renderStatus();
  }
}

function updateNetworkStatus() {
  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const onlineText = navigator.onLine ? "Online" : "Offline";
    const effectiveType = connection?.effectiveType || "Limited";
    const rtt = Number.isFinite(connection?.rtt) ? `${connection.rtt}ms` : "RTT Limited";
    const downlink = Number.isFinite(connection?.downlink) ? `${connection.downlink}Mbps` : "Downlink Limited";
    statusState.network = {
      ...statusState.network,
      value: `${onlineText} / ${effectiveType}`,
      detail: `${rtt} / ${downlink}`,
      percent: navigator.onLine ? 100 : 0,
    };
    renderStatus();
  } catch (error) {
    statusState.network = { ...statusState.network, value: "Unavailable", detail: "Network API limited", percent: 0 };
    renderStatus();
  }
}

function updateMemoryStatus() {
  try {
    const memory = performance.memory;
    if (!memory) {
      statusState.memory = { ...statusState.memory, value: "Browser limited", detail: "JS heap API unavailable", percent: 0 };
      renderStatus();
      return;
    }
    const used = memory.usedJSHeapSize;
    statusState.memory = {
      ...statusState.memory,
      value: formatBytes(used),
      detail: `JS heap used / ${formatBytes(memory.jsHeapSizeLimit)} limit`,
      percent: memory.jsHeapSizeLimit ? (used / memory.jsHeapSizeLimit) * 100 : 0,
    };
    renderStatus();
  } catch (error) {
    statusState.memory = { ...statusState.memory, value: "Browser limited", detail: "JS heap API blocked", percent: 0 };
    renderStatus();
  }
}

async function updateStorageStatus() {
  try {
    if (!navigator.storage?.estimate) {
      statusState.storage = { ...statusState.storage, value: "Unavailable", detail: "Storage estimate unavailable", percent: 0 };
      renderStatus();
      return;
    }
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    statusState.storage = {
      ...statusState.storage,
      value: `${formatBytes(usage)} used`,
      detail: quota ? `${formatBytes(Math.max(quota - usage, 0))} available` : "Quota Limited",
      percent: quota ? (usage / quota) * 100 : 0,
    };
    renderStatus();
  } catch (error) {
    statusState.storage = { ...statusState.storage, value: "Unavailable", detail: "Storage estimate blocked", percent: 0 };
    renderStatus();
  }
}

function updateSessionTime() {
  try {
    const elapsed = Date.now() - sessionStartedAt;
    statusState.session = {
      ...statusState.session,
      value: formatDuration(elapsed),
      detail: "Since this tab opened",
      percent: (Math.floor(elapsed / 1000) % 60 / 60) * 100,
    };
    renderStatus();
  } catch (error) {
    statusState.session = { ...statusState.session, value: "Unavailable", detail: "Session timer error", percent: 0 };
    renderStatus();
  }
}

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.todos) || localStorage.getItem(LEGACY_STORAGE_KEYS.todos);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
  } catch (error) {
    console.warn("Failed to save todos", error);
  }
}

function renderTodos() {
  const todos = loadTodos();
  todoList.innerHTML = "";
  todoCount.textContent = String(todos.filter((todo) => !todo.done).length);

  if (!todos.length) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = "Todo はありません";
    todoList.append(empty);
    return;
  }

  todos.forEach((todo, index) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => toggleTodo(index));

    const text = document.createElement("span");
    text.textContent = todo.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "todo-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${todo.text} を削除`);
    remove.addEventListener("click", () => deleteTodo(index));

    item.append(checkbox, text, remove);
    todoList.append(item);
  });
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const todos = loadTodos();
  todos.push({ text: trimmed, done: false });
  saveTodos(todos);
  renderTodos();
}

function toggleTodo(index) {
  const todos = loadTodos();
  if (!todos[index]) return;
  todos[index].done = !todos[index].done;
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(index) {
  const todos = loadTodos();
  if (!todos[index]) return;
  todos.splice(index, 1);
  saveTodos(todos);
  renderTodos();
}

function loadMemo() {
  try {
    memoText.value = localStorage.getItem(STORAGE_KEYS.memo) || localStorage.getItem(LEGACY_STORAGE_KEYS.memo) || "";
  } catch (error) {
    memoText.value = "";
  }
}

function saveMemo() {
  try {
    localStorage.setItem(STORAGE_KEYS.memo, memoText.value);
  } catch (error) {
    console.warn("Failed to save memo", error);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  window.location.href = buildUrl(query);
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = "";
});

memoText.addEventListener("input", saveMemo);
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
connection?.addEventListener?.("change", updateNetworkStatus);

updateClock();
setInterval(updateClock, 1000);
renderStatus();
updateBatteryStatus();
updateNetworkStatus();
updateMemoryStatus();
updateStorageStatus();
updateSessionTime();
setInterval(updateMemoryStatus, 5000);
setInterval(updateStorageStatus, 30000);
setInterval(updateSessionTime, 1000);
renderTodos();
loadMemo();
searchInput.focus();
