function getExtension(path: string) {
  const result = /\.\w+$/.exec(path)
  return result ? result[0] : ''
}

const isRelative = (path: string) => {
  return path && path[0] === '/' && path[1] !== '/'
}

export const getVTEXImgHost = (account: string) => {
  return `https://${account}.vteximg.com.br`
}

const getAbsoluteURL = (account: string, url: string, workspace: string, production: boolean) => {
  return isRelative(url) && production
    ? `${getVTEXImgHost(account)}${url}` + `?workspace=${workspace}`
    : url
}

class ServerSideAssetLoadingError extends Error {
  constructor() {
    super('Loading assets on server side rendering is not supported')
  }
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
  document.head.appendChild(link)
}

function preloadStyle(href: string) {
  if (!document || !document.head) {
    throw new ServerSideAssetLoadingError()
  }
  const link = document.createElement('link')
  link.href = href
  link.as = 'style'
  link.rel = 'preload'
  document.head.appendChild(link)
}

function preloadScript(href: string) {
  if (!document || !document.head) {
    throw new ServerSideAssetLoadingError()
  }
  const link = document.createElement('link')
  link.href = href
  link.as = 'script'
  link.rel = 'preload'
  document.head.appendChild(link)
}

function getExistingScriptSrcs() {
  const paths: string[] = []
  for (let i = 0; i < document.scripts.length; i++) {
    paths.push(document.scripts.item(i)!.src)
  }
  return paths
}

function getExistingStyleHrefs() {
  const hrefs: string[] = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    const href = document.styleSheets.item(i)!.href
    if (href) {
      hrefs.push(href)
    }
  }
  return hrefs
}

function getExistingPreloadLinks() {
  const paths: string[] = []
  const links = document.getElementsByTagName('link')
  for (let i = 0; i < links.length; i++) {
    const item = links.item(i)
    if (item && item.rel === 'preload') {
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

export function shouldAddScriptToPage(path: string, scripts: string[] = getExistingScriptSrcs()) {
  return isScript(path) && !assetOnList(path, scripts)
}

function shouldAddStyleToPage(path: string, styles: string[] = getExistingStyleHrefs()) {
  return isStyle(path) && !assetOnList(path, styles)
}

export function getImplementation<P={}, S={}>(component: string) {
  return window.__RENDER_7_COMPONENTS__[component] as RenderComponent<P, S>
}

export function getExtensionImplementation<P={}, S={}>(extensions: Extensions, name: string) {
  const extension = extensions[name]
  return extension && extension.component ? getImplementation<P, S>(extension.component) : null
}

export function fetchAssets(runtime: RenderRuntime, assets: string[]) {
  const absoluteAssets = assets.map(url => getAbsoluteURL(runtime.account, url, runtime.workspace, runtime.production))
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const scripts = absoluteAssets.filter((a) => shouldAddScriptToPage(a, existingScripts))
  const styles = absoluteAssets.filter((a) => shouldAddStyleToPage(a, existingStyles))
  styles.forEach(addStyleToPage)
  return Promise.all(scripts.map(addScriptToPage)).then(() => { return })
}

export function preloadAssets(runtime: RenderRuntime, assets: string[]) {
  const absoluteAssets = assets.map(url => getAbsoluteURL(runtime.account, url, runtime.workspace, runtime.production))
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const existingPreloads = getExistingPreloadLinks()
  const scripts = absoluteAssets.filter((a) => shouldAddScriptToPage(a, [...existingScripts, ...existingPreloads]))
  const styles = absoluteAssets.filter((a) => shouldAddStyleToPage(a, [...existingStyles, ...existingPreloads]))
  scripts.forEach(preloadScript)
  styles.forEach(preloadStyle)
}
