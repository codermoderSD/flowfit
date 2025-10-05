# FlowFit

FlowFit is an app that is build for me personally. I have a WFH job due to which I need to stay active and take breaks regularly. FlowFit helps remote and desk-bound workers move regularly by combining configurable timers, time-block awareness, and push notifications. It’s built with Next.js (App Router), React, TypeScript and Tailwind CSS, and includes a service worker + Web Push integration for reliable background notifications.

Whether you want a simple movement reminder or a structured Pomodoro-like flow with configurable "major breaks", FlowFit provides a lightweight, extendable foundation for building productivity and wellness features into web apps.

## Highlights / Available features

- Configurable timers with pause/resume and major break logic (user-configurable major breaks instead of a fixed 4-cycle rule).
- Time blocks integration (auto-pause or adapt timer behaviour when time blocks are active).
- Desktop and mobile-friendly UI with a mobile bottom navigation and a responsive timer circle.
- Web Push integration (service worker, subscription flow, VAPID support) so notifications can be delivered while the app is in the background.
- Notification fallback to the browser Notification API for environments without push support.
- Tiny, pluggable architecture using React Context (`contexts/TimerContext.tsx`) to centralize timer state and actions.
- Example server API endpoints to receive/store push subscriptions and trigger push notifications.

## Repository layout (key files)

- `app/` — Next.js App Router pages and components (main UI lives here).
  - `app/page.tsx` — Main landing/dashboard with timer and mobile nav wiring.
  - `app/layout.tsx` — Root layout with global providers and fonts.
- `components/` — Reusable UI pieces (e.g. `FloatingTimer.tsx`, `mobile-bottom-nav.tsx`).
- `contexts/TimerContext.tsx` — Timer state and notification integration.
- `lib/` — Client utilities such as `lib/push-notifications.ts`.
- `public/service-worker.js` — Service worker that handles push events and notification interactions.
- `app/api/push/` — Example API routes that accept subscriptions and send push payloads.
- `scripts/` — Helpful scripts (migrations, VAPID generator, etc.).

## Quick start (development)

Prerequisites: Node 18+, pnpm (recommended) or npm/yarn.

1. Install dependencies

```bash
pnpm install
```

2. Environment

Create a `.env.local` (copy `.env.example` if present) and add the keys you need. Common variables used in the project:

```text
# Web Push VAPID keys (public key is used in client code)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here

# (Optional) Supabase for persisted time blocks / user settings
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Tip: If you don't have VAPID keys yet you can generate them using the `web-push` CLI or a script. Example using the web-push package:

```bash
npx web-push generate-vapid-keys --json
# or use the included generator script if present: node scripts/generateVapidKeys.js
```

3. Start the dev server

```bash
pnpm dev
# open http://localhost:3000
```

## Testing notifications (local)

1. Open the app in Chrome/Edge/Firefox (service worker + push require HTTPS in production; localhost is allowed for dev).
2. From the UI enable notifications (there is an enable/subscribe flow which registers the service worker and subscribes the browser to push).
3. To send a test push you can use the example API route included in the project (POST to `/api/push/send`) or use a curl request like:

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello from FlowFit","sendToAll":true}'
```

Adjust the payload shape if your local server route expects other fields. If the push fails, the app falls back to showing a regular `Notification` while the page is open.

Service worker debugging tips

- Open DevTools → Application → Service Workers to confirm `service-worker.js` is registered.
- In DevTools → Application → Push, you can simulate push events in supporting browsers.

Notes about production

- Use HTTPS and persist subscriptions in a database (the example API uses in-memory storage; don't rely on this in serverless/production setups).
- Keep your VAPID private key secret (server-only). Only the public VAPID key should be exposed to clients.

## Architecture & implementation notes

- UI: Next.js (App Router) + React + Tailwind CSS. Fonts are loaded via `next/font` in `app/layout.tsx`.
- State: `contexts/TimerContext.tsx` provides the timer, pause/resume, major-break logic and notification helper.
- Notifications: `lib/push-notifications.ts` contains client helpers for registering the service worker and creating a subscription. The service worker is in `public/service-worker.js`.
- API: `app/api/push/*` contains reference endpoints for accepting push subscriptions and sending push payloads to stored subscriptions.

Edge cases and current limitations

- Subscription persistence: Currently subscriptions are stored in-memory in the example API; move to Supabase or another DB for production.
- Serverless environments: If deploying to serverless platforms, store subscriptions in an external DB and avoid in-memory storage across instances.
- Browser support: Web Push and service workers are not available in all browsers or embedded webviews; the app falls back to the Notification API when necessary.

## Where to start building new features

- Integrate a user settings page that persists preferences (timer lengths, major-break interval) to Supabase (`scripts/001_create_tables.sql` includes example migrations).
- Add authentication and associate push subscriptions with user accounts for targeted notifications.
- Add analytics and scheduling logic to consolidate push frequency and avoid spamming the user.
- Expand the time-block feature to query external calendaring APIs and automatically pause/resume based on meetings.

## Contributing

Contributions are welcome. Open an issue for ideas or PRs with focused changes. Please run linters and TypeScript checks before opening a PR.
