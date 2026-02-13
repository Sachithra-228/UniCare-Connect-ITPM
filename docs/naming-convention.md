# Naming Convention

Use a simple default convention across this project:

- `kebab-case` for names with multiple words.
- Format: `word-word` (example: `student-profile`).
- Single-word file names should be lowercase (example: `card.tsx`).

## Apply `kebab-case` To

- Route and folder names in `src/app` (example: `financial-aid`).
- API route segments (example: `health-logs`).
- Static assets in `public` (example: `top-hero.png`).
- Component and context file names (example: `theme-toggle.tsx`, `auth-context.tsx`).
- Documentation and non-component file names (example: `db-schema.md`).
- Test file names when using multiple words (example: `landing-page.spec.ts`).

## Code Identifier Rules

- React component identifiers: `PascalCase` (example: `ThemeToggle`).
- Variables and functions: `camelCase` (example: `fetchUserProfile`).
- Constants and env vars: `UPPER_SNAKE_CASE` (example: `NEXT_PUBLIC_DEMO_MODE`).

## Quick Rule

If a new file/folder name has two words, use `word-word`.
