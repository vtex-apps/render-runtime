import { isAdmin } from '../utils/isAdmin'
import { initSentry } from './sentry'

// Sentry is only ever used in the admin. Loading it lazily (dynamic import)
// keeps it out of the storefront's main bundle entirely, since bundlers can
// only tree-shake/split code that isn't statically imported: `initSentry()`
// no-ops outside admin (see its isAdmin() guard in ./sentry), so storefront
// sessions still never fetch the `sentry.js` chunk.
//
// This call is intentionally eager (fire-and-forget, not deferred to the
// first captureException): Session Replay's pre-error buffer, automatic
// breadcrumbs, and Sentry's own global error/unhandledrejection handlers
// all require the SDK to already be running *before* an error happens.
// Deferring init to the first captureException() call would silently lose
// all of that for the very first (and often most interesting) error of the
// session.
if (isAdmin()) {
  initSentry()
}
