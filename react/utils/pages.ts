import { canUseDOM } from 'exenv'
import { History, LocationDescriptorObject } from 'history'
import queryString from 'query-string'
import { difference, is, isEmpty, keys, startsWith } from 'ramda'
import RouteParser from 'route-parser'

import { isEnabled } from './flags'

const EMPTY_OBJECT = (Object.freeze && Object.freeze({})) || {}

const removeTrailingParenthesis = (path: string) =>
  path.endsWith('(') ? path.substr(0, path.length - 1) : path

export function getComparablePrecedence(path: string): string {
  return path
    .split('/')
    .reduce(
      (acc, pathSegment) => {
        if (pathSegment.startsWith('*')) {
          acc.push(3)
        } else if (pathSegment.startsWith(':')) {
          acc.push(2)
        } else if (pathSegment) {
          acc.push(1)
        }

        return acc
      },
      [] as number[]
    )
    .join()
}

function isHost(hostname: string) {
  return (
    hostname === (canUseDOM ? window.location.hostname : window.__hostname__)
  )
}

function trimEndingSlash(token: string) {
  return token.replace(/\/$/, '') || '/'
}

function createLocationDescriptor(
  navigationRoute: NavigationRoute,
  {
    hash,
    query,
    scrollOptions,
    fetchPage,
  }: Pick<NavigateOptions, 'hash' | 'query' | 'scrollOptions' | 'fetchPage'>
): LocationDescriptorObject {
  return {
    pathname: navigationRoute.path,
    state: {
      fetchPage,
      navigationRoute,
      renderRouting: true,
      scrollOptions,
    },
    ...(query && { search: query }),
    ...(hash && { hash }),
  }
}

function adjustTemplate(template: string) {
  // make last splat capture optional
  return trimEndingSlash(template).replace(/(\/\*\w+)$/, '($1)')
}

function adjustPath(path: string) {
  const [pathname] = path.split('#')
  return trimEndingSlash(pathname)
}

function getValidTemplate(page: string, pages: Pages) {
  const pageDescriptor = pages[page]

  if (!pageDescriptor) {
    console.error(`Page ${page} was not found`)
    return null
  }

  const { path: template, canonical } = pageDescriptor
  if (!template) {
    console.error(`Page ${page} has no path`)
    return null
  }

  return adjustTemplate(canonical || template)
}

export function pathFromPageName(page: string, pages: Pages, params: any) {
  const validTemplate = getValidTemplate(page, pages)
  if (!validTemplate) {
    return null
  }
  return new RouteParser(validTemplate).reverse(params) || null
}

export function queryStringToMap(query: string): Record<string, any> {
  if (!query) {
    return {}
  }
  return queryString.parse(query)
}

export function mapToQueryString(query: Record<string, any> = {}): string {
  return queryString.stringify(query, { encode: false })
}

export function getPageParams(path: string, routePath: string) {
  const pagePathWithRest =
    routePath && /\*\w+$/.test(routePath)
      ? routePath
      : routePath.replace(/\/?$/, '*_rest')
  return (routePath && getParams(pagePathWithRest, path)) || EMPTY_OBJECT
}

function getParams(template: string, target: string) {
  const properTemplate = adjustTemplate(template)
  const properTarget = adjustPath(target)
  return new RouteParser(properTemplate).match(properTarget)
}

function getPagePath(name: string, pages: Pages) {
  const { path: pagePath, cname } = pages[name]
  return cname && isHost(cname) ? '/' : pagePath
}

function checkValidParams(id: string, pages: Pages, path: string, params: any) {
  const template = getValidTemplate(id, pages) || ''
  const validParams = getParams(template, path) as Record<string, any>
  const invalidParams = difference(keys(params), keys(validParams))

  if (!isEmpty(invalidParams)) {
    console.warn(
      `The following params are invalid: ${invalidParams.join(', ')}`
    )
  }
}

function getRouteFromPageName(
  id: string,
  pages: Pages,
  params: any
): NavigationRoute | null {
  const path = pathFromPageName(id, pages, params) || ''
  checkValidParams(id, pages, path, params)
  return path ? { id, path, params } : null
}

function getCanonicalPath(
  canonicalPathTemplate: string,
  params: Record<string, string>
): string | false {
  const properPathTemplate = adjustTemplate(canonicalPathTemplate)
  const canonicalPath = new RouteParser(properPathTemplate).reverse(params)
  if (canonicalPath) {
    return canonicalPath
  }

  console.warn(
    `Canonical path template '${canonicalPathTemplate}' could not be created with params: ${params}`
  )
  return false
}

export function getRouteFromPath(
  path: string,
  pages: Pages
): NavigationRoute | null {
  const routeMatch = routeMatchFromPath(path, pages)
  if (!routeMatch) {
    return null
  }

  const params = getPageParams(path, routeMatch.path)
  const navigationPath = routeMatch.canonical
    ? getCanonicalPath(routeMatch.canonical, params) || path
    : path

  return {
    id: routeMatch.id,
    params,
    path: navigationPath,
  }
}

export function getRouteFromPathOld(
  path: string,
  pages: Pages,
  query?: string,
  hash?: string
): NavigationRoute | null {
  const queryMap = query ? queryStringToMap(hash ? query + hash : query) : {}
  const routeMatch = routeIdFromPathAndQueryOld(path, queryMap, pages)
  if (!routeMatch) {
    return null
  }

  const params = getPageParams(path, routeMatch.path)
  const navigationPath = routeMatch.canonical
    ? getCanonicalPath(routeMatch.canonical, params) || path
    : path

  return {
    id: routeMatch.id,
    params,
    path: navigationPath,
  }
}

const mergePersistingQueries = (currentQuery: string, query: string) => {
  const KEYS = ['disableUserLand']
  const current = queryStringToMap(currentQuery)
  const next = queryStringToMap(query)
  const has = (value?: string) => !!value || value === null
  const persisting = KEYS.reduce<Record<string, any>>((cur, key) => {
    if (has(current[key]) && current[key] !== 'false') {
      cur[key] = current[key]
    }
    return cur
  }, {})
  return mapToQueryString({ ...persisting, ...next })
}

export function navigate(
  history: History | null,
  pages: Pages,
  options: NavigateOptions
) {
  const {
    page,
    params,
    query: inputQuery,
    to: inputTo = '',
    scrollOptions,
    fallbackToWindowLocation = true,
    rootPath,
    replace,
    fetchPage = true,
  } = options

  if (!page && !inputTo) {
    console.error(
      `Invalid navigation options. You should use 'page' or 'to' parameters`
    )
    return false
  }

  if (inputTo && inputQuery) {
    console.warn(
      `You shouldn't pass 'query' in a separate prop when using 'to'`
    )
  }

  // If the prop `to` is something like `to="#header"`
  // just change the hash using location, avoid doing a history navigation
  if (inputTo.indexOf('#') === 0 && inputTo.indexOf('?') === -1) {
    window.location.hash = inputTo
    return true
  }

  const [to, extractedQuery] = (is(String, inputTo) ? inputTo : '').split('?')
  const [realQuery, hash] = (is(String, extractedQuery)
    ? extractedQuery
    : ''
  ).split('#')
  const realHash = is(String, hash) ? `#${hash}` : ''
  const query = inputQuery || realQuery

  let navigationRoute: any = {}

  if (isEnabled('RENDER_NAVIGATION')) {
    const fallbackPage = { path: to, params: {}, id: '' }
    const routeFromPage = page && getRouteFromPageName(page, pages, params)
    const routeFromPath = getRouteFromPath(to, pages)
    navigationRoute = routeFromPage || routeFromPath || fallbackPage
  } else {
    navigationRoute = page
      ? getRouteFromPageName(page, pages, params)
      : getRouteFromPathOld(to, pages, query, realHash)
  }

  if (!navigationRoute) {
    console.warn(
      `Unable to find route for ${
        page ? `page '${page}' and the passed parameters` : `path '${to}'`
      }`
    )
    return false
  }

  // Prefix any non-absolute paths (e.g. http:// or https://) with runtime.rootPath
  if (rootPath && !navigationRoute.path.startsWith('http')) {
    navigationRoute.path = rootPath + navigationRoute.path
  }

  if (history) {
    const nextQuery = mergePersistingQueries(history.location.search, query)
    const location = createLocationDescriptor(navigationRoute, {
      fetchPage,
      query: nextQuery,
      scrollOptions,
      hash: realHash,
    })
    const method = replace ? 'replace' : 'push'
    window.setTimeout(() => history[method](location), 0)
    return true
  }

  if (fallbackToWindowLocation) {
    window.location.href = `${navigationRoute.path}${query}`
    return true
  }

  return false
}

export function goBack(history: History | null) {
  if (history) {
    window.setTimeout(() => history.goBack(), 0)
    return true
  }

  console.warn('Unable to go to previous page')
  return false
}

export function scrollTo(options: RelativeScrollToOptions) {
  const { baseElementId = null } = options || {}
  const scrollAnchor =
    baseElementId && document.querySelector(`#${baseElementId}`)

  if (!scrollAnchor) {
    return polyfillScrollTo(options)
  }

  const { top, left } = scrollAnchor.getBoundingClientRect()
  polyfillScrollTo({
    left: left + window.scrollX + (options.left || 0),
    top: top + window.scrollY + (options.top || 0),
  })
}

function polyfillScrollTo(options: ScrollToOptions) {
  try {
    window.scrollTo(options)
  } catch (e) {
    const x = options.left == null ? window.scrollX : options.left
    const y = options.top == null ? window.scrollY : options.top
    window.scrollTo(x, y)
  }
}

function routeMatchForMappedURL(
  mappedSegments: string[],
  routes: Pages
): RouteMatch | null {
  let id: string | undefined
  let score: number
  let highScore: number = Number.NEGATIVE_INFINITY

  for (const name in routes) {
    const { map = [], path: routePath } = routes[name]
    if (!routePath || map.length === 0 || !startsWith(map, mappedSegments)) {
      continue
    }

    score = map.length
    if (highScore > score) {
      continue
    }

    highScore = score
    id = name
  }

  if (!id) {
    return null
  }

  const { path } = routes[id]
  const pathSegments = path.split('/')
  const slicedPathSegments = pathSegments.slice(0, highScore + 1)
  const newPath = slicedPathSegments.join('/')

  return {
    id,
    path: removeTrailingParenthesis(newPath),
  }
}

function routeMatchFromPath(path: string, routes: Pages): RouteMatch | null {
  let id: string | undefined
  let pathPrecedence: string
  let chosenPathPrecedence: string | null = null

  for (const name in routes) {
    const pagePath = getPagePath(name, routes)
    if (!pagePath) {
      continue
    }

    const matches = !!getParams(pagePath, path)
    if (!matches) {
      continue
    }

    pathPrecedence = getComparablePrecedence(pagePath)
    if (
      chosenPathPrecedence !== null &&
      chosenPathPrecedence < pathPrecedence
    ) {
      continue
    }

    chosenPathPrecedence = pathPrecedence
    id = name
  }

  if (!id) {
    return null
  }

  return {
    canonical: routes[id].canonical,
    id,
    path: getPagePath(id, routes),
  }
}

function routeIdFromPathAndQueryOld(
  path: string,
  query: Record<string, string>,
  routes: Pages
) {
  const mappedSegments = query.map ? query.map.split(',') : []
  let routeMatch: RouteMatch | null = null

  // Don't use map segments to match a route when Render
  // navigation is enabled
  if (mappedSegments.length > 0 && !isEnabled('RENDER_NAVIGATION')) {
    routeMatch = routeMatchForMappedURL(mappedSegments, routes)
  }

  if (!routeMatch) {
    routeMatch = routeMatchFromPath(path, routes)
  }

  return routeMatch
}

interface RouteMatch {
  canonical?: string
  id: string
  path: string
}

export interface NavigateOptions {
  hash?: string
  page?: string
  params?: any
  query?: any
  to?: string
  scrollOptions?: RenderScrollOptions
  fallbackToWindowLocation?: boolean
  replace?: boolean
  fetchPage?: boolean
  rootPath?: string
}
