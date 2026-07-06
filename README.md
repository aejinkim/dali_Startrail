# Dali Timetimer

A product that helps you set your own goals and use Pomodoro sessions to make each day meaningful.

## Run

```bash
cd /Users/aejinkim/Projects/dali_timetimer
python3 -m http.server 4173
```

Open in your browser:

```text
http://127.0.0.1:4173/
```

## Structure

- `index.html`: App markup and screen structure
- `styles.css`: Responsive UI and visual design
- `app.js`: Timer, sessions, analytics, and local persistence
- `assets/north-star.svg`: App icon

## Codex Setup

Use this default setup for this project:

- UI implementation: `frontend-design`
- Browser verification: `browser:control-in-app-browser`
- Design polish: `high-end-visual-design`, `emil-design-eng`
- Project memory: `remember`, `recall`

See `AGENTS.md` for project working rules.

## Supabase Auth

The app supports real email magic-link login through Supabase Auth.

1. Create a Supabase project.
2. Copy the Project URL and public anon key.
3. Open the app, click `LOGIN`, paste both values, and click `SAVE_CONFIG`.
4. Enter an email and click `SEND_MAGIC_LINK`.

For Auth testing, run the local preview server and add `http://127.0.0.1:4173/` to Supabase Auth redirect URLs. Magic-link redirects are not reliable from a raw `file://` URL.

Signed-in users get a separate browser-local data store keyed by their Supabase user id. Database sync can be added next.
