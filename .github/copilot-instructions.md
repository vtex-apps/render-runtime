# Copilot Instructions for render-runtime

## Project Overview

**render-runtime** is the VTEX IO platform's core rendering framework. It handles server-side rendering (SSR), client-side hydration, React app runtime execution, and the block/extension system that powers VTEX stores.

**Key Architecture:**
- **Dual environment**: Code runs both server-side (Node) and client-side (browser). Use `canUseDOM` from `exenv` to check environment
- **Block-based composition**: Apps declare "blocks" that become extension points. The runtime generates extensions tree from `blocksTree`, `blocks`, and `contentMap` (see `react/utils/blocks.ts`)
- **Global runtime object**: `window.__RUNTIME__` holds account, workspace, pages, extensions, culture, routes, etc. Available client-side after SSR hydration
- **GraphQL-first**: Apollo Client with custom links for VTEX IO's multi-tenant architecture (workspace/account routing)

## Development Workflow

### Building & Testing
```bash
# Lint TypeScript (runs on pre-release)
cd react && yarn && yarn lint

# Run tests with VTEX test tools
cd react && yarn test

# Pre-release check (runs lint.sh)
bash lint.sh
```

### VTEX IO Integration
This is a VTEX IO app (manifest.json defines `builders: { react: "3.x" }`). To use in other apps:
```bash
vtex setup --typings  # Add render-runtime types for autocomplete
```

## Critical Conventions

### 1. Block/Extension System
**Blocks** are declared by apps and composed into **Extensions** at runtime:
- `Block` / `ExtensionPoint` components render extension points by ID
- Extensions tree is generated from `window.__RUNTIME__.blocksTree` via `generateExtensions()` (see `react/utils/blocks.ts:108-140`)
- Tree paths are hierarchical: `"store.home/shelf/product-summary"` - use `useTreePath()` to track position

Example pattern from `react/components/ExtensionPoint/ExtensionContainer.tsx`:
```tsx
const { extensions } = useRuntime()
const { treePath } = useTreePath()
// Render children from extensions tree
```

### 2. Environment Detection Pattern
Always gate DOM/browser APIs with `canUseDOM`:
```tsx
import { canUseDOM } from 'exenv'

const data = canUseDOM ? window.localStorage.getItem('key') : ''
```
SSR code runs in Node - avoid `window`, `document`, `localStorage` without this check.

### 3. Runtime Context Access
Use `useRuntime()` hook (not `RenderContext` directly) for runtime state:
```tsx
const { account, workspace, culture, navigate, getSettings } = useRuntime()
```
Available properties: `account`, `workspace`, `pages`, `extensions`, `route`, `culture`, `production`, `query`, `deviceInfo`, `hints`, `navigate`, `getSettings`, etc.

**Navigation behavior**: By default, `navigate()` and `Link` use client-side routing. The `useDefaultBrowserNavigation` feature flag (in store settings) allows reverting to browser-native navigation when needed.

### 4. Apollo Client Architecture
Custom Apollo links handle VTEX IO's multi-workspace architecture:
- **uriSwitchLink**: Routes queries to correct workspace/account endpoint based on cache hints
- **runtimeContextLink**: Injects runtime (extensions, culture, etc.) into operation context for SSR consistency
- **cachingLink**: Implements query result caching with LRU
- See `react/utils/client/links/` for link implementations

### 5. Component Registration
Apps register components globally via `window.__RENDER_8_COMPONENTS__`:
```tsx
// From react/utils/registerComponent.tsx
window.__RENDER_8_COMPONENTS__[componentName] = Component
```
The runtime loads these dynamically based on extension definitions.

### 6. Observability (o11y)
- **Sentry integration** for Admin apps only (see `react/o11y/instrument.ts`)
- Uses `isAdmin()` check - only initializes in `myvtex.com/admin` paths
- Tags errors with VTEX IO context: account, workspace, locale, app block ID
- Development errors can be force-logged to Sentry using `?forceLogs=true` query param

### 7. Error Handling
- **ErrorBoundary**: Top-level error catcher that wraps all components (see `react/components/ErrorBoundary.tsx`)
- **ErrorPage**: User-facing error UI with retry functionality and error tracking (see `react/components/ErrorPage/`)
- Errors in production are automatically sent to Sentry with full VTEX IO context
- Use `withErrorBoundary` HOC to wrap individual components needing isolated error boundaries

## File Structure Guide

- **`react/core/main.tsx`**: Main exports - `render()`, `start()`, all public APIs
- **`react/components/RenderProvider.tsx`**: Top-level provider - manages navigation, Apollo, page loading, error boundaries
- **`react/components/ExtensionPoint/`**: Block rendering logic
- **`react/components/ErrorPage/`**: Error UI and handling
- **`react/utils/blocks.ts`**: Extension tree generation from blocks metadata
- **`react/utils/client/`**: Apollo setup with VTEX-specific links
- **`react/o11y/`**: Observability (Sentry instrumentation)
- **`react/typings/runtime.ts`**: TypeScript interfaces for `RenderRuntime`, `Extension`, etc.

## Testing Patterns

Uses `@vtex/test-tools` (wraps Jest + React Testing Library):
```tsx
import { render, cleanup } from '@vtex/test-tools/react'
import 'jest-dom/extend-expect'

// Common pattern: mock __RENDER_8_COMPONENTS__
window.__RENDER_8_COMPONENTS__ = { componentName: MockComponent }
```

## Anti-Patterns to Avoid

❌ Direct `window` access in shared code without `canUseDOM`  
❌ Importing from `react/components/RenderContext` instead of using `useRuntime()` hook  
❌ Mutating `runtime` object - it should be treated as immutable  
❌ Adding async operations in render without `<Suspense>` or `<NoSSR>` wrappers  
❌ Removing or bypassing ErrorBoundary - errors should be caught and reported to Sentry  

## Key Dependencies

- **React 16.8+** (hooks-based)
- **Apollo Client 2.x** (GraphQL)
- **TypeScript 3.9** (strict mode enabled)
- **exenv**: Environment detection (`canUseDOM`)
- **ramda**: Functional utilities
- **react-intl**: i18n support with polyfills

## When Modifying Core APIs

1. **Exports in `react/core/main.tsx`**: Any new export must be added to the main export block (lines 401-437) to be available to consuming apps
2. **Runtime types**: Update `react/typings/runtime.ts` - these types are used by Builder Hub for autocomplete
3. **Breaking changes**: This app powers all VTEX stores - coordinate major changes with platform team
