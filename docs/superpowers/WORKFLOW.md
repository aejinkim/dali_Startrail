# Complete Workflow — task receipt to handoff

This is the full pipeline used to build Startrail Tasks 0–13, written as an executable procedure. Every numbered item is a stage; every `DECIDE` is a real branch point with its rule. Companion docs: `CLAUDE.md` (per-change loop), `SONNET-MIGRATION.md` (checklists, hooks), `HANDOFF.md` (current state).

---

## Stage 0 — Receiving a task

1. Classify the message:
   - Question / thinking out loud → answer or assess; do NOT change code.
   - Idea or feature ("만들어줘", "develop해줘") → Stage 1 (planning) — never straight to code.
   - Bug report → reproduce first, then root-cause before any fix.
   - Continuation ("계속해줘") → Stage 8 handoff docs first, then resume exactly where state says.
2. DECIDE — does a skill apply? If ≥1% chance, invoke it before responding (brainstorming for creative work, writing-plans for specs, debugging for bugs). Skill process overrides personal instinct.
3. DECIDE — scope of authority: reversible actions that follow from the request → proceed. Destructive, outward-facing (push, publish, delete), or genuine scope changes → ask first.
4. Read persistent context: memory index, HANDOFF.md, recent git log. Never re-derive what is already recorded.

## Stage 1 — Planning

1. Explore project context (files, docs, commits) BEFORE asking anything.
2. DECIDE — is the request one project or several subsystems? Several → decompose; spec only the first.
3. Clarify by dialogue: one question per message, multiple-choice preferred, lead with a recommendation and its reason. Use visual mockups only when the question is visual (layouts, styles), terminal text when conceptual.
4. Converge decisions into a spec document (goal, decisions table, data rules, screens, scope boundary, open questions).
5. Self-review the spec: placeholders? contradictions? two-way-interpretable requirements? single-plan scope? Fix inline.
6. USER GATE: user reviews spec before any plan is written.
7. Write the implementation plan: file structure first (one responsibility per file), then bite-sized tasks (2–5 min steps), each with exact paths, verbatim code, exact commands, expected outputs. TDD steps explicit (write test → run fail → implement → run pass → commit).
8. Self-review the plan: spec coverage map, placeholder scan, cross-task type/name consistency. Fix inline.
9. DECIDE — if an existing plan/spec is discovered (another session, older work): do NOT rewrite. Verify it against the spec, fix real defects (we found an unclamped aggregate and a stale version label), adopt it, and credit the fix in the log.

## Stage 2 — Research (pre-implementation)

1. Establish repo facts once: stack, commands (test/build/lint/dev), conventions, versions (`node --version`, lockfile).
2. DECIDE — concurrency check: `git status` + file timestamps. Evidence another session touched files → surface it to the user and reconcile before proceeding; never silently overwrite work you didn't create.
3. DECIDE — isolation: implementation work never starts on main. Native worktree tool if the session is rooted in the repo; otherwise `git worktree add .worktrees/<name> -b feat/<name>` (verify `.worktrees/` is gitignored first; commit the ignore if not).
4. Baseline: run the test suite in the fresh workspace. Red baseline → stop and report; do not build on failures.
5. DECIDE — execution mode: subagent-per-task (fresh context, two-stage review, same session) vs inline. Default subagent-driven when a written plan exists.

## Stage 3 — Implementation (per task)

1. Extract the task's full text from the plan; never make a worker re-read the plan file.
2. DECIDE — model per role: mechanical task with complete spec (1–2 files) → cheapest model; multi-file/timing/geometry → standard; reviews and architecture → strongest available. When the main session is already the strongest model, keep workers cheap.
3. Dispatch with: verbatim task text, scene-setting context, absolute working path, standing conventions (type="button", tokens only, aria-labels), known pitfalls (jsdom SVG limits, non-interactive scaffolds, oxlint vs eslint), and the report contract (DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT).
4. Worker follows CLAUDE.md's loop: read → state assumptions → failing test (observed, right reason) → smallest implementation → run verification → diff self-review → commit locally.
5. DECIDE — deviation protocol: plan code that fails when transcribed faithfully → suspect the plan, trace the root cause, smallest correct fix, report the deviation with evidence. Never weaken a test; never silently diverge. (Real cases: `useState` lazy-initializer trap; vitest/config import.)
6. DECIDE — status handling: DONE → review. DONE_WITH_CONCERNS → read concerns; correctness concerns get addressed before review, observations get logged. NEEDS_CONTEXT → supply and re-dispatch. BLOCKED → change something (context, model, task size) — never retry unchanged. Externally killed worker (rate limit) → inspect partial state on disk, then dispatch a fresh worker to finish, not redo.

## Stage 4 — Review (two stages, every task)

1. Spec review first. Reviewer instruction: do not trust the implementer's report; read the diff, compare line-by-line to requirements; classify missing / extra / misunderstood; re-run test+build independently.
2. DECIDE — spec verdict: gaps → same implementer fixes (resume the agent, don't spawn new) → spec re-review. A "compliant but plan-faithful quirk" (e.g., dangling activeTaskId the plan itself missed) → controller decides: fix now if cheap and correctness-related.
3. Quality review only after spec passes. Focus: correctness hazards (races, stale closures, leaks), a11y, tokens, test adequacy — with explicit severity.
4. DECIDE — severity calibration: Critical/Important → fix now, re-review the fix. Minor → record in the deferred list, move on. Fixing every nit is a failure mode.
5. DECIDE — reviewer malfunctions (empty result, hallucinated delegation) → re-prompt the same reviewer with "do it yourself, with your own tools"; if killed externally, dispatch a fresh reviewer.

## Stage 5 — Testing

1. The trio after every task: `npm test` + `npm run build` + `npm run lint`. Paste observed counts; "should pass" is banned.
2. Failing test must fail for the expected reason before implementation counts as TDD.
3. Add pinning tests when review exposes untested existing behavior (edge cases, visual distinctions).
4. Money paths get behavioral tests even if the plan didn't ask (session credit: completes once, cancel credits zero — fake timers + real store).
5. DECIDE — what not to automate: environment can't exercise it (jsdom lacks SVG geometry) → injectable seam for tests + explicit note that the real path is covered by manual browser verification, scheduled as its own task.

## Stage 6 — Documentation

1. Docs update the moment a decision resolves (spec's open-questions section shrinks as answers land), not at the end.
2. Deferred Minor findings live in one list (HANDOFF appendix) — never only in chat.
3. Plan amendments are commits too (e.g., stale boilerplate deletion list) so the next executor reads a corrected plan.
4. Commit messages carry the "why" when a fix encodes a decision (clamping, a11y, deviations).

## Stage 7 — Commit

1. One task = one commit; review fixes = separate small commits. Prefixes: feat/fix/test/chore/docs.
2. Never commit red; never leave verification to the next task.
3. NEVER push unless the user explicitly says so. First push of a feature branch is a deliberate, announced step.
4. Before committing anything you didn't author this turn (moved files, other-session artifacts): inspect it; contradictions → surface, don't proceed.

## Stage 8 — Handoff

1. Maintain HANDOFF.md continuously: current state (tasks done, test count, what's NOT done), immediate next actions in order, established conventions, deferred list, session-start ritual (read handoff → git status/log for foreign changes → baseline test → work).
2. DECIDE — end-of-branch: when all tasks pass final review, run a whole-implementation review, then use the finishing skill to choose merge / PR / keep. Never merge silently.
3. Report to the user leads with outcome, states what was verified with observed numbers, names what was deliberately deferred, and stops — no unrequested next work.

---

## The invariants (if you keep only five things)

1. Nothing is "done" until test+build+lint ran green in this turn and the numbers were reported.
2. Reviews never trust reports — they read diffs.
3. Failures change something before retry: context, model, or task size.
4. Scope is sacred: the task's tests define the edit; everything else is a note.
5. Every stage writes its state down — the next session must be able to continue from files alone.
