/* global module */
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import * as runtimeGlobals from './core/main'

window.__RENDER_8_RUNTIME__ = {...runtimeGlobals}

// compatibility
window.__RENDER_8_COMPONENTS__ = window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
global.__RUNTIME__ = window.__RUNTIME__

if (module.hot) {
  module.hot.accept('./core/main', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const hotGlobals = require('./core/main')
    window.__RENDER_8_RUNTIME__.ExtensionContainer = hotGlobals.ExtensionContainer
    window.__RENDER_8_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
    window.__RENDER_8_RUNTIME__.LayoutContainer = hotGlobals.LayoutContainer
    window.__RENDER_8_RUNTIME__.Link = hotGlobals.Link
    window.__RENDER_8_RUNTIME__.Loading = hotGlobals.Loading
    window.__RENDER_8_RUNTIME__.buildCacheLocator = hotGlobals.buildCacheLocator
    runtimeGlobals.start()
  })
}
