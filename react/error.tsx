/* global module */
import React, { Component } from 'react'
import { captureException } from '@sentry/react'

require('myvtex-sse')

const ERROR_PAGE_COMPONENT = 'ErrorPage'

import { renderReadyPromise } from '.'
import { isAdmin } from './utils/isAdmin'
import { CustomAdminTags } from './o11y/types'
import { extractExtra } from './o11y/extractExtra'
import ErrorDisplay from './components/ErrorPage/ErrorPage'

/**
 * The ErrorPage component is rendered when there is an error on the Render Framework server-side lifecycle.
 *
 * Errors that occur on the client-side are caught by the ErrorBoundary component (see react/components/ErrorBoundary.tsx).
 *
 * @warning
 * Updates to this component must be followed by changes to Render Server, specifically the node/middlewares/error.ts file.
 *
 * This is required to ensure that the error page rendered during errors on the server-side lifecycle is always up-to-date, as
 * depending on the error, the Render Server may not be able to fetch the latest version of the ErrorPage component from the
 * Render Runtime, thus falling back to a hardcoded version that must be always up to date.
 *
 * Use this PR as a reference on how to update the Render Server accordingly: https://github.com/vtex/render-server/pull/800.
 */
class ErrorPage extends Component {
  public componentDidMount() {
    if (!isAdmin()) return

    const tags: CustomAdminTags = {
      admin_render_runtime_page: ERROR_PAGE_COMPONENT,
    }

    try {
      const error = window?.__ERROR__
      const requestId = window?.__REQUEST_ID__
      const defaultError =
        'Render Runtime renderered an error page and there is no error or request id available'

      if (error) {
        captureException(error, { tags: { ...tags, ...extractExtra(error) } })
      } else if (requestId) {
        captureException(requestId, { tags })
      } else {
        captureException(defaultError, { tags })
      }
    } catch (e) {
      captureException(e, { tags })
    }
  }

  public render() {
    if (window.__ERROR__) console.error(window.__ERROR__)

    console.log('Error server side')

    return <ErrorDisplay errorCode={window.__REQUEST_ID__} />
  }
}

if (window.__ERROR__) {
  // compatibility
  window.__RENDER_8_COMPONENTS__ =
    window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
  window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
  global.__RUNTIME__ = window.__RUNTIME__
  window.__RENDER_8_COMPONENTS__[ERROR_PAGE_COMPONENT] = ErrorPage as any

  const start = () => {
    global.__RUNTIME__.extensions = global.__RUNTIME__.extensions || {}
    global.__RUNTIME__.pages = global.__RUNTIME__.pages || {}
    global.__RUNTIME__.components = global.__RUNTIME__.components || {}
    global.__RUNTIME__.disableSSR = true
    global.__RUNTIME__.extensions.error = {
      component: ERROR_PAGE_COMPONENT,
      props: {},
    }

    window.__RENDER_8_RUNTIME__.render('error', global.__RUNTIME__)
  }

  renderReadyPromise.then(start)

  if (module.hot) {
    module.hot.accept('./core/main', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const hotGlobals = require('./core/main')
      window.__RENDER_8_RUNTIME__.ExtensionContainer =
        hotGlobals.ExtensionContainer
      window.__RENDER_8_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
      window.__RENDER_8_RUNTIME__.LayoutContainer = hotGlobals.LayoutContainer
      window.__RENDER_8_RUNTIME__.Link = hotGlobals.Link
      window.__RENDER_8_RUNTIME__.Loading = hotGlobals.Loading
      window.__RENDER_8_RUNTIME__.buildCacheLocator =
        hotGlobals.buildCacheLocator
      start()
    })
  } else {
    const CLOSED = 2
    let eventSource: any
    const initSSE = () => {
      const hasNoSSE = !eventSource || eventSource.readyState === CLOSED
      if (!document.hidden && hasNoSSE) {
        eventSource = window.myvtexSSE(
          global.__RUNTIME__.account,
          global.__RUNTIME__.workspace,
          'vtex.builder-hub:*:build.status',
          { verbose: true },
          (event: any) => {
            if (event.body && event.body.code === 'success') {
              window.location.reload()
            }
          }
        )
      }
    }
    initSSE()
    document.addEventListener('visibilitychange', initSSE)
  }
}
