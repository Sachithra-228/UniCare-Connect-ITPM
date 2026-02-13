# UniCare Connect
IT3040 ITPM - University Student Support Platform

UniCare Connect is a holistic student support platform built for **IT3040 IT Project Management**. The platform delivers financial support, career development, mentorship, campus integration, and wellness services for Sri Lankan university students.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- MongoDB Atlas
- Firebase Authentication
- Resend + Twilio notifications
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

Set `NEXT_PUBLIC_DEMO_MODE=true` to use sample data without MongoDB/Firebase configured. Demo mode is enabled by default in `.env.example`.

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
