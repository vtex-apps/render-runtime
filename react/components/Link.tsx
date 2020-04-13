import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { parse } from 'graphql'
import { useInView } from 'react-intersection-observer'
import { useApolloClient } from 'react-apollo'
import {
  NavigateOptions,
  pathFromPageName,
  getNavigationRouteToNavigate,
  queryStringToMap,
} from '../utils/pages'
import { useRuntime } from './RenderContext'
import { getPrefetchForPath, fetchRouteData } from '../utils/routes'
import { usePrefetch, PrefetchState } from './Prefetch/PrefetchContext'
import { fetchComponents } from '../utils/components'

const isLeftClickEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0

const isModifiedEvent = (event: MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const absoluteRegex = /^https?:\/\/|^\/\//i
const telephoneRegex = /^tel:/i
const mailToRegex = /^mailto:/i

const isAbsoluteUrl = (url: string) => absoluteRegex.test(url)
const isTelephoneUrl = (url: string) => telephoneRegex.test(url)
const isMailToUrl = (url: string) => mailToRegex.test(url)

interface Props extends NavigateOptions {
  onClick?: (event: React.MouseEvent) => void
  className?: string
  target?: string
}

const getPageToNavigate = (path: string) => {
  const query = queryStringToMap(location.search) as RenderRuntime['query']
  return getPrefetchForPath({
    path: path,
    fetcher: fetch,
    query,
  })
}

const hydrateApolloCache = (
  queryData: Array<{
    data: string
    query: string
    variables: Record<string, any>
  }>,
  client: ApolloClientType
) => {
  return queryData.map(({ data, query, variables }) => {
    try {
      client.writeQuery({
        query: parse(query),
        data: JSON.parse(data),
        variables,
      })
    } catch (e) {
      // do nothing
    }
  })
}

interface PrefetchRequestsArgs {
  client: ApolloClientType
  navigationRoute: any
  page?: string
  pages: RenderRuntime['pages']
  prefetchState: PrefetchState
  hints: RenderRuntime['hints']
  renderMajor: RenderRuntime['renderMajor']
}

const prefetchRequests = async ({
  client,
  navigationRoute,
  page,
  pages,
  prefetchState,
  hints,
  renderMajor,
}: PrefetchRequestsArgs) => {
  const { pathsCache, pathsState, routesCache, routePromise } = prefetchState
  const navigationData = await getPageToNavigate(navigationRoute.path)

  const navigationPage = page ?? navigationData.page

  pathsState[navigationRoute.path] = { fetching: false, page: navigationPage }

  const declarer = pages[navigationPage]?.declarer
  if (!declarer) {
    return
  }

  if (navigationData.queryData) {
    hydrateApolloCache(navigationData.queryData, client)
  }

  const cacheObj = {
    routeId: navigationPage,
    matchingPage: navigationData.route,
    contentResponse: navigationData.contentResponse,
  }

  if (navigationPage === 'store.product') {
    pathsCache.product.set(navigationRoute.path, cacheObj)
  } else if (navigationPage.startsWith('store.search')) {
    pathsCache.search.set(navigationRoute.path, cacheObj)
  } else {
    pathsCache.other.set(navigationRoute.path, cacheObj)
  }

  let routeDataCache = routesCache.get(navigationPage)
  const routePromiseValue = routePromise[navigationPage]

  if (!routeDataCache && !routePromiseValue) {
    const newState = {
      promisePending: true,
      promise: fetchRouteData({
        apolloClient: client,
        routeId: navigationPage,
        declarer,
        hints,
        renderMajor,
      }),
    }
    newState.promise
      .then((data) => {
        routesCache.set(navigationPage, data)
      })
      .finally(() => {
        newState.promisePending = false
        newState.promise = null as any
        routePromise[navigationPage] = null
      })
    // newState.promise.then(data => {
    //   newState.promisePending = false
    //   routesCache.set(navigationPage, data)
    //   newState.promise = null
    //   routePromise[navigationPage] = null
    // }).catch(() => {
    //   newState.promisePending = false
    //   newState.promise = null
    //   routePromise[navigationPage] = null
    // })

    routePromise[navigationPage] = newState
  }
  const globalRouteDataState = routePromise[navigationPage]
  if (globalRouteDataState?.promisePending) {
    await globalRouteDataState.promise
    routeDataCache = routesCache.get(navigationPage)
  }

  if (!routeDataCache) {
    return
  }

  await fetchComponents(
    routeDataCache.components,
    window.__RUNTIME__,
    routeDataCache.extensions
  )
}

interface UsePrefetchArgs {
  inView: boolean
  page?: string
  href: string
  options: NavigateOptions
}

const usePrefetchAttempt = ({
  inView,
  page,
  href,
  options,
}: UsePrefetchArgs) => {
  const runtime = useRuntime()
  const prefetchState = usePrefetch()
  const client = useApolloClient() as ApolloClientType
  const hasTried = useRef(false)

  const { pages, navigationRouteModifiers, hints, renderMajor } = runtime

  useEffect(() => {
    if (inView && !hasTried.current) {
      const { pathsState, queue } = prefetchState
      if (href && href[0] !== '/') {
        // so funciona com path relativo
        return
      }

      options.modifiers = navigationRouteModifiers
      const navigationRoute = getNavigationRouteToNavigate(pages, options)

      if (pathsState[navigationRoute.path]) {
        return //dont redo
      }
      pathsState[navigationRoute.path] = { fetching: true }

      const priority = page === 'store.product' ? 1 : 0
      hasTried.current = true

      queue.add(
        async () =>
          prefetchRequests({
            client,
            navigationRoute,
            page,
            pages,
            prefetchState,
            hints,
            renderMajor,
          }),
        { priority }
      )
    }
  }, [
    client,
    hints,
    href,
    inView,
    navigationRouteModifiers,
    options,
    page,
    pages,
    prefetchState,
    renderMajor,
  ])
}

const Link: React.FunctionComponent<Props> = ({
  page,
  onClick = () => {},
  params,
  to,
  scrollOptions,
  query,
  children,
  modifiers,
  replace,
  modifiersOptions,
  target,
  ...linkProps
}) => {
  const {
    pages,
    navigate,
    rootPath = '',
    route: { domain },
    navigationRouteModifiers,
  } = useRuntime()

  const options = useMemo(
    () => ({
      fallbackToWindowLocation: false,
      page,
      params,
      query,
      rootPath,
      scrollOptions,
      to,
      modifiers,
      replace,
      modifiersOptions,
    }),
    [
      page,
      params,
      query,
      rootPath,
      scrollOptions,
      to,
      modifiers,
      replace,
      modifiersOptions,
    ]
  )

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        isModifiedEvent(event) ||
        !isLeftClickEvent(event) ||
        (to && (isAbsoluteUrl(to) || isTelephoneUrl(to) || isMailToUrl(to)))
      ) {
        return
      }

      onClick(event)

      // If you pass a target different from "_self" the component
      // will behave just like a normal anchor element
      if ((target === '_self' || !target) && navigate(options)) {
        event.preventDefault()
      }
    },
    [to, onClick, navigate, target, options]
  )

  const getHref = () => {
    if (to) {
      // Prefix any non-absolute paths (e.g. http:// or https://) and non-special links (e.g. mailto: or tel:)
      // with runtime.rootPath
      if (
        rootPath &&
        !to.startsWith('http') &&
        !to.startsWith(rootPath) &&
        !isTelephoneUrl(to) &&
        !isMailToUrl(to)
      ) {
        return rootPath + to
      }
      return to
    }
    if (page) {
      const path = pathFromPageName(page, pages, params)
      const qs = query ? `?${query}` : ''
      if (path) {
        return rootPath + path + qs
      }
    }
    return '#'
  }

  const href = getHref()
  // Href inside admin iframe should omit the `/app/` path
  const hrefWithoutIframePrefix =
    domain && domain === 'admin' && href.startsWith('/admin/app/')
      ? href.replace('/admin/app/', '/admin/')
      : href

  const [inViewRef, inView] = useInView({
    // Triggers the event when the element is 75% visible
    threshold: 0.75,
    triggerOnce: true,
  })

  usePrefetchAttempt({ inView, page, href, options })

  return (
    <a
      ref={inViewRef}
      target={target}
      href={hrefWithoutIframePrefix}
      {...linkProps}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}

export default Link
