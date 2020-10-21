import React from 'react'
import 'react-amphtml'
import 'react-amphtml/helpers'

import {
  AmpScriptsManager,
  AmpScripts,
  headerBoilerplate,
} from 'react-amphtml/setup'
import { RenderRuntime } from './typings/runtime'

export const setupAMP = (
  root: JSX.Element,
  renderFn: any,
  runtime: RenderRuntime
) => {
  const scripts = new AmpScripts()

  const ampRoot = (
    <AmpScriptsManager ampScripts={scripts}>{root}</AmpScriptsManager>
  )

  return {
    ampRoot,
    getExtraRenderedData: () => {
      const ampScripts = renderFn(scripts.getScriptElements())
      const ampHeadBoilerplate = runtime.route.canonicalPath
        ? renderFn(headerBoilerplate(runtime.route.canonicalPath))
        : ''

      return { ampScripts, ampHeadBoilerplate }
    },
  }
}
