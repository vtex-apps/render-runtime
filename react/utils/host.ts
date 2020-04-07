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
  const {account, workspace, publicEndpoint} = runtime
  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  } else {
    const {
      location: { hostname },
    } = window

    return hostname.endsWith(`.${publicEndpoint}`) || isRenderServedPage()
      ? hostname
      : `${hostname}/api/io`
  }
}
