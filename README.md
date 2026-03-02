# UniCare Connect
IT3040 ITPM - University Student Support Platform

UniCare Connect is a holistic student support platform built for **IT3040 IT Project Management**. The platform delivers financial support, career development, mentorship, campus integration, and wellness services for Sri Lankan university students.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- MongoDB Atlas
- Firebase Authentication
- Twilio notifications
- Vercel deployment

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` using `.env.example`:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - Lint project
- `npm run typecheck` - TypeScript type check
- `npm run test` - Unit/integration tests (Jest)
- `npm run test:e2e` - E2E tests (Playwright)

## Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` to use sample data without MongoDB/Firebase configured. Demo mode is also enabled automatically when `MONGODB_URI` is not set.

## Troubleshooting MongoDB & Firebase

In development, API responses may include an `error` field with the underlying message. Check the Network tab (e.g. `/api/auth/session`, `/api/auth/preflight`, `/api/users`) to see the exact error.

**Common errors:**

| Error | Cause | Fix |
|-------|--------|-----|
| `MONGODB_URI not configured` | No MongoDB connection string | Set `MONGODB_URI` in `.env.local` (or use demo mode). |
| `FIREBASE_API_KEY_NOT_CONFIGURED` | Server can’t verify Firebase tokens | Set `FIREBASE_WEB_API_KEY` or `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local`. |
| `INVALID_ID_TOKEN` / Firebase auth errors | Wrong API key or token/expiry issue | Use the **Web API Key** from Firebase Console → Project settings → General. Ensure Email/Password (and optionally Google) sign-in is enabled. |
| `DB_CONNECTION_FAILED` (with message in dev) | Connection refused, TLS, or bad URI | Check `MONGODB_URI` format (`mongodb+srv://...` for Atlas). For local/dev with self-signed certs, set `MONGODB_TLS_INSECURE=true` only in dev. |

Copy `.env.example` to `.env.local` and fill in MongoDB and Firebase values (see `.env.example` comments).

## Email verification & dashboards

- **Verification email:** Sent by Firebase (plain, default styling). See **[docs/firebase-email-verification-setup.md](docs/firebase-email-verification-setup.md)** for step-by-step setup (sender name, subject, and optional Action URL so the link opens your app’s styled page).
- **Dashboards:** There is a separate role-based dashboard per role (Student, Admin, Mentor, etc.). After sign-in, users are redirected to `/dashboard/[role]` (e.g. `/dashboard/student`). Dashboard routes do **not** show the main site nav bar or footer—only the dashboard layout and content.

## Module Overview

1. **Financial Support & Job Portal** (Wijesinghe S K)
2. **Career & Scholarship Module** (K D K Dilnuka)
3. **Mentorship & Campus Integration** (L L E Harshana)
4. **Health & Wellness Module** (K.K.T.C. Kamburugoda)

## Documentation

- `docs/openapi.yaml` - API documentation
- `docs/db-schema.md` - Database schema
- `docs/components.md` - Component library
- `docs/deployment.md` - Deployment guide
- `docs/naming-convention.md` - Project naming rules

## Project Structure

```
src/
  app/
  components/
  lib/
  types/
tests/
docs/
```

## Deployment

Deploy to Vercel with the environment variables defined in `.env.example`.
