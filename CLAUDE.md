# CLAUDE.md — Startrail

You are working on Startrail, a north-star pomodoro app. This file encodes the engineering discipline used to build Tasks 0–13. Follow it mechanically. When this file conflicts with your instinct to move fast, this file wins.

## Project facts

- Root of THIS checkout is the only place you work. If the path contains `.worktrees/startrail-mvp`, never touch `~/Projects/dali_timetimer` (the main checkout — other sessions may be active there).
- Stack: Vite + React 19 + TypeScript + Vitest (jsdom) + Zustand. Plain CSS with tokens.
- Commands: `npm test` (must pass, currently 43), `npm run build` (tsc -b + vite), `npm run lint` (oxlint), `npm run dev`.
- Docs: spec `docs/superpowers/specs/2026-07-06-north-star-trail-redesign-design.md`, plan `docs/superpowers/plans/2026-07-06-startrail-mvp.md`, handoff `docs/superpowers/HANDOFF.md`, workflow detail `docs/superpowers/SONNET-MIGRATION.md`.

## Architecture — preserve it

- `src/domain/` — pure TypeScript, zero React, zero I/O. All progress math, session transitions, journey geometry live here and are unit-tested. If you find yourself writing logic in a component, stop and move it here.
- `src/store/useStore.ts` — the ONLY state container. Thin: delegates logic to domain functions. Never add a second source of truth.
- `src/screens/`, `src/components/` — thin renderers. They read the store and call actions. No business logic.
- jsdom cannot do SVG geometry (`getPointAtLength`). Components that need it take an injectable `sampler` prop; tests inject a deterministic one. Do not "fix" this pattern.

## Project conventions (established by review; non-negotiable)

- Every `<button>` has `type="button"`.
- Colors only via `var(--token)` from `src/styles/tokens.css`. Never hardcode hex in components.
- Destructive buttons and placeholder-only inputs get `aria-label` (Korean).
- Session credit rules: completing a session increments exactly once; cancel credits nothing ("no partial credit"). Aggregate progress clamps per-task (`min(completed, estimated)`). Never change these without asking.

## The loop — every change, no exceptions

1. **READ before you touch.** Open the plan section / spec section for the task AND every file you will modify. Quote to yourself what the code does now. If reality contradicts the plan or the task description, STOP and report the contradiction instead of proceeding.
2. **State your assumptions.** Before writing code, list (in your reply) what you are assuming: which files change, what stays untouched, what the tests should prove. If an assumption is unverifiable, verify it with a read/grep first — do not implement on a guess.
3. **Test first.** Write the failing test, RUN it, and confirm it fails for the expected reason (missing module / missing behavior — not a typo). A test that fails for the wrong reason is a bug in your test.
4. **Smallest implementation that passes.** No extra features, no drive-by refactors, no renaming things you weren't asked to touch. If you see something worth fixing outside scope, write it down for the report; do not fix it inline.
5. **Verify — run, don't reason.** `npm test` AND `npm run build` AND `npm run lint` after every task. Paste the actual counts in your report. Never say "should pass". If any is red, you are not done, no matter how confident you are.
6. **Self-review the diff.** `git diff` before committing. Check: does every hunk belong to this task? Did I follow the conventions above? Did I match the plan verbatim where the plan gives code — and if I deviated, is the deviation listed with its reason?
7. **Commit one task = one commit** (plus fix commits from review). Message style: `feat:/fix:/test:/chore:/docs:` prefix. NEVER `git push` unless the user explicitly says push.

## When the plan's own code is wrong

The plan contains verbatim code; twice it contained real bugs (a `useState(fn)` lazy-initializer trap; a missing per-task clamp). If a test fails inexplicably after faithful transcription: suspect the plan code, find the root cause, apply the smallest correct fix, and REPORT the deviation explicitly ("deviated from plan because X, verified by Y"). Never silently diverge and never weaken a test to make it pass.

## Severity calibration (from reviews)

- Critical/Important findings: fix before moving on.
- Minor findings: do NOT fix by default. Record them in the handoff doc's deferred list and continue. Fixing every nit stalls the plan; that is a failure mode, not diligence.

## Escalate instead of guessing

If you need information you don't have, if two interpretations of a requirement both seem valid, or if a fix requires touching architecture the plan didn't anticipate: stop and ask. Statuses to use in reports: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT. A wrong guess costs more than a question.
