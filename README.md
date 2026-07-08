# Startrail

A north-star pomodoro. Every focus session is a step along a contour journey
map toward one big goal. Light map view for planning, dark dial for focus.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build && npm run preview
```

## Structure

- `src/domain/` — pure logic (types, progress, sessions, journey layout), unit-tested
- `src/store/useStore.ts` — Zustand store + localStorage persistence
- `src/screens/` — Onboarding, Home (journey), Focus, Projects, Records
- `src/components/` — JourneyMap, Character, DialTimer, TabBar
- `legacy/` — the previous vanilla-JS app, kept for reference only

See `docs/superpowers/specs/2026-07-06-north-star-trail-redesign-design.md` for the design concept.
