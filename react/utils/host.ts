import { canUseDOM } from 'exenv'

import { RenderRuntime } from '../typings/runtime'

function isRenderServedPage() {
  const generatorMetaTag = document.querySelector(`meta[name='generator']`)
  const generator = generatorMetaTag && generatorMetaTag.getAttribute('content')
  return generator && generator.startsWith('vtex.render-server')
}

export function getBaseURI(runtime: RenderRuntime) {
  const {
    account,
    workspace,
    publicEndpoint,
    isJanusProxied,
    rootPath = '',
  } = runtime

  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  }

  const {
    location: { hostname },
  } = window

  if (isJanusProxied) {
    return `${hostname}/api/io`
  }

  return hostname.endsWith(`.${publicEndpoint}`) || isRenderServedPage()
    ? hostname + rootPath
    : `${hostname}/api/io`
}
