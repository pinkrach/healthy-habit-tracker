const STORAGE_KEY = "healthy-habit-tracker-v1";
const GOAL_DAYS = 5;
const START = new Date(2026, 9, 10);
const PLAN_MONTHS = [9, 10];

const HABITS = [
  {
    id: "produce",
    name: "Produce",
    title: "Add 1 serving of produce daily",
    detail: "One serving of fruit or vegetables",
    unlockWeek: 1,
  },
  {
    id: "water",
    name: "Water",
    title: "Reach 8 glasses (64 oz) of water daily",
    detail: "Eight glasses, about 64 ounces",
    unlockWeek: 2,
  },
  {
    id: "grain",
    name: "Whole grain",
    title: "Swap 1 refined grain for whole grain daily",
    detail: "Swap one refined grain for whole grain",
    unlockWeek: 3,
  },
  {
    id: "sweets",
    name: "Sweets",
    title: "Limit sweets to 1 intentional portion daily",
    detail: "One planned portion, or none",
    unlockWeek: 4,
  },
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
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
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const resetBtn = document.querySelector("#reset-btn");
const resetDialog = document.querySelector("#reset-dialog");
const screens = {
  home: document.querySelector("#screen-home"),
  calendar: document.querySelector("#screen-calendar"),
  goals: document.querySelector("#screen-goals"),
};

let state = loadState();
let tab = "home";
let calendarMonth = initialMonth();
let calendarDay = homeDay();

function calendarDayNumber(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(from, to) {
  return Math.round((calendarDayNumber(to) - calendarDayNumber(from)) / 86400000);
}

function todayIndex() {
  const offset = daysBetween(START, new Date());
  if (offset < 0 || offset > 27) return -1;
  return offset;
}

function homeDay() {
  const today = todayIndex();
  if (today >= 0) return today;
  return daysBetween(START, new Date()) < 0 ? 0 : 27;
}

function initialMonth() {
  const today = new Date();
  const month = today.getMonth();
  if (PLAN_MONTHS.includes(month) && today.getFullYear() === 2026) return month;
  return 9;
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

function indexForDate(date) {
  const offset = daysBetween(START, date);
  if (offset < 0 || offset > 27) return -1;
  return offset;
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
  return habitsForWeek(weekForDay(dayIndex)).filter((habit) => isChecked(dayIndex, habit.id)).length;
}

function dayIsComplete(dayIndex) {
  return checkedCount(dayIndex) === habitsForWeek(weekForDay(dayIndex)).length;
}

function habitSuccesses(week, habitId) {
  const start = (week - 1) * 7;
  let count = 0;
  for (let day = start; day < start + 7; day += 1) {
    if (isChecked(day, habitId)) count += 1;
  }
  return count;
}

function streakCount() {
  const offset = daysBetween(START, new Date());
  if (offset < 0) return 0;
  let end = Math.min(offset, 27);
  if (!dayIsComplete(end)) end -= 1;
  let count = 0;
  for (let day = end; day >= 0; day -= 1) {
    if (!dayIsComplete(day)) break;
    count += 1;
  }
  return count;
}

function setCheck(dayIndex, habitId, checked) {
  if (!state[dayIndex]) state[dayIndex] = {};
  if (checked) state[dayIndex][habitId] = true;
  else delete state[dayIndex][habitId];
  if (Object.keys(state[dayIndex]).length === 0) delete state[dayIndex];
  saveState();
  render();
}

const confettiCanvas = document.querySelector("#confetti");
const confettiCtx = confettiCanvas.getContext("2d");
const CONFETTI_COLORS = ["#2FBF62", "#2BB5E0", "#F0B429", "#F0718A", "#FFE066"];
let confettiPieces = [];
let confettiFrame = 0;

function resizeConfetti() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  confettiCanvas.width = Math.round(window.innerWidth * ratio);
  confettiCanvas.height = Math.round(window.innerHeight * ratio);
  confettiCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function burstConfetti(x, y, count) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  resizeConfetti();
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
    const speed = 9 + Math.random() * 8;
    confettiPieces.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      gravity: 0.22 + Math.random() * 0.08,
      size: 7 + Math.random() * 5,
      spin: (Math.random() - 0.5) * 0.34,
      rotation: Math.random() * Math.PI,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      life: 1,
      decay: 0.012 + Math.random() * 0.008,
      round: Math.random() > 0.72,
    });
  }
  if (!confettiFrame) confettiFrame = requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiPieces = confettiPieces.filter((piece) => piece.life > 0);
  confettiPieces.forEach((piece) => {
    piece.vy += piece.gravity;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += piece.spin;
    piece.life -= piece.decay;
    confettiCtx.save();
    confettiCtx.globalAlpha = Math.max(piece.life, 0);
    confettiCtx.translate(piece.x, piece.y);
    confettiCtx.rotate(piece.rotation);
    confettiCtx.fillStyle = piece.color;
    if (piece.round) {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    } else {
      confettiCtx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
    }
    confettiCtx.restore();
  });
  confettiFrame = confettiPieces.length ? requestAnimationFrame(drawConfetti) : 0;
}

function toggleHabit(button) {
  const dayIndex = Number(button.dataset.day);
  const habitId = button.dataset.habit;
  const checking = button.getAttribute("aria-pressed") !== "true";
  const wasComplete = dayIsComplete(dayIndex);
  const mark = button.querySelector(".check").getBoundingClientRect();
  setCheck(dayIndex, habitId, checking);
  if (!checking) return;
  const finishedDay = !wasComplete && dayIsComplete(dayIndex);
  burstConfetti(mark.left + mark.width / 2, mark.top + mark.height / 2, finishedDay ? 42 : 18);
}

function checkIcon() {
  return `<span class="check" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 8.2 6.4 11.1 12.5 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
}

function habitButtons(dayIndex) {
  const date = dateForDay(dayIndex);
  const week = weekForDay(dayIndex);
  return habitsForWeek(week)
    .map((habit) => {
      const checked = isChecked(dayIndex, habit.id);
      const isNew = dayIndex === (habit.unlockWeek - 1) * 7;
      return `
        <button type="button" class="habit" data-day="${dayIndex}" data-habit="${habit.id}" aria-pressed="${checked}" style="--habit: var(--${habit.id})" aria-label="${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}: ${habit.title}">
          ${checkIcon()}
          <span>
            <span class="habit-name">${habit.name}${isNew ? '<span class="pill">New</span>' : ""}</span>
            <span class="habit-detail">${habit.detail}</span>
          </span>
        </button>`;
    })
    .join("");
}

function trackerRow(week, habit) {
  const count = habitSuccesses(week, habit.id);
  return `
    <div class="tracker ${count >= GOAL_DAYS ? "is-met" : ""}" style="--habit: var(--${habit.id})">
      <div class="tracker-name"><span class="dot"></span><span>${habit.name}</span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="7" aria-valuenow="${count}" aria-label="${habit.title}: ${count} of 7 days, goal ${GOAL_DAYS}">
        <div class="bar-fill" style="width: ${(count / 7) * 100}%"></div>
        <span class="bar-goal"></span>
      </div>
      <span class="tracker-count">${count}/7</span>
    </div>`;
}

function renderHome() {
  const day = homeDay();
  const date = dateForDay(day);
  const today = todayIndex();
  const offset = daysBetween(START, new Date());
  const streak = streakCount();
  const habits = habitsForWeek(weekForDay(day));
  const done = checkedCount(day);
  const inPlan = today === day;

  document.querySelector("#home-title").textContent = inPlan ? "Today" : WEEKDAYS[date.getDay()];
  document.querySelector("#home-date").textContent = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  document.querySelector("#home-status").textContent =
    offset < 0
      ? `Starts in ${Math.abs(offset)} day${Math.abs(offset) === 1 ? "" : "s"}`
      : offset > 27
        ? "Plan complete"
        : `Day ${day + 1} of 28`;

  const progress = planDays();
  document.querySelector("#streak-count").textContent = String(streak);
  document.querySelector("#streak-label").textContent = "day streak";
  document.querySelector("#days-passed").textContent = String(progress.passed);
  document.querySelector("#days-left").textContent = String(progress.left);
  document.querySelector("#streak-note").textContent = streakNote(streak, inPlan && dayIsComplete(day), offset);

  document.querySelector("#home-habits-title").textContent = "Habits";
  document.querySelector("#home-score").textContent = `${done} of ${habits.length}`;
  document.querySelector("#home-habits").innerHTML = habitButtons(day);
  fillNote(document.querySelector("#home-note"), day);
}

function planDays() {
  const offset = daysBetween(START, new Date());
  if (offset < 0) return { passed: 0, left: 28 };
  if (offset > 27) return { passed: 28, left: 0 };
  return { passed: offset + 1, left: 27 - offset };
}

function dayNote(dayIndex) {
  const note = state[dayIndex] && state[dayIndex].note;
  return typeof note === "string" ? note : "";
}

function setNote(dayIndex, value) {
  if (!state[dayIndex]) state[dayIndex] = {};
  if (value) state[dayIndex].note = value;
  else delete state[dayIndex].note;
  if (Object.keys(state[dayIndex]).length === 0) delete state[dayIndex];
  saveState();
}

function fillNote(textarea, dayIndex) {
  textarea.dataset.day = String(dayIndex);
  if (document.activeElement === textarea) return;
  textarea.value = dayNote(dayIndex);
}

function streakNote(streak, todayDone, offset) {
  if (offset < 0) return "Your plan begins Saturday, October 10.";
  if (offset > 27) return streak > 0 ? "You kept the streak through the plan." : "The four weeks are finished.";
  if (todayDone) return "Today is complete.";
  if (streak > 0) return "Finish today to keep it going.";
  return "Complete every habit today to start a streak.";
}

function renderCalendar() {
  const monthIndex = PLAN_MONTHS.indexOf(calendarMonth);
  document.querySelector("#calendar-title").textContent = MONTHS[calendarMonth];
  document.querySelector("#calendar-year").textContent = "2026";
  document.querySelector("#prev-month").disabled = monthIndex <= 0;
  document.querySelector("#next-month").disabled = monthIndex >= PLAN_MONTHS.length - 1;

  const first = new Date(2026, calendarMonth, 1);
  const daysInMonth = new Date(2026, calendarMonth + 1, 0).getDate();
  const cells = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(2026, calendarMonth, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayIndex();
  document.querySelector("#calendar-grid").innerHTML = cells
    .map((date) => {
      if (!date) return `<span class="cal-day"></span>`;
      const dayIndex = indexForDate(date);
      if (dayIndex < 0) {
        return `<button type="button" class="cal-day" disabled><span class="num">${date.getDate()}</span></button>`;
      }
      const classes = ["cal-day"];
      if (dayIsComplete(dayIndex)) classes.push("is-done");
      if (dayIndex === today) classes.push("is-today");
      if (dayIndex === calendarDay) classes.push("is-selected");
      return `<button type="button" class="${classes.join(" ")}" data-day="${dayIndex}" aria-label="${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}${dayIsComplete(dayIndex) ? ", goal complete" : ""}" ${dayIndex === calendarDay ? 'aria-current="date"' : ""}><span class="num">${date.getDate()}</span></button>`;
    })
    .join("");

  const detail = document.querySelector("#calendar-day");
  const selectedDate = calendarDay >= 0 ? dateForDay(calendarDay) : null;
  const showDetail = selectedDate && selectedDate.getMonth() === calendarMonth;
  detail.hidden = !showDetail;
  if (!showDetail) return;
  const habits = habitsForWeek(weekForDay(calendarDay));
  document.querySelector("#calendar-day-title").textContent = `${WEEKDAYS[selectedDate.getDay()].slice(0, 3)}, ${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  document.querySelector("#calendar-score").textContent = `${checkedCount(calendarDay)} of ${habits.length}`;
  document.querySelector("#calendar-habits").innerHTML = habitButtons(calendarDay);
  fillNote(document.querySelector("#calendar-note"), calendarDay);
}

function renderGoals() {
  document.querySelector("#goal-weeks").innerHTML = [1, 2, 3, 4]
    .map((week) => {
      const start = dateForDay((week - 1) * 7);
      const end = dateForDay(week * 7 - 1);
      const habits = habitsForWeek(week);
      const fresh = habits[habits.length - 1];
      return `
        <section class="card goal-week">
          <h2>Week ${week}</h2>
          <p class="goal-dates">${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}</p>
          <p class="goal-new">New: ${fresh.title}</p>
          ${habits.map((habit) => trackerRow(week, habit)).join("")}
        </section>`;
    })
    .join("");
}

function render() {
  renderHome();
  renderCalendar();
  renderGoals();
}

function showTab(next) {
  tab = next;
  Object.entries(screens).forEach(([name, screen]) => {
    const active = name === tab;
    screen.classList.toggle("is-active", active);
    screen.hidden = !active;
  });
  document.querySelectorAll(".tab").forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.tab === tab ? "true" : "false");
  });
}

document.querySelector(".tabbar").addEventListener("click", (event) => {
  const button = event.target.closest(".tab");
  if (!button) return;
  showTab(button.dataset.tab);
});

document.querySelector("#home-habits").addEventListener("click", (event) => {
  const button = event.target.closest(".habit");
  if (!button) return;
  toggleHabit(button);
});

document.querySelector("#calendar-habits").addEventListener("click", (event) => {
  const button = event.target.closest(".habit");
  if (!button) return;
  toggleHabit(button);
});

document.querySelector("#calendar-grid").addEventListener("click", (event) => {
  const button = event.target.closest(".cal-day");
  if (!button || button.disabled || !button.dataset.day) return;
  calendarDay = Number(button.dataset.day);
  renderCalendar();
});

document.querySelector("#prev-month").addEventListener("click", () => {
  const index = PLAN_MONTHS.indexOf(calendarMonth);
  if (index <= 0) return;
  calendarMonth = PLAN_MONTHS[index - 1];
  renderCalendar();
});

document.querySelector("#next-month").addEventListener("click", () => {
  const index = PLAN_MONTHS.indexOf(calendarMonth);
  if (index >= PLAN_MONTHS.length - 1) return;
  calendarMonth = PLAN_MONTHS[index + 1];
  renderCalendar();
});

document.querySelectorAll(".note textarea").forEach((textarea) => {
  textarea.addEventListener("input", () => {
    const dayIndex = Number(textarea.dataset.day);
    setNote(dayIndex, textarea.value);
    document.querySelectorAll(".note textarea").forEach((other) => {
      if (other === textarea || Number(other.dataset.day) !== dayIndex) return;
      if (document.activeElement !== other) other.value = textarea.value;
    });
  });
});

resetBtn.addEventListener("click", () => {
  resetDialog.showModal();
});

resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue !== "reset") return;
  state = {};
  localStorage.removeItem(STORAGE_KEY);
  render();
});

render();
