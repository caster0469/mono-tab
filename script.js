const clockElement = document.querySelector("#clock");
const dateElement = document.querySelector("#date");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const statusList = document.querySelector("#statusList");
const todoList = document.querySelector("#todoList");
const todoForm = document.querySelector("#todoForm");
const todoInput = document.querySelector("#todoInput");
const memoText = document.querySelector("#memoText");

const STORAGE_KEYS = {
  todos: "mono-tab.todos",
  memo: "mono-tab.memo",
};

// Edit these values later if you want the status card to show different labels or numbers.
const statusItems = [
  { label: "CPU", value: 12, icon: "▣" },
  { label: "RAM", value: 22, icon: "▤" },
  { label: "SSD", value: 31, icon: "▥" },
  { label: "Home_Wi-Fi", value: 80, icon: "≋" },
];

const defaultTodos = [
  { text: "アプリアイコンを整理する", done: false },
  { text: "次のプロジェクトを考える", done: false },
  { text: "読書：アーキテクチャの本", done: false },
  { text: "ブログ記事を書く", done: false },
];

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

function renderStatus() {
  statusList.innerHTML = statusItems
    .map(
      (item) => `
        <div class="status-item">
          <span class="status-icon" aria-hidden="true">${item.icon}</span>
          <span class="status-name">${item.label}</span>
          <span class="status-value">${item.value}%</span>
          <span class="status-bar" aria-hidden="true">
            <span class="status-fill" style="width: ${item.value}%"></span>
          </span>
        </div>
      `,
    )
    .join("");
}

function loadTodos() {
  const saved = localStorage.getItem(STORAGE_KEYS.todos);
  return saved ? JSON.parse(saved) : defaultTodos;
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
}

function renderTodos() {
  const todos = loadTodos();
  todoList.innerHTML = "";

  todos.forEach((todo, index) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todos[index].done = checkbox.checked;
      saveTodos(todos);
      renderTodos();
    });

    const text = document.createElement("span");
    text.textContent = todo.text;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "todo-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${todo.text} を削除`);
    remove.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos(todos);
      renderTodos();
    });

    item.append(checkbox, text, remove);
    todoList.append(item);
  });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  window.location.href = buildUrl(query);
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  const todos = loadTodos();
  todos.push({ text, done: false });
  saveTodos(todos);
  todoInput.value = "";
  renderTodos();
});

memoText.value = localStorage.getItem(STORAGE_KEYS.memo) || "";
memoText.addEventListener("input", () => {
  localStorage.setItem(STORAGE_KEYS.memo, memoText.value);
});

updateClock();
setInterval(updateClock, 1000);
renderStatus();
renderTodos();
searchInput.focus();
