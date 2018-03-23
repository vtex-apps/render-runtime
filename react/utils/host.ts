import {canUseDOM} from 'exenv'

export const getBaseURI = (runtime: RenderRuntime) => {
  const {account, workspace, publicEndpoint} = runtime
  if (!canUseDOM) {
    return `${workspace}--${account}.${publicEndpoint}`
  } else {
    const generatorMetaTag = document.querySelector(`meta[name='generator']`)
    const generator = generatorMetaTag && generatorMetaTag.getAttribute('content')
    const isRenderGenerator = generator && generator.startsWith('vtex.render-server')
    return isRenderGenerator ? window.location.hostname : `${account}.${publicEndpoint}`
  }
}
