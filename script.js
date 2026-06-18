const clock = document.querySelector("#clock");
const date = document.querySelector("#date");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");

function updateTime() {
  const now = new Date();

  const timeText = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  clock.textContent = timeText;
  clock.dateTime = timeText;
  date.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
}

function isUrlLike(value) {
  return /^https?:\/\//i.test(value)
    || /^localhost(:\d+)?(\/.*)?$/i.test(value)
    || /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(value);
}

function destinationFor(input) {
  const value = input.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (isUrlLike(value)) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();
  if (!query) return;

  window.location.href = destinationFor(query);
});

updateTime();
setInterval(updateTime, 1000);
