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

  const isRender8 = generator && generator.startsWith('vtex.render-server')

  const isServerdThroughJanus = window.location.pathname.startsWith('/api/io')

  return isServerdThroughJanus ? false : !!isRender8
}

export function getBaseURI(runtime: RenderRuntime): string {
  const { account, workspace, publicEndpoint, rootPath = '' } = runtime
  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  } else {
    const {
      location: { hostname },
    } = window

    return hostname.endsWith(`.${publicEndpoint}`) || isRenderServedPage()
      ? hostname + rootPath
      : `${hostname}/api/io`
  }
}
