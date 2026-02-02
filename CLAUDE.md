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

### Dialog/Modal State Pattern

For delete confirmations and similar dialogs, store the full object (not just ID):

```typescript
// BAD - data can become stale during async operation
const [itemToDelete, setItemToDelete] = useState<string | null>(null);
const item = items.find(i => i.id === itemToDelete); // May be undefined after delete

// GOOD - store full object when dialog opens
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
// itemToDelete persists through the delete operation
```

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

### Runtime Environment Variables (Docker)

This app uses `next-runtime-env` for runtime environment variable support in Docker deployments.

**CRITICAL**: Always use `env()` from `next-runtime-env` for API base URLs in client code:

```typescript
// In service files or components
import { env } from 'next-runtime-env';

const getBaseUrl = () => env('NEXT_PUBLIC_ASSETAI_API_BASE_URL') || '';

// Use getBaseUrl() at CALL TIME, not at initialization
fetch(`${getBaseUrl()}/api/endpoint`);
```

**Why this matters**:

- `process.env.NEXT_PUBLIC_*` is inlined at **build time** - won't work in Docker
- `env()` reads from `window.__ENV` injected by `<PublicEnvScript />` at **runtime**
- URL must be resolved when the API call happens, not when component/hook initializes

**DON'T** use `process.env.NEXT_PUBLIC_*` directly in client components.

**DO** use `env()` directly in services and components for runtime URL resolution.

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
- **Blob URLs** - Call `URL.revokeObjectURL()` in cleanup

### Preventing stale closures in hooks

- Use `useRef` for callbacks passed as options to avoid effect re-runs
- Use `AbortController` for async operations to prevent state updates after unmount

```typescript
// BAD - inline callback causes effect to re-run on every render
useCustomHook({ onSuccess: (data) => setState(data) });

// GOOD - hook uses ref internally, no effect re-runs
const onSuccessRef = useRef(onSuccess);
onSuccessRef.current = onSuccess; // Update ref, not dependency
```

### Async operations safety

```typescript
useEffect(() => {
  const abortController = new AbortController();

  const fetchData = async () => {
    try {
      const result = await api.getData({ signal: abortController.signal });
      setState(result);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return; // Ignore aborted
      throw e;
    }
  };

  fetchData();
  return () => abortController.abort();
}, []);
```

---

## Custom Hooks Standards

- **Return type** - Always define explicit return type
- **Stable references** - Use refs for callbacks to prevent unnecessary re-renders
- **Cleanup** - Always clean up side effects in useEffect return
- **SSR safety** - Never access `document` or `window` during render (only in effects)

```typescript
// BAD - causes hydration mismatch
return { isVisible: !document.hidden };

// GOOD - only access in effects
useEffect(() => {
  const handleChange = () => setIsVisible(!document.hidden);
  document.addEventListener('visibilitychange', handleChange);
  return () => document.removeEventListener('visibilitychange', handleChange);
}, []);
```

---

## Polling & Real-time Data

When implementing polling:

- **Page Visibility API** - Pause polling when tab is hidden
- **Smart polling** - Only poll when data needs updates (check status)
- **Prevent concurrent requests** - Use ref flag to block overlapping fetches
- **Configurable interval** - Allow interval to be passed as option

```typescript
// Pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPolling();
  else startPolling();
});
```

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
- Handle network errors gracefully with offline detection

---

## Loading & Empty States

Every data-fetching component must handle:

- **Loading state** - Show spinner or skeleton
- **Empty state** - Friendly message when no data exists
- **Error state** - Display error with retry option

```typescript
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage onRetry={refetch} />;
if (data.length === 0) return <EmptyState />;
return <DataList data={data} />;
```

---

## Race Conditions

Prevent race conditions in async operations:

```typescript
// BAD - race condition if user types fast
const handleSearch = async (query: string) => {
  const results = await search(query);
  setResults(results); // Older request might resolve after newer one
};

// GOOD - abort previous request
const abortControllerRef = useRef<AbortController | null>(null);

const handleSearch = async (query: string) => {
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  try {
    const results = await search(query, { signal: abortControllerRef.current.signal });
    setResults(results);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return; // Ignore aborted
    throw e;
  }
};
```

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
- **DON'T** access `document` or `window` during render (SSR unsafe)
- **DON'T** pass inline callbacks to custom hooks (causes effect re-runs)
- **DON'T** forget cleanup in useEffect (intervals, listeners, subscriptions)
- **DON'T** update state after component unmounts (memory leak)
- **DON'T** create multiple intervals/listeners without cleanup

---

## Verification

Before considering any task complete:

```bash
npm run build    # Must pass with no errors
npm run lint     # Must pass with no errors
```
