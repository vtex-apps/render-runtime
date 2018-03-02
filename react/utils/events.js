import EventEmitter from 'eventemitter3'
import {canUseDOM} from 'exenv'

const emittersByWorkspace = []

const initSSE = (account, workspace, publicEndpoint = 'myvtex.com') => {
  if (Object.keys(global.__RENDER_6_HOT__).length > 0) {
    require('eventsource-polyfill')
    const myvtexSSE = require('myvtex-sse')
    const host = `${workspace}--${account}.${publicEndpoint}`

    myvtexSSE(account, workspace, 'vtex.builder-hub:*:react1', {verbose: true, host}, function(event) {
      const {body: {type, appId, hash, locales}} = event

      switch (type) {
        case 'hmr':
          console.log(`[react1] Received update. app=${appId} hash=${hash}`)
          global.__RENDER_6_HOT__[appId].emit('webpackHotUpdate', hash)
          break
        case 'reload':
          console.log(`[react1] Received reload. app=${appId}`)
          location.reload(true)
          break
        case 'locales':
          console.log(`[react1] Received locale update. appId=${appId} locales=${locales}`)
          emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('localesUpdated', locales))
          break
      }
    })

    myvtexSSE(account, workspace, 'vtex.builder-hub:*:pages0', {verbose: true, host}, function(event) {
      const {body: {type}} = event

      switch (type) {
        case 'changed':
          console.log('[pages0] Extensions changed.')
          emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('extensionsUpdated'))
          break
      }
    })
  }
}

export const registerEmitter = (runtime) => {
  if (!canUseDOM) {
    return
  }

  const {account, workspace, publicEndpoint} = runtime

  // Share SSE connections for same account and workspace
  if (!emittersByWorkspace[`${account}/${workspace}`]) {
    emittersByWorkspace[`${account}/${workspace}`] = []
    initSSE(account, workspace, publicEndpoint)
  }

  if (!runtime.emitter) {
    runtime.emitter = new EventEmitter()
    emittersByWorkspace[`${account}/${workspace}`].push(runtime.emitter)
  }
}
