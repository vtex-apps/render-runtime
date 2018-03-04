import EventEmitter from 'eventemitter3'
import {canUseDOM} from 'exenv'

const emittersByWorkspace = []

const initSSE = (account, workspace, publicEndpoint = 'myvtex.com') => {
  if (Object.keys(global.__RENDER_7_HOT__).length > 0) {
    require('eventsource-polyfill')
    const myvtexSSE = require('myvtex-sse')
    const host = `${workspace}--${account}.${publicEndpoint}`
    const source = myvtexSSE(account, workspace, 'vtex.builder-hub:*:react2,pages0,build.status', {verbose: true, host})

    const handler = function({data}) {
      const event = JSON.parse(data)
      const {key, body: {code, type, hash, locales, subject}} = event

      if (key === 'build.status') {
        switch (code) {
          case 'start':
            console.log(`[build] Build started. app=${subject}`)
            emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('build.status', code))
            break
          case 'success':
            console.log(`[build] Build success. app=${subject}`)
            emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('build.status', code))
            break
          case 'fail':
            console.log(`[build] Build failed. app=${subject}`)
            emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('build.status', code))
            console.log('build failed')
            break
        }
        return
      }

      switch (type) {
        case 'hmr':
          console.log(`[react2] Received update. app=${subject} hash=${hash}`)
          global.__RENDER_7_HOT__[subject].emit('webpackHotUpdate', hash)
          break
        case 'reload':
          console.log(`[react2] Received reload. app=${subject}`)
          location.reload(true)
          break
        case 'locales':
          console.log(`[react2] Received locale update. appId=${subject} locales=${locales}`)
          emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('localesUpdated', locales))
          break
        case 'changed':
          console.log('[pages0] Extensions changed.')
          emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('extensionsUpdated'))
          break
      }
    }

    source.addEventListener('message', handler)
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
