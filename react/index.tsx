import * as runtimeGlobals from './core/main'

global.__RENDER_7_RUNTIME__ = {...runtimeGlobals}

if (module.hot) {
  module.hot.accept('./core/main', () => {
    const hotGlobals = require('./core/main')
    global.__RENDER_7_RUNTIME__.ExtensionContainer = hotGlobals.ExtensionContainer
    global.__RENDER_7_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
    global.__RENDER_7_RUNTIME__.Link = hotGlobals.Link
    runtimeGlobals.start()
  })
}
