import { canUseDOM } from 'exenv'
import { History, LocationDescriptorObject } from 'history'
import * as RouteParser from 'route-parser'

const EMPTY_OBJECT = (Object.freeze && Object.freeze({})) || {}

function getScore(path: string) {
  const catchAll = (path.match(/\*/g) || []).length
  const catchOne = (path.match(/:/g) || []).length
  const fixed = (path.match(/\/[\w_-]+/g) || []).length
  // tslint:disable-next-line:no-bitwise
  return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
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
  { query, scrollOptions }: Pick<NavigateOptions, 'query' | 'scrollOptions'>
): LocationDescriptorObject {
  return {
    pathname: navigationRoute.path!,
    state: {
      navigationRoute,
      renderRouting: true,
      scrollOptions,
    },
    ...(query && { search: query }),
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

export function pathFromPageName(page: string, pages: Pages, params: any) {
  const pageDescriptor = pages[page]
  if (!pageDescriptor) {
    console.error(`Page ${page} was not found`)
    return null
  }

  const { path: template } = pageDescriptor
  if (!template) {
    console.error(`Page ${page} has no path`)
    return null
  }

  const properTemplate = adjustTemplate(template)
  return new RouteParser(properTemplate).reverse(params) || null
}

export function getPageParams(name: string, path: string, pages: Pages) {
  const pagePath = getPagePath(name, pages)
  const pagePathWithRest =
    pagePath && /\*\w+$/.test(pagePath)
      ? pagePath
      : pagePath.replace(/\/?$/, '*_rest')
  return (pagePath && getParams(pagePathWithRest, path)) || EMPTY_OBJECT
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

function getRouteFromPageName(
  id: string,
  pages: Pages,
  params: any
): NavigationRoute | null {
  const path = pathFromPageName(id, pages, params)
  return path ? { id, path, params } : null
}

export function getRouteFromPath(
  path: string,
  pages: Pages
): NavigationRoute | null {
  const id = routeIdFromPath(path, pages)
  return id ? { id, path, params: getPageParams(id, path, pages) } : null
}

export function navigate(
  history: History | null,
  pages: Pages,
  options: NavigateOptions
) {
  const {
    page,
    params,
    query,
    to,
    scrollOptions,
    fallbackToWindowLocation = true,
    replace,
  } = options

  if (!page && !to) {
    console.error(
      `Invalid navigation options. You should use 'page' or 'to' parameters`
    )
    return false
  }

  const navigationRoute = page
    ? getRouteFromPageName(page, pages, params)
    : getRouteFromPath(to!, pages)

  if (!navigationRoute) {
    console.warn(
      `Unable to find route for ${page ? `page '${page}'` : `path '${to}'`}`
    )
    return false
  }

  if (history) {
    const location = createLocationDescriptor(navigationRoute, {
      query,
      scrollOptions,
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

function routeIdFromPath(path: string, routes: Pages) {
  let id: string | undefined
  let score: number
  let highScore: number = Number.NEGATIVE_INFINITY

  // tslint:disable-next-line:forin
  for (const name in routes) {
    const pagePath = getPagePath(name, routes)
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
      id = name
    }
  }

  return id
}

export interface NavigateOptions {
  page?: string
  params?: any
  query?: any
  to?: string
  scrollOptions?: RenderScrollOptions
  fallbackToWindowLocation?: boolean
  replace?: boolean
}
