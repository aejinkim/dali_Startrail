const STORAGE_KEY = "north-star-timer-v1";
const AUTH_CONFIG_KEY = "dali-timetimer-supabase-config";
let authClient = null;
let authUser = null;
let state = loadState();
let timer = {
  interval: null,
  status: "idle",
  selectedGoal: "",
  startedAt: null,
  totalSeconds: state.duration * 60,
  remainingSeconds: state.duration * 60,
  isBreak: false
};
let recordPage = 1;
let recordOffset = 0;
let focusLevel = "High";
let contribution = "yes";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function todayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(key) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${key}T12:00:00`));
}

function currentStorageKey() {
  return authUser?.id ? `${STORAGE_KEY}:user:${authUser.id}` : STORAGE_KEY;
}

function loadState() {
  const fallback = {
    northStar: "",
    duration: 5,
    tasks: {},
    records: [],
    feedback: [],
    userName: "User"
  };
  try {
    return normalizeState({ ...fallback, ...JSON.parse(localStorage.getItem(currentStorageKey()) || "{}") });
  } catch {
    return normalizeState(fallback);
  }
}

function normalizeState(nextState) {
  const levelMap = { "\uC0C1": "High", "\uC911": "Medium", "\uD558": "Low" };
  const priorityMap = { "\uAE34\uAE09": "Urgent", "\uC911\uC694": "Important", "\uB8E8\uD2F4": "Routine" };
  const unassigned = "\uBAA9\uD45C \uBBF8\uC9C0\uC815";

  Object.values(nextState.tasks || {}).forEach((tasks) => {
    tasks.forEach((task) => {
      task.priority = priorityMap[task.priority] || task.priority;
    });
  });

  nextState.records = (nextState.records || []).map((record) => ({
    ...record,
    goal: record.goal === unassigned ? "Unassigned" : record.goal,
    level: levelMap[record.level] || record.level
  }));

  return nextState;
}

function saveState() {
  localStorage.setItem(currentStorageKey(), JSON.stringify(state));
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2300);
}

function dayTasks(key = todayKey()) {
  state.tasks[key] ||= [];
  return state.tasks[key];
}

function todayRecords(offset = 0) {
  return state.records.filter((record) => record.date === todayKey(offset));
}

function sevenDayKeys() {
  return Array.from({ length: 7 }, (_, index) => todayKey(index - 6));
}

function formatClock(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function download(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvFor(records) {
  const headers = ["date", "time", "minutes", "goal", "focus", "level", "contribution", "memo"];
  const rows = records.map((record) => [
    record.date,
    record.time,
    record.minutes,
    record.goal,
    record.focus,
    record.level,
    record.contribution,
    record.memo
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function updateTimerDisplay() {
  const progress = timer.totalSeconds ? (1 - timer.remainingSeconds / timer.totalSeconds) * 360 : 0;
  $("#timeDisplay").textContent = formatClock(timer.remainingSeconds);
  $("#dial").style.setProperty("--progress", `${progress}deg`);
  $("#durationLabel").textContent = `${state.duration} min`;
  $("#durationRange").value = state.duration;
  $("#startButton").textContent = timer.status === "running" ? "▶" : "▶";
}

function resetTimer(minutes = state.duration) {
  clearInterval(timer.interval);
  timer.interval = null;
  timer.status = "idle";
  timer.totalSeconds = minutes * 60;
  timer.remainingSeconds = minutes * 60;
  timer.startedAt = null;
  updateTimerDisplay();
}

function startCountdown() {
  timer.status = "running";
  timer.startedAt ||= new Date().toISOString();
  clearInterval(timer.interval);
  timer.interval = setInterval(() => {
    timer.remainingSeconds -= 1;
    updateTimerDisplay();
    if (timer.remainingSeconds <= 0) finishSession();
  }, 1000);
}

function finishSession() {
  clearInterval(timer.interval);
  timer.interval = null;
  timer.status = "complete";
  timer.remainingSeconds = 0;
  updateTimerDisplay();
  if (Notification.permission === "granted") {
    new Notification(timer.isBreak ? "Break Over" : "Session Complete", {
      body: timer.isBreak ? "Time to focus." : (timer.selectedGoal || "Focus session finished."),
      icon: "assets/north-star.svg",
    });
  }
  if (timer.isBreak) {
    timer.isBreak = false;
    $("#dial .dial-center span").textContent = "Focus Session";
    resetTimer(state.duration);
    toast("Break complete. Ready to focus.");
    return;
  }
  $("#sessionMemo").value = timer.selectedGoal || "";
  $("#completeDialog").showModal();
}

function saveCompletedSession() {
  const now = new Date();
  state.records.unshift({
    id: crypto.randomUUID(),
    date: todayKey(),
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    minutes: Math.round(timer.totalSeconds / 60),
    goal: timer.selectedGoal || "Unassigned",
    focus: Number($("#focusScore").value),
    level: focusLevel,
    contribution,
    memo: $("#sessionMemo").value.trim(),
    startedAt: timer.startedAt,
    completedAt: now.toISOString()
  });
  saveState();
  $("#completeDialog").close();
  toast("Session saved.");
  resetTimer();
  render();
  $("#breakDialog").showModal();
}

function renderTasks() {
  const list = $("#taskList");
  const tasks = dayTasks();
  if (!tasks.length) {
    list.innerHTML = `<li class="task-item"><span></span><p>Add a target for today.</p><span class="pill">0/3</span></li>`;
    return;
  }
  list.innerHTML = tasks
    .map((task) => `
      <li class="task-item ${task.done ? "done" : ""}" data-id="${task.id}">
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Complete" />
        <div><strong>${escapeHtml(task.title)}</strong><br><span class="pill">${task.priority}</span></div>
        <button class="outline-btn" type="button">Delete</button>
      </li>
    `)
    .join("");
  $$(".task-item input").forEach((input) => {
    input.addEventListener("change", (event) => {
      const id = event.target.closest(".task-item").dataset.id;
      const task = dayTasks().find((item) => item.id === id);
      task.done = event.target.checked;
      saveState();
      renderTasks();
    });
  });
  $$(".task-item button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const id = event.target.closest(".task-item").dataset.id;
      state.tasks[todayKey()] = dayTasks().filter((item) => item.id !== id);
      saveState();
      renderTasks();
      toast("Target deleted.");
    });
  });
}

function renderRecords(offset = 0) {
  recordOffset = offset;
  const records = todayRecords(offset);
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(records.length / perPage));
  recordPage = Math.min(recordPage, totalPages);
  const pageRecords = records.slice((recordPage - 1) * perPage, recordPage * perPage);
  const label = offset === 0 ? "Today" : offset === -1 ? "Yesterday" : `${Math.abs(offset)} days ago`;
  $("#recordCount").textContent = records.length ? `${label}: ${records.length} sessions` : `No sessions for ${label}.`;
  $("#recordList").innerHTML = pageRecords.length
    ? pageRecords.map((record) => `
      <article class="record">
        <div class="record-top">
          <strong>${escapeHtml(record.goal)}</strong>
          <span class="pill">${record.minutes} min</span>
        </div>
        <p>${escapeHtml(record.memo || "No notes")}</p>
        <div class="record-meta">
          <span>${record.time}</span>
          <span>Focus ${record.focus}/10 · ${record.level} · ${contributionLabel(record.contribution)}</span>
        </div>
      </article>
    `).join("")
    : `<article class="record"><p>Completed sessions will appear here.</p></article>`;
  $("#pageInfo").textContent = `${recordPage} / ${totalPages}`;
  $("#prevPage").disabled = recordPage <= 1;
  $("#nextPage").disabled = recordPage >= totalPages;
}

function contributionLabel(value) {
  return { yes: "Aligned", partial: "Partly aligned", no: "Not aligned" }[value] || "Aligned";
}

function renderAnalytics() {
  const keys = sevenDayKeys();
  const records = state.records.filter((record) => keys.includes(record.date));
  const totalMinutes = records.reduce((sum, record) => sum + record.minutes, 0);
  const activeDays = new Set(records.map((record) => record.date)).size;
  const avgFocus = records.length ? (records.reduce((sum, record) => sum + record.focus, 0) / records.length).toFixed(1) : "-";
  const goalLinked = records.filter((record) => record.goal !== "Unassigned").length;
  const goalRate = records.length ? Math.round((goalLinked / records.length) * 100) : 0;
  $("#weekRange").textContent = `${formatDateLabel(keys[0])} - ${formatDateLabel(keys[6])}`;
  $("#weekSessions").textContent = `${records.length} sessions`;
  $("#weekMinutes").textContent = `${totalMinutes} min`;
  $("#activeDays").textContent = `${activeDays}/7 days`;
  $("#avgFocus").textContent = `${avgFocus}/10`;
  $("#goalPercent").textContent = records.length ? `${goalRate}%` : "-%";
  $("#alignmentMetric").textContent = records.length ? `${goalRate}%` : "--";
  $("#driftMetric").textContent = `${records.length - goalLinked}`;
  $("#goalStatus").textContent = state.northStar || "Set a goal first";
  $("#goalStatusDetail").textContent = records.length ? `${goalLinked} sessions were linked to your goal in the last 7 days.` : "Set today's goal to track session alignment.";

  const maxDaily = Math.max(1, ...keys.map((key) => state.records.filter((record) => record.date === key).length));
  const bars = keys.map((key) => {
    const count = state.records.filter((record) => record.date === key).length;
    return `<div class="bar"><i style="height:${(count / maxDaily) * 100}%"></i><span>${formatDateLabel(key).slice(0, 4)}</span></div>`;
  }).join("");
  $("#dailyBars").innerHTML = bars;
  $("#goalBars").innerHTML = bars;

  const hours = Array.from({ length: 24 }, (_, hour) => records.filter((record) => Number(record.completedAt?.slice(11, 13)) === hour).length);
  const maxHour = Math.max(1, ...hours);
  $("#hourHeat").innerHTML = hours.map((count) => `<i style="height:${Math.max(8, (count / maxHour) * 140)}px; opacity:${0.18 + count / maxHour * 0.82}"></i>`).join("");

  const levels = ["High", "Medium", "Low"].map((level) => ({ level, count: records.filter((record) => record.level === level).length }));
  const maxLevel = Math.max(1, ...levels.map((item) => item.count));
  $("#focusStack").innerHTML = levels.map((item) => `
    <div class="focus-row"><span>${item.level}</span><i style="width:${(item.count / maxLevel) * 100}%"></i><b>${item.count}</b></div>
  `).join("");

  const words = records.flatMap((record) => (record.memo || record.goal || "").split(/\s+/))
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter((word) => word.length > 1 && !["goal", "session", "today", "the", "and", "for", "with"].includes(word));
  const counts = words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9);
  $("#tagCloud").innerHTML = tags.length ? tags.map(([word, count]) => `<span>${escapeHtml(word)} ${count}</span>`).join("") : "Not enough notes to analyze yet.";
  $("#weeklyInsight").textContent = buildInsight(records, totalMinutes, goalRate, avgFocus);
}

function buildInsight(records, minutes, goalRate, avgFocus) {
  if (!records.length) return "No sessions in the last 7 days yet. Save your first session and patterns will appear here.";
  if (goalRate >= 75) return `Strong alignment: most of your ${records.length} sessions supported your North Star, with ${minutes} minutes logged.`;
  if (Number(avgFocus) < 6) return `You are building momentum, but your average focus is ${avgFocus}/10. Try choosing a smaller target before each session.`;
  return `You logged ${records.length} sessions and ${minutes} minutes in the last 7 days. Next: reduce unassigned sessions.`;
}

function renderGoalChoices() {
  const goals = [state.northStar, ...dayTasks().filter((task) => !task.done).map((task) => task.title)].filter(Boolean);
  $("#goalChoices").innerHTML = goals.length
    ? goals.map((goal, index) => `<button class="${index === 0 ? "is-active" : ""}" data-goal="${escapeAttr(goal)}" type="button">${escapeHtml(goal)}</button>`).join("")
    : `<p>No goals available yet. You can type another activity.</p>`;
  timer.selectedGoal = goals[0] || "";
  $$("#goalChoices button").forEach((button) => {
    button.addEventListener("click", () => {
      $$("#goalChoices button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      timer.selectedGoal = button.dataset.goal;
      $("#otherGoal").value = "";
    });
  });
}

function render() {
  const today = todayKey();
  const todaysRecords = todayRecords();
  $("#todayLabel").textContent = formatDateLabel(today);
  $("#northStarText").textContent = state.northStar || "Set your goal";
  $("#todaySessions").textContent = `${todaysRecords.length} Sessions`;
  $("#todayMinutes").textContent = `${todaysRecords.reduce((sum, record) => sum + record.minutes, 0)} m`;
  $("#loginButton").textContent = authUser ? "LOGOUT" : "LOGIN";
  $("#profileButton").textContent = (authUser?.email || state.userName).slice(0, 1).toUpperCase();
  updateTimerDisplay();
  renderTasks();
  renderRecords();
  renderAnalytics();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function getAuthConfig() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAuthConfig(url, anonKey) {
  localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify({ url, anonKey }));
}

function updateAuthStatus(message) {
  const status = $("#authStatus");
  if (status) status.textContent = message;
}

function getRedirectUrl() {
  return window.location.href.split("#")[0];
}

function initializeAuthClient() {
  const config = getAuthConfig();
  const canConnect = Boolean(config.url && config.anonKey && window.supabase?.createClient);
  if (!canConnect) {
    authClient = null;
    updateAuthStatus("AUTH_STATUS : CONFIG_REQUIRED");
    return null;
  }

  authClient = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  updateAuthStatus("AUTH_STATUS : READY");
  return authClient;
}

async function refreshAuthSession() {
  if (!authClient) return;
  const { data, error } = await authClient.auth.getSession();
  if (error) {
    updateAuthStatus("AUTH_ERROR : " + error.message);
    return;
  }
  applyAuthUser(data.session?.user || null);
}

function applyAuthUser(user) {
  const previousUserId = authUser?.id || null;
  authUser = user;
  state.userName = user?.email || "User";
  if ((user?.id || null) !== previousUserId) {
    state = loadState();
    state.userName = user?.email || "User";
  }
  updateAuthUi();
  render();
}

function updateAuthUi() {
  const config = getAuthConfig();
  if ($("#supabaseUrl")) $("#supabaseUrl").value = config.url || "";
  if ($("#supabaseAnonKey")) $("#supabaseAnonKey").value = config.anonKey || "";
  if ($("#authEmail") && authUser?.email) $("#authEmail").value = authUser.email;

  if (authUser) {
    updateAuthStatus("AUTH_STATUS : SIGNED_IN_AS " + authUser.email);
  } else if (config.url && config.anonKey && authClient) {
    updateAuthStatus("AUTH_STATUS : READY_FOR_MAGIC_LINK");
  } else {
    updateAuthStatus("AUTH_STATUS : CONFIG_REQUIRED");
  }
}

async function sendMagicLink() {
  if (!authClient) initializeAuthClient();
  if (!authClient) {
    updateAuthStatus("AUTH_STATUS : SAVE_CONFIG_FIRST");
    toast("Save Supabase URL and anon key first.");
    return;
  }

  const email = $("#authEmail").value.trim();
  if (!email) {
    toast("Enter your email first.");
    return;
  }

  updateAuthStatus("AUTH_STATUS : SENDING_MAGIC_LINK");
  const { error } = await authClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: getRedirectUrl() }
  });

  if (error) {
    updateAuthStatus("AUTH_ERROR : " + error.message);
    toast(error.message);
    return;
  }

  updateAuthStatus("AUTH_STATUS : MAGIC_LINK_SENT_TO " + email);
  toast("Magic link sent. Check your email.");
}

async function signOut() {
  if (!authClient) initializeAuthClient();
  if (authClient) await authClient.auth.signOut();
  applyAuthUser(null);
  toast("Signed out.");
}

function bindAuthEvents() {
  const config = getAuthConfig();
  if ($("#supabaseUrl")) $("#supabaseUrl").value = config.url || "";
  if ($("#supabaseAnonKey")) $("#supabaseAnonKey").value = config.anonKey || "";

  $("#saveAuthConfig").addEventListener("click", () => {
    const url = $("#supabaseUrl").value.trim();
    const anonKey = $("#supabaseAnonKey").value.trim();
    if (!url || !anonKey) {
      toast("Add both Supabase URL and anon key.");
      return;
    }
    saveAuthConfig(url, anonKey);
    initializeAuthClient();
    if (authClient) {
      authClient.auth.onAuthStateChange((_event, session) => applyAuthUser(session?.user || null));
      refreshAuthSession();
    }
    toast("Auth config saved.");
  });

  $("#sendMagicLink").addEventListener("click", sendMagicLink);
  $("#signOutButton").addEventListener("click", signOut);

  initializeAuthClient();
  if (authClient) {
    authClient.auth.onAuthStateChange((_event, session) => applyAuthUser(session?.user || null));
    refreshAuthSession();
  }
}

function bindEvents() {
  $$(".tab[data-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
      $$(".view").forEach((view) => view.classList.remove("is-active"));
      $(`#${tab.dataset.tab}View`).classList.add("is-active");
      renderAnalytics();
    });
  });

  $("#northStarEdit").addEventListener("click", () => {
    $("#northInput").value = state.northStar;
    $("#northDialog").showModal();
  });
  $("#northSave").addEventListener("click", () => {
    state.northStar = $("#northInput").value.trim();
    saveState();
    $("#northDialog").close();
    render();
    toast("North Star saved.");
  });

  $("#durationRange").addEventListener("input", (event) => {
    if (timer.status === "running") return;
    state.duration = Number(event.target.value);
    saveState();
    resetTimer(state.duration);
  });
  $$(".preset-row button").forEach((button) => {
    button.addEventListener("click", () => {
      if (timer.status === "running") return toast("Stop the current session first.");
      state.duration = Number(button.dataset.minutes);
      saveState();
      resetTimer(state.duration);
    });
  });

  $("#startButton").addEventListener("click", () => {
    if (timer.status === "running") return;
    if (timer.status === "paused") return startCountdown();
    renderGoalChoices();
    $("#goalDialog").showModal();
  });
  $("#pauseButton").addEventListener("click", () => {
    if (timer.status !== "running") return;
    clearInterval(timer.interval);
    timer.interval = null;
    timer.status = "paused";
    toast("Paused.");
  });
  $("#stopButton").addEventListener("click", () => {
    if (timer.status === "idle") return;
    resetTimer();
    toast("Session stopped.");
  });
  $("#skipGoal").addEventListener("click", () => {
    timer.selectedGoal = "";
    $("#goalDialog").close();
    startCountdown();
  });
  $("#confirmGoal").addEventListener("click", () => {
    timer.selectedGoal = $("#otherGoal").value.trim() || timer.selectedGoal;
    $("#goalDialog").close();
    startCountdown();
  });
  $("#otherGoal").addEventListener("input", () => {
    if ($("#otherGoal").value.trim()) $$("#goalChoices button").forEach((button) => button.classList.remove("is-active"));
  });

  $("#taskOpen").addEventListener("click", () => {
    if (dayTasks().length >= 3) return toast("You can add up to 3 targets for today.");
    $("#taskInput").value = "";
    $("#taskDialog").showModal();
  });
  $("#taskSave").addEventListener("click", () => {
    const title = $("#taskInput").value.trim();
    if (!title) return toast("Enter a target first.");
    if (dayTasks().length >= 3) return toast("You can add up to 3 targets for today.");
    dayTasks().push({ id: crypto.randomUUID(), title, priority: $("#taskPriority").value, done: false });
    saveState();
    $("#taskDialog").close();
    renderTasks();
  });
  $("#copyYesterday").addEventListener("click", () => {
    const yesterday = dayTasks(todayKey(-1));
    if (!yesterday.length) return toast("No targets from yesterday.");
    state.tasks[todayKey()] = yesterday.slice(0, 3).map((task) => ({ ...task, id: crypto.randomUUID(), done: false }));
    saveState();
    renderTasks();
    toast("Copied yesterday's targets.");
  });

  $$("#focusLevel button").forEach((button) => {
    button.addEventListener("click", () => {
      focusLevel = button.dataset.level;
      $$("#focusLevel button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
  $$("#contributionChoice button").forEach((button) => {
    button.addEventListener("click", () => {
      contribution = button.dataset.value;
      $$("#contributionChoice button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
  $("#saveRecord").addEventListener("click", saveCompletedSession);

  $("#prevPage").addEventListener("click", () => {
    recordPage -= 1;
    renderRecords(recordOffset);
  });
  $("#nextPage").addEventListener("click", () => {
    recordPage += 1;
    renderRecords(recordOffset);
  });
  $("#yesterdayRecords").addEventListener("click", () => {
    recordPage = 1;
    renderRecords(-1);
    toast("Showing yesterday's sessions.");
  });
  $("#exportDay").addEventListener("click", () => download(`focus-${todayKey()}.csv`, csvFor(todayRecords())));
  $("#exportWeek").addEventListener("click", () => {
    const keys = sevenDayKeys();
    download(`focus-week-${keys[0]}-${keys[6]}.csv`, csvFor(state.records.filter((record) => keys.includes(record.date))));
  });
  $("#closeDay").addEventListener("click", () => {
    download(`daily-close-${todayKey()}.csv`, csvFor(todayRecords()));
    toast("Today's log downloaded.");
  });

  $("#feedbackOpen").addEventListener("click", () => $("#feedbackDialog").showModal());
  $("#feedbackSend").addEventListener("click", () => {
    const body = $("#feedbackBody").value.trim();
    if (!body) return toast("Write a message first.");
    state.feedback.unshift({
      id: crypto.randomUUID(),
      type: $("#feedbackType").value,
      body,
      contact: $("#feedbackContact").value.trim(),
      createdAt: new Date().toISOString()
    });
    saveState();
    $("#feedbackDialog").close();
    $("#feedbackBody").value = "";
    $("#feedbackContact").value = "";
    toast("Feedback saved locally.");
  });
  $("#startBreak").addEventListener("click", () => {
    timer.isBreak = true;
    $("#breakDialog").close();
    $("#dial .dial-center span").textContent = "Break";
    resetTimer(5);
    startCountdown();
  });
  $("#skipBreak").addEventListener("click", () => {
    $("#breakDialog").close();
  });

  // long-press on dial → duration picker
  let pressTimer = null;
  const dialEl = $("#dial");
  const startPress = () => {
    pressTimer = setTimeout(() => {
      if (timer.status === "running") return;
      $("#durationInput").value = state.duration;
      $("#durationDialog").showModal();
    }, 600);
  };
  const endPress = () => clearTimeout(pressTimer);
  dialEl.addEventListener("mousedown", startPress);
  dialEl.addEventListener("mouseup", endPress);
  dialEl.addEventListener("mouseleave", endPress);
  dialEl.addEventListener("touchstart", startPress, { passive: true });
  dialEl.addEventListener("touchend", endPress);
  dialEl.addEventListener("touchcancel", endPress);

  $$("#durationDialog .duration-presets button").forEach((btn) => {
    btn.addEventListener("click", () => { $("#durationInput").value = btn.dataset.min; });
  });
  $("#durationSave").addEventListener("click", () => {
    const val = Math.max(1, Math.min(90, parseInt($("#durationInput").value) || state.duration));
    state.duration = val;
    saveState();
    $("#durationDialog").close();
    resetTimer(val);
    toast(`Duration set to ${val} min.`);
  });

  $("#northStarEditGoals").addEventListener("click", () => {
    $("#northInput").value = state.northStar;
    $("#northDialog").showModal();
  });

  $("#syncButton").addEventListener("click", () => toast("This version saves automatically in this browser."));
  $("#loginButton").addEventListener("click", () => {
    if (authUser) {
      signOut();
      return;
    }
    updateAuthUi();
    $("#authDialog").showModal();
  });
}

bindEvents();
bindAuthEvents();
resetTimer(state.duration);
render();
if (Notification.permission === "default") {
  Notification.requestPermission();
}
