import EventEmitter from 'eventemitter3'
import {canUseDOM} from 'exenv'

if (canUseDOM) {
  global.__RUNTIME__.emitter = global.__RUNTIME__.emitter || new EventEmitter()
  // Backwards compatibility with old builder entrypoint code
  global.__RUNTIME__.eventEmitter = global.__RUNTIME__.emitter
}

if (module.hot && canUseDOM) {
  require('eventsource-polyfill')
  const myvtexSSE = require('myvtex-sse')

  const {account, workspace, emitter} = global.__RUNTIME__
  const sseReact1Path = 'vtex.builder-hub:*:react1'
  const ssePages0Path = 'vtex.builder-hub:*:pages0'
  let reload = false

  myvtexSSE(account, workspace, sseReact1Path, {verbose: true}, function(event) {
    // Skip any events after reload was issued
    if (reload) {
      return false
    }

    const {body: {type, appId, hash, locales}} = event

    switch (type) {
      case 'hmr':
        console.log(`[react1] Received update. app=${appId} hash=${hash}`)
        global.__RENDER_6_HOT__[appId].emit('webpackHotUpdate', hash)
        break
      case 'reload':
        console.log(`[react1] Received reload. app=${appId}`)
        reload = true
        location.reload(true)
        break
      case 'locales':
        console.log(`[react1] Received locale update. appId=${appId} locales=${locales}`)
        emitter.emit('localesUpdated', locales)
        break
    }
  })

  myvtexSSE(account, workspace, ssePages0Path, {verbose: true}, function(event) {
    // Skip any events after reload was issued
    if (reload) {
      return false
    }

    const {body: {type}} = event

    switch (type) {
      case 'changed':
        console.log('[pages0] Extensions changed.')
        emitter.emit('extensionsUpdated')
        break
    }
  })
}
