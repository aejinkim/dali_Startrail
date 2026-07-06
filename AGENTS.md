# Dali Timetimer Codex Setup

## Project

This is a static browser app for a north-star based focus timer.

Primary workspace:

`/Users/aejinkim/Projects/dali_timetimer`

## Preferred Skills

Use these skills for this project when the task matches:

- `frontend-design`: default for UI, layout, responsive design, interaction polish, and app screens.
- `browser:control-in-app-browser`: verify the app in the in-app browser, especially local preview, mobile widths, clicks, dialogs, and visual regressions.
- `high-end-visual-design`: use when improving the visual direction, typography, spacing, or premium feel.
- `emil-design-eng`: use when tuning details, transitions, micro-interactions, and component behavior.
- `remember` / `recall`: use when saving or retrieving project decisions, recurring preferences, and prior implementation context.

## Working Style

- Keep the app runnable without a build step unless the user asks for a framework.
- Prefer direct edits to `index.html`, `styles.css`, and `app.js`.
- Keep behavior local-first using `localStorage` unless the user asks for accounts or backend sync.
- Test changes in the browser at desktop and mobile widths when UI changes are made.
- Keep English UI copy natural, concise, and globally usable.

## Local Preview

Run from this folder:

```bash
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/
```

## Verification Checklist

- `node --check app.js`
- Main timer screen loads.
- Goal edit modal opens and saves.
- Task add modal opens and saves.
- Timer start opens goal selection.
- Analytics tab renders without errors.
- Mobile layout does not crop the timer dial or overlap controls.
