import {canUseDOM} from 'exenv'
import {History, LocationDescriptorObject} from 'history'
import * as RouteParser from 'route-parser'

function getScore(path: string) {
  const catchAll = (path.match(/\*/g) || []).length
  const catchOne = (path.match(/:/g) || []).length
  const fixed = (path.match(/\/[\w_-]+/g) || []).length
  // tslint:disable-next-line:no-bitwise
  return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
}

function isHost(hostname: string) {
  return hostname === (canUseDOM ? window.location.hostname : global.__hostname__)
}

function trimEndingSlash(token: string) {
  return token.replace(/\/$/, '') || '/'
}

function createLocationDescriptor (path: string, {query}: {query: any}): LocationDescriptorObject {
  return {
    pathname: path,
    state: {renderRouting: true},
    ...(query && {search: query}),
  }
}

function adjustTemplate (template: string) {
  // make last splat capture optional
  return trimEndingSlash(template).replace(/(\/\*\w+)$/, '($1)')
}

export function pathFromPageName(page: string, pages: Pages, params: any) {
  const pageDescriptor = pages[page]
  if (!pageDescriptor) {
    console.error(`Page ${page} was not found`)
    return null
  }

  const {path: template} = pageDescriptor
  if (!template) {
    console.error(`Page ${page} has no path`)
    return null
  }

  const properTemplate = adjustTemplate(template)
  return new RouteParser(properTemplate).reverse(params) || null
}

export function getParams(template: string, target: string) {
  const properTemplate = adjustTemplate(template)
  const properTarget = trimEndingSlash(target)
  return new RouteParser(properTemplate).match(properTarget)
}

export function getPagePath(name: string, pages: Pages) {
  const [rootName] = name.split('/')
  const {path: rootPath, cname} = pages[rootName]
  const {path: pagePath} = pages[name]

  if (cname && isHost(cname)) {
    const rootStart = rootPath.endsWith('/') ? rootPath.length - 1 : rootPath.length
    return pagePath && pagePath.substr(rootStart)
  }

  return pagePath
}

export function navigate(history: History | null, pages: Pages, options: NavigateOptions) {
  let path: string | null
  const {page, params, query, to, fallbackToWindowLocation = true} = options

  if (page) {
    path = pathFromPageName(page, pages, params)
  } else if (to) {
    path = to
  } else {
    console.error(`Invalid navigation options. You should use 'page' or 'to' parameters`)
    return false
  }

  if (!path) {
    return false
  }

  if (history) {
    const location = createLocationDescriptor(path, {query})
    history.push(location)
    return true
  }

  if (fallbackToWindowLocation) {
    window.location.href = `${path}${query}`
    return true
  }

  return false
}

export function pageNameFromPath(path: string, pages: Pages) {
  let pageName: string | undefined
  let score: number
  let highScore: number = Number.NEGATIVE_INFINITY

  // tslint:disable-next-line:forin
  for (const name in pages) {
    const pagePath = getPagePath(name, pages)
    if (pagePath) {
      const matches = !!getParams(pagePath, path)
      if (!matches) {
        continue
      }

      score = getScore(pagePath)
      if (highScore > score) {
        continue
      }

      highScore = score
      pageName = name
    }
  }

  return pageName
}

export interface NavigateOptions {
  page?: string
  params?: any
  query?: any
  to?: string
  fallbackToWindowLocation?: boolean
}
