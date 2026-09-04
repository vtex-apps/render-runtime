import { isAdmin } from '../utils/isAdmin'
import { initSentry } from './sentry'

// Sentry is only ever used in the admin. Loading it lazily (dynamic import)
// keeps it out of the storefront's main bundle entirely, since bundlers can
// only tree-shake/split code that isn't statically imported.
if (isAdmin()) {
  initSentry()
}
