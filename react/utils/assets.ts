import path from 'path'
import { ComponentDependencyTree } from './components'
import { isEmpty, clone } from 'ramda';

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

function getAllExistingPrefetchLinks(){
  return getExistingPrefetchLinks(['script', 'style'])
}

function getExistingPrefetchScriptLinks(){
  return getExistingPrefetchLinks('script')
}
function getExistingPrefetchStyleLinks(){
  return getExistingPrefetchLinks('style')
}

function getExistingPrefetchLinks(prefetchType: string[] | string) {
  const paths: string[] = []
  const links = document.getElementsByTagName('link')
  for (let i = 0; i < links.length; i++) {
    const item = links.item(i)
    if (item && item.rel === 'prefetch' && prefetchType.includes(item.as)) {
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
  const existingPrefetches = getAllExistingPrefetchLinks()
  const scripts = absoluteAssets.filter(a =>
    shouldAddScriptToPage(a, [...existingScripts, ...existingPrefetches])
  )
  const styles = absoluteAssets.filter(a =>
    shouldAddStyleToPage(a, [...existingStyles, ...existingPrefetches])
  )
  scripts.forEach(prefetchScript)
  styles.forEach(prefetchStyle)
}


export function prefetchBundledAssets(componentsDependencyTree: ComponentDependencyTree ) {
  
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const existingScriptsPrefetches = getExistingPrefetchScriptLinks()
  const existingStylesPrefetches = getExistingPrefetchStyleLinks()

  const bundledScriptsSrcs = getBundledScriptsSrcs(clone(componentsDependencyTree), [...existingScripts, ...existingScriptsPrefetches])
  const bundledStylesSrcs = getBundledStylesSrcs(clone(componentsDependencyTree), [...existingStyles, ...existingStylesPrefetches])
  bundledScriptsSrcs.forEach(prefetchScript)
  bundledStylesSrcs.forEach(prefetchStyle)
}

function getBundledStylesSrcs(componentDependencyTable: ComponentDependencyTree, existingScripts: string[]): string[]{
  const bundledStylesSrcs = getBundledSrcs(componentDependencyTable, existingScripts, '.css')
  return Object.values(bundledStylesSrcs).reduce((acc, bundledSrcs) => acc.concat(bundledSrcs), [] as string[])
}

function getBundledScriptsSrcs(componentDependencyTable: ComponentDependencyTree, existingScripts: string[]): string[]{
  const bundledScriptsSrcs = getBundledSrcs(componentDependencyTable, existingScripts, '.js')
  return Object.values(bundledScriptsSrcs).reduce((acc, bundledSrcs) => acc.concat(bundledSrcs), [] as string[])
}

function getBundledSrcs(componentsDependencyTree: ComponentDependencyTree, existingSources: string[], fileExtension: string): Record<string, string[]>{
  let bundledAssetRequests: Record<string, string[]> = {}
  while(!isEmpty(componentsDependencyTree)){
    const nodes = Object.values(componentsDependencyTree).filter( node => node.length === 0 )
      nodes.forEach(node => {
        const { app, dependents } = node
        node.component.assets.forEach(asset => {
          composeBundledSrcs(app, asset, fileExtension, existingSources, bundledAssetRequests)
        })

        if(!isEmpty(dependents)){
          Object.values(dependents).forEach(dependentNode => dependentNode.length--)
        }
        delete componentsDependencyTree[app]
      })
  }
  return bundledAssetRequests
}

function hasExtension(path: string, fileExtension: string) {
  return getExtension(path) === fileExtension
}

function composeBundledSrcs(app: string, asset: string, fileExtension:string, existingSources: string[], bundledAssetSrcs: Record<string, string[]>) {
  const fileName = path.basename(asset)
  const filePath = asset.replace(`/${app}/`, '/').replace(fileName,'')
  const bundleFilePath = filePath.replace('published/public', 'published/bundle/public')
  const bundledSrcFilePath = `${bundleFilePath}?`
  const noExtFileName = path.basename(fileName, fileExtension)

  if(!hasExtension(fileName, fileExtension) || !shouldAddBundledAssetToPage(app, noExtFileName, existingSources)){
    return
  }

  if (!bundledAssetSrcs[bundledSrcFilePath]) {
    bundledAssetSrcs[bundledSrcFilePath] = [ bundledSrcFilePath ]
  }

  const bundledSrcsByPath = bundledAssetSrcs[bundledSrcFilePath]
  const bundledSrcsTailIdx = bundledSrcsByPath.length - 1
  const bundledSrcTail = bundledSrcsByPath[bundledSrcsTailIdx]
  let nextBundledSrc = composeAssetsBundledURL(bundledSrcTail, app, noExtFileName)

  if (nextBundledSrc.length >= MAX_URL_SIZE) {
    nextBundledSrc = composeAssetsBundledURL(bundledSrcFilePath, app, noExtFileName)
    const bundledSrcsNextTailIdx = bundledSrcsTailIdx + 1
    const bundledSrcNextTail = bundledSrcFilePath
    bundledAssetSrcs[bundledSrcFilePath][bundledSrcsNextTailIdx] = bundledSrcNextTail
  }
  else {
    bundledAssetSrcs[bundledSrcFilePath][bundledSrcsTailIdx] = nextBundledSrc
  }
}

const composeAssetsBundledURL = (previousURL: string, app: string, fileName: string) => {
  return previousURL.includes(app)? `${previousURL},${fileName}`:
    previousURL.includes('files=')? `${previousURL}&files=${app};${fileName}`:
      `${previousURL}files=${app};${fileName}`
}

function shouldAddBundledAssetToPage(
  app: string,
  asset: string,
  scripts: string[] = getExistingScriptSrcs()
){
  return !hasBundledAsset(getBundledAssetRegex(app, asset), scripts)
}

function hasBundledAsset(rex: RegExp, assets: string[]) {
  return assets.some(asset => asset.search(rex) !== -1)
}

function regexScape(s: string){
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getBundledAssetRegex(app: string, asset: string){
  // https://regex101.com/r/vdZGJU/4/
  const scapedAsset = regexScape(asset) 
  return new RegExp(`files\=${regexScape(app)};(\w+,)*?(${scapedAsset},|${scapedAsset}($|\&files\=))`)
}