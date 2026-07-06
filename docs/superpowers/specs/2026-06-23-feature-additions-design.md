# Feature Additions Design — Dali Timetimer

**Date:** 2026-06-23
**Scope:** 25min timer · Browser Notification · Break Timer
**Approach:** Minimal changes to existing structure (Approach A)

---

## 1. 25분 타이머

### Changes

**`index.html`**
- Slider: `max="20"` → `max="25"`
- Range label: `"20 min"` → `"25 min"`
- Add preset button: `<button data-minutes="25">25 min pomodoro</button>`

**`app.js`**
- No changes required. Slider and presets already read `data-minutes` dynamically.

---

## 2. 브라우저 알림 (Notification API)

### Changes

**`app.js`**

1. On app init, request permission once:
   ```js
   if (Notification.permission === 'default') {
     Notification.requestPermission();
   }
   ```

2. In `finishSession()`, after clearing the interval, fire notification if permitted:
   ```js
   if (Notification.permission === 'granted') {
     new Notification('Session Complete', {
       body: timer.selectedGoal || 'Focus session finished.',
       icon: 'assets/north-star.svg',
     });
   }
   ```

3. If permission denied → silent skip, existing toast handles feedback.

---

## 3. 휴식 타이머 다이얼로그

### UI

**`index.html`** — new `<dialog id="breakDialog">`:
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
```

### Flow

**`app.js`**

State tracking: add `timer.isBreak = false` flag.

`saveCompletedSession()` — after existing logic, append:
```js
$("#breakDialog").showModal();
```

`#startBreak` click handler:
```js
timer.isBreak = true;
$("#breakDialog").close();
$("#dial .dial-center span").textContent = "Break";
resetTimer(5);
startCountdown();
```

`#skipBreak` click handler:
```js
$("#breakDialog").close();
```

`finishSession()` — check `timer.isBreak` to differentiate break end vs session end:
```js
if (timer.isBreak) {
  timer.isBreak = false;
  $("#dial .dial-center span").textContent = "Focus Session";
  resetTimer(state.duration);
  toast("Break complete. Ready to focus.");
  if (Notification.permission === 'granted') {
    new Notification('Break Over', { body: 'Time to focus.', icon: 'assets/north-star.svg' });
  }
  return; // skip completeDialog
}
```

---

## Success Criteria

- [ ] Slider accepts up to 25 min; 25 min preset button works
- [ ] Browser asks for notification permission on first load
- [ ] Notification fires when session ends (if permission granted)
- [ ] Break dialog appears after saving a session
- [ ] "Start Break" runs a 5-min countdown with "Break" label on dial
- [ ] Break end shows toast + notification, no completeDialog
- [ ] "Skip" closes dialog cleanly, timer resets normally
- [ ] Existing session logging, analytics, CSV export unaffected

---

## Out of Scope

- Full Pomodoro cycle counter (4× sessions → long break)
- Custom break duration
- Mobile responsive fixes (separate task)
