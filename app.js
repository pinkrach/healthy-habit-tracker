const STORAGE_KEY = "healthy-habit-tracker-v1";
const GOAL_DAYS = 5;
const START = new Date(2026, 9, 10);

const HABITS = [
  {
    id: "produce",
    name: "Produce",
    title: "Add 1 serving of produce daily",
    detail: "Eat at least one serving of fruit or vegetables. Fresh, frozen, or canned all count.",
    unlockWeek: 1,
  },
  {
    id: "water",
    name: "Water",
    title: "Reach 8 glasses (64 oz) of water daily",
    detail: "Drink about 64 ounces of water through the day. Other drinks don’t replace this one.",
    unlockWeek: 2,
  },
  {
    id: "grain",
    name: "Whole grain",
    title: "Swap 1 refined grain for whole grain daily",
    detail: "Trade one refined grain — white bread, white rice, or regular pasta — for a whole-grain version.",
    unlockWeek: 3,
  },
  {
    id: "sweets",
    name: "Sweets limited",
    title: "Limit sweets to 1 intentional portion daily",
    detail: "If you want something sweet, choose one planned portion and skip the extras. Having none still counts.",
    unlockWeek: 4,
  },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weeksEl = document.querySelector("#weeks");
const resetBtn = document.querySelector("#reset-btn");
const resetDialog = document.querySelector("#reset-dialog");

let state = loadState();

function calendarDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(from, to) {
  return Math.round((calendarDay(to) - calendarDay(from)) / 86400000);
}

function habitsForWeek(week) {
  return HABITS.filter((habit) => habit.unlockWeek <= week);
}

function weekForDay(dayIndex) {
  return Math.floor(dayIndex / 7) + 1;
}

function dateForDay(dayIndex) {
  return addDays(START, dayIndex);
}

function formatShort(date) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function formatLong(date) {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isChecked(dayIndex, habitId) {
  return Boolean(state[dayIndex] && state[dayIndex][habitId]);
}

function checkedCount(dayIndex) {
  const habits = habitsForWeek(weekForDay(dayIndex));
  return habits.filter((habit) => isChecked(dayIndex, habit.id)).length;
}

function habitSuccesses(week, habitId) {
  const start = (week - 1) * 7;
  let count = 0;
  for (let day = start; day < start + 7; day += 1) {
    if (isChecked(day, habitId)) count += 1;
  }
  return count;
}

function totalSlots() {
  return [1, 2, 3, 4].reduce((sum, week) => sum + habitsForWeek(week).length * 7, 0);
}

function totalChecked() {
  let count = 0;
  for (let day = 0; day < 28; day += 1) count += checkedCount(day);
  return count;
}

function fullyCompleteDays() {
  let count = 0;
  for (let day = 0; day < 28; day += 1) {
    const needed = habitsForWeek(weekForDay(day)).length;
    if (checkedCount(day) === needed) count += 1;
  }
  return count;
}

function planStatus() {
  const today = new Date();
  const offset = daysBetween(START, today);
  if (offset < 0) {
    const until = Math.abs(offset);
    return `Starts in ${until} day${until === 1 ? "" : "s"}`;
  }
  if (offset > 27) return "Plan complete";
  return `Day ${offset + 1} of 28 · Week ${weekForDay(offset)}`;
}

function currentWeek() {
  const offset = daysBetween(START, new Date());
  if (offset < 0 || offset > 27) return 0;
  return weekForDay(offset);
}

function render() {
  const activeWeek = currentWeek();
  document.querySelector("#plan-status").textContent = planStatus();
  document.querySelector("#total-slots").textContent = String(totalSlots());
  weeksEl.innerHTML = [1, 2, 3, 4].map((week) => weekMarkup(week, activeWeek)).join("");
  updateSummary();
  for (let week = 1; week <= 4; week += 1) updateWeek(week);
}

function weekMarkup(week, activeWeek) {
  const start = dateForDay((week - 1) * 7);
  const end = dateForDay(week * 7 - 1);
  const habits = habitsForWeek(week);
  const fresh = habits[habits.length - 1];

  const habitItems = habits
    .map((habit) => {
      const isNew = habit.unlockWeek === week;
      return `
        <li>
          <span class="tag ${isNew ? "tag-new" : ""}">${isNew ? "New" : "Keep"}</span>
          <div>
            <strong>${habit.title}</strong>
            <p>${habit.detail}</p>
          </div>
        </li>`;
    })
    .join("");

  const trackers = habits
    .map(
      (habit) => `
        <div class="tracker" data-tracker="${week}-${habit.id}">
          <div class="tracker-name">
            <span class="dot" data-habit="${habit.id}"></span>
            <span>${habit.name}</span>
          </div>
          <div class="meter-wrap">
            <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="7" aria-valuenow="0" aria-label="${habit.title}, this week">
              <div class="meter-fill"></div>
            </div>
            <span class="meter-goal" title="5-day goal"></span>
          </div>
          <span class="tracker-count">0/7</span>
        </div>`
    )
    .join("");

  const days = Array.from({ length: 7 }, (_, index) => dayMarkup((week - 1) * 7 + index, habits)).join("");

  return `
    <section class="week ${week === activeWeek ? "is-current" : ""}" id="week-${week}">
      <div class="week-head">
        <div>
          <p class="week-kicker">Week ${week}</p>
          <h2>${formatShort(start)} – ${formatShort(end)}</h2>
          <p class="week-dates">New this week: ${fresh.title}</p>
        </div>
      </div>
      <details class="habit-details">
        <summary>Habits this week: ${habits.length === 1 ? fresh.title : `${habits.length} habits, newest is ${fresh.title.toLowerCase()}`}</summary>
        <ul class="habit-list">${habitItems}</ul>
      </details>
      <p class="goal-note">The mark on each bar is the 5-day goal.</p>
      <div class="trackers">${trackers}</div>
      <div class="days">${days}</div>
    </section>`;
}

function dayMarkup(dayIndex, habits) {
  const date = dateForDay(dayIndex);
  const today = daysBetween(START, new Date()) === dayIndex;
  const tasks = habits
    .map((habit) => {
      const checked = isChecked(dayIndex, habit.id);
      return `
        <label class="task" data-habit="${habit.id}" title="${habit.title}">
          <input
            type="checkbox"
            data-day="${dayIndex}"
            data-habit="${habit.id}"
            aria-label="${formatLong(date)}: ${habit.title}"
            ${checked ? "checked" : ""}
          />
          <span>${habit.name}</span>
        </label>`;
    })
    .join("");

  const done = checkedCount(dayIndex);
  return `
    <article class="day ${today ? "is-today" : ""} ${done === habits.length ? "is-complete" : ""}" data-day="${dayIndex}">
      <div class="day-date">
        <span class="dow">${WEEKDAYS[date.getDay()]}</span>
        <span class="md">${MONTHS[date.getMonth()]} ${date.getDate()}</span>
        ${today ? '<span class="today-badge">Today</span>' : ""}
      </div>
      <div class="tasks">${tasks}</div>
      <span class="day-score">${done}/${habits.length}</span>
    </article>`;
}

function updateSummary() {
  const checked = totalChecked();
  const slots = totalSlots();
  const complete = fullyCompleteDays();
  document.querySelector("#checked-count").textContent = String(checked);
  document.querySelector("#complete-days").textContent = String(complete);
  const meter = document.querySelector("#overall-meter");
  meter.setAttribute("aria-valuemax", String(slots));
  meter.setAttribute("aria-valuenow", String(checked));
  meter.setAttribute("aria-label", `${checked} of ${slots} habits checked`);
  document.querySelector("#overall-fill").style.width = `${slots === 0 ? 0 : (checked / slots) * 100}%`;
}

function updateWeek(week) {
  habitsForWeek(week).forEach((habit) => {
    const count = habitSuccesses(week, habit.id);
    const row = weeksEl.querySelector(`[data-tracker="${week}-${habit.id}"]`);
    if (!row) return;
    row.classList.toggle("is-met", count >= GOAL_DAYS);
    const meter = row.querySelector(".meter");
    meter.setAttribute("aria-valuenow", String(count));
    meter.setAttribute("aria-label", `${habit.title}: ${count} of 7 days, goal ${GOAL_DAYS}`);
    row.querySelector(".meter-fill").style.width = `${(count / 7) * 100}%`;
    row.querySelector(".tracker-count").textContent =
      count >= GOAL_DAYS ? `${count}/7 · goal met` : `${count}/7`;
  });
}

function updateDay(dayIndex) {
  const day = weeksEl.querySelector(`.day[data-day="${dayIndex}"]`);
  if (!day) return;
  const habits = habitsForWeek(weekForDay(dayIndex));
  const done = checkedCount(dayIndex);
  day.classList.toggle("is-complete", done === habits.length);
  day.querySelector(".day-score").textContent = `${done}/${habits.length}`;
}

weeksEl.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
  const dayIndex = Number(input.dataset.day);
  const habitId = input.dataset.habit;
  if (!state[dayIndex]) state[dayIndex] = {};
  if (input.checked) state[dayIndex][habitId] = true;
  else delete state[dayIndex][habitId];
  if (Object.keys(state[dayIndex]).length === 0) delete state[dayIndex];
  saveState();
  updateDay(dayIndex);
  updateWeek(weekForDay(dayIndex));
  updateSummary();
});

resetBtn.addEventListener("click", () => {
  resetDialog.showModal();
});

resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue !== "reset") return;
  state = {};
  localStorage.removeItem(STORAGE_KEY);
  render();
  resetBtn.focus();
});

render();
