import * as Sentry from '@sentry/react'
import { isAdmin } from '../utils/isAdmin'
import { getIOContext } from './extraArgs'

if (isAdmin()) {
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
