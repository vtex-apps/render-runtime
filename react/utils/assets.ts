import path from "path"

const MAX_URL_SIZE = 2048

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

function getExistingPrefetchLinks(prefetchType: string) {
  const paths: string[] = []
  const links = document.getElementsByTagName('link')
  for (let i = 0; i < links.length; i++) {
    const item = links.item(i)
    if (item && item.rel === 'prefetch' && item.as === prefetchType) {
      paths.push(item.href)
    }
  }
  return paths
}

function getExistingPrefetchScriptLinks(){
  return getExistingPrefetchLinks('script')
}
function getExistingPrefetchStyleLinks(){
  return getExistingPrefetchLinks('style')
}

function assetOnList(path: string, assets: string[]) {
  return assets.some(asset => asset.indexOf(path) !== -1)
}

function hasExtension(path: string, fileExtension: string) {
  return getExtension(path) === fileExtension
}

function regexScape(s: string){
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getBundledAssetRegex(app: string, asset: string){
  return new RegExp(`files\=${regexScape(app)};(\w+,)*?(${regexScape(asset)},?)`)
}

export function shouldAddScriptToPage(
  path: string,
  scripts: string[] = getExistingScriptSrcs()
) {
  return hasExtension(path, '.js') && !assetOnList(path, scripts)
}

function hasBundledAsset(rex: RegExp, assets: string[]) {
  return assets.some(asset => asset.search(rex) !== -1)
}

function shouldAddBundledAssetToPage(
  app: string,
  asset: string,
  scripts: string[] = getExistingScriptSrcs()
){
  return !hasBundledAsset(getBundledAssetRegex(app, asset), scripts)
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

export function fetchAssets(componentAssetsTree: ComponentTraversalResult) {
  
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()

  const bundledScriptsSrcs = getBundledScriptsSrcs(componentAssetsTree, existingScripts)
  const bundledStylesSrcs = getBundledStylesSrcs(componentAssetsTree, existingStyles)
  
  bundledStylesSrcs.forEach(addStyleToPage)
  return Promise.all(bundledScriptsSrcs.map(addScriptToPage)).then(() => {
    return
  })
}

export function prefetchAssets(componentAssetsTree: ComponentTraversalResult) {
  console.log('prefetchAssets')
  
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const existingScriptsPrefetches = getExistingPrefetchScriptLinks()
  const existingStylesPrefetches = getExistingPrefetchStyleLinks()

  const bundledScriptsSrcs = getBundledScriptsSrcs(componentAssetsTree, [...existingScripts, ...existingScriptsPrefetches])
  const bundledStylesSrcs = getBundledStylesSrcs(componentAssetsTree, [...existingStyles, ...existingStylesPrefetches])
  bundledScriptsSrcs.forEach(prefetchScript)
  bundledStylesSrcs.forEach(prefetchStyle)
}

function getBundledStylesSrcs(componentAssetsTree: ComponentTraversalResult, existingScripts: string[]): string[]{
  const bundledStylesSrcs = getBundledSrcs(componentAssetsTree, existingScripts, '.css')
  return Object.values(bundledStylesSrcs).reduce((acc, bundledSrcs) => acc.concat(bundledSrcs), [] as string[])
}

function getBundledScriptsSrcs(componentAssetsTree: ComponentTraversalResult, existingScripts: string[]): string[]{
  const bundledScriptsSrcs = getBundledSrcs(componentAssetsTree, existingScripts, '.js')
  return Object.values(bundledScriptsSrcs).reduce((acc, bundledSrcs) => acc.concat(bundledSrcs), [] as string[])
}

function getBundledSrcs(componentAssetsTree: ComponentTraversalResult, existingSources: string[], fileExtension: string): Record<string, string[]>{
  let bundledAssetRequests: Record<string, string[]> = {}
  for(const appKey of Object.keys(componentAssetsTree)){
    const assets = componentAssetsTree[appKey]
    for(const asset of assets){
      const { app, fileName, bundleFilePath } = asset
      const bundleScriptFilePath = `${bundleFilePath}?`
      const noExtFileName = path.basename(fileName, fileExtension)
      
      if(!hasExtension(fileName, fileExtension) || !shouldAddBundledAssetToPage(app, noExtFileName, existingSources)){
        continue
      }
      composeBundledSrcs(bundledAssetRequests, bundleScriptFilePath, app, noExtFileName);
    }
  }
  return bundledAssetRequests
}

function composeBundledSrcs(bundledAssetRequests: Record<string, string[]>, bundledSrcFilePath: string, app: string, noExtFileName: string) {
  if (!bundledAssetRequests[bundledSrcFilePath]) {
    bundledAssetRequests[bundledSrcFilePath] = [ bundledSrcFilePath ]
  }

  const bundledSrcsByPath = bundledAssetRequests[bundledSrcFilePath]
  const bundledSrcsTailIdx = bundledSrcsByPath.length - 1
  const bundledSrcTail = bundledSrcsByPath[bundledSrcsTailIdx]
  let nextBundledSrc = composeAssetsBundledURL(bundledSrcTail, app, noExtFileName)

  if (nextBundledSrc.length >= MAX_URL_SIZE) {
    nextBundledSrc = composeAssetsBundledURL(bundledSrcFilePath, app, noExtFileName)
    const bundledSrcsNextTailIdx = bundledSrcsTailIdx + 1
    const bundledSrcNextTail = bundledSrcFilePath
    bundledAssetRequests[bundledSrcFilePath][bundledSrcsNextTailIdx] = bundledSrcNextTail
  }
  else {
    bundledAssetRequests[bundledSrcFilePath][bundledSrcsTailIdx] = nextBundledSrc
  }

}

const composeAssetsBundledURL = (previousURL: string, app: string, fileName: string) => {
  return previousURL.includes(app)? `${previousURL},${fileName}`:
    previousURL.includes('files=')? `${previousURL}&files=${app};${fileName}`:
      `${previousURL}files=${app};${fileName}`
}
