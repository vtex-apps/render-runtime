import * as EventEmitter from 'eventemitter3'
import {canUseDOM} from 'exenv'

interface IOEvent {
  key: string
  body: {
    code: string,
    type: string,
    hash: string,
    locales: any,
    subject: string,
  }
}

interface EmittersRegistry {
  [key: string]: EventEmitter[]
}

const emittersByWorkspace: EmittersRegistry = {}

const initSSE = (account: string, workspace: string, baseURI: string) => {
  if (Object.keys(global.__RENDER_7_HOT__).length > 0) {
    require('eventsource-polyfill')
    const myvtexSSE = require('myvtex-sse')
    const path = `vtex.builder-hub:*:react2,pages0,build.status?workspace=${workspace}`
    const source: EventSource = myvtexSSE(account, workspace, path, {verbose: false, host: baseURI})

    const handler = ({data}: MessageEvent) => {
      const event = JSON.parse(data) as IOEvent
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
            break
        }
        return
      }

      switch (type) {
        case 'hmr':
          console.log(`[react2] Received update. app=${subject} hash=${hash}`)
          if (global.__RENDER_7_HOT__[subject]) {
            global.__RENDER_7_HOT__[subject].emit('webpackHotUpdate', hash)
          }
          break
        case 'reload':
          console.log(`[react2] Received reload. app=${subject}`)
          emittersByWorkspace[`${account}/${workspace}`].forEach(e => e.emit('build.status', 'reload'))
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

    source.onmessage = handler
    source.onopen = () => console.log('[render] Connected to event server successfully')
    source.onerror = () => console.log('[render] Connection to event server failed')
  }
}

export const registerEmitter = (runtime: RenderRuntime, baseURI: string) => {
  if (!canUseDOM) {
    return
  }

  const {account, workspace} = runtime

  // Share SSE connections for same account and workspace
  if (!emittersByWorkspace[`${account}/${workspace}`]) {
    emittersByWorkspace[`${account}/${workspace}`] = []
    initSSE(account, workspace, baseURI)
  }

  if (!runtime.emitter) {
    runtime.emitter = new EventEmitter()
    emittersByWorkspace[`${account}/${workspace}`].push(runtime.emitter)
  }
}
