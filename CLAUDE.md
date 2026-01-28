# Asset AI - Claude Code Context

> AI-powered chat application for querying and analyzing assets. Users interact via natural language queries with filtering capabilities.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **UI**: React 18 + TypeScript 5
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React + MUI Icons
- **Tables**: TanStack React Table
- **Theme**: next-themes (dark mode support)

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build (run before committing)
npm run start    # Production server
npm run lint     # ESLint - fix all errors before committing
```

## Project Structure

```text
app/                    # Next.js App Router pages
  auth/                 # Authentication page
  chat/                 # Chat interface
components/
  ui/                   # shadcn/ui (DO NOT edit directly)
  auth/                 # Authentication components
services/
  auth-api.ts           # Auth API service (login, signup, tokens)
hooks/
  useAccessToken.ts     # Auth token hook
lib/
  utils.ts              # cn() utility and helpers
```

---

## Code Standards

### TypeScript - Strict Mode Required

- **ALWAYS use `type` over `interface`** for type definitions
- **NEVER use `any`** - use `unknown` and narrow with type guards
- **NEVER use enums** - use union types or `as const` objects
- Use explicit return types for exported functions
- Use `Record<K, V>` for object maps

### React Components

- **Functional components only** - no class components
- **Minimize `'use client'`** - prefer Server Components
- Wrap client components in `<Suspense>` with fallback UI
- Use `dynamic()` for non-critical components
- Component order: hooks → derived state → handlers → render

### Naming Conventions

| Type            | Convention            | Example                              |
| --------------- | --------------------- | ------------------------------------ |
| Components      | PascalCase            | `ChatWindow.tsx`                     |
| Utilities/Hooks | camelCase             | `useAccessToken.ts`                  |
| Booleans        | Auxiliary verb prefix | `isLoading`, `hasError`, `canSubmit` |
| Handlers        | `handle` prefix       | `handleClick`, `handleSubmit`        |
| Constants       | UPPER_SNAKE_CASE      | `DEFAULT_TIMEOUT`                    |

---

## State Management

### State Hierarchy

1. **Server state**: Fetch in Server Components when possible
2. **Context**: Auth state (`useAuth`)
3. **Local UI state**: `useState` (modals, form inputs)

---

## Styling

- Use `cn()` from `@/lib/utils` for conditional classes
- Support dark mode with `dark:` prefix

## shadcn/ui

- Import from `@/components/ui/`
- **DO NOT manually edit** files in `components/ui/`
- Add new: `npx shadcn@latest add <component>`

---

## API Patterns

- All API calls through service files in `services/`
- Use `AbortController` for cancellable requests
- Handle specific HTTP status codes
- Ignore `AbortError` in catch blocks

---

## Performance

- Use `useCallback` for handlers passed as props
- Use `useMemo` for expensive computations
- Lazy load with `dynamic()` for non-critical components
- Use `<Suspense>` with Loading UI for async operations
- Fetch data in parallel where possible
- Use Next.js `<Image>` with proper `sizes` attribute

---

## Memory Leaks & Cleanup

### Required cleanup on unmount

- **Event listeners** - Store handler in ref, remove in cleanup
- **Timeouts/Intervals** - Track in ref, clear in cleanup
- **AbortController** - Cancel in-flight requests

---

## Security

### Checklist

- Never expose secrets in client code
- Validate all user inputs with Zod
- Use `NEXT_PUBLIC_` prefix only for public env vars
- Store tokens securely in localStorage
- Clear tokens on logout

---

## Accessibility (a11y)

- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- All interactive elements must be keyboard accessible
- Add `aria-label` for icon-only buttons
- Minimum touch target: 24x24 CSS pixels
- **Form fields must have `id` and `name` attributes** for proper autofill support
- **Add `autocomplete` attribute** to form fields (e.g., `email`, `current-password`)
- **Labels must be associated with form fields** - use `htmlFor` matching field `id`
- **Buttons must have `cursor-pointer`**

---

## Error Handling

- User-friendly error messages
- Toast notifications for transient errors
- Implement retry with exponential backoff for flaky APIs

---

## Git Workflow

- **Main branch**: `master`
- **Commit messages**: imperative mood, concise
- Run `npm run build && npm run lint` before committing

---

## DON'Ts - Critical Rules

- **DON'T** create new files when editing existing ones suffices
- **DON'T** add comments to code you didn't write
- **DON'T** over-engineer with abstractions for single-use code
- **DON'T** add error handling for impossible scenarios
- **DON'T** use `any` type - use `unknown` and narrow
- **DON'T** add features beyond what was requested
- **DON'T** skip accessibility attributes on interactive elements
- **DON'T** store derived state - compute it instead
- **DON'T** use `key={index}` for dynamic lists

---

## Verification

Before considering any task complete:

```bash
npm run build    # Must pass with no errors
npm run lint     # Must pass with no errors
```
