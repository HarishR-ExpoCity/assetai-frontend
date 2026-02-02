# Dockerizing a Next.js Application with Runtime Environment Variables

This guide explains how to dockerize a Next.js application that reads environment variables at runtime (not build time), based on the TR Vision project setup.

## Why Runtime Environment Variables?

By default, Next.js inlines `NEXT_PUBLIC_*` variables at **build time**. This means you'd need to rebuild the Docker image for each environment (dev, staging, prod).

With runtime env vars, you build **once** and deploy anywhere by passing different environment variables at container start.

---

## Required Files

### 1. `next.config.ts`

Enable standalone output for optimized Docker builds:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // ... other config
};

export default nextConfig;
```

**Why?** The `standalone` output creates a minimal production build (~100MB vs ~500MB+) that includes only the necessary dependencies.

---

### 2. `Dockerfile`

Copy from: `deployment/build/Dockerfile`

```dockerfile
FROM node:18-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Key points:**

- Multi-stage build reduces final image size
- Non-root user (`nextjs`) for security
- Copies only `standalone` and `static` folders (not full `node_modules`)

---

### 3. `.dockerignore`

Copy from: `.dockerignore`

Essential entries:

`node_modules
.next
.env*
*.tar
*.tar.gz
.git
.vscode
coverage`

**Why?** Prevents copying unnecessary files into the build context, speeding up builds and reducing image size.

---

### 4. Environment Context Provider

Copy from: `context/EnvContext.tsx`

```typescript
'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type EnvConfig = {
  apiBaseUrl: string;
  featureFlag: boolean;
  // Add your config properties here
};

const EnvContext = createContext<EnvConfig | undefined>(undefined);

export const useEnvConfig = () => {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error('useEnvConfig must be used within an EnvProvider');
  }
  return context;
};

export const EnvProvider = ({
  children,
  config,
}: {
  children: ReactNode;
  config: EnvConfig;
}) => <EnvContext.Provider value={config}>{children}</EnvContext.Provider>;
```

---

### 5. Root Layout Setup

Reference: `app/layout.tsx`

```typescript
import { unstable_noStore as noStore } from 'next/cache';
import { EnvProvider } from '@/context/EnvContext';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRITICAL: Opt out of static rendering
  noStore();

  // Read environment variables at runtime
  const config = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    featureFlag: process.env.NEXT_PUBLIC_FEATURE_FLAG === 'true',
    // Add more config...
  };

  return (
    <html lang="en">
      <body>
        <EnvProvider config={config}>
          {children}
        </EnvProvider>
      </body>
    </html>
  );
}
```

**Critical:** `noStore()` disables static rendering, forcing the layout to read env vars on every request.

---

### 6. `docker-compose.yml`

Copy pattern from: `deployment/config/dev/docker-compose-ui.yml`

```yaml
services:
  your-app:
    image: your-org/your-app:${IMAGE_TAG:-latest}
    container_name: your-app
    restart: always
    ports:
      - '${APP_PORT:-3000}:3000'
    environment:
      NEXT_PUBLIC_API_BASE_URL: ${API_BASE_URL}
      NEXT_PUBLIC_FEATURE_FLAG: ${FEATURE_FLAG}
      # Add more env vars...
```

---

## How It Works

`┌─────────────────────────────────────────────────────────────────┐
│                        Docker Container                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  docker-compose.yml                                             │
│  ┌─────────────────────────────────────┐                       │
│  │ environment:                         │                       │
│  │   NEXT_PUBLIC_API_URL: "https://..." │                       │
│  └──────────────┬──────────────────────┘                       │
│                 │                                               │
│                 ▼                                               │
│  app/layout.tsx (Server Component)                             │
│  ┌─────────────────────────────────────┐                       │
│  │ noStore(); // Forces dynamic render │                       │
│  │ const config = {                    │                       │
│  │   apiUrl: process.env.NEXT_PUBLIC...│ ◄── Reads at runtime  │
│  │ };                                  │                       │
│  └──────────────┬──────────────────────┘                       │
│                 │                                               │
│                 ▼                                               │
│  <EnvProvider config={config}>                                 │
│  ┌─────────────────────────────────────┐                       │
│  │ React Context passes config to      │                       │
│  │ all client components               │                       │
│  └──────────────┬──────────────────────┘                       │
│                 │                                               │
│                 ▼                                               │
│  Client Components                                              │
│  ┌─────────────────────────────────────┐                       │
│  │ const { apiUrl } = useEnvConfig();  │                       │
│  │ // Access config without env vars   │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`

---

## Build & Deploy Commands

### Build the Docker image

```bash
# From project root
docker build -f deployment/build/Dockerfile -t your-org/your-app:latest .
```

### Run with docker-compose

```bash
# Create a .env file with your variables
cat > .env << EOF
IMAGE_TAG=latest
APP_PORT=3000
API_BASE_URL=https://api.example.com
FEATURE_FLAG=true
EOF

# Start the container
docker-compose -f docker-compose.yml up -d
```

### Run directly with Docker

```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  -e NEXT_PUBLIC_FEATURE_FLAG=true \
  your-org/your-app:latest
```

---

## Checklist for Your Application

- [ ] Add `output: 'standalone'` to `next.config.ts`
- [ ] Copy and adapt the `Dockerfile`
- [ ] Create `.dockerignore` file
- [ ] Create `EnvContext.tsx` with your config shape
- [ ] Update `app/layout.tsx`:
  - [ ] Import and call `noStore()` at the top of the function
  - [ ] Read env vars and build config object
  - [ ] Wrap children with `<EnvProvider config={config}>`
- [ ] Create `docker-compose.yml` with environment mappings
- [ ] Use `useEnvConfig()` hook in client components (instead of `process.env`)

---

## Common Mistakes to Avoid

| Mistake                                  | Why It Fails                                                | Solution                                                |
| ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| Forgetting `noStore()`                   | Layout is statically rendered, env vars baked at build time | Add `noStore()` call at start of layout                 |
| Using `process.env` in client components | `NEXT_PUBLIC_*` is inlined at build time in client code     | Use `useEnvConfig()` hook instead                       |
| Missing `output: 'standalone'`           | Dockerfile expects standalone structure                     | Add to `next.config.ts`                                 |
| Not copying `.next/static`               | Static assets (CSS, JS) won't load                          | Ensure Dockerfile copies both `standalone` and `static` |

---

## Files to Copy from TR Vision

| Source                                        | Destination                   | Notes                            |
| --------------------------------------------- | ----------------------------- | -------------------------------- |
| `deployment/build/Dockerfile`                 | `deployment/build/Dockerfile` | Adapt paths if needed            |
| `.dockerignore`                               | `.dockerignore`               | Add project-specific exclusions  |
| `context/EnvContext.tsx`                      | `context/EnvContext.tsx`      | Update `EnvConfig` type          |
| `deployment/config/dev/docker-compose-ui.yml` | `docker-compose.yml`          | Update service name and env vars |
