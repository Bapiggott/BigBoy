# AGENTS.md — BigBoy App Rules

## Goal
Make the app demo-ready without POS/payment integrations.

## Architecture
- Mobile app: /app (Expo)
- Backend: /server (Express + Prisma + MySQL via docker compose)
- DB: MySQL in Docker

## Commands
- Start DB: docker compose up -d mysql
- Server dev: cd server && npm run dev
- App dev: cd app && npx expo start -c

## Coding rules
- Prefer API-driven data over mock data; keep mock as fallback only.
- Any new feature must include:
  1) backend route (if data-backed),
  2) prisma model changes (if needed),
  3) seed updates,
  4) UI loading + error + empty states.
- Keep PRs small (< ~300 lines changed) unless unavoidable.
- Never hardcode localhost in app for phone demos; use config.

## “Demo must work” checklist
- Menu loads from API
- Categories correct + ordered
- Images never crash; placeholder fallback
- Locations smooth + “open/closed”
- Favorites + substitutions
- Promo codes
- News section
- Auth + forgot password
