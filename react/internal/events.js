import EventEmitter from 'events'
import {canUseDOM} from 'exenv'

if (canUseDOM) {
  global.__RUNTIME__.eventEmitter = global.__RUNTIME__.eventEmitter || new EventEmitter()
}

if (module.hot && canUseDOM) {
  require('eventsource-polyfill')
  const myvtexSSE = require('myvtex-sse')

  const {account, workspace, eventEmitter} = global.__RUNTIME__
  const sseReact1Path = 'vtex.builder-hub:*:react1'
  const ssePages0Path = 'vtex.builder-hub:*:pages0'

  myvtexSSE(account, workspace, sseReact1Path, {verbose: true}, function(event) {
    const {body: {type, appId, hash, locales}} = event
    switch (type) {
      case 'hmr':
        console.log(`[HMR]: App (${appId}) hot update `, hash)
        global.__RENDER_6_HOT__[appId].emit('webpackHotUpdate', hash)
        break
      case 'reload':
        console.log(`[HMR]: App (${appId}) reload`)
        location.reload(true)
        break
      case 'locales':
        console.log(`[HMR]: App (${appId}) locale update`, locales)
        eventEmitter.emit('localesUpdated', '*')
        break
    }
  })

  myvtexSSE(account, workspace, ssePages0Path, {verbose: true}, function(event) {
    const {body: {type, extensionPath}} = event
    switch (type) {
      case 'changed':
        console.log('[HMR]: Extensions changed')
        eventEmitter.emit('extensionsUpdated', extensionPath)
        break
    }
  })
}
