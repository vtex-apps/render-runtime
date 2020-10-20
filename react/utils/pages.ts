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
    .reduce((acc, pathSegment) => {
      if (pathSegment.startsWith('*')) {
        acc.push(3)
      } else if (pathSegment.startsWith(':')) {
        acc.push(2)
      } else if (pathSegment) {
        acc.push(1)
      }

      return acc
    }, [] as number[])
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
    preventRemount,
    skipSetPath,
  }: Partial<NavigateOptions>
): LocationDescriptorObject {
  return {
    state: {
      fetchPage,
      navigationRoute,
      preventRemount,
      renderRouting: true,
      scrollOptions,
    },
    ...(skipSetPath ? {} : { pathname: navigationRoute.path }),
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
  const path = new RouteParser(validTemplate).reverse(params)
  const filters = params
    ? params.rest || (params.terms && `/${params.terms}`) || ''
    : ''
  return path ? `${path}${filters}` : null
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
  const KEYS = ['disableUserLand', '__bindingAddress']
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

export function getNavigationRouteToNavigate(
  pages: Pages,
  options: NavigateOptions,
  showLogs = false
) {
  const {
    page,
    params,
    query: inputQuery,
    to: inputTo = '',
    rootPath,
    modifiers,
    modifiersOptions,
  } = options

  if (!page && !inputTo) {
    showLogs &&
      console.error(
        `Invalid navigation options. You should use 'page' or 'to' parameters`
      )
    return null
  }

  if (inputTo && inputQuery) {
    showLogs &&
      console.warn(
        `You shouldn't pass 'query' in a separate prop when using 'to'`
      )
  }

  // If the prop `to` is something like `to="#header"`
  // just change the hash using location, avoid doing a history navigation
  if (inputTo.indexOf('#') === 0 && inputTo.indexOf('?') === -1) {
    return { hash: inputTo }
  }

  const [to, extractedQuery] = (is(String, inputTo) ? inputTo : '').split('?')
  const [realQuery, hash] = (is(String, extractedQuery)
    ? extractedQuery
    : ''
  ).split('#')
  const realHash = is(String, hash) ? `#${hash}` : ''
  let query = inputQuery || realQuery

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
    showLogs &&
      console.warn(
        `Unable to find route for ${
          page ? `page '${page}' and the passed parameters` : `path '${to}'`
        }`
      )
    return null
  }

  navigationRoute.path = navigationRootPath(navigationRoute.path, rootPath)
  if (modifiers) {
    for (const modifier of modifiers) {
      const { path, query: fixedQuery } = modifier({
        path: navigationRoute.path,
        query,
        options: modifiersOptions,
      })
      navigationRoute.path = path || navigationRoute.path
      query = fixedQuery || query
    }
  }
  navigationRoute.realHash = realHash
  navigationRoute.query = query
  return navigationRoute
}

export function navigate(
  history: History | null,
  pages: Pages,
  options: NavigateOptions
) {
  const {
    scrollOptions,
    fallbackToWindowLocation = false,
    replace,
    fetchPage = true,
    preventRemount,
    skipSetPath = false,
    showPageLoading,
  } = options

  const navigationRoute = getNavigationRouteToNavigate(pages, options, true)

  if (navigationRoute.hash) {
    window.location.hash = navigationRoute.hash

    return true
  }

  if (navigationRoute == null) {
    return false
  }

  if (fallbackToWindowLocation) {
    if (showPageLoading) showPageLoading()

    if (navigationRoute.query) {
      window.location.assign(`${navigationRoute.path}?${navigationRoute.query}`)
    } else {
      window.location.assign(`${navigationRoute.path}`)
    }

    return true
  }

  if (history) {
    const nextQuery = mergePersistingQueries(
      history.location.search,
      navigationRoute.query
    )
    const location = createLocationDescriptor(navigationRoute, {
      fetchPage,
      preventRemount,
      query: nextQuery,
      scrollOptions,
      hash: navigationRoute.realHash,
      skipSetPath,
    })
    const method = replace ? 'replace' : 'push'
    window.setTimeout(() => history[method](location), 0)
    return true
  }

  return false
}

function navigationRootPath(path: string, rootPath?: string) {
  // Prefix any non-absolute paths (e.g. http:// or https://) with runtime.rootPath
  if (
    rootPath &&
    !path.startsWith('http') &&
    !path.startsWith(`${rootPath}/`)
  ) {
    return rootPath + path
  }

  return path
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
  preventRemount?: boolean
  rootPath?: string
  modifiers?: Set<NavigationRouteModifier>
  modifiersOptions?: Record<string, any>
  skipSetPath?: boolean
  showPageLoading?: () => void
}

export interface NavigationRouteChange {
  path: string
  query?: string
  options?: Record<string, NavigationRouteChange>
}

export type NavigationRouteModifier = (
  navigationRoute: NavigationRouteChange
) => NavigationRouteChange
