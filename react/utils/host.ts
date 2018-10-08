import {canUseDOM} from 'exenv'

const isRenderServedPage = () => {
  const generatorMetaTag = document.querySelector(`meta[name='generator']`)
  const generator = generatorMetaTag && generatorMetaTag.getAttribute('content')
  return generator && generator.startsWith('vtex.render-server')
}

export const getBaseURI = (runtime: RenderRuntime) => {
  const {account, workspace, publicEndpoint} = runtime
  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  } else {
    const {location: {hostname, port}} = window
    const host = port ? `${hostname}:${port}` : hostname
    return hostname.endsWith(`.${publicEndpoint}`) || isRenderServedPage()
      ? host
      : `${host}/api/io`
  }
}
