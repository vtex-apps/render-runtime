import * as runtimeGlobals from './core/main'

window.__RENDER_7_RUNTIME__ = {...runtimeGlobals}

// compatibility
window.__RENDER_7_COMPONENTS__ = window.__RENDER_7_COMPONENTS__ || global.__RENDER_7_COMPONENTS__
window.__RENDER_7_HOT__ = window.__RENDER_7_HOT__ || global.__RENDER_7_HOT__
global.__RUNTIME__ = window.__RUNTIME__

if (module.hot) {
  module.hot.accept('./core/main', () => {
    const hotGlobals = require('./core/main')
    window.__RENDER_7_RUNTIME__.ExtensionContainer = hotGlobals.ExtensionContainer
    window.__RENDER_7_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
    window.__RENDER_7_RUNTIME__.Link = hotGlobals.Link
    window.__RENDER_7_RUNTIME__.Loading = hotGlobals.Loading
    window.__RENDER_7_RUNTIME__.buildCacheLocator = hotGlobals.buildCacheLocator
    runtimeGlobals.start()
  })
}
