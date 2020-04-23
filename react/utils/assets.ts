import queryString from 'query-string'
import { getLoadedComponent } from './registerComponent'
import { isEnabled } from './flags'

const imageHost = isEnabled('VTEX_ASSETS_URL')
  ? 'vtexassets.com'
  : 'vteximg.com.br'

function getExtension(path: string) {
  const adjPath = path.split('?')[0]
  const result = /\.\w+$/.exec(adjPath)
  return result ? result[0] : ''
}

const isRelative = (path: string) => {
  return path && path[0] === '/' && path[1] !== '/'
}

export const getVTEXImgHost = (account: string) => {
  return `https://${account}.${imageHost}`
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
    script.type = 'text/javascript'
    script.onload = () => resolve()
    script.onerror = () => reject()
    script.async = false
    script.src = src
    if (isAbsolute(src)) {
      script.crossOrigin = 'anonymous'
    }
    document.body.appendChild(script)
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
  const overrideLink =
    document.getElementById('styles_overrides') ||
    document.getElementById('override_link_0')

  if (overrideLink) {
    document.head.insertBefore(link, overrideLink)
  } else {
    document.head.appendChild(link)
  }
}

const updateHref = (linkElement: Element) => {
  const href = linkElement && linkElement.getAttribute('href')

  if (href) {
    const now = Date.now()
    const idPrefix = 'hot_reload_css'
    const modifiedHref = href.replace(
      /build(\d)+/,
      `build${Math.round(now / 1000)}`
    )
    const newCssElement = document.createElement('link')
    const nextElementSibling = linkElement.nextElementSibling
    newCssElement.rel = 'stylesheet'
    newCssElement.type = 'text/css'
    newCssElement.href = modifiedHref
    newCssElement.id = idPrefix + now
    newCssElement.onload = function onLoadCb() {
      requestAnimationFrame(() => {
        if (
          nextElementSibling &&
          linkElement.parentNode &&
          nextElementSibling.id.indexOf(idPrefix) > -1
        ) {
          linkElement.parentNode.removeChild(nextElementSibling)
        }
      })
    }

    if (linkElement.parentNode) {
      linkElement.parentNode.insertBefore(newCssElement, nextElementSibling)
    }
  }
}

export const hotReloadOverrides = () => {
  const linkElements = Array.from(document.querySelectorAll('.override_link'))
  linkElements.forEach(updateHref)
}

export const hotReloadTachyons = () => {
  const linkElement = document.getElementById('style_link')
  if (linkElement) {
    updateHref(linkElement)
  }
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

function getExistingPrefetchScriptLinks() {
  return getExistingPrefetchLinks('script')
}
function getExistingPrefetchStyleLinks() {
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

export function shouldAddScriptToPage(
  path: string,
  scripts: string[] = getExistingScriptSrcs()
) {
  return isScript(path) && !assetOnList(path, scripts)
}

export function getLoadedImplementation<P = {}, S = {}>(component: string) {
  return getLoadedComponent(component) as RenderComponent<P, S>
}

export function getImplementation<P = {}, S = {}>(component: string) {
  return window.__RENDER_8_COMPONENTS__[component] as RenderComponent<P, S>
}

export function hasComponentImplementation(component: string) {
  return window.__RENDER_8_COMPONENTS__.hasOwnProperty(component)
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

function createPreloadLinkElement(
  ref: StyleRef,
  selector: string
): Promise<{ link: HTMLLinkElement; media: string } | null> {
  const { path, id, class: classname, crossorigin, media = 'all' } = ref
  const link = document.createElement('link')

  if (classname) {
    link.className = classname
  }

  if (id) {
    link.id = id
  }

  if (crossorigin) {
    link.crossOrigin = 'anonymous'
  }

  link.media = 'print'
  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.href = path

  const element = document.querySelector(selector)
  if (!element) {
    console.error(`Unable to find ${selector}`)
    return Promise.resolve(null)
  }

  return new Promise(resolve => {
    let insertedNode: HTMLLinkElement | null = null
    link.onload = () => {
      if (insertedNode) {
        resolve({ link: insertedNode, media })
      } else {
        resolve(null)
      }
    }

    link.onerror = () => {
      resolve(null)
    }

    insertedNode = document.head.insertBefore(link, element)
  })
}

export function insertUncriticalLinkElements({
  base = [],
  overrides = [],
}: StyleRefs) {
  return Promise.all([
    ...overrides.map(ref =>
      createPreloadLinkElement(ref, 'noscript#styles_overrides')
    ),
    ...base.map(ref => createPreloadLinkElement(ref, 'noscript#styles_base')),
  ]).then(
    linkElements =>
      new Promise(resolve => {
        requestAnimationFrame(() => {
          for (const item of linkElements) {
            if (item) {
              setTimeout(() => {
                item.link.onload = null
                item.link.media = item.media
              }, 0)
            }
          }

          requestAnimationFrame(() => {
            setTimeout(resolve, 100)
          })
        })
      })
  )
}

export async function fetchAssets(
  runtime: RenderRuntime,
  assets: AssetEntry[]
) {
  if (window.__UNCRITICAL_PROMISE__) {
    await window.__UNCRITICAL_PROMISE__
  }

  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()

  const styles = getAssetsToAdd(runtime, assets, '.css', existingStyles)
  styles.forEach(addStyleToPage)

  const scripts = getAssetsToAdd(runtime, assets, '.js', existingScripts)
  if (scripts.length === 0) {
    return
  }

  await Promise.all(scripts.map(addScriptToPage))
}

export function prefetchAssets(runtime: RenderRuntime, assets: AssetEntry[]) {
  const existingScripts = getExistingScriptSrcs()
  const existingStyles = getExistingStyleHrefs()
  const existingScriptsPrefetches = getExistingPrefetchScriptLinks()
  const existingStylesPrefetches = getExistingPrefetchStyleLinks()

  const scripts = getAssetsToAdd(runtime, assets, '.js', [
    ...existingScripts,
    ...existingScriptsPrefetches,
  ])
  const styles = getAssetsToAdd(runtime, assets, '.css', [
    ...existingStyles,
    ...existingStylesPrefetches,
  ])
  scripts.forEach(prefetchScript)
  styles.forEach(prefetchStyle)
}

function getAssetsToAdd(
  runtime: RenderRuntime,
  assets: AssetEntry[],
  assetExtension: string,
  existingAssets: string[]
) {
  const { account, production, rootPath = '' } = runtime

  const existingBundledAssetsByApp = groupAssetsByApp(existingAssets)

  return Array.from(
    assets.reduce((acc, asset) => {
      if (
        shouldAddAssetToPage(
          asset,
          assetExtension,
          existingBundledAssetsByApp,
          existingAssets
        )
      ) {
        const absoluteAsset = getAbsoluteURL(
          account,
          asset.path,
          production,
          rootPath
        )
        acc.add(absoluteAsset)
      }
      return acc
    }, new Set<string>())
  )
}

function shouldAddAssetToPage(
  asset: AssetEntry,
  assetExtension: string,
  existingBundledAssetsByApp: Record<string, string[]>,
  existingAssets: string[]
) {
  return (
    hasExtension(asset.path, assetExtension) &&
    !hasBundledAsset(asset.app, asset.name, existingBundledAssetsByApp) &&
    !assetOnList(asset.path, existingAssets)
  )
}

function hasExtension(path: string, fileExtension: string) {
  return getExtension(path) === fileExtension
}

function parseFilesQueryString(filesQueryString: string) {
  const hasSemicolon = filesQueryString.indexOf(';') !== -1

  if (hasSemicolon) {
    const [app, joinedPaths] = filesQueryString.split(';')
    const assets = joinedPaths ? joinedPaths.split(',') : []
    return { app, assets }
  } else {
    const [app, ...assets] = filesQueryString.split(',')
    return { app, assets }
  }
}

function groupAssetsByApp(assets: string[]): Record<string, string[]> {
  return assets.reduce((acc: Record<string, string[]>, asset) => {
    if (!asset) {
      return acc
    }

    const { query: parsedQuery } = queryString.parseUrl(asset)
    if (!parsedQuery || !parsedQuery.files) {
      return acc
    }

    const queryFiles: string[] = Array.isArray(parsedQuery.files)
      ? parsedQuery.files
      : [parsedQuery.files]
    queryFiles.forEach((files: string) => {
      if (!files) {
        return
      }

      const { app, assets } = parseFilesQueryString(files)
      if (!app || !assets || assets.length === 0) {
        return
      }

      if (!acc[app]) {
        acc[app] = assets
      } else {
        acc[app].push(...assets)
      }
    })
    return acc
  }, {})
}

function hasBundledAsset(
  app: string,
  asset: string,
  assetsByApp: Record<string, string[]>
) {
  return !!assetsByApp[app] && assetsByApp[app].indexOf(asset) !== -1
}
