import React from 'react'
import {
  AmpScriptsManager,
  AmpScripts,
  headerBoilerplate,
} from 'react-amphtml/setup'

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
