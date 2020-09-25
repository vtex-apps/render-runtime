import { canUseDOM } from 'exenv'
import { RenderRuntime } from '../typings/runtime'

export const addAMPProxy = (runtime: RenderRuntime) => {
  if (!runtime.amp) {
    window.ReactAMPHTML = window.ReactAMPHTMLHelpers =
      typeof Proxy !== 'undefined'
        ? new Proxy(
            {},
            {
              get: (_, key) => {
                if (key === '__esModule' || key === 'constructor') {
                  return
                }
                const message = canUseDOM
                  ? 'You can not render AMP components on client-side'
                  : 'You must check runtime.amp to render AMP components'

                throw new Error(message)
              },
            }
          )
        : {} // IE11 users will not have a clear error in this case
  }
}
