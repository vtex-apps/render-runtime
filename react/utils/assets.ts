function getExtension(path: string) {
  const adjPath = path.split('?')[0]
  const result = /\.\w+$/.exec(adjPath)
  return result ? result[0] : ''
}

const isRelative = (path: string) => {
  return path && path[0] === '/' && path[1] !== '/'
}

export const getVTEXImgHost = (account: string) => {
  return `https://${account}.vteximg.com.br`
}

const getAbsoluteURL = (
  account: string,
  url: string,
  production: boolean,
  rootPath: string
) => {
  if (!isRelative(url)) {
    return url
  }

  return production ? `${getVTEXImgHost(account)}${url}` : rootPath + url
}

class ServerSideAssetLoadingError extends Error {
  public constructor() {
    super('Loading assets on server side rendering is not supported')
  }
}

function isAbsolute(path: string) {
  return path && !path.startsWith('/')
}

export function addScriptToPage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!document || !document.head) {
      throw new ServerSideAssetLoadingError()
    }
    const script = document.createElement('script')
    script.onload = () => resolve()
    script.onerror = () => reject()
    script.async = false
    script.src = src
    if (isAbsolute(src)) {
      script.crossOrigin = 'anonymous'
    }
    document.head.appendChild(script)
  })
}

function addStyleToPage(href: string) {
  if (!document || !document.head) {
    throw new ServerSideAssetLoadingError()
  }
  const link = document.createElement('link')
  link.href = href
  link.type = 'text/css'
  link.rel = 'stylesheet'
  if (isAbsolute(href)) {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

function prefetchStyle(href: string) {
  if (!document || !document.head) {
    throw new ServerSideAssetLoadingError()
  }
  const link = document.createElement('link')
  link.href = href
  link.as = 'style'
  link.rel = 'prefetch'
  if (isAbsolute(href)) {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

function prefetchScript(href: string) {
  if (!document || !document.head) {
    throw new ServerSideAssetLoadingError()
  }
  const link = document.createElement('link')
  link.href = href
  link.as = 'script'
  link.rel = 'prefetch'
  if (isAbsolute(href)) {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}

function getExistingScriptSrcs() {
  const paths: string[] = []
  for (let i = 0; i < document.scripts.length; i++) {
    const script = document.scripts.item(i)
    if (script !== null) {
      paths.push(script.src)
    }
  }
  return paths
}

function getExistingStyleHrefs() {
  const hrefs: string[] = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    const stylesheet = document.styleSheets.item(i)
    if (stylesheet !== null) {
      const href = stylesheet.href
      if (href) {
        hrefs.push(href)
      }
    }
  }
  return hrefs
}

function getExistingPrefetchLinks() {
  const paths: string[] = []
  const links = document.getElementsByTagName('link')
  for (let i = 0; i < links.length; i++) {
    const item = links.item(i)
    if (item && item.rel === 'prefetch') {
      paths.push(item.href)
    }
  }
  return paths
}

function assetOnList(path: string, assets: string[]) {
  return assets.some(asset => asset.indexOf(path) !== -1)
}

function isScript(path: string) {
  return getExtension(path) === '.js'
}

function isStyle(path: string) {
  return getExtension(path) === '.css'
}

export function shouldAddScriptToPage(
  path: string,
  scripts: string[] = getExistingScriptSrcs()
) {
  return isScript(path) && !assetOnList(path, scripts)
}

function shouldAddStyleToPage(
  path: string,
  styles: string[] = getExistingStyleHrefs()
) {
  return isStyle(path) && !assetOnList(path, styles)
}

export function getImplementation<P = {}, S = {}>(component: string) {
  return window.__RENDER_8_COMPONENTS__[component] as RenderComponent<P, S>
}

export function getExtensionImplementation<P = {}, S = {}>(
  extensions: Extensions,
  name: string
) {
  const extension = extensions[name]
  return extension && extension.component
    ? getImplementation<P, S>(extension.component)
    : null
}

export function fetchAssets(runtime: RenderRuntime, assets: string[]) {
  const { account, production, rootPath = '' } = runtime
  const absoluteAssets = assets.map(url =>
    getAbsoluteURL(account, url, production, rootPath)
  )
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const scripts = absoluteAssets.filter(a =>
    shouldAddScriptToPage(a, existingScripts)
  )
  const styles = absoluteAssets.filter(a =>
    shouldAddStyleToPage(a, existingStyles)
  )
  styles.forEach(addStyleToPage)
  return Promise.all(scripts.map(addScriptToPage)).then(() => {
    return
  })
}

export function prefetchAssets(runtime: RenderRuntime, assets: string[]) {
  const { account, production, rootPath = '' } = runtime
  const absoluteAssets = assets.map(url =>
    getAbsoluteURL(account, url, production, rootPath)
  )
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const existingPrefetches = getExistingPrefetchLinks()
  const scripts = absoluteAssets.filter(a =>
    shouldAddScriptToPage(a, [...existingScripts, ...existingPrefetches])
  )
  const styles = absoluteAssets.filter(a =>
    shouldAddStyleToPage(a, [...existingStyles, ...existingPrefetches])
  )
  scripts.forEach(prefetchScript)
  styles.forEach(prefetchStyle)
}
