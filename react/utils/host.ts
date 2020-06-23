import {canUseDOM} from 'exenv'

function getRootDocument() {
  try {
    // Check if in iFrame
    if (window.self !== window.top) {
      return window.top.document
    }
  } catch (e) {
    // Do not break
  }
  return document
}

const isRenderServedPage = () => {
  const rootDoc = getRootDocument()
  const generatorMetaTag = rootDoc.querySelector(`meta[name='generator']`)
  const generator = generatorMetaTag && generatorMetaTag.getAttribute('content')
  return generator && generator.startsWith('vtex.render-server')
}

export const getBaseURI = (runtime: RenderRuntime) => {
  const {account, workspace, publicEndpoint, rootPath = ''} = runtime
  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  } else {
    const {
      location: { hostname },
    } = window

    /* todo: find a better way to detect if we need '/api/io' proxy or not
     * currently we are proxying those requests under /checkout page
     * even for IO stores
     */
    return hostname.endsWith(`.${publicEndpoint}`) || isRenderServedPage()
      ? hostname + rootPath
      : `${hostname}${rootPath}/api/io`
  }
}
