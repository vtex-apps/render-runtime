/* global module */
import React, { Component, Fragment } from 'react'
import ReactJson from 'react-json-view'
import { captureException } from '@sentry/react'

require('myvtex-sse')

const ERROR_PAGE_COMPONENT = 'ErrorPage'

import ErrorImg from './images/error-img.png'

import style from './error.css'
import { renderReadyPromise } from '.'
import { isAdmin } from './utils/isAdmin'
import { CustomAdminTags } from './o11y/types'
import { extractExtra } from './o11y/extractExtra'

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
  public state = { enabled: false }

  public componentDidMount() {
    window.setTimeout(() => {
      this.setState({ enabled: true })
    }, 5000)

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
    return (
      <div className="h-100 flex flex-column mh6 mh0-ns error-height pt3 pt10-ns">
        <div>
          {this.renderErrorInfo()}
          {window.__ERROR__ && this.renderErrorDetails(window.__ERROR__)}
        </div>
      </div>
    )
  }

  private renderErrorInfo = () => {
    const date = new Date()

    return (
      <div className="flex justify-center-ns flex-row-ns flex-column-reverse h-auto-ns pt0-ns pb8">
        <div className="mr9-ns mr0">
          <div className="f2 c-on-base">Something went wrong</div>
          <div className="f5 pt5 c-on-base lh-copy">
            <div>There was a technical problem loading this page.</div>
            <div>Try refreshing the page or come back in 5 minutes.</div>
          </div>
          <div
            className="f6 pt5 c-muted-2"
            style={{ fontFamily: 'courier, code' }}
          >
            <div>ID: {window.__REQUEST_ID__}</div>
            <div className="f6 c-muted-2 lh-copy fw7">{date.toUTCString()}</div>
          </div>
          <div className="pt7">
            <button
              className={
                'bw1 ba fw5 ttu br2 fw4 v-mid relative pv4 ph6 f5 ' +
                (this.state.enabled
                  ? 'bg-action-primary b--action-primary c-on-action-primary hover-bg-action-primary hover-b--action-primary hover-c-on-action-primary pointer'
                  : 'bg-disabled b--disabled c-on-disabled')
              }
              disabled={!this.state.enabled}
              onClick={() => {
                window.location.reload()
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <div>
          <img
            src={ErrorImg}
            className={`${style.imgHeight} pb6 pb0-ns`}
            alt=""
          />
        </div>
      </div>
    )
  }

  private renderErrorDetails = (error: any) => {
    return (
      <div>
        <div
          className={`${style.errorStack} bg-danger--faded pa7 mt4 br3 t-body lh-copy`}
        >
          {error.stack.split('\n').map((item: string, key: number) => {
            return (
              <Fragment key={key}>
                {item}
                <br />
              </Fragment>
            )
          })}
        </div>
        <div
          className={`${style.errorDetails} bg-warning--faded pa7 mt4 br3 lh-copy`}
        >
          <ReactJson src={error.details} />
        </div>
      </div>
    )
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
