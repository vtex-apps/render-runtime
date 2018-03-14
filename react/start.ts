import {canUseDOM} from 'exenv'

const startRuntime = () => global.__RENDER_7_RUNTIME__.start()

if (global.__RUNTIME__.start) {
  startRuntime()
}

if (module.hot) {
  if (canUseDOM) {
    const runtimeIndexComponent = Object.keys(global.__RENDER_7_COMPONENTS__).find((c) => /vtex\.render-runtime@.*\/index/.test(c))
    if (runtimeIndexComponent) {
      const [app] = runtimeIndexComponent.split('/')
      global.__RENDER_7_HOT__[app].addListener(`component:${runtimeIndexComponent}:update`, startRuntime)
    }
  }
}
