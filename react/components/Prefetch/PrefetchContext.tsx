import React, {
  useContext,
  createContext,
  FC,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from 'react'
import LRUCache from 'lru-cache'
import PQueue from 'p-queue'
import { History, UnregisterCallback } from 'history'
import { isEnabled } from '../../utils/flags'

const MAX_CONCURRENCY = 5

const disposeFn = (key: string) => delete state.pathsState[key]

interface PathState {
  fetching: boolean
  page?: string
}

interface RoutePromise {
  promisePending: boolean
  promise: Promise<PrefetchRouteData> | null
}

interface PrefetchCacheObject {
  routeId: string
  matchingPage: RenderRuntime['route']
  contentResponse: ContentResponse | null
}

export interface PrefetchState {
  routesCache: LRUCache<string, PrefetchRouteData>
  pathsCache: {
    other: LRUCache<string, PrefetchCacheObject>
    product: LRUCache<string, PrefetchCacheObject>
    search: LRUCache<string, PrefetchCacheObject>
  }
  pathsState: Record<string, PathState>
  routePromise: Record<string, RoutePromise | null>
  queue: PQueue
}

const HALF_HOUR_MS = 1000 * 60 * 30

const state: PrefetchState = {
  routesCache: new LRUCache({ max: 100, maxAge: HALF_HOUR_MS }),
  pathsCache: {
    product: new LRUCache({
      max: 100,
      dispose: disposeFn,
      maxAge: HALF_HOUR_MS,
    }),
    search: new LRUCache({ max: 75, dispose: disposeFn, maxAge: HALF_HOUR_MS }),
    other: new LRUCache({ max: 75, dispose: disposeFn, maxAge: HALF_HOUR_MS }),
  },
  pathsState: {},
  routePromise: {},
  queue: new PQueue({ concurrency: MAX_CONCURRENCY, autoStart: false }),
}

const PrefetchContext = createContext<PrefetchState>(state)

export const getCacheForPage = (page: string) => {
  if (page === 'store.product') {
    return state.pathsCache.product
  }

  if (page.startsWith('store.search')) {
    return state.pathsCache.search
  }

  return state.pathsCache.other
}

export const usePrefetch = () => useContext(PrefetchContext)

export const PrefetchContextProvider: FC<{ history: History | null }> = ({
  children,
  history,
}) => {
  const unlistenRef = useRef<UnregisterCallback>(null) as MutableRefObject<
    UnregisterCallback
  >

  const onPageChanged = useCallback(() => {
    state.queue.pause()
    state.queue.clear()
    setTimeout(() => {
      state.queue.start()
    }, 1000)
  }, [])

  useEffect(() => {
    if (history) {
      unlistenRef.current = history.listen(onPageChanged)
    }
    window.addEventListener(
      'load',
      () => {
        if (isEnabled('PREFETCH')) {
          state.queue.start()
        }
      },
      { once: true }
    )
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }, [history, onPageChanged, unlistenRef])

  return (
    <PrefetchContext.Provider value={state}>
      {children}
    </PrefetchContext.Provider>
  )
}

export const getPrefetechedData = (path: string) => {
  const destinationRouteId = state.pathsState[path]?.page
  if (!destinationRouteId) {
    return {
      routeData: null,
      prefetchedPathData: null,
      destinationRouteId: null,
    }
  }
  let prefetchedPathData = null
  const cache = getCacheForPage(destinationRouteId)
  prefetchedPathData = cache.get(path)

  const routeData = prefetchedPathData
    ? state.routesCache.get(destinationRouteId)
    : null
  return { routeData, prefetchedPathData, destinationRouteId }
}

export const clearQueue = () => {
  state.queue.clear()
}
