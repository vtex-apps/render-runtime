import {canUseDOM} from 'exenv'

function inIframe() {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

const isRenderServedPage = () => {
  const rootDoc = inIframe() ? window.top.document : document
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
