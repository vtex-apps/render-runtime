// Sentry is only ever used in the admin, and only to report errors. Loading
// it lazily (dynamic import) keeps it out of the storefront's main bundle
// entirely, since bundlers can only tree-shake/split code that isn't
// statically imported.
//
// This file intentionally does NOT eagerly call `initSentry()`: doing so
// would make every admin page pay the extra `sentry.js` chunk
// request/parse/exec cost on every session, even when no error ever
// occurs, which defeats the "on demand" goal. Instead, the SDK is loaded
// and initialized lazily, the first time `captureException`/`initSentry`
// is actually invoked from an admin-gated error path (see
// react/error.tsx and react/components/ErrorBoundary.tsx).
export {}
