import { canUseDOM } from 'exenv'
import { RenderRuntime } from '../typings/runtime'

function isIframe(): boolean {
  return window.location !== window.top.location
}

function getRootDocument(): Document {
  return isIframe() ? window.top.document : document
}

function isRenderServedPage(): boolean {
  const rootDoc = getRootDocument()
  const generatorMetaTag = rootDoc.querySelector(`meta[name='generator']`)
  const generator = generatorMetaTag && generatorMetaTag.getAttribute('content')
  return generator ? generator.startsWith('vtex.render-server') : false
}

export function getBaseURI(runtime: RenderRuntime): string {
  const { account, workspace, publicEndpoint, rootPath = '' } = runtime
  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  }

  const {
    location: { hostname },
  } = window

  if (runtime.isJanusProxied) {
    return `${hostname}/api/io`
  }

  return hostname.endsWith(`.${publicEndpoint}`) || isRenderServedPage()
    ? hostname + rootPath
    : `${hostname}/api/io`
}
