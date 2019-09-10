import EventEmitter from 'eventemitter3'
import { canUseDOM } from 'exenv'

interface IOEvent {
  key: string
  body: {
    code: string
    type: string
    hash: string
    locales: any
    subject: string
  }
}

interface EventEmitterSource extends Array<EventEmitter> {
  eventSource?: EventSource
}

interface EmittersRegistry {
  [key: string]: EventEmitterSource
}

const CONNECTION_CLOSED = 2

const emittersByWorkspace: EmittersRegistry = {}

const initSSE = (account: string, workspace: string, baseURI: string) => {
  if (Object.keys(window.__RENDER_8_HOT__).length === 0) {
    return undefined
  }

  require('eventsource-polyfill')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const myvtexSSE = require('myvtex-sse')
  const path = `vtex.builder-hub:*:react2,pages0,build.status,pages1?workspace=${workspace}`
  const source: EventSource = myvtexSSE(account, workspace, path, {
    verbose: false,
    host: baseURI,
  })

  const handler = ({ data }: MessageEvent) => {
    const event = JSON.parse(data) as IOEvent
    const {
      key,
      body: { code, type, hash, locales, subject },
    } = event

    if (key === 'build.status') {
      switch (code) {
        case 'start':
          console.log(`[build] Build started. app=${subject}`)
          emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
            e.emit('build.status', code)
          )
          break
        case 'success':
          console.log(`[build] Build success. app=${subject}`)
          emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
            e.emit('build.status', code)
          )
          break
        case 'fail':
          console.log(`[build] Build failed. app=${subject}`)
          emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
            e.emit('build.status', code)
          )
          break
      }
      return
    }

    switch (type) {
      case 'hmr':
        console.log(`[react2] Received update. app=${subject} hash=${hash}`)
        if (window.__RENDER_8_HOT__[subject]) {
          window.__RENDER_8_HOT__[subject].emit('webpackHotUpdate', hash)
        }
        break
      case 'reload':
        console.log(`[react2] Received reload. app=${subject}`)
        emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
          e.emit('build.status', 'reload')
        )
        location.reload(true)
        break
      case 'locales':
        console.log(
          `[react2] Received locale update. appId=${subject} locales=${locales}`
        )
        emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
          e.emit('localesUpdated', locales)
        )
        break
      case 'changed':
        console.log('[pages0] Extensions changed.')
        emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
          e.emit('extensionsUpdated')
        )
        break
      case 'blocks':
        console.log('[pages1] Blocks changed.')
        emittersByWorkspace[`${account}/${workspace}`].forEach(e =>
          e.emit('blocksUpdated')
        )
        break
    }
  }

  source.onmessage = handler
  source.onopen = () =>
    console.log('[render] Connected to event server successfully')
  source.onerror = () =>
    console.log('[render] Connection to event server failed')

  return source
}

export const registerEmitter = (runtime: RenderRuntime, baseURI: string) => {
  if (!canUseDOM) {
    return
  }

  const { account, production, workspace } = runtime

  // Share SSE connections for same account and workspace
  if (!emittersByWorkspace[`${account}/${workspace}`]) {
    emittersByWorkspace[`${account}/${workspace}`] = []
    emittersByWorkspace[`${account}/${workspace}`].eventSource = initSSE(
      account,
      workspace,
      baseURI
    )

    if (!production) {
      document.addEventListener('visibilitychange', () => {
        const es = emittersByWorkspace[`${account}/${workspace}`].eventSource
        // Ensure SSE server connection
        if (!document.hidden && es && es.readyState === CONNECTION_CLOSED) {
          emittersByWorkspace[`${account}/${workspace}`].eventSource = initSSE(
            account,
            workspace,
            baseURI
          )
        }
      })
    }
  }

  if (!runtime.emitter) {
    runtime.emitter = new EventEmitter()
    emittersByWorkspace[`${account}/${workspace}`].push(runtime.emitter)
  }
}
