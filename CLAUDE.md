# CLAUDE.md — Startrail

Engineering rules for this repo. Follow them mechanically; when a rule conflicts with your instinct to move fast, the rule wins. Every rule states WHY it exists — most WHYs cite a real incident from this project's own history (Tasks 0–13).

## Project facts

- Work ONLY in this checkout. If the path contains `.worktrees/startrail-mvp`, never touch `~/Projects/dali_timetimer` root (other sessions are active there).
- Stack: Vite + React 19 + TS + Vitest (jsdom) + Zustand. Plain CSS tokens.
- Commands: `npm test` (43 passing) · `npm run build` · `npm run lint` · `npm run dev`.
- Docs: spec `docs/superpowers/specs/2026-07-06-*.md` · plan `docs/superpowers/plans/2026-07-06-startrail-mvp.md` · state `docs/superpowers/HANDOFF.md` · pipeline `docs/superpowers/WORKFLOW.md`.
- Report statuses: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT. Never a confident DONE you haven't verified.

---

## 1. Planning rules

- **P1. No code before an approved spec and plan for feature work.**
  Why: unexamined assumptions are where rework comes from; brainstorming surfaced 8 decision points (goal hierarchy, progress basis, home structure…) that would each have invalidated code written early.
- **P2. Plans contain exact file paths, verbatim code, exact commands, and expected output for every step.**
  Why: the executor may have zero context and mediocre taste; every gap in a plan becomes an improvised (wrong) decision downstream.
- **P3. Design the file structure before the task list.**
  Why: decomposition locks in at planning time; focused single-responsibility files are the unit an LLM edits reliably.
- **P4. Self-review the plan before executing: spec-coverage map, placeholder scan, cross-task name/type consistency.**
  Why: this review caught an unclamped progress aggregate before any code existed — the cheapest bug fix of the whole project.
- **P5. If a plan or spec already exists, verify and adopt it; do not rewrite.**
  Why: a parallel session had already written a 2,200-line plan; verification found it sound plus 2 real defects — rewriting would have wasted the work and kept the defects.
- **P6. Clarify with one question at a time, options + a recommendation first.**
  Why: multi-question walls stall users; a recommendation converts an open question into a cheap yes/no.

## 2. Editing rules

- **E1. Read every file you will modify, in this session, immediately before editing.**
  Why: files drifted mid-session here (another agent edited the spec and plan); editing from memory writes onto a state that no longer exists.
- **E2. State your assumptions before writing: files that change, files that must not, what the tests will prove.**
  Why: written assumptions are checkable; silent assumptions surface later as "misunderstood requirement" review findings.
- **E3. Smallest diff that satisfies the task's tests. No drive-by fixes, renames, or cleanups — note them for the report instead.**
  Why: review operates per-task; unrelated hunks hide bugs, break `git bisect`, and make the spec reviewer's missing/extra classification meaningless.
- **E4. Match the surrounding file's idiom (naming, styling approach, comment density). Comments state only constraints the code can't show.**
  Why: consistency is what makes the next reader (or model) predict correctly; "what the next line does" comments rot instantly.
- **E5. After any source edit, run test + build + lint before claiming anything.**
  Why: "should pass" was said zero times in 13 tasks and that is why 43/43 stayed true; unverified claims compound into rotten foundations.

## 3. Refactoring rules

- **R1. Refactor only from green to green, in its own commit, never mixed with behavior change.**
  Why: when a mixed commit breaks, you cannot attribute the failure; separate commits make every regression bisectable.
- **R2. Extraction needs three occurrences or a demonstrated correctness risk — two is not enough.**
  Why: we deliberately left `Point`/`Sampler` duplicated in 2 files as a recorded Minor; a premature shared module couples files and the wrong abstraction costs more than duplication.
- **R3. Never restructure beyond the task's boundary, even if the code deserves it. Record the observation.**
  Why: scope creep turns a reviewable 60-line diff into an unreviewable 400-line one; deferred-and-recorded beats done-and-unreviewed.
- **R4. Public interfaces (props, exports, store actions) change only when the task IS the interface change; additions must be backward compatible (optional props with defaults).**
  Why: `justFinished`/`sampler` were added as optional with defaults, so zero existing call sites or tests had to change — that is the standard.

## 4. Architecture rules

- **A1. All business logic lives in `src/domain/` as pure functions: zero React, zero I/O, unit-tested.**
  Why: the subtlest bugs of this project (per-task clamping, session credit, journey fractions) were caught in milliseconds-fast pure-function tests; the same bugs inside components would have needed brittle UI tests.
- **A2. One state container (`src/store/useStore.ts`); the store delegates to domain functions and adds only CRUD glue. Views read state and call actions — nothing else.**
  Why: a second source of truth means synchronization bugs; a fat store means untestable logic. `finishSession` is one line because `completeSession` is domain.
- **A3. Environment gaps get injectable seams, not workarounds.**
  Why: jsdom lacks SVG geometry, so JourneyMap takes a `sampler` prop — production runs the real API, tests inject a deterministic one, and both exercise identical rendering code.
- **A4. Persisted state is JSON-plain (no Dates/Maps/classes). Before ANY schema change, add persist `version` + `migrate`.**
  Why: localStorage rehydrates old shapes silently; without migration a renamed field becomes `undefined` at runtime with no error. (Recorded as a pre-condition in the deferred list.)
- **A5. New capability = new focused module wired in, not another block appended to an existing file.**
  Why: files you can hold in context at once are the files you edit without collateral damage.

## 5. Testing rules

- **T1. TDD: write the failing test, RUN it, and confirm it fails for the expected reason before implementing.**
  Why: a test that never failed proves nothing; a test failing for the wrong reason (typo, wrong import) silently validates nothing — both happened in other projects, neither here, because the fail-reason check is mandatory.
- **T2. Test real behavior: real store, real DOM, real timers (faked deterministically) — never mocks of your own modules.**
  Why: FocusScreen tests use the real store + `vi.useFakeTimers`; they'd have caught a credit bug an action-mock never could.
- **T3. Money paths get behavioral tests even when the plan didn't ask.**
  Why: session credit is the product; "completes → exactly one credit, cancel → zero" cost 20 lines and de-risks the feature the whole app exists for.
- **T4. When review exposes untested existing behavior, pin it with a test instead of trusting it.**
  Why: pinning tests (summit marker style, ghost-project fallback, zero-estimate segments) document intent and catch regressions without changing behavior.
- **T5. Never weaken an assertion to make a test pass.**
  Why: Task 8's failing test exposed a genuine React `useState` lazy-initializer bug in the plan's own code; weakening the assertion would have shipped it.
- **T6. Report observed counts ("43 passed"), never expectations.**
  Why: numbers force you to actually run the suite; prose lets you skip it.

## 6. Git rules

- **G1. One task = one commit; review fixes = separate small commits; prefixes feat/fix/test/chore/docs.**
  Why: reviewers reference SHAs and diff ranges per task; mixed commits break that contract and the history stops being an audit trail.
- **G2. Never commit red. Never push unless the user explicitly says push.**
  Why: local commits are reversible, pushes publish; this branch accumulated 25+ commits locally so the user decides the moment of publication once, deliberately.
- **G3. Implementation never starts on main; isolate in a worktree/branch, and verify the worktree dir is gitignored before creating it.**
  Why: a concurrent session was live in the main checkout during this build; isolation is why there were zero collisions.
- **G4. Before overwriting or deleting anything you did not create this turn, inspect it and surface contradictions.**
  Why: an "unexpected" plan file at the target path turned out to be another session's valid 2,200-line work; blind overwrite would have destroyed it.
- **G5. Check `git status` + recent log at session start and before commits.**
  Why: foreign uncommitted changes (an interrupted agent's half-done test edit was found exactly this way) must be adopted or reconciled, never accidentally swept into your commit.

## 7. UI review rules

- **U1. Every interactive element ships with: `type="button"`, an accessible name, visible `:focus-visible`, and correct disabled semantics.**
  Why: reviews flagged these four times (tab bar, delete buttons, onboarding inputs, focus ring); a touch-first app is still operated by keyboards and screen readers, and retrofitting a11y costs more than doing it inline.
- **U2. Destructive controls and placeholder-only inputs REQUIRE `aria-label` (Korean, specific: "{title} 삭제").**
  Why: '×' and placeholder text are invisible to assistive tech — WCAG A; generic labels ("삭제") are ambiguous when a list has ten of them.
- **U3. Empty and zero states are designed, rendered, and tested — not left to fall through.**
  Why: the no-task home card ("태스크를 추가해…" + disabled play) is the first thing every new user sees; an untested empty state means the first-run experience is the least-tested path.
- **U4. Active/selected navigation state is exposed semantically (`aria-current="page"`, attribute omitted when inactive).**
  Why: visual-only distinction (fill color) carries zero information for non-visual users; `'false'` as a string is a common spec violation — omit instead.

## 8. Design review rules

- **D1. Colors and type only via `var(--token)` from `tokens.css`; a new value means a new token first, never inline hex.**
  Why: a hardcoded `#A8A296` slipped in once and was caught in review — inline hex silently forks the palette and breaks the light/dark dual-theme contract that IS this product's visual identity.
- **D2. Every visual change is checked against both themes (cream map world / charcoal focus world).**
  Why: a color that reads on cream can vanish on charcoal — the focus-ring token was chosen orange specifically because ink disappears in dark mode.
- **D3. Features must map onto the product metaphor (session = a step, play = power-on into the dark device, task done = camp, project done = summit, north star = destination) or be rejected/redesigned.**
  Why: the metaphor is the spec's differentiator; a feature that ignores it (e.g., a generic stats popup) erodes the reason this app isn't just another pomodoro.
- **D4. Geometry and motion follow the spec's reference language (dial ring proportional to time, contour map, walk flourish ≈2s) — don't invent new visual vocabulary mid-build.**
  Why: coherence comes from few elements used consistently; each new visual idea multiplies review surface and drifts from the approved design.

## 9. Performance review rules

- **PF1. Measure before optimizing. At this app's scale (one small SVG, ≤ dozens of tasks), memoization is guilty until proven innocent.**
  Why: `WalkedTrail`'s 41 sampler calls per render were reviewed and deliberately left un-memoized — `useMemo` here adds stale-dependency bug surface and saves nothing measurable.
- **PF2. Timers derive remaining time from wall clock (`endsAt - Date.now()`), never from tick counting.**
  Why: browsers throttle background-tab intervals to ≥1s (sometimes minutes); a tick-counting timer drifts, a wall-clock timer completes correctly (merely late), which review confirmed as intended behavior.
- **PF3. Long-lived callbacks read live state via refs, not render-time closures.**
  Why: the countdown's mount-time `active` closure could credit a stale task; `activeRef` fixed it without restarting the timer — the general pattern for any interval/subscription.
- **PF4. Keep persisted state small and flat; localStorage writes are synchronous on the main thread.**
  Why: every store update serializes the whole state; large blobs would jank exactly when the user interacts.

## 10. Error recovery

- **ER1. Before retrying anything that failed, change something: more context, a stronger model, a smaller task, or a different approach. Identical retries are banned.**
  Why: an unchanged retry re-runs the cause; every recovery this session (reviewer emitting nothing, worker rate-limited) succeeded because the retry differed from the failure.
- **ER2. Externally interrupted work (rate limit, crash): inspect what landed on disk first, then finish from there — never redo from scratch.**
  Why: an interrupted fix had already written its test file; the recovery agent confirmed the failing test and added only the implementation, saving the work and avoiding conflicting duplicates.
- **ER3. A malfunctioning delegate (empty output, claims to have delegated) gets one explicit re-prompt ("do it yourself, with your own tools"); if killed externally, dispatch fresh.**
  Why: distinguishing confusion (re-promptable) from environmental death (needs replacement) avoids both infinite nudging and needless restarts.
- **ER4. Made a mistake (wrong path, wrong target)? Fix it, verify the collateral is clean, and say so plainly in the report.**
  Why: the handoff doc once landed in the main checkout by mistake; it was moved, both locations verified, and reported — silent self-correction hides risk and erodes trust in every other claim.
- **ER5. When observed state contradicts expectations (a file that shouldn't exist, a diff you didn't make), STOP and reconcile — assume a concurrent actor, not a glitch.**
  Why: mid-session, "impossible" changes to the spec were another live session's edits; proceeding blindly would have overwritten a colleague's (or user's) work.

## 11. Debug workflow

- **DB1. Reproduce first. No reproduction → no fix, only investigation.**
  Why: a fix you can't watch fail and then pass is a guess wearing a fix's clothes.
- **DB2. Read the actual error text and classify the source: (a) my transcription, (b) the plan/spec itself, (c) the environment/toolchain. Check in that order via `git diff` against the reference.**
  Why: Task 8's "sampler is not a function" looked like transcription error but was class (b) — a bug in the plan's own code; classification is what pointed past the obvious suspect.
- **DB3. One hypothesis at a time, tested with the smallest probe (a log, a one-line test, an isolated call) — not a shotgun of simultaneous changes.**
  Why: multiple concurrent changes make the eventual green uninterpretable; you won't know which change fixed it or what else you broke.
- **DB4. Fix the root cause; never suppress (no swallowed exceptions, no weakened tests, no retry-until-green).**
  Why: the `useState(fn)` trap was fixed with the lazy-initializer wrapper — the actual mechanism — not by changing the test or adding a null guard downstream.
- **DB5. Every fixed bug leaves a regression test that fails without the fix.**
  Why: the dangling-`activeTaskId` fix and the session-credit paths each carry a test; a bug without a tombstone test WILL return in a refactor.
- **DB6. Three failed hypotheses → stop and report BLOCKED with: what you observed, what you tried, what you ruled out.**
  Why: the fourth guess is statistically a flail; a precise BLOCKED report is a designed output of this system, not a failure — bad work is worse than no work.
