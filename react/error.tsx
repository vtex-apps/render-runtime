import * as runtimeGlobals from './core/main'

window.__RENDER_7_RUNTIME__ = {...runtimeGlobals}

// compatibility
window.__RENDER_7_COMPONENTS__ = window.__RENDER_7_COMPONENTS__ || global.__RENDER_7_COMPONENTS__
window.__RENDER_7_HOT__ = window.__RENDER_7_HOT__ || global.__RENDER_7_HOT__
global.__RUNTIME__ = window.__RUNTIME__

const ERROR_COMPONENT_REGEX = /vtex.render-runtime@\d+\.\d+\.\d+\/ErrorPage/

const start = () => {
  const errorComponent = Object.keys(global.__RENDER_7_COMPONENTS__).find((k: string) => ERROR_COMPONENT_REGEX.test(k)) as string
  global.__RUNTIME__.extensions = global.__RUNTIME__.extensions || {}
  global.__RUNTIME__.pages = global.__RUNTIME__.pages || {}
  global.__RUNTIME__.components = global.__RUNTIME__.components || {}
  global.__RUNTIME__.disableSSR = true
  global.__RUNTIME__.extensions.error = {
    component: errorComponent,
    props: {}
  }
  runtimeGlobals.render('error', global.__RUNTIME__)
}

start()

if (module.hot) {
  module.hot.accept('./core/main', () => {
    const hotGlobals = require('./core/main')
    window.__RENDER_7_RUNTIME__.ExtensionContainer = hotGlobals.ExtensionContainer
    window.__RENDER_7_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
    window.__RENDER_7_RUNTIME__.LayoutContainer = hotGlobals.LayoutContainer
    window.__RENDER_7_RUNTIME__.Link = hotGlobals.Link
    window.__RENDER_7_RUNTIME__.Loading = hotGlobals.Loading
    window.__RENDER_7_RUNTIME__.buildCacheLocator = hotGlobals.buildCacheLocator
    start()
  })
} else {
  const CLOSED = 2
  let eventSource: any
  function initSSE () {
    const hasNoSSE = !eventSource || eventSource.readyState === CLOSED
    if (!document.hidden && hasNoSSE) {
      eventSource = myvtexSSE(global.__RUNTIME__.account, global.__RUNTIME__.workspace, 'vtex.builder-hub:*:build.status', {verbose: true}, function (event: any) {
        if (event.body && event.body.code === 'success') {
          window.location.reload()
        }
      })
    }
  }
  initSSE()
  document.addEventListener('visibilitychange', initSSE)
}
