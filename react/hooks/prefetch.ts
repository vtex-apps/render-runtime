import {
  PrefetchState,
  usePrefetch,
  getCacheForPage,
} from '../components/Prefetch/PrefetchContext'
import {
  queryStringToMap,
  NavigateOptions,
  getNavigationRouteToNavigate,
} from '../utils/pages'
import { getPrefetchForPath, fetchRouteData } from '../utils/routes'
import { hydrateApolloCache } from '../utils/apolloCache'
import { fetchComponents } from '../utils/components'
import { useRuntime } from '../core/main'
import { useApolloClient } from 'react-apollo'
import { useRef, useEffect } from 'react'

interface PrefetchRequestsArgs {
  client: ApolloClientType
  navigationRoute: any
  page?: string
  pages: RenderRuntime['pages']
  prefetchState: PrefetchState
  hints: RenderRuntime['hints']
  renderMajor: RenderRuntime['renderMajor']
}

const getPageToNavigate = (path: string) => {
  const query = queryStringToMap(location.search) as RenderRuntime['query']
  return getPrefetchForPath({
    path: path,
    fetcher: fetch,
    query,
  })
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
  const { pathsState, routesCache, routePromise } = prefetchState
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

  const cache = getCacheForPage(navigationPage)
  cache.set(navigationRoute.path, cacheObj)

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

export const usePrefetchAttempt = ({
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
