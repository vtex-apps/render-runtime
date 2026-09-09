import { isAdmin } from '../utils/isAdmin'
import { getIOContext } from './ctx'

type SentryModule = typeof import('@sentry/react')

let sentryModulePromise: Promise<SentryModule> | null = null
let initialized = false

function makeEventWithCtx(event: any, ctx: any) {
  const eventWithCtx = {
    ...event,
    tags: {
      ...event?.tags,
      ...ctx,
    },
  }

  return eventWithCtx
}

/**
 * Lazily loads the Sentry SDK. It is only ever invoked from admin-gated
 * call sites (see isAdmin() checks in error.tsx/ErrorBoundary.tsx), so
 * storefront (non-admin) bundles never pay for the dynamic chunk.
 *
 * If the dynamic import fails (network blip, ad-blocker filtering
 * `sentry.js`, a chunk hash mismatch right after a deploy, etc.) the
 * cached promise is cleared so the *next* call gets a fresh retry instead
 * of permanently reusing a rejected promise for the rest of the page
 * session.
 */
function loadSentry(): Promise<SentryModule> {
  if (!sentryModulePromise) {
    sentryModulePromise = import(
      /* webpackChunkName: "sentry" */ '@sentry/react'
    ).catch((error) => {
      sentryModulePromise = null
      throw error
    })
  }

  return sentryModulePromise
}

async function ensureInitialized(Sentry: SentryModule) {
  if (initialized) return
  initialized = true

  try {
    doInit(Sentry)
  } catch (error) {
    // Allow a later call to retry `Sentry.init` instead of permanently
    // treating the SDK as initialized when it actually threw.
    initialized = false
    throw error
  }
}

function doInit(Sentry: SentryModule) {
  Sentry.init({
    dsn:
      'https://2fac72ea180d48ae9bf1dbb3104b4000@o191317.ingest.us.sentry.io/1292015',
    integrations: [Sentry.replayIntegration()],

    // Set tracesSampleRate to 0.1 to capture 10%
    // of transactions for tracing.
    tracesSampleRate: 0.1,

    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: [
      /^\//,
      /^(https?:\/\/)?([a-z0-9]+[.])*myvtex\.com/,
    ],

    // Capture Replay for 0% of all sessions,
    // plus for 50% of sessions with an error
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,

    beforeSend: (event) => {
      const ctx = getIOContext()

      // Must check with false, otherwise default null's
      // value leads to data mistakenly not sent to Sentry,
      // which can occur if somehow we can't infer whether
      // the apps are running under a production or development
      // environment.
      if (ctx.admin_production === false) {
        const params = new URL(document?.location?.toString())?.searchParams
        const shouldLog = params.get('forceLogs')

        if (shouldLog === 'true') {
          return makeEventWithCtx(event, ctx)
        }

        return null
      }

      return makeEventWithCtx(event, ctx)
    },
  })
}

/**
 * Ensures Sentry is loaded and initialized. Safe to call multiple times,
 * and safe to call without awaiting/catching: failures (e.g. the chunk
 * failing to load) are caught here and logged instead of becoming an
 * unhandled promise rejection. No-ops outside admin, so it should only be
 * called from admin-gated code.
 */
export async function initSentry() {
  if (!isAdmin()) return

  try {
    const Sentry = await loadSentry()
    await ensureInitialized(Sentry)
  } catch (error) {
    // A failure to load/initialize the SDK must never surface as an
    // unhandled rejection on admin pages.
    // eslint-disable-next-line no-console
    console.error('[render-runtime] failed to load/init Sentry', error)
  }
}

/**
 * Drop-in async replacement for `captureException` from '@sentry/react'.
 * Lazily loads + initializes the SDK on first use. Safe to call without
 * awaiting/catching (see `initSentry` above for the failure-handling
 * rationale): a failure to load/init/report never throws back at the
 * caller, so it can never mask or interrupt the caller's own error
 * handling.
 */
export async function captureException(exception: any, captureContext?: any) {
  if (!isAdmin()) return

  try {
    const Sentry = await loadSentry()
    await ensureInitialized(Sentry)

    return Sentry.captureException(exception, captureContext)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      '[render-runtime] failed to report exception to Sentry',
      error
    )

    return undefined
  }
}
