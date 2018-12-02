function getExtension(path: string) {
  const result = /\.\w+$/.exec(path)
  return result ? result[0] : ''
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
  for (let i = 0; i < document.links.length; i++) {
    const item = document.links.item(i)
    if (item && item.rel === 'preload') {
      paths.push(item.href)
    }
  }
  return paths
}

function scriptOnPage(path: string) {
  return getExistingScriptSrcs().some(src => src.indexOf(path) !== -1)
}

function styleOnPage(path: string) {
  return getExistingStyleHrefs().some(href => href.indexOf(path) !== -1)
}

function assetPreloaded(path: string) {
  return getExistingPreloadLinks().some(href => href.indexOf(path) !== -1)
}

function isScript(path: string) {
  return getExtension(path) === '.js'
}

function isStyle(path: string) {
  return getExtension(path) === '.css'
}

export function shouldAddScriptToPage(path: string) {
  return isScript(path) && !scriptOnPage(path)
}

function shouldAddStyleToPage(path: string) {
  return isStyle(path) && !styleOnPage(path)
}

function shouldPreloadScript(path: string) {
  return isScript(path) && !scriptOnPage(path) && !assetPreloaded(path)
}

function shouldPreloadStyle(path: string) {
  return isStyle(path) && !styleOnPage(path) && !assetPreloaded(path)
}

export function getImplementation<P={}, S={}>(component: string) {
  return window.__RENDER_7_COMPONENTS__[component] as RenderComponent<P, S>
}

export function getExtensionImplementation<P={}, S={}>(extensions: Extensions, name: string) {
  const extension = extensions[name]
  return extension && extension.component ? getImplementation<P, S>(extension.component) : null
}

export function fetchAssets(assets: string[]) {
  const scripts = assets.filter(shouldAddScriptToPage)
  const styles = assets.filter(shouldAddStyleToPage)
  styles.forEach(addStyleToPage)
  return Promise.all(scripts.map(addScriptToPage)).then(() => { return })
}

export function preloadAssets(assets: string[]) {
  const scripts = assets.filter(shouldPreloadScript)
  const styles = assets.filter(shouldPreloadStyle)
  scripts.forEach(preloadScript)
  styles.forEach(preloadStyle)
}
