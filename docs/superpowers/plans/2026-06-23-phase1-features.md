# Phase 1 Feature Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 25min timer support, browser session-end notifications, and post-session break timer dialog to Dali Timetimer.

**Architecture:** Pure vanilla JS + HTML/CSS static app with no build step. All changes are direct edits to `index.html` and `app.js`. No new files needed. The `timer` object holds session state; a new `timer.isBreak` boolean flag differentiates break countdowns from focus sessions, allowing `finishSession()` to branch accordingly.

**Tech Stack:** Vanilla JS (ES2022), HTML5 `<dialog>` API, Web Notifications API, no bundler

---

## File Map

| File | Changes |
|------|---------|
| `index.html:82` | `max="20"` → `max="25"` on `#durationRange` |
| `index.html:85` | Range label `"20 min"` → `"25 min"` |
| `index.html:95` | Add `<button data-minutes="25">` to `.preset-row` |
| `index.html:304` | Add `<dialog id="breakDialog">` before `<div class="toast">` |
| `app.js:6-13` | Add `isBreak: false` to `timer` object |
| `app.js:159-167` | `finishSession()` — add notification + break-end branch |
| `app.js:169-189` | `saveCompletedSession()` — append `breakDialog.showModal()` |
| `app.js:498-656` | `bindEvents()` — add `#startBreak` and `#skipBreak` handlers |
| `app.js:658-661` | Init block — add `Notification.requestPermission()` |

---

## Task 1: 25min Timer

**Files:**
- Modify: `index.html:82,85,95`

- [ ] **Step 1: Update slider max and range label**

  In `index.html`, find lines 82–85 and make two changes:

  ```html
  <!-- line 82: change max="20" to max="25" -->
  <input id="durationRange" min="1" max="25" value="5" type="range" />
  <!-- line 84-86: change "20 min" to "25 min" -->
  <div class="range-row">
    <span>1 min</span>
    <span>25 min</span>
  </div>
  ```

- [ ] **Step 2: Add 25-min preset button**

  In `index.html`, find the `.preset-row` (currently at lines 92–96) and add the 25-min button:

  ```html
  <div class="preset-row">
    <button data-minutes="5" type="button">5 min reset</button>
    <button data-minutes="10" type="button">10 min focus</button>
    <button data-minutes="20" type="button">20 min deep focus</button>
    <button data-minutes="25" type="button">25 min pomodoro</button>
  </div>
  ```

- [ ] **Step 3: Verify in browser**

  Open `index.html` directly (or the dev server at `http://127.0.0.1:4173`).
  - Drag the slider to its rightmost position — the `SESSION_LENGTH` label should read `25 min` and the dial should show `25:00`.
  - Click the "25 min pomodoro" button — same result.
  - Verify existing presets (5/10/20 min) still work.

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat: extend timer to 25 min, add 25 min pomodoro preset"
  ```

---

## Task 2: Browser Notifications

**Files:**
- Modify: `app.js:159-167` (finishSession)
- Modify: `app.js:658-661` (init block)

- [ ] **Step 1: Request notification permission on app init**

  In `app.js`, find the bottom init block (currently lines 658–661):

  ```js
  bindEvents();
  bindAuthEvents();
  resetTimer(state.duration);
  render();
  ```

  Replace with:

  ```js
  bindEvents();
  bindAuthEvents();
  resetTimer(state.duration);
  render();
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
  ```

- [ ] **Step 2: Fire notification in finishSession()**

  In `app.js`, find `finishSession()` (currently lines 159–167):

  ```js
  function finishSession() {
    clearInterval(timer.interval);
    timer.interval = null;
    timer.status = "complete";
    timer.remainingSeconds = 0;
    updateTimerDisplay();
    $("#sessionMemo").value = timer.selectedGoal || "";
    $("#completeDialog").showModal();
  }
  ```

  Replace with:

  ```js
  function finishSession() {
    clearInterval(timer.interval);
    timer.interval = null;
    timer.status = "complete";
    timer.remainingSeconds = 0;
    updateTimerDisplay();
    if (Notification.permission === "granted") {
      new Notification("Session Complete", {
        body: timer.selectedGoal || "Focus session finished.",
        icon: "assets/north-star.svg",
      });
    }
    $("#sessionMemo").value = timer.selectedGoal || "";
    $("#completeDialog").showModal();
  }
  ```

- [ ] **Step 3: Verify in browser**

  - Reload the page — browser should prompt for notification permission. Click "Allow".
  - Set timer to 1 min, start and wait for it to finish. A system notification should appear titled "Session Complete".
  - If you previously denied permission, reset it: Chrome → Site Settings → Notifications → Reset.

- [ ] **Step 4: Commit**

  ```bash
  git add app.js
  git commit -m "feat: add browser notification on session complete"
  ```

---

## Task 3: Break Timer Dialog

**Files:**
- Modify: `index.html:304` (add dialog)
- Modify: `app.js:6-13` (timer object)
- Modify: `app.js:159-167` (finishSession — will replace again)
- Modify: `app.js:169-189` (saveCompletedSession)
- Modify: `app.js:498-656` (bindEvents — add handlers)

- [ ] **Step 1: Add breakDialog HTML to index.html**

  In `index.html`, find the line with `<div class="toast"` (currently line 305). Insert the break dialog immediately before it:

  ```html
  <dialog id="breakDialog">
    <form method="dialog" class="modal">
      <h2>Break Time?</h2>
      <p>Good session. Take 5 minutes.</p>
      <div class="modal-actions">
        <button class="outline-btn" id="skipBreak" type="button">Skip</button>
        <button class="solid-btn" id="startBreak" type="button">Start Break ▶</button>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  ```

- [ ] **Step 2: Add isBreak flag to timer object**

  In `app.js`, find the `timer` object (currently lines 6–13):

  ```js
  let timer = {
    interval: null,
    status: "idle",
    selectedGoal: "",
    startedAt: null,
    totalSeconds: state.duration * 60,
    remainingSeconds: state.duration * 60
  };
  ```

  Replace with:

  ```js
  let timer = {
    interval: null,
    status: "idle",
    selectedGoal: "",
    startedAt: null,
    totalSeconds: state.duration * 60,
    remainingSeconds: state.duration * 60,
    isBreak: false
  };
  ```

- [ ] **Step 3: Update finishSession() to handle break end**

  Replace `finishSession()` with the full version that handles both focus-end and break-end:

  ```js
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
  ```

- [ ] **Step 4: Show breakDialog after saving a session**

  In `app.js`, find `saveCompletedSession()` (currently lines 169–189). The function ends with:

  ```js
    saveState();
    $("#completeDialog").close();
    toast("Session saved.");
    resetTimer();
    render();
  }
  ```

  Add `$("#breakDialog").showModal();` as the last line before the closing brace:

  ```js
    saveState();
    $("#completeDialog").close();
    toast("Session saved.");
    resetTimer();
    render();
    $("#breakDialog").showModal();
  }
  ```

- [ ] **Step 5: Add #startBreak and #skipBreak handlers to bindEvents()**

  In `app.js`, find `bindEvents()`. Locate the `$("#syncButton")` handler near the end of the function (currently line 647). Add the break handlers before it:

  ```js
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

    $("#syncButton").addEventListener("click", () => toast("This version saves automatically in this browser."));
  ```

- [ ] **Step 6: Verify in browser — full flow**

  Golden path:
  1. Set timer to 1 min, start session, wait for finish.
  2. `completeDialog` appears → fill in score → click "Save Session".
  3. `breakDialog` appears — "Break Time? Good session. Take 5 minutes."
  4. Click "Start Break ▶" — dial label changes to "Break", countdown from 5:00 starts.
  5. Wait for break to end — toast shows "Break complete. Ready to focus." + notification fires "Break Over".
  6. Dial label returns to "Focus Session", timer resets to default duration.

  Skip path:
  1. Repeat steps 1–3 above.
  2. Click "Skip" — dialog closes cleanly, timer is already reset (no break countdown).

  Edge cases:
  - Session log, analytics, and CSV export are unaffected by break sessions.
  - Stopping the timer during a break (■ button) works normally.

- [ ] **Step 7: Commit**

  ```bash
  git add index.html app.js
  git commit -m "feat: add break timer dialog with 5-min countdown and notifications"
  ```

---

## Success Criteria Checklist

From spec `2026-06-23-feature-additions-design.md`:

- [ ] Slider accepts up to 25 min; 25 min preset button works
- [ ] Browser asks for notification permission on first load
- [ ] Notification fires when session ends (if permission granted)
- [ ] Break dialog appears after saving a session
- [ ] "Start Break" runs a 5-min countdown with "Break" label on dial
- [ ] Break end shows toast + notification, no completeDialog
- [ ] "Skip" closes dialog cleanly, timer resets normally
- [ ] Existing session logging, analytics, CSV export unaffected
