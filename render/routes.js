import Route from 'route-parser'
import {canUseDOM} from 'exenv'
import createHistory from 'history/createBrowserHistory'

const noop = function () {}
const updatePlaceholderSettings = noop
const changeLocation = noop

const scrollTo = (element, to, duration) => {
  if (duration <= 0) {
    return
  }

  const difference = to - element.scrollTop
  const perTick = difference / duration * 10

  setTimeout(() => {
    element.scrollTop = element.scrollTop + perTick
    if (element.scrollTop === to) {
      return
    }

    scrollTo(element, to, duration - 10)
  }, 10)
}

const getScore = path => {
  const catchAll = (path.match(/\*/g) || []).length
  const catchOne = (path.match(/:/g) || []).length
  const fixed = (path.match(/\/[\w_-]+/g) || []).length
  return ~((catchAll << 12) + (catchOne << 6) + ((1 << 6) - fixed - 1))
}

const updateStoreForRoute = (store, routeName, params, path, action) => {
  if (action !== 'POP') {
    scrollTo(document.body, 0, 200)
  }
  if (Object.keys(params).length > 0) {
    store.dispatch(updatePlaceholderSettings(routeName, params))
  }
  store.dispatch(changeLocation(routeName, params, path))
}

const resolveRoute = (path, store) => {
  const placeholders = store.getState().placeholders
  let params, routeName, score, highScore
  for (const name in placeholders) {
    const placeholder = placeholders[name]
    if (placeholder.path) {
      const tempParams = new Route(placeholder.path).match(path)
      if (!tempParams) {
        continue
      }

      score = getScore(placeholder.path)
      if (highScore > score) {
        continue
      }

      highScore = score
      routeName = name
      params = tempParams
    }
  }
  return {params, routeName}
}

export function fetchRoute (routeName, hash, onload) {
  // Check if route bundle is already loaded in page
  if (document.getElementById(routeName) && document.getElementById(`${routeName}CSS`)) {
    return false
  }

  const bundlePath = hash
    ? `/assets/${routeName}.js?hash=${hash}`
    : `/assets/${routeName}.js`
  const cssPath = hash
    ? `/assets/${routeName}.css?hash=${hash}`
    : `/assets/${routeName}.css`

  const link = document.createElement('link')
  link.href = cssPath
  link.id = `${routeName}CSS`
  link.type = 'text/css'
  link.rel = 'stylesheet'
  document.head.appendChild(link)

  const script = document.createElement('script')
  script.src = bundlePath
  script.id = routeName
  script.onload = onload
  return document.head.appendChild(script)
}

export function changeRoute (location, action, store) {
  const {params, routeName} = resolveRoute(location.pathname, store)
  const {hash} = store.getState().context
  if (!params) {
    throw new Error('No routes matched the requested path')
  }
  const fullLocation = location.pathname + location.search
  const onload = () => updateStoreForRoute(store, routeName, params, fullLocation, action)
  const isForwardAction = action === 'PUSH' || action === 'REPLACE'
  const isBundleLoaded = fetchRoute(routeName, hash, onload)
  const isBackAction = action === 'POP'
  if ((isForwardAction && !isBundleLoaded) || isBackAction) {
    onload()
  }
}

export function prefetchRoute (routeName, onload = noop) {
  if (canUseDOM) {
    fetchRoute(routeName, window.render.context.hash, onload) || onload()
  }
}

if (canUseDOM) {
  global.browserHistory = createHistory()
  global.browserHistory.listen((location, action) => changeRoute(location, action))
}
